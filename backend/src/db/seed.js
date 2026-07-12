import bcrypt from 'bcryptjs';
import { initDb, getDb } from '../config/db.js';

async function seed() {
  console.log('Starting database seeding...');
  await initDb();
  const db = getDb();

  console.log('Clearing existing users data...');
  await db.run('DELETE FROM users');

  console.log('Seeding default users...');
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const priyaHash = await bcrypt.hash('employee123', salt);

  // Seed default admin
  await db.run(
    `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
    'System Admin',
    'admin@assetflow.com',
    adminHash,
    'Admin',
    'Active'
  );

  // Seed default employee
  await db.run(
    `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
    'Priya Sharma',
    'priya@assetflow.com',
    priyaHash,
    'Employee',
    'Active'
  );

  console.log('Database seeding completed successfully.');
}

seed().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
