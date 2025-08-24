import React from 'react';

const ETSNotifications = () => {
  // mock data — swap with API later
  const items = [
    { id: 1, user: 'prof.alice', action: 'Submitted Quarterly Research Report', time: '2025-07-02 14:10' },
    { id: 2, user: 'dr.bob', action: 'Updated Publication List', time: '2025-07-02 09:27' },
    { id: 3, user: 'dr.michelle', action: 'Requested Ethics Clearance', time: '2025-07-01 16:40' },
  ];

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Notifications</h1>
      <table className="logs-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {items.map(n => (
            <tr key={n.id}>
              <td>{n.user}</td>
              <td>{n.action}</td>
              <td>{n.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ETSNotifications;
