import crypto from 'crypto';

/** Same SHA-256 hex digest as Google Apps Script hashPassword in Code.gs */
export function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex');
}
