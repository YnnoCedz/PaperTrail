// /server/routes/users.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { transporter } from '../utils/mailer.js';
import { authRequired } from '../middleware/auth.js';
import { sha256 } from '../utils/hash.js';

const router = express.Router();
const sign = (payload, exp = '1d') =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: exp });

async function log(action, userId, req, meta = null) {
  try {
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, ip, user_agent, meta) VALUES (?,?,?,?,?)',
      [userId ?? null, action, req.ip || null, req.get('user-agent') || null, meta ? JSON.stringify(meta) : null]
    );
  } catch (e) { console.error('Log error:', e.message); }
}

// POST /api/users/register  (kept generic)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, first_name, middle_name=null, last_name,
            phone=null, address=null, department_id, rank_id=null, role_id } = req.body || {};

    if (!username || !email || !password || !first_name || !last_name || !department_id || !role_id) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const [exists] = await pool.execute('SELECT id FROM users WHERE email=? OR username=? LIMIT 1', [email, username]);
    if (exists.length) return res.status(409).json({ message: 'Email or username already registered.' });

    const password_hash = sha256(password);
    const now = new Date();

    const [ins] = await pool.execute(
      `INSERT INTO users
       (username,email,password_hash,first_name,middle_name,last_name,phone,address,
        department_id,rank_id,role_id,active,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [username,email,password_hash,first_name,middle_name,last_name,phone,address,department_id,rank_id,role_id,1,now,now]
    );

    await log('REGISTER_SUCCESS', ins.insertId, req, { email, role_id });

    try {
      await transporter.sendMail({
        from: `"Thesis RDS System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome!',
        html: `<p>Hello <b>${first_name} ${last_name}</b>, your account was created (role_id=${role_id}).</p>`
      });
    } catch {}

    res.status(201).json({ message: 'Registered' });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) return res.status(400).json({ message: 'Missing credentials.' });

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE (email=? OR username=?) AND active=1 LIMIT 1',
      [identifier, identifier]
    );
    if (!rows.length) {
      await log('LOGIN_FAIL_NOUSER', null, req, { identifier });
      return res.status(401).json({ message: 'User not found or inactive.' });
    }

    const u = rows[0];
    const incoming = sha256(password);

    if (incoming.toLowerCase() !== String(u.password_hash).toLowerCase()) {
      await log('LOGIN_FAIL_BADPWD', u.id, req);
      return res.status(401).json({ message: 'Invalid password.' });
    }

    await log('LOGIN_SUCCESS', u.id, req);

    const token = sign({ id: u.id, role_id: u.role_id, email: u.email });
    res.json({
      message: 'ok',
      token,
      user: { id: u.id, username: u.username, email: u.email, role_id: u.role_id, first_name: u.first_name, last_name: u.last_name }
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, role_id, first_name, last_name, active, created_at, updated_at FROM users WHERE id=? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('ME error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
