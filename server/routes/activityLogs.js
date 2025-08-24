// server/routes/activityLogs.js
import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// GET /api/activity-logs?search=&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      date_from = '',
      date_to = '',
      page = '1',
      limit = '20'
    } = req.query;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const n = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (p - 1) * n;

    const where = [];
    const params = [];

    if (search) {
      const like = `%${search}%`;
      // Search across username, action, ip, user_agent, and meta (cast to char)
      where.push(`(
        u.username LIKE ? OR
        l.action LIKE ? OR
        l.ip LIKE ? OR
        l.user_agent LIKE ? OR
        CAST(l.meta AS CHAR) LIKE ?
      )`);
      params.push(like, like, like, like, like);
    }

    if (date_from) {
      where.push('l.created_at >= ?');
      params.push(`${date_from} 00:00:00`);
    }
    if (date_to) {
      where.push('l.created_at <= ?');
      params.push(`${date_to} 23:59:59`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const dataSql = `
      SELECT
        l.id,
        l.created_at,
        COALESCE(u.username, CONCAT('user#', l.user_id)) AS username,
        l.action,
        l.ip,
        l.user_agent,
        l.meta
      FROM activity_logs l
      LEFT JOIN users u ON u.id = l.user_id
      ${whereSql}
      ORDER BY l.created_at DESC
      LIMIT ${n} OFFSET ${offset}
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM activity_logs l
      LEFT JOIN users u ON u.id = l.user_id
      ${whereSql}
    `;

    const [rows] = await pool.execute(dataSql, params);
    const [cnt] = await pool.execute(countSql, params);

    res.json({
      data: rows,
      total: cnt[0]?.total ?? 0,
      page: p,
      limit: n
    });
  } catch (e) {
    console.error('Activity logs error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
