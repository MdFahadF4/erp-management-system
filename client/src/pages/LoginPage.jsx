import { useState } from 'react';
import PasswordInput from '../components/PasswordInput.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import { processLogin } from '../services/auth.js';
import { COMPANY_NAME, companyLegalLine } from '../config/company.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function LoginPage({ onLoginSuccess }) {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await processLogin(username, password);
    setLoading(false);
    if (result.success) {
      onLoginSuccess(result.user);
    } else {
      setError(result.message);
    }
  }

  return (
    <div id="login-screen" className="absolute inset-0 z-[100] bg-slate-900 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center mb-5 pb-4 border-b border-gray-100">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {COMPANY_NAME}
          </h1>
          <p className="text-[11px] md:text-xs font-semibold text-slate-500 mt-1.5">
            {companyLegalLine()}
          </p>
        </div>
        <h2 className="text-2xl font-extrabold mb-2 text-center text-gray-800">{t('login.title')}</h2>
        <p className="text-sm text-center text-gray-500 mb-6">{t('login.subtitle')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">{t('login.username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <PasswordInput
            id="login-password"
            label={t('login.password')}
            labelClassName="block text-xs font-bold uppercase text-gray-600 mb-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            inputClassName="w-full border rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? t('common.loading') : t('login.signIn')}
          </button>
        </form>
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500">
            Developed by{' '}
            <span className="text-blue-700 font-semibold">Md. Fahad Hossain</span>
          </p>
        </div>
      </div>
    </div>
  );
}
