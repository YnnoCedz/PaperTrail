import express from 'express';
import { pool } from '../config/db.js';
import { transporter } from '../utils/mailer.js';
import { sha256 } from '../utils/hash.js';

const router = express.Router();

async function log(action, userId, req, meta = null) {
  try {
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, ip, user_agent, meta) VALUES (?,?,?,?,?)',
      [userId ?? null, action, req.ip || null, req.get('user-agent') || null, meta ? JSON.stringify(meta) : null]
    );
  } catch (e) { console.error('Log error:', e.message); }
}

/** Detect address column shape: 'single' (address) | 'split' (street/barangay/city) | 'none' */
let addrMode = 'unknown';
async function detectAddrMode() {
  if (addrMode !== 'unknown') return addrMode;
  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('address','street','barangay','city')`
  );
  const cols = new Set(rows.map(r => r.COLUMN_NAME));
  addrMode = cols.has('address') ? 'single'
           : (cols.has('street') || cols.has('barangay') || cols.has('city')) ? 'split'
           : 'none';
  return addrMode;
}

/**
 * POST /api/registration
 * required: username,email,password,first_name,last_name,role_id
 * optional: middle_name, phone, address (single) OR street,barangay,city (split), rank_id
 * NOTE: department_id REMOVED from DB and input
 */
router.post('/', async (req, res) => {
  try {
    const mode = await detectAddrMode();

    const {
      username, email, password,
      first_name, middle_name = null, last_name,
      phone = null,
      address = null,              // single-line (if present in schema)
      street = null, barangay = null, city = null, // split
      rank_id = null, role_id,
      // extras that client may send (ignored by DB):
      department_name = null, program_name = null,
      province_code = null, municipality_code = null, barangay_code = null
    } = req.body || {};

    if (!username || !email || !password || !first_name || !last_name || !role_id) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const [exists] = await pool.execute(
      'SELECT id FROM users WHERE email=? OR username=? LIMIT 1',
      [email, username]
    );
    if (exists.length) return res.status(409).json({ message: 'Email or username already registered.' });

    const password_hash = sha256(password);
    const now = new Date();

    let sql, vals;

    if (mode === 'single') {
      // prefer provided single-line; otherwise compose from split parts
      let mergedAddress = address;
      if (mergedAddress == null || mergedAddress === '') {
        const parts = [street || null, barangay ? `Brgy ${barangay}` : null, city || null].filter(Boolean);
        mergedAddress = parts.length ? parts.join(', ') : null;
      }

      sql = `
        INSERT INTO users
          (username,email,password_hash,first_name,middle_name,last_name,phone,
           address,rank_id,role_id,active,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      vals = [
        username, email, password_hash, first_name, middle_name, last_name, phone,
        mergedAddress, rank_id, role_id, 1, now, now
      ];
    } else if (mode === 'split') {
      // if only single-line provided, put it into street by default
      const s = (street && street !== '') ? street : (address || null);
      sql = `
        INSERT INTO users
          (username,email,password_hash,first_name,middle_name,last_name,phone,
          street,barangay,city,
          rank_id,role_id,active,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)   -- 👈 15 placeholders to match 15 columns
      `;
      vals = [
        username, email, password_hash, first_name, middle_name, last_name, phone,
        s, barangay, city,
        rank_id, role_id, 1, now, now
      ];
    } else {
      // no address columns present
      sql = `
        INSERT INTO users
          (username,email,password_hash,first_name,middle_name,last_name,phone,
           rank_id,role_id,active,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      vals = [
        username, email, password_hash, first_name, middle_name, last_name, phone,
        rank_id, role_id, 1, now, now
      ];
    }

    const [ins] = await pool.execute(sql, vals);

    await log('REGISTER_SUCCESS', ins.insertId, req, {
      email, role_id, department_name, program_name, province_code, municipality_code, barangay_code
    });

    try {
      await transporter.sendMail({
        from: `"Thesis RDS System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to PaperTrail',
        html: `<p>Hello <b>${first_name} ${last_name}</b>, your account was created successfully.</p>`
      });
    } catch {}

    return res.status(201).json({ id: ins.insertId, message: 'Registered' });
  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
