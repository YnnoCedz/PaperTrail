import React from 'react';
import { useLocation } from 'react-router-dom';

const roleFromPath = (pathname) =>
  pathname.startsWith('/dean') ? 'Dean'
  : pathname.startsWith('/faculty') ? 'Faculty'
  : pathname.startsWith('/staff') ? 'Research Staff'
  : 'User';

const Dashboard = () => {
  const area = roleFromPath(useLocation().pathname);

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">{area} Dashboard</h1>
      <p className="overview">Your quick overview of tasks and submissions.</p>

      <div className="analytics-grid">
        <div className="stat-card"><h3>Pending Tasks</h3><p>3</p></div>
        <div className="stat-card"><h3>Submitted</h3><p>12</p></div>
        <div className="stat-card"><h3>Reviewed</h3><p>7</p></div>
      </div>

      <section className="logs-preview">
        <h2 className="logs-title">Recent Activity</h2>
        <table className="logs-table">
          <thead><tr><th>Date</th><th>Activity</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>2025-08-02</td><td>Uploaded Quarterly Report</td><td>Submitted</td></tr>
            <tr><td>2025-08-01</td><td>Updated Publication List</td><td>Reviewed</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Dashboard;
