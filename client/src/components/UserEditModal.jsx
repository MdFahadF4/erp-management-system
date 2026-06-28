import { useEffect, useState } from 'react';
import UserPermGrid from './UserPermGrid.jsx';
import PasswordInput from './PasswordInput.jsx';
import { updateUser } from '../services/dataService.js';
import { parsePermissionMap } from '../utils/userSession.js';
import { permissionsToString } from '../lib/userPermHelpers.js';
import { getCol } from '../lib/dualHeadEngine.js';

function getUserRole(rec) {
  return String(getCol(rec, ['Role']) || 'User').trim();
}

function getUserStatus(rec) {
  return String(getCol(rec, ['Status', 'Account Status']) || 'Active').trim() || 'Active';
}

export default function UserEditModal({ open, record, actor, onClose, onSaved, onSessionRefresh }) {
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [status, setStatus] = useState('Active');
  const [password, setPassword] = useState('');
  const [permMap, setPermMap] = useState({});
  const [saving, setSaving] = useState(false);

  const username = record ? String(getCol(record, ['Username']) || '').trim() : '';
  const isSuperAdmin = getUserRole(record || {}) === 'Super Admin';
  const roleLocked = isSuperAdmin;

  useEffect(() => {
    if (!open || !record) return;
    setMobile(getCol(record, ['Mobile', 'Mobile Contact']) || '');
    setEmail(getCol(record, ['Email', 'Email Address']) || '');
    setRole(getUserRole(record));
    setStatus(getUserStatus(record));
    setPassword('');
    setPermMap(parsePermissionMap(getCol(record, ['Permissions']) || ''));
  }, [open, record]);

  if (!open || !record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        username,
        role: isSuperAdmin ? 'Super Admin' : role,
        permissions:
          role === 'Admin' || isSuperAdmin ? 'all' : permissionsToString(permMap),
        mobile: mobile.trim(),
        email: email.trim(),
        status,
        actorUsername: actor.username,
        actorRole: actor.role
      };
      if (password.trim()) payload.newPassword = password.trim();
      const res = await updateUser(payload);
      alert(res.message || (res.success ? 'User updated.' : 'Update failed.'));
      if (res.success) {
        if (username.toLowerCase() === String(actor.username || '').trim().toLowerCase()) {
          await onSessionRefresh?.();
        }
        await onSaved?.();
        onClose?.();
      }
    } catch {
      alert('Error updating user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">Edit User Access — {username}</h3>
          <button type="button" className="text-2xl font-bold text-gray-400 hover:text-gray-700" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Mobile Contact</label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full border rounded p-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2 text-sm outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-600 mb-1">Account Role</label>
              <select
                value={isSuperAdmin ? 'Super Admin' : role}
                onChange={(e) => setRole(e.target.value)}
                disabled={roleLocked}
                className="w-full border rounded p-2 bg-white text-sm outline-none disabled:bg-gray-100"
              >
                <option value="User">Standard User</option>
                <option value="Admin">System Admin</option>
                {isSuperAdmin && <option value="Super Admin">Super Admin</option>}
              </select>
            </div>
            <div>
              <label className="block font-bold text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded p-2 bg-white text-sm outline-none"
              >
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Removed">Removed</option>
              </select>
            </div>
          </div>
          <PasswordInput
            id="edit-user-password"
            label="New Password (optional)"
            labelClassName="block font-bold text-gray-600 mb-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            placeholder="Leave blank to keep current"
            inputClassName="w-full border rounded p-2 pr-12 text-sm outline-none"
          />
          {role !== 'Admin' && !roleLocked && (
            <div>
              <label className="block font-bold text-gray-600 mb-2">Menu Execution Scopes</label>
              <UserPermGrid permMap={permMap} onChange={setPermMap} />
            </div>
          )}
          {(role === 'Admin' || roleLocked) && (
            <p className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded p-2">
              Admin accounts have full access (ALL permissions).
            </p>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
