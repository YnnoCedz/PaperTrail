// /server/index.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ---- Paths / env (Node 22 loads .env via --env-file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- DB + Mailer
import { pool } from './config/db.js';
import { transporter } from './utils/mailer.js';

// ---- Routes (minimal set)
import userRoutes from './routes/users.js';
import passwordResetRoutes from './routes/passwordReset.js';
import registrationRoutes from './routes/registration.js';
// RDS
import rdsFacultyRouter from './routes/rds/rdsFaculty.js';
import rdsSettingsRouter from './routes/rds/rdsSettings.js';

//ETS
import etsFacultyRouter from './routes/ets/etsFaculty.js';
import etsSettingsRouter from './routes/ets/etsSettings.js';
import referenceRoutes from './routes/reference.js';

//USER
import userProfileRoutes from './routes/user/profile.js';


// ---- ADMIN Routes
import usersManagementRoutes from './routes/usersManagement.js';
import activityLogsRouter from './routes/activityLogs.js';



const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// ---- Middleware
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Serve uploads from project-root /uploads
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// ---- Health
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---- Routes
app.use('/api/users', userRoutes);
app.use('/api/users', passwordResetRoutes); // shares /api/users base
app.use('/api/registration', registrationRoutes);


// ---- ADMIN Routes
app.use('/api/users-management', usersManagementRoutes);
app.use('/api/activity-logs', activityLogsRouter);

//RDS
app.use('/api/rds', rdsFacultyRouter);
app.use('/api/rds', rdsSettingsRouter);

//ETS
app.use('/api/ets', etsFacultyRouter);
app.use('/api/ets', etsSettingsRouter);
app.use('/api', referenceRoutes);

//user
app.use('/api/user', userProfileRoutes);


// Root
app.get('/', (req, res) => {
  res.send('✅ Server running and connected to MySQL!');
});

// ---- Boot checks: DB + Mailer, then start
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log(`✅ MySQL connected (${process.env.DB_NAME})`);
  } catch (e) {
    console.error('❌ MySQL connection error:', e.message);
  }

  try {
    await transporter.verify();
    console.log('✅ Mailer is ready to send messages');
  } catch (e) {
    console.error('❌ Mailer config error:', e.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();

// ---- 404 + Error handlers
app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({ message: 'Server error' });
});
