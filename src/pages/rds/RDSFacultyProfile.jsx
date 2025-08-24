// src/pages/rds/RDSFacultyProfile.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const Badge = ({ children }) => (
  <span className="status-badge" style={{ background: '#e5e7eb', color: '#111' }}>{children}</span>
);

const Avatar = ({ name }) => {
  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = String(name).split(' ').filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase();
  }, [name]);

  return (
    <div
      style={{
        width: 72, height: 72, borderRadius: '50%',
        background: '#1e3a8a', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 24
      }}
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee' }}>
    <div style={{ color: '#374151', fontWeight: 600 }}>{label}</div>
    <div>{value ?? <span style={{ color: '#888' }}>None</span>}</div>
  </div>
);

const Section = ({ title, children }) => (
  <section style={{ background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
    <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>{title}</h3>
    {children}
  </section>
);

/** Format date like "July 10 2025" (no time). Handles "YYYY-MM-DD[ HH:mm:ss]" safely. */
function formatLongDate(input) {
  if (!input) return null;
  const s = String(input);
  // Try to extract Y-M-D to avoid timezone/off-by-one issues
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  let date;
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
    date = new Date(Date.UTC(y, mo, d));
  } else {
    const tmp = new Date(s);
    if (isNaN(tmp)) return null;
    date = tmp;
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  }).formatToParts(date);
  const month = parts.find(p => p.type === 'month')?.value ?? '';
  const day = parts.find(p => p.type === 'day')?.value ?? '';
  const year = parts.find(p => p.type === 'year')?.value ?? '';
  return month && day && year ? `${month} ${day} ${year}` : null;
}

const RDSFacultyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [user, setUser] = useState(null);

  const headers = useMemo(() => {
    const token = localStorage.getItem('token') || '';
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await fetch(`${API_BASE}/api/rds/faculty/${id}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load profile');
        if (!mounted) return;
        setUser(data);
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, headers]);

  const fullName =
    user?.full_name ||
    [user?.first_name, user?.middle_name, user?.last_name].filter(Boolean).join(' ') ||
    'None';

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 12 }}>RDS Faculty Profile</h1>
        <div>
          <button className="secondary" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {loading ? (
        <Section title="Loading"><p>Loading…</p></Section>
      ) : err ? (
        <Section title="Error"><p className="error-banner">{err}</p></Section>
      ) : !user ? (
        <Section title="Not Found"><p>User not found.</p></Section>
      ) : (
        <>
          {/* Header Card */}
          <section
            style={{
              background: 'white', border: '1px solid #ddd', borderRadius: 8,
              padding: 16, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center'
            }}
          >
            <Avatar name={fullName} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0 }}>{fullName}</h2>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge>{user.rank_id ?? 'None'}</Badge>
                <Badge>{user.role_name ?? 'None'}</Badge>
                <Badge>{user.department_id ?? 'None'}</Badge>
              </div>
            </div>
          </section>

          {/* Contact Details */}
          <Section title="Contact Information">
            <Row label="Email" value={user.email || 'None'} />
            <Row label="Phone" value={user.phone || 'None'} />
            <Row label="Address" value={user.address || 'None'} />
          </Section>

          {/* Academic Details */}
          <Section title="Academic Information">
            <Row label="Rank (ID)" value={user.rank_id ?? 'None'} />
            <Row label="Role" value={user.role_name ?? 'None'} />
            <Row label="Department (ID)" value={user.department_id ?? 'None'} />
            <Row label="Username" value={user.username || 'None'} />
            <Row label="Last Updated" value={formatLongDate(user.updated_at) || 'None'} />
            <Row label="Created At" value={formatLongDate(user.created_at) || 'None'} />
          </Section>
        </>
      )}
    </div>
  );
};

export default RDSFacultyProfile;
