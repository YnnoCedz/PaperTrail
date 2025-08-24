// src/pages/admin/AdminUserManagement.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// --- Departments & Programs (client-only metadata) ---
const departmentPrograms = [
  { department: 'COLLEGE OF ARTS AND SCIENCES (CAS)', programs: [
    'Bachelor of Arts in Broadcasting','Bachelor of Science in Biology','Bachelor of Science in Chemistry',
    'Bachelor of Science in Mathematics','Bachelor of Science in Psychology',
  ]},
  { department: 'COLLEGE OF BUSINESS, ADMINISTRATION AND ACCOUNTANCY (CBAA)', programs: [
    'Bachelor of Science in Accountancy','Bachelor of Science in Entrepreneurship',
    'Bachelor of Science in Office Administration','Master of Public Administration (MPA)',
  ]},
  { department: 'COLLEGE OF COMPUTER STUDIES (CCS)', programs: [
    'Bachelor of Science in Computer Science','Bachelor of Science in Information Technology',
    'Master in Information Technology (MSIT)',
  ]},
  { department: 'COLLEGE OF CRIMINAL JUSTICE EDUCATION (CCJE)', programs: [
    'Bachelor of Science in Criminology',
  ]},
  { department: 'COLLEGE OF ENGINEERING (COE)', programs: [
    'Bachelor of Science in Civil Engineering','Bachelor of Science in Computer Engineering',
    'Bachelor of Science in Electrical Engineering','Bachelor of Science in Electronics Engineering',
    'Bachelor of Science in Mechanical Engineering',
  ]},
  { department: 'COLLEGE OF HOSPITALITY MANAGEMENT AND TOURISM (CHMT)', programs: [
    'Bachelor of Science in Hospitality Management','Bachelor of Science in Tourism Management',
  ]},
  { department: 'COLLEGE OF INDUSTRIAL TECHNOLOGY (CIT)', programs: [
    'Bachelor of Science in Industrial Technology',
  ]},
  { department: 'COLLEGE OF NURSING AND ALLIED HEALTH (CONAH)', programs: [
    'Bachelor of Science in Nursing',
  ]},
  { department: 'COLLEGE OF TEACHER EDUCATION (CTE)', programs: [
    'Bachelor of Elementary Education','Bachelor of Physical Education','Bachelor of Secondary Education',
    'Bachelor of Technical Vocational Teacher Education','Bachelor of Technology and Livelihood Education',
    'Doctor of Education (Ed.D.)','Master of Arts in Education (MAED)','Master of Arts in Teaching English (MAT-ENG)',
  ]},
];

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

// --- Small inline modals ---
const ConfirmModal = ({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onClose, onConfirm }) => {
  if (!open) return null;
  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, maxWidth: 520 }}>
        <h3>{title || 'Please confirm'}</h3>
        {message && <p style={{ marginTop: 8 }}>{message}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose}>{cancelText}</button>
          <button onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const NotifyModal = ({ open, type = 'success', title, message, onClose }) => {
  if (!open) return null;
  const color = type === 'error' ? '#b00020' : '#0f7b0f';
  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, maxWidth: 520 }}>
        <h3 style={{ color }}>{title || (type === 'error' ? 'Operation failed' : 'Success')}</h3>
        {message && <p style={{ marginTop: 8 }}>{message}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

const AdminUserManagement = () => {
  // List state
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all'); // active|archived|all
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Detail/modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // NEW USER — matches users table (no department_id; and no manual barangay/city fields)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    phone: '',
    street: '',
    rank_id: '',
    role_id: ''
  });

  // Department + Program (client-only metadata)
  const [deptIndex, setDeptIndex] = useState('');   // index in departmentPrograms
  const [programName, setProgramName] = useState('');

  // PSGC pickers (codes + display names)
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const [selectedProvinceName, setSelectedProvinceName] = useState('');
  const [selectedMunicipalityName, setSelectedMunicipalityName] = useState('');
  const [selectedBarangayName, setSelectedBarangayName] = useState('');

  // Confirmation & Notification modals
  const [confirm, setConfirm] = useState({
    open: false, title: '', message: '', confirmText: 'Confirm', cancelText: 'Cancel', onConfirm: null
  });
  const [notify, setNotify] = useState({
    open: false, type: 'success', title: '', message: ''
  });

  const token = localStorage.getItem('token') || '';
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }),
    [token]
  );

  // ---- phone helpers ----
  const digitsOnly = (s = "") => s.replace(/\D/g, "");
  const normalizePhone = (s = "") => {
    let d = digitsOnly(s);
    if (!d) return "";
    if (d[0] !== "0") d = "0" + d;
    if (d.length > 11) d = d.slice(0, 11);
    return d;
  };
  const isValidPhone = (s = "") => /^0\d{10}$/.test(s);

  // ---- Roles / Users ----
  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users-management/roles`, { headers });
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
        search: searchQuery
      });
      const res = await fetch(`${API_BASE}/api/users-management/users?${params.toString()}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load users');
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => { fetchUsers(); }, [page, limit, statusFilter]);
  useEffect(() => {
    const id = setTimeout(() => { setPage(1); fetchUsers(); }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // ---- Archive / Recover with confirmation ----
  const askArchive = (user) => {
    setConfirm({
      open: true,
      title: 'Archive User',
      message: `Are you sure you want to archive "${user.first_name} ${user.last_name}"? They will be marked inactive.`,
      confirmText: 'Archive',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          const res = await fetch(`${API_BASE}/api/users-management/users/${user.id}/archive`, {
            method: 'PATCH', headers
          });
          if (!res.ok) throw new Error('Failed to archive');
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: 0 } : u));
          if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, active: 0 });
          setNotify({ open: true, type: 'success', title: 'User archived', message: 'The user was archived successfully.' });
        } catch (e) {
          setNotify({ open: true, type: 'error', title: 'Archive failed', message: e.message });
        }
      }
    });
  };

  const askRecover = (user) => {
    setConfirm({
      open: true,
      title: 'Recover User',
      message: `Recover "${user.first_name} ${user.last_name}" and mark the account active again?`,
      confirmText: 'Recover',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          const res = await fetch(`${API_BASE}/api/users-management/users/${user.id}/recover`, {
            method: 'PATCH', headers
          });
          if (!res.ok) throw new Error('Failed to recover');
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: 1 } : u));
          if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, active: 1 });
          setNotify({ open: true, type: 'success', title: 'User recovered', message: 'The user is active again.' });
        } catch (e) {
          setNotify({ open: true, type: 'error', title: 'Recover failed', message: e.message });
        }
      }
    });
  };

  // ---- Create user via /api/registration ----
  const handleAddUser = async () => {
    if (newUser.password !== newUser.confirmPassword) {
      setNotify({ open: true, type: 'error', title: 'Invalid password', message: 'Passwords do not match.' });
      return;
    }
    if (!newUser.username || !newUser.email || !newUser.password ||
        !newUser.first_name || !newUser.last_name || !newUser.role_id) {
      setNotify({ open: true, type: 'error', title: 'Missing fields', message: 'Please fill all required fields.' });
      return;
    }
    if (newUser.phone && !isValidPhone(newUser.phone)) {
      setNotify({
        open: true, type: 'error', title: 'Invalid phone',
        message: 'Phone must be exactly 11 digits and start with 0 (e.g., 09171234567).'
      });
      return;
    }

    const body = {
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      first_name: newUser.first_name,
      middle_name: newUser.middle_name || null,
      last_name: newUser.last_name,
      phone: newUser.phone || null,
      street: newUser.street || null,
      // NO manual fallbacks — only from pickers:
      barangay: selectedBarangayName || null,
      city: selectedMunicipalityName || null,
      rank_id: newUser.rank_id ? Number(newUser.rank_id) : null,
      role_id: Number(newUser.role_id),

      // meta-only (not stored in users table)
      department_name: (deptIndex === '' ? null : departmentPrograms[Number(deptIndex)].department),
      program_name: programName || null,
      province_code: selectedProvince || null,
      municipality_code: selectedMunicipality || null,
      barangay_code: selectedBarangay || null
    };

    try {
      const res = await fetch(`${API_BASE}/api/registration`, {
        method: 'POST', headers, body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to create user');

      // reset + refresh
      setShowAddModal(false);
      setNotify({ open: true, type: 'success', title: 'User registered', message: 'The account was created successfully.' });

      setNewUser({
        username: '', email: '', password: '', confirmPassword: '',
        first_name: '', middle_name: '', last_name: '',
        phone: '', street: '', rank_id: '', role_id: ''
      });
      setDeptIndex(''); setProgramName('');
      setSelectedProvince(''); setSelectedMunicipality(''); setSelectedBarangay('');
      setSelectedProvinceName(''); setSelectedMunicipalityName(''); setSelectedBarangayName('');
      setMunicipalities([]); setBarangays([]);
      fetchUsers();
    } catch (e) {
      setNotify({ open: true, type: 'error', title: 'Registration failed', message: e.message });
    }
  };

  // --- PSGC loaders (public API) ---
  const loadProvinces = async () => {
    try {
      const res = await fetch('https://psgc.gitlab.io/api/provinces');
      const data = await res.json();
      setProvinces((data || []).sort(byName));
    } catch (e) { console.error('Error loading provinces:', e); }
  };

  const loadMunicipalities = async (provinceCode) => {
    if (!provinceCode) {
      setMunicipalities([]); setBarangays([]);
      setSelectedMunicipality(''); setSelectedBarangay('');
      setSelectedMunicipalityName(''); setSelectedBarangayName('');
      return;
    }
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/municipalities`);
      const data = await res.json();
      setMunicipalities((data || []).sort(byName));
      setBarangays([]);
      setSelectedMunicipality(''); setSelectedBarangay('');
      setSelectedMunicipalityName(''); setSelectedBarangayName('');
    } catch (e) { console.error('Error loading municipalities:', e); }
  };

  const loadBarangays = async (municipalityCode) => {
    if (!municipalityCode) {
      setBarangays([]); setSelectedBarangay(''); setSelectedBarangayName('');
      return;
    }
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/municipalities/${municipalityCode}/barangays`);
      const data = await res.json();
      setBarangays((data || []).sort(byName));
      setSelectedBarangay(''); setSelectedBarangayName('');
    } catch (e) { console.error('Error loading barangays:', e); }
  };

  useEffect(() => { loadProvinces(); }, []);

  // selections update names
  useEffect(() => {
    const p = provinces.find(p => p.code === selectedProvince);
    setSelectedProvinceName(p?.name || '');
  }, [selectedProvince, provinces]);

  useEffect(() => {
    const m = municipalities.find(m => m.code === selectedMunicipality);
    setSelectedMunicipalityName(m?.name || '');
  }, [selectedMunicipality, municipalities]);

  useEffect(() => {
    const b = barangays.find(b => b.code === selectedBarangay);
    setSelectedBarangayName(b?.name || '');
  }, [selectedBarangay, barangays]);

  const filteredUsers = users; // server filters already applied

  return (
    <div className="admin-dashboard">
      <h2 className="page-title">User Management</h2>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <button onClick={() => setShowAddModal(true)}>Add New User</button>
      </div>

      {err && <div className="error-banner">{err}</div>}
      {loading ? <p>Loading…</p> : (
        <>
          <table className="logs-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name || `${user.first_name} ${user.last_name}`}</td>
                  <td>{user.email}</td>
                  <td>{user.role_name || user.role_id}</td>
                  <td>
                    <span className={`status-badge ${user.active ? 'status-active' : 'status-archived'}`}>
                      {user.active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => setSelectedUser(user)}>View Profile</button>{' '}
                    {user.active
                      ? <button onClick={() => askArchive(user)}>Archive</button>
                      : <button onClick={() => askRecover(user)}>Recover</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 12 }}>
            <small>Page {page} • Total {total}</small>
            <div style={{ display: 'inline-flex', gap: 8, marginLeft: 12 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </>
      )}

      {/* View Profile Modal */}
      {selectedUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>User Profile</h3>
            <p><strong>Name:</strong> {selectedUser.full_name || `${selectedUser.first_name} ${selectedUser.last_name}`}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Role:</strong> {selectedUser.role_name || selectedUser.role_id}</p>
            <p><strong>Status:</strong> {selectedUser.active ? 'Active' : 'Archived'}</p>
            {selectedUser.address && <p><strong>Address:</strong> {selectedUser.address}</p>}
            {!selectedUser.active && (
              <button onClick={() => askRecover(selectedUser)} style={{ marginTop: 12 }}>
                Recover User
              </button>
            )}
            <button onClick={() => setSelectedUser(null)} style={{ marginTop: 12 }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Register New User</h3>

            {/* Account */}
            <fieldset style={styles.fs}>
              <legend style={styles.legend}>Account</legend>
              <div style={styles.gridTwo}>
                <div style={styles.field}>
                  <label>Username <span style={styles.req}>*</span></label>
                  <input
                    name="username"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  />
                </div>
                <div style={styles.field}>
                  <label>Email <span style={styles.req}>*</span></label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.gridTwo}>
                <div style={styles.field}>
                  <label>Password <span style={styles.req}>*</span></label>
                  <div style={styles.inputWrap}>
                    <input
                      name="password"
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      style={styles.inputWithToggle}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={styles.eyeToggle}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={styles.field}>
                  <label>Confirm Password <span style={styles.req}>*</span></label>
                  <div style={styles.inputWrap}>
                    <input
                      name="confirmPassword"
                      placeholder="Confirm password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={newUser.confirmPassword}
                      onChange={e => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      style={styles.inputWithToggle}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      style={styles.eyeToggle}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Personal */}
            <fieldset style={styles.fs}>
              <legend style={styles.legend}>Personal Information</legend>
              <div style={styles.gridThree}>
                <div style={styles.field}>
                  <label>First Name <span style={styles.req}>*</span></label>
                  <input
                    name="first_name"
                    placeholder="First name"
                    value={newUser.first_name}
                    onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                  />
                </div>
                <div style={styles.field}>
                  <label>Middle Name</label>
                  <input
                    name="middle_name"
                    placeholder="Middle name"
                    value={newUser.middle_name}
                    onChange={e => setNewUser({ ...newUser, middle_name: e.target.value })}
                  />
                </div>
                <div style={styles.field}>
                  <label>Last Name <span style={styles.req}>*</span></label>
                  <input
                    name="last_name"
                    placeholder="Last name"
                    value={newUser.last_name}
                    onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.gridTwo}>
                <div style={styles.field}>
                  <label>
                    Phone <small style={{ color:'#888' }}>(11 digits, starts with 0)</small>
                  </label>
                  <input
                    name="phone"
                    placeholder="e.g. 09171234567"
                    type="tel"
                    inputMode="numeric"
                    pattern="^0\\d{10}$"
                    maxLength={11}
                    minLength={11}
                    value={newUser.phone}
                    onChange={(e) => {
                      const v = normalizePhone(e.target.value);
                      setNewUser({ ...newUser, phone: v });
                    }}
                    onBlur={(e) => {
                      const v = normalizePhone(e.target.value);
                      setNewUser({ ...newUser, phone: v });
                    }}
                    title="Phone must be exactly 11 digits and start with 0"
                    autoComplete="tel-national"
                  />
                  {newUser.phone && !isValidPhone(newUser.phone) && (
                    <span style={{ color: 'crimson', fontSize: 12 }}>
                      Phone must be exactly 11 digits and start with 0 (e.g., 09171234567).
                    </span>
                  )}
                </div>

                <div style={styles.field}>
                  <label>Academic Rank (ID / Code)</label>
                  <input
                    name="rank_id"
                    placeholder="Optional"
                    value={newUser.rank_id}
                    onChange={e => setNewUser({ ...newUser, rank_id: e.target.value })}
                  />
                </div>
              </div>
            </fieldset>

            {/* Address */}
            <fieldset style={styles.fs}>
              <legend style={styles.legend}>Address</legend>

              <div style={styles.gridTwo}>
                <div style={styles.field}>
                  <label>Province</label>
                  <select
                    value={selectedProvince}
                    onChange={e => { setSelectedProvince(e.target.value); loadMunicipalities(e.target.value); }}
                  >
                    <option value="">Select Province</option>
                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </div>

                <div style={styles.field}>
                  <label>City / Municipality</label>
                  <select
                    value={selectedMunicipality}
                    onChange={e => { setSelectedMunicipality(e.target.value); loadBarangays(e.target.value); }}
                    disabled={!selectedProvince}
                  >
                    <option value="">Select City / Municipality</option>
                    {municipalities.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={styles.gridTwo}>
                <div style={styles.field}>
                  <label>Barangay</label>
                  <select
                    value={selectedBarangay}
                    onChange={e => setSelectedBarangay(e.target.value)}
                    disabled={!selectedMunicipality}
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                  </select>
                </div>

                <div style={styles.field}>
                  <label>Street</label>
                  <input
                    name="street"
                    placeholder="House No. / Street"
                    value={newUser.street}
                    onChange={e => setNewUser({ ...newUser, street: e.target.value })}
                  />
                </div>
              </div>
            </fieldset>

            {/* Role & Department (meta) */}
            <fieldset style={styles.fs}>
              <legend style={styles.legend}>Role & Department</legend>

              <div style={styles.gridTwo}>
                <div style={styles.field}>
                  <label>Role <span style={styles.req}>*</span></label>
                  <select
                    name="role_id"
                    value={newUser.role_id}
                    onChange={e => setNewUser({ ...newUser, role_id: e.target.value })}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div style={styles.field}>
                  <label>Department (meta)</label>
                  <select
                    value={deptIndex}
                    onChange={e => { setDeptIndex(e.target.value); setProgramName(''); }}
                  >
                    <option value="">Select Department (optional)</option>
                    {departmentPrograms.map((d, i) => (
                      <option key={d.department} value={i}>{d.department}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.gridOne}>
                <div style={styles.field}>
                  <label>Program (meta)</label>
                  <select
                    value={programName}
                    onChange={e => setProgramName(e.target.value)}
                    disabled={deptIndex === ''}
                  >
                    <option value="">Select Program (optional)</option>
                    {deptIndex !== '' &&
                      departmentPrograms[Number(deptIndex)].programs.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
            </fieldset>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddModal(false)}>Cancel</button>
              <button onClick={handleAddUser}>Register User</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm & Notify Modals */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        onClose={() => setConfirm(c => ({ ...c, open: false }))}
        onConfirm={confirm.onConfirm || (() => setConfirm(c => ({ ...c, open: false })))}
      />
      <NotifyModal
        open={notify.open}
        type={notify.type}
        title={notify.title}
        message={notify.message}
        onClose={() => setNotify(n => ({ ...n, open: false }))}
      />
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 999
  },
  modalContent: {
    background: 'white',
    padding: '2rem',
    borderRadius: '8px',
    minWidth: '620px',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },

  // Fieldset & form helpers
  fs: { border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 14 },
  legend: { padding: '0 6px', fontWeight: 600, color: '#333' },
  req: { color: 'crimson' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  gridOne: { display: 'grid', gridTemplateColumns: '1fr', gap: 12 },
  gridTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  gridThree: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },

  // Password reveal
  inputWrap: { position: 'relative', display: 'block' },
  inputWithToggle: { paddingRight: 44 },
  eyeToggle: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#333',
    zIndex: 3,
    pointerEvents: 'auto',
  }
};

export default AdminUserManagement;
