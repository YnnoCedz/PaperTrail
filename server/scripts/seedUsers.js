// /server/scripts/seedUsers.js
import { pool } from '../config/db.js';
import { hashPassword } from '../utils/pbkdf2.js';

// Role IDs (must exist in roles table)
const ROLES = [
  { id: 1, name: 'Faculty' },
  { id: 2, name: 'Researcher Staff' },
  { id: 3, name: 'Extension Staff' },
  { id: 4, name: 'Chairperson – RDS' },
  { id: 5, name: 'Chairperson – ETS' },
  { id: 6, name: 'Dean' }
];

// One user per role
const DEFAULT_PASSWORD = 'P@perTrail123';
const USERS = [
  {
    username: 'faculty.demo',
    email: 'faculty.demo@demo.local',
    first_name: 'Alice',
    middle_name: null,
    last_name: 'Faculty',
    phone: '09170000001',
    address: 'Campus A',
    department_id: 10,
    rank_id: null,
    role_id: 1
  },
  {
    username: 'researcher.staff',
    email: 'researcher.staff@demo.local',
    first_name: 'Bob',
    middle_name: null,
    last_name: 'Research',
    phone: '09170000002',
    address: 'RDS Office',
    department_id: 20,
    rank_id: null,
    role_id: 2
  },
  {
    username: 'extension.staff',
    email: 'extension.staff@demo.local',
    first_name: 'Cara',
    middle_name: null,
    last_name: 'Extension',
    phone: '09170000003',
    address: 'ETS Office',
    department_id: 30,
    rank_id: null,
    role_id: 3
  },
  {
    username: 'rds.chair',
    email: 'rds.chair@demo.local',
    first_name: 'Rico',
    middle_name: null,
    last_name: 'RDS',
    phone: '09170000004',
    address: 'RDS Chair Office',
    department_id: 40,
    rank_id: null,
    role_id: 4
  },
  {
    username: 'ets.chair',
    email: 'ets.chair@demo.local',
    first_name: 'Ella',
    middle_name: null,
    last_name: 'ETS',
    phone: '09170000005',
    address: 'ETS Chair Office',
    department_id: 50,
    rank_id: null,
    role_id: 5
  },
  {
    username: 'dean.demo',
    email: 'dean.demo@demo.local',
    first_name: 'Diego',
    middle_name: null,
    last_name: 'Dean',
    phone: '09170000006',
    address: 'Dean Office',
    department_id: 60,
    rank_id: null,
    role_id: 6
  }
];

async function ensureRoles() {
  const sql = `INSERT INTO roles (id, name, active)
               VALUES (?, ?, 1)
               ON DUPLICATE KEY UPDATE name=VALUES(name), active=VALUES(active)`;
  for (const r of ROLES) {
    await pool.execute(sql, [r.id, r.name]);
  }
}

async function userExists(username, email) {
  const [rows] = await pool.execute(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    [username, email]
  );
  return rows.length ? rows[0].id : null;
}

async function logRegister(userId, meta = null) {
  await pool.execute(
    'INSERT INTO activity_logs (user_id, action, ip, user_agent, meta) VALUES (?,?,?,?,?)',
    [userId, 'REGISTER_SUCCESS', null, 'seed-script', meta ? JSON.stringify(meta) : null]
  );
}

async function run() {
  try {
    await ensureRoles();
    console.log('✅ Roles ensured');

    const now = new Date();

    for (const u of USERS) {
      const existsId = await userExists(u.username, u.email);
      if (existsId) {
        console.log(`↷ Skipped (exists): ${u.username} (${u.email})`);
        continue;
      }

      const password_hash = hashPassword(DEFAULT_PASSWORD);
      const [ins] = await pool.execute(
        `INSERT INTO users
         (username, email, password_hash, first_name, middle_name, last_name, phone, address,
          department_id, rank_id, role_id, active, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          u.username, u.email, password_hash, u.first_name, u.middle_name, u.last_name,
          u.phone, u.address, u.department_id, u.rank_id, u.role_id, 1, now, now
        ]
      );

      await logRegister(ins.insertId, { seeded: true, role_id: u.role_id });
      console.log(`✅ Created: ${u.username} / role_id=${u.role_id}`);
    }

    console.log('\n🎉 Done. Demo credentials:');
    for (const u of USERS) {
      console.log(`- ${u.username} / ${DEFAULT_PASSWORD}  [role_id=${u.role_id}]`);
    }
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
