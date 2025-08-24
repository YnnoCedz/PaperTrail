// server/routes/ets/etsSettings.js
import express from 'express';
import { pool } from '../../config/db.js';
import {
  changePassword,
  fetchUserById,
  getEditableEntries,
  getEditableFieldsForETS,
} from '../../utils/addressApi.js';

const router = express.Router();

/** GET profile (always includes address keys; null if columns missing). */
router.get('/settings/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const user = await fetchUserById(id);
    if (!user) return res.status(404).json({ message: 'Not found' });

    res.json(user);
  } catch (e) {
    console.error('ETS settings GET error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/** PATCH profile (edits only columns that exist). */
router.patch('/settings/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const EDITABLE_FIELDS = await getEditableFieldsForETS();

    // Optional: unique email check
    if (req.body?.email) {
      const [[dupe] = []] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
        [req.body.email, id]
      );
      if (dupe) return res.status(409).json({ message: 'Email already in use.' });
    }

    const { entries, params, setSql } = getEditableEntries(req.body, EDITABLE_FIELDS);
    if (!entries.length) {
      return res.status(400).json({ message: 'No editable fields in request.' });
    }

    params.push(id);
    await pool.execute(`UPDATE users SET ${setSql}, updated_at = NOW() WHERE id = ?`, params);
    const updated = await fetchUserById(id); // returns address fields safely too
    res.json(updated);
  } catch (e) {
    console.error('ETS settings PATCH error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/** PATCH password */
router.patch('/settings/:id/password', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'current_password and new_password are required.' });
    }

    const result = await changePassword(id, current_password, new_password);
    if (!result.ok) return res.status(result.code).json({ message: result.message });

    res.json({ message: 'Password updated.' });
  } catch (e) {
    console.error('ETS settings PW PATCH error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
