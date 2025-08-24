// src/pages/rds/RDSDashboard.jsx
import React from 'react';

const RDSDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1 className="page-title">RDS Dashboard</h1>
      <p className="overview">Welcome to the RDS section of the Research Portal.</p>

      <div className="analytics-grid">
        <div className="stat-card">
          <h3>Submissions</h3>
          <p>98</p>
        </div>
        <div className="stat-card">
          <h3>Pending Reviews</h3>
          <p>12</p>
        </div>
        <div className="stat-card">
          <h3>Approved Projects</h3>
          <p>76</p>
        </div>
      </div>

      <section className="logs-preview">
        <h2 className="logs-title">Recent RDS Activity</h2>
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
              <td>2025-07-28</td>
              <td>Reviewed project proposal: "AI in Agriculture"</td>
              <td>RDS Reviewer</td>
            </tr>
            <tr>
              <td>2025-07-25</td>
              <td>Approved research funding request</td>
              <td>RDS Chairperson</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default RDSDashboard;
