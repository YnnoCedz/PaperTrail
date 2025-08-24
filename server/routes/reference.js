// server/routes/reference.js
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Reusable name sort (case-insensitive)
const byName = (a, b) =>
  String(a?.name || '').localeCompare(String(b?.name || ''), 'en', { sensitivity: 'base' });

/** Provinces -> [{ code, name }] */
router.get('/ref/provinces', async (_req, res) => {
  try {
    const r = await fetch('https://psgc.gitlab.io/api/provinces');
    const data = await r.json();
    const out = (Array.isArray(data) ? data : [])
      .map(p => ({ code: p.code, name: p.name }))
      .sort(byName);
    res.json(out);
  } catch (e) {
    console.error('ref/provinces error:', e);
    res.status(500).json([]);
  }
});

/** Cities/Municipalities by province_code -> [{ code, name }] */
router.get('/ref/cities', async (req, res) => {
  const { province_code } = req.query;
  if (!province_code) return res.status(400).json([]);
  try {
    const r = await fetch(
      `https://psgc.gitlab.io/api/provinces/${encodeURIComponent(province_code)}/municipalities`
    );
    const data = await r.json();
    const out = (Array.isArray(data) ? data : [])
      .map(c => ({ code: c.code, name: c.name }))
      .sort(byName);
    res.json(out);
  } catch (e) {
    console.error('ref/cities error:', e);
    res.status(500).json([]);
  }
});

/** Barangays by city_code (municipality code) -> [{ code, name }] */
router.get('/ref/barangays', async (req, res) => {
  const { city_code } = req.query;
  if (!city_code) return res.status(400).json([]);
  try {
    const r = await fetch(
      `https://psgc.gitlab.io/api/municipalities/${encodeURIComponent(city_code)}/barangays`
    );
    const data = await r.json();
    const out = (Array.isArray(data) ? data : [])
      .map(b => ({ code: b.code, name: b.name }))
      .sort(byName);
    res.json(out);
  } catch (e) {
    console.error('ref/barangays error:', e);
    res.status(500).json([]);
  }
});

export default router;
