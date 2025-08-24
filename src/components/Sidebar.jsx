// src/components/Sidebar.jsx
import React from 'react';
import {
  FiHome, FiUsers, FiList, FiShield, FiBarChart2,
  FiChevronLeft, FiChevronRight, FiX, FiBookOpen, FiCheckCircle,
  FiSettings, FiBell, FiFolder, FiUser
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { basePathByRoleId } from '../utils/roles.js';

const Sidebar = ({ collapsed, toggle, isMobile }) => {
  const widthClass = collapsed ? 'sidebar collapsed' : 'sidebar expanded';

  // New logic: prefer numeric role id + basePathByRoleId
  const roleId = Number(localStorage.getItem('userRoleId') || 0);
  const roleStr = localStorage.getItem('userRole') || ''; // legacy string (fallback)

  // Area base: /admin, /ets, /rds, /dean, /faculty, /staff, or '/'
  const areaBase =
    basePathByRoleId(roleId) ||
    (roleStr === 'admin' ? '/admin'
      : roleStr?.startsWith('ets') ? '/ets'
      : roleStr?.startsWith('rds') ? '/rds'
      : roleStr === 'dean' ? '/dean'
      : roleStr === 'faculty' ? '/faculty'
      : roleStr === 'research-staff' ? '/staff'
      : '/');

  const isAdmin   = areaBase === '/admin';
  const isETS     = areaBase === '/ets';
  const isRDS     = areaBase === '/rds';
  const isDean    = areaBase === '/dean';
  const isFaculty = areaBase === '/faculty';
  const isStaff   = areaBase === '/staff';

  const isDeanFacultyStaff = isDean || isFaculty || isStaff;

  const dashboardPath = `${areaBase}/dashboard`;

  return (
    <aside className={`${widthClass} ${isMobile ? 'mobile-sidebar' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <span className="logo-text">PaperTrail</span>}
        <button onClick={toggle} className="sidebar-toggle-btn no-highlight" aria-label="Toggle sidebar">
          {isMobile ? <FiX /> : collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <Link to={dashboardPath} className="sidebar-link">
          <FiHome />
          {!collapsed && 'Dashboard'}
        </Link>

        {/* Admin */}
        {isAdmin && (
          <>
            <Link to="/admin/users" className="sidebar-link"><FiUsers /> {!collapsed && 'User Management'}</Link>
            <Link to="/admin/analytics" className="sidebar-link"><FiBarChart2 /> {!collapsed && 'Analytics'}</Link>
            <Link to="/admin/logs" className="sidebar-link"><FiList /> {!collapsed && 'Activity Logs'}</Link>
            <Link to="/admin/integrity" className="sidebar-link"><FiShield /> {!collapsed && 'Integrity Monitor'}</Link>
            <Link to="/admin/notifications" className="sidebar-link"><FiBell /> {!collapsed && 'Notifications'}</Link>
            <Link to="/admin/settings" className="sidebar-link"><FiSettings /> {!collapsed && 'Settings'}</Link>
          </>
        )}

        {/* ETS */}
        {isETS && (
          <>
            <Link to="/ets/faculty" className="sidebar-link"><FiUsers /> {!collapsed && 'Faculty Monitor'}</Link>
            <Link to="/ets/research-monitoring" className="sidebar-link"><FiBookOpen /> {!collapsed && 'Research Monitoring'}</Link>
            <Link to="/ets/approvals" className="sidebar-link"><FiCheckCircle /> {!collapsed && 'Research Approvals'}</Link>
            <Link to="/ets/statistics" className="sidebar-link"><FiBarChart2 /> {!collapsed && 'Department Stats'}</Link>
            <Link to="/ets/notifications" className="sidebar-link"><FiBell /> {!collapsed && 'Notifications'}</Link>
            <Link to="/ets/settings" className="sidebar-link"><FiSettings /> {!collapsed && 'Settings'}</Link>
          </>
        )}

        {/* RDS */}
        {isRDS && (
          <>
            <Link to="/rds/faculty" className="sidebar-link"><FiUsers /> {!collapsed && 'Faculty Monitor'}</Link>
            <Link to="/rds/research-monitoring" className="sidebar-link"><FiBookOpen /> {!collapsed && 'Research Monitoring'}</Link>
            <Link to="/rds/statistics" className="sidebar-link"><FiBarChart2 /> {!collapsed && 'Department Stats'}</Link>
            <Link to="/rds/notifications" className="sidebar-link"><FiBell /> {!collapsed && 'Notifications'}</Link>
            <Link to="/rds/settings" className="sidebar-link"><FiSettings /> {!collapsed && 'Settings'}</Link>
          </>
        )}

        {/* Dean / Faculty / Research Staff */}
        {isDeanFacultyStaff && (
          <>
            <Link to={`${areaBase}/submissions`} className="sidebar-link"><FiFolder /> {!collapsed && 'My Submissions'}</Link>
            <Link to={`${areaBase}/profile`} className="sidebar-link"><FiUser /> {!collapsed && 'My Profile'}</Link>
            {isDean && (
              <Link to={`${areaBase}/directory`} className="sidebar-link">
                <FiUsers /> {!collapsed && 'Directory'}
              </Link>
            )}
            <Link to={`${areaBase}/notifications`} className="sidebar-link"><FiBell /> {!collapsed && 'Notifications'}</Link>
            <Link to={`${areaBase}/settings`} className="sidebar-link"><FiSettings /> {!collapsed && 'Settings'}</Link>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
