import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { findAllRecords } from '../models/recordModel.js';
import { sheetToCollection } from '../constants/sheets.js';
import { getField } from '../utils/helpers.js';
import { authenticateUser } from '../services/userService.js';
import mongoose from 'mongoose';

const USERS_COLLECTION = sheetToCollection('Users');

async function main() {
  await connectDB();
  const records = await findAllRecords(USERS_COLLECTION);
  console.log('Users in database:', records.length);
  for (const r of records) {
    console.log(' -', getField(r, ['Username']), '| role:', getField(r, ['Role']), '| hasPassword:', !!getField(r, ['Password']));
  }

  const login = await authenticateUser('superadmin', 'password123');
  console.log('Test login superadmin/password123:', login.success ? 'OK' : login.message);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
