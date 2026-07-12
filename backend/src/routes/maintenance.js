import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/maintenance
 * @desc Quick Action: Raise a new Maintenance Request
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { asset_id, description, priority, photo_url } = req.body;

    if (!asset_id || !description) {
      return res.status(400).json({ error: 'Asset ID and description are required' });
    }

    const db = getDb();

    // 1. Verify asset exists and is valid for maintenance
    const asset = await db.get('SELECT id, name, status FROM assets WHERE id = ?', asset_id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (['Retired', 'Disposed'].includes(asset.status)) {
      return res.status(400).json({ error: `Cannot raise maintenance for a ${asset.status} asset` });
    }

    // 2. Insert Maintenance Request (initial status is 'Pending')
    const result = await db.run(
      `INSERT INTO maintenance_requests (asset_id, requested_by, description, priority, status, photo_url) 
       VALUES (?, ?, ?, ?, 'Pending', ?)`,
      asset_id,
      req.user.id,
      description,
      priority || 'Medium',
      photo_url || null
    );

    const newRequestId = result.lastID;

    // Log action
    await db.run(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Raise Maintenance', ?)`,
      req.user.id,
      `Raised maintenance request (ID: ${newRequestId}) for asset ${asset.name} (ID: ${asset_id})`
    );

    // Get asset managers to notify them (optional, but good for completeness)
    const managers = await db.all("SELECT id FROM users WHERE role = 'AssetManager'");
    for (const manager of managers) {
      await db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        manager.id,
        'New Maintenance Request',
        `A new maintenance request has been raised for ${asset.name} by ${req.user.email}`,
        'New Maintenance Request'
      );
    }

    res.status(201).json({
      message: 'Maintenance request raised successfully',
      request: {
        id: newRequestId,
        asset_id,
        requested_by: req.user.id,
        description,
        priority: priority || 'Medium',
        status: 'Pending'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/maintenance
 * @desc Get list of maintenance requests
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, asset_id } = req.query;
    const db = getDb();

    let query = `
      SELECT mr.*, a.name as asset_name, a.asset_tag, u.name as requester_name 
      FROM maintenance_requests mr
      JOIN assets a ON mr.asset_id = a.id
      JOIN users u ON mr.requested_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND mr.status = ?`;
      params.push(status);
    }

    if (asset_id) {
      query += ` AND mr.asset_id = ?`;
      params.push(asset_id);
    }

    query += ` ORDER BY mr.id DESC`;

    const requests = await db.all(query, ...params);
    res.json({ requests });
  } catch (error) {
    next(error);
  }
});

export default router;
