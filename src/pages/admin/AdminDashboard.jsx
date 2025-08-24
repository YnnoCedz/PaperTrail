// src/pages/AdminDashboard.jsx
import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Admin Dashboard</h1>
      {/* Analytics Cards */}
      <section className="analytics-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>1,248</p>
        </div>
        <div className="stat-card">
          <h3>Papers Submitted</h3>
          <p>397</p>
        </div>
        <div className="stat-card">
          <h3>Reviews Completed</h3>
          <p>312</p>
        </div>
      </section>

      {/* Recent Logs */}
    <section className="logs-preview">
    <h2 className="logs-title">Recent Activity Logs</h2>
    <table className="logs-table">
        <thead>
        <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Target</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>10:42 AM</td>
            <td>John</td>
            <td>Reviewed</td>
            <td>AI Ethics in Education</td>
        </tr>
        <tr>
            <td>09:15 AM</td>
            <td>Sarah</td>
            <td>Submitted</td>
            <td>Quantum Paper v2</td>
        </tr>
        <tr>
            <td>Yesterday</td>
            <td>Admin</td>
            <td>Approved</td>
            <td>Blockchain Security</td>
        </tr>
        <tr>
            <td>2 days ago</td>
            <td>Daniel</td>
            <td>Registered</td>
            <td>daniel@lsu.edu</td>
        </tr>
        </tbody>
    </table>
    </section>

    </div>
  );
};

export default AdminDashboard;
