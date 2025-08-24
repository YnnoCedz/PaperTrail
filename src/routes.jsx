// src/routes.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// public
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminActivityLogs from './pages/admin/AdminActivityLogs';
import AdminIntegrityMonitor from './pages/admin/AdminIntegrityMonitor';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminNotifications from './pages/admin/AdminNotifications';

// ETS
import ETSDashboard from './pages/ets/ETSDashboard';
import ETSResearchMonitoring from './pages/ets/ETSResearchMonitoring';
import ETSApprovals from './pages/ets/ETSApprovals';
import ETSStatistics from './pages/ets/ETSStatistics';
import ETSNotifications from './pages/ets/ETSNotifications';
import ETSSettings from './pages/ets/ETSSettings';
import ETSFacultyMonitor from './pages/ets/ETSFacultyMonitor';
import ETSFacultyProfile from './pages/ets/ETSFacultyProfile';

// RDS
import RDSDashboard from './pages/rds/RDSDashboard';
import RDSFacultyMonitor from './pages/rds/RDSFacultyMonitor';
import RDSFacultyProfile from './pages/rds/RDSFacultyProfile';
import RDSResearchMonitoring from './pages/rds/RDSResearchMonitoring';
import RDSStatistics from './pages/rds/RDSStatistics';
import RDSSettings from './pages/rds/RDSSettings';
import RDSNotifications from './pages/rds/RDSNotifications';

// user (shared pages)
import UserDashboard from './pages/user/Dashboard';
import UserSubmissions from './pages/user/Submissions';
import UserProfile from './pages/user/Profile';
import UserNotifications from './pages/user/Notifications';
import UserSettings from './pages/user/Settings';
import UserDirectory from './pages/user/Directory'; // ✅ missing import added

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },

  // ADMIN
  {
    path: '/admin',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <AdminUserManagement /> },
      { path: 'logs', element: <AdminActivityLogs /> },
      { path: 'integrity', element: <AdminIntegrityMonitor /> },
      { path: 'analytics', element: <AdminAnalytics /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'notifications', element: <AdminNotifications /> },
    ],
  },

  // ETS
  {
    path: '/ets',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <ETSDashboard /> },
      { path: 'research-monitoring', element: <ETSResearchMonitoring /> },
      { path: 'approvals', element: <ETSApprovals /> },
      { path: 'statistics', element: <ETSStatistics /> },
      { path: 'notifications', element: <ETSNotifications /> },
      { path: 'settings', element: <ETSSettings /> },
      { path: 'faculty', element: <ETSFacultyMonitor /> },
      { path: 'faculty/:id', element: <ETSFacultyProfile /> },
    ],
  },

  // RDS
  {
    path: '/rds',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <RDSDashboard /> },
      { path: 'research-monitoring', element: <RDSResearchMonitoring /> },
      { path: 'statistics', element: <RDSStatistics /> },
      { path: 'notifications', element: <RDSNotifications /> },
      { path: 'settings', element: <RDSSettings /> },
      { path: 'faculty', element: <RDSFacultyMonitor /> },
      { path: 'faculty/:id', element: <RDSFacultyProfile /> },
    ],
  },

  // FACULTY (uses shared user pages)
  {
    path: '/faculty',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <UserDashboard /> },
      { path: 'submissions', element: <UserSubmissions /> },
      { path: 'profile', element: <UserProfile /> },
      { path: 'notifications', element: <UserNotifications /> },
      { path: 'settings', element: <UserSettings /> },
      { path: 'directory', element: <UserDirectory /> },
    ],
  },

  // RESEARCH STAFF (uses shared user pages)
  {
    path: '/staff',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <UserDashboard /> },
      { path: 'submissions', element: <UserSubmissions /> },
      { path: 'profile', element: <UserProfile /> },
      { path: 'notifications', element: <UserNotifications /> },
      { path: 'settings', element: <UserSettings /> },
      { path: 'directory', element: <UserDirectory /> },
    ],
  },

  // DEAN (uses shared user pages)
  {
    path: '/dean',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <UserDashboard /> },
      { path: 'submissions', element: <UserSubmissions /> },
      { path: 'profile', element: <UserProfile /> },
      { path: 'notifications', element: <UserNotifications /> },
      { path: 'settings', element: <UserSettings /> },
      { path: 'directory', element: <UserDirectory /> },
    ],
  },
]);

export default router;
