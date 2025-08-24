// src/pages/ets/ETSSettings.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';
import { GEO_ENDPOINTS, fetchWithAuth, headersAuth, sortByName } from '../../utils/addressApi';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// Phone helpers
const normalizePhone = (s = '') => {
  let d = String(s).replace(/\D/g, '');
  if (!d) return '';
  if (d[0] !== '0') d = '0' + d;
  if (d.length > 11) d = d.slice(0, 11);
  return d;
};
const isValidPhone = (s = '') => /^0\d{10}$/.test(s);

const ETSSettings = () => {
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');

  const [formData, setFormData] = useState({
    barangay: '',
    city: '',
    confirmPassword: '',
    email: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    newPassword: '',
    password: '',
    phone: '',
    province: '',
    street: '',
  });

  const [showPw, setShowPw] = useState({
    confirmPassword: false,
    newPassword: false,
    password: false,
  });

  const [modal, setModal] = useState({ open: false, kind: 'success', title: '', message: '' });
  const openModal = (opts) => setModal({ open: true, ...opts });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  useEffect(() => {
    if (!modal.open) return;
    const onKey = (e) => e.key === 'Escape' && closeModal();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal.open]);

  // Geo data
  const [provinces, setProvinces] = useState([]); // [{code,name}]
  const [cities, setCities] = useState([]);       // [{code,name}]
  const [barangays, setBarangays] = useState([]); // [{code,name}]

  // Selections
  const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
  const [selectedCity, setSelectedCity] = useState({ code: '', name: '' });
  const [selectedBarangay, setSelectedBarangay] = useState({ code: '', name: '' });

  const userId = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.id || null; }
    catch { return null; }
  }, []);

  // Load profile (always includes address keys; may be null if columns missing)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) {
        setLoadErr('No session user found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadErr('');
      try {
        const res = await fetch(`${API_BASE}/api/ets/settings/${userId}`, { headers: headersAuth() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load profile.');

        if (!mounted) return;
        setFormData((prev) => ({
          ...prev,
          first_name: data.first_name || '',
          middle_name: data.middle_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          street: data.street || '',
          province: data.province || '',
          city: data.city || '',
          barangay: data.barangay || '',
        }));
      } catch (e) {
        if (!mounted) return;
        setLoadErr(e.message || 'Failed to load profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  // Load provinces (alphabetical)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchWithAuth(GEO_ENDPOINTS.PROVINCES);
        if (mounted) setProvinces(sortByName(data));
      } catch { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  // Province -> Cities (alphabetical)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedProvince.code) {
        setCities([]); setSelectedCity({ code: '', name: '' });
        setBarangays([]); setSelectedBarangay({ code: '', name: '' });
        return;
      }
      try {
        const data = await fetchWithAuth(GEO_ENDPOINTS.CITIES(selectedProvince.code));
        if (!mounted) return;
        setCities(sortByName(Array.isArray(data) ? data : []));
        setSelectedCity({ code: '', name: '' });
        setBarangays([]); setSelectedBarangay({ code: '', name: '' });
      } catch {
        if (!mounted) return;
        setCities([]); setSelectedCity({ code: '', name: '' });
        setBarangays([]); setSelectedBarangay({ code: '', name: '' });
      }
    })();
    return () => { mounted = false; };
  }, [selectedProvince.code]);

  // City -> Barangays (alphabetical)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedCity.code) {
        setBarangays([]); setSelectedBarangay({ code: '', name: '' });
        return;
      }
      try {
        const data = await fetchWithAuth(GEO_ENDPOINTS.BARANGAYS(selectedCity.code));
        if (!mounted) return;
        setBarangays(sortByName(Array.isArray(data) ? data : []));
        setSelectedBarangay({ code: '', name: '' });
      } catch {
        if (!mounted) return;
        setBarangays([]); setSelectedBarangay({ code: '', name: '' });
      }
    })();
    return () => { mounted = false; };
  }, [selectedCity.code]);

  // Handlers
  const onFieldChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === 'phone') next = normalizePhone(next);
    setFormData((prev) => ({ ...prev, [name]: next }));
  };
  const onProvinceChange = (e) => {
    const code = e.target.value;
    const name = provinces.find((p) => p.code === code)?.name || '';
    setSelectedProvince({ code, name });
  };
  const onCityChange = (e) => {
    const code = e.target.value;
    const name = cities.find((c) => c.code === code)?.name || '';
    setSelectedCity({ code, name });
  };
  const onBarangayChange = (e) => {
    const code = e.target.value;
    const name = barangays.find((b) => b.code === code)?.name || '';
    setSelectedBarangay({ code, name });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (formData.phone && !isValidPhone(formData.phone)) {
      openModal({
        kind: 'error',
        title: 'Invalid Phone Number',
        message: 'Phone must be exactly 11 digits and start with 0 (e.g., 09171234567).',
      });
      return;
    }

    const outgoing = {
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone || null,
      street: formData.street || null,
      province: selectedProvince.name || formData.province || null,
      city: selectedCity.name || formData.city || null,
      barangay: selectedBarangay.name || formData.barangay || null,
    };

    try {
      const res = await fetch(`${API_BASE}/api/ets/settings/${userId}`, {
        method: 'PATCH',
        headers: headersAuth(),
        body: JSON.stringify(outgoing),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to update profile.');

      setFormData((prev) => ({
        ...prev,
        first_name: data.first_name || '',
        middle_name: data.middle_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        street: data.street || '',
        province: data.province || '',
        city: data.city || '',
        barangay: data.barangay || '',
      }));

      setSelectedProvince((p) => ({ code: '', name: p.name || '' }));
      setSelectedCity({ code: '', name: '' });
      setSelectedBarangay({ code: '', name: '' });
      setCities([]); setBarangays([]);

      try {
        const current = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...current,
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          street: data.street,
          province: data.province,
          city: data.city,
          barangay: data.barangay,
        }));
      } catch {}

      openModal({ kind: 'success', title: 'Profile Updated', message: 'Your profile changes were saved successfully.' });
    } catch (e2) {
      openModal({ kind: 'error', title: 'Update Failed', message: e2.message || 'We could not save your changes. Please try again.' });
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (!formData.newPassword || formData.newPassword !== formData.confirmPassword) {
      openModal({ kind: 'error', title: 'Password Mismatch', message: "New passwords don't match." });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/ets/settings/${userId}/password`, {
        method: 'PATCH',
        headers: headersAuth(),
        body: JSON.stringify({
          current_password: formData.password,
          new_password: formData.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to change password.');

      setFormData((prev) => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }));
      openModal({ kind: 'success', title: 'Password Changed', message: 'Your password was updated successfully.' });
    } catch (e2) {
      openModal({ kind: 'error', title: 'Password Change Failed', message: e2.message || 'We could not update your password. Please try again.' });
    }
  };

  const renderPw = (name, label, ac) => (
    <div className="form-group password-field">
      <label>{label}</label>
      <div className="password-input-wrapper">
        <input
          type={showPw[name] ? 'text' : 'password'}
          name={name}
          placeholder="••••••"
          value={formData[name]}
          onChange={onFieldChange}
          autoComplete={ac}
        />
        <span
          onClick={() => setShowPw((s) => ({ ...s, [name]: !s[name] }))}
          className="eye-toggle"
          role="button"
          tabIndex={0}
        >
          {showPw[name] ? <FiEyeOff /> : <FiEye />}
        </span>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">ETS Account Settings</h1>

      {loading ? (
        <p>Loading…</p>
      ) : loadErr ? (
        <div className="error-banner" style={{ marginBottom: 12 }}>{loadErr}</div>
      ) : (
        <>
          <form className="settings-form" onSubmit={saveProfile}>
            <fieldset>
              <legend>Profile</legend>

              <div className="form-group">
                <label>First Name</label>
                <input name="first_name" value={formData.first_name} onChange={onFieldChange} required />
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input name="middle_name" value={formData.middle_name} onChange={onFieldChange} />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input name="last_name" value={formData.last_name} onChange={onFieldChange} required />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={onFieldChange} required />
              </div>

              <div className="form-group">
                <label>Phone <small style={{ color:'#888' }}>(11 digits, starts with 0)</small></label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. 09171234567"
                  inputMode="numeric"
                  pattern="0[0-9]{10}"
                  maxLength={11}
                  value={formData.phone}
                  onChange={onFieldChange}
                  autoComplete="tel-national"
                  title="Phone must be exactly 11 digits and start with 0"
                  onInvalid={(e) => e.currentTarget.setCustomValidity('Phone must be exactly 11 digits and start with 0 (e.g., 09171234567).')}
                  onInput={(e) => e.currentTarget.setCustomValidity('')}
                />
              </div>

              <div className="form-group">
                <label>Street</label>
                <input name="street" value={formData.street} onChange={onFieldChange} />
              </div>

              <div className="form-group">
                <label>Province</label>
                <select value={selectedProvince.code} onChange={onProvinceChange}>
                  <option value="">— Select Province —</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
                {!selectedProvince.code && formData.province && (
                  <small style={{ color: '#666' }}>Current: {formData.province}</small>
                )}
              </div>

              <div className="form-group">
                <label>City / Municipality</label>
                <select
                  value={selectedCity.code}
                  onChange={onCityChange}
                  disabled={!selectedProvince.code || cities.length === 0}
                >
                  <option value="">{selectedProvince.code ? '— Select City/Municipality —' : 'Select a province first'}</option>
                  {cities.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                {!selectedCity.code && formData.city && (
                  <small style={{ color: '#666' }}>Current: {formData.city}</small>
                )}
              </div>

              <div className="form-group">
                <label>Barangay</label>
                <select
                  value={selectedBarangay.code}
                  onChange={onBarangayChange}
                  disabled={!selectedCity.code || barangays.length === 0}
                >
                  <option value="">{selectedCity.code ? '— Select Barangay —' : 'Select a city first'}</option>
                  {barangays.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
                {!selectedBarangay.code && formData.barangay && (
                  <small style={{ color: '#666' }}>Current: {formData.barangay}</small>
                )}
              </div>

              <button type="submit">Save Profile Settings</button>
            </fieldset>
          </form>

          <form className="settings-form" onSubmit={changePassword}>
            <fieldset>
              <legend>Change Password</legend>
              {renderPw('password', 'Current Password', 'current-password')}
              {renderPw('newPassword', 'New Password', 'new-password')}
              {renderPw('confirmPassword', 'Confirm New Password', 'new-password')}
              <button type="submit">Change Password</button>
            </fieldset>
          </form>
        </>
      )}

      <ResultModal open={modal.open} kind={modal.kind} title={modal.title} message={modal.message} onClose={closeModal} />
    </div>
  );
};

const ResultModal = ({ open, kind = 'success', title, message, onClose }) => {
  if (!open) return null;
  const isSuccess = kind === 'success';
  return (
    <div style={mStyles.overlay} onClick={onClose} role="presentation">
      <div style={mStyles.card} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div style={mStyles.header}>
          <div style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: isSuccess ? '#16a34a' : '#dc2626' }}>
            {isSuccess ? <FiCheckCircle size={32} /> : <FiAlertTriangle size={32} />}
          </div>
          <button onClick={onClose} aria-label="Close" title="Close" style={mStyles.closeBtn}>
            <FiX size={20} />
          </button>
        </div>
        <h3 style={mStyles.title}>{title}</h3>
        {message && <p style={mStyles.message}>{message}</p>}
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <button onClick={onClose} autoFocus>OK</button>
        </div>
      </div>
    </div>
  );
};

const mStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  card: { width: 'min(520px, 92vw)', background: '#fff', borderRadius: 10, padding: '18px 18px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', position: 'relative' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#333', width: 32, height: 32, borderRadius: 8 },
  title: { margin: '0 0 6px 0', fontSize: 18, fontWeight: 700 },
  message: { margin: 0, color: '#444', lineHeight: 1.45 },
};

export default ETSSettings;
