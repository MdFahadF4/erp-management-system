import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import UserEditModal from '../components/UserEditModal.jsx';
import UserPermGrid from '../components/UserPermGrid.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { createUser, fetchUsers, updateUser } from '../services/dataService.js';
import { getCol } from '../lib/dualHeadEngine.js';
import { defaultCreatePermMap, permissionsToString } from '../lib/userPermHelpers.js';

function getUsername(rec) {
  return String(getCol(rec, ['Username']) || '').trim();
}

function getUserRole(rec) {
  return String(getCol(rec, ['Role']) || 'User').trim();
}

function getUserStatus(rec) {
  return String(getCol(rec, ['Status', 'Account Status']) || 'Active').trim() || 'Active';
}

export default function UsersPage({ user }) {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [permMap, setPermMap] = useState(defaultCreatePermMap);
  const [editRecord, setEditRecord] = useState(null);

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

  const canManage = user.role === 'Super Admin' || user.role === 'Admin';

  const canManageTarget = (rec) => {
    const targetRole = getUserRole(rec);
    if (targetRole === 'Super Admin' && user.role !== 'Super Admin') return false;
    return true;
  };

  const roleBadge = (uRole) => {
    const cls =
      uRole === 'Super Admin'
        ? 'bg-red-100 text-red-800'
        : uRole === 'Admin'
          ? 'bg-purple-100 text-purple-800'
          : 'bg-blue-100 text-blue-800';
    return (
      <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${cls}`}>{uRole}</span>
    );
  };

  const statusBadge = (uStatus) => {
    if (uStatus === 'Paused') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
          {t('users.statusPaused')}
        </span>
      );
    }
    if (uStatus === 'Removed') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-200 text-gray-600">
          {t('users.statusRemoved')}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800">
        {t('users.statusActive')}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newUser = {
        username: username.trim(),
        password,
        mobile: mobile.trim(),
        email: email.trim(),
        role,
        permissions: role === 'Admin' ? 'all' : permissionsToString(permMap)
      };
      const res = await createUser(newUser, user);
      alert(res.message || (res.success ? 'User created.' : 'Failed.'));
      if (res.success) {
        setUsername('');
        setPassword('');
        setMobile('');
        setEmail('');
        setRole('User');
        setPermMap(defaultCreatePermMap());
        await load();
      }
    } catch {
      alert(t('users.registerFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const setUserStatus = async (rec, status) => {
    const name = getUsername(rec);
    if (status === 'Paused' && !window.confirm(t('users.confirmPause'))) return;
    if (status === 'Removed' && !window.confirm(t('users.confirmRemove'))) return;
    try {
      const res = await updateUser({
        username: name,
        status,
        actorUsername: user.username,
        actorRole: user.role
      });
      alert(res.message || (res.success ? 'Updated.' : 'Failed.'));
      if (res.success) await load();
    } catch {
      alert(t('users.updateFailed'));
    }
  };

  if (!canManage) {
    return <div className="p-8 text-center text-gray-500">{t('users.adminAccessRequired')}</div>;
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6 erp-module-page pb-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('page.users.title')}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200 lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('form.users.provision')}</h3>
            <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
              <div>
                <label className="block font-bold uppercase text-gray-500 mb-1">{t('field.username')}</label>
                <input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 outline-none"
                />
              </div>
              <PasswordInput
                id="new-password"
                label={t('field.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <div>
                <label className="block font-bold uppercase text-gray-500 mb-1">{t('col.mobile')}</label>
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder={t('users.mobileRecoveryHint')}
                  className="w-full border border-gray-200 rounded p-2 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-gray-500 mb-1">{t('col.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('users.emailRecoveryHint')}
                  className="w-full border border-gray-200 rounded p-2 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-gray-500 mb-1">{t('field.accountRole')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 bg-white outline-none"
                >
                  <option value="User">{t('option.standardUser')}</option>
                  <option value="Admin">{t('option.admin')}</option>
                </select>
              </div>
              {role !== 'Admin' ? (
                <div>
                  <label className="block font-bold uppercase text-gray-500 mb-2">{t('users.menuScopes')}</label>
                  <UserPermGrid permMap={permMap} onChange={setPermMap} />
                </div>
              ) : (
                <p className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded p-2">
                  {t('users.adminAllAccess')}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded transition disabled:opacity-60"
              >
                {t('form.users.register')}
              </button>
            </form>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('form.users.activeDirectories')}</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-white uppercase sticky top-0">
                  <tr>
                    <th className="p-3">{t('field.username')}</th>
                    <th className="p-3">{t('col.role')}</th>
                    <th className="p-3">{t('col.status')}</th>
                    <th className="p-3">{t('users.contact')}</th>
                    <th className="p-3">{t('col.permissionsScope')}</th>
                    <th className="p-3 erp-col-actions">{t('col.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400 animate-pulse">
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">
                        {t('users.noOperators')}
                      </td>
                    </tr>
                  ) : (
                    users.map((rec) => {
                      const name = getUsername(rec);
                      const uRole = getUserRole(rec);
                      const uStatus = getUserStatus(rec);
                      const contact =
                        [getCol(rec, ['Mobile']), getCol(rec, ['Email'])].filter(Boolean).join(' · ') || '-';
                      const perms = getCol(rec, ['Permissions']) || t('users.noPermissions');
                      const manageable = canManageTarget(rec);
                      return (
                        <tr key={rec.ID || name} className="hover:bg-gray-50">
                          <td className="p-3 font-bold">{name}</td>
                          <td className="p-3">{roleBadge(uRole)}</td>
                          <td className="p-3">{statusBadge(uStatus)}</td>
                          <td className="p-3 break-words">{contact}</td>
                          <td className="p-3 break-words font-mono text-[10px] leading-tight">{perms}</td>
                          <td className="p-3 erp-col-actions whitespace-nowrap">
                            {manageable ? (
                              <>
                                <button
                                  type="button"
                                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
                                  onClick={() => setEditRecord(rec)}
                                >
                                  {t('common.edit')}
                                </button>
                                {uStatus !== 'Removed' &&
                                  (uStatus === 'Paused' ? (
                                    <button
                                      type="button"
                                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
                                      onClick={() => setUserStatus(rec, 'Active')}
                                    >
                                      {t('users.resume')}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
                                      onClick={() => setUserStatus(rec, 'Paused')}
                                    >
                                      {t('users.pause')}
                                    </button>
                                  ))}
                                {uStatus !== 'Removed' ? (
                                  <button
                                    type="button"
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px]"
                                    onClick={() => setUserStatus(rec, 'Removed')}
                                  >
                                    {t('users.remove')}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 rounded text-[10px]"
                                    onClick={() => setUserStatus(rec, 'Active')}
                                  >
                                    {t('users.reactivate')}
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-300 italic text-[10px]">{t('common.locked')}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <UserEditModal
        open={Boolean(editRecord)}
        record={editRecord}
        actor={user}
        onClose={() => setEditRecord(null)}
        onSaved={load}
      />
    </>
  );
}
