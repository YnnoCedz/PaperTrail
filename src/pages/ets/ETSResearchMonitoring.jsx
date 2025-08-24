import React, { useState } from 'react';
import { FaFileAlt } from 'react-icons/fa';

const dummySubmissions = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  task: i % 3 === 0 ? 'Quarterly Research Report' : i % 3 === 1 ? 'Annual Publication List' : 'Thesis Proposal Review',
  submitter: i % 2 === 0 ? 'Dr. Alice Tan' : 'Prof. Bob Cruz',
  rank: i % 2 === 0 ? 'Assistant Professor' : 'Associate Professor',
  department: i % 2 === 0 ? 'Computer Science' : 'Engineering',
  dueDate: '2025-07-10',
  submittedDate: i % 3 === 1 ? '' : '2025-07-08',
  file: i % 3 === 1 ? '' : `submission_${i + 1}.pdf`,
  progress: i % 3 === 0 ? 'Submitted' : i % 3 === 1 ? 'Pending' : 'Reviewed'
}));

const getProgressValue = (status) => {
  switch (status) {
    case 'Pending': return 0;
    case 'Submitted': return 50;
    case 'Reviewed': return 100;
    default: return 0;
  }
};

const ROWS_PER_PAGE = 15;

const ETSResearchMonitoring = ({ submissions = dummySubmissions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const applyPreset = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      const iso = today.toISOString().split('T')[0];
      setStartDate(iso);
      setEndDate(iso);
    } else if (preset === 'week') {
      const first = new Date(today.setDate(today.getDate() - today.getDay() + 1)).toISOString().split('T')[0];
      const last = new Date(today.setDate(today.getDate() - today.getDay() + 7)).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    } else if (preset === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    }
  };

  const filtered = submissions.filter(entry => {
    const matchText = (entry.task + entry.submitter).toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? entry.progress === statusFilter : true;
    const date = new Date(entry.submittedDate);
    const isInDateRange =
      (!startDate || date >= new Date(startDate)) &&
      (!endDate || date <= new Date(endDate)) &&
      !!entry.submittedDate;

    return matchText && matchStatus && isInDateRange;
  });

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginatedData = filtered.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Research Monitoring</h1>

      <div className="table-controls">
        <input
          type="text"
          placeholder="Search task or submitter..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Submitted">Submitted</option>
          <option value="Reviewed">Reviewed</option>
        </select>

        <label>
          Start Date:
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </label>
      </div>

      <table className="logs-table">
        <thead>
          <tr>
            <th>Task / Report Type</th>
            <th>Submitter</th>
            <th>Academic Rank</th>
            <th>Department</th>
            <th>Due Date</th>
            <th>Date Submitted</th>
            <th>File</th>
            <th>Status</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map(entry => {
            const progress = getProgressValue(entry.progress);
            return (
              <tr key={entry.id}>
                <td>{entry.task}</td>
                <td>{entry.submitter}</td>
                <td>{entry.rank}</td>
                <td>{entry.department || '-'}</td>
                <td>{entry.dueDate}</td>
                <td>{entry.submittedDate || '-'}</td>
                <td>
                  {entry.file ? (
                    <a
                      href={`/files/${entry.file}`}
                      title="View File"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaFileAlt size={18} />
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{entry.progress}</td>
                <td>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination right">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ETSResearchMonitoring;
