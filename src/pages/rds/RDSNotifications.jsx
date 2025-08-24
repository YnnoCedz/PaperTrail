// src/pages/rds/RDSNotifications.jsx
import React, { useState } from 'react';

const initial = [
  { id: 1, message: 'New proposal submitted by Dr. Lovelace', date: '2025-08-05', type: 'info' },
  { id: 2, message: 'Project “Policy Impact Metrics” moved to Ongoing', date: '2025-08-04', type: 'success' },
  { id: 3, message: 'Review overdue for Project #103', date: '2025-08-01', type: 'warning' },
];

const typeColor = (t) => {
  switch (t) {
    case 'success': return { background: '#dcfce7', color: '#14532d' };
    case 'warning': return { background: '#fef9c3', color: '#713f12' };
    case 'info':
    default: return { background: '#e0f2fe', color: '#0c4a6e' };
  }
};

const RDSNotifications = () => {
  const [items] = useState(initial);

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Notifications</h1>

      <table className="logs-table">
        <thead>
          <tr>
            <th>Message</th>
            <th>Type</th>
            <th>Date/Time</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: 16 }}>No notifications 🎉</td>
            </tr>
          ) : (
            items.map(n => (
              <tr key={n.id}>
                <td>{n.message}</td>
                <td>
                  <span className="status-badge" style={{ ...typeColor(n.type) }}>
                    {n.type}
                  </span>
                </td>
                <td>{n.date}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RDSNotifications;
