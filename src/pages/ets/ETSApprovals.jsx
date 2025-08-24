// src/pages/ets/ETSApprovals.jsx
import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaFileAlt } from 'react-icons/fa';

const initialApprovals = [
  { id: 1, title: 'Ethics Clearance for Study X', submitter: 'Dr. Alice Tan', rank: 'Asst. Professor', department: 'Computer Science', submittedDate: '2025-06-25', file: 'Ethics_Clearing.pdf', status: 'Pending' },
  { id: 2, title: 'Thesis Proposal Approval – Cruz', submitter: 'Prof. Bob Cruz', rank: 'Assoc. Professor', department: 'Engineering', submittedDate: '2025-06-30', file: '', status: 'Pending' },
  { id: 3, title: 'Publication Plan Review – Yu', submitter: 'Dr. Michelle Yu', rank: 'Full Professor', department: 'Law', submittedDate: '2025-06-28', file: 'Publication_Plan.pdf', status: 'Approved' }
];

const ETSApprovals = () => {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [modal, setModal] = useState({ visible: false, id: null, action: '' });

  const openModal = (id, action) => setModal({ visible: true, id, action });
  const closeModal = () => setModal({ visible: false, id: null, action: '' });

  const confirmChange = () => {
    setApprovals(prev => prev.map(item =>
      item.id === modal.id ? { ...item, status: modal.action } : item
    ));
    closeModal();
  };

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Research Approvals</h1>
      <p className="overview">Approve or reject requests submitted by faculty members.</p>

      <table className="logs-table">
        <thead>
          <tr>
            <th>Request Title</th><th>Submitter</th><th>Academic Rank</th><th>Department</th>
            <th>Date Submitted</th><th>Attachment</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {approvals.map(item => (
            <tr key={item.id}>
              <td>{item.title}</td><td>{item.submitter}</td><td>{item.rank}</td><td>{item.department}</td>
              <td>{item.submittedDate}</td>
              <td>
                {item.file ? (
                  <a href={`/files/${item.file}`} target="_blank" rel="noopener noreferrer" title="View attachment">
                    <FaFileAlt size={18} />
                  </a>
                ) : '-'}
              </td>
              <td><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span></td>
              <td>
                {item.status === 'Pending' ? (
                  <div className="action-buttons">
                    <button className="btn-approve" onClick={() => openModal(item.id, 'Approved')}>
                      <FaCheckCircle /> Approve
                    </button>
                    <button className="btn-reject" onClick={() => openModal(item.id, 'Rejected')}>
                      <FaTimesCircle /> Reject
                    </button>
                  </div>
                ) : <em>N/A</em>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Confirmation Modal */}
      {modal.visible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm {modal.action}</h3>
            <p>Are you sure you want to <strong>{modal.action.toLowerCase()}</strong> this request?</p>
            <div className="modal-actions">
              <button onClick={confirmChange} className="btn-approve">Yes</button>
              <button onClick={closeModal} className="btn-reject">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .action-buttons button {
          margin-right: 8px; padding: 5px 10px; border: none; border-radius: 4px;
          display: inline-flex; align-items: center; gap: 6px; font-weight: 500; cursor: pointer;
        }
        .btn-approve { background-color: #28a745; color: white; }
        .btn-reject { background-color: #dc3545; color: white; }
        .btn-approve:hover { background-color: #218838; }
        .btn-reject:hover { background-color: #c82333; }

        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white; padding: 2rem; border-radius: 8px; width: 320px;
          text-align: center;
        }
        .modal-actions { margin-top: 1rem; display: flex; justify-content: center; gap: 10px; }
      `}</style>
    </div>
  );
};

export default ETSApprovals;
