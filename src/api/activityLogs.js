// src/api/activityLogs.js
const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchActivityLogs({
  token = '',
  search = '',
  dateFrom = '',
  dateTo = '',
  page = 1,
  limit = 20
} = {}) {
  const params = new URLSearchParams({
    search,
    page: String(page),
    limit: String(limit),
  });

  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/activity-logs?${params.toString()}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch logs');
  return data;
}
