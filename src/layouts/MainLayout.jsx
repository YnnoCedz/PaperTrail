import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Notification from '../components/Notification';
import { basePathByRoleId } from '../utils/roles.js';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' });

  const location = useLocation();
  const navigate = useNavigate();

  const openPaths = ['/login', '/register', '/forgot-password'];
  const isAuthPage = openPaths.includes(location.pathname);

  // theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme === 'dark') setDarkMode(true);
    else if (storedTheme === 'light') setDarkMode(false);
    else setDarkMode(prefersDark);
  }, []);
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // access control (role-based)
  useEffect(() => {
    if (isAuthPage) return; // auth pages are open

    const roleId = Number(localStorage.getItem('userRoleId') || 0);
    if (!roleId) {
      navigate('/login');
      return;
    }

    const base = basePathByRoleId(roleId); // e.g. /admin, /ets, /rds, /faculty, /staff, /dean
    if (!base) {
      navigate('/login');
      return;
    }

    // If current path doesn't belong to user's base area, push them to their dashboard
    if (!location.pathname.startsWith(base)) {
      navigate(`${base}/dashboard`, { replace: true });
    }
  }, [location.pathname, navigate, isAuthPage]);

  const triggerNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'info' }), 2000);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="layout">
        {!isAuthPage && (
          <Sidebar
            collapsed={!sidebarOpen && !isMobile}
            toggle={() => setSidebarOpen(!sidebarOpen)}
            isMobile={isMobile}
          />
        )}

        <div className="main-content">
          {!isAuthPage && (
            <TopBar
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              toggleTheme={() => setDarkMode(!darkMode)}
              darkMode={darkMode}
            />
          )}

          {notification.message && (
            <div className="notification-wrapper">
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ message: '', type: 'info' })}
              />
            </div>
          )}

          <main className="main-area">
            <Outlet context={{ triggerNotification }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
