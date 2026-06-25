import { useCallback, useEffect, useState } from 'react';
import { createUser, fetchUsers } from '../services/dataService.js';
import { getCol } from '../lib/dualHeadEngine.js';
import { NAV_ITEMS } from '../utils/userSession.js';

const PERM_MODULES = NAV_ITEMS.filter((n) => !n.adminOnly && !n.group).map((n) => n.id);

export default function UsersPage({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [permissions, setPermissions] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await fetchUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const togglePerm = (mod) => {
    setPermissions((prev) => (prev.includes(mod) ? prev.filter((p) => p !== mod) : [...prev, mod]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const permStr = role === 'Admin' ? 'all' : permissions.map((p) => `${p}:edit`).join(',');
      const res = await createUser({ username, password, mobile, email, role, permissions: permStr });
      alert(res.message || (res.success ? 'User created.' : 'Failed.'));
      if (res.success) {
        setUsername('');
        setPassword('');
        setMobile('');
        setEmail('');
        setRole('User');
        setPermissions([]);
        await load();
      }
    } catch {
      alert('Error creating user.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user.role !== 'Super Admin' && user.role !== 'Admin') {
    return <div className="p-8 text-center text-gray-500">Admin access required.</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">User Access Management</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Provision Account</h3>
          <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
            <div>
              <label className="block font-bold uppercase text-gray-500 mb-1">Username</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-gray-200 rounded p-2 outline-none" />
            </div>
            <div>
              <label className="block font-bold uppercase text-gray-500 mb-1">Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-200 rounded p-2 outline-none" />
            </div>
            <div>
              <label className="block font-bold uppercase text-gray-500 mb-1">Mobile</label>
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full border border-gray-200 rounded p-2 outline-none" />
            </div>
            <div>
              <label className="block font-bold uppercase text-gray-500 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-200 rounded p-2 outline-none" />
            </div>
            <div>
              <label className="block font-bold uppercase text-gray-500 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-200 rounded p-2 bg-white outline-none">
                <option value="User">Standard User</option>
                <option value="Admin">System Admin</option>
              </select>
            </div>
            {role !== 'Admin' && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-48 overflow-y-auto space-y-1">
                {PERM_MODULES.map((mod) => (
                  <label key={mod} className="flex items-center gap-2">
                    <input type="checkbox" checked={permissions.includes(mod)} onChange={() => togglePerm(mod)} />
                    <span>{mod.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            )}
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded transition disabled:opacity-60">
              Register User
            </button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 lg:col-span-2 flex flex-col h-[70vh]">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Active Directories</h3>
          <div className="overflow-y-auto border border-gray-200 rounded-lg flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-white uppercase sticky top-0">
                <tr>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400 animate-pulse">
                      Loading…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((rec) => (
                    <tr key={rec.ID || getCol(rec, ['Username'])} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">{getCol(rec, ['Username']) || ''}</td>
                      <td className="p-3">{getCol(rec, ['Role']) || ''}</td>
                      <td className="p-3">{getCol(rec, ['Status']) || 'Active'}</td>
                      <td className="p-3">{getCol(rec, ['Mobile']) || getCol(rec, ['Email']) || '-'}</td>
                      <td className="p-3 break-words">{getCol(rec, ['Permissions']) || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
