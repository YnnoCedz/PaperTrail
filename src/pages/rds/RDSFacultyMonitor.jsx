// src/pages/rds/RDSFacultyMonitor.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const ROWS_PER_PAGE = 15;

const RDSFacultyMonitor = () => {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');   // role_id
  const [page, setPage] = useState(1);

  const [roles, setRoles] = useState([]);             // [{id,name}]
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const navigate = useNavigate();

  const headers = useMemo(() => {
    const token = localStorage.getItem('token') || '';
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  // Load roles (exclude admin)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users-management/roles`, { headers });
        const data = await res.json();
        if (!mounted) return;
        const filtered = (Array.isArray(data) ? data : []).filter(r => String(r.name).toLowerCase() !== 'admin');
        setRoles(filtered);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false; };
  }, [API_BASE, headers]);

  // Load faculty list
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(ROWS_PER_PAGE),
        });
        if (query) params.set('search', query);
        if (roleFilter) params.set('role_id', String(roleFilter));

        const res = await fetch(`${API_BASE}/api/rds/faculty?${params}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load list');

        if (!mounted) return;
        setRows(data.data || []);
        setTotal(Number(data.total || 0));
      } catch (e) {
        if (!mounted) return;
        setErr(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [API_BASE, headers, page, query, roleFilter]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [query, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">RDS Faculty Monitor</h1>
      <p className="overview">View all active users (non-admin) with their roles.</p>

      {/* Filters */}
      <div className="table-controls" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search name, email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {err && <div className="error-banner" style={{ marginBottom: 12 }}>{err}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {/* Table */}
          <table className="logs-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Address</th>
                <th style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No results found.</td></tr>
              ) : rows.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name || `${u.first_name} ${u.last_name}`}</td>
                  <td>{u.email}</td>
                  <td>{u.role_name || u.role_id}</td>
                  <td>{u.phone || '—'}</td>
                  <td>{u.address || '—'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => navigate(`/rds/faculty/${u.id}`)}>View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination right">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RDSFacultyMonitor;
