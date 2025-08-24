// /server/routes/notifications.js
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, message, seen, created_at FROM notifications ORDER BY created_at DESC'
    );
    const unseen = rows.filter((n) => !n.seen).length;
    res.json({ notifications: rows, unseenCount: unseen });
  } catch (err) {
    console.error('❌ Fetch notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/mark-seen
router.put('/mark-seen', async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET seen = 1 WHERE seen = 0');
    res.json({ message: 'All notifications marked as seen' });
  } catch (err) {
    console.error('❌ Failed to mark notifications as seen:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
