import React, { useMemo, useState } from 'react';

const FACULTY = [
  { id: 1, name: 'Dr. Alice Tan', email: 'alice.tan@univ.edu', department: 'Computer Science', rank: 'Associate Professor' },
  { id: 2, name: 'Prof. Bob Cruz', email: 'bob.cruz@univ.edu', department: 'Engineering', rank: 'Professor' },
  { id: 3, name: 'Dr. Michelle Yu', email: 'michelle.yu@univ.edu', department: 'Law', rank: 'Assistant Professor' },
];

const Directory = () => {
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');

  const filtered = useMemo(() =>
    FACULTY.filter(f =>
      (f.name + f.email).toLowerCase().includes(q.toLowerCase()) &&
      (dept ? f.department === dept : true)
    ), [q, dept]
  );

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Faculty Directory</h1>

      <div className="table-controls">
        <input placeholder="Search name or email..." value={q} onChange={e => setQ(e.target.value)} />
        <select value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Engineering">Engineering</option>
          <option value="Law">Law</option>
        </select>
      </div>

      <table className="logs-table">
        <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Rank</th></tr></thead>
        <tbody>
          {filtered.map(f => (
            <tr key={f.id}>
              <td>{f.name}</td>
              <td>{f.email}</td>
              <td>{f.department}</td>
              <td>{f.rank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Directory;
