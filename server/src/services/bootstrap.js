import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/hashPassword.js';
import { findAllRecords, insertRecord } from '../models/recordModel.js';
import { sheetToCollection } from '../constants/sheets.js';
import { getField } from '../utils/helpers.js';

const USERS_COLLECTION = sheetToCollection('Users');

/** Create default superadmin if Users collection is empty (first run / fresh DB). */
export async function ensureSuperAdmin() {
  const records = await findAllRecords(USERS_COLLECTION);
  if (records.length > 0) return;

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

  console.log('First-run setup: superadmin created (username=superadmin, password=password123)');
  console.log('Change this password after first login.');
}
