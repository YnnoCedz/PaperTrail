// src/pages/admin/AdminActivityLogs.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchActivityLogs } from '../../api/activityLogs.js';

const fmtDateTime = (iso) => {
  if (!iso) return '';
  // Expecting MySQL DATETIME string; display as local
  const d = new Date(iso.replace(' ', 'T'));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const AdminActivityLogs = () => {
  // filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // data
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // visible columns for "print selection"
  const [cols, setCols] = useState({
    timestamp: true,
    user: true,
    action: true,
    ip: false,
    user_agent: false,
    meta: false
  });

  const printRef = useRef(null);
  const token = localStorage.getItem('token') || '';

  const headers = useMemo(() => ({
    Authorization: token ? `Bearer ${token}` : undefined
  }), [token]);

  const loadLogs = async () => {
    setLoading(true);
    setErr('');
    try {
      const { data, total: t } = await fetchActivityLogs({
        token,
        search,
        dateFrom,
        dateTo,
        page,
        limit
      });
      setLogs(data || []);
      setTotal(t || 0);
    } catch (e) {
      setErr(e.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  // initial + when filters change
  useEffect(() => { loadLogs(); /* eslint-disable-next-line */ }, [page, limit]);
  // debounce search / date filters
  useEffect(() => {
    const id = setTimeout(() => { setPage(1); loadLogs(); }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line
  }, [search, dateFrom, dateTo]);

  const toggleCol = (key) => setCols(prev => ({ ...prev, [key]: !prev[key] }));

  const handlePrint = () => {
    // Build a minimal HTML document with current visible columns and rows
    const visibleCols = Object.entries(cols).filter(([, v]) => v).map(([k]) => k);
    if (visibleCols.length === 0) {
      alert('Please select at least one column to print.');
      return;
    }

    const colLabels = {
      timestamp: 'Timestamp',
      user: 'User',
      action: 'Activity',
      ip: 'IP',
      user_agent: 'User Agent',
      meta: 'Meta'
    };

    const rowsHtml = logs.map(row => {
      const tds = visibleCols.map(colKey => {
        let val = '';
        switch (colKey) {
          case 'timestamp': val = fmtDateTime(row.created_at); break;
          case 'user': val = row.username ?? ''; break;
          case 'action': val = row.action ?? ''; break;
          case 'ip': val = row.ip ?? ''; break;
          case 'user_agent': val = row.user_agent ?? ''; break;
          case 'meta': val = row.meta ? JSON.stringify(row.meta) : ''; break;
          default: val = '';
        }
        return `<td style="padding:6px 10px;border:1px solid #ddd;">${escapeHtml(String(val))}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    const theadHtml = `<tr>${
      visibleCols.map(k => `<th style="text-align:left;padding:8px 10px;border:1px solid #bbb;background:#f6f6f6;">${colLabels[k]}</th>`).join('')
    }</tr>`;

    const doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Activity Logs</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#222; }
    h2 { margin: 0 0 12px; }
    .meta { margin-bottom: 10px; color:#555; font-size: 12px; }
    table { border-collapse: collapse; width: 100%; }
    @media print {
      @page { margin: 16mm; }
    }
  </style>
</head>
<body>
  <h2>Activity Logs</h2>
  <div class="meta">
    Printed: ${new Date().toLocaleString()} • Showing page ${page} (limit ${limit})
    ${search ? `• Search: "${escapeHtml(search)}"` : '' }
    ${dateFrom ? `• From: ${escapeHtml(dateFrom)}` : '' }
    ${dateTo ? `• To: ${escapeHtml(dateTo)}` : '' }
  </div>
  <table>
    <thead>${theadHtml}</thead>
    <tbody>${rowsHtml || '<tr><td style="padding:8px 10px" colspan="'+visibleCols.length+'">No rows</td></tr>'}</tbody>
  </table>
</body>
</html>`;

    const w = window.open('', 'print');
    if (!w) {
      alert('Popup blocked. Please allow popups for printing.');
      return;
    }
    w.document.open();
    w.document.write(doc);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Activity Logs</h1>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto auto', gap: 8, marginBottom: '0.75rem' }}>
        <input
          type="text"
          placeholder="Search (user, action, IP, UA, meta)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <select value={limit} onChange={e => { setPage(1); setLimit(parseInt(e.target.value, 10)); }}>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
        <button onClick={handlePrint} className="secondary">Print</button>
      </div>

      {/* Column selection */}
      <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom: '0.5rem', flexWrap:'wrap' }}>
        <strong>Columns:</strong>
        {Object.entries(cols).map(([k, v]) => (
          <label key={k} style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <input type="checkbox" checked={v} onChange={() => toggleCol(k)} />
            {k === 'timestamp' ? 'Timestamp'
              : k === 'user' ? 'User'
              : k === 'action' ? 'Activity'
              : k === 'ip' ? 'IP'
              : k === 'user_agent' ? 'User Agent'
              : 'Meta'}
          </label>
        ))}
      </div>

      {err && <div className="error-banner" style={{ marginBottom: 8 }}>{err}</div>}

      <div ref={printRef}>
        <table className="logs-table">
          <thead>
            <tr>
              {cols.timestamp && <th>Timestamp</th>}
              {cols.user && <th>User</th>}
              {cols.action && <th>Activity</th>}
              {cols.ip && <th>IP</th>}
              {cols.user_agent && <th>User Agent</th>}
              {cols.meta && <th>Meta</th>}
            </tr>
          </thead>
          <tbody>
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={Object.values(cols).filter(Boolean).length || 1}>No logs found.</td>
              </tr>
            )}
            {loading ? (
              <tr><td colSpan={6}>Loading…</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id}>
                {cols.timestamp && <td>{fmtDateTime(log.created_at)}</td>}
                {cols.user && <td>{log.username}</td>}
                {cols.action && <td>{log.action}</td>}
                {cols.ip && <td>{log.ip}</td>}
                {cols.user_agent && <td style={{ maxWidth: 360, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{log.user_agent}</td>}
                {cols.meta && <td style={{ maxWidth: 360, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{log.meta ? JSON.stringify(log.meta) : ''}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ marginTop: 12, display:'flex', alignItems:'center', gap:12 }}>
        <small>Page {page} • Total {total}</small>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Prev</button>
          <button disabled={page * limit >= total || loading} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

// Escape for print HTML
function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default AdminActivityLogs;
