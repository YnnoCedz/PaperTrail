// /server/routes/passwordReset.js
import express from 'express';
import { pool } from '../config/db.js';
import { transporter } from '../utils/mailer.js';
import { sha256 } from '../utils/hash.js';

const router = express.Router();

async function log(action, userId, req, meta = null) {
  try {
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, ip, user_agent, meta) VALUES (?,?,?,?,?)',
      [
        userId ?? null,
        action,
        req.ip || null,
        req.get('user-agent') || null,
        meta ? JSON.stringify(meta) : null,
      ]
    );
  } catch (e) {
    console.error('Log error:', e.message);
  }
}

// POST /api/users/forgot-password  { email }
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email required.' });

  try {
    const [[u] = []] = await pool.execute(
      'SELECT id, first_name, last_name FROM users WHERE email=? LIMIT 1',
      [email]
    );
    if (!u) return res.json({ message: 'If that email exists, a code has been sent.' });

    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
    const code_hash = sha256(code); // SHA-256
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await pool.execute('DELETE FROM password_reset_codes WHERE user_id=?', [u.id]);
    await pool.execute(
      'INSERT INTO password_reset_codes (user_id, code_hash, expires_at) VALUES (?,?,?)',
      [u.id, code_hash, expires_at]
    );

    await log('RESET_REQUEST', u.id, req);

    try {
      await transporter.sendMail({
        from: `"ThesisFinder" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Password Reset Code',
        html: `<p>Your 4-digit reset code is: <b>${code}</b></p><p>This code expires in 10 minutes.</p>`,
      });
    } catch {}

    return res.json({ message: 'If that email exists, a code has been sent.' });
  } catch (e) {
    console.error('Forgot Password Error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/reset-password  { email, code, newPassword }
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword)
    return res.status(400).json({ message: 'Missing fields.' });

  try {
    const [[u] = []] = await pool.execute(
      'SELECT id FROM users WHERE email=? LIMIT 1',
      [email]
    );
    if (!u) return res.status(400).json({ message: 'Invalid or expired code.' });

    const [[rec] = []] = await pool.execute(
      'SELECT code_hash, expires_at FROM password_reset_codes WHERE user_id=? LIMIT 1',
      [u.id]
    );
    if (!rec || new Date(rec.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }

    if (sha256(code).toLowerCase() !== String(rec.code_hash).toLowerCase()) {
      return res.status(400).json({ message: 'Invalid code.' });
    }

    const newHash = sha256(newPassword);
    await pool.execute('UPDATE users SET password_hash=?, updated_at=NOW() WHERE id=?', [
      newHash,
      u.id,
    ]);
    await pool.execute('DELETE FROM password_reset_codes WHERE user_id=?', [u.id]);

    await log('RESET_SUCCESS', u.id, req);
    return res.json({ message: 'Password updated.' });
  } catch (e) {
    console.error('Reset Password Error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
