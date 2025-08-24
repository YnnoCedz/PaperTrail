// src/pages/admin/AdminSettings.jsx
import React, { useEffect, useState } from 'react';
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';
import {
  getProfile,
  updateProfile,
  changePassword,
  phone as phoneUtil,
  setLocalUser,
  getLocalUser
} from '../../api/settings';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Only used for initial load error
  const [loadErr, setLoadErr] = useState('');

  const [profile, setProfile] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  const [showPw, setShowPw] = useState({
    current: false, next: false, confirm: false
  });

  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Modal state
  const [modal, setModal] = useState({
    open: false,
    title: '',
    message: '',
    kind: 'success', // 'success' | 'error'
  });

  const openModal = (opts) => setModal({ open: true, ...opts });
  const closeModal = () => setModal(m => ({ ...m, open: false }));

  // Close modal on Esc
  useEffect(() => {
    if (!modal.open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal.open]);

  // Load current user profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadErr('');
      setLoading(true);
      try {
        const data = await getProfile();
        if (!mounted) return;
        setProfile({
          first_name: data.first_name || '',
          middle_name: data.middle_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
      } catch (e) {
        if (!mounted) return;
        setLoadErr(e.message || 'Failed to load profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Profile form handlers
  const onProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'phone' ? phoneUtil.normalize(value) : value
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    if (profile.phone && !phoneUtil.isValid(profile.phone)) {
      openModal({
        kind: 'error',
        title: 'Invalid Phone Number',
        message: 'Phone must be exactly 11 digits and start with 0 (e.g., 09171234567).'
      });
      return;
    }

    setSaving(true);
    try {
      // Use server-returned row to refresh UI + localStorage
      const updated = await updateProfile(profile);

      // sync local storage copy
      setLocalUser({
        first_name: updated.first_name,
        middle_name: updated.middle_name,
        last_name: updated.last_name,
        email: updated.email,
        phone: updated.phone
      });

      // refresh our local form values with the definitive server values
      setProfile(p => ({
        ...p,
        first_name: updated.first_name ?? p.first_name,
        middle_name: updated.middle_name ?? p.middle_name,
        last_name: updated.last_name ?? p.last_name,
        email: updated.email ?? p.email,
        phone: updated.phone ?? p.phone
      }));

      openModal({
        kind: 'success',
        title: 'Profile Updated',
        message: 'Your profile changes were saved successfully.'
      });
    } catch (e) {
      openModal({
        kind: 'error',
        title: 'Update Failed',
        message: e.message || 'We could not save your changes. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Password form handlers
  const onPwChange = (e) => {
    const { name, value } = e.target;
    setPwForm(prev => ({ ...prev, [name]: value }));
  };

  const submitPassword = async (e) => {
    e.preventDefault();

    if (!pwForm.new_password || pwForm.new_password !== pwForm.confirm_password) {
      openModal({
        kind: 'error',
        title: 'Password Mismatch',
        message: "New passwords don't match."
      });
      return;
    }

    setPwSaving(true);
    try {
      await changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      openModal({
        kind: 'success',
        title: 'Password Changed',
        message: 'Your password was updated successfully.'
      });
    } catch (e) {
      openModal({
        kind: 'error',
        title: 'Password Change Failed',
        message: e.message || 'We could not update your password. Please try again.'
      });
    } finally {
      setPwSaving(false);
    }
  };

  const user = getLocalUser();

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Account Settings</h1>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {loadErr && <div className="error-banner" style={{ marginBottom: 12 }}>{loadErr}</div>}

          {/* Basic profile */}
          <form className="settings-form" onSubmit={saveProfile}>
            <fieldset>
              <legend>Profile</legend>

              {/* Optional read-only bits */}
              {user?.username && (
                <div className="form-group">
                  <label>Username</label>
                  <input value={user.username} disabled />
                </div>
              )}

              <div className="form-group">
                <label>First Name</label>
                <input
                  name="first_name"
                  value={profile.first_name}
                  onChange={onProfileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input
                  name="middle_name"
                  value={profile.middle_name}
                  onChange={onProfileChange}
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  name="last_name"
                  value={profile.last_name}
                  onChange={onProfileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={onProfileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone <small style={{ color:'#888' }}>(11 digits, starts with 0)</small></label>
                <input
                type="tel"
                name="phone"
                placeholder="e.g. 09171234567"
                inputMode="numeric"
                pattern="0[0-9]{10}"          // 0 + 10 digits (implicit anchors)
                maxLength={11}                // exact length limit
                value={profile.phone}
                onChange={onProfileChange}
                autoComplete="tel-national"
                title="Phone must be exactly 11 digits and start with 0"
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity(
                    'Phone must be exactly 11 digits and start with 0 (e.g., 09171234567).'
                  )
                }
                onInput={(e) => e.currentTarget.setCustomValidity('')}
              />
              </div>

              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </fieldset>
          </form>

          {/* Change password */}
          <form className="settings-form" onSubmit={submitPassword}>
            <fieldset>
              <legend>Change Password</legend>

              <div className="form-group password-field">
                <label>Current Password</label>
                <div style={styles.pwWrap}>
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    name="current_password"
                    placeholder="••••••"
                    value={pwForm.current_password}
                    onChange={onPwChange}
                    autoComplete="current-password"
                    style={styles.pwInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                    style={styles.eyeBtn}
                    aria-label={showPw.current ? 'Hide password' : 'Show password'}
                    title={showPw.current ? 'Hide password' : 'Show password'}
                  >
                    {showPw.current ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group password-field">
                <label>New Password</label>
                <div style={styles.pwWrap}>
                  <input
                    type={showPw.next ? 'text' : 'password'}
                    name="new_password"
                    placeholder="••••••"
                    value={pwForm.new_password}
                    onChange={onPwChange}
                    autoComplete="new-password"
                    style={styles.pwInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => ({ ...s, next: !s.next }))}
                    style={styles.eyeBtn}
                    aria-label={showPw.next ? 'Hide password' : 'Show password'}
                    title={showPw.next ? 'Hide password' : 'Show password'}
                  >
                    {showPw.next ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group password-field">
                <label>Confirm New Password</label>
                <div style={styles.pwWrap}>
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    name="confirm_password"
                    placeholder="••••••"
                    value={pwForm.confirm_password}
                    onChange={onPwChange}
                    autoComplete="new-password"
                    style={styles.pwInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                    style={styles.eyeBtn}
                    aria-label={showPw.confirm ? 'Hide password' : 'Show password'}
                    title={showPw.confirm ? 'Hide password' : 'Show password'}
                  >
                    {showPw.confirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Change Password'}
              </button>
            </fieldset>
          </form>
        </>
      )}

      {/* Result Modal */}
      <ResultModal
        open={modal.open}
        kind={modal.kind}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </div>
  );
};

const ResultModal = ({ open, kind = 'success', title, message, onClose }) => {
  if (!open) return null;
  const isSuccess = kind === 'success';

  const iconStyle = {
    width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose} role="presentation">
      <div style={modalStyles.card} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={{ ...iconStyle, color: isSuccess ? '#16a34a' : '#dc2626' }}>
            {isSuccess ? <FiCheckCircle size={32} /> : <FiAlertTriangle size={32} />}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close"
            style={modalStyles.closeBtn}
          >
            <FiX size={20} />
          </button>
        </div>

        <h3 style={modalStyles.title}>{title}</h3>
        {message && <p style={modalStyles.message}>{message}</p>}

        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <button onClick={onClose} autoFocus>OK</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pwWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  pwInput: { paddingRight: 44 },
  eyeBtn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#333'
  }
};

const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  card: {
    width: 'min(520px, 92vw)',
    background: '#fff',
    borderRadius: 10,
    padding: '18px 18px 14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    position: 'relative'
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8
  },
  closeBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer', color: '#333',
    width: 32, height: 32, borderRadius: 8
  },
  title: { margin: '0 0 6px 0', fontSize: 18, fontWeight: 700 },
  message: { margin: 0, color: '#444', lineHeight: 1.45 }
};

export default AdminSettings;
