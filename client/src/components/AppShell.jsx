import { useCallback, useEffect, useMemo, useState } from 'react';
import { processLogout } from '../services/auth.js';
import { fetchDashboardData } from '../services/dataService.js';
import { computeDashboardMetrics } from '../lib/dashboardEngine.js';
import { computeLiveCashDrawer } from '../lib/cashDrawer.js';
import { fmtMoney } from '../lib/recordHelpers.js';
import { COMPANY_NAME, companyLegalLine } from '../config/company.js';
import { getDefaultModuleForUser, getVisibleNavItems, userCanAccessModule } from '../utils/userSession.js';
import DashboardInsightsPanel from './DashboardInsightsPanel.jsx';
import ModulePlaceholder from './ModulePlaceholder.jsx';
import ChangePasswordModal from './ChangePasswordModal.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import TxnEditModal from './TxnEditModal.jsx';
import { TxnEditProvider } from '../context/TxnEditContext.jsx';
import { resolveModuleComponent } from '../config/moduleRegistry.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { NAV_ITEMS } from '../utils/userSession.js';

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
}

export default function AppShell({ user: initialUser }) {
  const { t } = useI18n();
  const [user] = useState(initialUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(() => getDefaultModuleForUser(initialUser) || 'dashboard');
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cashDrawerBalance, setCashDrawerBalance] = useState(0);

  const visibleNav = useMemo(() => getVisibleNavItems(user), [user]);

  const navLabel = (item) => {
    const keyMap = {
      dashboard: 'nav.dashboard',
      delivery_dashboard: 'nav.deliveryDashboard',
      hr: 'nav.hr',
      hr_transactions: 'nav.hrTransactions',
      hr_factory: 'nav.hrFactory',
      customers: 'nav.customers',
      customer_transactions: 'nav.customerTransactions',
      internal_transfer: 'nav.internalTransfer',
      suppliers: 'nav.suppliers',
      supplier_transactions: 'nav.supplierTransactions',
      expense_heads: 'nav.expenseHeads',
      expense_transactions: 'nav.expenseTransactions',
      creditors: 'nav.creditorHeads',
      creditor_transactions: 'nav.creditorTransactions',
      income_heads: 'nav.incomeHeads',
      income_transactions: 'nav.incomeTransactions',
      capital_heads: 'nav.capitalHeads',
      capital_transactions: 'nav.capitalTransactions',
      all_transactions: 'nav.allTransactions',
      reports: 'nav.reports',
      users: 'nav.users'
    };
    const key = keyMap[item.id];
    return key ? t(key) : item.label;
  };

  const metrics = useMemo(() => {
    if (!rawData) return null;
    return computeDashboardMetrics(rawData, user);
  }, [rawData, user]);

  const loadData = useCallback(async () => {
    const data = await fetchDashboardData();
    setRawData(data);
    setCashDrawerBalance(
      computeLiveCashDrawer(user, {
        customers: data.customers,
        customerTxns: data.customerTxns,
        expenseTxns: data.expenseTxns,
        hrTxns: data.hrTxns,
        supplierTxns: data.supplierTxns,
        internalTransfers: data.internalTransfers,
        creditorTxns: data.creditorTxns
      })
    );
    return data;
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadData();
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  useEffect(() => {
    document.getElementById('main-content')?.scrollTo(0, 0);
  }, [activeModule]);

  useEffect(() => {
    document.body.classList.remove('erp-mobile-dashboard', 'erp-mobile-module', 'erp-sidebar-open', 'erp-page-footer-visible', 'erp-mobile-ledger-open');
    if (sidebarOpen) document.body.classList.add('erp-sidebar-open');
    document.body.classList.add('erp-page-footer-visible');
    if (isMobileViewport()) {
      if (activeModule === 'dashboard') document.body.classList.add('erp-mobile-dashboard');
      else document.body.classList.add('erp-mobile-module');
    }
    return () => {
      document.body.classList.remove(
        'erp-mobile-dashboard',
        'erp-mobile-module',
        'erp-sidebar-open',
        'erp-page-footer-visible'
      );
    };
  }, [activeModule, sidebarOpen]);

  const openMenu = () => setSidebarOpen(true);
  const closeMenu = () => setSidebarOpen(false);

  const navigateTo = (moduleId) => {
    setActiveModule(moduleId);
    closeMenu();
    document.body.classList.remove('erp-mobile-ledger-open');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (err) {
      console.error('Refresh failed:', err);
      alert('Failed to refresh data. Check that the server is running.');
    } finally {
      setRefreshing(false);
    }
  };

  const showDashboardInsights = activeModule === 'dashboard' && userCanAccessModule(user, 'dashboard');
  const drawerNegative = cashDrawerBalance < 0;

  const renderModule = () => {
    if (!userCanAccessModule(user, activeModule)) {
      return <ModulePlaceholder moduleId={activeModule} />;
    }
    const view = resolveModuleComponent(activeModule, {
      user,
      metrics,
      loading,
      refreshing,
      onRefresh: handleRefresh,
      onDataChange: loadData
    });
    return view ?? <ModulePlaceholder moduleId={activeModule} />;
  };

  return (
    <TxnEditProvider user={user} onGlobalMutate={loadData}>
    <div className="bg-gray-100 font-sans text-gray-900 flex h-screen overflow-hidden relative">
      <div
        id="sidebar-backdrop"
        className={`fixed inset-0 bg-slate-900/50 z-[85] backdrop-blur-sm transition-opacity cursor-pointer ${
          sidebarOpen ? '' : 'hidden'
        }`}
        onClick={closeMenu}
        aria-hidden={!sidebarOpen}
      />

      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-[90] w-64 bg-slate-800 text-white flex flex-col h-full shadow-2xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 text-xl font-black tracking-wider border-b border-slate-700 flex justify-between items-center">
          <span>{t('sidebar.corePanel')}</span>
          <button
            type="button"
            id="close-sidebar"
            onClick={closeMenu}
            className="text-2xl text-slate-400 hover:text-white transition focus:outline-none"
          >
            &times;
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {visibleNav.length === 0 ? (
            <p className="text-sm text-slate-400 p-3">No modules assigned to your account.</p>
          ) : (
            visibleNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`menu-btn w-full text-left rounded-lg hover:bg-slate-700 font-medium transition ${
                  item.indent ? 'pl-8 py-2 text-sm' : 'p-3'
                } ${item.bold ? 'font-bold text-slate-100' : ''} ${item.semibold ? 'font-semibold' : ''} ${
                  item.accent || ''
                } ${activeModule === item.id ? 'bg-slate-700' : ''}`}
              >
                {navLabel(item)}
              </button>
            ))
          )}
        </nav>
        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className="flex items-center justify-between gap-2 px-1 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('header.changeLanguage')}</span>
            <LanguageSwitcher menuAlign="right" />
          </div>
          <p className="text-[10px] text-slate-400 text-center pb-1 leading-relaxed">
            Developed by <span className="text-slate-100 font-semibold">Md. Fahad Hossain</span>
          </p>
          <button
            type="button"
            id="btn-open-password-modal"
            onClick={() => {
              closeMenu();
              setPasswordModalOpen(true);
            }}
            className="w-full bg-slate-700 hover:bg-slate-600 font-medium p-2 rounded-lg transition text-center text-sm text-white shadow-sm"
          >
            {t('sidebar.changePassword')}
          </button>
          <button
            type="button"
            id="btn-logout"
            onClick={processLogout}
            className="w-full bg-red-600 hover:bg-red-700 font-medium p-2.5 rounded-lg transition text-center text-white shadow-sm"
          >
            {t('sidebar.signOut')}
          </button>
        </div>
      </aside>

      <div id="app-shell" className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <header
          id="app-header"
          className="fixed top-0 left-0 right-0 z-[60] bg-white shadow-sm px-2 py-2 md:sticky md:left-auto md:right-auto md:z-50 md:p-4 flex justify-between items-center gap-2 border-b border-gray-200 shrink-0"
        >
          <div className="flex items-center min-w-0">
            <button
              id="open-sidebar"
              type="button"
              onClick={openMenu}
              className="p-1.5 md:p-2 mr-1 md:mr-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none transition shrink-0"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <LanguageSwitcher />
            <div className="min-w-0">
              <h1 id="header-company-name" className="text-sm md:text-lg font-black text-slate-900 truncate leading-tight">
                {COMPANY_NAME}
              </h1>
              <p id="header-company-legal" className="text-[9px] md:text-[11px] font-semibold text-slate-500 truncate leading-tight">
                {companyLegalLine()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
            <div id="user-profile-badge" className="flex flex-col text-right leading-tight">
              <span
                id="header-username"
                className="text-[11px] md:text-sm font-extrabold text-slate-800 capitalize tracking-wide max-w-[72px] md:max-w-none truncate"
              >
                {user?.username}
              </span>
              <span
                id="header-role"
                className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-wider truncate"
              >
                {user?.role}
              </span>
            </div>

            <div
              id="user-cash-drawer-badge"
              className={`bg-emerald-50 border text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-lg font-mono shadow-sm whitespace-nowrap ${
                drawerNegative
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'border-emerald-200 text-emerald-700'
              }`}
            >
              <span className="hidden sm:inline">{t('header.cashDrawer')} </span>
              SAR <span id="header-user-balance">{fmtMoney(cashDrawerBalance)}</span>
            </div>
          </div>
        </header>

        <div id="app-body" className="flex flex-col flex-1 min-h-0 overflow-hidden md:pt-0">
          <DashboardInsightsPanel metrics={metrics} loading={loading} visible={showDashboardInsights} />

          <main id="main-content" className="flex-1 p-3 md:p-8 overflow-y-auto min-h-0 scroll-pt-2" key={activeModule}>
            {renderModule()}
          </main>

          <footer id="app-page-footer" className="erp-app-page-footer shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-3 py-3 md:px-8 md:py-3.5 text-center">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Developed by{' '}
              <span className="text-slate-700 font-semibold hover:text-blue-700">Md. Fahad Hossain</span>
            </p>
          </footer>
        </div>
      </div>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        username={user?.username}
      />
      <TxnEditModal />
    </div>
    </TxnEditProvider>
  );
}