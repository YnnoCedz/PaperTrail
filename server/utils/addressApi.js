// server/utils/addressApi.js
import { pool } from '../config/db.js';
import { sha256 } from './hash.js';

/** Cache user table columns so we can include only existing ones. */
let _userCols = null;
export async function getUserColumns() {
  if (_userCols) return _userCols;
  const [rows] = await pool.execute(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
  `);
  _userCols = new Set(rows.map((r) => r.COLUMN_NAME));
  return _userCols;
}

/**
 * Build a safe SELECT list for address-related fields.
 * If a column doesn't exist, we still return it as NULL to keep the response stable.
 */
export async function buildAddressSelectList() {
  const cols = await getUserColumns();
  const maybe = (col) => (cols.has(col) ? `u.${col}` : `NULL AS ${col}`);

  return [
    'u.id',
    'u.username',
    'u.email',
    'u.phone',
    'u.first_name',
    'u.middle_name',
    'u.last_name',
    maybe('street'),
    maybe('barangay'),
    maybe('city'),
    maybe('province'),
    'u.role_id',
    'r.name AS role_name',
    'u.created_at',
    'u.updated_at',
  ].join(', ');
}

/** Fetch a user row with role_name and address fields safely included. */
export async function fetchUserById(id) {
  const selectList = await buildAddressSelectList();
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
  return rows[0] || null;
}

/** Build SET clause from an allow-list; empty string -> NULL. */
export function getEditableEntries(body, allowSet) {
  const entries = Object.entries(body || {}).filter(([k]) => allowSet.has(k));
  const params = entries.map(([, v]) => (v === '' ? null : v));
  const setSql = entries.map(([k]) => `${k} = ?`).join(', ');
  return { entries, params, setSql };
}

/** Update user and return fresh row. */
export async function updateUserAndReturn(id, setSql, params) {
  params.push(id);
  await pool.execute(`UPDATE users SET ${setSql}, updated_at = NOW() WHERE id = ?`, params);
  return fetchUserById(id);
}

/** Change password after verifying current password. */
export async function changePassword(id, current_password, new_password) {
  const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [id]);
  const row = rows[0];
  if (!row) return { ok: false, code: 404, message: 'Not found' };
  if (row.password_hash !== sha256(current_password)) {
    return { ok: false, code: 400, message: 'Current password is incorrect.' };
  }
  await pool.execute('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [
    sha256(new_password),
    id,
  ]);
  return { ok: true };
}

/**
 * Compute editable fields based on what exists in the schema (ETS).
 * We return a Set that includes address columns only if present.
 */
export async function getEditableFieldsForETS() {
  const cols = await getUserColumns();
  const base = ['email', 'first_name', 'last_name', 'middle_name', 'phone'];
  if (cols.has('street')) base.push('street');
  if (cols.has('barangay')) base.push('barangay');
  if (cols.has('city')) base.push('city');
  if (cols.has('province')) base.push('province');
  return new Set(base.sort((a, b) => a.localeCompare(b)));
}

/**
 * Compute editable fields for RDS (mirrors ETS allowlist so the UI can edit address too).
 * If your RDS should be more restrictive, trim this list here.
 */
export async function getEditableFieldsForRDS() {
  const cols = await getUserColumns();
  const base = ['email', 'first_name', 'last_name', 'middle_name', 'phone'];
  if (cols.has('street')) base.push('street');
  if (cols.has('barangay')) base.push('barangay');
  if (cols.has('city')) base.push('city');
  if (cols.has('province')) base.push('province');
  return new Set(base.sort((a, b) => a.localeCompare(b)));
}
