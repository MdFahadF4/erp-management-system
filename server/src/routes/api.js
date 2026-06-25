import express from 'express';
import {
  authenticateUser,
  createUser,
  changeUserPassword,
  resetForgotPassword,
  updateUserAdmin
} from '../services/userService.js';
import {
  createGenericRecord,
  fetchGenericRecords,
  updateGenericRecord,
  deleteGenericRecord
} from '../services/recordService.js';
import {
  syncDeliveryQueue,
  syncHrMaster,
  syncSupplierMaster,
  syncCustomerMaster
} from '../services/syncService.js';
import { errorResponse } from '../utils/helpers.js';

const router = express.Router();

function checkAccountStatus() {
  const status = String(process.env.ADMIN_ACCOUNT_STATUS || '').trim().toUpperCase();
  if (status && status !== 'ACTIVE') {
    return errorResponse(
      'CONNECTION SUSPENDED: Please contact support to reactivate your account.'
    );
  }
  return null;
}

function checkToken(token) {
  const secret = process.env.CLIENT_TOKEN;
  if (!secret || token !== secret) {
    return errorResponse('UNAUTHORIZED: Invalid security token.');
  }
  return null;
}

/** Same POST contract as Google Apps Script doPost — frontend needs minimal changes */
router.post('/', async (req, res) => {
  try {
    const suspended = checkAccountStatus();
    if (suspended) return res.json(suspended);

    const { action, payload, token } = req.body || {};
    const unauthorized = checkToken(token);
    if (unauthorized) return res.json(unauthorized);

    let response = errorResponse('Unknown action');

    switch (action) {
      case 'LOGIN':
        response = await authenticateUser(payload.username, payload.password);
        break;
      case 'CREATE_USER':
        response = await createUser(payload.newUser, payload.actorUsername, payload.actorRole);
        break;
      case 'CREATE_RECORD':
        response = await createGenericRecord(payload.sheetName, payload.rowData);
        break;
      case 'FETCH_RECORDS':
        response = await fetchGenericRecords(payload.sheetName);
        break;
      case 'UPDATE_RECORD':
        response = await updateGenericRecord(
          payload.sheetName,
          payload.recordId || payload.id,
          payload.rowData
        );
        break;
      case 'DELETE_RECORD':
        response = await deleteGenericRecord(
          payload.sheetName,
          payload.recordId || payload.id
        );
        break;
      case 'CHANGE_PASSWORD':
        response = await changeUserPassword(
          payload.username,
          payload.oldPassword,
          payload.newPassword
        );
        break;
      case 'RESET_PASSWORD':
        response = await resetForgotPassword(payload);
        break;
      case 'UPDATE_USER':
        response = await updateUserAdmin(payload);
        break;
      case 'SYNC_DELIVERY_QUEUE':
        response = await syncDeliveryQueue();
        break;
      case 'SYNC_HR_MASTER':
        response = await syncHrMaster();
        break;
      case 'SYNC_SUPPLIER_MASTER':
        response = await syncSupplierMaster();
        break;
      case 'SYNC_CUSTOMER_MASTER':
        response = await syncCustomerMaster();
        break;
      default:
        break;
    }

    res.json({
      ...response,
      status: response.success ? 'success' : 'error'
    });
  } catch (error) {
    console.error('API error:', error);
    res.json({
      success: false,
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

export default router;
