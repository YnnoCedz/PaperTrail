// /server/routes/usersManagement.js
import express from 'express';
import { pool } from '../config/db.js';
import { sha256 } from '../utils/hash.js';

const router = express.Router();

// ----- activity logs (optional) -----
async function log(action, userId, req, meta = null) {
  try {
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, ip, user_agent, meta) VALUES (?,?,?,?,?)',
      [userId ?? null, action, req.ip || null, req.get('user-agent') || null, meta ? JSON.stringify(meta) : null]
    );
  } catch (e) {
    console.error('Log error:', e.message);
  }
}

/**
 * Address schema autodetect + helpers
 * mode: 'single' (address), 'split' (street/barangay/city), 'none'
 */
let addrDetect = { mode: 'unknown' };

async function ensureAddrMode() {
  if (addrDetect.mode !== 'unknown') return addrDetect.mode;

  const [rows] = await pool.execute(wdasdwasdwasdwasdwasdw
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('address','street','barangay','city')`
  );

  const cols = new Set(rows.map(r => r.COLUMN_NAME));
  if (cols.has('address')) {
    addrDetect.mode = 'single';
  } else if (cols.has('street') || cols.has('barangay') || cols.has('city')) {
    addrDetect.mode = 'split';
  } else {
    addrDetect.mode = 'none';
  }
  return addrDetect.mode;
}

function addressSelectExpr(mode) {
  if (mode === 'single') {
    return 'u.address AS address';
  }
  if (mode === 'split') {
    // Build a readable one-line address from split columns, tolerate NULL/empty
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

// ----- roles -----
router.get('/roles', async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name FROM roles WHERE active=1 ORDER BY id');
    res.json(rows);
  } catch (e) {
    console.error('Roles error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----- list users (with pagination + search) -----
router.get('/users', async (req, res) => {
  try {
    const mode = await ensureAddrMode();

    const { search = '', status = 'active', page = 1, limit = 20 } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const n = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (p - 1) * n;

    const where = [];
    const params = [];

    if (status === 'active') where.push('u.active = 1');
    else if (status === 'archived') where.push('u.active = 0');

    if (search) {
      const like = `%${search}%`;
      where.push(`(
        u.username LIKE ? OR
        u.email LIKE ? OR
        u.first_name LIKE ? OR
        u.last_name LIKE ? OR
        r.name LIKE ?
        ${addressSearchExpr(mode) ? ' OR ' + addressSearchExpr(mode) : ''}
      )`);
      // push for username, email, first, last, role
      params.push(like, like, like, like, like);
      // push for address expr if present
      if (addressSearchExpr(mode)) params.push(like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const selectAddress = addressSelectExpr(mode);

    const sql = `
      SELECT
        u.id, u.username, u.email, u.role_id, u.active,
        u.first_name, u.middle_name, u.last_name, u.phone,
        ${selectAddress},
        r.name AS role_name,
        CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name) AS full_name,
        u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      ${whereSql}
      ORDER BY u.created_at DESC
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
    console.error('List users error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----- get user by id -----
router.get('/users/:id', async (req, res) => {
  try {
    const mode = await ensureAddrMode();
    const id = Number(req.params.id);

    const selectAddress = addressSelectExpr(mode);

    const [[u] = []] = await pool.execute(
      `
      SELECT
        u.id, u.username, u.email, u.role_id, u.active,
        u.first_name, u.middle_name, u.last_name, u.phone,
        ${selectAddress},
        r.name AS role_name, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1
      `,
      [id]
    );
    if (!u) return res.status(404).json({ message: 'Not found' });
    res.json(u);
  } catch (e) {
    console.error('Get user error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----- create user -----
router.post('/users', async (req, res) => {
  try {
    const mode = await ensureAddrMode();
    const {
      username, email, password,
      first_name, middle_name = null, last_name,
      phone = null,
      // Accept both shapes:
      address = null,                // single-line
      street = null, barangay = null, city = null, // split
      department_id = null, rank_id = null, role_id
    } = req.body || {};

    if (!username || !email || !password || !first_name || !last_name || !role_id) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const [exists] = await pool.execute(
      'SELECT id FROM users WHERE email=? OR username=? LIMIT 1',
      [email, username]
    );
    if (exists.length) return res.status(409).json({ message: 'Email or username already exists.' });

    const password_hash = sha256(password);
    const now = new Date();

    let sql, vals;

    if (mode === 'single') {
      // Build merged single-line address safely (no ?? with ||)
      let mergedAddress = address;
      if (mergedAddress == null || mergedAddress === '') {
        const parts = [
          street || null,
          barangay ? `Brgy ${barangay}` : null,
          city || null,
        ].filter(Boolean);
        mergedAddress = parts.length ? parts.join(', ') : null;
      }

      sql = `
        INSERT INTO users
          (username,email,password_hash,first_name,middle_name,last_name,phone,
           address,department_id,rank_id,role_id,active,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      vals = [
        username, email, password_hash, first_name, middle_name, last_name, phone,
        mergedAddress, department_id, rank_id, role_id, 1, now, now
      ];
    } else if (mode === 'split') {
      // If only single-line provided, drop it into street
      const s = (street && street !== '') ? street : (address || null);

      sql = `
        INSERT INTO users
          (username,email,password_hash,first_name,middle_name,last_name,phone,
           street,barangay,city,
           department_id,rank_id,role_id,active,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      vals = [
        username, email, password_hash, first_name, middle_name, last_name, phone,
        s, barangay, city,
        department_id, rank_id, role_id, 1, now, now
      ];
    } else {
      // No address columns at all
      sql = `
        INSERT INTO users
          (username,email,password_hash,first_name,middle_name,last_name,phone,
           department_id,rank_id,role_id,active,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      vals = [
        username, email, password_hash, first_name, middle_name, last_name, phone,
        department_id, rank_id, role_id, 1, now, now
      ];
    }

    const [ins] = await pool.execute(sql, vals);
    await log('USER_CREATED', ins.insertId, req, { email, role_id });
    res.status(201).json({ id: ins.insertId });
  } catch (e) {
    console.error('Create user error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----- update user profile (FIRST/MIDDLE/LAST/EMAIL/PHONE) -----
router.patch('/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id.' });

    // Allowed fields only
    const allowed = ['first_name', 'middle_name', 'last_name', 'email', 'phone'];
    const patch = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, k)) {
        patch[k] = req.body[k];
      }
    }
    if (!Object.keys(patch).length) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    // Ensure the row exists
    const [[existing] = []] = await pool.execute(
      'SELECT id, email FROM users WHERE id=? LIMIT 1',
      [id]
    );
    if (!existing) return res.status(404).json({ message: 'Not found' });

    // Email uniqueness (if changing)
    if (patch.email && patch.email !== existing.email) {
      const [dups] = await pool.execute(
        'SELECT id FROM users WHERE email=? AND id<>? LIMIT 1',
        [patch.email, id]
      );
      if (dups.length) return res.status(409).json({ message: 'Email already in use.' });
    }

    // Build dynamic update
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(patch)) {
      sets.push(`${k}=?`);
      vals.push(v === '' ? null : v);
    }
    sets.push('updated_at=NOW()');

    const sql = `UPDATE users SET ${sets.join(', ')} WHERE id=?`;
    vals.push(id);

    await pool.execute(sql, vals);

    await log('PROFILE_UPDATED', id, req, patch);

    // Return the updated row (what frontend expects)
    const mode = await ensureAddrMode();
    const selectAddress = addressSelectExpr(mode);
    const [[row] = []] = await pool.execute(
      `
      SELECT
        u.id, u.username, u.email, u.role_id, u.active,
        u.first_name, u.middle_name, u.last_name, u.phone,
        ${selectAddress},
        u.created_at, u.updated_at
      FROM users u
      WHERE u.id=?
      LIMIT 1
      `,
      [id]
    );

    res.json(row);
  } catch (e) {
    console.error('Update user error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----- change user password -----
router.patch('/users/:id/password', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { current_password, new_password } = req.body || {};

    if (!id) return res.status(400).json({ message: 'Invalid id.' });
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Missing password fields.' });
    }

    const [[u] = []] = await pool.execute(
      'SELECT id, password_hash FROM users WHERE id=? LIMIT 1',
      [id]
    );
    if (!u) return res.status(404).json({ message: 'Not found' });

    const currentHash = sha256(current_password);
    if (currentHash !== u.password_hash) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const newHash = sha256(new_password);
    await pool.execute(
      'UPDATE users SET password_hash=?, updated_at=NOW() WHERE id=?',
      [newHash, id]
    );

    await log('PASSWORD_CHANGED', id, req);

    res.json({ message: 'ok' });
  } catch (e) {
    console.error('Change password error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----- archive / recover -----
router.patch('/users/:id/archive', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [r] = await pool.execute('UPDATE users SET active=0, updated_at=NOW() WHERE id=?', [id]);
    await log('USER_ARCHIVED', id, req);
    res.json({ affected: r.affectedRows });
  } catch (e) {
    console.error('Archive user error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id/recover', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [r] = await pool.execute('UPDATE users SET active=1, updated_at=NOW() WHERE id=?', [id]);
    await log('USER_RECOVERED', id, req);
    res.json({ affected: r.affectedRows });
  } catch (e) {
    console.error('Recover user error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
