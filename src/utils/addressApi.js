// src/utils/addressApi.js
const API_BASE = import.meta.env.VITE_API_BASE || '';

export const headersAuth = () => {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchWithAuth = async (url) => {
  const res = await fetch(url, { headers: headersAuth() });
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
};

// Sort helper used by selects (case-insensitive)
export const sortByName = (arr = []) =>
  [...arr].sort((a, b) =>
    String(a?.name || '').localeCompare(String(b?.name || ''), 'en', { sensitivity: 'base' })
  );

/** Alphabetical endpoints used by the client */
export const GEO_ENDPOINTS = {
  BARANGAYS: (cityCode) =>
    `${API_BASE}/api/ref/barangays?city_code=${encodeURIComponent(cityCode)}`,
  CITIES: (provinceCode) =>
    `${API_BASE}/api/ref/cities?province_code=${encodeURIComponent(provinceCode)}`,
  PROVINCES: `${API_BASE}/api/ref/provinces`,
};
