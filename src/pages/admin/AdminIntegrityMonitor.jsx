// src/pages/admin/AdminIntegrityMonitor.jsx
import React from 'react';

const integrityData = [
  {
    docId: 'DOC-001',
    title: 'Quantum Research',
    status: 'Verified',
    createdAt: '2025-06-20 10:00',
    updatedAt: '2025-06-27 13:00'
  },
  {
    docId: 'DOC-002',
    title: 'AI Ethics in Medicine',
    status: 'Discrepancy',
    createdAt: '2025-06-19 14:25',
    updatedAt: '2025-06-27 12:45'
  },
  {
    docId: 'DOC-003',
    title: 'Blockchain for Education',
    status: 'Verified',
    createdAt: '2025-06-18 11:30',
    updatedAt: '2025-06-26 16:00'
  },
  {
    docId: 'DOC-004',
    title: 'Cybersecurity Paper',
    status: 'Verified',
    createdAt: '2025-06-17 09:45',
    updatedAt: '2025-06-25 11:15'
  },
  {
    docId: 'DOC-005',
    title: 'Plagiarism Detection Model',
    status: 'Discrepancy',
    createdAt: '2025-06-15 08:20',
    updatedAt: '2025-06-24 10:30'
  }
];

const AdminIntegrityMonitor = () => {
  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Blockchain Integrity Monitor</h1>
      <p className="overview">
        Monitor document authenticity via blockchain records and detect anomalies or unauthorized changes.
      </p>

      <div className="analytics-grid">
        <div className="stat-card">
          <h3>Total Documents On-chain</h3>
          <p>120</p>
        </div>
        <div className="stat-card">
          <h3>Verified Matches</h3>
          <p>115</p>
        </div>
        <div className="stat-card">
          <h3>Discrepancy Alerts</h3>
          <p>5</p>
        </div>
        <div className="stat-card">
          <h3>Last Chain Sync</h3>
          <p>2025-06-27 14:20</p>
        </div>
      </div>

      <section style={{ marginTop: '40px' }}>
        <h2 className="logs-title">Document Verification Logs</h2>
        <table className="logs-table">
          <thead>
            <tr>
              <th>Document ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {integrityData.map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.docId}</td>
                <td>{entry.title}</td>
                <td>
                  <span className={`status-badge ${entry.status === 'Verified' ? 'status-active' : 'status-archived'}`}>
                    {entry.status}
                  </span>
                </td>
                <td>{entry.createdAt}</td>
                <td>{entry.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminIntegrityMonitor;
