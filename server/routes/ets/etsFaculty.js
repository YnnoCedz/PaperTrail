// server/routes/ets/etsFaculty.js
import express from 'express';
import { pool } from '../../config/db.js';

const router = express.Router();

/* -------------------------
   Helpers: schema detection
--------------------------*/
let addrMode = 'unknown';
let userCols = null; // cache of columns in `users`

async function getUserColumns() {
  if (userCols) return userCols;
  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'`
  );
  userCols = new Set(rows.map(r => r.COLUMN_NAME));
  return userCols;
}

async function ensureAddrMode() {
  if (addrMode !== 'unknown') return addrMode;
  const cols = await getUserColumns();
  addrMode = cols.has('address')
    ? 'single'
    : (cols.has('street') || cols.has('barangay') || cols.has('city'))
      ? 'split'
      : 'none';
  return addrMode;
}

function addressSelectExpr(mode) {
  if (mode === 'single') return 'u.address AS address';
  if (mode === 'split') {
    return `
      CONCAT_WS(', ',
        NULLIF(u.street, ''),
        IFNULL(CONCAT('Brgy ', NULLIF(u.barangay,'')), NULL),
        NULLIF(u.city, '')
      ) AS address
    `;
  }
  return 'NULL AS address';
}

function addressSearchExpr(mode) {
  if (mode === 'single') return 'u.address LIKE ?';
  if (mode === 'split') {
    return `
      CONCAT_WS(', ',
        NULLIF(u.street, ''),
        IFNULL(CONCAT('Brgy ', NULLIF(u.barangay,'')), NULL),
        NULLIF(u.city, '')
      ) LIKE ?
    `;
  }
  return null;
}

/* ------------------------------------
   GET /api/ets/faculty
   List active users EXCLUDING admins
   Query: search?, page?, limit?, role_id?
-------------------------------------*/
router.get('/faculty', async (req, res) => {
  try {
    const mode = await ensureAddrMode();
    const cols = await getUserColumns();

    const { search = '', page = 1, limit = 15, role_id } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const n = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const offset = (p - 1) * n;

    const where = [];
    const params = [];

    // active only
    if (cols.has('active')) {
      where.push('u.active = 1');
    }

    // exclude admins by role name
    where.push("(r.name IS NULL OR LOWER(r.name) <> 'admin')");

    if (role_id) {
      where.push('r.id = ?');
      params.push(parseInt(role_id, 10));
    }

    if (search) {
      const like = `%${search}%`;
      const addrExpr = addressSearchExpr(mode);
      where.push(`(
        u.username LIKE ? OR
        u.email LIKE ? OR
        u.first_name LIKE ? OR
        u.last_name LIKE ? OR
        r.name LIKE ?
        ${addrExpr ? ' OR ' + addrExpr : ''}
      )`);
      params.push(like, like, like, like, like);
      if (addrExpr) params.push(like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const addrSelect = addressSelectExpr(mode);

    // conditionally include optional columns to avoid “Unknown column” errors
    const selectRankId = cols.has('rank_id') ? 'u.rank_id' : 'NULL AS rank_id';
    const selectDeptId = cols.has('department_id') ? 'u.department_id' : 'NULL AS department_id';
    const selectPhone   = cols.has('phone') ? 'u.phone' : 'NULL AS phone';
    const selectMiddle  = cols.has('middle_name') ? 'u.middle_name' : 'NULL AS middle_name';

    const sql = `
      SELECT
        u.id, u.username, u.email, ${selectPhone},
        ${selectRankId}, ${selectDeptId},
        u.first_name, ${selectMiddle}, u.last_name,
        CONCAT_WS(' ', u.first_name, ${selectMiddle}, u.last_name) AS full_name,
        ${addrSelect},
        r.id AS role_id, r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      ${whereSql}
      ORDER BY u.last_name ASC, u.first_name ASC
      LIMIT ${n} OFFSET ${offset}
    `;
    const [rows] = await pool.execute(sql, params);

    const [cnt] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        ${whereSql}
      `,
      params
    );

    res.json({ data: rows, page: p, limit: n, total: cnt[0]?.total ?? 0 });
  } catch (e) {
    console.error('ETS faculty list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ------------------------------------
   GET /api/ets/faculty/:id
   Single user profile for View Profile
-------------------------------------*/
router.get('/faculty/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const mode = await ensureAddrMode();
    const cols = await getUserColumns();
    const addrSelect = addressSelectExpr(mode);

    const selectPhone   = cols.has('phone') ? 'u.phone' : 'NULL AS phone';
    const selectMiddle  = cols.has('middle_name') ? 'u.middle_name' : 'NULL AS middle_name';

    const [[user] = []] = await pool.execute(
      `
        SELECT
          u.id, u.username, u.email, ${selectPhone},
          u.first_name, ${selectMiddle}, u.last_name,
          CONCAT_WS(' ', u.first_name, ${selectMiddle}, u.last_name) AS full_name,
          ${addrSelect},
          u.role_id, r.name AS role_name,
          u.created_at, u.updated_at
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!user) return res.status(404).json({ message: 'Not found' });

    res.json(user);
  } catch (e) {
    console.error('ETS faculty item error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
