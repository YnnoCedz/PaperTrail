// src/pages/admin/AdminNotifications.jsx
import React from 'react';

const AdminNotifications = () => {
  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Notifications</h1>
      {/* Example table */}
      <table className="logs-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>john.doe</td>
            <td>Uploaded a paper</td>
            <td>2025-06-28 10:00</td>
          </tr>
          <tr>
            <td>sarah.smith</td>
            <td>Reviewed AI Ethics</td>
            <td>2025-06-28 09:45</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AdminNotifications;
