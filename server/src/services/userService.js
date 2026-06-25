import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/hashPassword.js';
import { findAllRecords, insertRecord, updateRecordById } from '../models/recordModel.js';
import { sheetToCollection } from '../constants/sheets.js';
import {
  getField,
  normalizeEmail,
  normalizeMobile,
  errorResponse,
  successResponse
} from '../utils/helpers.js';

const USERS_COLLECTION = sheetToCollection('Users');

function getUserStatus(record) {
  const status = getField(record, ['Status', 'Account Status']);
  if (!status || String(status).trim() === '') return 'Active';
  return String(status).trim();
}

function findUserRowIndex(records, username) {
  const target = String(username || '').trim().toLowerCase();
  return records.findIndex(
    (r) =>
      String(getField(r, ['Username']) || '')
        .trim()
        .toLowerCase() === target
  );
}

export async function authenticateUser(username, password) {
  const records = await findAllRecords(USERS_COLLECTION);
  const inputHash = hashPassword(password);
  const targetUser = String(username || '').trim().toLowerCase();

  for (const row of records) {
    const rowUser = String(getField(row, ['Username']) || '')
      .trim()
      .toLowerCase();
    const rowHash = getField(row, ['Password']);
    if (rowUser === targetUser && rowHash === inputHash) {
      const status = getUserStatus(row);
      const statusKey = String(status || 'Active').trim().toLowerCase();
      if (statusKey === 'paused') {
        return errorResponse('Account paused. Contact your administrator.');
      }
      if (statusKey === 'removed') {
        return errorResponse('Account removed. Contact your administrator.');
      }
      const permsRaw = getField(row, ['Permissions']);
      return successResponse({
        userData: {
          username: getField(row, ['Username']),
          role: getField(row, ['Role']),
          permissions: String(permsRaw || '')
            .split(',')
            .map((p) => String(p).trim())
            .filter(Boolean),
          status
        }
      });
    }
  }
  return errorResponse('Invalid username or password');
}

export async function createUser(newUser, actorUsername, actorRole) {
  if (actorRole !== 'Super Admin' && actorRole !== 'Admin') {
    return errorResponse('Unauthorized.');
  }

  const records = await findAllRecords(USERS_COLLECTION);
  const exists = records.some(
    (r) =>
      String(getField(r, ['Username']) || '')
        .trim()
        .toLowerCase() ===
      String(newUser.username || '')
        .trim()
        .toLowerCase()
  );
  if (exists) return errorResponse('Username already exists.');

  await insertRecord(USERS_COLLECTION, {
    ID: uuidv4(),
    Username: newUser.username,
    Password: hashPassword(newUser.password),
    Role: newUser.role,
    Permissions: newUser.permissions,
    'Created By': actorUsername,
    'Created Date': new Date(),
    Mobile: newUser.mobile || '',
    Email: newUser.email || '',
    Status: 'Active'
  });

  return successResponse({ message: 'User created successfully!' });
}

export async function changeUserPassword(username, oldPassword, newPassword) {
  const records = await findAllRecords(USERS_COLLECTION);
  const idx = findUserRowIndex(records, username);
  if (idx === -1) return errorResponse('User not found.');

  const row = records[idx];
  if (getField(row, ['Password']) !== hashPassword(oldPassword)) {
    return errorResponse('Current password is incorrect.');
  }
  if (String(newPassword || '').length < 6) {
    return errorResponse('Password must be at least 6 characters.');
  }

  await updateRecordById(USERS_COLLECTION, row.ID, {
    ...row,
    Password: hashPassword(newPassword)
  });
  return successResponse({ message: 'Password changed successfully!' });
}

export async function resetForgotPassword(payload) {
  const username = String(payload.username || '').trim();
  const mobile = normalizeMobile(payload.mobile);
  const email = normalizeEmail(payload.email);
  const newPassword = payload.newPassword;

  if (!username || !newPassword) {
    return errorResponse('Username and new password are required.');
  }
  if (newPassword.length < 6) {
    return errorResponse('Password must be at least 6 characters.');
  }
  if (!mobile && !email) {
    return errorResponse('Enter the mobile or email registered on your account.');
  }

  const records = await findAllRecords(USERS_COLLECTION);
  const idx = findUserRowIndex(records, username);
  if (idx === -1) return errorResponse('No account found with that username.');

  const row = records[idx];
  const statusKey = getUserStatus(row).toLowerCase();
  if (statusKey === 'paused') {
    return errorResponse('Account is paused. Contact your administrator.');
  }
  if (statusKey === 'removed') {
    return errorResponse('Account was removed. Contact your administrator.');
  }

  const rowMobile = normalizeMobile(getField(row, ['Mobile']));
  const rowEmail = normalizeEmail(getField(row, ['Email']));
  const mobileOk = mobile && rowMobile && mobile === rowMobile;
  const emailOk = email && rowEmail && email === rowEmail;
  if (!mobileOk && !emailOk) {
    return errorResponse('Mobile or email does not match our records.');
  }

  await updateRecordById(USERS_COLLECTION, row.ID, {
    ...row,
    Password: hashPassword(newPassword)
  });
  return successResponse({
    message: 'Password reset successfully. You can sign in now.'
  });
}

export async function updateUserAdmin(payload) {
  if (payload.actorRole !== 'Super Admin' && payload.actorRole !== 'Admin') {
    return errorResponse('Unauthorized.');
  }

  const records = await findAllRecords(USERS_COLLECTION);
  const idx = findUserRowIndex(records, payload.username);
  if (idx === -1) return errorResponse('User not found.');

  const row = { ...records[idx] };
  const targetRole = String(getField(row, ['Role']) || '');
  if (targetRole === 'Super Admin' && payload.actorRole !== 'Super Admin') {
    return errorResponse('Only Super Admin can modify Super Admin accounts.');
  }

  if (payload.role !== undefined && payload.role !== null) {
    if (payload.role === 'Super Admin' && payload.actorRole !== 'Super Admin') {
      return errorResponse('Only Super Admin can assign Super Admin role.');
    }
    row.Role = payload.role;
  }
  if (payload.permissions !== undefined) row.Permissions = String(payload.permissions);
  if (payload.mobile !== undefined) row.Mobile = payload.mobile;
  if (payload.email !== undefined) row.Email = payload.email;
  if (payload.status !== undefined) row.Status = payload.status;
  if (payload.newPassword) {
    if (String(payload.newPassword).length < 6) {
      return errorResponse('Password must be at least 6 characters.');
    }
    row.Password = hashPassword(payload.newPassword);
  }

  await updateRecordById(USERS_COLLECTION, row.ID, row);
  return successResponse({ message: 'User account updated successfully.' });
}
