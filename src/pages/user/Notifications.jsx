import React from 'react';

const items = [
  { id: 1, message: 'Your Quarterly Report was reviewed.', time: '2025-08-02 14:10' },
  { id: 2, message: 'Reminder: Submit Publication List by Aug 15.', time: '2025-08-01 09:20' },
];

const Notifications = () => (
  <div className="admin-dashboard">
    <h1 className="page-title">Notifications</h1>
    <table className="logs-table">
      <thead><tr><th>Message</th><th>Time</th></tr></thead>
      <tbody>
        {items.map(x => (
          <tr key={x.id}>
            <td>{x.message}</td>
            <td>{x.time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Notifications;
