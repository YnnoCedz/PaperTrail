// src/api/settings.js

const API_BASE = import.meta.env?.VITE_API_BASE || '';

/** Read the saved session user object (from your login flow). */
export function getLocalUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); }
  catch { return {}; }
}

/** Persist user object back to localStorage (merge-friendly). */
export function setLocalUser(patch = {}) {
  const current = getLocalUser();
  const next = { ...current, ...patch };
  localStorage.setItem('user', JSON.stringify(next));
  return next;
}

/** Read the bearer token saved at login. */
function getToken() {
  return localStorage.getItem('token') || '';
}

/** Build auth headers. */
function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

/** Safe JSON parse for fetch responses. */
async function toJson(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; }
  catch { return {}; }
}

/** Keep only fields we allow to be updated from Settings. */
function pickEditableProfileFields(data = {}) {
  const allowed = ['first_name', 'middle_name', 'last_name', 'email', 'phone'];
  return Object.fromEntries( 
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
}

/** Public helpers for phone formatting/validation. */
export const phone = {
  digitsOnly: (s = '') => s.replace(/\D/g, ''),
  normalize: (s = '') => {
    let d = s.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] !== '0') d = '0' + d;
    if (d.length > 11) d = d.slice(0, 11);
    return d;
  },
  isValid: (s = '') => /^0\d{10}$/.test(s),
};

/**
 * Get current user's profile from the server.
 * If userId is omitted, it uses the id saved in localStorage.user.
 */
export async function getProfile(userId) {
  const id = userId ?? getLocalUser()?.id;
  if (!id) throw new Error('No user id found in session.');

  const res = await fetch(`${API_BASE}/api/users-management/users/${id}`, {
    headers: authHeaders()
  });
  const data = await toJson(res);
  if (!res.ok) throw new Error(data?.message || 'Failed to load profile.');
  return data; // { id, first_name, middle_name, last_name, email, phone, ... }
}

/**
 * Update current user's editable fields.
 * patch = { first_name?, middle_name?, last_name?, email?, phone? }
 * If userId is omitted, it uses the id saved in localStorage.user.
 */
export async function updateProfile(patch, userId) {
  const id = userId ?? getLocalUser()?.id;
  if (!id) throw new Error('No user id found in session.');

  const body = pickEditableProfileFields(patch || {});
  const res = await fetch(`${API_BASE}/api/users-management/users/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body)
  });
  const data = await toJson(res);
  if (!res.ok) throw new Error(data?.message || 'Failed to update profile.');
  return data; // backend returns updated row
}

/**
 * Change password.
 * Requires backend route: PATCH /api/users-management/users/:id/password
 * body: { current_password, new_password }
 */
export async function changePassword({ current_password, new_password }, userId) {
  const id = userId ?? getLocalUser()?.id;
  if (!id) throw new Error('No user id found in session.');

  const res = await fetch(`${API_BASE}/api/users-management/users/${id}/password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ current_password, new_password })
  });
  const data = await toJson(res);
  if (!res.ok) throw new Error(data?.message || 'Failed to change password.');
  return data;
}
