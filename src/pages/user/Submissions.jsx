import React, { useMemo, useState } from 'react';
import { FaFileAlt } from 'react-icons/fa';

const DATA = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  title: i % 2 ? 'Quarterly Research Report' : 'Annual Publication List',
  type: i % 2 ? 'Report' : 'List',
  submittedAt: i % 3 ? '2025-08-01' : '',
  status: i % 3 === 0 ? 'Pending' : i % 3 === 1 ? 'Submitted' : 'Reviewed',
  file: i % 3 ? `user_file_${i + 1}.pdf` : '',
}));

const Submissions = () => {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const filtered = useMemo(
    () => DATA.filter(d =>
      (d.title + d.type).toLowerCase().includes(q.toLowerCase()) &&
      (status ? d.status === status : true)
    ), [q, status]
  );

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">My Submissions</h1>

      <div className="table-controls">
        <input placeholder="Search title..." value={q} onChange={e => setQ(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Submitted">Submitted</option>
          <option value="Reviewed">Reviewed</option>
        </select>
      </div>

      <table className="logs-table">
        <thead>
          <tr>
            <th>Title</th><th>Type</th><th>Date Submitted</th><th>Status</th><th>File</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(s => (
            <tr key={s.id}>
              <td>{s.title}</td>
              <td>{s.type}</td>
              <td>{s.submittedAt || '-'}</td>
              <td>{s.status}</td>
              <td>
                {s.file ? (
                  <a href={`/files/${s.file}`} target="_blank" rel="noopener noreferrer" title="Open file">
                    <FaFileAlt size={18} />
                  </a>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Submissions;
