import React, { useState, useRef, useEffect } from 'react';
import { FiSun, FiMoon, FiUser, FiBell, FiSettings, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ toggleSidebar, toggleTheme, darkMode }) => {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const accountRef = useRef();
  const notifRef = useRef();
  const navigate = useNavigate();

  const mockNotifs = [
    { id: 1, time: '2025-06-28 10:00', user: 'john.doe', action: 'Uploaded a new paper' },
    { id: 2, time: '2025-06-28 09:45', user: 'sarah.smith', action: 'Reviewed "AI in Law"' },
  ];

  const toggleAccountModal = () => setShowAccountModal(prev => !prev);
  const toggleNotifModal = () => setShowNotifModal(prev => !prev);

  useEffect(() => {
    const handleOutside = e => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setShowAccountModal(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifModal(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
    window.location.reload(); // This forces MainLayout to unmount
  };
  const goToSettings = () => {
    setShowAccountModal(false);
    navigate('/admin/settings');
  };
  const goToNotifications = () => {
    setShowAccountModal(false);
    navigate('/admin/notifications');
  };

  return (
    <header className="topbar">
      <p className="greeting">Good evening, <strong>Blockchain!</strong></p>
      <div className="topbar-icons">
        <button onClick={toggleTheme} className="theme-toggle-btn no-highlight" title="Toggle theme">
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
        <button className="notif-btn no-highlight" onClick={toggleNotifModal} title="Notifications">
          <FiBell />
        </button>
        <button className="account-btn no-highlight" onClick={toggleAccountModal} title="Account">
          <FiUser />
        </button>
      </div>

      {showNotifModal && (
        <div className="notification-modal" ref={notifRef}>
          <ul>
            {mockNotifs.map(n => (
              <li key={n.id}>
                <div className="notification-entry">
                  <div className="notif-user">{n.user}</div>
                  <div className="notif-detail">{n.action}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAccountModal && (
        <div className="account-modal" ref={accountRef}>
          <ul>
            <li><button onClick={goToSettings}><FiSettings style={{ marginRight: '8px' }} />Settings</button></li>
            <li><button onClick={goToNotifications}><FiBell style={{ marginRight: '8px' }} />Notifications</button></li>
            <li><button onClick={handleLogout} style={{ color: 'red' }}><FiLogOut style={{ marginRight: '8px' }} />Logout</button></li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default TopBar;
