import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

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

/**
 * @route POST /api/maintenance/:id/review
 * @desc Approve or Reject a maintenance request (AssetManager only)
 *       On approval, transitions the asset's status to 'Under Maintenance'.
 */
router.post('/:id/review', authenticateToken, requireRole(['AssetManager']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejection_remarks } = req.body; // status must be 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected' });
    }

    const db = getDb();

    const request = await db.get(
      'SELECT mr.*, a.name as asset_name FROM maintenance_requests mr JOIN assets a ON mr.asset_id = a.id WHERE mr.id = ?',
      id
    );

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot review a request that is already ${request.status}` });
    }

    // Update request status
    await db.run(
      `UPDATE maintenance_requests 
       SET status = ?, resolution_notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      status,
      rejection_remarks || null,
      id
    );

    // If approved, transition asset status to 'Under Maintenance'
    if (status === 'Approved') {
      await db.run("UPDATE assets SET status = 'Under Maintenance', updated_at = CURRENT_TIMESTAMP WHERE id = ?", request.asset_id);
    }

    // Log action
    await db.run(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Review Maintenance', ?)`,
      req.user.id,
      `Reviewed maintenance request (ID: ${id}) for asset ${request.asset_name} - Result: ${status}`
    );

    // Notify requester
    await db.run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      request.requested_by,
      `Maintenance ${status}`,
      `Your maintenance request for ${request.asset_name} has been ${status.toLowerCase()}. Remarks: ${rejection_remarks || 'None'}`,
      `Maintenance ${status}`
    );

    res.json({
      message: `Maintenance request ${status.toLowerCase()} successfully`,
      requestId: id,
      status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/maintenance/:id/assign
 * @desc Assign a technician to an approved request (AssetManager only)
 */
router.post('/:id/assign', authenticateToken, requireRole(['AssetManager']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigned_technician_id } = req.body;

    if (!assigned_technician_id) {
      return res.status(400).json({ error: 'Assigned technician user ID is required' });
    }

    const db = getDb();

    // Verify request
    const request = await db.get(
      'SELECT mr.*, a.name as asset_name FROM maintenance_requests mr JOIN assets a ON mr.asset_id = a.id WHERE mr.id = ?',
      id
    );

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    if (request.status !== 'Approved') {
      return res.status(400).json({ error: 'Can only assign a technician to an Approved request' });
    }

    // Verify technician user exists
    const techUser = await db.get('SELECT id, name FROM users WHERE id = ?', assigned_technician_id);
    if (!techUser) {
      return res.status(400).json({ error: 'Technician user not found' });
    }

    // Update status
    await db.run(
      `UPDATE maintenance_requests 
       SET status = 'Technician Assigned', assigned_technician_id = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      assigned_technician_id,
      id
    );

    // Log action
    await db.run(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Assign Technician', ?)`,
      req.user.id,
      `Assigned technician ${techUser.name} to maintenance request (ID: ${id})`
    );

    // Notify technician
    await db.run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Maintenance Assigned', ?, 'Maintenance Assigned')`,
      assigned_technician_id,
      `You have been assigned a new maintenance repair request for asset: ${request.asset_name}.`
    );

    res.json({
      message: 'Technician assigned successfully',
      requestId: id,
      assignedTo: techUser.name
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/maintenance/:id/start
 * @desc Move request status to 'In Progress'
 */
router.post('/:id/start', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const request = await db.get('SELECT * FROM maintenance_requests WHERE id = ?', id);
    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    if (!['Approved', 'Technician Assigned'].includes(request.status)) {
      return res.status(400).json({ error: `Cannot start work for request with status: ${request.status}` });
    }

    // Update status to In Progress
    await db.run(
      "UPDATE maintenance_requests SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      id
    );

    res.json({
      message: 'Maintenance request is now in progress',
      requestId: id,
      status: 'In Progress'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/maintenance/:id/resolve
 * @desc Complete the repair work, mark request as 'Resolved', and transition the asset's status back to 'Available'
 */
router.post('/:id/resolve', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution_notes, condition } = req.body;

    const db = getDb();

    const request = await db.get(
      'SELECT mr.*, a.name as asset_name FROM maintenance_requests mr JOIN assets a ON mr.asset_id = a.id WHERE mr.id = ?',
      id
    );

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    if (request.status === 'Resolved') {
      return res.status(400).json({ error: 'Maintenance request is already resolved' });
    }

    // Update request
    await db.run(
      `UPDATE maintenance_requests 
       SET status = 'Resolved', resolved_date = NOW(), resolution_notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      resolution_notes || 'Resolved and verified',
      id
    );

    // Revert asset status to 'Available' and optionally update its condition
    const finalCondition = condition || 'Good';
    await db.run(
      `UPDATE assets 
       SET status = 'Available', condition = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      finalCondition,
      request.asset_id
    );

    // Log action
    await db.run(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Resolve Maintenance', ?)`,
      req.user.id,
      `Resolved maintenance request (ID: ${id}) for asset ${request.asset_name}. Condition: ${finalCondition}`
    );

    // Notify requester
    await db.run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Maintenance Resolved', ?, 'Maintenance Resolved')`,
      request.requested_by,
      `The maintenance request for ${request.asset_name} has been resolved successfully. Check-in notes: ${resolution_notes || 'None'}`
    );

    res.json({
      message: 'Maintenance request resolved successfully',
      requestId: id,
      assetId: request.asset_id,
      status: 'Resolved'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
