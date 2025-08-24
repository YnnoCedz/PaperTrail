import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminAnalytics = () => {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  const userData = {
    labels,
    datasets: [
      {
        label: 'Users Registered',
        data: [20, 35, 40, 50, 60, 80],
        borderColor: '#1e3a8a',
        backgroundColor: 'rgba(30,58,138,0.5)',
        tension: 0.4
      }
    ]
  };

  const paperData = {
    labels,
    datasets: [
      {
        label: 'Papers Uploaded',
        data: [10, 15, 25, 35, 50, 65],
        backgroundColor: '#22c55e'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Analytics Overview</h1>
      <p className="overview">Visual insights into platform performance.</p>

      <div className="analytics-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>150</p>
        </div>
        <div className="stat-card">
          <h3>Total Papers</h3>
          <p>320</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '400px' }}>
          <h2>Registrations Over Time</h2>
          <Line data={userData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Monthly User Signups' } } }} />
        </div>

        <div style={{ flex: 1, minWidth: '400px' }}>
          <h2>Papers Uploaded Over Time</h2>
          <Bar data={paperData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Monthly Uploads' } } }} />
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
