import { getCol } from './recordHelpers.js';

export const TRANSFER_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

export function getTransferStatus(rec) {
  const raw = String(getCol(rec, ['Status']) || '').trim();
  if (!raw) return TRANSFER_STATUS.APPROVED;
  return raw;
}

export function isTransferApproved(rec) {
  return getTransferStatus(rec) === TRANSFER_STATUS.APPROVED;
}

export function isOwnerHandover(rec) {
  return !String(getCol(rec, ['Transfer To User', 'Transfer To']) || '').trim();
}

export function normUser(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

export function isAdminRole(user) {
  const r = String(user?.role || '')
    .trim()
    .toLowerCase();
  return r === 'super admin' || r === 'admin';
}

export function getTransferSender(rec) {
  return String(getCol(rec, ['Transferred By', 'Username', 'Logged By']) || '').trim();
}

export function getTransferRecipient(rec) {
  return String(getCol(rec, ['Transfer To User', 'Transfer To', 'Received By']) || '').trim();
}

export function userCanApproveTransfer(user, rec) {
  if (!user || !rec) return false;
  if (getTransferStatus(rec) !== TRANSFER_STATUS.PENDING) return false;
  const recipient = getTransferRecipient(rec);
  if (!recipient) return isAdminRole(user);
  return normUser(recipient) === normUser(user.username) || isAdminRole(user);
}

export function filterOutgoingTransfers(records, username) {
  const me = normUser(username);
  return (records || []).filter((rec) => normUser(getTransferSender(rec)) === me);
}

export function filterIncomingPendingTransfers(records, username) {
  const me = normUser(username);
  return (records || []).filter((rec) => {
    if (getTransferStatus(rec) !== TRANSFER_STATUS.PENDING) return false;
    const recipient = getTransferRecipient(rec);
    if (!recipient) return false;
    return normUser(recipient) === me;
  });
}

export function buildApproveTransferRowData(rec, approverUsername) {
  return [
    getCol(rec, ['Date']),
    getCol(rec, ['Amount']),
    getCol(rec, ['Remarks', 'Description']),
    getTransferSender(rec),
    getTransferRecipient(rec),
    TRANSFER_STATUS.APPROVED,
    String(approverUsername || '').trim(),
    new Date().toISOString(),
    getCol(rec, ['Stamp', 'Timestamp']) || new Date().toLocaleString()
  ];
}

export function transferStatusBadgeClass(status) {
  if (status === TRANSFER_STATUS.APPROVED) return 'bg-emerald-100 text-emerald-800';
  if (status === TRANSFER_STATUS.REJECTED) return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
}

export function resolveTransferRecipientLabel(rec, t) {
  const recipient = getTransferRecipient(rec);
  if (recipient) return recipient;
  return t?.('internalTransfer.ownerHandover') || 'Owner / Admin';
}
