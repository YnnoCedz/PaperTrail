// src/pages/ets/ETSFacultyProfile.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFileAlt, FaTimes } from 'react-icons/fa';

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
    <div>{value || <span style={{ color: '#888' }}>—</span>}</div>
  </div>
);

const Section = ({ title, children }) => (
  <section style={{ background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
    <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>{title}</h3>
    {children}
  </section>
);

const ETSFacultyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);

  const [user, setUser] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [loading, setLoading] = useState(true);

  // If you later wire up submissions, keep this state; for now empty list.
  const [submissions] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadErr('');
      try {
        const token = localStorage.getItem('token') || '';
        const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const res = await fetch(`${API_BASE}/api/ets/faculty/${userId}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load profile.');
        if (!mounted) return;
        setUser(data);
      } catch (e) {
        if (!mounted) return;
        setLoadErr(e.message || 'Failed to load profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  // Image preview (kept for future submissions with images)
  const [imagePreview, setImagePreview] = useState(null);
  const isImage = (filename = '') => /\.(png|jpe?g|gif|webp)$/i.test(filename);
  const handleFileClick = (file, title) => {
    const src = `/files/${file}`;
    if (isImage(file)) setImagePreview({ src, title: title || file });
    else window.open(src, '_blank', 'noopener,noreferrer');
  };

  const fullName = user?.full_name || [user?.first_name, user?.middle_name, user?.last_name].filter(Boolean).join(' ');

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 12 }}>Faculty Profile</h1>
        <div>
          <button className="secondary" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {loading ? (
        <Section title="Loading"><p>Loading…</p></Section>
      ) : loadErr ? (
        <Section title="Error"><p className="error-banner">{loadErr}</p></Section>
      ) : !user ? (
        <Section title="Not Found"><p>User not found.</p></Section>
      ) : (
        <>
          {/* Header Card */}
          <section style={{ background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar name={fullName} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0 }}>{fullName || '—'}</h2>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {user.role_name && <Badge>{user.role_name}</Badge>}
              </div>
            </div>
          </section>

          {/* Contact Details */}
          <Section title="Contact Information">
            <Row label="Email" value={user.email} />
            <Row label="Phone" value={user.phone} />
            <Row label="Address" value={user.address} />
          </Section>

          {/* Account / Meta */}
          <Section title="Account Information">
            <Row label="Username" value={user.username} />
            <Row label="Role" value={user.role_name || user.role_id} />
          </Section>

          {/* Submissions (placeholder) */}
          <Section title="Submitted Papers / Reports">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Department</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th style={{ width: 80, textAlign: 'center' }}>File</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 16 }}>No submissions found.</td></tr>
                ) : submissions.map(s => (
                  <tr key={s.id}>
                    <td>{s.title}</td>
                    <td>{s.type}</td>
                    <td>{s.department}</td>
                    <td>{s.submittedAt}</td>
                    <td>
                      <span className={`status-badge ${s.status === 'Reviewed' ? 'status-active' : 'status-archived'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {s.file ? (
                        <button
                          className="no-highlight"
                          title="Open file"
                          onClick={() => handleFileClick(s.file, s.title)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                        >
                          <FaFileAlt size={18} />
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16
          }}
          onClick={() => setImagePreview(null)}
        >
          <div
            style={{
              background: '#111', borderRadius: 8, position: 'relative',
              maxWidth: '90vw', maxHeight: '90vh', padding: 12, display: 'flex', flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImagePreview(null)}
              className="no-highlight"
              title="Close"
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer'
              }}
            >
              <FaTimes size={18} />
            </button>
            <div style={{ color: '#fff', marginBottom: 8 }}>{imagePreview.title}</div>
            <img
              src={imagePreview.src}
              alt={imagePreview.title}
              style={{ maxWidth: '86vw', maxHeight: '80vh', borderRadius: 6, objectFit: 'contain', background: '#000' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ETSFacultyProfile;
