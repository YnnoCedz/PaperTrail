// server/routes/user/profile.js
import express from 'express';
import { pool } from '../../config/db.js';
import { getUserColumns } from '../../utils/addressApi.js';

const router = express.Router();

/** Build a safe SELECT (handles optional columns + reserved words) */
async function buildSelectList() {
  const cols = await getUserColumns();
  const have = (col) => cols.has(col);

  const maybe = (col, alias = null) => {
    if (!have(col)) return `NULL AS ${alias || col}`;
    if (col === 'rank') return 'u.`rank` AS ' + (alias || 'rank_title'); // reserved word safety
    return `u.${col}${alias ? ` AS ${alias}` : ''}`;
  };

  // biography may exist as 'biography' or 'bio'
  const biographySelect = have('biography')
    ? 'u.biography AS biography'
    : (have('bio') ? 'u.bio AS biography' : 'NULL AS biography');

  // optional program
  const programSelect = maybe('program', 'program');

  // Build address safely (never reference missing columns)
  const addrParts = [
    have('street')   ? 'u.street'   : 'NULL',
    have('barangay') ? 'u.barangay' : 'NULL',
    have('city')     ? 'u.city'     : 'NULL',
    have('province') ? 'u.province' : 'NULL', // your schema doesn't have this; we pass NULL
  ].join(', ');

  return [
    'u.id',
    "CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name) AS name",
    'u.email',
    'u.phone',
    maybe('department', 'department'),
    programSelect,
    maybe('rank', 'rank_title'),
    biographySelect,
    'u.role_id',
    'r.name AS role',
    // individual address fields (will be NULL if column missing)
    maybe('street'),
    maybe('barangay'),
    maybe('city'),
    maybe('province'),
    // full address built only from existing columns / NULLs
    `CONCAT_WS(', ', ${addrParts}) AS address`,
    'u.created_at',
    'u.updated_at',
  ].join(', ');
}

/** GET /api/user/profile/:id — single profile */
router.get('/profile/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const selectList = await buildSelectList();
    const [rows] = await pool.execute(
      `
      SELECT ${selectList}
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows || !rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('user/profile GET error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/** Core update handler used by PUT/PATCH */
async function updateProfileHandler(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const cols = await getUserColumns();
    const have = (c) => cols.has(c);

    const bioCol = have('biography') ? 'biography' : (have('bio') ? 'bio' : null);

    // Allow only existing columns (plus name/email/phone)
    const ALLOW = new Set([
      'first_name',
      'middle_name',
      'last_name',
      'email',
      'phone',
      ...(have('department') ? ['department'] : []),
      ...(have('program') ? ['program'] : []),
      ...(have('street') ? ['street'] : []),
      ...(have('barangay') ? ['barangay'] : []),
      ...(have('city') ? ['city'] : []),
      ...(have('province') ? ['province'] : []),
      ...(bioCol ? [bioCol] : []),
    ]);

    const payload = { ...(req.body || {}) };

    // Map "biography" -> actual DB column if needed
    if (bioCol && typeof payload.biography === 'string' && bioCol !== 'biography') {
      payload[bioCol] = payload.biography;
    }

    // Trim strings
    for (const k of Object.keys(payload)) {
      if (typeof payload[k] === 'string') payload[k] = payload[k].trim();
    }

    // Phone: digits only, up to 11
    if (typeof payload.phone === 'string' && payload.phone !== '') {
      if (!/^\d{1,11}$/.test(payload.phone)) {
        return res.status(400).json({ message: 'Phone must be numeric digits only, max 11.' });
      }
    }

    // Unique email check
    if (typeof payload.email === 'string' && payload.email) {
      const [[dupe] = []] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
        [payload.email, id]
      );
      if (dupe) return res.status(409).json({ message: 'Email already in use.' });
    }

    const entries = Object.entries(payload).filter(([k]) => ALLOW.has(k));
    if (!entries.length) {
      return res.status(400).json({ message: 'No editable fields in request.' });
    }

    const setSql = entries.map(([k]) => `${k} = ?`).join(', ');
    const params = entries.map(([, v]) => (v === '' ? null : v));
    params.push(id);

    await pool.execute(
      `UPDATE users SET ${setSql}, updated_at = NOW() WHERE id = ?`,
      params
    );

    // Return fresh row
    const selectList = await buildSelectList();
    const [[user] = []] = await pool.execute(
      `
      SELECT ${selectList}
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
    console.error('user/profile UPDATE error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

/** PUT/PATCH — update account + biography + (optional) address/program */
router.put('/profile/:id', updateProfileHandler);
router.patch('/profile/:id', updateProfileHandler);

export default router;
