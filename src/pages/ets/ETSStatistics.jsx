import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

// ---- Mock Data (replace with API later) ----
const DEPARTMENTS = ['All', 'Computer Science', 'Engineering', 'Law'];
const YEARS = ['2023', '2024', '2025'];

const MOCK = {
  totals: {
    'Computer Science': { researchers: 42, publications: 120, inReview: 18, accepted: 72, rejected: 30 },
    Engineering:         { researchers: 33, publications: 88,  inReview: 22, accepted: 50, rejected: 16 },
    Law:                 { researchers: 21, publications: 57,  inReview: 12, accepted: 32, rejected: 13 },
  },
  monthlySubmissions: {
    '2025': {
      'Computer Science': [10, 12, 14, 9, 16, 18, 12, 11, 13, 17, 15, 19],
      Engineering:         [8,  7,  10, 9, 12, 11, 13, 10, 12, 14, 13, 15],
      Law:                 [4,  5,   6, 5,  7,  8,  6,  5,  7,  9,  8, 10],
    },
    '2024': {
      'Computer Science': [8,  9,  11, 10, 12, 13, 11, 10, 12, 13, 12, 14],
      Engineering:         [7,  6,   9,  8, 10,  9, 11,  9, 11, 12, 10, 12],
      Law:                 [3,  4,   5,  4,  6,  6,  5,  4,  6,  7,  6,  8],
    },
    '2023': {
      'Computer Science': [6,  7,   9,  8, 10, 11,  9,  8, 10, 11, 10, 12],
      Engineering:         [5,  5,   7,  6,  8,  8,  7,  6,  8,  9,  8, 10],
      Law:                 [2,  3,   4,  3,  5,  5,  4,  3,  5,  6,  5,  7],
    },
  },
  topPublishers: [
    { department: 'Computer Science', title: 'AI for Legal Analytics', count: 18 },
    { department: 'Engineering', title: 'Optimized Microgrid Systems', count: 12 },
    { department: 'Law', title: 'Data Privacy & Jurisprudence', count: 9 },
  ],
};

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ETSStatistics = () => {
  const [dept, setDept] = useState('All');
  const [year, setYear] = useState('2025');

  // Aggregate totals based on selected department
  const totals = useMemo(() => {
    if (dept !== 'All') return MOCK.totals[dept];
    // Sum across departments
    return Object.values(MOCK.totals).reduce((acc, cur) => ({
      researchers: acc.researchers + cur.researchers,
      publications: acc.publications + cur.publications,
      inReview: acc.inReview + cur.inReview,
      accepted: acc.accepted + cur.accepted,
      rejected: acc.rejected + cur.rejected,
    }), { researchers: 0, publications: 0, inReview: 0, accepted: 0, rejected: 0 });
  }, [dept]);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const base = MOCK.monthlySubmissions[year];
    if (!base) return Array(12).fill(0);
    if (dept !== 'All') return base[dept] || Array(12).fill(0);
    // Sum monthly across departments
    return months.map((_, i) =>
      DEPARTMENTS.slice(1).reduce((sum, d) => sum + (base[d]?.[i] || 0), 0)
    );
  }, [dept, year]);

  // Status distribution for doughnut
  const statusForChart = useMemo(() => {
    const { inReview, accepted, rejected } = totals;
    return [inReview, accepted, rejected];
  }, [totals]);

  // Chart configs
  const barData = {
    labels: months,
    datasets: [
      {
        label: `Monthly Submissions (${dept === 'All' ? 'All Departments' : dept}) - ${year}`,
        data: monthlyData,
        backgroundColor: 'rgba(30,58,138,0.6)',
        borderColor: '#1e3a8a',
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: ['In Review', 'Accepted', 'Rejected'],
    datasets: [{
      data: statusForChart,
      backgroundColor: ['#fbbf24', '#22c55e', '#ef4444'],
      borderColor: ['#b45309', '#166534', '#7f1d1d'],
      borderWidth: 1,
    }],
  };

  const lineData = {
    labels: months,
    datasets: [
      {
        label: 'Cumulative Publications',
        data: monthlyData.reduce((acc, n, i) => {
          acc.push((acc[i - 1] || 0) + n);
          return acc;
        }, []),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.2)',
        tension: 0.35,
        fill: true,
      }
    ],
  };

  const baseOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Department Statistics</h1>
      <p className="overview">Overview of departmental research metrics and analytics.</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={dept} onChange={e => setDept(e.target.value)}>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stat Cards */}
      <div className="analytics-grid" style={{ marginTop: 0 }}>
        <div className="stat-card">
          <h3>Researchers</h3>
          <p>{totals.researchers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Publications</h3>
          <p>{totals.publications}</p>
        </div>
        <div className="stat-card">
          <h3>In Review</h3>
          <p>{totals.inReview}</p>
        </div>
        <div className="stat-card">
          <h3>Accepted</h3>
          <p>{totals.accepted}</p>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <p>{totals.rejected}</p>
        </div>
      </div>

      {/* Charts Row */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card-like">
            <h2 style={{ marginBottom: 10 }}>Monthly Submissions</h2>
            <Bar data={barData} options={baseOptions} />
          </div>
          <div className="card-like">
            <h2 style={{ marginBottom: 10 }}>Status Distribution</h2>
            <Doughnut data={doughnutData} />
          </div>
        </div>
      </section>

      {/* Trend Line */}
      <section>
        <div className="card-like">
          <h2 style={{ marginBottom: 10 }}>Cumulative Trend</h2>
          <Line data={lineData} options={baseOptions} />
        </div>
      </section>

      {/* Top publishers table */}
      <section>
        <h2 style={{ marginBottom: 10 }}>Top Topics by Department</h2>
        <table className="logs-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Top Topic / Title</th>
              <th>Publications</th>
            </tr>
          </thead>
          <tbody>
            {MOCK.topPublishers
              .filter(row => dept === 'All' || row.department === dept)
              .map((row, idx) => (
              <tr key={idx}>
                <td>{row.department}</td>
                <td>{row.title}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default ETSStatistics;
