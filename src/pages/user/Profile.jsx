// src/pages/profile/Profile.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { FiX, FiEdit3, FiSave } from 'react-icons/fi';
import {
  headersAuth,
  fetchWithAuth,
  GEO_ENDPOINTS,
  sortByName,
} from '../../utils/addressApi';
import { departmentPrograms } from '../../utils/departments';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// helpers to split/join names
const joinName = (first = '', middle = '', last = '') =>
  [first, middle, last].filter(Boolean).join(' ').trim();
const splitName = (full = '') => {
  const parts = String(full).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', middle_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], middle_name: '', last_name: '' };
  if (parts.length === 2) return { first_name: parts[0], middle_name: '', last_name: parts[1] };
  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(' '),
    last_name: parts[parts.length - 1],
  };
};

// keep only digits and trim to maxLen (default 11)
const onlyDigits = (v, maxLen = 11) => String(v || '').replace(/\D/g, '').slice(0, maxLen);

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');

  const [me, setMe] = useState({
    id: null,
    name: '',
    email: '',
    department: '',
    phone: '',
    address: '',
    street: '',
    barangay: '',
    city: '',
    province: '',
    bio: '',
    // note: program is UI-only unless you wire it on server
    program: '',
  });

  // modals
  const [accountOpen, setAccountOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);

  // form drafts inside modals
  const [accountDraft, setAccountDraft] = useState({
    name: '',
    email: '',
    department: '',
    program: '',
    phone: '',
    street: '',
  });
  const [bioDraft, setBioDraft] = useState('');

  const [saving, setSaving] = useState(false);

  // Address reference data (alphabetically sorted)
  const [provinces, setProvinces] = useState([]); // [{code,name}]
  const [cities, setCities] = useState([]);       // [{code,name}]
  const [barangays, setBarangays] = useState([]); // [{code,name}]

  // Selected address (by code + name)
  const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
  const [selectedCity, setSelectedCity] = useState({ code: '', name: '' });
  const [selectedBarangay, setSelectedBarangay] = useState({ code: '', name: '' });

  // Department/program data
  const departmentsAlpha = useMemo(
    () => [...departmentPrograms].sort((a, b) =>
      a.department.localeCompare(b.department, undefined, { sensitivity: 'base' })
    ),
    []
  );
  const programsForDepartment = (dept) =>
    (departmentPrograms.find((d) => d.department === dept)?.programs || []).slice().sort(
      (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })
    );

  const userId = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.id || null; }
    catch { return null; }
  }, []);

  // load profile
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
        const res = await fetch(`${API_BASE}/api/user/profile/${userId}`, {
          headers: headersAuth(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load profile.');
        if (!mounted) return;

        setMe({
          id: data.id || null,
          name: data.name || '',
          email: data.email || '',
          department: data.department || '',
          program: data.program || '', // if your API returns it; else stays ''
          phone: data.phone || '',
          address: data.address || '',
          street: data.street || '',
          barangay: data.barangay || '',
          city: data.city || '',
          province: data.province || '',
          bio: data.bio || '',
        });

        // prime drafts
        setAccountDraft({
          name: data.name || '',
          email: data.email || '',
          department: data.department || '',
          program: data.program || '',
          phone: onlyDigits(data.phone),
          street: data.street || '',
        });
        setBioDraft(data.bio || '');
      } catch (e) {
        if (!mounted) return;
        setLoadErr(e.message || 'Failed to load profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  // Load provinces once (alphabetical)
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

  // Close on Esc when modal is open
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (accountOpen) setAccountOpen(false);
        if (bioOpen) setBioOpen(false);
      }
    };
    if (accountOpen || bioOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [accountOpen, bioOpen]);

  // Open Account modal -> preselect address by NAME (from saved profile)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!accountOpen) return;

      // 1) Set province selection if we have a saved province name
      if (me.province && provinces.length > 0 && !selectedProvince.code) {
        const matchProv = provinces.find((p) => p.name === me.province);
        if (matchProv) {
          setSelectedProvince({ code: matchProv.code, name: matchProv.name });
        }
      }

      // 2) If province is selected, load cities and select saved city
      if (selectedProvince.code) {
        try {
          const nextCities = sortByName(await fetchWithAuth(GEO_ENDPOINTS.CITIES(selectedProvince.code)));
          if (!mounted) return;
          setCities(nextCities);

          if (me.city && !selectedCity.code) {
            const matchCity = nextCities.find((c) => c.name === me.city);
            if (matchCity) {
              setSelectedCity({ code: matchCity.code, name: matchCity.name });
            }
          }
        } catch { /* ignore */ }
      }

      // 3) If city is selected, load barangays and select saved barangay
      if (selectedCity.code) {
        try {
          const nextBars = sortByName(await fetchWithAuth(GEO_ENDPOINTS.BARANGAYS(selectedCity.code)));
          if (!mounted) return;
          setBarangays(nextBars);

          if (me.barangay && !selectedBarangay.code) {
            const matchBrgy = nextBars.find((b) => b.name === me.barangay);
            if (matchBrgy) {
              setSelectedBarangay({ code: matchBrgy.code, name: matchBrgy.name });
            }
          }
        } catch { /* ignore */ }
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountOpen, provinces.length, selectedProvince.code, selectedCity.code]);

  // Province -> fetch cities (alpha) and reset deeper levels
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

  // City -> fetch barangays (alpha) and reset barangay
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

  // account handlers
  const onAccountChange = (e) => {
    const { name, value } = e.target;
    let next = value;

    if (name === 'phone') {
      // ENFORCE: integers only, up to 11 digits
      next = onlyDigits(next, 11);
    }

    if (name === 'department') {
      // reset program when department changes
      setAccountDraft((prev) => ({ ...prev, [name]: next, program: '' }));
      return;
    }

    setAccountDraft((prev) => ({ ...prev, [name]: next }));
  };

  const onProgramChange = (e) => {
    const next = e.target.value;
    setAccountDraft((prev) => ({ ...prev, program: next }));
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

  const openAccountModal = () => {
    setAccountDraft({
      name: me.name,
      email: me.email,
      department: me.department,
      program: me.program || '',
      phone: onlyDigits(me.phone),
      street: me.street,
    });
    setAccountOpen(true);
  };

  const saveAccount = async () => {
    if (!me.id) return;
    setSaving(true);
    const { first_name, middle_name, last_name } = splitName(accountDraft.name);
    const body = {
      first_name,
      middle_name,
      last_name,
      email: accountDraft.email,
      // phone can be empty or <= 11 digits, already sanitized
      phone: accountDraft.phone || null,
      department: accountDraft.department || null,
      // program is UI-only unless your server supports it; send only if you added it server-side:
      // program: accountDraft.program || null,
      street: accountDraft.street || null,
      // use selected dropdown names, fallback to existing if none selected
      province: selectedProvince.name || me.province || null,
      city: selectedCity.name || me.city || null,
      barangay: selectedBarangay.name || me.barangay || null,
    };

    try {
      const res = await fetch(`${API_BASE}/api/user/profile/${me.id}`, {
        method: 'PATCH',
        headers: headersAuth(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to update account.');

      setMe((prev) => ({
        ...prev,
        name: data.name || joinName(first_name, middle_name, last_name),
        email: data.email ?? body.email ?? '',
        department: data.department ?? body.department ?? '',
        // keep program locally (unless your API returns it)
        program: accountDraft.program || prev.program || '',
        phone: onlyDigits(data.phone ?? body.phone ?? ''),
        street: data.street ?? body.street ?? '',
        barangay: data.barangay ?? body.barangay ?? '',
        city: data.city ?? body.city ?? '',
        province: data.province ?? body.province ?? '',
        address:
          data.address ||
          [body.street, body.barangay, body.city, body.province].filter(Boolean).join(', '),
      }));

      // reset dependent selections (keeps province name as plain text in case user reopens)
      setSelectedProvince((p) => ({ code: '', name: p.name || '' }));
      setSelectedCity({ code: '', name: '' });
      setSelectedBarangay({ code: '', name: '' });
      setCities([]); setBarangays([]);

      setAccountOpen(false);
    } catch (e) {
      alert(e.message || 'Could not update account.');
    } finally {
      setSaving(false);
    }
  };

  // bio handlers
  const openBioModal = () => {
    setBioDraft(me.bio || '');
    setBioOpen(true);
  };
  const saveBio = async () => {
    if (!me.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/user/profile/${me.id}`, {
        method: 'PATCH',
        headers: headersAuth(),
        body: JSON.stringify({ bio: bioDraft || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to update biography.');

      setMe((prev) => ({ ...prev, bio: data.bio ?? bioDraft ?? '' }));
      setBioOpen(false);
    } catch (e) {
      alert(e.message || 'Could not update biography.');
    } finally {
      setSaving(false);
    }
  };

  // prevent invalid chars in the phone input (allows digits, navigation, backspace, delete)
  const filterPhoneKeyDown = (e) => {
    const allowed =
      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key) ||
      /^[0-9]$/.test(e.key);
    if (!allowed) e.preventDefault();
  };

  // render list of programs for current draft department
  const currentPrograms = programsForDepartment(accountDraft.department);

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">My Profile</h1>

      {loading ? (
        <p>Loading…</p>
      ) : loadErr ? (
        <div className="error-banner" style={{ marginBottom: 12 }}>{loadErr}</div>
      ) : (
        <>
          {/* Account Card */}
          <section className="card-like" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ marginTop: 0 }}>{me.name || '—'}</h2>
              <button onClick={openAccountModal} title="Edit Account">
                <FiEdit3 style={{ marginRight: 6 }} /> Update
              </button>
            </div>
            <div className="logs-table" style={{ border: 'none' }}>
              <Row label="Email" value={me.email} />
              <Row label="Department" value={me.department} />
              {/* role & rank intentionally hidden */}
              <Row label="Phone" value={me.phone} />
              <Row label="Address" value={me.address} />
            </div>
          </section>

          {/* Biography Card */}
          <section className="card-like">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 style={{ marginTop: 0 }}>Biography</h3>
              <button onClick={openBioModal} title="Edit Biography" className="secondary">
                <FiEdit3 style={{ marginRight: 6 }} /> Update
              </button>
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{me.bio || '—'}</p>
          </section>
        </>
      )}

      {/* Account Modal */}
      {accountOpen && (
        <Modal onClose={() => setAccountOpen(false)} title="Update Account">
          <div className="settings-form" style={{ maxWidth: 'unset', padding: 0, boxShadow: 'none', border: 'none' }}>
            <fieldset>
              <legend>Account Details</legend>
              <div className="form-group">
                <label>Name</label>
                <input
                  name="name"
                  value={accountDraft.name}
                  onChange={onAccountChange}
                  placeholder="First [Middle] Last"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={accountDraft.email}
                  onChange={onAccountChange}
                />
              </div>

              {/* Department + Program using src/utils/departments.js */}
              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  value={accountDraft.department}
                  onChange={onAccountChange}
                >
                  <option value="">— Select Department —</option>
                  {departmentsAlpha.map((d) => (
                    <option key={d.department} value={d.department}>
                      {d.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Program</label>
                <select
                  name="program"
                  value={accountDraft.program}
                  onChange={onProgramChange}
                  disabled={!accountDraft.department}
                  title={!accountDraft.department ? 'Select a department first' : undefined}
                >
                  <option value="">
                    {accountDraft.department ? '— Select Program —' : 'Select a department first'}
                  </option>
                  {currentPrograms.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Phone <small style={{ color:'#888' }}>(digits only, up to 11)</small></label>
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  maxLength={11}
                  value={accountDraft.phone}
                  onChange={onAccountChange}
                  onKeyDown={filterPhoneKeyDown}
                  placeholder="09171234567"
                  title="Digits only, up to 11 numbers"
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>Address</legend>
              <div className="form-group">
                <label>Street</label>
                <input
                  name="street"
                  value={accountDraft.street}
                  onChange={onAccountChange}
                />
              </div>

              <div className="form-group">
                <label>Province</label>
                <select value={selectedProvince.code} onChange={onProvinceChange}>
                  <option value="">— Select Province —</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
                {!selectedProvince.code && me.province && (
                  <small style={{ color:'#666' }}>Current: {me.province}</small>
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
                {!selectedCity.code && me.city && (
                  <small style={{ color:'#666' }}>Current: {me.city}</small>
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
                {!selectedBarangay.code && me.barangay && (
                  <small style={{ color:'#666' }}>Current: {me.barangay}</small>
                )}
              </div>
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setAccountOpen(false)} className="secondary">
                Cancel
              </button>
              <button onClick={saveAccount} disabled={saving}>
                <FiSave style={{ marginRight: 6 }} />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Biography Modal */}
      {bioOpen && (
        <Modal onClose={() => setBioOpen(false)} title="Update Biography">
          <div className="settings-form" style={{ maxWidth: 'unset', padding: 0, boxShadow: 'none', border: 'none' }}>
            <div className="form-group">
              <label>Biography</label>
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                rows={8}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Tell us about your work, interests, and research…"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setBioOpen(false)} className="secondary">
                Cancel
              </button>
              <button onClick={saveBio} disabled={saving}>
                <FiSave style={{ marginRight: 6 }} />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Simple row renderer
const Row = ({ label, value }) => (
  <div style={{ padding: 8, display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
    <div style={{ color: '#6b7280', fontWeight: 600 }}>{label}:</div>
    <div>{value || '—'}</div>
  </div>
);

// Reusable Modal that uses your global styles
const Modal = ({ title, children, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 12,
      }}
    >
      <div
        className="card-like"
        style={{ width: 'min(720px, 96vw)', padding: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            borderBottom: '1px solid #f3f4f6',
            paddingBottom: 8,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          <button
            aria-label="Close"
            title="Close"
            className="no-highlight"
            onClick={onClose}
            style={{ padding: 4 }}
          >
            <FiX size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

export default Profile;
