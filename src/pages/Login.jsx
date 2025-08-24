// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import backgroundImage from '../assets/lsu-bg.jpg';
import logoImage from '../assets/logo.png';
import { basePathByRoleId, roleNameById } from '../utils/roles.js';

const API_BASE = import.meta.env.VITE_API_BASE || '';

/* Simple notify modal */
const NotifyModal = ({ open, title, message, onClose }) => {
  if (!open) return null;
  return (
    <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div style={styles.modalContent}>
        <h3 id="modal-title" style={{ marginTop: 0 }}>{title || 'Notice'}</h3>
        {message && <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{message}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 10 }}>
          <button onClick={onClose} autoFocus>OK</button>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👈 new state

  // archived/inactive modal
  const [archivedModal, setArchivedModal] = useState({
    open: false,
    title: 'Account Inactive',
    message:
      'Your account is archived or inactive. Please contact the ICTS / Tech Support office during office hours to regain access.'
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const showArchived = (customMessage) => {
    setArchivedModal({
      open: true,
      title: 'Account Inactive',
      message:
        customMessage ||
        'Your account is archived or inactive. Please contact the ICTS / Tech Support office during office hours to regain access.'
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: form.usernameOrEmail, // username or email
          password: form.password
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = String(data?.message || 'Login failed');
        const looksArchived = /archived|inactive|disabled|deactivated/i.test(msg) || data?.code === 'ACCOUNT_ARCHIVED';
        if (looksArchived) {
          showArchived(msg);
        } else {
          setErr(msg);
        }
        setLoading(false);
        return;
      }

      if (data?.user && Number(data.user.active) === 0) {
        showArchived('Your account exists, but it is currently inactive.\nPlease contact ICTS / Tech Support to reactivate.');
        setLoading(false);
        return;
      }

      const roleId = Number(data.user.role_id);
      const roleName = roleNameById(roleId);
      const base = basePathByRoleId(roleId) || '/';

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userRoleId', String(roleId));
      if (roleName) localStorage.setItem('userRole', roleName);

      navigate(`${base}/dashboard`, { replace: true });
    } catch (_e) {
      setErr('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="login-card">
        <div className="login-left">
          <img src={logoImage} alt="Logo" className="login-logo" />
          <p className="login-subtitle">Research Portal for Faculty</p>
        </div>

        <div className="login-right">
          <h2 className="login-title">Login to PaperTrail</h2>

          {err && <div className="error-banner">{err}</div>}

          <form onSubmit={handleLogin} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="usernameOrEmail">Username or Email</label>
              <input
                type="text"
                id="usernameOrEmail"
                name="usernameOrEmail"
                required
                value={form.usernameOrEmail}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <div className="show-password">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <label htmlFor="showPassword">Show password</label>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading || !form.usernameOrEmail || !form.password}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="forgot-password">
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>
        </div>
      </div>

      <div className="login-footer">
        If you are having problems accessing PaperTrail, please visit the ICTS Office during office hours.
      </div>

      <NotifyModal
        open={archivedModal.open}
        title={archivedModal.title}
        message={archivedModal.message}
        onClose={() => setArchivedModal(m => ({ ...m, open: false }))}
      />
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalContent: {
    background: '#fff', borderRadius: 10, padding: '1.25rem 1.5rem',
    width: 'min(520px, 92vw)', boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
  }
};

export default Login;
