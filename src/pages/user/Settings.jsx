import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Settings = () => {
  const [form, setForm] = useState({
    name: '', email: '', theme: 'system', language: 'en', notifications: true,
    password: '', newPassword: '', confirmPassword: ''
  });
  const [show, setShow] = useState({ password: false, newPassword: false, confirmPassword: false });

  const onChange = e => {
    const { name, type, checked, value } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const toggle = key => setShow(prev => ({ ...prev, [key]: !prev[key] }));

  const submitProfile = e => { e.preventDefault(); alert('Profile saved.'); };
  const submitPassword = e => {
    e.preventDefault();
    if (!form.newPassword || form.newPassword !== form.confirmPassword) return alert("New passwords don't match!");
    alert('Password changed.');
    setForm(f => ({ ...f, password: '', newPassword: '', confirmPassword: '' }));
  };

  const Password = ({ name, label }) => (
    <div className="form-group password-field">
      <label>{label}</label>
      <div className="password-input-wrapper">
        <input type={show[name] ? 'text' : 'password'} name={name} value={form[name]} onChange={onChange} />
        <span className="eye-toggle" role="button" tabIndex={0} onClick={() => toggle(name)}>
          {show[name] ? <FiEyeOff /> : <FiEye />}
        </span>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Account Settings</h1>

      <form className="settings-form" onSubmit={submitProfile}>
        <fieldset>
          <legend>Profile & Appearance</legend>
          <div className="form-group"><label>Name</label><input name="name" value={form.name} onChange={onChange} required /></div>
          <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={onChange} required /></div>
          <div className="form-group">
            <label>Theme</label>
            <select name="theme" value={form.theme} onChange={onChange}>
              <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
            </select>
          </div>
          <div className="form-group">
            <label>Language</label>
            <select name="language" value={form.language} onChange={onChange}>
              <option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
            </select>
          </div>
          <div className="form-group">
            <label><input type="checkbox" name="notifications" checked={form.notifications} onChange={onChange} /> Enable Email Notifications</label>
          </div>
          <button type="submit">Save Profile Settings</button>
        </fieldset>
      </form>

      <form className="settings-form" onSubmit={submitPassword}>
        <fieldset>
          <legend>Change Password</legend>
          <Password name="password" label="Current Password" />
          <Password name="newPassword" label="New Password" />
          <Password name="confirmPassword" label="Confirm New Password" />
          <button type="submit">Change Password</button>
        </fieldset>
      </form>
    </div>
  );
};

export default Settings;
