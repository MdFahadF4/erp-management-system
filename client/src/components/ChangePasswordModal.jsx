import { useState } from 'react';
import { apiRequest } from '../services/auth.js';
import PasswordInput from './PasswordInput.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function ChangePasswordModal({ open, onClose, username }) {
  const { t } = useI18n();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Verification Failed: New passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiRequest({
        action: 'CHANGE_PASSWORD',
        payload: { username, oldPassword, newPassword }
      });
      alert(result.message || (result.success ? 'Password changed.' : 'Failed.'));
      if (result.success) handleClose();
    } catch {
      alert('Pipeline Error: Failed to connect to security database.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">{t('modal.updateCredentials')}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-2xl font-bold text-gray-400 hover:text-gray-700 focus:outline-none"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            id="cp-old"
            label={t('modal.currentPassword')}
            labelClassName="block text-xs font-bold uppercase text-gray-600 mb-1"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            inputClassName="w-full border rounded-lg p-2 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <PasswordInput
            id="cp-new"
            label={t('modal.newPassword')}
            labelClassName="block text-xs font-bold uppercase text-gray-600 mb-1"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            inputClassName="w-full border rounded-lg p-2 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <PasswordInput
            id="cp-confirm"
            label={t('modal.confirmPassword')}
            labelClassName="block text-xs font-bold uppercase text-gray-600 mb-1"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            inputClassName="w-full border rounded-lg p-2 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold p-2.5 rounded text-sm transition tracking-wider mt-2 shadow-md"
          >
            {submitting ? t('common.loading') : t('modal.overwritePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
