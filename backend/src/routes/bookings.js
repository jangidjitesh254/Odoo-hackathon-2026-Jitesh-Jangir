import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/bookings
 * @desc Quick Action: Book a shared resource (Room/Vehicle/Equipment) with overlap validation
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { asset_id, start_time, end_time } = req.body;

    if (!asset_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Asset ID, start time, and end time are required' });
    }

    const startDt = new Date(start_time);
    const endDt = new Date(end_time);

    if (startDt >= endDt) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    const db = getDb();

    // 1. Verify asset exists, is bookable, and is not retired/disposed
    const asset = await db.get(
      'SELECT id, name, is_bookable, status FROM assets WHERE id = ?',
      asset_id
    );

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.is_bookable !== 1) {
      return res.status(400).json({ error: 'This asset is not marked as a shared/bookable resource' });
    }

    if (['Retired', 'Disposed', 'Lost'].includes(asset.status)) {
      return res.status(400).json({ error: `Cannot book an asset that is currently ${asset.status}` });
    }

    // 2. Validate booking overlaps
    // An overlap occurs if: start_time < existing.end_time AND end_time > existing.start_time
    const overlappingBooking = await db.get(
      `SELECT b.*, u.name as user_name 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.asset_id = ? 
         AND b.status != 'Cancelled'
         AND datetime(b.start_time) < datetime(?) 
         AND datetime(b.end_time) > datetime(?)
       LIMIT 1`,
      asset_id,
      endDt.toISOString(),
      startDt.toISOString()
    );

    if (overlappingBooking) {
      return res.status(400).json({
        error: 'Overlap validation failed',
        message: `This resource is already booked by ${overlappingBooking.user_name} from ${overlappingBooking.start_time} to ${overlappingBooking.end_time}.`
      });
    }

    // 3. Create the booking
    const result = await db.run(
      `INSERT INTO bookings (asset_id, user_id, start_time, end_time, status) VALUES (?, ?, ?, ?, 'Upcoming')`,
      asset_id,
      req.user.id,
      startDt.toISOString(),
      endDt.toISOString()
    );

    const newBookingId = result.lastID;

    // Log action
    await db.run(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Book Resource', ?)`,
      req.user.id,
      `Booked resource ${asset.name} (ID: ${asset_id}) from ${start_time} to ${end_time}`
    );

    // Send a notification to the user
    await db.run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      req.user.id,
      'Booking Confirmed',
      `Your booking for ${asset.name} has been confirmed for ${start_time} - ${end_time}`,
      'Booking Confirmed'
    );

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: newBookingId,
        asset_id,
        user_id: req.user.id,
        start_time: startDt.toISOString(),
        end_time: endDt.toISOString(),
        status: 'Upcoming'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/bookings
 * @desc Get bookings (e.g. for calendar view)
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { asset_id } = req.query;
    const db = getDb();

    let query = `
      SELECT b.*, a.name as asset_name, a.asset_tag, u.name as user_name 
      FROM bookings b
      JOIN assets a ON b.asset_id = a.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (asset_id) {
      query += ` AND b.asset_id = ?`;
      params.push(asset_id);
    }

    query += ` ORDER BY b.start_time ASC`;

    const bookings = await db.all(query, ...params);
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

export default router;
