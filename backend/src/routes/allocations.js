import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/allocations
 * @desc Create a new asset allocation (restricted to managers and admins)
 */
router.post('/', authenticateToken, requireRole(['AssetManager', 'Admin']), async (req, res, next) => {
  try {
    const { asset_id, user_id, department_id, expected_return_date } = req.body;

    if (!asset_id) {
      return res.status(400).json({ error: 'Asset ID is required' });
    }

    if (!user_id && !department_id) {
      return res.status(400).json({ error: 'Either User ID or Department ID must be specified for allocation' });
    }

    const db = getDb();

    // 1. Verify asset exists and is valid
    const asset = await db.get('SELECT id, name, status FROM assets WHERE id = ?', asset_id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (['Retired', 'Disposed'].includes(asset.status)) {
      return res.status(400).json({ error: `Cannot allocate an asset that is ${asset.status}` });
    }

    // 2. Conflict Rule Check: check for active allocation
    const activeAllocation = await db.get(
      `SELECT al.*, u.name as user_name, d.name as department_name 
       FROM allocations al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN departments d ON al.department_id = d.id
       WHERE al.asset_id = ? AND al.status = 'Active' AND al.returned_date IS NULL
       LIMIT 1`,
      asset_id
    );

    if (activeAllocation) {
      const holderName = activeAllocation.user_name || activeAllocation.department_name || 'another department';
      return res.status(400).json({
        error: 'Conflict',
        message: `Conflict: This asset is currently held by ${holderName}.`,
        holder: {
          id: activeAllocation.user_id || activeAllocation.department_id,
          name: holderName,
          type: activeAllocation.user_id ? 'user' : 'department'
        }
      });
    }

    // 3. Verify user / department exists
    if (user_id) {
      const targetUser = await db.get('SELECT id, name, status FROM users WHERE id = ?', user_id);
      if (!targetUser) {
        return res.status(400).json({ error: 'Target Employee user not found' });
      }
      if (targetUser.status !== 'Active') {
        return res.status(400).json({ error: 'Target Employee is inactive' });
      }
    }

    if (department_id) {
      const dept = await db.get('SELECT id, name FROM departments WHERE id = ?', department_id);
      if (!dept) {
        return res.status(400).json({ error: 'Target Department not found' });
      }
    }

    // 4. Create the Allocation
    const expectedDt = expected_return_date ? new Date(expected_return_date).toISOString() : null;
    const result = await db.run(
      `INSERT INTO allocations (asset_id, user_id, department_id, allocated_by, expected_return_date, status) 
       VALUES (?, ?, ?, ?, ?, 'Active')`,
      asset_id,
      user_id || null,
      department_id || null,
      req.user.id,
      expectedDt
    );

    const newAllocId = result.lastID;

    // 5. Update Asset Status to 'Allocated'
    await db.run("UPDATE assets SET status = 'Allocated' WHERE id = ?", asset_id);

    // 6. Log the action
    const allocationTargetName = user_id ? `Employee (ID: ${user_id})` : `Department (ID: ${department_id})`;
    await db.run(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Allocate Asset', ?)`,
      req.user.id,
      `Allocated asset ${asset.name} (ID: ${asset_id}) to ${allocationTargetName}`
    );

    // 7. Send notification
    const notifyUserId = user_id || req.user.id; // Notify target user, or the manager
    await db.run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      notifyUserId,
      'Asset Assigned',
      `Asset ${asset.name} has been allocated to you. Expected return: ${expected_return_date || 'N/A'}`,
      'Asset Assigned'
    );

    res.status(201).json({
      message: 'Asset allocated successfully',
      allocation: {
        id: newAllocId,
        asset_id,
        user_id,
        department_id,
        allocated_by: req.user.id,
        expected_return_date: expectedDt,
        status: 'Active'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/allocations/:id/return
 * @desc Return an allocated asset (mark returned, capture condition notes, set asset to Available)
 */
router.post('/:id/return', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { return_notes, condition } = req.body;

    const db = getDb();

    // 1. Find the allocation
    const allocation = await db.get(
      `SELECT al.*, a.name as asset_name 
       FROM allocations al
       JOIN assets a ON al.asset_id = a.id
       WHERE al.id = ? AND al.status = 'Active' AND al.returned_date IS NULL`,
      id
    );

    if (!allocation) {
      return res.status(404).json({ error: 'Active allocation record not found' });
    }

    // 2. Mark allocation as returned
    await db.run(
      `UPDATE allocations 
       SET returned_date = NOW(), return_notes = ?, status = 'Returned', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      return_notes || 'Marked returned',
      id
    );

    // 3. Update asset status to 'Available' and update its condition
    await db.run(
      `UPDATE assets 
       SET status = 'Available', condition = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      condition || 'Good',
      allocation.asset_id
    );

    // 4. Log the action
    await db.run(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Return Asset', ?)`,
      req.user.id,
      `Returned asset ${allocation.asset_name} (ID: ${allocation.asset_id}) - Check-in condition: ${condition || 'Good'}`
    );

    // 5. Send notification to the user who held it (if it was allocated to a user)
    if (allocation.user_id) {
      await db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        allocation.user_id,
        'Asset Returned',
        `Asset ${allocation.asset_name} return has been processed. Condition check-in notes: ${return_notes || 'None'}`,
        'Asset Returned'
      );
    }

    res.json({
      message: 'Asset returned successfully',
      allocationId: id,
      assetId: allocation.asset_id,
      status: 'Available'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
