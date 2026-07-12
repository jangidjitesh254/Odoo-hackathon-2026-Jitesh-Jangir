import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/transfers
 * @desc Request an asset transfer (transfers can only be requested for already-taken assets)
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { asset_id, to_user_id, to_department_id, remarks } = req.body;

    if (!asset_id) {
      return res.status(400).json({ error: 'Asset ID is required' });
    }

    if (!to_user_id && !to_department_id) {
      return res.status(400).json({ error: 'Either target User ID or Department ID must be specified for transfer' });
    }

    const db = getDb();

    // 1. Verify asset exists
    const asset = await db.get('SELECT id, name, status FROM assets WHERE id = ?', asset_id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // 2. Validate: Asset must be currently allocated
    const activeAllocation = await db.get(
      `SELECT id, user_id, department_id 
       FROM allocations 
       WHERE asset_id = ? AND status = 'Active' AND returned_date IS NULL
       LIMIT 1`,
      asset_id
    );

    if (!activeAllocation) {
      return res.status(400).json({ 
        error: 'Invalid Request',
        message: 'Cannot request a transfer for an asset that is not currently allocated.' 
      });
    }

    // 3. Create the Transfer Request
    const result = await db.run(
      `INSERT INTO transfers (asset_id, from_user_id, to_user_id, to_department_id, requested_by, status, remarks) 
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      asset_id,
      activeAllocation.user_id || null,
      to_user_id || null,
      to_department_id || null,
      req.user.id,
      remarks || null
    );

    const newTransferId = result.lastID;

    // Log the request
    await db.run(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Request Transfer', ?)`,
      req.user.id,
      `Requested transfer (ID: ${newTransferId}) for asset ${asset.name} (ID: ${asset_id})`
    );

    // Notify Asset Managers
    const managers = await db.all("SELECT id FROM users WHERE role = 'AssetManager'");
    for (const manager of managers) {
      await db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        manager.id,
        'Transfer Requested',
        `A transfer has been requested for asset ${asset.name} to target holder.`,
        'Transfer Requested'
      );
    }

    res.status(201).json({
      message: 'Transfer request raised successfully',
      transfer: {
        id: newTransferId,
        asset_id,
        from_user_id: activeAllocation.user_id,
        to_user_id,
        to_department_id,
        requested_by: req.user.id,
        status: 'Pending'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/transfers/:id/approve
 * @desc Approve a transfer request (restricted to AssetManager or DepartmentHead)
 *       Automatically terminates the current active allocation and creates the new assignment.
 */
router.post('/:id/approve', authenticateToken, requireRole(['AssetManager', 'DepartmentHead']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // 1. Fetch target transfer request
    const transfer = await db.get(
      `SELECT t.*, a.name as asset_name 
       FROM transfers t
       JOIN assets a ON t.asset_id = a.id
       WHERE t.id = ? AND t.status = 'Pending'`,
      id
    );

    if (!transfer) {
      return res.status(404).json({ error: 'Pending transfer request not found' });
    }

    // 2. Fetch the current active allocation for the asset
    const currentAllocation = await db.get(
      `SELECT * FROM allocations 
       WHERE asset_id = ? AND status = 'Active' AND returned_date IS NULL
       LIMIT 1`,
      transfer.asset_id
    );

    // Enforce Department Head scope checks
    if (req.user.role === 'DepartmentHead') {
      if (!currentAllocation) {
        return res.status(400).json({ error: 'Cannot approve transfer for an asset with no active allocation.' });
      }

      // Determine holding department (either direct department allocation, or user's department)
      let holdingDeptId = currentAllocation.department_id;
      if (!holdingDeptId && currentAllocation.user_id) {
        const holderUser = await db.get('SELECT department_id FROM users WHERE id = ?', currentAllocation.user_id);
        holdingDeptId = holderUser ? holderUser.department_id : null;
      }

      if (!holdingDeptId) {
        return res.status(403).json({ error: 'Forbidden', message: 'This asset is not currently associated with any department.' });
      }

      // Verify current user is the head of the holding department
      const dept = await db.get('SELECT head_id FROM departments WHERE id = ?', holdingDeptId);
      if (!dept || dept.head_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden', message: 'You can only approve transfers for assets allocated within your department.' });
      }
    }

    // 3. Update Transfer Status to 'Approved'
    await db.run(
      `UPDATE transfers 
       SET status = 'Approved', approved_by = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      req.user.id,
      id
    );

    // 4. Terminate the old active allocation (Mark Returned)
    if (currentAllocation) {
      const targetHolderName = transfer.to_user_id ? `Employee (ID: ${transfer.to_user_id})` : `Department (ID: ${transfer.to_department_id})`;
      await db.run(
        `UPDATE allocations 
         SET returned_date = NOW(), return_notes = ?, status = 'Returned', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        `Transferred to ${targetHolderName} via Transfer Request #${id}`,
        currentAllocation.id
      );
    }

    // 5. Create the new Active Allocation for the new holder
    const newAllocResult = await db.run(
      `INSERT INTO allocations (asset_id, user_id, department_id, allocated_by, status) 
       VALUES (?, ?, ?, ?, 'Active')`,
      transfer.asset_id,
      transfer.to_user_id || null,
      transfer.to_department_id || null,
      req.user.id
    );

    // 6. Log the audit entry
    const assigneeName = transfer.to_user_id ? `Employee (ID: ${transfer.to_user_id})` : `Department (ID: ${transfer.to_department_id})`;
    await db.run(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Approve Transfer', ?)`,
      req.user.id,
      `Approved transfer (ID: ${id}) of asset ${transfer.asset_name} to ${assigneeName}`
    );

    // 7. Notify former holder (if it was a user)
    if (transfer.from_user_id) {
      await db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        transfer.from_user_id,
        'Transfer Approved',
        `Your asset ${transfer.asset_name} has been transferred to another holder.`,
        'Transfer Approved'
      );
    }

    // Notify new holder (if it is a user)
    if (transfer.to_user_id) {
      await db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        transfer.to_user_id,
        'Asset Assigned',
        `Asset ${transfer.asset_name} has been allocated to you via approved transfer.`,
        'Asset Assigned'
      );
    }

    res.json({
      message: 'Transfer request approved successfully',
      transferId: id,
      newAllocationId: newAllocResult.lastID,
      status: 'Approved'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/transfers
 * @desc Get list of transfers
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.query;
    const db = getDb();

    let query = `
      SELECT t.*, a.name as asset_name, a.asset_tag,
             u_from.name as from_user_name, u_to.name as to_user_name,
             d_to.name as to_department_name, u_req.name as requester_name
      FROM transfers t
      JOIN assets a ON t.asset_id = a.id
      LEFT JOIN users u_from ON t.from_user_id = u_from.id
      LEFT JOIN users u_to ON t.to_user_id = u_to.id
      LEFT JOIN departments d_to ON t.to_department_id = d_to.id
      JOIN users u_req ON t.requested_by = u_req.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY t.id DESC`;

    const transfers = await db.all(query, ...params);
    res.json({ transfers });
  } catch (error) {
    next(error);
  }
});

export default router;
