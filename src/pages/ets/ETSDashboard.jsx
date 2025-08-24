// src/pages/ets/ETSDashboard.jsx
import React from 'react';

const ETSDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1 className="page-title">ETS Dashboard</h1>
      <p className="overview">Welcome to the ETS section of the Research Portal.</p>

      <div className="analytics-grid">
        <div className="stat-card">
          <h3>Submissions</h3>
          <p>132</p>
        </div>
        <div className="stat-card">
          <h3>Pending Reviews</h3>
          <p>15</p>
        </div>
        <div className="stat-card">
          <h3>Approved Projects</h3>
          <p>84</p>
        </div>
      </div>

      <section className="logs-preview">
        <h2 className="logs-title">Recent ETS Activity</h2>
        <table className="logs-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Activity</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2025-07-02</td>
              <td>Approved submission from Dr. Smith</td>
              <td>ETS Officer</td>
            </tr>
            <tr>
              <td>2025-07-01</td>
              <td>Commented on research proposal</td>
              <td>ETS Analyst</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default ETSDashboard;
