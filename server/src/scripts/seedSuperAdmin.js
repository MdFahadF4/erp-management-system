import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { hashPassword } from '../utils/hashPassword.js';
import { findAllRecords, insertRecord } from '../models/recordModel.js';
import { sheetToCollection } from '../constants/sheets.js';
import { getField } from '../utils/helpers.js';
import { v4 as uuidv4 } from 'uuid';

const USERS_COLLECTION = sheetToCollection('Users');

async function seed() {
  await connectDB();
  const records = await findAllRecords(USERS_COLLECTION);
  const exists = records.some(
    (r) =>
      String(getField(r, ['Username']) || '')
        .trim()
        .toLowerCase() === 'superadmin'
  );

  if (exists) {
    console.log('Super Admin already exists — skipping seed.');
    process.exit(0);
  }

  await insertRecord(USERS_COLLECTION, {
    ID: uuidv4(),
    Username: 'superadmin',
    Password: hashPassword('password123'),
    Role: 'Super Admin',
    Permissions: 'ALL',
    'Created By': 'System',
    'Created Date': new Date(),
    Mobile: '',
    Email: '',
    Status: 'Active'
  });

  console.log('Super Admin created: username=superadmin, password=password123');
  console.log('Change this password after first login!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
