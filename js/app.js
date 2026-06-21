import { processLogin, processLogout, fetchSessionUser, apiRequest } from './auth.js';
import { templates } from './views.js';
import { t, applyTranslations, initLanguageSwitcher, translateReportSelect, getAllTxnModuleLabel, getCategoryLabel, getReportFlowTypeLabel, getReportSourceLabel } from './i18n.js';
import { initTxnAdminSystem, renderTxnActions, cacheTxnRecords } from './txn-admin.js';
import { initUserAdminSystem, initForgotPasswordSystem, cacheUserRecords, renderUserDirectoryRow, buildPermCheckboxes, readPermCheckboxes } from './user-admin.js';
import { setupPasswordToggle, resetPasswordToggles } from './password-toggle.js';
import { refreshSessionUser, userCanAccessModule, userCanEditModule, getDefaultModuleForUser } from './user-session.js';
import { initDeliveryDashboard } from './delivery-dashboard.js';

const loginScreen = document.getElementById('login-screen');
const formLogin = document.getElementById('form-login');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const openSidebarBtn = document.getElementById('open-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const mainContent = document.getElementById('main-content');
const menuButtons = document.querySelectorAll('.menu-btn');
const btnLogout = document.getElementById('btn-logout');
const navUsers = document.getElementById('nav-users');

let cachedHrRecords = [];
let cachedHrTxns = [];
let cachedSupplierRecords = [];
let cachedCustomerRecords = [];
let cachedCustomerTxnRecords = [];
let cachedExpenseHeads = [];
let cachedCreditors = [];
let cachedIncomeHeads = [];
let cachedCapitalHeads = [];
let cachedExpenseTxns = [];
let cachedSupplierTxns = [];
let cachedCreditorTxns = [];
let cachedIncomeTxns = [];
let cachedCapitalTxns = [];

const CREDITOR_TXN_FIELDS = {
  main: ["Creditor Parent Head", "Parent Head", "Main Head"],
  sub: ["Sub Head", "SubCategory"],
  bill: ["Received Amount", "Received Amt"],
  discount: ["Discount", "Discount Allowed"],
  pay: ["Return Amount", "Return Amt"],
  due: ["Transaction Due", "Txn Due"],
  remarks: ["Remarks", "Remarks / Reference", "Description"],
  txnId: ["Transaction ID", "Tracking ID", "Txn ID", "System Unique ID"],
  categories: { bill: "Received", pay: "Return", prev: "Previous Due" }
};
const INCOME_TXN_FIELDS = {
  main: ["Income Parent Head", "Parent Head", "Main Head"],
  sub: ["Sub Head", "SubCategory"],
  bill: ["Receivable Amount", "Receivable"],
  discount: ["Discount", "Discount Allowed"],
  pay: ["Received Amount", "Received Amt"],
  due: ["Transaction Due", "Txn Due"],
  remarks: ["Remarks", "Remarks / Reference", "Description"],
  txnId: ["Transaction ID", "Tracking ID", "Txn ID", "System Unique ID"],
  categories: { bill: "Receivable", pay: "Received", prev: "Previous Due" }
};
const CAPITAL_TXN_FIELDS = {
  main: ["Capital Parent Head", "Parent Head", "Main Head"],
  sub: ["Sub Head", "SubCategory"],
  bill: ["Capital In Amount", "Capital In Amt", "Capital In"],
  discount: ["Discount", "Discount Allowed"],
  pay: ["Capital Out Amount", "Capital Out Amt", "Capital Out"],
  due: ["Transaction Due", "Txn Due", "Transaction Net"],
  remarks: ["Remarks", "Remarks / Reference", "Description"],
  txnId: ["Transaction ID", "Tracking ID", "Txn ID", "System Unique ID"],
  categories: { bill: "Capital In", pay: "Capital Out", prev: "Previous Due" }
};
const EXPENSE_TXN_FIELDS = {
  main: ["Expense Parent Head", "Parent Category", "Parent Head", "Main Head"],
  sub: ["Sub Head", "Sub Head Name", "SubCategory"],
  bill: ["Incurred Amount", "Total Deposit Incurred Amt", "Total Deposit", "Deposit/Incurred", "Deposit", "Incurred", "Bill Amount"],
  discount: ["Discount", "Discount Allowed"],
  pay: ["Payment Paid", "Paid Amt", "Paid Amount", "Amount Paid"],
  due: ["Transaction Due", "Txn Due"],
  remarks: ["Remarks / Vouchers", "Remarks", "Description"],
  txnId: ["Transaction ID", "Tracking ID", "Txn ID", "System Unique ID"],
  categories: { bill: "Incurred", pay: "Payment Paid", prev: "Previous Due" }
};

function buildModuleTxnTrackingId(prefix, main, sub, dateStr) {
  const m = String(main || "GEN").substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "") || "GEN";
  const s = String(sub || "SUB").substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "") || "SUB";
  const d = String(dateStr || new Date().toISOString().split("T")[0]).replace(/-/g, "");
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${m}-${s}-${d}-${rnd}`;
}

setupPasswordToggle('toggle-password', 'login-password');

async function initApp() {
  initForgotPasswordSystem();
  initLanguageSwitcher(async () => {
    applyTranslations(document);
    if (activeModuleTarget && templates[activeModuleTarget]) {
      await loadModulePage(activeModuleTarget);
    } else if (fetchSessionUser()) {
      applyTranslations(document);
    }
  });
  applyTranslations(document);

  // =====================================================================
// GLOBAL DATE FORMATTER OVERRIDE (Forces DD MMM YYYY across entire app)
// =====================================================================
Date.prototype.toLocaleDateString = function() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(this.getDate()).padStart(2, '0');
  const month = months[this.getMonth()];
  const year = this.getFullYear();
  return `${day} ${month} ${year}`;
};
// =====================================================================
  const user = await refreshSessionUser();
  if (user) {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainContent) {
      const defaultModule = getDefaultModuleForUser(user);
      if (defaultModule) {
        await loadModulePage(defaultModule, { replaceHistory: true });
      } else {
        mainContent.innerHTML = `<div class="p-8 text-center text-gray-500 font-bold text-xl mt-10">${t('common.welcome', { name: user.username })}</div>`;
        history.replaceState({ module: 'home' }, '', '#home');
      }
    }
    
    const profileBadge = document.getElementById('user-profile-badge');
    const headerUsername = document.getElementById('header-username');
    const headerRole = document.getElementById('header-role');
    
    if (profileBadge && headerUsername && headerRole) {
      headerUsername.textContent = user.username;
      headerRole.textContent = user.role;
      profileBadge.classList.remove('hidden');
      profileBadge.classList.add('flex'); 
    }

    const badge = document.getElementById('user-cash-drawer-badge');
    if (badge) badge.classList.remove('hidden');
    await updateLiveUserCashDrawerBalance();

    applyMenuPermissions(user);

    bindSessionSyncOnce();
    bindMobileSnapshotResizeOnce();
    requestAnimationFrame(() => syncMobileHeaderHeight());
    bindDashboardRefreshOnce();

    initTxnAdminSystem({
      reloadHandlers: {
        HR_Transactions: async () => {
          await loadTxnTableRecords(true);
          await loadHRTableRecords();
          await populateEmployeeDropdown();
        },
        Supplier_Transactions: async () => {
          await loadSupplierTxnTableRecords(true);
          await loadSupplierTableRecords();
          await populateSupplierTxnDropdown();
        },
        Customer_Transactions: () => loadCustomerTxnTableRecords(true),
        Internal_Transfers: () => loadInternalTransferTableRecords(true),
        Expense_Transactions: () => loadExpenseTxnTableRecords(true),
        Creditor_Transactions: () => loadCreditorTxnTableRecords(true),
        Income_Transactions: () => loadIncomeTxnTableRecords(true),
        Capital_Transactions: async () => {
          await loadCapitalTxnTableRecords(true);
          await loadCapitalHeadTableRecords();
        }
      },
      onGlobalRefresh: async () => {
        if (document.getElementById('table-all-txn-rows')) {
          await loadAllTxnTableRecords(true);
        }
      },
      onDrawerRefresh: updateLiveUserCashDrawerBalance
    });

    initUserAdminSystem({ onReload: loadUserDirectories });
  } else {
    if (loginScreen) loginScreen.classList.remove('hidden');
  }
}

function openMenu() {
  if (sidebar) sidebar.classList.remove('-translate-x-full');
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('hidden');
  document.body.classList.add('erp-sidebar-open');
  syncSessionPermissions();
}

function closeMenu() {
  if (sidebar) sidebar.classList.add('-translate-x-full');
  if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
  document.body.classList.remove('erp-sidebar-open');
}

let activeModuleTarget = null;
let activeMobileSnapshot = null;

function isMobileViewport() {
  return window.matchMedia('(max-width: 1023px)').matches;
}

function isCompactLayout() {
  return isMobileViewport();
}

function syncMobileHeaderHeight() {
  const header = document.getElementById('app-header');
  if (!header) return;
  const height = Math.ceil(header.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--erp-mobile-header-h', `${height}px`);
}

function syncChromeBarHeight() {
  /* Chrome bars are in-flow; no fixed offset math needed */
}

function clearChromeInlineStyles() {
  ['dashboard-insights-panel', 'erp-module-toolbar'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.removeProperty('display');
    el.style.removeProperty('visibility');
    el.style.removeProperty('opacity');
  });
}

function forceChromeBarVisible(mode) {
  clearChromeInlineStyles();
  const dash = document.getElementById('dashboard-insights-panel');
  const mod = document.getElementById('erp-module-toolbar');
  if (mode === 'dashboard') {
    dash?.classList.remove('hidden');
  } else if (mode === 'module') {
    mod?.classList.remove('hidden');
  }
}

function scrollMainToElement(el, offset = 8) {
  if (!el || !mainContent) return;
  const mcRect = mainContent.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const nextTop = mainContent.scrollTop + (elRect.top - mcRect.top) - offset;
  mainContent.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
}

function scrollMainToElementAfterLayout(el, offset = 8) {
  if (!el || !isCompactLayout()) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollMainToElement(el, offset));
  });
}

function setMobilePageMode(target) {
  const dashPanel = document.getElementById('dashboard-insights-panel');
  if (target) activeModuleTarget = target;

  const resolved = target || activeModuleTarget;
  const hasModulePage = Boolean(mainContent?.querySelector('.erp-module-page'));

  document.body.classList.remove('erp-mobile-dashboard', 'erp-mobile-module');
  clearChromeInlineStyles();

  if (!isCompactLayout()) {
    dashPanel?.classList.toggle('hidden', resolved !== 'dashboard');
    if (resolved === 'dashboard') {
      initDashboardInsightsToggle(true);
    } else {
      document.getElementById('admin-global-balance-container')?.replaceChildren();
    }
    syncMobileHeaderHeight();
    return;
  }

  if (resolved === 'dashboard') {
    document.body.classList.add('erp-mobile-dashboard');
    forceChromeBarVisible('dashboard');
    initDashboardInsightsToggle(true);
  } else if (hasModulePage) {
    document.body.classList.add('erp-mobile-module');
    forceChromeBarVisible('module');
  } else {
    dashPanel?.classList.add('hidden');
  }

  if (resolved !== 'dashboard') {
    document.getElementById('admin-global-balance-container')?.replaceChildren();
  }

  syncMobileHeaderHeight();
}

function updateModuleToolbarText(label, summary) {
  const labelEl = document.getElementById('erp-module-toolbar-label');
  const summaryEl = document.getElementById('erp-module-toolbar-summary');
  if (labelEl && label) labelEl.textContent = label;
  if (summaryEl && summary) summaryEl.textContent = summary;
}

function bindModuleToolbarToggleOnce() {
  const toggle = document.getElementById('erp-module-toolbar-toggle');
  if (!toggle || toggle.dataset.bound === 'true') return;
  toggle.dataset.bound = 'true';
  toggle.addEventListener('click', () => {
    const snap = activeMobileSnapshot || mainContent?.querySelector('.erp-module-page')?._mobileSnapshot;
    if (!snap) return;
    if (snap.isCollapsed()) snap.expand();
    else snap.collapse(t('mobile.tapHideForm'));
    forceChromeBarVisible('module');
  });
}

function updateModuleToolbarUi(collapsed, summaryText, defaultSummary) {
  const toggle = document.getElementById('erp-module-toolbar-toggle');
  const summaryEl = document.getElementById('erp-module-toolbar-summary');
  const chevron = document.getElementById('erp-module-toolbar-chevron');
  if (summaryEl) summaryEl.textContent = collapsed ? (summaryText || defaultSummary) : defaultSummary;
  toggle?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  chevron?.classList.toggle('rotate-180', !collapsed);
}

function markMobileSnapshotTargets(pageRoot, selectors) {
  pageRoot.querySelectorAll('.erp-mobile-snapshot-target').forEach((el) => el.classList.remove('erp-mobile-snapshot-target'));
  selectors.forEach((sel) => {
    pageRoot.querySelectorAll(sel).forEach((el) => el.classList.add('erp-mobile-snapshot-target'));
  });
}

function createMobileSnapshotController(pageRoot, options = {}) {
  if (!pageRoot) return null;

  const defaultSummary = options.defaultSummary || t('mobile.tapShowForm');
  const label = options.label || t('chrome.moduleOptions');
  let collapsed = Boolean(options.startCollapsed);
  let summaryOverride = null;

  bindModuleToolbarToggleOnce();
  updateModuleToolbarText(label, defaultSummary);

  const applyState = () => {
    pageRoot.classList.toggle('erp-mobile-snapshot-collapsed', collapsed && isCompactLayout());
    updateModuleToolbarUi(collapsed, summaryOverride, defaultSummary);
    if (isCompactLayout()) forceChromeBarVisible('module');
  };

  const collapse = (summaryText) => {
    if (summaryText) summaryOverride = summaryText;
    collapsed = true;
    applyState();
    setMobilePageMode(activeModuleTarget);
    forceChromeBarVisible('module');
  };

  const expand = () => {
    summaryOverride = null;
    collapsed = false;
    applyState();
    setMobilePageMode(activeModuleTarget);
    forceChromeBarVisible('module');
    requestAnimationFrame(() => {
      const target = pageRoot.querySelector('.erp-mobile-snapshot-target');
      if (target) scrollMainToElement(target);
    });
  };

  applyState();

  const controller = {
    collapse,
    expand,
    setSummary: (text) => {
      summaryOverride = text;
      if (collapsed) updateModuleToolbarUi(true, summaryOverride, defaultSummary);
    },
    isCollapsed: () => collapsed,
    refresh: applyState
  };

  activeMobileSnapshot = controller;
  return controller;
}

function bindMobileSnapshotResizeOnce() {
  if (window._erpMobileSnapshotResizeBound) return;
  window._erpMobileSnapshotResizeBound = true;
  const refreshChrome = () => {
    setMobilePageMode(activeModuleTarget);
    if (document.body.classList.contains('erp-mobile-dashboard')) forceChromeBarVisible('dashboard');
    else if (document.body.classList.contains('erp-mobile-module')) forceChromeBarVisible('module');
    activeMobileSnapshot?.refresh?.();
  };
  window.addEventListener('resize', refreshChrome);
  window.addEventListener('pageshow', refreshChrome);
  window.addEventListener('orientationchange', () => setTimeout(refreshChrome, 100));
}

function onMobileLedgerFilterApplied(mobileSnapshot, ledgerContainer) {
  if (ledgerContainer && !ledgerContainer.classList.contains('hidden')) {
    mobileSnapshot?.collapse(t('mobile.collapseLedger'));
    setMobilePageMode(activeModuleTarget);
    forceChromeBarVisible('module');
    const ledger = ledgerContainer.querySelector('.erp-ledger-wrap') || ledgerContainer;
    scrollMainToElementAfterLayout(ledger);
  }
}

function initMobileModuleSnapshot(target) {
  activeMobileSnapshot = null;
  if (target === 'dashboard') return null;

  const pageRoot = mainContent?.querySelector('.erp-module-page');
  if (!pageRoot) return null;

  const titleText = pageRoot.querySelector('.border-b h2')?.textContent?.trim() || t('chrome.moduleOptions');

  if (target === 'reports') {
    markMobileSnapshotTargets(pageRoot, ['#report-filters-panel', '.erp-report-tools > .border-b']);
    return createMobileSnapshotController(pageRoot, {
      label: t('mobile.reportOptions'),
      defaultSummary: t('mobile.reportSummary')
    });
  }

  if (target === 'all_transactions') {
    markMobileSnapshotTargets(pageRoot, ['.border-b', '.erp-mobile-filter-bar']);
    return createMobileSnapshotController(pageRoot, {
      label: t('mobile.auditFilters'),
      defaultSummary: t('mobile.auditSummary')
    });
  }

  if (target === 'users') {
    markMobileSnapshotTargets(pageRoot, ['.border-b', '.erp-mobile-user-form']);
    return createMobileSnapshotController(pageRoot, {
      label: t('mobile.userManagement'),
      defaultSummary: t('mobile.userSummary')
    });
  }

  if (pageRoot.querySelector('#toggle-ledger-btn')) {
    markMobileSnapshotTargets(pageRoot, ['.border-b', '#form-container']);
    return createMobileSnapshotController(pageRoot, {
      label: titleText.length > 42 ? `${titleText.slice(0, 39)}…` : titleText,
      defaultSummary: t('mobile.formActions')
    });
  }

  return null;
}

function applyMenuPermissions(user) {
  if (!user) return;

  const canDash = userCanAccessModule(user, 'dashboard');
  const canDelivery = userCanAccessModule(user, 'delivery_dashboard');
  const dashGroup = document.getElementById('nav-dashboard-group');
  const dashBtn = document.getElementById('nav-dashboard-main');
  const deliveryBtn = document.getElementById('nav-delivery-dashboard');

  if (dashBtn) {
    if (canDash) dashBtn.classList.remove('hidden');
    else dashBtn.classList.add('hidden');
  }
  if (deliveryBtn) {
    if (canDelivery) deliveryBtn.classList.remove('hidden');
    else deliveryBtn.classList.add('hidden');
  }
  if (dashGroup) {
    if (canDash || canDelivery) dashGroup.classList.remove('hidden');
    else dashGroup.classList.add('hidden');
  }

  if (menuButtons) {
    menuButtons.forEach((btn) => {
      const target = btn.getAttribute('data-target');
      if (!target || target === 'dashboard' || target === 'delivery_dashboard') return;
      if (userCanAccessModule(user, target)) btn.classList.remove('hidden');
      else btn.classList.add('hidden');
    });
  }
  if (navUsers) {
    if (user.role === 'Super Admin' || user.role === 'Admin') navUsers.classList.remove('hidden');
    else navUsers.classList.add('hidden');
  }
}

async function syncSessionPermissions() {
  if (!fetchSessionUser()) return null;
  const user = await refreshSessionUser();
  if (!user) return null;
  applyMenuPermissions(user);
  if (activeModuleTarget) {
    applyModuleEditMode(activeModuleTarget);
    if (!userCanAccessModule(user, activeModuleTarget)) {
      const fallback = getDefaultModuleForUser(user);
      if (fallback) {
        await loadModulePage(fallback, { replaceHistory: true });
      } else if (mainContent) {
        mainContent.innerHTML = `<div class="p-8 text-center text-gray-500 font-bold text-xl mt-10">${t('common.welcome', { name: user.username })}</div>`;
        activeModuleTarget = null;
        history.replaceState({ module: 'home' }, '', '#home');
      }
    }
  }
  return user;
}

function bindSessionSyncOnce() {
  if (document.body.dataset.sessionSyncBound === 'true') return;
  document.body.dataset.sessionSyncBound = 'true';

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncSessionPermissions();
  });
  window.addEventListener('focus', () => syncSessionPermissions());
  setInterval(() => {
    if (fetchSessionUser()) syncSessionPermissions();
  }, 120000);
}

function guardModuleEdit(moduleTarget) {
  if (userCanEditModule(fetchSessionUser(), moduleTarget)) return true;
  alert(t('alert.viewOnlyModule'));
  return false;
}

function applyModuleEditMode(moduleTarget) {
  const user = fetchSessionUser();
  if (!user || user.role === 'Super Admin' || user.role === 'Admin') return;

  const formContainer = document.getElementById('form-container');
  if (!formContainer) return;

  const canEdit = userCanEditModule(user, moduleTarget);
  const pageRoot = formContainer.closest('.erp-module-page') || formContainer.parentElement;
  document.getElementById('module-view-only-notice')?.remove();

  if (!canEdit) {
    formContainer.classList.add('hidden');
    const ledgerContainer = document.getElementById('ledger-container');
    if (ledgerContainer) {
      ledgerContainer.classList.remove('hidden', 'xl:col-span-3');
      ledgerContainer.classList.add('xl:col-span-4');
    }
    if (pageRoot) {
      const notice = document.createElement('div');
      notice.id = 'module-view-only-notice';
      notice.className = 'bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold p-3 rounded-lg mb-4';
      notice.setAttribute('data-i18n', 'users.viewOnlyMode');
      notice.textContent = t('users.viewOnlyMode');
      pageRoot.insertBefore(notice, pageRoot.firstChild?.nextSibling || pageRoot.firstChild);
      applyTranslations(pageRoot);
    }
  } else {
    formContainer.classList.remove('hidden');
  }
}

async function loadModulePage(target, { pushHistory = false, replaceHistory = false } = {}) {
  if (!templates[target] || !mainContent) return;

  let user = fetchSessionUser();
  if (user) {
    user = await refreshSessionUser();
    if (!user) return;
    applyMenuPermissions(user);
    if (!userCanAccessModule(user, target)) {
      alert(t('alert.unauthorizedModule'));
      const fallback = getDefaultModuleForUser(user);
      if (fallback && fallback !== target) {
        await loadModulePage(fallback, { replaceHistory: true });
      }
      return;
    }
  }

  mainContent.innerHTML = templates[target];
  applyTranslations(mainContent);
  document.body.classList.remove('erp-mobile-ledger-open');
  activeModuleTarget = target;
  syncMobileHeaderHeight();

  const pageRoot = mainContent.querySelector('.erp-module-page');
  const mobileSnapshot = initMobileModuleSnapshot(target);
  if (pageRoot && mobileSnapshot) pageRoot._mobileSnapshot = mobileSnapshot;
  bindMobileSnapshotResizeOnce();
  bindModuleToolbarToggleOnce();

  mainContent.scrollTo({ top: 0, behavior: 'auto' });

  const toggleBtn = document.getElementById('toggle-ledger-btn');
  const formContainer = document.getElementById('form-container');
  const ledgerContainer = document.getElementById('ledger-container');

  if (toggleBtn && formContainer && ledgerContainer) {
    toggleBtn.addEventListener('click', () => {
      const isMobile = isMobileViewport();
      const isHidden = ledgerContainer.classList.toggle('hidden');

      if (isMobile) {
        toggleBtn.textContent = isHidden ? t('common.ledgerView') : t('common.backToForm');
        toggleBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        toggleBtn.classList.add('bg-slate-800', 'hover:bg-slate-900');
        document.body.classList.toggle('erp-mobile-ledger-open', !isHidden);
        closeMenu();
        if (!isHidden) {
          mobileSnapshot?.collapse(t('mobile.viewingLedger'));
          setMobilePageMode(activeModuleTarget);
          forceChromeBarVisible('module');
          const ledger = ledgerContainer.querySelector('.erp-ledger-wrap') || ledgerContainer;
          scrollMainToElementAfterLayout(ledger);
        } else {
          mobileSnapshot?.expand();
          setMobilePageMode(activeModuleTarget);
        }
        return;
      }

      if (isHidden) {
        formContainer.classList.remove('xl:col-span-1');
        formContainer.classList.add('xl:col-span-4', 'max-w-2xl', 'mx-auto');
        toggleBtn.textContent = t('common.ledgerView');
        toggleBtn.classList.replace('bg-blue-600', 'bg-slate-800');
        toggleBtn.classList.replace('hover:bg-blue-700', 'hover:bg-slate-900');
      } else {
        formContainer.classList.remove('xl:col-span-4', 'max-w-2xl', 'mx-auto');
        formContainer.classList.add('xl:col-span-1');
        toggleBtn.textContent = t('common.hideLedger');
        toggleBtn.classList.replace('bg-slate-800', 'bg-blue-600');
        toggleBtn.classList.replace('hover:bg-slate-900', 'hover:bg-blue-700');
      }
    });
  }

  if (target === 'dashboard') {
    await loadDashboardData();
  } else if (target === 'hr') {
    initHRFormListeners(); await loadHRTableRecords();
  } else if (target === 'hr_transactions') {
    await populateEmployeeDropdown(); initTxnFormListeners(); await loadTxnTableRecords();
    document.getElementById('btn-filter-hr')?.addEventListener('click', () => {
      loadTxnTableRecords(true);
      onMobileLedgerFilterApplied(mobileSnapshot, ledgerContainer);
    });
  } else if (target === 'suppliers') {
    initSupplierFormListeners(); await loadSupplierTableRecords();
  } else if (target === 'supplier_transactions') {
    await populateSupplierTxnDropdown(); initSupplierTxnFormListeners(); await loadSupplierTxnTableRecords();
    document.getElementById('btn-filter-sup')?.addEventListener('click', () => {
      loadSupplierTxnTableRecords(true);
      onMobileLedgerFilterApplied(mobileSnapshot, ledgerContainer);
    });
  } else if (target === 'customers') {
    initCustomerFormListeners(); await loadCustomerTableRecords();
  } else if (target === 'customer_transactions') {
    await populateCustomerTxnDropdown(); initCustomerTxnFormListeners(); await loadCustomerTxnTableRecords();
    document.getElementById('btn-filter-cust')?.addEventListener('click', () => {
      loadCustomerTxnTableRecords(true);
      onMobileLedgerFilterApplied(mobileSnapshot, ledgerContainer);
    });
  } else if (target === 'delivery_dashboard') {
    await initDeliveryDashboard();
  } else if (target === 'internal_transfer') {
    initInternalTransferFormListeners(); await loadInternalTransferTableRecords();
    document.getElementById('btn-filter-int')?.addEventListener('click', () => {
      loadInternalTransferTableRecords(true);
      onMobileLedgerFilterApplied(mobileSnapshot, ledgerContainer);
    });
  } else if (target === 'expense_heads') {
    initExpenseHeadFormListeners(); await loadExpenseHeadTableRecords();
  } else if (target === 'expense_transactions') {
    await populateExpenseHeadDropdowns(); initExpenseTxnFormListeners(); await loadExpenseTxnTableRecords();
    document.getElementById('btn-filter-exp')?.addEventListener('click', () => {
      loadExpenseTxnTableRecords(true);
      onMobileLedgerFilterApplied(mobileSnapshot, ledgerContainer);
    });
  } else if (target === 'creditors') {
    initCreditorFormListeners(); await loadCreditorTableRecords();
  } else if (target === 'creditor_transactions') {
    await populateCreditorDropdowns(); initCreditorTxnFormListeners(); await loadCreditorTxnTableRecords();
    document.getElementById('btn-filter-cred')?.addEventListener('click', () => {
      loadCreditorTxnTableRecords(true);
      onMobileLedgerFilterApplied(mobileSnapshot, ledgerContainer);
    });
  } else if (target === 'income_heads') {
    initIncomeHeadFormListeners(); await loadIncomeHeadTableRecords();
  } else if (target === 'income_transactions') {
    await populateIncomeHeadDropdowns(); initIncomeTxnFormListeners(); await loadIncomeTxnTableRecords();
    document.getElementById('btn-filter-inc')?.addEventListener('click', () => {
      loadIncomeTxnTableRecords(true);
      onMobileLedgerFilterApplied(mobileSnapshot, ledgerContainer);
    });
  } else if (target === 'capital_heads') {
    initCapitalHeadFormListeners(); await loadCapitalHeadTableRecords();
  } else if (target === 'capital_transactions') {
    await populateCapitalHeadDropdowns(); initCapitalTxnFormListeners(); await loadCapitalTxnTableRecords();
    document.getElementById('btn-filter-cap')?.addEventListener('click', () => {
      loadCapitalTxnTableRecords(true);
      onMobileLedgerFilterApplied(mobileSnapshot, ledgerContainer);
    });
  } else if (target === 'all_transactions') {
    await loadAllTxnTableRecords();
    document.getElementById('btn-filter-all')?.addEventListener('click', async () => {
      await loadAllTxnTableRecords(true);
      mobileSnapshot?.collapse(t('mobile.collapseFilters'));
      setMobilePageMode('all_transactions');
      forceChromeBarVisible('module');
      scrollMainToElementAfterLayout(mainContent.querySelector('.erp-ledger-wrap'));
    });
  } else if (target === 'reports') {
    initReportsSystem();
  } else if (target === 'users') {
    initUserManagementFormListener();
    buildPermCheckboxes('create-user-perms', 'Dashboard:view,Dashboard:edit');
    setupPasswordToggle('toggle-new-password', 'new-password');
    setupPasswordToggle('toggle-edit-user-password', 'edit-user-password');
    await loadUserDirectories();
  }

  applyModuleEditMode(target);

  setMobilePageMode(target);
  requestAnimationFrame(() => {
    setMobilePageMode(target);
    if (target === 'dashboard') forceChromeBarVisible('dashboard');
    else if (mainContent.querySelector('.erp-module-page')) forceChromeBarVisible('module');
  });

  if (pushHistory) {
    history.pushState({ module: target }, '', `#${target}`);
  } else if (replaceHistory) {
    history.replaceState({ module: target }, '', `#${target}`);
  }
}

window.addEventListener('popstate', (e) => {
  const target = e.state?.module;
  if (target && templates[target]) {
    loadModulePage(target);
  }
});

if (openSidebarBtn) openSidebarBtn.addEventListener('click', openMenu);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeMenu);
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMenu);

if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameEl = document.getElementById('login-username');
    const passwordEl = document.getElementById('login-password');
    const u = usernameEl ? usernameEl.value.trim() : '';
    const p = passwordEl ? passwordEl.value : '';
    try {
      const authStatus = await processLogin(u, p);
      if (authStatus && authStatus.success) { await initApp(); } else { alert(authStatus.message || "Invalid verification routing credentials."); }
    } catch (err) { alert("Pipeline connection timeout or verification exception occurred."); }
  });
}

if (btnLogout) { btnLogout.addEventListener('click', processLogout); }

if (menuButtons) {
  menuButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      if (templates[target]) {
        await loadModulePage(target, { pushHistory: true });
      }
      closeMenu();
    });
  });
}

/**
 * CUSTOM STRING & FORMATTING ENGINE CONSTRUCTORS
 */
function formatCustomDateString(dateObj) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`; 
}

function extractUserInitials(fullName) {
  if (!fullName) return "ST";
  const clean = fullName.replace(/[\.]/g, '').trim();
  const segments = clean.split(/\s+/).filter(word => word.toLowerCase() !== 'md');
  if (segments.length === 0) return "ST";
  if (segments.length === 1) return segments[0].substring(0, 2).toUpperCase();
  const firstLetter = segments[0].charAt(0).toUpperCase();
  const lastLetter = segments[segments.length - 1].charAt(0).toUpperCase();
  return firstLetter + lastLetter;
}

function getCol(rec, possibleNames) {
  for (let name of possibleNames) {
    let normName = String(name).toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (let key in rec) {
      let normKey = String(key).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (normName === normKey) return rec[key];
    }
  }
  return undefined;
}

function getRemarks(rec) {
  const val = getCol(rec, [
    "Remarks / Vouchers", "Remarks", "Remarks / Reference",
    "Description", "Description / Purpose", "Details"
  ]);
  return (val !== undefined && val !== null && String(val).trim() !== "") ? String(val).trim() : '-';
}

function canViewAllCustomers() {
  const u = fetchSessionUser();
  return !!(u && (u.role === 'Super Admin' || u.role === 'Admin'));
}

function getCustomerDueBalance(rec) {
  if (!rec) return 0;
  const sell = parseFloat(getCol(rec, ["Total Sell", "Sell Amount", "Gross Sell"])) || 0;
  const cash = parseFloat(getCol(rec, ["Cash Amt", "Cash Amount", "Cash"])) || 0;
  const card = parseFloat(getCol(rec, ["Card Amt", "Card Amount", "Card"])) || 0;
  const discount = parseFloat(getCol(rec, ["Discount", "Discount Allowed"])) || 0;
  let received = cash + card;
  if (received === 0) received = parseFloat(getCol(rec, ["Received Amount", "Total Received", "Received"])) || 0;
  let due = sell - received - discount;
  if (due <= 0.009) due = parseFloat(getCol(rec, ["Due Balance", "Due", "Outstanding Balance Due"])) || 0;
  return Math.max(0, due);
}

function getSupplierTxnCategory(rec) {
  const cat = String(getCol(rec, ["Category"]) || "").trim();
  if (cat) return cat;
  const rem = String(getCol(rec, ["Remarks", "Remarks / Reference"]) || "").toLowerCase();
  if (rem.includes("previous due") || rem.includes("opening balance")) return "Previous Due";
  const pay = parseFloat(getCol(rec, ["Payment Paid", "Paid Amount", "Payment Paid Amt"]));
  const bill = parseFloat(getCol(rec, ["Purchase Amount", "Purchase Amt", "Purchase", "Amount"]));
  if (!isNaN(pay) && pay > 0 && (isNaN(bill) || bill === 0)) return "Payment Paid";
  return "Purchase";
}

function parseSupplierTxnAmounts(rec) {
  const category = getSupplierTxnCategory(rec);
  const catKey = category.toLowerCase();
  const isPrev = catKey.includes("previous due") || catKey.includes("opening balance");

  const purchaseRaw = getCol(rec, ["Purchase Amount", "Purchase Amt", "Purchase"]);
  if (purchaseRaw !== undefined && purchaseRaw !== null && purchaseRaw !== "") {
    let bill = parseFloat(purchaseRaw) || 0;
    let discount = parseFloat(getCol(rec, ["Discount", "Discount Allowed"])) || 0;
    let pay = parseFloat(getCol(rec, ["Payment Paid", "Paid Amount", "Payment Paid Amt"])) || 0;
    const storedDue = parseFloat(getCol(rec, ["Transaction Due", "Txn Due"]));
    if (isPrev) {
      bill = bill || pay;
      return { bill, discount: 0, pay: 0, txnDue: bill, category: "Previous Due" };
    }
    if (catKey.includes("payment paid") || catKey.includes("paid")) {
      pay = pay || bill;
      return { bill: 0, discount: 0, pay, txnDue: -pay, category: "Payment Paid" };
    }
    const txnDue = !isNaN(storedDue) ? storedDue : bill - discount - pay;
    return { bill, discount, pay, txnDue, category: category || "Purchase" };
  }
  const amt = parseFloat(getCol(rec, ["Amount"])) || 0;
  if (isPrev) return { bill: amt, discount: 0, pay: 0, txnDue: amt, category: "Previous Due" };
  if (catKey.includes("paid")) return { bill: 0, discount: 0, pay: amt, txnDue: -amt, category: "Payment Paid" };
  return { bill: amt, discount: 0, pay: 0, txnDue: amt, category: "Purchase" };
}

if (typeof window !== 'undefined') {
  window.parseSupplierTxnAmounts = parseSupplierTxnAmounts;
  window.rollupSupplierTxnTotals = rollupSupplierTxnTotals;
  window.getSupplierTxnCategory = getSupplierTxnCategory;
  window.getDualTxnCategory = getDualTxnCategory;
  window.parseTxnDualAmounts = parseTxnDualAmounts;
  window.buildModuleTxnTrackingId = buildModuleTxnTrackingId;
}

function rollupSupplierTxnTotals(txns, supplierName) {
  const name = supplierName ? String(supplierName).trim() : "";
  let bill = 0, discount = 0, pay = 0;
  (txns || []).forEach((t) => {
    if (name && String(getCol(t, ["Supplier Name"]) || "").trim() !== name) return;
    const p = parseSupplierTxnAmounts(t);
    bill += p.bill;
    discount += p.discount;
    pay += p.pay;
  });
  return { bill, discount, pay, due: Math.max(0, bill - discount - pay) };
}

function getSupplierDueFromTxns(supplierName, txns) {
  return rollupSupplierTxnTotals(txns, supplierName).due;
}

function getSupplierDueBalance(supplierRec, txns) {
  if (!supplierRec) return 0;
  const name = String(getCol(supplierRec, ["Supplier Name"]) || "").trim();
  return getSupplierDueFromTxns(name, txns);
}

function getHrDueBalance(hrRec, txns) {
  if (!hrRec) return 0;
  const name = String(getCol(hrRec, ["Employee Name"]) || "").trim();
  return getHrDueFromTxns(name, txns);
}

function getHrTxnCategory(rec) {
  const cat = String(getCol(rec, ["Category"]) || "").trim();
  if (cat) return cat;
  const rem = String(getCol(rec, ["Remarks"]) || "").toLowerCase();
  if (rem.includes("previous due") || rem.includes("opening balance")) return "Previous Due";
  if (rem.includes("increment")) return "Salary Increment";
  if (rem.includes("paid")) return "Salary Paid";
  return "Salary Earn";
}

function parseHrTxnAmounts(rec) {
  const category = getHrTxnCategory(rec);
  const catKey = category.toLowerCase();
  const amt = parseFloat(getCol(rec, ["Amount"])) || 0;
  const isIncrement = catKey.includes("increment");
  const isPrev = catKey.includes("previous due") || catKey.includes("opening balance");
  const isPaid = catKey.includes("paid") && !isIncrement;

  if (isIncrement) return { earned: 0, paid: 0, txnDelta: 0, category: "Salary Increment", isIncrement: true };
  if (isPrev) return { earned: amt, paid: 0, txnDelta: amt, category: "Previous Due", isIncrement: false };
  if (isPaid) return { earned: 0, paid: amt, txnDelta: -amt, category: "Salary Paid", isIncrement: false };
  return { earned: amt, paid: 0, txnDelta: amt, category: category || "Salary Earn", isIncrement: false };
}

function rollupHrTxnTotals(txns, employeeName) {
  const name = employeeName ? String(employeeName).trim() : "";
  let earned = 0, paid = 0, increment = 0;
  (txns || []).forEach((t) => {
    if (name && String(getCol(t, ["Employee Name"]) || "").trim() !== name) return;
    const p = parseHrTxnAmounts(t);
    if (p.isIncrement) increment += parseFloat(getCol(t, ["Amount"])) || 0;
    else {
      earned += p.earned;
      paid += p.paid;
    }
  });
  return { earned, paid, increment, due: Math.max(0, earned - paid) };
}

function getHrDueFromTxns(employeeName, txns) {
  return rollupHrTxnTotals(txns, employeeName).due;
}

function createHrTxnDueController(opts) {
  const { amountInput, txnDeltaInput, dueInfoBox, currentDueEl, remainingDueEl, categorySelect } = opts;
  let currentDue = 0;

  const getTxnDelta = () => {
    const amt = parseFloat(amountInput?.value) || 0;
    const cat = String(categorySelect?.value || "").toLowerCase();
    if (cat.includes("increment")) return 0;
    if (cat.includes("paid")) return -amt;
    return amt;
  };

  const resetDueInfo = () => {
    currentDue = 0;
    if (currentDueEl) currentDueEl.textContent = "0.00";
    if (remainingDueEl) remainingDueEl.textContent = "0.00";
    dueInfoBox?.classList.add("hidden");
  };

  const runCalculations = () => {
    const delta = getTxnDelta();
    if (txnDeltaInput) txnDeltaInput.value = delta.toFixed(2);
    if (remainingDueEl) remainingDueEl.textContent = Math.max(0, currentDue + delta).toFixed(2);
  };

  const showCurrentDue = (amount) => {
    currentDue = Math.max(0, parseFloat(amount) || 0);
    if (currentDueEl) currentDueEl.textContent = currentDue.toFixed(2);
    dueInfoBox?.classList.remove("hidden");
    runCalculations();
  };

  amountInput?.addEventListener("input", runCalculations);
  categorySelect?.addEventListener("change", runCalculations);

  return { runCalculations, resetDueInfo, showCurrentDue, getCurrentDue: () => currentDue, getTxnDelta };
}

function getDualTxnCategory(rec, fieldMap) {
  const cats = fieldMap.categories || {};
  const cat = String(getCol(rec, ["Category"]) || "").trim();
  if (cat) return cat;
  const rem = String(getCol(rec, fieldMap.remarks)).toLowerCase();
  const sub = String(getCol(rec, fieldMap.sub)).toUpperCase();
  const main = String(getCol(rec, fieldMap.main)).toUpperCase();
  if (rem.includes("previous due") || rem.includes("opening balance") || sub.includes("PREVIOUS DUE") || main.includes("PREVIOUS DUE")) {
    return cats.prev || "Previous Due";
  }
  const pay = parseFloat(getCol(rec, fieldMap.pay)) || 0;
  const bill = parseFloat(getCol(rec, fieldMap.bill)) || 0;
  const discount = parseFloat(getCol(rec, fieldMap.discount)) || 0;
  if (pay > 0 && bill === 0 && discount === 0) return cats.pay || "Payment";
  return cats.bill || "Bill";
}

function isDualTxnPrevDue(rec, fieldMap) {
  const cat = getDualTxnCategory(rec, fieldMap).toLowerCase();
  return cat.includes("previous due") || cat.includes("opening balance");
}

function normalizeDualTxnAmountsByCategory(category, bill, discount, pay, fieldMap) {
  const catKey = String(category || "").trim().toLowerCase();
  const cats = fieldMap.categories || {};
  const payKey = String(cats.pay || "").toLowerCase();
  if (catKey.includes("previous due") || catKey.includes("opening balance")) {
    const amt = bill || pay;
    return { bill: amt, discount: 0, pay: 0, txnDue: amt };
  }
  if (payKey && catKey === payKey) {
    const amt = pay || bill;
    return { bill: 0, discount: 0, pay: amt, txnDue: -amt };
  }
  return { bill, discount, pay, txnDue: bill - discount - pay };
}

function initDualTxnCategoryHandlers(cfg) {
  const { catSelect, billInput, discountInput, payInput, remarksInput, subSelect, fieldMap, dueCtrl, refreshSubDropdown } = cfg;
  if (catSelect && !Array.from(catSelect.options).some((o) => o.value === "Previous Due")) {
    catSelect.insertAdjacentHTML("beforeend", `<option value="Previous Due" class="font-bold text-slate-700 bg-slate-100">${t("dropdown.previousDuePin")}</option>`);
  }
  const applyCategoryMode = async () => {
    const category = catSelect?.value || fieldMap.categories?.bill || "";
    const isPrev = category === "Previous Due";
    const isPay = category === fieldMap.categories?.pay;
    if (refreshSubDropdown) await refreshSubDropdown(isPay ? "with-due" : "all");
    if (subSelect) subSelect.value = "";
    dueCtrl?.resetDueInfo();
    if (billInput) billInput.readOnly = !!isPay;
    if (discountInput) discountInput.readOnly = isPrev || !!isPay;
    if (payInput) payInput.readOnly = isPrev;
    if (isPrev) {
      if (discountInput) discountInput.value = "0";
      if (payInput) payInput.value = "0";
    } else if (isPay) {
      if (billInput) billInput.value = "0";
      if (discountInput) discountInput.value = "0";
    }
    dueCtrl?.runCalculations();
  };
  catSelect?.addEventListener("change", applyCategoryMode);
  return {
    applyCategoryMode,
    prepareSubmit() {
      const category = catSelect?.value || fieldMap.categories?.bill || "";
      let remarksText = remarksInput?.value.trim() || "";
      const bill = parseFloat(billInput?.value) || 0;
      const discount = parseFloat(discountInput?.value) || 0;
      const pay = parseFloat(payInput?.value) || 0;
      const amounts = normalizeDualTxnAmountsByCategory(category, bill, discount, pay, fieldMap);
      if (category === "Previous Due" && !remarksText.toLowerCase().includes("previous due")) {
        remarksText = remarksText ? `Previous Due - ${remarksText}` : "Previous Due";
      }
      return { category, remarksText, ...amounts };
    },
    resetInputs() {
      if (billInput) billInput.readOnly = false;
      if (discountInput) discountInput.readOnly = false;
      if (payInput) payInput.readOnly = false;
      if (catSelect) catSelect.value = fieldMap.categories?.bill || "";
    }
  };
}

function parseTxnDualAmounts(rec, fieldMap) {
  const category = getDualTxnCategory(rec, fieldMap);
  let bill = parseFloat(getCol(rec, fieldMap.bill)) || 0;
  let discount = parseFloat(getCol(rec, fieldMap.discount)) || 0;
  let pay = parseFloat(getCol(rec, fieldMap.pay)) || 0;
  const storedDue = parseFloat(getCol(rec, fieldMap.due));
  const normalized = normalizeDualTxnAmountsByCategory(category, bill, discount, pay, fieldMap);
  bill = normalized.bill;
  discount = normalized.discount;
  pay = normalized.pay;
  let txnDue = normalized.txnDue;
  if (Math.abs(txnDue) < 0.009 && !isNaN(storedDue)) txnDue = storedDue;
  return { bill, discount, pay, txnDue, category };
}

function computeHeadPairDueBalance(main, sub, txns, fieldMap) {
  const m = String(main || "").trim().toUpperCase();
  const s = String(sub || "").trim().toUpperCase();
  let bill = 0, discount = 0, pay = 0, prevDue = 0;
  (txns || []).forEach((t) => {
    const tM = String(getCol(t, fieldMap.main)).trim().toUpperCase();
    const tS = String(getCol(t, fieldMap.sub)).trim().toUpperCase();
    const amounts = parseTxnDualAmounts(t, fieldMap);
    const isPrev = isDualTxnPrevDue(t, fieldMap);
    if (tM !== m) return;
    if (isPrev && tS === s) {
      prevDue += Math.max(amounts.bill, amounts.pay);
    } else if (!isPrev && tS === s) {
      bill += amounts.bill; discount += amounts.discount; pay += amounts.pay;
    }
  });
  return Math.max(0, bill + prevDue - discount - pay);
}

function createDualTxnDueController(opts) {
  const { billInput, discountInput, payInput, dueInput, dueInfoBox, currentDueEl, remainingDueEl } = opts;
  let currentDue = 0;

  const resetDueInfo = () => {
    currentDue = 0;
    if (currentDueEl) currentDueEl.textContent = "0.00";
    if (remainingDueEl) remainingDueEl.textContent = "0.00";
    dueInfoBox?.classList.add("hidden");
  };

  const runCalculations = () => {
    const bill = parseFloat(billInput?.value) || 0;
    const discount = parseFloat(discountInput?.value) || 0;
    const paid = parseFloat(payInput?.value) || 0;
    const txnDue = bill - discount - paid;
    if (dueInput) dueInput.value = txnDue.toFixed(2);
    if (remainingDueEl) remainingDueEl.textContent = Math.max(0, currentDue + bill - discount - paid).toFixed(2);
  };

  const showCurrentDue = (amount) => {
    currentDue = Math.max(0, parseFloat(amount) || 0);
    if (currentDueEl) currentDueEl.textContent = currentDue.toFixed(2);
    dueInfoBox?.classList.remove("hidden");
    runCalculations();
  };

  [billInput, discountInput, payInput].forEach((el) => el?.addEventListener("input", runCalculations));

  return { runCalculations, resetDueInfo, showCurrentDue, getCurrentDue: () => currentDue };
}

function isPrevDueCheck(rec, extraCols) {
  const rem = String(getRemarks(rec)).trim().toUpperCase();
  if (rem.includes("PREVIOUS DUE") || rem.includes("OPENING BALANCE")) return true;
  for (const cols of (extraCols || [])) {
    const v = String(getCol(rec, cols) || "").trim().toUpperCase();
    if (v.includes("PREVIOUS DUE") || v.includes("OPENING BALANCE")) return true;
  }
  return false;
}

function filterCustomersForCurrentUser(records) {
  if (!Array.isArray(records)) return [];
  if (canViewAllCustomers()) return records;
  const user = fetchSessionUser();
  if (!user) return [];
  const cln = (s) => String(s || '').trim().toLowerCase();
  return records.filter((r) => cln(getCol(r, ["Username", "Logged By", "Created By"])) === cln(user.username));
}

function getExpenseIncurredAmt(rec) {
  return parseTxnDualAmounts(rec, EXPENSE_TXN_FIELDS).bill;
}

function getExpensePaidAmt(rec) {
  return parseTxnDualAmounts(rec, EXPENSE_TXN_FIELDS).pay;
}

function accumulateExpenseTxnAmounts(txns, mainUpper, subUpper, rangeStart, rangeEnd) {
  let inc = 0;
  let paid = 0;
  let discount = 0;
  if (!Array.isArray(txns)) return { inc, paid, due: 0 };

  txns.forEach((t) => {
    const tMain = String(getCol(t, EXPENSE_TXN_FIELDS.main) || '').trim().toUpperCase();
    const tSub = String(getCol(t, EXPENSE_TXN_FIELDS.sub) || '').trim().toUpperCase();
    if (mainUpper !== null && subUpper !== null && (tMain !== mainUpper || tSub !== subUpper)) return;

    if (rangeStart && rangeEnd) {
      const dStr = getCol(t, ["Date", "Timestamp"]);
      if (!dStr) return;
      const d = new Date(dStr);
      if (d < rangeStart || d > rangeEnd) return;
    }

    const amounts = parseTxnDualAmounts(t, EXPENSE_TXN_FIELDS);
    if (isDualTxnPrevDue(t, EXPENSE_TXN_FIELDS)) {
      inc += Math.max(amounts.bill, amounts.pay);
    } else {
      inc += amounts.bill;
      paid += amounts.pay;
      discount += amounts.discount;
    }
  });

  return { inc, paid, due: Math.max(0, inc - discount - paid) };
}

// ---------------------------------------------------------------------------------
// CENTRAL LIVE CASH DRAWER CALCULATOR (STRICT ADMIN VS USER WALLET RULES)
// ---------------------------------------------------------------------------------
async function updateLiveUserCashDrawerBalance() {
  const user = fetchSessionUser(); if (!user) return;
  const balanceDisplay = document.getElementById('header-user-balance'); if (!balanceDisplay) return;
  
  try {
    const [resCust, resCustTxn, resExp, resHr, resSup, resInt, resCred, resCap] = await Promise.all([
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Customers" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Customer_Transactions" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Expense_Transactions" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "HR_Transactions" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Supplier_Transactions" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Internal_Transfers" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Creditor_Transactions" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Capital_Transactions" } })
    ]);

    const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
    const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };
    
    const isU = (obj) => cln(gV(obj, ["username", "loggedby", "createdby", "user", "transferredby"])) === cln(user.username);
    const isAdmin = (user.role === "Super Admin" || user.role === "Admin");

    const recvCols = ["receivedamount", "receivedamt", "received", "cashreceived", "cashamt", "cashamount", "paidamount", "paidamt", "amountpaid"];
    const methCols = ["paymentmethod", "method", "paymenttype", "type"];

    let uCashIn = 0; let uCashOut = 0;

    // 1. CASH IN: Only Customer Cash goes into the physical drawer (For both Admin and User)
    let txnTotals = {};
    if (resCustTxn.success) {
       resCustTxn.records.forEach(t => {
          let uid = cln(gV(t, ["systemuniqueid", "sysuid", "uniqueid"]));
          if(!uid) return;
          if(!txnTotals[uid]) txnTotals[uid] = { cash: 0 };
          let method = cln(gV(t, methCols)); if (method === "") method = "cash"; 
          if (method.includes("cash")) txnTotals[uid].cash += gF(t, recvCols);
       });
    }

    if (resCust.success) resCust.records.forEach(r => {
        if (isU(r)) uCashIn += (gF(r, ["cashamt", "cashamount", "cash"]) - (txnTotals[cln(gV(r, ["systemuniqueid", "sysuid"]))]?.cash || 0));
    });

    if (resCustTxn.success) resCustTxn.records.forEach(r => {
        if (isU(r) && cln(gV(r, methCols) || "cash").includes("cash")) uCashIn += gF(r, recvCols);
    });

    // 2. CASH OUT: The crucial separation of logic!
    if (isAdmin) {
        // ADMIN RULE: Physical drawer only drops when they Internal Transfer cash out of it.
        if (resInt.success) resInt.records.forEach(r => { if (isU(r)) uCashOut += Math.abs(gF(r, ["transferamount", "amount"])); });
        if (resCap.success) resCap.records.forEach(r => {
            if (!isU(r)) return;
            uCashIn += Math.abs(gF(r, ["capitalinamount", "capitalinamt", "capitalin"]));
            uCashOut += Math.abs(gF(r, ["capitaloutamount", "capitaloutamt", "capitalout"]));
        });
    } else {
        // USER RULE: Drawer drops for EVERYTHING they pay for.
        if (resInt.success) resInt.records.forEach(r => { if (isU(r)) uCashOut += Math.abs(gF(r, ["transferamount", "amount"])); });
        if (resCred.success) resCred.records.forEach(r => { if (isU(r)) uCashOut += Math.abs(gF(r, ["returnamount", "returnamt", "amount"])); });
        if (resHr.success) resHr.records.forEach(r => { if (isU(r) && cln(gV(r, ["category"])).includes("paid")) uCashOut += Math.abs(gF(r, ["amount"])); });
        if (resSup.success) resSup.records.forEach(r => { if (isU(r)) { const p = parseSupplierTxnAmounts(r); if (p.pay > 0) uCashOut += p.pay; } });
        
        if (resExp.success) {
            resExp.records.forEach(r => {
                if (isU(r)) {
                    const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
                    if (amounts.pay > 0) uCashOut += amounts.pay;
                }
            });
        }
        if (resCap.success) {
            resCap.records.forEach(r => {
                if (!isU(r)) return;
                uCashIn += Math.abs(gF(r, ["capitalinamount", "capitalinamt", "capitalin"]));
                uCashOut += Math.abs(gF(r, ["capitaloutamount", "capitaloutamt", "capitalout"]));
            });
        }
    }

    const currentLiveBalance = uCashIn - uCashOut;
    balanceDisplay.textContent = currentLiveBalance.toFixed(2);
    
    const badge = document.getElementById('user-cash-drawer-badge');
    if (badge) {
      if (currentLiveBalance < 0) {
        badge.classList.remove('bg-emerald-50', 'border-emerald-200', 'text-emerald-700');
        badge.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
      } else {
        badge.classList.remove('bg-red-50', 'border-red-200', 'text-red-700');
        badge.classList.add('bg-emerald-50', 'border-emerald-200', 'text-emerald-700');
      }
    }
  } catch(e) { console.error("Balance Widget error:", e); }
}

/**
 * MODULE: HR MANAGEMENT MASTER COMPONENT
 */
function initHRFormListeners() {
  const creationForm = document.getElementById('form-hr-entry'); if (!creationForm) return;
  const fStart = document.getElementById('hr-sal-start'); const fInc = document.getElementById('hr-sal-inc'); const fCurrent = document.getElementById('hr-sal-current');
  const fEarn = document.getElementById('hr-earn'); const fPaid = document.getElementById('hr-paid'); const fDue = document.getElementById('hr-due');

  const runCalculations = () => {
    fCurrent.value = (parseFloat(fStart.value || 0) + parseFloat(fInc.value || 0)).toFixed(2);
    fDue.value = (parseFloat(fEarn.value || 0) - parseFloat(fPaid.value || 0)).toFixed(2);
  };
  fStart.addEventListener('input', runCalculations);
  runCalculations();

  creationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('hr')) return;
    const currentUser = fetchSessionUser(); runCalculations();
    const payloadRow = [ document.getElementById('hr-name').value.trim(), document.getElementById('hr-designation').value.trim(), document.getElementById('hr-joining').value, parseFloat(fStart.value) || 0, parseFloat(fInc.value) || 0, parseFloat(fCurrent.value) || 0, parseFloat(fEarn.value) || 0, parseFloat(fPaid.value) || 0, parseFloat(fDue.value) || 0, document.getElementById('hr-status').value, currentUser.username ];
    try {
      const res = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "HR", rowData: payloadRow } }); alert(res.message); if (res.success) { creationForm.reset(); runCalculations(); await loadHRTableRecords(); await updateLiveUserCashDrawerBalance(); }
    } catch (err) { alert(t('alert.errorCommit')); }
  });
}

async function loadHRTableRecords() {
  const container = document.getElementById('table-hr-rows'); if (!container) return;
  container.innerHTML = `<tr><td colspan="11" class="p-3 text-center text-gray-400">${t('hr.queryingLedger')}</td></tr>`;
  try {
    await apiRequest({ action: "SYNC_HR_MASTER" }).catch(() => null);
    const [hrRes, txnRes] = await Promise.all([
        apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "HR" } }),
        apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "HR_Transactions" } })
    ]);

    if (hrRes.success) {
      cachedHrRecords = hrRes.records; 
      if (cachedHrRecords.length === 0) { container.innerHTML = `<tr><td colspan="11" class="p-3 text-center text-gray-400">${t('hr.noEntries')}</td></tr>`; return; }

      const txns = txnRes.success ? txnRes.records : [];

      container.innerHTML = cachedHrRecords.map(rec => {
        const canEdit = userCanEditModule(fetchSessionUser(), 'hr');
        const actionBtn = canEdit ? `<button class="btn-hr-edit bg-orange-500 text-white font-bold px-2 py-0.5 rounded hover:bg-orange-600 transition" data-id="${rec["ID"]}">${t('common.edit')}</button>` : `<span class="text-gray-300 italic">${t('common.locked')}</span>`;
        let badgeStyle = rec["Status"] === "Inactive" ? "bg-amber-100 text-amber-800" : (rec["Status"] === "Released" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800");

        let empName = String(rec["Employee Name"] || "").trim();
        let baseSalary = parseFloat(rec["Salary Start"]) || 0;
        const totals = rollupHrTxnTotals(txns, empName);
        let totalInc = totals.increment;
        let currentSalary = baseSalary + totalInc;
        let dbEarned = totals.earned;
        let dbPaid = totals.paid;
        let dbDue = totals.due;

        return `
          <tr class="hover:bg-gray-50 whitespace-nowrap border-b border-gray-100">
            <td class="p-2.5 font-bold text-gray-900">${empName}</td><td>${rec["Designation"] || ''}</td><td>${rec["Date of Joining"] ? new Date(rec["Date of Joining"]).toLocaleDateString() : ''}</td>
            <td class="font-mono">${baseSalary.toFixed(2)}</td>
            <td class="font-mono text-purple-600">+${totalInc.toFixed(2)}</td>
            <td class="font-mono font-bold text-blue-600">${currentSalary.toFixed(2)}</td>
            <td class="font-mono text-amber-600">${dbEarned.toFixed(2)}</td>
            <td class="font-mono text-emerald-600">${dbPaid.toFixed(2)}</td>
            <td class="font-mono font-bold text-red-600">${dbDue.toFixed(2)}</td>
            <td><span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeStyle}">${getCategoryLabel(rec["Status"] || 'Active', t)}</span></td><td>${actionBtn}</td>
          </tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="11" class="p-3 text-center text-red-500 font-bold">${t('hr.loadFailed')}</td></tr>`; }
}

/**
 * MODULE: HR TRANSACTIONS INTERACTION ENGINE
 */
async function populateEmployeeDropdown(mode = 'all') {
  const dropdown = document.getElementById('txn-employee'); if (!dropdown) return;
  dropdown.innerHTML = `<option value="">${t('dropdown.loadingEmployees')}</option>`;
  try {
    const [hrRes, txnRes] = await Promise.all([
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "HR" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "HR_Transactions" } })
    ]);
    cachedHrTxns = txnRes.success ? txnRes.records : [];
    if (hrRes.success && hrRes.records.length > 0) {
      cachedHrRecords = hrRes.records;
      let activeEmployees = hrRes.records.filter((e) => e["Status"] !== "Inactive" && e["Status"] !== "Released");
      if (mode === 'with-due') {
        activeEmployees = activeEmployees.filter((emp) => getHrDueBalance(emp, cachedHrTxns) > 0.009);
      }
      if (activeEmployees.length === 0) {
        dropdown.innerHTML = `<option value="">${mode === 'with-due' ? t('dropdown.noEmployeesWithDue') || 'No employees with due balance' : t('dropdown.noEmployees')}</option>`;
        return;
      }
      dropdown.innerHTML = `<option value="">${t('dropdown.chooseEmployee')}</option>` + activeEmployees.map((emp) => {
        const name = emp["Employee Name"];
        const due = getHrDueBalance(emp, cachedHrTxns);
        return `<option value="${name}">${name} (${emp["Designation"] || '-'}) — ${t('col.dueBalance')}: ${due.toFixed(2)}</option>`;
      }).join('');
    } else {
      dropdown.innerHTML = `<option value="">${t('dropdown.noEmployees')}</option>`;
    }
  } catch (err) { dropdown.innerHTML = `<option value="">${t('dropdown.errorRecords')}</option>`; }
}

function initTxnFormListeners() {
  const form = document.getElementById('form-txn-entry'); if (!form) return;
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const dateInput = document.getElementById('txn-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const employeeSelect = document.getElementById('txn-employee');
  const catSelect = document.getElementById('txn-category');
  const amountInput = document.getElementById('txn-amount');
  const remarksInput = document.getElementById('txn-remarks');

  const dueCtrl = createHrTxnDueController({
    amountInput,
    txnDeltaInput: document.getElementById('txn-delta'),
    dueInfoBox: document.getElementById('txn-due-info'),
    currentDueEl: document.getElementById('txn-current-due'),
    remainingDueEl: document.getElementById('txn-remaining-due'),
    categorySelect: catSelect
  });

  const applyCategoryMode = async () => {
    const cat = catSelect?.value || 'Salary Earn';
    const isIncrement = cat === 'Salary Increment';
    const isPay = cat === 'Salary Paid';

    await populateEmployeeDropdown(isPay ? 'with-due' : 'all');
    employeeSelect.value = '';
    dueCtrl.resetDueInfo();

    if (amountInput) amountInput.readOnly = false;
    if (isIncrement) {
      dueCtrl.resetDueInfo();
    }
    dueCtrl.runCalculations();
  };

  const onEmployeeSelected = () => {
    const name = employeeSelect?.value || '';
    const cat = catSelect?.value || 'Salary Earn';
    if (!name || cat === 'Salary Increment') {
      dueCtrl.resetDueInfo();
      dueCtrl.runCalculations();
      return;
    }
    const rec = cachedHrRecords.find((r) => String(getCol(r, ["Employee Name"]) || "").trim() === name);
    dueCtrl.showCurrentDue(getHrDueBalance(rec, cachedHrTxns));
  };

  catSelect?.addEventListener('change', applyCategoryMode);
  employeeSelect?.addEventListener('change', onEmployeeSelected);
  amountInput?.addEventListener('input', () => dueCtrl.runCalculations());

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('hr_transactions')) return;
    const currentUser = fetchSessionUser();
    dueCtrl.runCalculations();

    const category = catSelect?.value || 'Salary Earn';
    let remarksText = remarksInput?.value.trim() || '';
    let amount = parseFloat(amountInput?.value) || 0;

    if (category === 'Previous Due') {
      if (!remarksText.toLowerCase().includes('previous due')) {
        remarksText = remarksText ? `Previous Due - ${remarksText}` : 'Previous Due';
      }
    }

    const rowPayload = [
      dateInput.value,
      employeeSelect.value,
      amount,
      category,
      remarksText,
      currentUser.username,
      new Date().toLocaleString()
    ];
    try {
      const result = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "HR_Transactions", rowData: rowPayload } });
      alert(result.message);
      if (result.success) {
        form.reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (amountInput) amountInput.value = '0.00';
        if (catSelect) catSelect.value = 'Salary Earn';
        dueCtrl.resetDueInfo();
        dueCtrl.runCalculations();
        await populateEmployeeDropdown();
        await loadTxnTableRecords(true);
        await loadHRTableRecords();
        await updateLiveUserCashDrawerBalance();
      }
    } catch (err) { alert(t('alert.errorLog')); }
  };

  dueCtrl.runCalculations();
}

async function loadTxnTableRecords(isFilter = false) {
  const container = document.getElementById('table-txn-rows'); if (!container) return;
  const fDateInput = document.getElementById('filter-from-hr');
  const tDateInput = document.getElementById('filter-to-hr');

  if (!isFilter) { container.innerHTML = `<tr><td colspan="9" class="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b">${t('ledger.selectDatesPrompt')}</td></tr>`; return; }
  if (!fDateInput.value || !tDateInput.value) { alert(t('ledger.bothDatesRequired')); return; }

  container.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-blue-500 font-bold">${t('ledger.querying')}</td></tr>`;
  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "HR_Transactions" } });
    if (result.success) {
      const fDate = new Date(fDateInput.value); fDate.setHours(0,0,0,0);
      const tDate = new Date(tDateInput.value); tDate.setHours(23,59,59,999);
      let filtered = result.records.filter(rec => { if (!rec["Date"]) return false; const rDate = new Date(rec["Date"]); return rDate >= fDate && rDate <= tDate; });

      if (filtered.length === 0) { container.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-gray-500 font-bold">${t('ledger.noResultsInRange')}</td></tr>`; return; }
      cacheTxnRecords("HR_Transactions", filtered);
      container.innerHTML = filtered.reverse().map(rec => {
        const category = getHrTxnCategory(rec);
        let catColor = "text-blue-600 bg-blue-50";
        if (category === "Salary Paid") catColor = "text-emerald-600 bg-emerald-50";
        if (category === "Salary Increment") catColor = "text-purple-600 bg-purple-50";
        if (category === "Previous Due") catColor = "text-slate-700 bg-slate-100";
        const p = parseHrTxnAmounts(rec);
        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap"><td class="p-2.5">${rec["Date"] ? new Date(rec["Date"]).toLocaleDateString() : ''}</td><td class="font-bold text-gray-900">${rec["Employee Name"]||''}</td><td class="font-mono font-bold">${Number(rec["Amount"]).toFixed(2)}</td><td><span class="px-2 py-0.5 font-bold rounded ${catColor}">${getCategoryLabel(category, t)}</span></td><td class="font-mono text-[10px] ${p.txnDelta >= 0 ? 'text-red-600' : 'text-emerald-600'}">${p.txnDelta >= 0 ? '+' : ''}${p.txnDelta.toFixed(2)}</td><td class="max-w-xs truncate" title="${rec["Remarks"]||''}">${rec["Remarks"]||'-'}</td><td>${rec["Username"]||''}</td><td class="text-gray-400 text-[10px] font-mono">${rec["Timestamp"]||''}</td>${renderTxnActions(rec, "HR_Transactions")}</tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-red-500 font-bold">${t('ledger.loadFailedTracking')}</td></tr>`; }
}

/**
 * MODULE: SUPPLIER ACCOUNT LEDGER OPERATIONS
 */
function initSupplierFormListeners() {
  const creationForm = document.getElementById('form-sup-entry'); if (!creationForm) return;
  const fPurchase = document.getElementById('sup-purchase'); const fPayments = document.getElementById('sup-payments'); const fDue = document.getElementById('sup-due');
  const runCalculations = () => { if (fDue) fDue.value = ((parseFloat(fPurchase.value) || 0) - (parseFloat(fPayments.value) || 0)).toFixed(2); };
  runCalculations();

  creationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('suppliers')) return;
    const currentUser = fetchSessionUser(); runCalculations();
    const supName = document.getElementById('sup-name').value.trim();
    const openingPurchase = parseFloat(fPurchase.value) || 0;
    const openingPayments = parseFloat(fPayments.value) || 0;
    const openingDue = Math.max(0, openingPurchase - openingPayments);
    const payloadRow = [ supName, document.getElementById('sup-mobile').value.trim(), document.getElementById('sup-email').value.trim(), document.getElementById('sup-address').value.trim(), 0, 0, 0, document.getElementById('sup-status').value, currentUser.username, new Date().toLocaleString() ];
    try {
      const res = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Suppliers", rowData: payloadRow } });
      if (res.success && openingDue > 0.009) {
        await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Supplier_Transactions", rowData: [
          new Date().toISOString().split('T')[0],
          supName,
          openingDue,
          0,
          0,
          openingDue,
          "Previous Due",
          "Previous Due (opening balance)",
          currentUser.username,
          new Date().toLocaleString()
        ] } });
      }
      alert(res.message); if (res.success) { creationForm.reset(); runCalculations(); await loadSupplierTableRecords(); await updateLiveUserCashDrawerBalance(); }
    } catch (err) { alert(t('alert.errorCommit')); }
  });
}

async function loadSupplierTableRecords() {
  const container = document.getElementById('table-sup-rows'); if (!container) return; container.innerHTML = `<tr><td colspan="9" class="p-3 text-center text-gray-400">${t('sup.queryingList')}</td></tr>`;
  try {
    await apiRequest({ action: "SYNC_SUPPLIER_MASTER" }).catch(() => null);
    // Fetch BOTH the Supplier list and their Transactions simultaneously
    const [supRes, txnRes] = await Promise.all([
        apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Suppliers" } }),
        apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Supplier_Transactions" } })
    ]);

    if (supRes.success) {
      cachedSupplierRecords = supRes.records; 
      if (cachedSupplierRecords.length === 0) { container.innerHTML = `<tr><td colspan="9" class="p-3 text-center text-gray-400">${t('sup.noRegistered')}</td></tr>`; return; }

      const txns = txnRes.success ? txnRes.records : [];

      container.innerHTML = cachedSupplierRecords.map(rec => {
        const canEdit = userCanEditModule(fetchSessionUser(), 'suppliers');
        const actionBtn = canEdit ? `<button class="btn-sup-edit bg-orange-500 text-white font-bold px-2 py-0.5 rounded hover:bg-orange-600 transition" data-id="${rec["ID"]}">${t('common.edit')}</button>` : `<span class="text-gray-300 italic">${t('common.locked')}</span>`;
        const badgeStyle = rec["Status"] === "Inactive" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800";

        let supName = String(rec["Supplier Name"] || "").trim();
        const totals = rollupSupplierTxnTotals(txns, supName);
        let totalPurchase = totals.bill;
        let totalPaid = totals.pay;
        let totalDiscount = totals.discount;
        let dbDue = totals.due;

        return `
          <tr class="hover:bg-gray-50 whitespace-nowrap border-b border-gray-100">
            <td class="p-2.5 font-bold text-gray-900">${supName}</td><td class="p-2.5 font-mono">${rec["Mobile"] || ''}</td><td class="p-2.5">${rec["Email"] || ''}</td>
            <td class="p-2.5 max-w-xs truncate" title="${rec["Address"] || ''}">${rec["Address"] || ''}</td>
            <td class="p-2.5 font-mono">${totalPurchase.toFixed(2)}</td>
            <td class="p-2.5 font-mono text-emerald-600">${totalPaid.toFixed(2)}</td>
            <td class="p-2.5 font-mono font-bold text-red-600">${dbDue.toFixed(2)}</td>
            <td class="p-2.5"><span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeStyle}">${getCategoryLabel(rec["Status"] || 'Active', t)}</span></td><td class="p-2.5">${actionBtn}</td>
          </tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="9" class="p-3 text-center text-red-500 font-bold">${t('sup.loadFailed')}</td></tr>`; }
}

/**
 * MODULE: SUPPLIER TRANSACTION LEDGER (WITH PREVIOUS DUE INJECTOR)
 */
async function populateSupplierTxnDropdown(mode = 'all') {
  const dropdown = document.getElementById('sup-txn-supplier'); if (!dropdown) return; dropdown.innerHTML = `<option value="">${t('dropdown.loadingSuppliers')}</option>`;
  try {
    const [supRes, txnRes] = await Promise.all([
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Suppliers" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Supplier_Transactions" } })
    ]);
    cachedSupplierTxns = txnRes.success ? txnRes.records : [];
    if (supRes.success && supRes.records.length > 0) {
      cachedSupplierRecords = supRes.records;
      let activeSuppliers = supRes.records.filter(s => s["Status"] !== "Inactive");
      if (mode === 'with-due') {
        activeSuppliers = activeSuppliers.filter((sup) => getSupplierDueBalance(sup, cachedSupplierTxns) > 0.009);
      }
      if (activeSuppliers.length === 0) {
        dropdown.innerHTML = `<option value="">${mode === 'with-due' ? t('dropdown.noSuppliersWithDue') || 'No suppliers with due balance' : t('dropdown.noSuppliersRegistry')}</option>`;
        return;
      }
      dropdown.innerHTML = `<option value="">${t('dropdown.chooseSupplier')}</option>` + activeSuppliers.map(sup => {
        const name = sup["Supplier Name"];
        const due = getSupplierDueBalance(sup, cachedSupplierTxns);
        return `<option value="${name}">${name} — ${t('col.dueBalance')}: ${due.toFixed(2)}</option>`;
      }).join('');
    } else { dropdown.innerHTML = `<option value="">${t('dropdown.noSuppliersRegistry')}</option>`; }
  } catch (err) { dropdown.innerHTML = `<option value="">${t('dropdown.errorData')}</option>`; }
}

function initSupplierTxnFormListeners() {
  const form = document.getElementById('form-sup-txn-entry'); if (!form) return;
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const dateInput = document.getElementById('sup-txn-date'); if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  const supplierSelect = document.getElementById('sup-txn-supplier');
  const catSelect = document.getElementById('sup-txn-category');
  const purchaseInput = document.getElementById('sup-txn-purchase');
  const discountInput = document.getElementById('sup-txn-discount');
  const paidInput = document.getElementById('sup-txn-paid');
  const remarksInput = document.getElementById('sup-txn-remarks');

  if (catSelect && catSelect.tagName === 'SELECT') {
    let hasPrevDue = Array.from(catSelect.options).some(o => o.value === 'Previous Due');
    if (!hasPrevDue) {
      catSelect.insertAdjacentHTML('beforeend', `<option value="Previous Due" class="font-bold text-slate-700 bg-slate-100">${t('dropdown.previousDuePin')}</option>`);
    }
  }

  const dueCtrl = createDualTxnDueController({
    billInput: purchaseInput,
    discountInput,
    payInput: paidInput,
    dueInput: document.getElementById('sup-txn-due'),
    dueInfoBox: document.getElementById('sup-txn-due-info'),
    currentDueEl: document.getElementById('sup-txn-current-due'),
    remainingDueEl: document.getElementById('sup-txn-remaining-due')
  });

  const applyCategoryMode = async () => {
    const cat = catSelect?.value || 'Purchase';
    const isPrev = cat === 'Previous Due';
    const isPay = cat === 'Payment Paid';

    await populateSupplierTxnDropdown(isPay ? 'with-due' : 'all');
    supplierSelect.value = '';
    dueCtrl.resetDueInfo();

    if (purchaseInput) purchaseInput.readOnly = isPay;
    if (discountInput) discountInput.readOnly = isPrev || isPay;
    if (paidInput) paidInput.readOnly = isPrev;

    if (isPrev) {
      if (discountInput) discountInput.value = '0';
      if (paidInput) paidInput.value = '0';
    } else if (isPay) {
      if (purchaseInput) purchaseInput.value = '0';
      if (discountInput) discountInput.value = '0';
    }

    dueCtrl.runCalculations();
  };

  const onSupplierSelected = () => {
    const name = supplierSelect?.value || '';
    if (!name) { dueCtrl.resetDueInfo(); dueCtrl.runCalculations(); return; }
    const rec = cachedSupplierRecords.find((r) => String(getCol(r, ["Supplier Name"]) || "").trim() === name);
    dueCtrl.showCurrentDue(getSupplierDueBalance(rec, cachedSupplierTxns));
  };

  catSelect?.addEventListener('change', applyCategoryMode);
  supplierSelect?.addEventListener('change', onSupplierSelected);

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('supplier_transactions')) return;
    const currentUser = fetchSessionUser();
    dueCtrl.runCalculations();

    const category = catSelect?.value || 'Purchase';
    let remarksText = remarksInput?.value.trim() || '';
    let purchase = parseFloat(purchaseInput?.value) || 0;
    let discount = parseFloat(discountInput?.value) || 0;
    let paid = parseFloat(paidInput?.value) || 0;

    if (category === 'Previous Due') {
      discount = 0;
      paid = 0;
      if (!remarksText.toLowerCase().includes('previous due')) {
        remarksText = remarksText ? `Previous Due - ${remarksText}` : 'Previous Due';
      }
    } else if (category === 'Payment Paid') {
      purchase = 0;
      discount = 0;
      paid = paid || purchase;
    }

    const txnDue = purchase - discount - paid;
    const rowPayload = [
      document.getElementById('sup-txn-date').value,
      supplierSelect.value,
      purchase,
      discount,
      paid,
      txnDue,
      category,
      remarksText,
      currentUser.username,
      new Date().toLocaleString()
    ];
    try {
      const result = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Supplier_Transactions", rowData: rowPayload } }); alert(result.message);
      if (result.success) {
        form.reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (discountInput) discountInput.value = '0';
        if (purchaseInput) purchaseInput.readOnly = false;
        if (discountInput) discountInput.readOnly = false;
        if (paidInput) paidInput.readOnly = false;
        if (catSelect) catSelect.value = 'Purchase';
        dueCtrl.resetDueInfo();
        dueCtrl.runCalculations();
        await populateSupplierTxnDropdown();
        await loadSupplierTxnTableRecords(true);
        await loadSupplierTableRecords();
        await updateLiveUserCashDrawerBalance();
      }
    } catch (err) { alert(t('alert.errorLog')); }
  };

  dueCtrl.runCalculations();
}

async function loadSupplierTxnTableRecords(isFilter = false) {
  const container = document.getElementById('table-sup-txn-rows'); if (!container) return;
  const fDateInput = document.getElementById('filter-from-sup');
  const tDateInput = document.getElementById('filter-to-sup');

  if (!isFilter) { container.innerHTML = `<tr><td colspan="11" class="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b">${t('ledger.selectDatesPrompt')}</td></tr>`; return; }
  if (!fDateInput.value || !tDateInput.value) { alert(t('ledger.bothDatesRequired')); return; }

  container.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-blue-500 font-bold">${t('ledger.querying')}</td></tr>`;
  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Supplier_Transactions" } });
    if (result.success) {
      const fDate = new Date(fDateInput.value); fDate.setHours(0,0,0,0);
      const tDate = new Date(tDateInput.value); tDate.setHours(23,59,59,999);
      let filtered = result.records.filter(rec => { if (!rec["Date"]) return false; const rDate = new Date(rec["Date"]); return rDate >= fDate && rDate <= tDate; });

      if (filtered.length === 0) { container.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-gray-500 font-bold">${t('ledger.noLogsInRange')}</td></tr>`; return; }
      cacheTxnRecords("Supplier_Transactions", filtered);
      container.innerHTML = filtered.reverse().map(rec => {
        const p = parseSupplierTxnAmounts(rec);
        const remarks = getCol(rec, ["Remarks", "Remarks / Reference"]) || '-';
        const category = getSupplierTxnCategory(rec);
        const isPrev = category.toLowerCase().includes('previous due');
        const isPay = category.toLowerCase().includes('payment paid');
        const typeLabel = isPrev ? t('dropdown.previousDuePin') : (isPay ? t('category.paymentDecreases') : t('category.purchaseIncreases'));
        const typeColor = isPrev ? "text-slate-700 bg-slate-200" : (isPay ? "text-emerald-600 bg-emerald-50" : "text-blue-600 bg-blue-50");
        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap"><td class="p-2.5">${rec["Date"] ? new Date(rec["Date"]).toLocaleDateString() : ''}</td><td class="font-bold text-gray-900">${getCol(rec, ["Supplier Name"]) || ''}</td><td class="font-mono">${p.bill.toFixed(2)}</td><td class="font-mono text-purple-600">${p.discount.toFixed(2)}</td><td class="font-mono font-bold text-emerald-600">${p.pay.toFixed(2)}</td><td class="font-mono font-bold text-red-600">${p.txnDue.toFixed(2)}</td><td><span class="px-2 py-0.5 font-bold rounded text-[10px] ${typeColor}">${typeLabel}</span></td><td class="max-w-xs truncate" title="${remarks}">${remarks}</td><td>${getCol(rec, ["Username", "Logged By"]) || ''}</td><td class="text-gray-400 text-[10px] font-mono">${getCol(rec, ["Timestamp", "Stamp"]) || ''}</td>${renderTxnActions(rec, "Supplier_Transactions")}</tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="11" class="p-3 text-center text-red-500 font-bold">${t('ledger.loadFailedTxn')}</td></tr>`; }
}

/**
 * MODULE: CUSTOMER ACCOUNT DATA LEDGER MANAGEMENT
 */
function initCustomerFormListeners() {
  const creationForm = document.getElementById('form-cust-entry'); if (!creationForm) return;
  const currentUser = fetchSessionUser();

  const issueDateInput = document.getElementById('cust-issue-date');
  if (issueDateInput && !issueDateInput.value) {
    issueDateInput.value = new Date().toISOString().split('T')[0];
  }

  const fSell = document.getElementById('cust-sell'); const fCash = document.getElementById('cust-cash'); const fCard = document.getElementById('cust-card');
  const fReceived = document.getElementById('cust-received'); const fDiscount = document.getElementById('cust-discount'); const fDue = document.getElementById('cust-due');

  const runCalculations = () => {
    const cashVal = parseFloat(fCash.value) || 0; const cardVal = parseFloat(fCard.value) || 0;
    const sellVal = parseFloat(fSell.value) || 0; const discVal = parseFloat(fDiscount.value) || 0;
    const receivedTotal = cashVal + cardVal;
    fReceived.value = receivedTotal.toFixed(2);
    fDue.value = (sellVal - receivedTotal - discVal).toFixed(2);
  };

  runCalculations();

  creationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('customers')) return;
    runCalculations();
    const memoNum = document.getElementById('cust-memo').value.trim();
    const custName = document.getElementById('cust-name').value.trim();
    const issueDateRaw = issueDateInput?.value;
    const issueDate = issueDateRaw ? new Date(`${issueDateRaw}T12:00:00`) : new Date();
    const formattedDateString = formatCustomDateString(issueDate);
    const initialsToken = extractUserInitials(currentUser.username);
    const generatedUniqueID = `${memoNum}-${custName}-${formattedDateString}-${initialsToken}`;

    const payloadRow = [
      generatedUniqueID, custName, document.getElementById('cust-mobile').value.trim(), document.getElementById('cust-email').value.trim(), document.getElementById('cust-address').value.trim(), memoNum,
      parseFloat(fSell.value)||0, parseFloat(fCash.value)||0, parseFloat(fCard.value)||0, parseFloat(fReceived.value)||0, parseFloat(fDiscount.value)||0, parseFloat(fDue.value)||0,
      currentUser.username, formattedDateString
    ];

    try {
      const res = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Customers", rowData: payloadRow } });
      alert(res.message || (res.success ? "Customer saved." : "Could not save customer."));
      if (res.success) {
        upsertCustomerInCache({
          "System Unique ID": generatedUniqueID,
          "Customer Name": custName
        });
        creationForm.reset(); runCalculations();
        if (issueDateInput) issueDateInput.value = new Date().toISOString().split('T')[0];
        await loadCustomerTableRecords();
        await populateCustomerTxnDropdown();
        await updateLiveUserCashDrawerBalance();
      }
    } catch (err) { alert(t('alert.errorCommit')); }
  });
}

async function loadCustomerTableRecords() {
  const container = document.getElementById('table-cust-rows'); if (!container) return;
  container.innerHTML = `<tr><td colspan="10" class="p-3 text-center text-gray-400">${t('cust.loadingMatrix')}</td></tr>`;
  try {
    // Only fetch the Master Sheet, because your backend already maintains the running totals here perfectly!
    const resCust = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Customers" } });

    if (resCust.success && Array.isArray(resCust.records)) {
      cachedCustomerRecords = resCust.records; 
      if (cachedCustomerRecords.length === 0) { container.innerHTML = `<tr><td colspan="10" class="p-3 text-center text-gray-400">${t('cust.noInvoices')}</td></tr>`; return; }
      
      container.innerHTML = cachedCustomerRecords.map(rec => {
        const uid = getCol(rec, ["System Unique ID", "Sys UID", "UNIQUEID"]) || '';
        const name = getCol(rec, ["Customer Name", "Name"]) || '';
        const memo = getCol(rec, ["Invoice", "Memo", "Invoice / Memo Number"]) || '';
        
        // 1. Pull exact values directly from the Master Sheet
        let sell = parseFloat(getCol(rec, ["Total Sell", "Sell Amount", "Gross Sell"])) || 0;
        let cash = parseFloat(getCol(rec, ["Cash Amt", "Cash Amount", "Cash"])) || 0;
        let card = parseFloat(getCol(rec, ["Card Amt", "Card Amount", "Card"])) || 0;
        let discount = parseFloat(getCol(rec, ["Discount", "Discount Allowed"])) || 0;
        
        // 2. Fix the 0.00 Received Bug by calculating it right here
        let received = cash + card;
        let due = sell - received - discount;

        const canEdit = userCanEditModule(fetchSessionUser(), 'customers');
        const actionBtn = canEdit ? `<button class="btn-cust-edit bg-orange-500 text-white font-bold px-2 py-0.5 rounded hover:bg-orange-600 transition" data-id="${rec["ID"]}">${t('common.edit')}</button>` : `<span class="text-gray-300 italic">${t('common.locked')}</span>`;
        
        return `
          <tr class="hover:bg-gray-50 whitespace-nowrap border-b border-gray-100">
            <td class="p-2.5 font-mono text-[11px] text-gray-500">${uid}</td><td class="p-2.5 font-bold text-gray-900">${name}</td><td>${memo}</td>
            <td class="p-2.5 font-mono text-gray-900">${sell.toFixed(2)}</td><td class="p-2.5 font-mono text-emerald-600">${cash.toFixed(2)}</td><td class="p-2.5 font-mono text-blue-600">${card.toFixed(2)}</td>
            <td class="p-2.5 font-mono font-bold text-gray-700">${received.toFixed(2)}</td><td class="p-2.5 font-mono text-purple-600">${discount.toFixed(2)}</td><td class="p-2.5 font-mono font-bold ${due > 0 ? 'text-red-600' : 'text-emerald-600'}">${due.toFixed(2)}</td>
            <td>${actionBtn}</td>
          </tr>`;
      }).join('');
    } else {
      const hint = resCust.success && !Array.isArray(resCust.records)
        ? "Server responded OK but sent no customer records. Your Apps Script FETCH_RECORDS handler must return a records array after token validation."
        : (resCust.message || "Could not load customers from the server.");
      container.innerHTML = `<tr><td colspan="10" class="p-3 text-center text-red-500 font-bold">${hint}</td></tr>`;
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="10" class="p-3 text-center text-red-500 font-bold">${t('cust.loadFailed')}</td></tr>`; }
}

function initCustomerTxnFormListeners() {
  const form = document.getElementById('form-cust-txn-entry'); if (!form) return;
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const tSell = document.getElementById('cust-txn-sell');
  const tDiscount = document.getElementById('cust-txn-discount');
  const tReceived = document.getElementById('cust-txn-received');
  const tDue = document.getElementById('cust-txn-due');
  const uidSelect = document.getElementById('cust-txn-uid');
  const dueInfo = document.getElementById('cust-txn-due-info');
  const currentDueEl = document.getElementById('cust-txn-current-due');
  const remainingDueEl = document.getElementById('cust-txn-remaining-due');

  let selectedCustomerDue = 0;

  const resetDueInfo = () => {
    selectedCustomerDue = 0;
    if (currentDueEl) {
      currentDueEl.textContent = '0.00';
      currentDueEl.dataset.rawDue = '0';
    }
    if (remainingDueEl) remainingDueEl.textContent = '0.00';
    dueInfo?.classList.add('hidden');
  };

  const runTxnCalculations = () => {
    const sell = parseFloat(tSell?.value) || 0;
    const discount = parseFloat(tDiscount?.value) || 0;
    const received = parseFloat(tReceived?.value) || 0;
    const txnDue = sell - discount - received;
    if (tDue) tDue.value = txnDue.toFixed(2);
    const remaining = Math.max(0, selectedCustomerDue + sell - discount - received);
    if (remainingDueEl) remainingDueEl.textContent = remaining.toFixed(2);
  };

  const onCustomerSelected = () => {
    const uid = uidSelect?.value || '';
    if (!uid) { resetDueInfo(); runTxnCalculations(); return; }
    const rec = cachedCustomerRecords.find((r) => getCol(r, ["System Unique ID", "Sys UID", "UNIQUEID"]) === uid);
    selectedCustomerDue = getCustomerDueBalance(rec);
    if (currentDueEl) {
      currentDueEl.textContent = selectedCustomerDue.toFixed(2);
      currentDueEl.dataset.rawDue = String(selectedCustomerDue);
    }
    dueInfo?.classList.remove('hidden');
    runTxnCalculations();
  };

  [tSell, tDiscount, tReceived].forEach((el) => el?.addEventListener('input', runTxnCalculations));
  uidSelect?.addEventListener('change', onCustomerSelected);

  const methodInput = document.getElementById('cust-txn-method');
  if (methodInput && methodInput.tagName === 'SELECT') {
      let hasPrevDue = Array.from(methodInput.options).some(o => o.value === 'Previous Due');
      if (!hasPrevDue) {
          methodInput.insertAdjacentHTML('beforeend', `<option value="Previous Due" class="font-bold text-slate-700 bg-slate-100">📌 Previous Due</option>`);
      }
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('customer_transactions')) return;
    const currentUser = fetchSessionUser();
    runTxnCalculations();
    const rowPayload = [
      document.getElementById('cust-txn-date').value,
      document.getElementById('cust-txn-uid').value,
      parseFloat(tSell.value) || 0,
      parseFloat(tDiscount?.value) || 0,
      parseFloat(tReceived.value) || 0,
      document.getElementById('cust-txn-method').value,
      parseFloat(tDue.value) || 0,
      document.getElementById('cust-txn-remarks').value.trim(),
      currentUser.username,
      new Date().toLocaleString()
    ];
    try {
      const result = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Customer_Transactions", rowData: rowPayload } });
      alert(result.message);
      if (result.success) {
        form.reset();
        document.getElementById('cust-txn-date').value = new Date().toISOString().split('T')[0];
        if (tDiscount) tDiscount.value = '0';
        resetDueInfo();
        runTxnCalculations();
        await populateCustomerTxnDropdown();
        await loadCustomerTxnTableRecords(true);
        await updateLiveUserCashDrawerBalance();
      }
    } catch (err) { alert(t('alert.errorLog')); }
  };

  runTxnCalculations();
}

async function loadCustomerTxnTableRecords(isFilter = false) {
  const container = document.getElementById('table-cust-txn-rows'); if (!container) return;
  const fDateInput = document.getElementById('filter-from-cust');
  const tDateInput = document.getElementById('filter-to-cust');

  if (!isFilter) { container.innerHTML = `<tr><td colspan="11" class="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b">${t('ledger.selectDatesPrompt')}</td></tr>`; return; }
  if (!fDateInput.value || !tDateInput.value) { alert(t('ledger.bothDatesRequired')); return; }

  container.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-blue-500 font-bold">${t('ledger.querying')}</td></tr>`;
  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Customer_Transactions" } });
    if (result.success) {
      const fDate = new Date(fDateInput.value); fDate.setHours(0,0,0,0);
      const tDate = new Date(tDateInput.value); tDate.setHours(23,59,59,999);
      let filtered = result.records.filter(rec => { if (!rec["Date"]) return false; const rDate = new Date(rec["Date"]); return rDate >= fDate && rDate <= tDate; });

      if (filtered.length === 0) { container.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-gray-500 font-bold">${t('ledger.noRecordsInRange')}</td></tr>`; return; }
      cacheTxnRecords("Customer_Transactions", filtered);
      container.innerHTML = filtered.reverse().map(rec => {
        const uid = getCol(rec, ["System Unique ID", "Sys UID", "UNIQUEID"]) || '';
        const soldAmt = parseFloat(getCol(rec, ["Sold Amount", "Sold Amt", "SOLDAMT"])) || 0;
        const discAmt = parseFloat(getCol(rec, ["Discount", "Discount Amount", "Txn Discount"])) || 0;
        const recAmt = parseFloat(getCol(rec, ["Received Amount", "Received Amt", "RECEIVEDAMT"])) || 0;
        const method = getCol(rec, ["Payment Method", "Method", "METHOD"]) || '';
        const dueAmt = parseFloat(getCol(rec, ["Transaction Due", "Txn Due", "TXNDUE", "Due"])) || 0;
        const remarks = getCol(rec, ["Remarks", "Remarks / Reference"]) || '-';
        const methodColor = method === "Cash" ? "text-emerald-600 bg-emerald-50" : (method === "Card" ? "text-blue-600 bg-blue-50" : "text-slate-600 bg-slate-50");
        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap"><td>${rec["Date"] ? new Date(rec["Date"]).toLocaleDateString() : ''}</td><td class="font-bold font-mono text-[11px]">${uid}</td><td class="font-mono">${soldAmt.toFixed(2)}</td><td class="font-mono text-purple-600">${discAmt.toFixed(2)}</td><td class="font-mono font-bold text-emerald-600">${recAmt.toFixed(2)}</td><td><span class="px-2 py-0.5 font-bold rounded text-[10px] ${methodColor}">${getCategoryLabel(method, t)}</span></td><td class="font-mono text-red-600 font-bold">${dueAmt.toFixed(2)}</td><td class="max-w-xs truncate" title="${remarks}">${remarks}</td><td>${getCol(rec, ["Logged By", "Username"]) || ''}</td><td class="text-gray-400 text-[10px] font-mono">${getCol(rec, ["Stamp", "Timestamp"]) || ''}</td>${renderTxnActions(rec, "Customer_Transactions")}</tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="11" class="p-3 text-center text-red-500 font-bold">${t('ledger.loadFailedTracker')}</td></tr>`; }
}

function upsertCustomerInCache(customerRecord) {
  const uid = getCol(customerRecord, ["System Unique ID", "Sys UID", "UNIQUEID"]);
  if (!uid) return;
  cachedCustomerRecords = [
    customerRecord,
    ...cachedCustomerRecords.filter(r => getCol(r, ["System Unique ID", "Sys UID", "UNIQUEID"]) !== uid)
  ];
}

function renderCustomerTxnDropdownOptions(records) {
  return `<option value="">${t('dropdown.chooseAccountUid')}</option>` + records.map(c => {
    const uid = getCol(c, ["System Unique ID", "Sys UID", "UNIQUEID"]);
    const name = getCol(c, ["Customer Name", "Name"]);
    const due = getCustomerDueBalance(c);
    return `<option value="${uid}">${uid} (${name}) — ${t('col.dueBalance')}: ${due.toFixed(2)}</option>`;
  }).join('');
}

async function populateCustomerTxnDropdown() {
  const dropdown = document.getElementById('cust-txn-uid'); if (!dropdown) return;
  dropdown.innerHTML = `<option value="">${t('dropdown.loadingCustomers')}</option>`;

  let records = [];
  let fetchFailed = false;

  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Customers" } });
    if (result.success && Array.isArray(result.records)) {
      cachedCustomerRecords = result.records;
      records = filterCustomersForCurrentUser(result.records);
    } else if (cachedCustomerRecords.length > 0) {
      records = filterCustomersForCurrentUser(cachedCustomerRecords);
    }
  } catch (err) {
    fetchFailed = true;
    console.error("Customer dropdown fetch failed:", err);
    if (cachedCustomerRecords.length > 0) records = filterCustomersForCurrentUser(cachedCustomerRecords);
  }

  if (records.length > 0) {
    dropdown.innerHTML = renderCustomerTxnDropdownOptions(records);
    return;
  }

  const emptyMsg = !canViewAllCustomers() && !fetchFailed
    ? t('dropdown.noOwnCustomers')
    : (fetchFailed ? t('dropdown.serverError') : t('dropdown.noCustomers'));
  dropdown.innerHTML = `<option value="">${emptyMsg}</option>`;
}

/**
 * MODULE: INTERNAL TRANSFER EXECUTION ENGINE
 */
function initInternalTransferFormListeners() {
  const form = document.getElementById('form-internal-entry'); if (!form) return;
  const dateInput = document.getElementById('int-date'); if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('internal_transfer')) return;
    const currentUser = fetchSessionUser();
    const amountVal = parseFloat(document.getElementById('int-amount').value) || 0;
    
    const rowPayload = [
      document.getElementById('int-date').value,
      amountVal,
      document.getElementById('int-desc').value.trim(),
      currentUser.username,
      new Date().toLocaleString()
    ];
    try {
      const result = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Internal_Transfers", rowData: rowPayload } }); alert(result.message);
      if (result.success) { form.reset(); if (dateInput) dateInput.value = new Date().toISOString().split('T')[0]; await loadInternalTransferTableRecords(true); await updateLiveUserCashDrawerBalance(); }
    } catch (err) { alert(t('alert.errorLog')); }
  };
}

async function loadInternalTransferTableRecords(isFilter = false) {
  const container = document.getElementById('table-internal-rows'); if (!container) return;
  const fDateInput = document.getElementById('filter-from-int');
  const tDateInput = document.getElementById('filter-to-int');

  if (!isFilter) { container.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b">${t('ledger.selectDatesPrompt')}</td></tr>`; return; }
  if (!fDateInput.value || !tDateInput.value) { alert(t('ledger.bothDatesRequired')); return; }

  container.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-blue-500 font-bold">${t('ledger.querying')}</td></tr>`;
  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Internal_Transfers" } });
    if (result.success) {
      const fDate = new Date(fDateInput.value); fDate.setHours(0,0,0,0);
      const tDate = new Date(tDateInput.value); tDate.setHours(23,59,59,999);
      let filtered = result.records.filter(rec => { if (!rec["Date"]) return false; const rDate = new Date(rec["Date"]); return rDate >= fDate && rDate <= tDate; });

      if (filtered.length === 0) { container.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500 font-bold">${t('ledger.noHandovers')}</td></tr>`; return; }
      cacheTxnRecords("Internal_Transfers", filtered);
      container.innerHTML = filtered.reverse().map(rec => {
        const dateVal = getCol(rec, ["Date"]); const uid = getCol(rec, ["System Unique ID", "ID", "Tracking ID"]) || ''; const amt = parseFloat(getCol(rec, ["Transfer Amount", "Amount"])) || 0; const desc = getCol(rec, ["Description", "Description / Purpose"]) || '-'; const userVal = getCol(rec, ["Transferred By", "Username", "Logged By"]) || ''; const stamp = getCol(rec, ["System Stamp", "Timestamp"]) || '';
        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap"><td class="p-2.5">${dateVal ? new Date(dateVal).toLocaleDateString() : ''}</td><td class="font-mono text-gray-400 text-[11px]">${uid}</td><td class="font-mono font-bold text-emerald-600">SAR ${amt.toFixed(2)}</td><td class="max-w-xs truncate" title="${desc}">${desc}</td><td class="font-bold text-gray-800">${userVal}</td><td class="text-gray-400 text-[10px] font-mono">${stamp}</td>${renderTxnActions(rec, "Internal_Transfers")}</tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="7" class="p-3 text-center text-red-500 font-bold">${t('ledger.loadFailedTransfer')}</td></tr>`; }
}

/**
 * MODULE: EXPENSE CATEGORIES CONFIGURATION MATRIX
 */
function initExpenseHeadFormListeners() {
  const form = document.getElementById('form-exp-head-entry'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('expense_heads')) return;
    const currentUser = fetchSessionUser();
    const mainHead = document.getElementById('exp-head-main').value.trim();
    const subHead = document.getElementById('exp-head-sub').value.trim();
    const trackingUID = `EXP-${mainHead.substring(0,3).toUpperCase()}-${subHead.substring(0,3).toUpperCase()}`;
    const payloadRow = [ trackingUID, mainHead, subHead, currentUser.username, new Date().toLocaleString() ];
    try {
      const res = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Expense_Heads", rowData: payloadRow } }); alert(res.message); if (res.success) { form.reset(); await loadExpenseHeadTableRecords(); }
    } catch (err) { alert(t('alert.errorCommit')); }
  });
}

async function loadExpenseHeadTableRecords() {
  const container = document.getElementById('table-exp-head-rows'); if (!container) return;
  container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-gray-400">${t('heads.loadingStructures')}</td></tr>`;
  try {
    const resultHeads = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Expense_Heads" } });
    const resultTxns = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Expense_Transactions" } });

    if (resultHeads.success) {
      cachedExpenseHeads = resultHeads.records; const txns = resultTxns.success ? resultTxns.records : [];
      if (cachedExpenseHeads.length === 0) { container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-gray-400">${t('heads.noStructures')}</td></tr>`; return; }
      
      // --- MASTER INTERCEPTOR ENGINE ---
      let headTotals = {};

      txns.forEach(t => {
          let mHead = String(getCol(t, EXPENSE_TXN_FIELDS.main)).trim().toUpperCase();
          let sHead = String(getCol(t, EXPENSE_TXN_FIELDS.sub)).trim().toUpperCase();
          const amounts = parseTxnDualAmounts(t, EXPENSE_TXN_FIELDS);
          let key = mHead + "|||" + sHead;
          if (!headTotals[key]) headTotals[key] = { incurred: 0, paid: 0, discount: 0, prevDue: 0 };

          if (isDualTxnPrevDue(t, EXPENSE_TXN_FIELDS)) {
              headTotals[key].prevDue += Math.max(amounts.bill, amounts.pay);
          } else {
              headTotals[key].incurred += amounts.bill;
              headTotals[key].paid += amounts.pay;
              headTotals[key].discount += amounts.discount;
          }
      });
      
      container.innerHTML = cachedExpenseHeads.map(rec => {
        const trackingId = getCol(rec, ["Tracking ID", "System Unique ID", "ID"]) || '';
        const mainHead = getCol(rec, ["Parent Head", "Expense Parent Head", "Main Head", "Parent Category"]) || '';
        const subHead = getCol(rec, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';
        
        let mHeadUpper = String(mainHead).trim().toUpperCase();
        let sHeadUpper = String(subHead).trim().toUpperCase();
        let key = mHeadUpper + "|||" + sHeadUpper;

        let rowDeposit = headTotals[key] ? headTotals[key].incurred : 0;
        let rowPaid = headTotals[key] ? headTotals[key].paid : 0;
        let rowDiscount = headTotals[key] ? headTotals[key].discount : 0;

        if (headTotals[key] && headTotals[key].prevDue) {
            rowDeposit += headTotals[key].prevDue;
        }

        if (rowDeposit === 0 && rowPaid === 0) {
           rowDeposit = getExpenseIncurredAmt(rec);
           rowPaid = getExpensePaidAmt(rec);
        }
        
        const rowDue = Math.max(0, rowDeposit - rowDiscount - rowPaid);

        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap">
          <td class="p-2.5 font-mono text-gray-400 text-[11px]">${trackingId}</td><td class="font-bold text-gray-800">${mainHead}</td><td class="text-blue-600 font-medium">${subHead}</td>
          <td class="font-mono font-bold text-gray-700">SAR ${rowDeposit.toFixed(2)}</td>
          <td class="font-mono font-bold text-emerald-600">SAR ${rowPaid.toFixed(2)}</td>
          <td class="font-mono font-bold text-red-600">SAR ${rowDue.toFixed(2)}</td>
          <td>${getCol(rec, ["Authorized By", "Username", "Logged By"]) || ''}</td><td class="text-gray-400 font-mono text-[10px]">${getCol(rec, ["Creation Stamp", "Timestamp"]) || ''}</td>
        </tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-red-500 font-bold">${t('heads.loadFailed')}</td></tr>`; }
}

/**
 * MODULE: EXPENSE TRANSACTION LEDGER MODULE (UPGRADED)
 */
async function populateExpenseHeadDropdowns(mode = "all") {
  const mainSelect = document.getElementById('exp-txn-main'); if (!mainSelect) return;
  const subSelect = document.getElementById('exp-txn-sub');
  mainSelect.innerHTML = `<option value="">${t('dropdown.loadingStructures')}</option>`;
  try {
    const [headRes, txnRes] = await Promise.all([
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Expense_Heads" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Expense_Transactions" } })
    ]);
    cachedExpenseTxns = txnRes.success ? txnRes.records : [];
    if (headRes.success && headRes.records.length > 0) {
      cachedExpenseHeads = headRes.records;
      const uniqueParents = [...new Set(cachedExpenseHeads.map(r => getCol(r, ["Parent Head", "Expense Parent Head"])))];
      mainSelect.innerHTML = `<option value="">${t('dropdown.chooseCategory')}</option>` + uniqueParents.map(h => `<option value="${h}">${h}</option>`).join('');
      const refreshSubDue = () => {
        const main = mainSelect.value;
        const sub = subSelect?.value || '';
        if (!main || !sub) return;
        if (typeof window._expDueCtrl?.showCurrentDue === 'function') {
          window._expDueCtrl.showCurrentDue(computeHeadPairDueBalance(main, sub, cachedExpenseTxns, EXPENSE_TXN_FIELDS));
        }
      };
      mainSelect.onchange = () => {
        renderHeadSubSelect(subSelect, mainSelect.value, cachedExpenseHeads, ["Parent Head", "Expense Parent Head"], ["Sub Head Name", "Sub Head"], cachedExpenseTxns, EXPENSE_TXN_FIELDS, mode);
        if (typeof window._expDueCtrl?.resetDueInfo === 'function') window._expDueCtrl.resetDueInfo();
        subSelect.onchange = refreshSubDue;
      };
      if (mainSelect.value) renderHeadSubSelect(subSelect, mainSelect.value, cachedExpenseHeads, ["Parent Head", "Expense Parent Head"], ["Sub Head Name", "Sub Head"], cachedExpenseTxns, EXPENSE_TXN_FIELDS, mode);
    } else { mainSelect.innerHTML = `<option value="">${t('dropdown.setupExpenseFirst')}</option>`; }
  } catch (err) { mainSelect.innerHTML = `<option value="">${t('dropdown.errorCompiling')}</option>`; }
}

function initExpenseTxnFormListeners() {
  const form = document.getElementById('form-exp-txn-entry'); if (!form) return;
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const dateInput = document.getElementById('exp-txn-date'); if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  const mainSelect = document.getElementById('exp-txn-main');
  const subSelect = document.getElementById('exp-txn-sub');
  const catSelect = document.getElementById('exp-txn-category');
  const billInput = document.getElementById('exp-txn-deposit');
  const discountInput = document.getElementById('exp-txn-discount');
  const payInput = document.getElementById('exp-txn-paid');
  const remarksInput = document.getElementById('exp-txn-remarks');
  const dueCtrl = createDualTxnDueController({
    billInput,
    discountInput,
    payInput,
    dueInput: document.getElementById('exp-txn-due'),
    dueInfoBox: document.getElementById('exp-txn-due-info'),
    currentDueEl: document.getElementById('exp-txn-current-due'),
    remainingDueEl: document.getElementById('exp-txn-remaining-due')
  });
  window._expDueCtrl = dueCtrl;

  const categoryHandlers = initDualTxnCategoryHandlers({
    catSelect, billInput, discountInput, payInput, remarksInput, subSelect, fieldMap: EXPENSE_TXN_FIELDS, dueCtrl,
    refreshSubDropdown: (mode) => renderHeadSubSelect(subSelect, mainSelect?.value, cachedExpenseHeads, ["Parent Head", "Expense Parent Head"], ["Sub Head Name", "Sub Head"], cachedExpenseTxns, EXPENSE_TXN_FIELDS, mode)
  });

  const refreshDueInfo = () => {
    const main = mainSelect?.value || '';
    const sub = subSelect?.value || '';
    if (!main || !sub) { dueCtrl.resetDueInfo(); dueCtrl.runCalculations(); return; }
    dueCtrl.showCurrentDue(computeHeadPairDueBalance(main, sub, cachedExpenseTxns, EXPENSE_TXN_FIELDS));
  };
  subSelect?.addEventListener('change', refreshDueInfo);
  mainSelect?.addEventListener('change', () => { dueCtrl.resetDueInfo(); dueCtrl.runCalculations(); });
  categoryHandlers.applyCategoryMode();

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('expense_transactions')) return;
    const currentUser = fetchSessionUser(); dueCtrl.runCalculations();
    const { category, remarksText, bill, discount, pay, txnDue } = categoryHandlers.prepareSubmit();
    const txnDate = document.getElementById('exp-txn-date').value;
    const txnId = buildModuleTxnTrackingId("EXT", mainSelect.value, subSelect.value, txnDate);
    const rowPayload = [
      txnId,
      txnDate,
      mainSelect.value,
      subSelect.value,
      bill,
      discount,
      pay,
      txnDue,
      category,
      remarksText,
      currentUser.username,
      new Date().toLocaleString()
    ];
    try {
      const result = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Expense_Transactions", rowData: rowPayload } }); alert(result.message);
      if (result.success) {
        form.reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (discountInput) discountInput.value = '0';
        categoryHandlers.resetInputs();
        dueCtrl.resetDueInfo();
        dueCtrl.runCalculations();
        await populateExpenseHeadDropdowns();
        await loadExpenseTxnTableRecords(true);
        await updateLiveUserCashDrawerBalance();
      }
    } catch (err) { alert(t('alert.errorLog')); }
  };

  dueCtrl.runCalculations();
}

async function loadExpenseTxnTableRecords(isFilter = false) {
  const container = document.getElementById('table-exp-txn-rows'); if (!container) return;
  const paidSumBox = document.getElementById('expense-total-paid');
  const dueSumBox = document.getElementById('expense-total-due');
  const fDateInput = document.getElementById('filter-from-exp');
  const tDateInput = document.getElementById('filter-to-exp');

  if (!isFilter) { 
    container.innerHTML = `<tr><td colspan="13" class="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b">${t('ledger.selectDatesPrompt')}</td></tr>`;
    if (paidSumBox) paidSumBox.textContent = "0.00";
    if (dueSumBox) dueSumBox.textContent = "0.00";
    return;
  }
  if (!fDateInput.value || !tDateInput.value) { alert(t('ledger.bothDatesRequired')); return; }

  container.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-blue-500 font-bold">${t('ledger.querying')}</td></tr>`;
  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Expense_Transactions" } });
    if (result.success) {
      const fDate = new Date(fDateInput.value); fDate.setHours(0,0,0,0);
      const tDate = new Date(tDateInput.value); tDate.setHours(23,59,59,999);
      let filtered = result.records.filter(rec => { if (!rec["Date"]) return false; const rDate = new Date(rec["Date"]); return rDate >= fDate && rDate <= tDate; });

      let totalPaidAcc = 0;
      let totalDueAcc = 0;
      
      if (filtered.length === 0) { 
        container.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-gray-500 font-bold">${t('ledger.noExpenditure')}</td></tr>`; 
        if (paidSumBox) paidSumBox.textContent = "0.00"; 
        if (dueSumBox) dueSumBox.textContent = "0.00"; 
        return; 
      }
      
      cacheTxnRecords("Expense_Transactions", filtered);
      container.innerHTML = filtered.reverse().map(rec => {
        const amounts = parseTxnDualAmounts(rec, EXPENSE_TXN_FIELDS);
        totalPaidAcc += amounts.pay;
        totalDueAcc += amounts.txnDue;
        
        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap">
          <td class="p-2.5">${rec["Date"] ? new Date(rec["Date"]).toLocaleDateString() : ''}</td>
          <td class="font-mono text-gray-400 text-[10px]">${getCol(rec, EXPENSE_TXN_FIELDS.txnId) || '-'}</td>
          <td class="font-bold text-gray-900">${getCol(rec, EXPENSE_TXN_FIELDS.main) || ''}</td>
          <td class="text-blue-600">${getCol(rec, EXPENSE_TXN_FIELDS.sub) || ''}</td>
          <td class="font-mono text-gray-700">${amounts.bill.toFixed(2)}</td>
          <td class="font-mono text-purple-600">${amounts.discount.toFixed(2)}</td>
          <td class="font-mono font-bold text-emerald-600">${amounts.pay.toFixed(2)}</td>
          <td class="font-mono font-bold text-red-600">${amounts.txnDue.toFixed(2)}</td>
          ${renderDualTxnTypeCell(amounts.category, EXPENSE_TXN_FIELDS)}
          <td class="max-w-xs truncate" title="${getCol(rec, EXPENSE_TXN_FIELDS.remarks) || ''}">${getCol(rec, EXPENSE_TXN_FIELDS.remarks) || '-'}</td>
          <td>${getCol(rec, ["Logged By", "Username"]) || ''}</td>
          <td class="text-gray-400 font-mono text-[10px]">${getCol(rec, ["Timestamp"]) || ''}</td>
          ${renderTxnActions(rec, "Expense_Transactions")}
        </tr>`;
      }).join('');
      
      if (paidSumBox) paidSumBox.textContent = totalPaidAcc.toFixed(2);
      if (dueSumBox) dueSumBox.textContent = totalDueAcc.toFixed(2);
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="13" class="p-3 text-center text-red-500 font-bold">${t('ledger.loadFailedExpense')}</td></tr>`; }
}

/**
 * MODULE: CREDITOR HEADS & TRANSACTIONS (LIABILITIES)
 */
function initCreditorFormListeners() {
  const form = document.getElementById('form-cred-head-entry'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('creditors')) return;
    const currentUser = fetchSessionUser();
    const mainHead = document.getElementById('cred-head-main').value.trim();
    const subHead = document.getElementById('cred-head-sub').value.trim();
    const trackingUID = `CRD-${mainHead.substring(0,3).toUpperCase()}-${subHead.substring(0,3).toUpperCase()}`;
    const payloadRow = [ trackingUID, mainHead, subHead, currentUser.username, new Date().toLocaleString() ];
    try {
      const res = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Creditor_Heads", rowData: payloadRow } }); alert(res.message); if (res.success) { form.reset(); await loadCreditorTableRecords(); }
    } catch (err) { alert(t('alert.errorCommit')); }
  });
}

async function loadCreditorTableRecords() {
  const container = document.getElementById('table-cred-head-rows'); if (!container) return;
  container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-gray-400">${t('heads.loadingStructures')}</td></tr>`;
  try {
    const resultHeads = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Creditor_Heads" } });
    const resultTxns = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Creditor_Transactions" } });

    if (resultHeads.success) {
      cachedCreditors = resultHeads.records; const txns = resultTxns.success ? resultTxns.records : [];
      if (cachedCreditors.length === 0) { container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-gray-400">No creditors mapped yet.</td></tr>`; return; }
      
      // --- MASTER INTERCEPTOR ENGINE ---
      let headTotals = {};
      let prevDueTotals = {};

      txns.forEach(t => {
          let mHead = String(getCol(t, ["Creditor Parent Head", "Parent Head", "Main Head"])).trim().toUpperCase();
          let sHead = String(getCol(t, ["Sub Head", "SubCategory"])).trim().toUpperCase();
          let rem = String(getCol(t, ["Remarks", "Remarks / Reference", "Description"])).trim().toUpperCase();
          const amounts = parseTxnDualAmounts(t, CREDITOR_TXN_FIELDS);
          let isPrevDue = sHead.includes("PREVIOUS DUE") || rem.includes("PREVIOUS DUE") || rem.includes("OPENING BALANCE");

          if (isPrevDue) {
              if (!prevDueTotals[mHead]) prevDueTotals[mHead] = 0;
              prevDueTotals[mHead] += Math.max(amounts.bill, amounts.pay);
          } else {
              let key = mHead + "|||" + sHead;
              if (!headTotals[key]) headTotals[key] = { recv: 0, ret: 0, disc: 0 };
              headTotals[key].recv += amounts.bill;
              headTotals[key].ret += amounts.pay;
              headTotals[key].disc += amounts.discount;
          }
      });

      container.innerHTML = cachedCreditors.map(rec => {
        const trackingId = getCol(rec, ["Tracking ID", "System Unique ID", "ID"]) || '';
        const mainHead = getCol(rec, ["Creditor Parent Head", "Parent Head", "Main Head"]) || '';
        const subHead = getCol(rec, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';
        
        let mHeadUpper = String(mainHead).trim().toUpperCase();
        let sHeadUpper = String(subHead).trim().toUpperCase();
        let key = mHeadUpper + "|||" + sHeadUpper;

        let rowReceived = headTotals[key] ? headTotals[key].recv : 0;
        let rowReturned = headTotals[key] ? headTotals[key].ret : 0;
        let rowDiscount = headTotals[key] ? headTotals[key].disc : 0;
        
        if (prevDueTotals[mHeadUpper]) {
            rowReceived += prevDueTotals[mHeadUpper];
            prevDueTotals[mHeadUpper] = 0; 
        }
        
        const rowDue = Math.max(0, rowReceived - rowDiscount - rowReturned);

        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap">
          <td class="p-2.5 font-mono text-gray-400 text-[11px]">${trackingId}</td><td class="font-bold text-gray-800">${mainHead}</td><td class="text-orange-600 font-medium">${subHead}</td>
          <td class="font-mono font-bold text-gray-700">SAR ${rowReceived.toFixed(2)}</td>
          <td class="font-mono font-bold text-emerald-600">SAR ${rowReturned.toFixed(2)}</td>
          <td class="font-mono font-bold text-red-600">SAR ${rowDue.toFixed(2)}</td>
          <td>${getCol(rec, ["Created By", "Authorized By", "Username"]) || ''}</td><td class="text-gray-400 font-mono text-[10px]">${getCol(rec, ["Creation Stamp", "Timestamp"]) || ''}</td>
        </tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-red-500 font-bold">${t('heads.loadFailed')}</td></tr>`; }
}

function renderHeadSubSelect(subSelect, parent, heads, mainCol, subCol, txns, fieldMap, mode = "all") {
  if (!subSelect) return;
  if (!parent) {
    subSelect.innerHTML = `<option value="">${t("dropdown.chooseParentFirst")}</option>`;
    return;
  }
  let subs = heads.filter((r) => getCol(r, mainCol) === parent).map((s) => {
    const sName = getCol(s, subCol);
    const due = computeHeadPairDueBalance(parent, sName, txns, fieldMap);
    return { sName, due };
  });
  if (mode === "with-due") subs = subs.filter((s) => s.due > 0.009);
  if (subs.length === 0) {
    subSelect.innerHTML = `<option value="">${mode === "with-due" ? (t("dropdown.noSubHeadWithDue") || "No sub heads with due balance") : t("dropdown.chooseSubHead")}</option>`;
    return;
  }
  subSelect.innerHTML = `<option value="">${t("dropdown.chooseSubHead")}</option>` + subs.map((s) =>
    `<option value="${s.sName}">${s.sName} — ${t("col.dueBalance")}: ${s.due.toFixed(2)}</option>`
  ).join("");
}

function renderDualTxnTypeCell(category, fieldMap) {
  const cat = String(category || "");
  const catKey = cat.toLowerCase();
  const isPrev = catKey.includes("previous due");
  const isPay = catKey === String(fieldMap.categories?.pay || "").toLowerCase();
  const typeLabel = isPrev ? t("dropdown.previousDuePin") : (isPay ? t("category.paymentDecreases") : (cat || fieldMap.categories?.bill || "-"));
  const typeColor = isPrev ? "text-slate-700 bg-slate-200" : (isPay ? "text-emerald-600 bg-emerald-50" : "text-blue-600 bg-blue-50");
  return `<td><span class="px-2 py-0.5 font-bold rounded text-[10px] ${typeColor}">${typeLabel}</span></td>`;
}

async function populateCreditorDropdowns(mode = "all") {
  const mainSelect = document.getElementById('cred-txn-main'); if (!mainSelect) return;
  const subSelect = document.getElementById('cred-txn-sub');
  mainSelect.innerHTML = `<option value="">${t('dropdown.loadingStructures')}</option>`;
  try {
    const [headRes, txnRes] = await Promise.all([
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Creditor_Heads" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Creditor_Transactions" } })
    ]);
    cachedCreditorTxns = txnRes.success ? txnRes.records : [];
    if (headRes.success && headRes.records.length > 0) {
      cachedCreditors = headRes.records;
      const uniqueParents = [...new Set(cachedCreditors.map(r => getCol(r, ["Creditor Parent Head", "Parent Head", "Main Head"])))];
      mainSelect.innerHTML = `<option value="">${t('dropdown.chooseCreditor')}</option>` + uniqueParents.map(h => `<option value="${h}">${h}</option>`).join('');
      const refreshSubDue = () => {
        const main = mainSelect.value;
        const sub = subSelect?.value || '';
        if (!main || !sub) return;
        if (typeof window._credDueCtrl?.showCurrentDue === 'function') {
          window._credDueCtrl.showCurrentDue(computeHeadPairDueBalance(main, sub, cachedCreditorTxns, CREDITOR_TXN_FIELDS));
        }
      };
      mainSelect.onchange = () => {
        renderHeadSubSelect(subSelect, mainSelect.value, cachedCreditors, ["Creditor Parent Head", "Parent Head", "Main Head"], ["Sub Head Name", "Sub Head"], cachedCreditorTxns, CREDITOR_TXN_FIELDS, mode);
        if (typeof window._credDueCtrl?.resetDueInfo === 'function') window._credDueCtrl.resetDueInfo();
        subSelect.onchange = refreshSubDue;
      };
      if (mainSelect.value) renderHeadSubSelect(subSelect, mainSelect.value, cachedCreditors, ["Creditor Parent Head", "Parent Head", "Main Head"], ["Sub Head Name", "Sub Head"], cachedCreditorTxns, CREDITOR_TXN_FIELDS, mode);
    } else { mainSelect.innerHTML = `<option value="">${t('dropdown.setupCreditorFirst')}</option>`; }
  } catch (err) { mainSelect.innerHTML = `<option value="">Error compiling data</option>`; }
}

function initCreditorTxnFormListeners() {
  const form = document.getElementById('form-cred-txn-entry'); if (!form) return;
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const dateInput = document.getElementById('cred-txn-date'); if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  const mainSelect = document.getElementById('cred-txn-main');
  const subSelect = document.getElementById('cred-txn-sub');
  const catSelect = document.getElementById('cred-txn-category');
  const billInput = document.getElementById('cred-txn-received');
  const discountInput = document.getElementById('cred-txn-discount');
  const payInput = document.getElementById('cred-txn-return');
  const remarksInput = document.getElementById('cred-txn-remarks');
  const dueCtrl = createDualTxnDueController({
    billInput,
    discountInput,
    payInput,
    dueInput: document.getElementById('cred-txn-due'),
    dueInfoBox: document.getElementById('cred-txn-due-info'),
    currentDueEl: document.getElementById('cred-txn-current-due'),
    remainingDueEl: document.getElementById('cred-txn-remaining-due')
  });
  window._credDueCtrl = dueCtrl;

  const categoryHandlers = initDualTxnCategoryHandlers({
    catSelect, billInput, discountInput, payInput, remarksInput, subSelect, fieldMap: CREDITOR_TXN_FIELDS, dueCtrl,
    refreshSubDropdown: (mode) => renderHeadSubSelect(subSelect, mainSelect?.value, cachedCreditors, ["Creditor Parent Head", "Parent Head", "Main Head"], ["Sub Head Name", "Sub Head"], cachedCreditorTxns, CREDITOR_TXN_FIELDS, mode)
  });

  const refreshDueInfo = () => {
    const main = mainSelect?.value || '';
    const sub = subSelect?.value || '';
    if (!main || !sub) { dueCtrl.resetDueInfo(); dueCtrl.runCalculations(); return; }
    dueCtrl.showCurrentDue(computeHeadPairDueBalance(main, sub, cachedCreditorTxns, CREDITOR_TXN_FIELDS));
  };
  subSelect?.addEventListener('change', refreshDueInfo);
  mainSelect?.addEventListener('change', () => { dueCtrl.resetDueInfo(); dueCtrl.runCalculations(); });

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('creditor_transactions')) return;
    const currentUser = fetchSessionUser(); dueCtrl.runCalculations();
    const { category, remarksText, bill, discount, pay, txnDue } = categoryHandlers.prepareSubmit();
    const txnDate = document.getElementById('cred-txn-date').value;
    const txnId = buildModuleTxnTrackingId("CRD", mainSelect.value, subSelect.value, txnDate);
    const rowPayload = [
      txnId,
      txnDate,
      mainSelect.value,
      subSelect.value,
      bill,
      discount,
      pay,
      txnDue,
      category,
      remarksText,
      currentUser.username,
      new Date().toLocaleString()
    ];
    try {
      const result = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Creditor_Transactions", rowData: rowPayload } }); alert(result.message);
      if (result.success) {
        form.reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (discountInput) discountInput.value = '0';
        categoryHandlers.resetInputs();
        dueCtrl.resetDueInfo();
        dueCtrl.runCalculations();
        await populateCreditorDropdowns();
        await loadCreditorTxnTableRecords(true);
        await loadCreditorTableRecords();
        await updateLiveUserCashDrawerBalance();
      }
    } catch (err) { alert(t('alert.errorLog')); }
  };

  dueCtrl.runCalculations();
}

async function loadCreditorTxnTableRecords(isFilter = false) {
  const container = document.getElementById('table-cred-txn-rows'); if (!container) return;
  const recSumBox = document.getElementById('cred-total-received');
  const retSumBox = document.getElementById('cred-total-returned');
  const fDateInput = document.getElementById('filter-from-cred');
  const tDateInput = document.getElementById('filter-to-cred');

  if (!isFilter) { 
    container.innerHTML = `<tr><td colspan="13" class="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b">${t('ledger.selectDatesPrompt')}</td></tr>`;
    if (recSumBox) recSumBox.textContent = "0.00"; if (retSumBox) retSumBox.textContent = "0.00";
    return;
  }
  if (!fDateInput.value || !tDateInput.value) { alert(t('ledger.bothDatesRequired')); return; }

  container.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-orange-500 font-bold">${t('ledger.querying')}</td></tr>`;
  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Creditor_Transactions" } });
    if (result.success) {
      const fDate = new Date(fDateInput.value); fDate.setHours(0,0,0,0);
      const tDate = new Date(tDateInput.value); tDate.setHours(23,59,59,999);
      let filtered = result.records.filter(rec => { if (!rec["Date"]) return false; const rDate = new Date(rec["Date"]); return rDate >= fDate && rDate <= tDate; });

      let totalRecAcc = 0; let totalRetAcc = 0;
      
      if (filtered.length === 0) { 
        container.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-gray-500 font-bold">${t('ledger.noRecordsInRange')}</td></tr>`; 
        if (recSumBox) recSumBox.textContent = "0.00"; if (retSumBox) retSumBox.textContent = "0.00"; 
        return; 
      }
      
      cacheTxnRecords("Creditor_Transactions", filtered);
      container.innerHTML = filtered.reverse().map(rec => {
        const amounts = parseTxnDualAmounts(rec, CREDITOR_TXN_FIELDS);
        totalRecAcc += amounts.bill; totalRetAcc += amounts.pay;
        
        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap">
          <td class="p-2.5">${rec["Date"] ? new Date(rec["Date"]).toLocaleDateString() : ''}</td>
          <td class="font-mono text-gray-400 text-[10px]">${getCol(rec, CREDITOR_TXN_FIELDS.txnId) || '-'}</td>
          <td class="font-bold text-gray-900">${getCol(rec, CREDITOR_TXN_FIELDS.main) || ''}</td>
          <td class="text-orange-600">${getCol(rec, CREDITOR_TXN_FIELDS.sub) || ''}</td>
          <td class="font-mono text-gray-700">${amounts.bill.toFixed(2)}</td>
          <td class="font-mono text-purple-600">${amounts.discount.toFixed(2)}</td>
          <td class="font-mono font-bold text-emerald-600">${amounts.pay.toFixed(2)}</td>
          <td class="font-mono font-bold text-red-600">${amounts.txnDue.toFixed(2)}</td>
          ${renderDualTxnTypeCell(amounts.category, CREDITOR_TXN_FIELDS)}
          <td class="max-w-xs truncate" title="${getCol(rec, ["Remarks / Vouchers", "Remarks"]) || ''}">${getCol(rec, ["Remarks / Vouchers", "Remarks"]) || '-'}</td>
          <td>${getCol(rec, ["Logged By", "Username"]) || ''}</td>
          <td class="text-gray-400 font-mono text-[10px]">${getCol(rec, ["Timestamp"]) || ''}</td>
          ${renderTxnActions(rec, "Creditor_Transactions")}
        </tr>`;
      }).join('');
      
      if (recSumBox) recSumBox.textContent = totalRecAcc.toFixed(2);
      if (retSumBox) retSumBox.textContent = totalRetAcc.toFixed(2);
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="13" class="p-3 text-center text-red-500 font-bold">${t('ledger.loadFailedTracker')}</td></tr>`; }
}

/**
 * MODULE: INCOME HEADS & TRANSACTIONS (REVENUES)
 */
function initIncomeHeadFormListeners() {
  const form = document.getElementById('form-inc-head-entry'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('income_heads')) return;
    const currentUser = fetchSessionUser();
    const mainHead = document.getElementById('inc-head-main').value.trim();
    const subHead = document.getElementById('inc-head-sub').value.trim();
    const trackingUID = `INC-${mainHead.substring(0,3).toUpperCase()}-${subHead.substring(0,3).toUpperCase()}`;
    const payloadRow = [ trackingUID, mainHead, subHead, currentUser.username, new Date().toLocaleString() ];
    try {
      const res = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Income_Heads", rowData: payloadRow } }); alert(res.message); if (res.success) { form.reset(); await loadIncomeHeadTableRecords(); }
    } catch (err) { alert(t('alert.errorCommit')); }
  });
}

async function loadIncomeHeadTableRecords() {
  const container = document.getElementById('table-inc-head-rows'); if (!container) return;
  container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-gray-400">${t('heads.loadingStructures')}</td></tr>`;
  try {
    const resultHeads = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Income_Heads" } });
    const resultTxns = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Income_Transactions" } });

    if (resultHeads.success) {
      cachedIncomeHeads = resultHeads.records; const txns = resultTxns.success ? resultTxns.records : [];
      if (cachedIncomeHeads.length === 0) { container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-gray-400">No income categories mapped yet.</td></tr>`; return; }
      
      // --- MASTER INTERCEPTOR ENGINE ---
      let headTotals = {};

      txns.forEach(t => {
          let mHead = String(getCol(t, ["Income Parent Head", "Parent Head", "Main Head"])).trim().toUpperCase();
          let sHead = String(getCol(t, ["Sub Head", "SubCategory"])).trim().toUpperCase();
          let rem = String(getCol(t, ["Remarks", "Remarks / Reference", "Description"])).trim().toUpperCase();
          const amounts = parseTxnDualAmounts(t, INCOME_TXN_FIELDS);
          let isPrevDue = mHead.includes("PREVIOUS DUE") || sHead.includes("PREVIOUS DUE") || rem.includes("PREVIOUS DUE") || rem.includes("OPENING BALANCE");

          let key = mHead + "|||" + sHead;
          if (!headTotals[key]) headTotals[key] = { receivable: 0, received: 0, discount: 0, prevDue: 0 };

          if (isPrevDue) {
              headTotals[key].prevDue += Math.max(amounts.bill, amounts.pay);
          } else {
              headTotals[key].receivable += amounts.bill;
              headTotals[key].received += amounts.pay;
              headTotals[key].discount += amounts.discount;
          }
      });
      
      container.innerHTML = cachedIncomeHeads.map(rec => {
        const trackingId = getCol(rec, ["Tracking ID", "System Unique ID", "ID"]) || '';
        const mainHead = getCol(rec, ["Income Parent Head", "Parent Head", "Main Head"]) || '';
        const subHead = getCol(rec, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';
        
        let mHeadUpper = String(mainHead).trim().toUpperCase();
        let sHeadUpper = String(subHead).trim().toUpperCase();
        let key = mHeadUpper + "|||" + sHeadUpper;

        let rowReceivable = headTotals[key] ? headTotals[key].receivable : 0;
        let rowReceived = headTotals[key] ? headTotals[key].received : 0;
        let rowDiscount = headTotals[key] ? headTotals[key].discount : 0;
        
        if (headTotals[key] && headTotals[key].prevDue) {
            rowReceivable += headTotals[key].prevDue;
        }
        
        const rowDue = Math.max(0, rowReceivable - rowDiscount - rowReceived);

        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap">
          <td class="p-2.5 font-mono text-gray-400 text-[11px]">${trackingId}</td><td class="font-bold text-gray-800">${mainHead}</td><td class="text-blue-600 font-medium">${subHead}</td>
          <td class="font-mono font-bold text-gray-700">SAR ${rowReceivable.toFixed(2)}</td>
          <td class="font-mono font-bold text-emerald-600">SAR ${rowReceived.toFixed(2)}</td>
          <td class="font-mono font-bold text-red-600">SAR ${rowDue.toFixed(2)}</td>
          <td>${getCol(rec, ["Authorized By", "Created By", "Username"]) || ''}</td><td class="text-gray-400 font-mono text-[10px]">${getCol(rec, ["Creation Stamp", "Timestamp"]) || ''}</td>
        </tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-red-500 font-bold">${t('heads.loadFailed')}</td></tr>`; }
}

async function populateIncomeHeadDropdowns(mode = "all") {
  const mainSelect = document.getElementById('inc-txn-main'); if (!mainSelect) return;
  const subSelect = document.getElementById('inc-txn-sub');
  mainSelect.innerHTML = `<option value="">${t('dropdown.loadingStructures')}</option>`;
  try {
    const [headRes, txnRes] = await Promise.all([
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Income_Heads" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Income_Transactions" } })
    ]);
    cachedIncomeTxns = txnRes.success ? txnRes.records : [];
    if (headRes.success && headRes.records.length > 0) {
      cachedIncomeHeads = headRes.records;
      const uniqueParents = [...new Set(cachedIncomeHeads.map(r => getCol(r, ["Income Parent Head", "Parent Head", "Main Head"])))];
      mainSelect.innerHTML = `<option value="">-- Choose Income Category --</option>` + uniqueParents.map(h => `<option value="${h}">${h}</option>`).join('');
      const refreshSubDue = () => {
        const main = mainSelect.value;
        const sub = subSelect?.value || '';
        if (!main || !sub) return;
        if (typeof window._incDueCtrl?.showCurrentDue === 'function') {
          window._incDueCtrl.showCurrentDue(computeHeadPairDueBalance(main, sub, cachedIncomeTxns, INCOME_TXN_FIELDS));
        }
      };
      mainSelect.onchange = () => {
        renderHeadSubSelect(subSelect, mainSelect.value, cachedIncomeHeads, ["Income Parent Head", "Parent Head", "Main Head"], ["Sub Head Name", "Sub Head"], cachedIncomeTxns, INCOME_TXN_FIELDS, mode);
        if (typeof window._incDueCtrl?.resetDueInfo === 'function') window._incDueCtrl.resetDueInfo();
        subSelect.onchange = refreshSubDue;
      };
      if (mainSelect.value) renderHeadSubSelect(subSelect, mainSelect.value, cachedIncomeHeads, ["Income Parent Head", "Parent Head", "Main Head"], ["Sub Head Name", "Sub Head"], cachedIncomeTxns, INCOME_TXN_FIELDS, mode);
    } else { mainSelect.innerHTML = `<option value="">${t('dropdown.setupIncomeFirst')}</option>`; }
  } catch (err) { mainSelect.innerHTML = `<option value="">Error compiling data</option>`; }
}

function initIncomeTxnFormListeners() {
  const form = document.getElementById('form-inc-txn-entry'); if (!form) return;
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const dateInput = document.getElementById('inc-txn-date'); if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  const mainSelect = document.getElementById('inc-txn-main');
  const subSelect = document.getElementById('inc-txn-sub');
  const catSelect = document.getElementById('inc-txn-category');
  const billInput = document.getElementById('inc-txn-receivable');
  const discountInput = document.getElementById('inc-txn-discount');
  const payInput = document.getElementById('inc-txn-received');
  const remarksInput = document.getElementById('inc-txn-remarks');
  const dueCtrl = createDualTxnDueController({
    billInput,
    discountInput,
    payInput,
    dueInput: document.getElementById('inc-txn-due'),
    dueInfoBox: document.getElementById('inc-txn-due-info'),
    currentDueEl: document.getElementById('inc-txn-current-due'),
    remainingDueEl: document.getElementById('inc-txn-remaining-due')
  });
  window._incDueCtrl = dueCtrl;

  const categoryHandlers = initDualTxnCategoryHandlers({
    catSelect, billInput, discountInput, payInput, remarksInput, subSelect, fieldMap: INCOME_TXN_FIELDS, dueCtrl,
    refreshSubDropdown: (mode) => renderHeadSubSelect(subSelect, mainSelect?.value, cachedIncomeHeads, ["Income Parent Head", "Parent Head", "Main Head"], ["Sub Head Name", "Sub Head"], cachedIncomeTxns, INCOME_TXN_FIELDS, mode)
  });

  const refreshDueInfo = () => {
    const main = mainSelect?.value || '';
    const sub = subSelect?.value || '';
    if (!main || !sub) { dueCtrl.resetDueInfo(); dueCtrl.runCalculations(); return; }
    dueCtrl.showCurrentDue(computeHeadPairDueBalance(main, sub, cachedIncomeTxns, INCOME_TXN_FIELDS));
  };
  subSelect?.addEventListener('change', refreshDueInfo);
  mainSelect?.addEventListener('change', () => { dueCtrl.resetDueInfo(); dueCtrl.runCalculations(); });

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('income_transactions')) return;
    const currentUser = fetchSessionUser(); dueCtrl.runCalculations();
    const { category, remarksText, bill, discount, pay, txnDue } = categoryHandlers.prepareSubmit();
    const txnDate = document.getElementById('inc-txn-date').value;
    const txnId = buildModuleTxnTrackingId("INC", mainSelect.value, subSelect.value, txnDate);
    const rowPayload = [
      txnId,
      txnDate,
      mainSelect.value,
      subSelect.value,
      bill,
      discount,
      pay,
      txnDue,
      category,
      remarksText,
      currentUser.username,
      new Date().toLocaleString()
    ];
    try {
      const result = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Income_Transactions", rowData: rowPayload } }); alert(result.message);
      if (result.success) {
        form.reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (discountInput) discountInput.value = '0';
        categoryHandlers.resetInputs();
        dueCtrl.resetDueInfo();
        dueCtrl.runCalculations();
        await populateIncomeHeadDropdowns();
        await loadIncomeTxnTableRecords(true);
        await loadIncomeHeadTableRecords();
        await updateLiveUserCashDrawerBalance();
      }
    } catch (err) { alert(t('alert.errorLog')); }
  };

  dueCtrl.runCalculations();
}

async function loadIncomeTxnTableRecords(isFilter = false) {
  const container = document.getElementById('table-inc-txn-rows'); if (!container) return;
  const recSumBox = document.getElementById('inc-total-received');
  const dueSumBox = document.getElementById('inc-total-due');
  const fDateInput = document.getElementById('filter-from-inc');
  const tDateInput = document.getElementById('filter-to-inc');

  if (!isFilter) { 
    container.innerHTML = `<tr><td colspan="13" class="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b">${t('ledger.selectDatesPrompt')}</td></tr>`;
    if (recSumBox) recSumBox.textContent = "0.00"; if (dueSumBox) dueSumBox.textContent = "0.00";
    return;
  }
  if (!fDateInput.value || !tDateInput.value) { alert(t('ledger.bothDatesRequired')); return; }

  container.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-blue-500 font-bold">${t('ledger.querying')}</td></tr>`;
  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Income_Transactions" } });
    if (result.success) {
      const fDate = new Date(fDateInput.value); fDate.setHours(0,0,0,0);
      const tDate = new Date(tDateInput.value); tDate.setHours(23,59,59,999);
      let filtered = result.records.filter(rec => { if (!rec["Date"]) return false; const rDate = new Date(rec["Date"]); return rDate >= fDate && rDate <= tDate; });

      let totalRecAcc = 0; let totalDueAcc = 0;
      
      if (filtered.length === 0) { 
        container.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-gray-500 font-bold">${t('ledger.noRecordsInRange')}</td></tr>`; 
        if (recSumBox) recSumBox.textContent = "0.00"; if (dueSumBox) dueSumBox.textContent = "0.00"; 
        return; 
      }
      
      cacheTxnRecords("Income_Transactions", filtered);
      container.innerHTML = filtered.reverse().map(rec => {
        const amounts = parseTxnDualAmounts(rec, INCOME_TXN_FIELDS);
        totalRecAcc += amounts.pay; totalDueAcc += amounts.txnDue;
        
        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap">
          <td class="p-2.5">${rec["Date"] ? new Date(rec["Date"]).toLocaleDateString() : ''}</td>
          <td class="font-mono text-gray-400 text-[10px]">${getCol(rec, INCOME_TXN_FIELDS.txnId) || '-'}</td>
          <td class="font-bold text-gray-900">${getCol(rec, INCOME_TXN_FIELDS.main) || ''}</td>
          <td class="text-blue-600">${getCol(rec, INCOME_TXN_FIELDS.sub) || ''}</td>
          <td class="font-mono text-gray-700">${amounts.bill.toFixed(2)}</td>
          <td class="font-mono text-purple-600">${amounts.discount.toFixed(2)}</td>
          <td class="font-mono font-bold text-emerald-600">${amounts.pay.toFixed(2)}</td>
          <td class="font-mono font-bold text-red-600">${amounts.txnDue.toFixed(2)}</td>
          ${renderDualTxnTypeCell(amounts.category, INCOME_TXN_FIELDS)}
          <td class="max-w-xs truncate" title="${getCol(rec, ["Remarks / Vouchers", "Remarks"]) || ''}">${getCol(rec, ["Remarks / Vouchers", "Remarks"]) || '-'}</td>
          <td>${getCol(rec, ["Logged By", "Username"]) || ''}</td>
          <td class="text-gray-400 font-mono text-[10px]">${getCol(rec, ["Timestamp"]) || ''}</td>
          ${renderTxnActions(rec, "Income_Transactions")}
        </tr>`;
      }).join('');
      
      if (recSumBox) recSumBox.textContent = totalRecAcc.toFixed(2);
      if (dueSumBox) dueSumBox.textContent = totalDueAcc.toFixed(2);
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="13" class="p-3 text-center text-red-500 font-bold">${t('ledger.loadFailedTracker')}</td></tr>`; }
}

/**
 * MODULE: CAPITAL HEADS & TRANSACTIONS (OWNER EQUITY)
 */
function initCapitalHeadFormListeners() {
  const form = document.getElementById('form-cap-head-entry'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('capital_heads')) return;
    const currentUser = fetchSessionUser();
    const mainHead = document.getElementById('cap-head-main').value.trim();
    const subHead = document.getElementById('cap-head-sub').value.trim();
    const trackingUID = `CAP-${mainHead.substring(0,3).toUpperCase()}-${subHead.substring(0,3).toUpperCase()}`;
    const payloadRow = [ trackingUID, mainHead, subHead, currentUser.username, new Date().toLocaleString() ];
    try {
      const res = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Capital_Heads", rowData: payloadRow } }); alert(res.message); if (res.success) { form.reset(); await loadCapitalHeadTableRecords(); }
    } catch (err) { alert(t('alert.errorCommit')); }
  });
}

async function loadCapitalHeadTableRecords() {
  const container = document.getElementById('table-cap-head-rows'); if (!container) return;
  container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-gray-400">${t('heads.loadingStructures')}</td></tr>`;
  try {
    const resultHeads = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Capital_Heads" } });
    const resultTxns = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Capital_Transactions" } });

    if (resultHeads.success) {
      cachedCapitalHeads = resultHeads.records; const txns = resultTxns.success ? resultTxns.records : [];
      if (cachedCapitalHeads.length === 0) { container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-gray-400">${t('heads.noCapitalHeads')}</td></tr>`; return; }

      let headTotals = {};
      let prevDueTotals = {};

      txns.forEach(tRec => {
          let mHead = String(getCol(tRec, ["Capital Parent Head", "Parent Head", "Main Head"])).trim().toUpperCase();
          let sHead = String(getCol(tRec, ["Sub Head", "SubCategory"])).trim().toUpperCase();
          let rem = String(getCol(tRec, ["Remarks", "Remarks / Reference", "Description"])).trim().toUpperCase();
          const amounts = parseTxnDualAmounts(tRec, CAPITAL_TXN_FIELDS);
          let isPrevDue = sHead.includes("PREVIOUS DUE") || rem.includes("PREVIOUS DUE") || rem.includes("OPENING BALANCE");

          if (isPrevDue) {
              if (!prevDueTotals[mHead]) prevDueTotals[mHead] = 0;
              prevDueTotals[mHead] += Math.max(amounts.bill, amounts.pay);
          } else {
              let key = mHead + "|||" + sHead;
              if (!headTotals[key]) headTotals[key] = { capIn: 0, capOut: 0, disc: 0 };
              headTotals[key].capIn += amounts.bill;
              headTotals[key].capOut += amounts.pay;
              headTotals[key].disc += amounts.discount;
          }
      });

      container.innerHTML = cachedCapitalHeads.map(rec => {
        const trackingId = getCol(rec, ["Tracking ID", "System Unique ID", "ID"]) || '';
        const mainHead = getCol(rec, ["Capital Parent Head", "Parent Head", "Main Head"]) || '';
        const subHead = getCol(rec, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';

        let mHeadUpper = String(mainHead).trim().toUpperCase();
        let sHeadUpper = String(subHead).trim().toUpperCase();
        let key = mHeadUpper + "|||" + sHeadUpper;

        let rowIn = headTotals[key] ? headTotals[key].capIn : 0;
        let rowOut = headTotals[key] ? headTotals[key].capOut : 0;
        let rowDisc = headTotals[key] ? headTotals[key].disc : 0;

        if (prevDueTotals[mHeadUpper]) {
            rowIn += prevDueTotals[mHeadUpper];
            prevDueTotals[mHeadUpper] = 0;
        }

        const rowNet = Math.max(0, rowIn - rowDisc - rowOut);

        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap">
          <td class="p-2.5 font-mono text-gray-400 text-[11px]">${trackingId}</td><td class="font-bold text-gray-800">${mainHead}</td><td class="text-violet-600 font-medium">${subHead}</td>
          <td class="font-mono font-bold text-gray-700">SAR ${rowIn.toFixed(2)}</td>
          <td class="font-mono font-bold text-emerald-600">SAR ${rowOut.toFixed(2)}</td>
          <td class="font-mono font-bold text-violet-600">SAR ${rowNet.toFixed(2)}</td>
          <td>${getCol(rec, ["Created By", "Authorized By", "Username"]) || ''}</td><td class="text-gray-400 font-mono text-[10px]">${getCol(rec, ["Creation Stamp", "Timestamp"]) || ''}</td>
        </tr>`;
      }).join('');
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-red-500 font-bold">${t('heads.loadFailed')}</td></tr>`; }
}

async function populateCapitalHeadDropdowns(mode = "all") {
  const mainSelect = document.getElementById('cap-txn-main'); if (!mainSelect) return;
  const subSelect = document.getElementById('cap-txn-sub');
  mainSelect.innerHTML = `<option value="">${t('dropdown.loadingStructures')}</option>`;
  try {
    const [headRes, txnRes] = await Promise.all([
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Capital_Heads" } }),
      apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Capital_Transactions" } })
    ]);
    cachedCapitalTxns = txnRes.success ? txnRes.records : [];
    if (headRes.success && headRes.records.length > 0) {
      cachedCapitalHeads = headRes.records;
      const uniqueParents = [...new Set(cachedCapitalHeads.map(r => getCol(r, ["Capital Parent Head", "Parent Head", "Main Head"])))];
      mainSelect.innerHTML = `<option value="">${t('dropdown.chooseCapital')}</option>` + uniqueParents.map(h => `<option value="${h}">${h}</option>`).join('');
      const refreshSubDue = () => {
        const main = mainSelect.value;
        const sub = subSelect?.value || '';
        if (!main || !sub) return;
        if (typeof window._capDueCtrl?.showCurrentDue === 'function') {
          window._capDueCtrl.showCurrentDue(computeHeadPairDueBalance(main, sub, cachedCapitalTxns, CAPITAL_TXN_FIELDS));
        }
      };
      mainSelect.onchange = () => {
        renderHeadSubSelect(subSelect, mainSelect.value, cachedCapitalHeads, ["Capital Parent Head", "Parent Head", "Main Head"], ["Sub Head Name", "Sub Head"], cachedCapitalTxns, CAPITAL_TXN_FIELDS, mode);
        if (typeof window._capDueCtrl?.resetDueInfo === 'function') window._capDueCtrl.resetDueInfo();
        subSelect.onchange = refreshSubDue;
      };
      if (mainSelect.value) renderHeadSubSelect(subSelect, mainSelect.value, cachedCapitalHeads, ["Capital Parent Head", "Parent Head", "Main Head"], ["Sub Head Name", "Sub Head"], cachedCapitalTxns, CAPITAL_TXN_FIELDS, mode);
    } else { mainSelect.innerHTML = `<option value="">${t('dropdown.setupCapitalFirst')}</option>`; }
  } catch (err) { mainSelect.innerHTML = `<option value="">Error compiling data</option>`; }
}

function initCapitalTxnFormListeners() {
  const form = document.getElementById('form-cap-txn-entry'); if (!form) return;
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const dateInput = document.getElementById('cap-txn-date'); if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  const mainSelect = document.getElementById('cap-txn-main');
  const subSelect = document.getElementById('cap-txn-sub');
  const catSelect = document.getElementById('cap-txn-category');
  const billInput = document.getElementById('cap-txn-in');
  const discountInput = document.getElementById('cap-txn-discount');
  const payInput = document.getElementById('cap-txn-out');
  const remarksInput = document.getElementById('cap-txn-remarks');
  const dueCtrl = createDualTxnDueController({
    billInput,
    discountInput,
    payInput,
    dueInput: document.getElementById('cap-txn-due'),
    dueInfoBox: document.getElementById('cap-txn-due-info'),
    currentDueEl: document.getElementById('cap-txn-current-due'),
    remainingDueEl: document.getElementById('cap-txn-remaining-due')
  });
  window._capDueCtrl = dueCtrl;

  const categoryHandlers = initDualTxnCategoryHandlers({
    catSelect, billInput, discountInput, payInput, remarksInput, subSelect, fieldMap: CAPITAL_TXN_FIELDS, dueCtrl,
    refreshSubDropdown: (mode) => renderHeadSubSelect(subSelect, mainSelect?.value, cachedCapitalHeads, ["Capital Parent Head", "Parent Head", "Main Head"], ["Sub Head Name", "Sub Head"], cachedCapitalTxns, CAPITAL_TXN_FIELDS, mode)
  });

  const refreshDueInfo = () => {
    const main = mainSelect?.value || '';
    const sub = subSelect?.value || '';
    if (!main || !sub) { dueCtrl.resetDueInfo(); dueCtrl.runCalculations(); return; }
    dueCtrl.showCurrentDue(computeHeadPairDueBalance(main, sub, cachedCapitalTxns, CAPITAL_TXN_FIELDS));
  };
  subSelect?.addEventListener('change', refreshDueInfo);
  mainSelect?.addEventListener('change', () => { dueCtrl.resetDueInfo(); dueCtrl.runCalculations(); });

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!guardModuleEdit('capital_transactions')) return;
    const currentUser = fetchSessionUser(); dueCtrl.runCalculations();
    const { category, remarksText, bill, discount, pay, txnDue } = categoryHandlers.prepareSubmit();
    const txnDate = document.getElementById('cap-txn-date').value;
    const txnId = buildModuleTxnTrackingId("CAP", mainSelect.value, subSelect.value, txnDate);
    const rowPayload = [
      txnId,
      txnDate,
      mainSelect.value,
      subSelect.value,
      bill,
      discount,
      pay,
      txnDue,
      category,
      remarksText,
      currentUser.username,
      new Date().toLocaleString()
    ];
    try {
      const result = await apiRequest({ action: "CREATE_RECORD", payload: { sheetName: "Capital_Transactions", rowData: rowPayload } }); alert(result.message);
      if (result.success) {
        form.reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (discountInput) discountInput.value = '0';
        categoryHandlers.resetInputs();
        dueCtrl.resetDueInfo();
        dueCtrl.runCalculations();
        await populateCapitalHeadDropdowns();
        await loadCapitalTxnTableRecords(true);
        await loadCapitalHeadTableRecords();
        await updateLiveUserCashDrawerBalance();
      }
    } catch (err) { alert(t('alert.errorLog')); }
  };

  dueCtrl.runCalculations();
}

async function loadCapitalTxnTableRecords(isFilter = false) {
  const container = document.getElementById('table-cap-txn-rows'); if (!container) return;
  const inSumBox = document.getElementById('cap-total-in');
  const outSumBox = document.getElementById('cap-total-out');
  const fDateInput = document.getElementById('filter-from-cap');
  const tDateInput = document.getElementById('filter-to-cap');

  if (!isFilter) {
    container.innerHTML = `<tr><td colspan="13" class="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b">${t('ledger.selectDatesPrompt')}</td></tr>`;
    if (inSumBox) inSumBox.textContent = "0.00"; if (outSumBox) outSumBox.textContent = "0.00";
    return;
  }
  if (!fDateInput.value || !tDateInput.value) { alert(t('ledger.bothDatesRequired')); return; }

  container.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-violet-500 font-bold">${t('ledger.querying')}</td></tr>`;
  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Capital_Transactions" } });
    if (result.success) {
      const fDate = new Date(fDateInput.value); fDate.setHours(0,0,0,0);
      const tDate = new Date(tDateInput.value); tDate.setHours(23,59,59,999);
      let filtered = result.records.filter(rec => { if (!rec["Date"]) return false; const rDate = new Date(rec["Date"]); return rDate >= fDate && rDate <= tDate; });

      let totalInAcc = 0; let totalOutAcc = 0;

      if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-gray-500 font-bold">${t('ledger.noRecordsInRange')}</td></tr>`;
        if (inSumBox) inSumBox.textContent = "0.00"; if (outSumBox) outSumBox.textContent = "0.00";
        return;
      }

      cacheTxnRecords("Capital_Transactions", filtered);
      container.innerHTML = filtered.reverse().map(rec => {
        const amounts = parseTxnDualAmounts(rec, CAPITAL_TXN_FIELDS);
        totalInAcc += amounts.bill; totalOutAcc += amounts.pay;

        return `<tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap">
          <td class="p-2.5">${rec["Date"] ? new Date(rec["Date"]).toLocaleDateString() : ''}</td>
          <td class="font-mono text-gray-400 text-[10px]">${getCol(rec, CAPITAL_TXN_FIELDS.txnId) || '-'}</td>
          <td class="font-bold text-gray-900">${getCol(rec, CAPITAL_TXN_FIELDS.main) || ''}</td>
          <td class="text-violet-600">${getCol(rec, CAPITAL_TXN_FIELDS.sub) || ''}</td>
          <td class="font-mono text-gray-700">${amounts.bill.toFixed(2)}</td>
          <td class="font-mono text-purple-600">${amounts.discount.toFixed(2)}</td>
          <td class="font-mono font-bold text-emerald-600">${amounts.pay.toFixed(2)}</td>
          <td class="font-mono font-bold text-violet-600">${amounts.txnDue.toFixed(2)}</td>
          ${renderDualTxnTypeCell(amounts.category, CAPITAL_TXN_FIELDS)}
          <td class="max-w-xs truncate" title="${getCol(rec, ["Remarks / Vouchers", "Remarks"]) || ''}">${getCol(rec, ["Remarks / Vouchers", "Remarks"]) || '-'}</td>
          <td>${getCol(rec, ["Logged By", "Username"]) || ''}</td>
          <td class="text-gray-400 font-mono text-[10px]">${getCol(rec, ["Timestamp"]) || ''}</td>
          ${renderTxnActions(rec, "Capital_Transactions")}
        </tr>`;
      }).join('');

      if (inSumBox) inSumBox.textContent = totalInAcc.toFixed(2);
      if (outSumBox) outSumBox.textContent = totalOutAcc.toFixed(2);
    }
  } catch (err) { container.innerHTML = `<tr><td colspan="13" class="p-3 text-center text-red-500 font-bold">${t('ledger.loadFailedTracker')}</td></tr>`; }
}

/**
 * MASTER AUDIT AGGREGATOR (ALL TRANSACTIONS)
 */
async function loadAllTxnTableRecords(isFilter = false) {
  const container = document.getElementById('table-all-txn-rows'); 
  if (!container) return;

  container.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-blue-500 font-bold animate-pulse">${t('allTxn.aggregating')}</td></tr>`;

  const fDateInput = document.getElementById('filter-from-all');
  const tDateInput = document.getElementById('filter-to-all');
  const moduleFilter = document.getElementById('filter-module-all');

  let fDate, tDate;
  
  if (!isFilter) {
     const now = new Date();
     fDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
     tDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
     
     const pad = n => (n < 10 ? '0'+n : n);
     const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
     if (fDateInput) fDateInput.value = dateStr;
     if (tDateInput) tDateInput.value = dateStr;
  } else {
     if (!fDateInput.value || !tDateInput.value) { 
        container.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-gray-500">${t('allTxn.selectDates')}</td></tr>`;
        return; 
     }
     fDate = new Date(fDateInput.value); fDate.setHours(0,0,0,0);
     tDate = new Date(tDateInput.value); tDate.setHours(23,59,59,999);
  }

  try {
    const fetchSheet = async (sheetName) => {
      try {
        return await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName } });
      } catch(e) { return {success: false, records: []}; }
    };

    const resHr = await fetchSheet("HR_Transactions");
    const resSup = await fetchSheet("Supplier_Transactions");
    const resCust = await fetchSheet("Customer_Transactions");
    const resInt = await fetchSheet("Internal_Transfers");
    const resExp = await fetchSheet("Expense_Transactions");
    const resCred = await fetchSheet("Creditor_Transactions");
    const resInc = await fetchSheet("Income_Transactions");
    const resCap = await fetchSheet("Capital_Transactions");

    let allRecords = [];

    const addRecords = (res, moduleName, sheetName, mapFn) => {
       if(res.success && res.records) {
          const sheetFiltered = [];
          res.records.forEach(r => {
             if(!r["Date"]) return;
             const rDate = new Date(r["Date"]);
             if (rDate >= fDate && rDate <= tDate) {
                sheetFiltered.push(r);
                const mapped = mapFn(r);
                mapped.rawDate = rDate;
                mapped.module = moduleName;
                mapped.sheetName = sheetName;
                mapped.rawRec = r;
                allRecords.push(mapped);
             }
          });
          cacheTxnRecords(sheetName, sheetFiltered);
       }
    };

    addRecords(resHr, "HR", "HR_Transactions", r => ({
       details: t('allTxn.detailsNamed', { name: getCol(r, ["Employee Name"]) || t('allTxn.noRemarks'), category: getCategoryLabel(getCol(r, ["Category"]) || '', t) || t('allTxn.noRemarks') }),
       financial: t('allTxn.finAmount', { amount: Number(getCol(r, ["Amount"])||0).toFixed(2) }),
       remarks: getCol(r, ["Remarks"]) || t('allTxn.noRemarks'),
       user: getCol(r, ["Username", "Logged By"]),
       stamp: getCol(r, ["Timestamp"])
    }));
    
    addRecords(resSup, "Supplier", "Supplier_Transactions", r => {
       const p = parseSupplierTxnAmounts(r);
       return {
       details: t('allTxn.detailsNamed', { name: getCol(r, ["Supplier Name"]) || t('allTxn.noRemarks'), category: t('col.dueBalance') }),
       financial: t('allTxn.finSupTxn', { purchase: p.bill.toFixed(2), disc: p.discount.toFixed(2), paid: p.pay.toFixed(2), due: p.txnDue.toFixed(2) }),
       remarks: getCol(r, ["Remarks / Reference", "Remarks"]) || t('allTxn.noRemarks'),
       user: getCol(r, ["Username", "Logged By"]),
       stamp: getCol(r, ["Timestamp"])
    };
    });

    addRecords(resCust, "Customer", "Customer_Transactions", r => ({
       details: t('allTxn.detailsUid', { uid: getCol(r, ["System Unique ID", "Sys UID"]) || t('allTxn.noRemarks'), method: getCategoryLabel(getCol(r, ["Payment Method", "Method"]) || '', t) || t('allTxn.noRemarks') }),
       financial: t('allTxn.finSoldDiscRecv', {
         sold: Number(getCol(r, ["Sold Amount", "Sold Amt"])||0).toFixed(2),
         disc: Number(getCol(r, ["Discount", "Discount Amount", "Txn Discount"])||0).toFixed(2),
         recv: Number(getCol(r, ["Received Amount", "Received Amt"])||0).toFixed(2)
       }),
       remarks: getCol(r, ["Remarks / Reference", "Remarks"]) || t('allTxn.noRemarks'),
       user: getCol(r, ["Username", "Logged By"]),
       stamp: getCol(r, ["Timestamp"])
    }));

    addRecords(resInt, "Internal", "Internal_Transfers", r => ({
       details: t('allTxn.cashHandover'),
       financial: t('allTxn.finAmount', { amount: Number(getCol(r, ["Transfer Amount", "Amount"])||0).toFixed(2) }),
       remarks: getCol(r, ["Description", "Description / Purpose", "Remarks"]) || t('allTxn.noRemarks'),
       user: getCol(r, ["Username", "Transferred By", "Logged By"]),
       stamp: getCol(r, ["Timestamp"])
    }));

    addRecords(resExp, "Expense", "Expense_Transactions", r => {
       const a = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
       return {
       details: `${getCol(r, EXPENSE_TXN_FIELDS.main) || t('allTxn.noRemarks')} > ${getCol(r, EXPENSE_TXN_FIELDS.sub) || t('allTxn.noRemarks')}`,
       financial: t('allTxn.finExpTxn', { inc: a.bill.toFixed(2), disc: a.discount.toFixed(2), paid: a.pay.toFixed(2), due: a.txnDue.toFixed(2) }),
       remarks: getCol(r, EXPENSE_TXN_FIELDS.remarks) || t('allTxn.noRemarks'),
       user: getCol(r, ["Username", "Logged By"]),
       stamp: getCol(r, ["Timestamp"])
    };
    });

    addRecords(resCred, "Creditor", "Creditor_Transactions", r => {
       const a = parseTxnDualAmounts(r, CREDITOR_TXN_FIELDS);
       return {
       details: `${getCol(r, ["Creditor Parent Head", "Main Head", "Parent Head"]) || t('allTxn.noRemarks')} > ${getCol(r, ["Sub Head"]) || t('allTxn.noRemarks')}`,
       financial: t('allTxn.finCredTxn', { recv: a.bill.toFixed(2), disc: a.discount.toFixed(2), ret: a.pay.toFixed(2), due: a.txnDue.toFixed(2) }),
       remarks: getCol(r, ["Remarks / Vouchers", "Remarks"]) || t('allTxn.noRemarks'),
       user: getCol(r, ["Username", "Logged By"]),
       stamp: getCol(r, ["Timestamp"])
    };
    });

    addRecords(resInc, "Income", "Income_Transactions", r => {
       const a = parseTxnDualAmounts(r, INCOME_TXN_FIELDS);
       return {
       details: `${getCol(r, ["Income Parent Head", "Main Head", "Parent Head"]) || t('allTxn.noRemarks')} > ${getCol(r, ["Sub Head"]) || t('allTxn.noRemarks')}`,
       financial: t('allTxn.finIncTxn', { billed: a.bill.toFixed(2), disc: a.discount.toFixed(2), recv: a.pay.toFixed(2), due: a.txnDue.toFixed(2) }),
       remarks: getCol(r, ["Remarks / Vouchers", "Remarks"]) || t('allTxn.noRemarks'),
       user: getCol(r, ["Username", "Logged By"]),
       stamp: getCol(r, ["Timestamp"])
    };
    });

    addRecords(resCap, "Capital", "Capital_Transactions", r => {
       const a = parseTxnDualAmounts(r, CAPITAL_TXN_FIELDS);
       return {
       details: `${getCol(r, ["Capital Parent Head", "Main Head", "Parent Head"]) || t('allTxn.noRemarks')} > ${getCol(r, ["Sub Head"]) || t('allTxn.noRemarks')}`,
       financial: t('allTxn.finCapTxn', { capIn: a.bill.toFixed(2), disc: a.discount.toFixed(2), capOut: a.pay.toFixed(2), due: a.txnDue.toFixed(2) }),
       remarks: getCol(r, ["Remarks / Vouchers", "Remarks"]) || t('allTxn.noRemarks'),
       user: getCol(r, ["Username", "Logged By"]),
       stamp: getCol(r, ["Timestamp"])
    };
    });

    if (moduleFilter && moduleFilter.value) {
       allRecords = allRecords.filter(r => r.module === moduleFilter.value);
    }

    allRecords.sort((a, b) => b.rawDate - a.rawDate);

    if(allRecords.length === 0) {
       container.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-gray-500 font-bold">${t('allTxn.noResults')}</td></tr>`;
       return;
    }

    container.innerHTML = allRecords.map(rec => {
       let modColor = "bg-gray-100 text-gray-700";
       if(rec.module==="HR") modColor="bg-blue-100 text-blue-800";
       if(rec.module==="Supplier") modColor="bg-purple-100 text-purple-800";
       if(rec.module==="Customer") modColor="bg-emerald-100 text-emerald-800";
       if(rec.module==="Expense") modColor="bg-red-100 text-red-800";
       if(rec.module==="Creditor") modColor="bg-orange-100 text-orange-800";
       if(rec.module==="Income") modColor="bg-indigo-100 text-indigo-800";
       if(rec.module==="Capital") modColor="bg-violet-100 text-violet-800";
       if(rec.module==="Internal") modColor="bg-teal-100 text-teal-800";

       return `
         <tr class="hover:bg-gray-50 border-b border-gray-100 whitespace-nowrap">
           <td class="p-2.5">${rec.rawDate.toLocaleDateString()}</td>
           <td><span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${modColor}">${getAllTxnModuleLabel(rec.module)}</span></td>
           <td class="font-bold text-gray-800">${rec.details || t('allTxn.noRemarks')}</td>
           <td class="font-mono text-gray-700">${rec.financial}</td>
           <td class="max-w-xs truncate" title="${rec.remarks || ''}">${rec.remarks || t('allTxn.noRemarks')}</td>
           <td>${rec.user || ''}</td>
           <td class="text-gray-400 font-mono text-[10px]">${rec.stamp || ''}</td>
           ${renderTxnActions(rec.rawRec, rec.sheetName)}
         </tr>
       `;
    }).join('');

  } catch (err) {
     console.error(err);
     container.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-red-500 font-bold">${t('allTxn.loadFailed')}</td></tr>`;
  }
}


/**
 * ------------------------------------------------------------------
 * ENTERPRISE REPORTING ENGINE (WITH NEW REPORTS & MAGIC INJECTOR)
 * ------------------------------------------------------------------
 */
function initReportsSystem() {
  const typeSelect = document.getElementById('report-type');
  const secFilterContainer = document.getElementById('report-secondary-filter-container');
  const secFilterLabel = document.getElementById('report-secondary-label');
  const secSelect = document.getElementById('report-secondary-filter');
  const btnGen = document.getElementById('btn-generate-report');
  
  const fDateInput = document.getElementById('report-from');
  const tDateInput = document.getElementById('report-to');
  const dateFilterWrap = document.getElementById('report-date-filter-wrap');
  const useDateFilterInput = document.getElementById('report-use-date-filter');
  const pageRoot = document.querySelector('.erp-module-page');
  const mobileSnapshot = activeMobileSnapshot || pageRoot?._mobileSnapshot;
  
  const now = new Date();
  const pad = n => (n < 10 ? '0'+n : n);
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  if (fDateInput) fDateInput.value = dateStr;
  if (tDateInput) tDateInput.value = dateStr;

  // --- MAGIC INJECTOR: Automatically adds the new reports to your dropdown ---
  if (typeSelect) {
     let hasExp = Array.from(typeSelect.options).some(o => o.value === 'expense_details');
     if (!hasExp) {
        typeSelect.insertAdjacentHTML('beforeend', `
          <option value="expense_details" data-i18n-report="report.expenseDetails">Expense Details Report</option>
          <option value="creditor_details" data-i18n-report="report.creditorDetails">Creditor Details Report</option>
          <option value="master_executive" data-i18n-report="report.masterExecutive">Master Executive Dashboard</option>
          <option value="income_details" data-i18n-report="report.incomeDetails">Income Details Report</option>
          <option value="capital_details" data-i18n-report="report.capitalDetails">Capital Details Report</option>
        `);
     }
     translateReportSelect(typeSelect);
  }
  // ---------------------------------------------------------------------------

  if (typeSelect) {
    typeSelect.addEventListener('change', async (e) => {
      const val = e.target.value;
      secFilterContainer.classList.add('hidden');
      secSelect.innerHTML = '';
      if (dateFilterWrap) {
        if (val === 'customer_due_balance') {
          dateFilterWrap.classList.remove('hidden');
          if (useDateFilterInput) useDateFilterInput.checked = false;
        } else {
          dateFilterWrap.classList.add('hidden');
        }
      }
      
      const fillFilter = async (sheetName, textCol, valCol, labelKey) => {
        const labelTxt = t(labelKey);
        secFilterLabel.textContent = labelTxt;
        secSelect.innerHTML = `<option value="">${t('report.loading')}</option>`;
        secFilterContainer.classList.remove('hidden');
        try {
          const data = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName } });
          if (data.success && data.records && data.records.length > 0) {
            
            // --- SMART FALLBACK SCANNER ---
            const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const findMatch = (row, names) => {
                for(let k in row) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return row[k]; }
                return null;
            };
            const keys = Object.keys(data.records[0]);

            secSelect.innerHTML = `<option value="">${t('report.selectOption', { label: labelTxt })}</option>` + data.records.map(r => {
              
              // 1. Try to find exactly what we asked for
              let display = findMatch(r, textCol);
              let value = findMatch(r, valCol);
              
              // 2. If it misses, look for any generic "Name" or "Head" column
              if (display === null || display === undefined || display === "") {
                 display = findMatch(r, ["name", "head", "title", "category", "description"]);
                 value = findMatch(r, ["name", "head", "title", "category", "description"]);
              }
              
              // 3. Absolute Fallback: Grab the first column that isn't an ID or Date
              if (display === null || display === undefined || display === "") {
                  let fallback = keys.find(k => !cln(k).includes("id") && !cln(k).includes("date") && !cln(k).includes("stamp")) || keys[0];
                  display = r[fallback]; value = r[fallback];
              }

              if (sheetName === 'Customers' && value !== display) {
                 display = value + " - " + display;
              }
              
              return `<option value="${value || 'Unknown'}">${display || t('report.unknown')}</option>`;
            }).join('');
          } else { secSelect.innerHTML = `<option value="">${t('report.noData')}</option>`; }
        } catch(err) { secSelect.innerHTML = `<option value="">${t('report.errorLoading')}</option>`; }
      };

      // Routes the secondary dropdown to fetch the correct lists from your database
      if (val === 'customer_details') await fillFilter('Customers', ["Customer Name", "Name"], ["System Unique ID", "Sys UID", "UNIQUEID"], 'report.selectCustomer');
      else if (val === 'supplier_details') await fillFilter('Suppliers', ["Supplier Name"], ["Supplier Name"], 'report.selectSupplier');
      else if (val === 'hr_details') await fillFilter('HR', ["Employee Name"], ["Employee Name"], 'report.selectEmployee');
      else if (val === 'user_transaction' || val === 'individual_user' || val === 'customer_due_balance') await fillFilter('Users', ["Username"], ["Username"], 'report.selectUser');
      
      // EXTREMELY BROAD DICTIONARY FOR NEW REPORTS:
      else if (val === 'expense_details') {
        secFilterLabel.textContent = t('report.selectExpenseHead');
        secSelect.innerHTML = `<option value="">${t('report.loading')}</option>`;
        secFilterContainer.classList.remove('hidden');
        try {
          const data = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: 'Expense_Heads' } });
          if (data.success && data.records && data.records.length > 0) {
            secSelect.innerHTML = `<option value="">${t('report.selectExpenseHeadShort')}</option>` + data.records.map((r) => {
              const mainHead = getCol(r, ["Expense Parent Head", "Parent Head", "Main Head", "Parent Category"]) || '';
              const subHead = getCol(r, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';
              const display = subHead ? `${mainHead} > ${subHead}` : (mainHead || t('report.unknown'));
              const value = `${mainHead}|||${subHead}`;
              return `<option value="${String(value).replace(/"/g, '&quot;')}">${display}</option>`;
            }).join('');
          } else {
            secSelect.innerHTML = `<option value="">${t('report.noExpenseHeads')}</option>`;
          }
        } catch (err) {
          secSelect.innerHTML = `<option value="">${t('report.errorLoading')}</option>`;
        }
      }
      else if (val === 'creditor_details') await fillFilter('Creditor_Heads', ["Creditor Parent Head", "Creditor Name", "Creditor", "Name", "Head"], ["Creditor Parent Head", "Creditor Name", "Creditor", "Name", "Head"], 'report.selectCreditor');
      
      // --- THE MISSING INCOME ROUTE! ---
      else if (val === 'income_details') await fillFilter('Income_Heads', ["Income Parent Head", "Parent Head", "Main Head", "Name"], ["System Unique ID", "Tracking ID", "ID", "Income Parent Head", "Parent Head"], 'report.selectIncomeAccount');
      else if (val === 'capital_details') await fillFilter('Capital_Heads', ["Capital Parent Head", "Capital Name", "Name", "Head"], ["Capital Parent Head", "Capital Name", "Name", "Head"], 'report.selectCapitalAccount');

    });
  }

  if (btnGen) {
    btnGen.addEventListener('click', async () => {
      const repType = typeSelect.value;
      if (!repType) { alert(t('report.alertSelectType')); return; }
      const applyDateRange = repType === 'customer_due_balance'
        ? (useDateFilterInput?.checked === true)
        : true;
      if (applyDateRange && (!fDateInput.value || !tDateInput.value)) { alert(t('report.alertSelectDates')); return; }
      
      if (!secFilterContainer.classList.contains('hidden') && !secSelect.value) {
        alert(t('report.alertSelectTarget'));
        return;
      }

      await executeReportGeneration(repType, fDateInput.value, tDateInput.value, secSelect.value, secSelect.options[secSelect.selectedIndex]?.text, applyDateRange);
      const reportLabel = typeSelect.options[typeSelect.selectedIndex]?.text?.trim() || 'Report';
      const rangeLabel = applyDateRange ? `${fDateInput.value} to ${tDateInput.value}` : t('report.allOutstandingForUser');
      mobileSnapshot?.collapse(`${reportLabel} · ${rangeLabel}`);
      setMobilePageMode('reports');
      forceChromeBarVisible('module');
      const resultsAnchor = document.getElementById('report-results-anchor');
      if (isCompactLayout() && resultsAnchor) {
        scrollMainToElementAfterLayout(resultsAnchor, 4);
      } else if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

async function executeReportGeneration(type, fromStr, toStr, secVal, secText, applyDateRange = true) {
  const fDate = fromStr ? new Date(fromStr) : new Date(0);
  if (fromStr) fDate.setHours(0,0,0,0);
  const tDate = toStr ? new Date(toStr) : new Date();
  if (toStr) tDate.setHours(23,59,59,999);
  const useDateFilter = applyDateRange && fromStr && toStr;
  
  const headEl = document.getElementById('report-print-header');
  const titleEl = document.getElementById('report-title-display');
  const dateEl = document.getElementById('report-date-display');
  const tgtEl = document.getElementById('report-target-display');
  const cardsEl = document.getElementById('report-summary-cards');
  
  const tableContainer = document.getElementById('report-table-container');

  tableContainer.innerHTML = `
     <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
        <table class="erp-report-table w-full text-left border-collapse text-xs">
          <thead id="report-table-head" class="bg-slate-800 text-white sticky top-0 z-10 shadow print:bg-gray-100 print:text-gray-800 print:shadow-none border-b">
          </thead>
          <tbody id="report-table-body" class="divide-y text-gray-600 font-medium">
             <tr><td class="p-6 text-center text-blue-500 font-bold animate-pulse">${t('report.runningQuery')}</td></tr>
          </tbody>
        </table>
     </div>
  `;

  const tHead = document.getElementById('report-table-head');
  const tBody = document.getElementById('report-table-body');

  headEl.classList.remove('hidden');
  cardsEl.classList.remove('hidden');
  dateEl.textContent = useDateFilter
    ? t('report.dateRangeTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })
    : (type === 'customer_due_balance' ? t('report.allOutstandingForUser') : t('report.dateRangeTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() }));
  tgtEl.textContent = secText && secVal ? t('report.targetEntity', { name: secText }) : '';
  cardsEl.innerHTML = ''; 

  const drawCard = (title, val, colorClass) => {
    return `<div class="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm text-center">
              <h4 class="text-xs font-bold uppercase text-gray-500 mb-1">${title}</h4>
              <div class="text-xl font-black font-mono ${colorClass}">SAR ${Number(val).toFixed(2)}</div>
            </div>`;
  };

  try {
    const fetchSheet = async (sheetName) => {
      try {
        return await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName } });
      } catch(e) { return {success: false, records: []}; }
    };

    const [rCust, rCustT, rSup, rSupT, rHr, rHrT, rExp, rExpHeads, rInc, rIncT, rCrd, rCrdT, rCap, rCapT, rInt, rUsr] = await Promise.all([
      fetchSheet("Customers"), fetchSheet("Customer_Transactions"),
      fetchSheet("Suppliers"), fetchSheet("Supplier_Transactions"),
      fetchSheet("HR"), fetchSheet("HR_Transactions"),
      fetchSheet("Expense_Transactions"), fetchSheet("Expense_Heads"),
      fetchSheet("Income_Heads"), fetchSheet("Income_Transactions"),
      fetchSheet("Creditor_Heads"), fetchSheet("Creditor_Transactions"),
      fetchSheet("Capital_Heads"), fetchSheet("Capital_Transactions"),
      fetchSheet("Internal_Transfers"), fetchSheet("Users")
    ]);

    const filterByDate = (arr, dateColNames) => {
      if(!arr) return [];
      return arr.filter(r => {
        let dStr = getCol(r, dateColNames);
        if(!dStr) return false;
        let d = new Date(dStr);
        return d >= fDate && d <= tDate;
      });
    };

    switch (type) {
      
      // ====================================================================
      // 1. ACCOUNTS CASH FLOW REPORT (INTERCEPTOR SHIELD ENABLED)
      // ====================================================================
      case 'daily_monthly':
      case 'daily_cashflow': {
        titleEl.textContent = t('report.titleCashFlow');
        
        let lifeCashIn = 0, lifeCardIn = 0, lifeCashOut = 0;
        let rngCashIn = 0, rngCardIn = 0, rngCashOut = 0;
        let flowRows = [];

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rIncT.success) rIncT.records.forEach(r => {
            let amt = gF(r, ["receivedamount", "receivedamt", "amount", "received"]);
            let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            lifeCashIn += amt;
            if (inRange) { if (hasDates) rngCashIn += amt; if (amt > 0) flowRows.push({ d, type: "Cash IN", src: "Income (Revenue)", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' }); }
        });

        if (rCrdT.success) rCrdT.records.forEach(r => {
            let check = cln(gV(r, ["remarks", "category", "method", "type"]));
            if (check.includes("previousdue") || check.includes("openingbalance")) return; // SHIELD

            let amtIn = gF(r, ["receivedamount", "receivedamt", "received"]);
            let amtOut = gF(r, ["returnamount", "returnamt", "returned"]);
            let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            lifeCashIn += amtIn; lifeCashOut += amtOut;
            if (inRange) {
                if (hasDates) { rngCashIn += amtIn; rngCashOut += amtOut; }
                if (amtIn > 0) flowRows.push({ d, type: "Cash IN", src: "Creditor (Loan Recv)", amt: amtIn, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' });
                if (amtOut > 0) flowRows.push({ d, type: "Cash OUT", src: "Creditor Return", amt: amtOut, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' });
            }
        });

        if (rCustT.success) rCustT.records.forEach(r => {
            let check = cln(gV(r, ["remarks", "category", "method", "type", "paymentmethod"]));
            if (check.includes("previousdue") || check.includes("openingbalance")) return; // SHIELD

            let amt = gF(r, ["receivedamount", "receivedamt", "received"]);
            let method = cln(gV(r, ["paymentmethod", "method", "type"])) || "cash"; let isCash = method.includes("cash");
            let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            if (isCash) lifeCashIn += amt; else lifeCardIn += amt;
            if (inRange) {
                if (hasDates) { if (isCash) rngCashIn += amt; else rngCardIn += amt; }
                if (amt > 0) flowRows.push({ d, type: isCash ? "Cash IN" : "Card IN", src: "Customer Sale", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' });
            }
        });

        if (rExp.success) rExp.records.forEach(r => {
            if (isDualTxnPrevDue(r, EXPENSE_TXN_FIELDS)) return;
            const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
            let amt = amounts.pay;
            if (amt <= 0) return;
            let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            lifeCashOut += amt;
            if (inRange) { if (hasDates) rngCashOut += amt; if (amt > 0) flowRows.push({ d, type: "Cash OUT", src: "Operational Expense", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' }); }
        });

        if (rHrT.success) rHrT.records.forEach(r => {
            let cat = String(gV(r, ["category", "remarks"])).trim().toLowerCase();
            if (cat.includes("previousdue") || cat.includes("openingbalance")) return; // SHIELD

            if (cat.includes("paid")) {
                let amt = Math.abs(gF(r, ["amount"]));
                let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);
                lifeCashOut += amt;
                if (inRange) { if (hasDates) rngCashOut += amt; if (amt > 0) flowRows.push({ d, type: "Cash OUT", src: "HR Salary Paid", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' }); }
            }
        });

        if (rSupT.success) rSupT.records.forEach(r => {
            let cat = String(gV(r, ["category", "remarks"])).trim().toLowerCase();
            if (cat.includes("previousdue") || cat.includes("openingbalance")) return; // SHIELD

            if (cat.includes("paid")) {
                let amt = Math.abs(gF(r, ["amount"]));
                let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);
                lifeCashOut += amt;
                if (inRange) { if (hasDates) rngCashOut += amt; if (amt > 0) flowRows.push({ d, type: "Cash OUT", src: "Supplier Payment", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' }); }
            }
        });

        let lifeNet = (lifeCashIn + lifeCardIn) - lifeCashOut;
        let rngNet = (rngCashIn + rngCardIn) - rngCashOut;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-4 md:p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCashIn')}</div>
                   <div class="text-xl md:text-3xl font-black text-emerald-600 font-mono mt-1 break-all">SAR ${lifeCashIn.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-center xl:border-l xl:border-gray-100 xl:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCardIn')}</div>
                   <div class="text-xl md:text-3xl font-black text-purple-600 font-mono mt-1 break-all">SAR ${lifeCardIn.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-center xl:border-l xl:border-gray-100 xl:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCashOut')}</div>
                   <div class="text-xl md:text-3xl font-black text-red-600 font-mono mt-1 break-all">SAR ${lifeCashOut.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-right xl:border-l xl:border-gray-100 xl:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeNetFlow')}</div>
                   <div class="text-xl md:text-3xl font-black ${lifeNet >= 0 ? 'text-blue-600' : 'text-red-600'} font-mono mt-1 break-all">SAR ${lifeNet.toFixed(2)}</div>
                   <div class="text-[9px] text-gray-400 mt-1 uppercase leading-tight">${t('report.lifetimeNetHint')}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-100">
                <div class="text-left sm:text-center"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashIn')}</div><div class="text-base md:text-lg font-bold text-emerald-700 font-mono mt-1 break-all">SAR ${rngCashIn.toFixed(2)}</div></div>
                <div class="text-left sm:text-center xl:border-l xl:border-blue-200 xl:pl-4"><div class="text-purple-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCardIn')}</div><div class="text-base md:text-lg font-bold text-purple-700 font-mono mt-1 break-all">SAR ${rngCardIn.toFixed(2)}</div></div>
                <div class="text-left sm:text-center xl:border-l xl:border-blue-200 xl:pl-4"><div class="text-red-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashOut')}</div><div class="text-base md:text-lg font-bold text-red-700 font-mono mt-1 break-all">SAR ${rngCashOut.toFixed(2)}</div></div>
                <div class="text-left sm:text-center xl:border-l xl:border-blue-200 xl:pl-4"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeNetFlow')}</div><div class="text-base md:text-lg font-bold text-blue-700 font-mono mt-1 break-all">SAR ${rngNet.toFixed(2)}</div></div>
             </div>
             ` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
             <div class="bg-slate-800 text-white font-bold p-2.5 md:p-3 uppercase tracking-wide text-[10px] md:text-xs border-b border-slate-900 text-center">${t('report.cashFlowLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
             <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
               <table class="erp-report-table w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colFlowType')}</th><th class="p-2.5 font-semibold">${t('report.colSourceDest')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                  <tbody class="divide-y divide-gray-100">
                     ${flowRows.length > 0 ? flowRows.sort((a,b)=> b.d - a.d).map(r => {
                        let clr = r.type.includes("IN") ? (r.type.includes("Card") ? "text-purple-600" : "text-emerald-600") : "text-red-600";
                        return `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${r.d.toLocaleDateString()}</td><td class="p-2.5 font-bold ${clr}">${getReportFlowTypeLabel(r.type, t)}</td><td class="p-2.5 text-gray-700">${getReportSourceLabel(r.src, t)}</td><td class="p-2.5 font-mono font-bold whitespace-nowrap">SAR ${r.amt.toFixed(2)}</td><td class="p-2.5 truncate max-w-[140px] text-gray-600" title="${r.rem || '-'}">${r.rem || '-'}</td><td class="p-2.5">${r.user}</td></tr>`
                     }).join('') : `<tr><td colspan="6" class="p-6 text-center text-gray-400">${t('report.noCashFlow')}</td></tr>`}
                  </tbody>
               </table>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2. MASTER EXECUTIVE DASHBOARD (FINAL HR PREVIOUS DUE FIX)
      // ====================================================================
      case 'master_executive': {
        titleEl.textContent = t('report.titleExecutive');
        
        // This instantly removes spaces so "Previous Due" always matches!
        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); 
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        window.aggReportData = {
           sales: { lInc:0, lPaid:0, rInc:0, rPaid:0, rows: [] },
           income: { lInc:0, lPaid:0, rInc:0, rPaid:0, rows: [] },
           purchase: { lInc:0, lPaid:0, rInc:0, rPaid:0, rows: [] },
           expense: { lInc:0, lPaid:0, rInc:0, rPaid:0, rows: [] },
           hr: { lInc:0, lPaid:0, rInc:0, rPaid:0, rows: [] },
           creditor: { lInc:0, lPaid:0, rInc:0, rPaid:0, rows: [] },
           capital: { lInc:0, lPaid:0, rInc:0, rPaid:0, rows: [] }
        };

        const addD = (cat, dStr, inc, paid, rem, usr) => {
            let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            window.aggReportData[cat].lInc += inc;
            window.aggReportData[cat].lPaid += paid;
            if (hasDates && inRange) { window.aggReportData[cat].rInc += inc; window.aggReportData[cat].rPaid += paid; }
            if (inc > 0 || paid > 0) window.aggReportData[cat].rows.push({ d, inc, paid, rem: rem||'-', usr: usr||'-', inRange });
        };

        // --- CUSTOMER SALES LOGIC ---
        const sellCols = ["soldamount", "soldamt", "totalsell", "sellamount", "grosssell", "sell"];
        const recvCols = ["receivedamount", "receivedamt", "received", "cashreceived", "cashamt", "cashamount", "paidamount", "amountpaid"];
        let tSold=0, tPaid=0;
        
        if (rCustT.success) rCustT.records.forEach(r => {
            let s = gF(r, sellCols); let p = gF(r, recvCols);
            let check = cln(gV(r, ["remarks", "category", "method", "type", "paymentmethod"])); 
            
            if (check.includes("previousdue") || check.includes("openingbalance")) { 
                let prevAmt = Math.max(s, p);
                tSold += prevAmt; 
                addD('sales', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", gV(r, ["username", "loggedby"]));
            } else {
                tSold += s; tPaid += p;
                addD('sales', gV(r, ["date", "timestamp"]), s, p, gV(r, ["remarks"])||"Sale Txn", gV(r, ["username", "loggedby"]));
            }
        });
        if (rCust.success) rCust.records.forEach(r => {
            let sheetS = gF(r, sellCols);
            let sheetP = gF(r, ["cashamt", "cashamount", "cash", "totalpayments"]) + gF(r, ["cardamt", "cardamount", "card"]);
            let initS = sheetS - tSold; initS = initS > 0 ? initS : 0; 
            let initP = sheetP - tPaid; initP = initP > 0 ? initP : 0;
            if (initS > 0 || initP > 0) addD('sales', gV(r, ["date", "timestamp", "creationstamp"]), initS, initP, "Base Master Record", gV(r, ["username", "loggedby", "createdby"]));
        });

        // --- INCOME LOGIC ---
        let tIncS=0, tIncP=0;
        if (rIncT.success) rIncT.records.forEach(r => {
            const amounts = parseTxnDualAmounts(r, INCOME_TXN_FIELDS);
            let check = cln(getDualTxnCategory(r, INCOME_TXN_FIELDS) + " " + gV(r, ["remarks", "parenthead", "subhead"])); 
            
            if (check.includes("previousdue") || check.includes("openingbalance")) { 
                let prevAmt = Math.max(amounts.bill, amounts.pay);
                tIncS += prevAmt;
                addD('income', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", gV(r, ["username", "loggedby"]));
            } else {
                tIncS += amounts.bill; tIncP += amounts.pay;
                addD('income', gV(r, ["date", "timestamp"]), amounts.bill, amounts.pay, gV(r, ["remarks", "details"])||"Income", gV(r, ["username", "loggedby"]));
            }
        });
        if (typeof rInc !== 'undefined' && rInc && rInc.success) rInc.records.forEach(r => {
            let sheetS = gF(r, ["totalreceivable", "receivable"]);
            let sheetP = gF(r, ["totalreceived", "received"]);
            let initS = sheetS - tIncS; initS = initS > 0 ? initS : 0;
            let initP = sheetP - tIncP; initP = initP > 0 ? initP : 0;
            if (initS > 0 || initP > 0) addD('income', gV(r, ["date", "creationstamp"]), initS, initP, "Base Master Record", "-");
        });

        // --- SUPPLIER PURCHASES LOGIC ---
        let tPurS=0, tPurP=0;
        if (rSupT.success) rSupT.records.forEach(r => {
            const p = parseSupplierTxnAmounts(r);
            let check = cln(getSupplierTxnCategory(r) + " " + gV(r, ["remarks", "type"]));
            const d = gV(r, ["date", "timestamp"]);
            const usr = gV(r, ["username", "loggedby"]);
            const rem = gV(r, ["remarks"]) || "Supplier Txn";
            
            if(check.includes("previousdue") || check.includes("openingbalance")) { 
                tPurS += Math.max(p.bill, p.pay);
                addD('purchase', d, Math.max(p.bill, p.pay), 0, "📌 Previous Due", usr);
            } else { 
                if (p.bill > 0) { tPurS += p.bill; addD('purchase', d, p.bill, 0, rem, usr); }
                if (p.pay > 0) { tPurP += p.pay; addD('purchase', d, 0, p.pay, rem, usr); }
            }
        });
        // --- EXPENSES LOGIC ---
        let tExpS=0, tExpP=0;
        if (rExp.success) rExp.records.forEach(r => {
            const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
            let check = cln(getDualTxnCategory(r, EXPENSE_TXN_FIELDS) + " " + gV(r, ["remarks", "parenthead", "subhead"]));

            if (check.includes("previousdue") || check.includes("openingbalance")) {
                let prevAmt = Math.max(amounts.bill, amounts.pay);
                tExpS += prevAmt;
                addD('expense', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", gV(r, ["username", "loggedby"]));
            } else {
                tExpS += amounts.bill; tExpP += amounts.pay;
                addD('expense', gV(r, ["date", "timestamp"]), amounts.bill, amounts.pay, gV(r, ["remarks", "description"])||"Expense", gV(r, ["username", "loggedby"]));
            }
        });

        // --- HR LOGIC ---
        let tHrS=0, tHrP=0;
        if (rHrT.success) rHrT.records.forEach(r => {
            let cat = cln(gV(r, ["category", "remarks"])); 
            let amt = Math.abs(gF(r, ["amount"]));
            
            if (cat.includes("previousdue") || cat.includes("openingbalance")) {
                tHrS += amt;
                addD('hr', gV(r, ["date", "timestamp"]), amt, 0, "📌 Previous Due", gV(r, ["username", "loggedby"]));
            } else if (cat.includes("earn") || cat.includes("bill")) {
                tHrS += amt;
                addD('hr', gV(r, ["date", "timestamp"]), amt, 0, gV(r, ["remarks", "category"])||"HR Earned", gV(r, ["username", "loggedby"]));
            } else if (cat.includes("paid")) {
                tHrP += amt;
                addD('hr', gV(r, ["date", "timestamp"]), 0, amt, gV(r, ["remarks", "category"])||"HR Paid", gV(r, ["username", "loggedby"]));
            }
        });
        if (rHr.success) rHr.records.forEach(r => {
            let sheetS = gF(r, ["totalearn", "totalearnearning", "earned"]);
            let sheetP = gF(r, ["paidsalary", "paid"]);
            let initS = sheetS - tHrS; initS = initS > 0 ? initS : 0;
            let initP = sheetP - tHrP; initP = initP > 0 ? initP : 0;
            if (initS > 0 || initP > 0) addD('hr', gV(r, ["creationstamp", "timestamp", "dateofjoining"]), initS, initP, "Base HR Record", gV(r, ["username", "createdby"]));
        });

        // --- CREDITOR LIABILITIES LOGIC ---
        if (rCrdT.success) rCrdT.records.forEach(r => {
            let rawRecv = Math.abs(gF(r, ["receivedamount", "receivedamt", "received", "amountreceived"]));
            let rawRet = Math.abs(gF(r, ["returnamount", "returnamt", "returned"]));
            let cat = String(gV(r, ["category", "subhead", "method", "type"]) || getRemarks(r)).trim().toUpperCase();
            let usr = getCol(r, ["Logged By", "Username", "User"]) || gV(r, ["username", "loggedby"]) || '-';

            if (cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
                let prevAmt = Math.max(rawRecv, rawRet);
                addD('creditor', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", usr);
            } else {
                addD('creditor', gV(r, ["date", "timestamp"]), rawRecv, rawRet, getRemarks(r), usr);
            }
        });

        // --- CAPITAL EQUITY LOGIC ---
        if (typeof rCapT !== 'undefined' && rCapT && rCapT.success) rCapT.records.forEach(r => {
            let rawIn = Math.abs(gF(r, ["capitalinamount", "capitalinamt", "capitalin"]));
            let rawOut = Math.abs(gF(r, ["capitaloutamount", "capitaloutamt", "capitalout"]));
            let cat = String(gV(r, ["category", "subhead", "method", "type"]) || getRemarks(r)).trim().toUpperCase();
            let usr = getCol(r, ["Logged By", "Username", "User"]) || gV(r, ["username", "loggedby"]) || '-';

            if (cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
                let prevAmt = Math.max(rawIn, rawOut);
                addD('capital', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", usr);
            } else {
                addD('capital', gV(r, ["date", "timestamp"]), rawIn, rawOut, getRemarks(r), usr);
            }
        });

        let d = window.aggReportData;
        let totalReceivable = (d.sales.lInc - d.sales.lPaid) + (d.income.lInc - d.income.lPaid);
        let totalPayable = (d.purchase.lInc - d.purchase.lPaid) + (d.expense.lInc - d.expense.lPaid) + (d.hr.lInc - d.hr.lPaid) + (d.creditor.lInc - d.creditor.lPaid);
        let netStatus = totalReceivable - totalPayable;
        
        let rngReceivable = (d.sales.rInc - d.sales.rPaid) + (d.income.rInc - d.income.rPaid);
        let rngPayable = (d.purchase.rInc - d.purchase.rPaid) + (d.expense.rInc - d.expense.rPaid) + (d.hr.rInc - d.hr.rPaid) + (d.creditor.rInc - d.creditor.rPaid);
        let rngNetStatus = rngReceivable - rngPayable;

        const buildBox = (title, incL, paidL, l1, l2, key, mode) => `
            <div onclick="window.openAggModal('${key}', '${title}', '${mode}')" class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 cursor-pointer hover:ring-2 hover:${mode === 'lifetime' ? 'ring-blue-400' : 'ring-purple-400'} hover:shadow-md transition duration-200 group relative">
               <div class="absolute top-3 right-3 text-gray-300 group-hover:${mode === 'lifetime' ? 'text-blue-500' : 'text-purple-500'}"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg></div>
               <h3 class="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">${title}</h3>
               <div class="flex justify-between">
                   <div class="w-1/2 pr-2">
                       <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">${l1}</div>
                       <div class="text-lg font-bold text-blue-600 font-mono mt-1">SAR ${incL.toFixed(2)}</div>
                   </div>
                   <div class="w-1/2 border-l pl-3">
                       <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">${l2}</div>
                       <div class="text-lg font-bold text-emerald-600 font-mono mt-1">SAR ${paidL.toFixed(2)}</div>
                   </div>
               </div>
               <div class="mt-4 pt-3 border-t ${mode === 'lifetime' ? 'bg-gray-50' : 'bg-purple-50'} -mx-5 -mb-5 p-3 rounded-b-xl text-center">
                   <div class="text-[10px] font-bold ${mode === 'lifetime' ? 'text-gray-500' : 'text-purple-700'} uppercase tracking-widest">${mode === 'lifetime' ? t('report.lifetimeBalanceDue') : t('report.rangeBalanceDue')}</div>
                   <div class="text-xl font-black ${(incL - paidL) > 0 ? 'text-red-500' : 'text-emerald-500'} font-mono mt-1">SAR ${(incL - paidL).toFixed(2)}</div>
               </div>
            </div>
        `;

        cardsEl.innerHTML = `
          <div class="col-span-full bg-slate-900 rounded-xl shadow-lg p-6 mb-6 flex flex-wrap justify-between items-center text-white border-b-4 border-slate-700">
             <div class="w-full md:w-1/3 text-center md:text-left mb-4 md:mb-0">
                <div class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">${t('report.totalMarketReceivable')}</div>
                <div class="text-3xl font-bold text-emerald-400 font-mono">SAR ${totalReceivable.toFixed(2)}</div>
             </div>
             <div class="w-full md:w-1/3 text-center mb-4 md:mb-0 border-y md:border-y-0 md:border-x border-slate-700 py-4 md:py-0">
                <div class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">${t('report.totalCompanyPayable')}</div>
                <div class="text-3xl font-bold text-red-400 font-mono">SAR ${totalPayable.toFixed(2)}</div>
             </div>
             <div class="w-full md:w-1/3 text-center md:text-right">
                <div class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">${t('report.netEnterprisePosition')}</div>
                <div class="text-4xl font-black ${netStatus >= 0 ? 'text-blue-400' : 'text-orange-400'} font-mono">SAR ${netStatus.toFixed(2)}</div>
                <div class="text-[9px] ${netStatus >= 0 ? 'text-blue-500' : 'text-orange-500'} uppercase font-bold mt-1">${netStatus >= 0 ? t('report.positiveLiquidity') : t('report.negativeLiquidity')}</div>
             </div>
          </div>
          
          <div class="col-span-full mb-2">
             <h2 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg> ${t('report.lifetimeAggregates')}</h2>
          </div>
          <div class="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
             ${buildBox(t('report.boxCustomerSales'), d.sales.lInc, d.sales.lPaid, t('report.soldAmount'), t('report.receivedAmount'), "sales", "lifetime")}
             ${buildBox(t('report.boxOtherIncome'), d.income.lInc, d.income.lPaid, t('report.incurredAmount'), t('report.receivedAmount'), "income", "lifetime")}
             ${buildBox(t('report.boxSupplierPurchases'), d.purchase.lInc, d.purchase.lPaid, t('report.purchaseAmount'), t('report.paidAmountLabel'), "purchase", "lifetime")}
             ${buildBox(t('report.boxOperationalExpenses'), d.expense.lInc, d.expense.lPaid, t('report.incurredAmount'), t('report.paidAmountLabel'), "expense", "lifetime")}
             ${buildBox(t('report.boxHrPayroll'), d.hr.lInc, d.hr.lPaid, t('report.salaryEarned'), t('report.salaryPaidLabel'), "hr", "lifetime")}
             ${buildBox(t('report.boxCreditorLiabilities'), d.creditor.lInc, d.creditor.lPaid, t('report.receivedLoaned'), t('report.returnedPaid'), "creditor", "lifetime")}
             ${buildBox(t('report.boxOwnerCapital'), d.capital.lInc, d.capital.lPaid, t('report.capitalInLabel'), t('report.capitalOutLabel'), "capital", "lifetime")}
          </div>
          
          ${hasDates ? `
          <div class="col-span-full bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-4 mb-6 flex justify-around items-center">
             <div class="text-center"><div class="text-[9px] text-blue-500 uppercase font-bold tracking-widest">${t('report.rangeReceivableGenerated')}</div><div class="text-xl font-bold text-blue-700 font-mono mt-1">SAR ${rngReceivable.toFixed(2)}</div></div>
             <div class="text-center border-l border-blue-200 pl-6"><div class="text-[9px] text-orange-500 uppercase font-bold tracking-widest">${t('report.rangePayableGenerated')}</div><div class="text-xl font-bold text-orange-700 font-mono mt-1">SAR ${rngPayable.toFixed(2)}</div></div>
             <div class="text-center border-l border-blue-200 pl-6"><div class="text-[9px] text-slate-500 uppercase font-bold tracking-widest">${t('report.rangeNetShift')}</div><div class="text-xl font-bold ${rngNetStatus >= 0 ? 'text-emerald-600' : 'text-red-600'} font-mono mt-1">SAR ${rngNetStatus.toFixed(2)}</div></div>
          </div>
          
          <div class="col-span-full mb-2">
             <h2 class="text-xs font-black text-purple-600 uppercase tracking-widest border-b border-purple-200 pb-2 flex items-center gap-2"><svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${t('report.selectedRangeAggregates')}</h2>
          </div>
          <div class="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
             ${buildBox(t('report.boxCustomerSales'), d.sales.rInc, d.sales.rPaid, t('report.soldAmount'), t('report.receivedAmount'), "sales", "range")}
             ${buildBox(t('report.boxOtherIncome'), d.income.rInc, d.income.rPaid, t('report.incurredAmount'), t('report.receivedAmount'), "income", "range")}
             ${buildBox(t('report.boxSupplierPurchases'), d.purchase.rInc, d.purchase.rPaid, t('report.purchaseAmount'), t('report.paidAmountLabel'), "purchase", "range")}
             ${buildBox(t('report.boxOperationalExpenses'), d.expense.rInc, d.expense.rPaid, t('report.incurredAmount'), t('report.paidAmountLabel'), "expense", "range")}
             ${buildBox(t('report.boxHrPayroll'), d.hr.rInc, d.hr.rPaid, t('report.salaryEarned'), t('report.salaryPaidLabel'), "hr", "range")}
             ${buildBox(t('report.boxCreditorLiabilities'), d.creditor.rInc, d.creditor.rPaid, t('report.receivedLoaned'), t('report.returnedPaid'), "creditor", "range")}
             ${buildBox(t('report.boxOwnerCapital'), d.capital.rInc, d.capital.rPaid, t('report.capitalInLabel'), t('report.capitalOutLabel'), "capital", "range")}
          </div>` : ''}
        `;
        cardsEl.className = "grid grid-cols-1 mb-2";

        tableContainer.innerHTML = `
          <div class="text-center text-gray-400 text-xs font-bold mt-4 animate-pulse">${t('report.clickCardHint')}</div>
          <div id="agg-modal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <div class="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200">
                <div class="bg-slate-800 p-4 flex justify-between items-center text-white">
                   <h2 id="agg-modal-title" class="text-lg font-black uppercase tracking-wider text-blue-400">${t('report.ledgerDetails')}</h2>
                   <button onclick="window.closeAggModal()" class="text-slate-400 hover:text-white transition font-bold text-2xl leading-none">&times;</button>
                </div>
                <div class="p-4 bg-gray-50 flex justify-around border-b border-gray-200 text-center">
                   <div><div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest" id="agg-l1">${t('report.colIncurred')}</div><div id="agg-v1" class="text-xl font-bold text-blue-600 font-mono">0.00</div></div>
                   <div class="border-l pl-8"><div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest" id="agg-l2">${t('report.colPaid')}</div><div id="agg-v2" class="text-xl font-bold text-emerald-600 font-mono">0.00</div></div>
                </div>
                <div class="flex-1 overflow-y-auto p-4">
                   <table class="w-full text-left text-xs">
                      <thead class="bg-gray-100 text-gray-600 sticky top-0 border-b">
                         <tr><th class="p-3 font-semibold">${t('col.date')}</th><th class="p-3 font-semibold" id="agg-h1">${t('report.colIncurred')}</th><th class="p-3 font-semibold" id="agg-h2">${t('report.colPaid')}</th><th class="p-3 font-semibold">${t('col.remarks')}</th><th class="p-3 font-semibold">${t('report.colUser')}</th></tr>
                      </thead>
                      <tbody id="agg-modal-body" class="divide-y divide-gray-100"></tbody>
                   </table>
                </div>
             </div>
          </div>
        `;

        window.openAggModal = function(key, title, mode) {
            const m = document.getElementById('agg-modal'); const data = window.aggReportData[key];
            if (!m || !data) return;

            document.getElementById('agg-modal-title').textContent = title + (mode === 'range' ? ' ' + t('report.rangeFiltered') : ' ' + t('report.lifetimeSuffix'));
            let l1 = t('report.colIncurred'), l2 = t('report.colPaid');
            if(key === 'sales') { l1 = t('report.aggSold'); l2 = t('report.aggReceived'); }
            if(key === 'purchase') { l1 = t('report.aggPurchased'); }
            if(key === 'hr') { l1 = t('report.aggEarned'); }
            if(key === 'creditor') { l1 = t('report.aggReceived'); l2 = t('report.aggReturned'); }
            if(key === 'capital') { l1 = t('report.capitalInLabel'); l2 = t('report.capitalOutLabel'); }
            
            document.getElementById('agg-l1').textContent = l1; document.getElementById('agg-h1').textContent = l1;
            document.getElementById('agg-l2').textContent = l2; document.getElementById('agg-h2').textContent = l2;
            
            let incAmt = mode === 'range' ? data.rInc : data.lInc; let paidAmt = mode === 'range' ? data.rPaid : data.lPaid;
            document.getElementById('agg-v1').textContent = "SAR " + incAmt.toFixed(2);
            document.getElementById('agg-v2').textContent = "SAR " + paidAmt.toFixed(2);

            let tBody = document.getElementById('agg-modal-body');
            let rowsToDisplay = mode === 'range' ? data.rows.filter(r => r.inRange) : data.rows;
            let sorted = rowsToDisplay.sort((a,b) => b.d - a.d);
            
            if (sorted.length === 0) { tBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-400 italic">${t('report.noTransactionsView')}</td></tr>`; } 
            else {
                tBody.innerHTML = sorted.map(r => `
                    <tr class="hover:bg-gray-50">
                        <td class="p-3 whitespace-nowrap">${r.d.toLocaleDateString()}</td>
                        <td class="p-3 font-mono font-bold text-blue-600">${r.inc > 0 ? Number(r.inc).toFixed(2) : '-'}</td>
                        <td class="p-3 font-mono font-bold text-emerald-600">${r.paid > 0 ? Number(r.paid).toFixed(2) : '-'}</td>
                        <td class="p-3 text-gray-600 truncate max-w-[150px]" title="${r.rem}">${r.rem}</td>
                        <td class="p-3 text-gray-500">${r.usr}</td>
                    </tr>
                `).join('');
            }
            m.classList.remove('hidden');
        };

        window.closeAggModal = function() { const m = document.getElementById('agg-modal'); if (m) m.classList.add('hidden'); };
        break;
      }

      case 'pnl': {
        titleEl.textContent = t('report.titlePnl');
        let revSales = 0; let revIncome = 0;
        let expSup = 0; let expOp = 0; let expHR = 0;

        filterByDate(rCust.records, ["Creation Stamp", "Timestamp", "Date", "Created By"]).forEach(r => revSales += parseFloat(getCol(r, ["Total Sell", "Sell Amount"])) || 0);
        filterByDate(rIncT.records, ["Date"]).forEach(r => revIncome += parseFloat(getCol(r, ["Receivable Amount", "Receivable"])) || 0);
        
        filterByDate(rSupT.records, ["Date"]).forEach(r => { if(String(getCol(r, ["Category"])).trim().toUpperCase() === "PURCHASE") expSup += parseFloat(getCol(r, ["Amount"])) || 0; });
        filterByDate(rExp.records, ["Date"]).forEach(r => expOp += parseFloat(getCol(r, ["Deposit", "Amount"])) || 0);
        filterByDate(rHrT.records, ["Date"]).forEach(r => { if(String(getCol(r, ["Category"])).trim().toUpperCase() === "SALARY EARN") expHR += parseFloat(getCol(r, ["Amount"])) || 0; });

        let totalRev = revSales + revIncome;
        let totalExp = expSup + expOp + expHR;
        let netProfit = totalRev - totalExp;

        cardsEl.innerHTML = 
          drawCard(t('report.grossRevenue'), totalRev, "text-emerald-600") +
          drawCard(t('report.grossExpenses'), totalExp, "text-red-600") +
          drawCard(t('report.netProfitLoss'), netProfit, netProfit >= 0 ? "text-blue-600" : "text-red-600");
        cardsEl.className = "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6";

        tHead.innerHTML = `<tr><th class="p-3">${t('col.category')}</th><th class="p-3">${t('report.colClassification')}</th><th class="p-3 text-right">${t('report.colAmountSar')}</th></tr>`;
        tBody.innerHTML = `
          <tr class="bg-emerald-50"><td class="p-3 font-bold text-emerald-800" colspan="3">${t('report.revenues')}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.customerSalesBilled')}</td><td>${t('report.operatingRevenue')}</td><td class="text-right font-mono">${revSales.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.otherIncomeBilled')}</td><td>${t('report.operatingRevenue')}</td><td class="text-right font-mono">${revIncome.toFixed(2)}</td></tr>
          <tr class="bg-red-50"><td class="p-3 font-bold text-red-800" colspan="3">${t('report.expensesSection')}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.cogsSuppliers')}</td><td>${t('report.directCost')}</td><td class="text-right font-mono">${expSup.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.operationalExpenses')}</td><td>${t('report.overhead')}</td><td class="text-right font-mono">${expOp.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.hrPayrollEarned')}</td><td>${t('report.overhead')}</td><td class="text-right font-mono">${expHR.toFixed(2)}</td></tr>
          <tr class="bg-slate-100 font-bold text-lg border-t-2 border-slate-300"><td class="p-4 uppercase" colspan="2">${t('report.netProfitSlashLoss')}</td><td class="text-right font-mono ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}">${netProfit.toFixed(2)}</td></tr>
        `;
        break;
      }
      // ====================================================================
      // REDESIGNED RECEIVABLE & PAYABLE REPORT (FIXED DYNAMIC MATH)
      // ====================================================================
      case 'receivable_payable': {
        titleEl.textContent = t('report.titleReceivablePayable');

        let recvCustomers = []; let recvIncome = []; let paySuppliers = []; let payHR = []; let payCreditors = [];
        let tRecvCust = 0; let tRecvInc = 0; let tPaySup = 0; let tPayHR = 0; let tPayCrd = 0;

        // 1. Gather Customers (Receivable)
        if (typeof rCust !== 'undefined' && rCust.success) {
           rCust.records.forEach(r => {
              let due = parseFloat(getCol(r, ["Due Balance", "Due", "Outstanding Balance Due"])) || 0;
              if (due > 0) {
                 tRecvCust += due;
                 recvCustomers.push({ id: getCol(r, ["System Unique ID", "Sys UID", "UNIQUEID"]) || '-', name: getCol(r, ["Customer Name", "Name"]) || 'Unknown', amt: due });
              }
           });
        }

        // 2. Gather Other Income (Receivable) — billed but not yet received
        if (typeof rIncT !== 'undefined' && rIncT.success) {
           let headTotals = {};

           rIncT.records.forEach(t => {
              let mHead = String(getCol(t, ["Income Parent Head", "Parent Head", "Main Head"])).trim().toUpperCase();
              let sHead = String(getCol(t, ["Sub Head", "Sub Head Name", "SubCategory"])).trim().toUpperCase();
              let rem = String(getRemarks(t)).trim().toUpperCase();

              let rawReceivable = Math.abs(parseFloat(getCol(t, ["Receivable Amount", "Receivable"])) || 0);
              let rawReceived = Math.abs(parseFloat(getCol(t, ["Received Amount", "Received Amt", "Received"])) || 0);

              let isPrevDue = mHead.includes("PREVIOUS DUE") || sHead.includes("PREVIOUS DUE") ||
                rem.includes("PREVIOUS DUE") || rem.includes("OPENING BALANCE");

              let key = mHead + "|||" + sHead;
              if (!headTotals[key]) headTotals[key] = { receivable: 0, received: 0, prevDue: 0 };

              if (isPrevDue) {
                 headTotals[key].prevDue += Math.max(rawReceivable, rawReceived);
              } else {
                 headTotals[key].receivable += rawReceivable;
                 headTotals[key].received += rawReceived;
              }
           });

           const addIncomeDue = (mainHead, subHead, key, trackingId) => {
              let h = headTotals[key];
              if (!h) return;
              let rowReceivable = h.receivable + (h.prevDue || 0);
              let due = rowReceivable - h.received;
              if (due > 0) {
                 tRecvInc += due;
                 recvIncome.push({
                    id: trackingId || '-',
                    name: (mainHead && subHead) ? `${mainHead} - ${subHead}` : (mainHead || subHead || 'Unknown'),
                    amt: due
                 });
              }
           };

           let processedIncomeKeys = new Set();

           if (typeof rInc !== 'undefined' && rInc.success && rInc.records.length > 0) {
              rInc.records.forEach(rec => {
                 let mainHead = getCol(rec, ["Income Parent Head", "Parent Head", "Main Head"]) || '';
                 let subHead = getCol(rec, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';
                 let key = String(mainHead).trim().toUpperCase() + "|||" + String(subHead).trim().toUpperCase();
                 processedIncomeKeys.add(key);
                 addIncomeDue(mainHead, subHead, key, getCol(rec, ["Tracking ID", "System Unique ID", "ID"]));
              });
           }

           Object.keys(headTotals).forEach(key => {
              if (processedIncomeKeys.has(key)) return;
              let [mHead, sHead] = key.split("|||");
              addIncomeDue(mHead, sHead, key, '-');
           });
        }

        let tRecv = tRecvCust + tRecvInc;

        // 3. Gather Suppliers (Payable)
        if (typeof rSup !== 'undefined' && rSup.success) {
           rSup.records.forEach(r => {
              let due = parseFloat(getCol(r, ["Due Balance", "Due"])) || 0;
              if (due > 0) {
                 tPaySup += due;
                 paySuppliers.push({ name: getCol(r, ["Supplier Name"]) || 'Unknown', amt: due });
              }
           });
        }

        // 4. Gather HR (Payable) - DYNAMIC MATH ENGINE (Ignores Increments & Base Salary)
        let hrBalances = {};
        if (typeof rHrT !== 'undefined' && rHrT.success) {
           const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
           rHrT.records.forEach(r => {
              let emp = getCol(r, ["Employee Name"]) || 'Unknown';
              if (!hrBalances[emp]) hrBalances[emp] = { earned: 0, paid: 0 };
              
              let cat = cln(getCol(r, ["Category", "Remarks"]));
              let amt = Math.abs(parseFloat(getCol(r, ["Amount"])) || 0);

              if (cat.includes("previousdue") || cat.includes("openingbalance") || cat.includes("earn") || cat.includes("bill")) {
                 hrBalances[emp].earned += amt;
              } else if (cat.includes("paid")) {
                 hrBalances[emp].paid += amt;
              }
           });

           Object.keys(hrBalances).forEach(emp => {
              let due = hrBalances[emp].earned - hrBalances[emp].paid;
              if (due > 0) {
                 tPayHR += due;
                 payHR.push({ name: emp, amt: due });
              }
           });
        }

        // 5. Gather Creditors (Payable)
        if (typeof rCrd !== 'undefined' && rCrd.success && typeof rCrdT !== 'undefined' && rCrdT.success) {
           rCrd.records.forEach(head => {
              let mHead = String(getCol(head, ["Creditor Parent Head", "Parent Head", "Main Head"])||"").trim();
              let sHead = String(getCol(head, ["Sub Head Name", "Sub Head", "SubCategory"])||"").trim();
              let recAmt = 0; let retAmt = 0;
              rCrdT.records.forEach(t => {
                 let tM = String(getCol(t, ["Creditor Parent Head", "Parent Head", "Main Head"])||"").trim();
                 let tS = String(getCol(t, ["Sub Head Mapping", "Sub Head", "SubCategory"])||"").trim();
                 if (mHead.toUpperCase() === tM.toUpperCase() && sHead.toUpperCase() === tS.toUpperCase()) {
                    recAmt += parseFloat(getCol(t, ["Received Amount", "Received Amt"])) || 0;
                    retAmt += parseFloat(getCol(t, ["Return Amount", "Return Amt"])) || 0;
                 }
              });
              let due = recAmt - retAmt;
              if (due > 0) { tPayCrd += due; payCreditors.push({ name: mHead + " - " + sHead, amt: due }); }
           });
        }

        let tPayTotal = tPaySup + tPayHR + tPayCrd;
        let netBalance = tRecv - tPayTotal;
        let statusText = netBalance < 0 ? t('report.statusImbalance') : t('report.statusBalanceHealthy');
        let statusColor = netBalance < 0 ? "text-red-800 bg-red-200" : "text-emerald-800 bg-emerald-200";

        recvCustomers.sort((a,b) => b.amt - a.amt); recvIncome.sort((a,b) => b.amt - a.amt);
        paySuppliers.sort((a,b) => b.amt - a.amt);
        payHR.sort((a,b) => b.amt - a.amt); payCreditors.sort((a,b) => b.amt - a.amt);

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left w-1/3">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalReceivableMarket')}</div>
                  <div class="text-2xl font-black text-emerald-600 font-mono mt-1">SAR ${tRecv.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalPayableLiabilities')}</div>
                  <div class="text-2xl font-black text-red-600 font-mono mt-1">SAR ${tPayTotal.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.netPosition')}</div>
                  <div class="text-2xl font-black font-mono mt-1 ${netBalance < 0 ? 'text-red-600' : 'text-blue-600'}">SAR ${netBalance.toFixed(2)}</div>
                  <div class="mt-2"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusColor}">${statusText}</span></div>
                </div>
             </div>
             <div class="flex flex-wrap justify-around bg-gray-50 p-4 rounded-lg gap-4">
                ${tRecvCust > 0 ? `<div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.customerReceivable')}</div><div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${tRecvCust.toFixed(2)}</div></div>` : ''}
                ${tRecvInc > 0 ? `<div class="text-center ${tRecvCust > 0 ? 'border-l pl-8 border-gray-200' : ''}"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.incomeReceivable')}</div><div class="text-lg font-bold text-indigo-500 font-mono mt-1">SAR ${tRecvInc.toFixed(2)}</div></div>` : ''}
                ${tPaySup > 0 ? `<div class="text-center border-l pl-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.supplierPayable')}</div><div class="text-lg font-bold text-red-500 font-mono mt-1">SAR ${tPaySup.toFixed(2)}</div></div>` : ''}
                ${tPayHR > 0 ? `<div class="text-center border-l pl-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.salaryPayable')}</div><div class="text-lg font-bold text-orange-500 font-mono mt-1">SAR ${tPayHR.toFixed(2)}</div></div>` : ''}
                ${tPayCrd > 0 ? `<div class="text-center border-l pl-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.creditorPayable')}</div><div class="text-lg font-bold text-purple-500 font-mono mt-1">SAR ${tPayCrd.toFixed(2)}</div></div>` : ''}
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        let listsHtml = '';
        if (recvCustomers.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.customerReceivablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('report.colCustomerNameUid')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${recvCustomers.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name} <br><span class="text-[9px] text-gray-400 font-mono font-normal">${c.id}</span></td><td class="p-2.5 text-right pr-6 font-mono font-bold text-emerald-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        if (recvIncome.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-indigo-50 text-indigo-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-indigo-100 text-center">${t('report.incomeReceivablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('report.colIncomeHeadUid')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${recvIncome.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name} <br><span class="text-[9px] text-gray-400 font-mono font-normal">${c.id}</span></td><td class="p-2.5 text-right pr-6 font-mono font-bold text-indigo-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        if (paySuppliers.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-red-50 text-red-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">${t('report.supplierPayablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('col.supplierName')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${paySuppliers.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name}</td><td class="p-2.5 text-right pr-6 font-mono font-bold text-red-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        if (payHR.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-orange-50 text-orange-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-orange-100 text-center">${t('report.salaryPayablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('report.colEmployeeName')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${payHR.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name}</td><td class="p-2.5 text-right pr-6 font-mono font-bold text-orange-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        if (payCreditors.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-purple-50 text-purple-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-purple-100 text-center">${t('report.creditorPayablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('report.colCreditorNameHead')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${payCreditors.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name}</td><td class="p-2.5 text-right pr-6 font-mono font-bold text-purple-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }

        if (listsHtml === '') listsHtml = `<div class="col-span-2 p-6 text-center text-gray-500 font-bold border border-gray-200 bg-gray-50 rounded-xl">${t('report.noOutstanding')}</div>`;

        tableContainer.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">${listsHtml}</div>`;
        break;
      }

      // ====================================================================
      // 1. EXPENSE DETAILS REPORT (WITH UNIVERSAL ROW SCANNER)
      // ====================================================================
      case 'expense_details': {
        titleEl.textContent = t('report.titleExpenseStatement');
        
        let cdIncurred = []; let cdPayments = [];
        let lifeInc = 0, lifePaid = 0;
        let rngInc = 0, rngPaid = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };

        const parseExpSelection = (val) => {
          if (!val) return { main: '', sub: '' };
          if (String(val).includes('|||')) {
            const parts = String(val).split('|||');
            return { main: String(parts[0] || '').trim(), sub: String(parts[1] || '').trim() };
          }
          return { main: String(val).trim(), sub: '' };
        };
        const expSelection = parseExpSelection(secVal);

        const isExpHead = (obj) => {
          const tMain = String(getCol(obj, ["Parent Category", "Expense Parent Head", "Main Head", "Parent Head"]) || '').trim().toUpperCase();
          const tSub = String(getCol(obj, ["Sub Head", "Sub Head Name", "SubCategory"]) || '').trim().toUpperCase();
          if (expSelection.sub) {
            return tMain === expSelection.main.toUpperCase() && tSub === expSelection.sub.toUpperCase();
          }
          if (expSelection.main) {
            return tMain === expSelection.main.toUpperCase() || tSub === expSelection.main.toUpperCase();
          }
          let target = cln(secVal);
          for (let key in obj) { if (cln(obj[key]) === target) return true; }
          return false;
        };

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rExp.success) {
            rExp.records.filter(isExpHead).forEach(r => {
                const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
                let inc = 0; let paid = 0; let typeLabel = EXPENSE_TXN_FIELDS.categories.bill;

                if (isDualTxnPrevDue(r, EXPENSE_TXN_FIELDS)) {
                    inc = Math.max(amounts.bill, amounts.pay);
                    paid = 0;
                    typeLabel = "Previous Due";
                } else {
                    inc = amounts.bill;
                    paid = amounts.pay;
                    typeLabel = getDualTxnCategory(r, EXPENSE_TXN_FIELDS);
                }

                lifeInc += inc;
                lifePaid += paid;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngInc += inc; rngPaid += paid; }
                    let remarks = getRemarks(r);
                    let usr = getCol(r, ["Logged By", "Username", "User"]) || gV(r, ["username", "loggedby"]) || '-';
                    
                    if (inc > 0) cdIncurred.push({ d, amt: inc, rem: remarks, usr, type: typeLabel });
                    if (paid > 0) cdPayments.push({ d, amt: paid, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeInc - lifePaid;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalIncurred')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeInc.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifePaid.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeIncurred')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngInc.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaid')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngPaid.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.incurredExpenseLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colIncurredAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdIncurred.length > 0 ? cdIncurred.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noExpensesIncurred')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.paymentsMadeLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.paidAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdPayments.length > 0 ? cdPayments.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPaymentsMade')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2. CREDITOR DETAILS REPORT (WITH UNIVERSAL ROW SCANNER)
      // ====================================================================
      case 'creditor_details': {
        titleEl.textContent = t('report.titleCreditorStatement');
        
        let cdReceived = []; let cdReturned = [];
        let lifeRecv = 0, lifeRet = 0;
        let rngRecv = 0, rngRet = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // UNIVERSAL SCANNER: Checks if the selected Creditor exists in ANY column of the row!
        const isCrd = (obj) => {
            let target = cln(secVal);
            for(let key in obj) { if (cln(obj[key]) === target) return true; }
            return false;
        };

        const recvCols = ["receivedamount", "receivedamt", "received", "amountreceived"];
        const retCols = ["returnamount", "returnamt", "amount", "returned", "paid", "amountpaid"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rCrdT.success) {
            rCrdT.records.filter(isCrd).forEach(r => {
                let recv = Math.abs(parseFloat(gV(r, recvCols))); if(isNaN(recv)) recv = 0;
                let ret = Math.abs(parseFloat(gV(r, retCols))); if(isNaN(ret)) ret = 0;

                lifeRecv += recv;
                lifeRet += ret;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngRecv += recv; rngRet += ret; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    let method = gV(r, ["paymentmethod", "method", "type"]) || 'Cash';
                    
                    if (recv > 0) cdReceived.push({ d, amt: recv, meth: method, rem: remarks, usr });
                    if (ret > 0) cdReturned.push({ d, amt: ret, meth: method, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeRecv - lifeRet;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceivedLoaned')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeRecv.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReturnedPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeRet.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceived')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngRecv.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReturned')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngRet.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.fundsReceivedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReceivedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReceived.length > 0 ? cdReceived.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 font-bold text-gray-600">${s.meth}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.fundsReturnedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReturnedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReturned.length > 0 ? cdReturned.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 font-bold text-gray-600">${p.meth}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReturned')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2b. CAPITAL DETAILS REPORT
      // ====================================================================
      case 'capital_details': {
        titleEl.textContent = t('report.titleCapitalStatement');

        let cdCapIn = []; let cdCapOut = [];
        let lifeIn = 0, lifeOut = 0;
        let rngIn = 0, rngOut = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };

        const isCap = (obj) => {
            let target = cln(secVal);
            for(let key in obj) { if (cln(obj[key]) === target) return true; }
            return false;
        };

        const inCols = ["capitalinamount", "capitalinamt", "capitalin"];
        const outCols = ["capitaloutamount", "capitaloutamt", "capitalout"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rCapT.success) {
            rCapT.records.filter(isCap).forEach(r => {
                let capIn = Math.abs(parseFloat(gV(r, inCols))); if(isNaN(capIn)) capIn = 0;
                let capOut = Math.abs(parseFloat(gV(r, outCols))); if(isNaN(capOut)) capOut = 0;
                let check = cln(gV(r, ["remarks", "subhead"])) + cln(gV(r, ["subhead"]));
                if (check.includes("previousdue") || check.includes("openingbalance")) {
                    capIn = Math.max(capIn, capOut);
                    capOut = 0;
                }

                lifeIn += capIn;
                lifeOut += capOut;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngIn += capIn; rngOut += capOut; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    if (capIn > 0) cdCapIn.push({ d, amt: capIn, rem: remarks, usr });
                    if (capOut > 0) cdCapOut.push({ d, amt: capOut, rem: remarks, usr });
                }
            });
        }

        let lifeNet = lifeIn - lifeOut;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalCapitalIn')}</div>
                   <div class="text-3xl font-black text-violet-600 font-mono mt-1">SAR ${lifeIn.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalCapitalOut')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeOut.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeNetCapital')}</div>
                   <div class="text-3xl font-black ${lifeNet >= 0 ? 'text-violet-600' : 'text-red-600'} font-mono mt-1">SAR ${lifeNet.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-violet-50 p-4 rounded-lg border border-violet-100">
                <div class="text-center"><div class="text-violet-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCapitalIn')}</div><div class="text-lg font-bold text-violet-700 font-mono mt-1">SAR ${rngIn.toFixed(2)}</div></div>
                <div class="text-center border-l border-violet-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCapitalOut')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngOut.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-violet-50 text-violet-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-violet-100 text-center">${t('report.capitalInLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colCapitalInAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdCapIn.length > 0 ? cdCapIn.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-violet-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noCapitalIn')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.capitalOutLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colCapitalOutAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdCapOut.length > 0 ? cdCapOut.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noCapitalOut')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 3. INCOME DETAILS REPORT (WITH ID TRANSLATOR & INTERCEPTOR)
      // ====================================================================
      case 'income_details': {
        titleEl.textContent = t('report.titleIncomeStatement');
        
        let incReceivables = []; let incReceivedLogs = [];
        let lifeReceivable = 0, lifeReceived = 0;
        let rngReceivable = 0, rngReceived = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // --- THE TRANSLATOR: Convert ID (INC-KHO-SHO) to Actual Names ---
        let targetMain = ""; let targetSub = "";

        if (typeof rInc !== 'undefined' && rInc && rInc.success) {
            let matchedMaster = rInc.records.find(master => {
                let id = cln(gV(master, ["systemuniqueid", "trackingid", "id"]));
                let mName = cln(gV(master, ["incomeparenthead", "parenthead", "mainhead"]));
                let sName = cln(gV(master, ["subheadname", "subhead", "subcategory"]));
                return id === cln(secVal) || mName === cln(secVal) || sName === cln(secVal);
            });

            if (matchedMaster) {
                targetMain = cln(gV(matchedMaster, ["incomeparenthead", "parenthead", "mainhead"]));
                targetSub = cln(gV(matchedMaster, ["subheadname", "subhead", "subcategory"]));
            }
        }

        // --- OMNI-DIRECTIONAL MATCHER ---
        const isInc = (obj) => {
            let m = cln(gV(obj, ["incomeparenthead", "parenthead", "mainhead"]));
            let s = cln(gV(obj, ["subheadname", "subhead", "subcategory"]));
            let id = cln(gV(obj, ["systemuniqueid", "trackingid", "id"]));
            let v = cln(secVal);
            
            if (id !== "" && id === v) return true; // Direct ID match
            if (m !== "" && m === v) return true; // Direct Main name match
            if (s !== "" && s === v) return true; // Direct Sub name match
            if (targetMain !== "" && m === targetMain) return true; // Translated Main match
            if (targetSub !== "" && s === targetSub) return true; // Translated Sub match
            
            return false;
        };

        const recvbleCols = ["receivableamount", "receivable"];
        const recvdCols = ["receivedamount", "receivedamt", "received", "amountreceived"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (typeof rIncT !== 'undefined' && rIncT && rIncT.success) {
            rIncT.records.filter(isInc).forEach(r => {
                let rawReceivable = Math.abs(parseFloat(gV(r, recvbleCols))); if(isNaN(rawReceivable)) rawReceivable = 0;
                let rawReceived = Math.abs(parseFloat(gV(r, recvdCols))); if(isNaN(rawReceived)) rawReceived = 0;

                let mHead = String(gV(r, ["incomeparenthead", "parenthead", "mainhead"])).trim().toUpperCase();
                let sHead = String(gV(r, ["subheadname", "subhead", "subcategory"])).trim().toUpperCase();
                let rem = String(gV(r, ["remarks", "description", "details"])).trim().toUpperCase();
                
                let receivable = 0; let received = 0; let typeLabel = "Receivable";

                // INTERCEPTOR FLIPPER: Catch Previous Due and force it to the Due Increasing side!
                let isPrevDue = mHead.includes("PREVIOUS DUE") || sHead.includes("PREVIOUS DUE") || rem.includes("PREVIOUS DUE") || rem.includes("OPENING BALANCE");

                if (isPrevDue) {
                    receivable = Math.max(rawReceivable, rawReceived); 
                    received = 0;
                    typeLabel = "Previous Due";
                } else {
                    receivable = rawReceivable;
                    received = rawReceived;
                    typeLabel = "Receivable";
                }

                lifeReceivable += receivable;
                lifeReceived += received;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngReceivable += receivable; rngReceived += received; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    
                    if (receivable > 0) incReceivables.push({ d, amt: receivable, rem: remarks, usr, type: typeLabel });
                    if (received > 0) incReceivedLogs.push({ d, amt: received, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeReceivable - lifeReceived;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceivable')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeReceivable.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceived')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeReceived.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDueMarketOwes')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-blue-600' : 'text-gray-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceivable')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngReceivable.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceived')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngReceived.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.receivableLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${incReceivables.length > 0 ? incReceivables.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50">
                              <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                              <td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                                 ${Number(s.amt).toFixed(2)}
                                 ${s.type === 'Previous Due' ? `<br><span class="text-[9px] text-gray-400 font-normal leading-none bg-gray-100 px-1 rounded border border-gray-200">${t('report.previousDue')}</span>` : ''}
                              </td>
                              <td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td>
                              <td class="p-2.5">${s.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noReceivables')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.receivedLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${incReceivedLogs.length > 0 ? incReceivedLogs.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50">
                              <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                              <td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                              <td class="p-2.5 truncate max-w-[120px]" title="${p.rem}">${p.rem}</td>
                              <td class="p-2.5">${p.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noFundsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2. CREDITOR DETAILS REPORT (WITH UNIVERSAL ROW SCANNER)
      // ====================================================================
      case 'creditor_details': {
        titleEl.textContent = t('report.titleCreditorStatement');
        
        let cdReceived = []; let cdReturned = [];
        let lifeRecv = 0, lifeRet = 0;
        let rngRecv = 0, rngRet = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // UNIVERSAL SCANNER: Checks if the selected Creditor exists in ANY column of the row!
        const isCrd = (obj) => {
            let target = cln(secVal);
            for(let key in obj) { if (cln(obj[key]) === target) return true; }
            return false;
        };

        const recvCols = ["receivedamount", "receivedamt", "received", "amountreceived"];
        const retCols = ["returnamount", "returnamt", "amount", "returned", "paid", "amountpaid"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rCrdT.success) {
            rCrdT.records.filter(isCrd).forEach(r => {
                let recv = Math.abs(parseFloat(gV(r, recvCols))); if(isNaN(recv)) recv = 0;
                let ret = Math.abs(parseFloat(gV(r, retCols))); if(isNaN(ret)) ret = 0;

                lifeRecv += recv;
                lifeRet += ret;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngRecv += recv; rngRet += ret; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    let method = gV(r, ["paymentmethod", "method", "type"]) || 'Cash';
                    
                    if (recv > 0) cdReceived.push({ d, amt: recv, meth: method, rem: remarks, usr });
                    if (ret > 0) cdReturned.push({ d, amt: ret, meth: method, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeRecv - lifeRet;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceivedLoaned')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeRecv.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReturnedPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeRet.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceived')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngRecv.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReturned')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngRet.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.fundsReceivedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReceivedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReceived.length > 0 ? cdReceived.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 font-bold text-gray-600">${s.meth}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.fundsReturnedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReturnedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReturned.length > 0 ? cdReturned.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 font-bold text-gray-600">${p.meth}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReturned')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // REDESIGNED CUSTOMER STATEMENT VIEW (LIFETIME + RANGE LOGIC)
      // ====================================================================
      case 'customer_details': {
        titleEl.textContent = t('report.titleCustomerStatement');
        
        let cdSales = []; let cdPayments = [];
        
        // 1. Separate Buckets for Lifetime vs Date Range
        let lifeSold = 0, lifePaid = 0, lifeCash = 0, lifeCard = 0, lifeDiscount = 0;
        let rngSold = 0, rngPaid = 0, rngCash = 0, rngCard = 0;

        // Super Matchers
        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };
        const custUid = (obj) => getCol(obj, ["System Unique ID", "Sys UID", "UNIQUEID"]) || gV(obj, ["systemuniqueid", "sysuid", "uniqueid"]);
        const isC = (obj) => cln(custUid(obj)) === cln(secVal);

        const sellCols = ["soldamount", "soldamt", "totalsell", "sellamount", "grosssell", "sell"];
        const recvCols = ["receivedamount", "receivedamt", "received", "cashreceived", "cashamt", "cashamount", "paidamount", "paidamt", "amountpaid"];
        const methCols = ["paymentmethod", "method", "paymenttype", "type"];

        // 2. Intelligent Date Checker
        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        // 3. Locate Master Record (priority column match — same as customer table)
        let masterRec = rCust.success ? rCust.records.find(isC) : null;
        let sheetSold = 0, sheetCash = 0, sheetCard = 0;

        // 4. Process Transactions & Populate Ledgers
        let tSold = 0, tCash = 0, tCard = 0;
        if (rCustT.success) {
            rCustT.records.filter(isC).forEach(t => {
                let sell = gF(t, sellCols);
                let recv = gF(t, recvCols);
                let method = cln(gV(t, methCols));
                if(method === "") method = "cash";

                // Sum up transactions to subtract from Master later
                tSold += sell;
                if(method.includes("cash")) tCash += recv; else tCard += recv;

                let dStr = gV(t, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                
                // If no dates are picked, inRange is ALWAYS true (shows all history)
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) {
                       rngSold += sell;
                       if(method.includes("cash")) rngCash += recv; else rngCard += recv;
                    }
                    let remarks = gV(t, ["remarks", "remarksreference"]) || '-';
                    let usr = gV(t, ["username", "loggedby"]) || '-';
                    
                    if (sell !== 0) cdSales.push({ d, amt: sell, rem: remarks, usr });
                    if (recv !== 0) cdPayments.push({ d, amt: recv, meth: method.includes("cash") ? "Cash" : "Card", rem: remarks, usr });
                }
            });
        }

        // 5. Lifetime totals from Master Sheet (getCol priority — avoids gV picking wrong columns)
        if (masterRec) {
            sheetSold = parseFloat(getCol(masterRec, ["Total Sell", "Sell Amount", "Gross Sell"])) || 0;
            sheetCash = parseFloat(getCol(masterRec, ["Cash Amt", "Cash Amount", "Cash"])) || 0;
            sheetCard = parseFloat(getCol(masterRec, ["Card Amt", "Card Amount", "Card"])) || 0;
            lifeDiscount = parseFloat(getCol(masterRec, ["Discount", "Discount Allowed"])) || 0;
            lifeSold = sheetSold;
            lifeCash = sheetCash;
            lifeCard = sheetCard;
            lifePaid = lifeCash + lifeCard;
            if (lifePaid === 0) {
                lifePaid = parseFloat(getCol(masterRec, ["Received Amount", "Total Received", "Received"])) || 0;
            }
        }
        // Fallback: derive from all transactions when master totals are unavailable
        if (!masterRec || (lifeSold === 0 && lifePaid === 0 && (tSold > 0 || tCash > 0 || tCard > 0))) {
            lifeSold = tSold + (masterRec ? Math.max(0, sheetSold - tSold) : 0);
            lifeCash = tCash + (masterRec ? Math.max(0, sheetCash - tCash) : 0);
            lifeCard = tCard + (masterRec ? Math.max(0, sheetCard - tCard) : 0);
            lifePaid = lifeCash + lifeCard;
            if (lifePaid === 0 && (tCash + tCard) > 0) lifePaid = tCash + tCard;
            if (lifeSold === 0 && tSold > 0) lifeSold = tSold;
        }

        // 6. Extract True Initial Invoice for Table Rows
        if (masterRec) {
            let initialSold = sheetSold - tSold;
            let initialCash = sheetCash - tCash;
            let initialCard = sheetCard - tCard;

            let dStr = getCol(masterRec, ["Creation Stamp", "Timestamp", "Date"]) || gV(masterRec, ["date", "creationstamp", "timestamp"]);
            let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);

            if (inRange) {
                if (hasDates) {
                    rngSold += initialSold;
                    rngCash += initialCash;
                    rngCard += initialCard;
                }
                let remarks = getCol(masterRec, ["Invoice", "Memo", "Invoice / Memo Number"]) || gV(masterRec, ["invoice", "memo", "invoicememonumber"]) || 'Initial Invoice';
                let usr = getCol(masterRec, ["Username", "Logged By", "Created By"]) || gV(masterRec, ["username", "loggedby", "createdby"]) || '-';

                if (Math.abs(initialSold) > 0.01) cdSales.push({ d, amt: initialSold, rem: "Inv: " + remarks, usr });
                if (Math.abs(initialCash) > 0.01) cdPayments.push({ d, amt: initialCash, meth: "Cash", rem: "Inv Deposit: " + remarks, usr });
                if (Math.abs(initialCard) > 0.01) cdPayments.push({ d, amt: initialCard, meth: "Card", rem: "Inv Deposit: " + remarks, usr });
            }
        }
        
        rngPaid = rngCash + rngCard;
        let lifeDue = lifeSold - lifePaid - lifeDiscount;

        // 6. Dynamic UI Rendering
        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalSold')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeSold.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifePaid.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDueBalance')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeSold')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngSold.toFixed(2)}</div></div>
                <div class="text-center border-l border-r px-8 border-blue-200"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaid')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngPaid.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-blue-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashIn')}</div><div class="text-sm font-bold text-emerald-500 font-mono mt-1">SAR ${rngCash.toFixed(2)}</div></div>
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCardIn')}</div><div class="text-sm font-bold text-purple-500 font-mono mt-1">SAR ${rngCard.toFixed(2)}</div></div>
             </div>
             ` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.salesBillingLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.soldAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdSales.length > 0 ? cdSales.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50">
                             <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold ${s.amt < 0 ? 'text-red-500' : 'text-blue-600'} whitespace-nowrap">${Number(s.amt).toFixed(2)}</td>
                             <td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td>
                             <td class="p-2.5">${s.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noSalesGenerated')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.paymentsReceivedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.paidAmt')}</th><th class="p-2.5 font-semibold">${t('report.colType')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdPayments.length > 0 ? cdPayments.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50">
                             <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold ${p.amt < 0 ? 'text-red-500' : 'text-emerald-600'} whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                             <td class="p-2.5 font-bold ${p.meth.toUpperCase() === 'CASH' ? 'text-emerald-600' : 'text-blue-600'}">${p.meth.toUpperCase() === 'CASH' ? t('option.cash') : p.meth.toUpperCase() === 'CARD' ? t('option.card') : p.meth}</td>
                             <td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td>
                             <td class="p-2.5">${p.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noPaymentsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 1. EXPENSE DETAILS REPORT (LIFETIME + RANGE ARCHITECTURE)
      // ====================================================================
      case 'expense_details': {
        titleEl.textContent = t('report.titleExpenseStatement');
        
        let cdIncurred = []; let cdPayments = [];
        let lifeInc = 0, lifePaid = 0;
        let rngInc = 0, rngPaid = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // Matches the secondary dropdown selection (The specific Expense Head)
        const isExpHead = (obj) => cln(gV(obj, ["expensehead", "head", "category", "expensename", "name"])) === cln(secVal);

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rExp.success) {
            rExp.records.filter(isExpHead).forEach(r => {
                const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
                let inc = 0; let paid = 0;

                if (isDualTxnPrevDue(r, EXPENSE_TXN_FIELDS)) {
                    inc = Math.max(amounts.bill, amounts.pay);
                    paid = 0;
                } else {
                    inc = amounts.bill;
                    paid = amounts.pay;
                }

                lifeInc += inc;
                lifePaid += paid;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngInc += inc; rngPaid += paid; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    
                    if (inc > 0) cdIncurred.push({ d, amt: inc, rem: remarks, usr });
                    if (paid > 0) cdPayments.push({ d, amt: paid, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeInc - lifePaid;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalIncurred')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeInc.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifePaid.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeIncurred')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngInc.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaid')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngPaid.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.incurredExpenseLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colIncurredAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdIncurred.length > 0 ? cdIncurred.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noExpensesIncurred')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.paymentsMadeLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.paidAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdPayments.length > 0 ? cdPayments.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPaymentsMade')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2. CREDITOR DETAILS REPORT (WITH PREVIOUS DUE INTERCEPTOR)
      // ====================================================================
      case 'creditor_details': {
        titleEl.textContent = t('report.titleCreditorStatement');
        
        let cdReceived = []; let cdReturned = [];
        let lifeRecv = 0, lifeRet = 0;
        let rngRecv = 0, rngRet = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // Matches the specific Creditor Head
        const isCrd = (obj) => cln(gV(obj, ["creditorname", "creditorhead", "head", "name", "creditor"])) === cln(secVal);

        const recvCols = ["receivedamount", "receivedamt", "received", "amountreceived"];
        const retCols = ["returnamount", "returnamt", "amount", "returned", "paid", "amountpaid"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rCrdT.success) {
            rCrdT.records.filter(isCrd).forEach(r => {
                let rawRecv = Math.abs(parseFloat(gV(r, recvCols))); if(isNaN(rawRecv)) rawRecv = 0;
                let rawRet = Math.abs(parseFloat(gV(r, retCols))); if(isNaN(rawRet)) rawRet = 0;

                let cat = String(gV(r, ["category", "subhead", "method", "type", "remarks", "details"])).trim().toUpperCase();
                
                let recv = 0; let ret = 0; let typeLabel = "Received";

                // INTERCEPTOR FLIPPER: Catch Previous Due and force it to the Due Increasing side!
                if (cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
                    recv = Math.max(rawRecv, rawRet); // Grabs the money no matter which box it was typed into
                    ret = 0;
                    typeLabel = "Previous Due";
                } else {
                    recv = rawRecv;
                    ret = rawRet;
                    typeLabel = "Received";
                }

                lifeRecv += recv;
                lifeRet += ret;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngRecv += recv; rngRet += ret; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    let method = gV(r, ["paymentmethod", "method", "type"]) || 'Cash';
                    
                    if (recv > 0) cdReceived.push({ d, amt: recv, meth: method, rem: remarks, usr, type: typeLabel });
                    if (ret > 0) cdReturned.push({ d, amt: ret, meth: method, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeRecv - lifeRet;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceivedLoaned')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeRecv.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReturnedPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeRet.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceived')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngRecv.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReturned')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngRet.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.fundsReceivedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReceivedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReceived.length > 0 ? cdReceived.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50">
                              <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                              <td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                                 ${Number(s.amt).toFixed(2)}
                                 ${s.type === 'Previous Due' ? `<br><span class="text-[9px] text-gray-400 font-normal leading-none bg-gray-100 px-1 rounded border border-gray-200">${t('report.previousDue')}</span>` : ''}
                              </td>
                              <td class="p-2.5 font-bold text-gray-600">${s.meth}</td>
                              <td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td>
                              <td class="p-2.5">${s.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.fundsReturnedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReturnedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReturned.length > 0 ? cdReturned.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50">
                              <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                              <td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                              <td class="p-2.5 font-bold text-gray-600">${p.meth}</td>
                              <td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td>
                              <td class="p-2.5">${p.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReturned')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ----------------------------------------------------
      // REDESIGNED SUPPLIER STATEMENT VIEW (WITH PREVIOUS DUE INTERCEPTOR)
      // ----------------------------------------------------
      case 'supplier_details': {
        titleEl.textContent = t('report.titleSupplierStatement');
        
        let allSupTxns = rSupT.success ? rSupT.records.filter(r => getCol(r, ["Supplier Name"]) === secVal) : [];
        
        const lifetimeTotals = rollupSupplierTxnTotals(allSupTxns);
        let globalPur = lifetimeTotals.bill;
        let globalPay = lifetimeTotals.pay;
        let globalDue = lifetimeTotals.due;

        // 2. Filtered Range Transactions
        let sdPurchases = [];
        let sdPayments = [];
        let sdRangePur = 0;
        let sdRangePay = 0;

        let sdFilteredTxns = filterByDate(allSupTxns, ["Date"]);

        sdFilteredTxns.forEach(r => {
           const p = parseSupplierTxnAmounts(r);
           const category = getSupplierTxnCategory(r);
           let d = getCol(r, ["Date"]);
           let rem = String(getCol(r, ["Remarks / Reference", "Remarks", "Reference Info"]) || '-');
           let usr = getCol(r, ["Username", "Logged By"]) || '';

           if (p.bill > 0) {
              sdRangePur += p.bill;
              const displayType = category === "Previous Due" ? "Previous Due" : "Purchase";
              sdPurchases.push({ d, amt: p.bill, rem, usr, type: displayType });
           }
           if (p.pay > 0) {
              sdRangePay += p.pay;
              sdPayments.push({ d, amt: p.pay, rem, usr });
           }
        });

        // Custom Layout: Summary Block at the top
        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
             
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPurchaseDue')}</div>
                  <div class="text-2xl font-black text-red-600 font-mono mt-1">SAR ${globalPur.toFixed(2)}</div>
                </div>
                <div class="text-center">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimePaymentsMade')}</div>
                  <div class="text-2xl font-black text-emerald-600 font-mono mt-1">SAR ${globalPay.toFixed(2)}</div>
                </div>
                <div class="text-right">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentDueBalance')}</div>
                  <div class="text-2xl font-black text-orange-600 font-mono mt-1">SAR ${globalDue.toFixed(2)}</div>
                </div>
             </div>

             <div class="flex justify-around bg-gray-50 p-4 rounded-lg">
                <div class="text-center">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePurchasesTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })}</div>
                   <div class="text-lg font-bold text-red-500 font-mono mt-1">SAR ${sdRangePur.toFixed(2)}</div>
                </div>
                <div class="text-center">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaymentsTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })}</div>
                   <div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${sdRangePay.toFixed(2)}</div>
                </div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        // Custom Layout: Replace the standard table wrapper with the 2-Column Grid
        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-red-50 text-red-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">${t('report.purchasesLedgerDueInc')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('report.purchaseDate')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${sdPurchases.length > 0 ? sdPurchases.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50">
                             <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold text-red-600 whitespace-nowrap">
                                ${Number(s.amt).toFixed(2)}<br><span class="text-[9px] text-gray-400 font-normal leading-none">${s.type === 'Previous Due' ? t('report.previousDue') : t('report.purchaseType')}</span>
                             </td>
                             <td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td>
                             <td class="p-2.5">${s.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPurchasesInRange')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>

             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.paymentsLedgerDueDec')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('report.paymentDate')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${sdPayments.length > 0 ? sdPayments.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50">
                             <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                             <td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td>
                             <td class="p-2.5">${p.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPaymentsInRange')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // REDESIGNED USER SELLS PERFORMANCE REPORT (BUG FIXED)
      // ====================================================================
      case 'user_transaction': {
        titleEl.textContent = t('report.titleUserPerformance');

        let pLifeSold = 0, pLifeRecv = 0, pLifeCash = 0, pLifeCard = 0;
        let monthlyData = {};

        const initMonth = (d) => { 
           const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
           let sKey = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,'0'); 
           if(!monthlyData[sKey]) monthlyData[sKey] = { label: months[d.getMonth()] + " " + d.getFullYear(), sold: 0, recv: 0 };
           return sKey;
        };

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };
        const isU = (obj) => cln(gV(obj, ["username", "loggedby", "createdby", "user", "transferredby"])) === cln(secVal);

        const sellCols = ["soldamount", "soldamt", "totalsell", "sellamount", "grosssell", "sell"];
        const recvCols = ["receivedamount", "receivedamt", "received", "cashreceived", "cashamt", "cashamount", "paidamount", "paidamt", "amountpaid"];
        const methCols = ["paymentmethod", "method", "paymenttype", "type"];

        // FAST ADMIN CHECK: Uses the already-loaded Users database
        let isSecValAdmin = false;
        if (typeof rUsr !== 'undefined' && rUsr.success) {
            let uMatch = rUsr.records.find(u => cln(gV(u, ["username"])) === cln(secVal));
            if (uMatch && cln(gV(uMatch, ["role"])).includes("admin")) isSecValAdmin = true;
        }

        let txnTotals = {};
        if (rCustT.success) {
           rCustT.records.forEach(t => {
              let uid = cln(gV(t, ["systemuniqueid", "sysuid", "uniqueid"]));
              if(!uid) return;
              if(!txnTotals[uid]) txnTotals[uid] = { sold: 0, cash: 0, card: 0 };
              txnTotals[uid].sold += gF(t, sellCols);
              let recv = gF(t, recvCols);
              let method = cln(gV(t, methCols));
              if (method === "") method = "cash"; 
              if (method.includes("cash")) txnTotals[uid].cash += recv; else txnTotals[uid].card += recv;
           });
        }

        if (rCust.success) {
           rCust.records.forEach(r => {
              if (isU(r)) {
                 let uid = cln(gV(r, ["systemuniqueid", "sysuid", "uniqueid"]));
                 let d = new Date(gV(r, ["date", "creationstamp", "timestamp"]) || new Date());
                 let mKey = initMonth(d);

                 let trueSold = gF(r, sellCols) - (txnTotals[uid] ? txnTotals[uid].sold : 0);
                 let trueCash = gF(r, ["cashamt", "cashamount", "cash"]) - (txnTotals[uid] ? txnTotals[uid].cash : 0);
                 let trueCard = gF(r, ["cardamt", "cardamount", "card"]) - (txnTotals[uid] ? txnTotals[uid].card : 0);
                 let trueRecv = trueCash + trueCard;

                 pLifeSold += trueSold; pLifeRecv += trueRecv; pLifeCash += trueCash; pLifeCard += trueCard;
                 monthlyData[mKey].sold += trueSold; monthlyData[mKey].recv += trueRecv;
              }
           });
        }

        if (rCustT.success) {
           rCustT.records.forEach(r => {
              if (isU(r)) {
                 let d = new Date(gV(r, ["date", "timestamp"]) || new Date());
                 let mKey = initMonth(d);

                 let tSell = gF(r, sellCols);
                 let recv = gF(r, recvCols);
                 let method = cln(gV(r, methCols));
                 if (method === "") method = "cash";
                 
                 pLifeSold += tSell; pLifeRecv += recv;
                 if (method.includes("cash")) pLifeCash += recv; else pLifeCard += recv;
                 
                 monthlyData[mKey].sold += tSell; monthlyData[mKey].recv += recv;
              }
           });
        }

        let pLifeDue = pLifeSold - pLifeRecv;

        // WALLET LOGIC
        let uCashIn = pLifeCash; 
        let uCashOut = 0;
        
        if (isSecValAdmin) {
            // VIP Admin Rule
            if(rInt.success) rInt.records.forEach(r=> { if(isU(r)) uCashOut += Math.abs(gF(r, ["transferamount", "amount"])); });
        } else {
            // Standard User Rule (TYPO FIXED: rCrdT instead of rCred)
            if(rInt.success) rInt.records.forEach(r=> { if(isU(r)) uCashOut += Math.abs(gF(r, ["transferamount", "amount"])); });
            if(rCrdT.success) rCrdT.records.forEach(r=> { if(isU(r)) uCashOut += Math.abs(gF(r, ["returnamount", "returnamt", "amount"])); });
            if(rHrT.success) rHrT.records.forEach(r=> { if(isU(r) && cln(gV(r,["category"])).includes("paid")) uCashOut += Math.abs(gF(r, ["amount"])); });
            if(rSupT.success) rSupT.records.forEach(r=> { if(isU(r)) { const p = parseSupplierTxnAmounts(r); if (p.pay > 0) uCashOut += p.pay; } });
            if(rExp.success) rExp.records.forEach(r=> { 
               if(isU(r)) {
                  const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
                  if (amounts.pay > 0) uCashOut += amounts.pay;
               }
            });
        }
        
        let pLiveDrawer = uCashIn - uCashOut;
        let drawerColor = pLiveDrawer >= 0 ? "text-emerald-600" : "text-red-600";

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-4 md:p-6 rounded-xl shadow-sm mb-2 gap-4 md:gap-6">
             <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 border-gray-100">
                <div class="text-left"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeSoldAmount')}</div><div class="text-lg md:text-2xl font-black text-blue-600 font-mono mt-1 break-all">SAR ${pLifeSold.toFixed(2)}</div></div>
                <div class="text-left xl:border-l xl:pl-4 xl:border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceived')}</div><div class="text-lg md:text-2xl font-black text-emerald-600 font-mono mt-1 break-all">SAR ${pLifeRecv.toFixed(2)}</div><div class="text-[10px] font-bold text-gray-500 mt-2">${t('report.cashLabel')} <span class="text-emerald-500 text-sm ml-1">${pLifeCash.toFixed(2)}</span></div><div class="text-[10px] font-bold text-gray-500 mt-1">${t('report.cardLabel')} <span class="text-purple-500 text-sm ml-1">${pLifeCard.toFixed(2)}</span></div></div>
                <div class="text-left xl:border-l xl:pl-4 xl:border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDueSlashBalance')}</div><div class="text-lg md:text-2xl font-black text-red-600 font-mono mt-1 break-all">SAR ${pLifeDue.toFixed(2)}</div></div>
                <div class="text-left xl:border-l xl:pl-4 xl:border-gray-100 bg-gray-50 rounded-xl p-3 shadow-inner"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentLiveCashDrawer')}</div><div class="text-xl md:text-3xl font-black ${drawerColor} font-mono mt-2 break-all">SAR ${pLiveDrawer.toFixed(2)}</div><div class="text-[9px] text-gray-400 mt-1 uppercase leading-tight">(${isSecValAdmin ? t('report.drawerHintAdmin') : t('report.drawerHintUser')})</div></div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-slate-800 text-white font-bold p-2.5 md:p-3 uppercase tracking-wide text-[10px] md:text-xs border-b border-slate-900 text-center">${t('report.monthWisePerformance')}</div>
                <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
                  <table class="erp-report-table w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-3 font-semibold">${t('report.colMonthYear')}</th><th class="p-3 font-semibold text-right">${t('report.soldAmount')}</th><th class="p-3 font-semibold text-right">${t('report.receivedAmount')}</th><th class="p-3 font-semibold text-right">${t('report.colDueBalanceGen')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${Object.keys(monthlyData).length > 0 ? Object.keys(monthlyData).sort().reverse().map(m => {
                           let d = monthlyData[m]; let monthDue = d.sold - d.recv;
                           return `<tr class="hover:bg-gray-50"><td class="p-3 font-bold text-gray-800 uppercase tracking-wider">${d.label}</td><td class="p-3 text-right font-mono font-bold text-blue-600">SAR ${d.sold.toFixed(2)}</td><td class="p-3 text-right font-mono font-bold text-emerald-600">SAR ${d.recv.toFixed(2)}</td><td class="p-3 text-right font-mono font-bold ${monthDue > 0 ? 'text-red-600' : 'text-emerald-600'}">SAR ${monthDue.toFixed(2)}</td></tr>`;
                        }).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noSalesPerformanceData')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
        `;
        break;
      }

      // ====================================================================
      // 2. INDIVIDUAL USER AUDIT VIEW
      // ====================================================================
      case 'individual_user': {
        titleEl.textContent = t('report.titleIndividualUser');
        
        let uLifeSold = 0, uLifeCardIn = 0, uLifeCashIn = 0, uLifeCashOut = 0, uLifeTransfer = 0;
        let uRangeSold = 0, uRangeCardIn = 0, uRangeCashIn = 0, uRangeCashOut = 0, uRangeTransfer = 0;
        let leftTable = []; let rightTable = []; 

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };
        const iU = (obj) => cln(gV(obj, ["username", "loggedby", "createdby", "user", "transferredby"])) === cln(secVal);

        if (rCust.success) rCust.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date", "creationstamp", "timestamp"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let sell = gF(r, ["totalsell", "sellamount", "grosssell"]);
              uLifeSold += sell; if (inRange) uRangeSold += sell;
           }
        });

        if (rCustT.success) rCustT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let tSell = gF(r, ["soldamount", "soldamt"]);
              uLifeSold += tSell; if (inRange) uRangeSold += tSell;

              let recv = gF(r, ["receivedamount", "receivedamt", "cashreceived"]);
              let method = cln(gV(r, ["paymentmethod", "method"]));
              
              if (method.includes("cash")) uLifeCashIn += recv; else uLifeCardIn += recv;
              if (inRange && recv !== 0) {
                 if (method.includes("cash")) uRangeCashIn += recv; else uRangeCardIn += recv;
                 leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: gV(r, ["systemuniqueid", "sysuid"])||'Customer', usr: secVal });
              }
           }
        });

        if (rIncT.success) rIncT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let recv = gF(r, ["receivedamount", "receivedamt"]);
              uLifeCashIn += recv;
              if(inRange && recv !== 0) { uRangeCashIn += recv; leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: 'Income Log', usr: secVal }); }
           }
        });

        if (rCrdT.success) rCrdT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let recv = gF(r, ["receivedamount", "receivedamt"]);
              let ret = Math.abs(gF(r, ["returnamount", "returnamt"])); 
              
              uLifeCashIn += recv; uLifeCashOut += ret;
              if(inRange && recv !== 0) { uRangeCashIn += recv; leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: 'Creditor Loan', usr: secVal }); }
              if(inRange && ret !== 0) { uRangeCashOut += ret; rightTable.push({ d, amt: ret, rem: getRemarks(r), cat: 'Creditor Return', usr: secVal }); }
           }
        });

        if (rExp.success) rExp.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["paidamt", "paidamount", "amount", "deposit"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'Expense Txn', usr: secVal }); }
           }
        });

        if (rHrT.success) rHrT.records.forEach(r => {
           if (iU(r) && cln(gV(r, ["category"])).includes("paid")) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["amount"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'HR Salary Txn', usr: secVal }); }
           }
        });

        if (rSupT.success) rSupT.records.forEach(r => {
           if (iU(r) && cln(gV(r, ["category"])).includes("paid")) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["amount"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'Supplier Payment', usr: secVal }); }
           }
        });

        if (rInt.success) rInt.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let amt = Math.abs(gF(r, ["transferamount", "amount"]));
              uLifeCashOut += amt; uLifeTransfer += amt;
              if(inRange && amt !== 0) { uRangeCashOut += amt; uRangeTransfer += amt; rightTable.push({ d, amt, rem: getRemarks(r), cat: 'Internal Transfer', usr: secVal }); }
           }
        });

        let uLiveCashBalance = uLifeCashIn - uLifeCashOut;
        let uBColor = uLiveCashBalance >= 0 ? "text-emerald-600" : "text-red-600";

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left w-1/4"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeSold')}</div><div class="text-2xl font-black text-blue-600 font-mono mt-1">SAR ${uLifeSold.toFixed(2)}</div></div>
                <div class="text-left w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCollections')}</div><div class="text-[10px] font-bold text-gray-500 mt-2">${t('report.cashInLabel')} <span class="text-emerald-500 text-sm ml-1">${uLifeCashIn.toFixed(2)}</span></div><div class="text-[10px] font-bold text-gray-500 mt-1">${t('report.cardInLabel')} <span class="text-purple-500 text-sm ml-1">${uLifeCardIn.toFixed(2)}</span></div></div>
                <div class="text-left w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.transferredToAdmin')}</div><div class="text-2xl font-black text-teal-600 font-mono mt-1">SAR ${uLifeTransfer.toFixed(2)}</div></div>
                <div class="text-right w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentUserCashBalance')}</div><div class="text-3xl font-black ${uBColor} font-mono mt-1">SAR ${uLiveCashBalance.toFixed(2)}</div><div class="text-[9px] text-gray-400 mt-1 uppercase leading-tight">${t('report.autoAdjustHint')}</div></div>
             </div>
             <div class="flex justify-around bg-gray-50 p-4 rounded-lg">
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeSold')}</div><div class="text-lg font-bold text-blue-500 font-mono mt-1">SAR ${uRangeSold.toFixed(2)}</div></div>
                <div class="text-center border-l border-r px-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashIn')}</div><div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${uRangeCashIn.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCardIn')}</div><div class="text-lg font-bold text-purple-500 font-mono mt-1">SAR ${uRangeCardIn.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeOutSpent')}</div><div class="text-lg font-bold text-red-500 font-mono mt-1">SAR ${uRangeCashOut.toFixed(2)}</div></div>
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeTransferredAdmin')}</div><div class="text-lg font-bold text-teal-500 font-mono mt-1">SAR ${uRangeTransfer.toFixed(2)}</div></div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.userCollectionsLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colCategoryUid')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${leftTable.length > 0 ? leftTable.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5 font-mono text-[10px] text-gray-500">${s.cat}</td><td class="p-2.5">${s.usr}</td></tr>`).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noCollectionsInRange')}</td></tr>`}
                     </tbody>
                  </table></div></div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-red-50 text-red-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">${t('report.userExpendituresLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colCategory')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${rightTable.length > 0 ? rightTable.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-red-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5 font-bold text-[10px] ${p.cat === 'Internal Transfer' ? 'text-teal-600' : 'text-gray-700'}">${p.cat}</td><td class="p-2.5">${p.usr}</td></tr>`).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noSpendsTransfers')}</td></tr>`}
                     </tbody>
                  </table></div></div>
          </div>
        `;
        break;
      }

      // ----------------------------------------------------
      // REDESIGNED HR STATEMENT VIEW (WITH PREVIOUS DUE INTERCEPTOR)
      // ----------------------------------------------------
      case 'hr_details': {
        titleEl.textContent = t('report.titleHrPayroll');
        
        let allHrTxns = rHrT.success ? rHrT.records.filter(r => getCol(r, ["Employee Name"]) === secVal) : [];
        
        // 1. Bulletproof Global Totals
        let globalEarn = 0; let globalPaid = 0;
        allHrTxns.forEach(r => {
            let cat = String(getCol(r, ["Category"])).trim().toUpperCase();
            let amt = parseFloat(getCol(r, ["Amount"])) || 0;
            if (cat.includes("EARN") || cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
                globalEarn += amt;
            } else if (cat.includes("PAID")) {
                globalPaid += amt;
            }
        });
        let globalDueHr = globalEarn - globalPaid;

        // 2. Filtered Range Transactions
        let hrEarns = [];
        let hrPayments = [];
        let hrRangeEarn = 0;
        let hrRangePaid = 0;

        let hrFilteredTxns = filterByDate(allHrTxns, ["Date"]);

        hrFilteredTxns.forEach(r => {
           let cat = String(getCol(r, ["Category"])).trim().toUpperCase();
           let amt = parseFloat(getCol(r, ["Amount"])) || 0;
           let d = getCol(r, ["Date"]);
           let rem = getCol(r, ["Remarks"]) || '-';
           let usr = getCol(r, ["Username", "Logged By"]) || '';

           if (cat.includes("EARN") || cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
              hrRangeEarn += amt;
              hrEarns.push({ d, amt, rem, usr, type: getCol(r, ["Category"]) });
           } else if (cat.includes("PAID")) {
              hrRangePaid += amt;
              hrPayments.push({ d, amt, rem, usr });
           }
        });

        // Custom Layout: Summary Block at the top
        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
             
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalEarnedDue')}</div>
                  <div class="text-2xl font-black text-blue-600 font-mono mt-1">SAR ${globalEarn.toFixed(2)}</div>
                </div>
                <div class="text-center">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeSalaryPaid')}</div>
                  <div class="text-2xl font-black text-emerald-600 font-mono mt-1">SAR ${globalPaid.toFixed(2)}</div>
                </div>
                <div class="text-right">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentDueBalance')}</div>
                  <div class="text-2xl font-black ${(globalDueHr > 0) ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${globalDueHr.toFixed(2)}</div>
                </div>
             </div>

             <div class="flex justify-around bg-gray-50 p-4 rounded-lg">
                <div class="text-center">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeEarnedTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })}</div>
                   <div class="text-lg font-bold text-blue-500 font-mono mt-1">SAR ${hrRangeEarn.toFixed(2)}</div>
                </div>
                <div class="text-center">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaidTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })}</div>
                   <div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${hrRangePaid.toFixed(2)}</div>
                </div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        // Custom Layout: Replace the standard table wrapper with the 2-Column Grid
        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.salaryEarnedLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('report.earnedDate')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${hrEarns.length > 0 ? hrEarns.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50">
                             <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                                ${Number(s.amt).toFixed(2)}<br><span class="text-[9px] text-gray-400 font-normal leading-none">${getCategoryLabel(s.type, t)}</span>
                             </td>
                             <td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td>
                             <td class="p-2.5">${s.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noEarningsInRange')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>

             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.salaryPaidLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('report.paymentDate')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${hrPayments.length > 0 ? hrPayments.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50">
                             <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                             <td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td>
                             <td class="p-2.5">${p.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPaymentsInRange')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2. INDIVIDUAL USER AUDIT VIEW
      // ====================================================================
      case 'individual_user': {
        titleEl.textContent = t('report.titleIndividualUser');
        
        let uLifeSold = 0, uLifeCardIn = 0, uLifeCashIn = 0, uLifeCashOut = 0, uLifeTransfer = 0;
        let uRangeSold = 0, uRangeCardIn = 0, uRangeCashIn = 0, uRangeCashOut = 0, uRangeTransfer = 0;
        let leftTable = []; let rightTable = []; 

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };
        const iU = (obj) => cln(gV(obj, ["username", "loggedby", "createdby", "user", "transferredby"])) === cln(secVal);

        if (rCust.success) rCust.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date", "creationstamp", "timestamp"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let sell = gF(r, ["totalsell", "sellamount", "grosssell"]);
              uLifeSold += sell; if (inRange) uRangeSold += sell;
           }
        });

        if (rCustT.success) rCustT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let tSell = gF(r, ["soldamount", "soldamt"]);
              uLifeSold += tSell; if (inRange) uRangeSold += tSell;

              let recv = gF(r, ["receivedamount", "receivedamt", "cashreceived"]);
              let method = cln(gV(r, ["paymentmethod", "method"]));
              
              if (method.includes("cash")) uLifeCashIn += recv; else uLifeCardIn += recv;
              if (inRange && recv !== 0) {
                 if (method.includes("cash")) uRangeCashIn += recv; else uRangeCardIn += recv;
                 leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: gV(r, ["systemuniqueid", "sysuid"])||'Customer', usr: secVal });
              }
           }
        });

        if (rIncT.success) rIncT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let recv = gF(r, ["receivedamount", "receivedamt"]);
              uLifeCashIn += recv;
              if(inRange && recv !== 0) { uRangeCashIn += recv; leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: 'Income Log', usr: secVal }); }
           }
        });

        if (rCrdT.success) rCrdT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let recv = gF(r, ["receivedamount", "receivedamt"]);
              let ret = Math.abs(gF(r, ["returnamount", "returnamt"])); 
              
              uLifeCashIn += recv; uLifeCashOut += ret;
              if(inRange && recv !== 0) { uRangeCashIn += recv; leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: 'Creditor Loan', usr: secVal }); }
              if(inRange && ret !== 0) { uRangeCashOut += ret; rightTable.push({ d, amt: ret, rem: getRemarks(r), cat: 'Creditor Return', usr: secVal }); }
           }
        });

        if (rExp.success) rExp.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["paidamt", "paidamount", "amount", "deposit"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'Expense Txn', usr: secVal }); }
           }
        });

        if (rHrT.success) rHrT.records.forEach(r => {
           if (iU(r) && cln(gV(r, ["category"])).includes("paid")) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["amount"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'HR Salary Txn', usr: secVal }); }
           }
        });

        if (rSupT.success) rSupT.records.forEach(r => {
           if (iU(r) && cln(gV(r, ["category"])).includes("paid")) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["amount"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'Supplier Payment', usr: secVal }); }
           }
        });

        if (rInt.success) rInt.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let amt = Math.abs(gF(r, ["transferamount", "amount"]));
              uLifeCashOut += amt; uLifeTransfer += amt;
              if(inRange && amt !== 0) { uRangeCashOut += amt; uRangeTransfer += amt; rightTable.push({ d, amt, rem: getRemarks(r), cat: 'Internal Transfer', usr: secVal }); }
           }
        });

        let uLiveCashBalance = uLifeCashIn - uLifeCashOut;
        let uBColor = uLiveCashBalance >= 0 ? "text-emerald-600" : "text-red-600";

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left w-1/4"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeSold')}</div><div class="text-2xl font-black text-blue-600 font-mono mt-1">SAR ${uLifeSold.toFixed(2)}</div></div>
                <div class="text-left w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCollections')}</div><div class="text-[10px] font-bold text-gray-500 mt-2">${t('report.cashInLabel')} <span class="text-emerald-500 text-sm ml-1">${uLifeCashIn.toFixed(2)}</span></div><div class="text-[10px] font-bold text-gray-500 mt-1">${t('report.cardInLabel')} <span class="text-purple-500 text-sm ml-1">${uLifeCardIn.toFixed(2)}</span></div></div>
                <div class="text-left w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.transferredToAdmin')}</div><div class="text-2xl font-black text-teal-600 font-mono mt-1">SAR ${uLifeTransfer.toFixed(2)}</div></div>
                <div class="text-right w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentUserCashBalance')}</div><div class="text-3xl font-black ${uBColor} font-mono mt-1">SAR ${uLiveCashBalance.toFixed(2)}</div><div class="text-[9px] text-gray-400 mt-1 uppercase leading-tight">${t('report.autoAdjustHint')}</div></div>
             </div>
             <div class="flex justify-around bg-gray-50 p-4 rounded-lg">
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeSold')}</div><div class="text-lg font-bold text-blue-500 font-mono mt-1">SAR ${uRangeSold.toFixed(2)}</div></div>
                <div class="text-center border-l border-r px-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashIn')}</div><div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${uRangeCashIn.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCardIn')}</div><div class="text-lg font-bold text-purple-500 font-mono mt-1">SAR ${uRangeCardIn.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeOutSpent')}</div><div class="text-lg font-bold text-red-500 font-mono mt-1">SAR ${uRangeCashOut.toFixed(2)}</div></div>
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeTransferredAdmin')}</div><div class="text-lg font-bold text-teal-500 font-mono mt-1">SAR ${uRangeTransfer.toFixed(2)}</div></div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.userCollectionsLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colCategoryUid')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${leftTable.length > 0 ? leftTable.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5 font-mono text-[10px] text-gray-500">${s.cat}</td><td class="p-2.5">${s.usr}</td></tr>`).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noCollectionsInRange')}</td></tr>`}
                     </tbody>
                  </table></div></div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-red-50 text-red-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">${t('report.userExpendituresLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colCategory')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${rightTable.length > 0 ? rightTable.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-red-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5 font-bold text-[10px] ${p.cat === 'Internal Transfer' ? 'text-teal-600' : 'text-gray-700'}">${p.cat}</td><td class="p-2.5">${p.usr}</td></tr>`).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noSpendsTransfers')}</td></tr>`}
                     </tbody>
                  </table></div></div>
          </div>
        `;
        break;
      }

      // ----------------------------------------------------
      case 'expense_report': {
        titleEl.textContent = t('report.titleExpenseReport');
        tgtEl.textContent = t('report.allExpenseHeadsTarget');

        const txns = rExp.success && Array.isArray(rExp.records) ? rExp.records : [];
        const heads = rExpHeads.success && Array.isArray(rExpHeads.records) ? rExpHeads.records : [];

        const lifeTotals = accumulateExpenseTxnAmounts(txns, null, null, null, null);
        const rngTotals = accumulateExpenseTxnAmounts(txns, null, null, fDate, tDate);

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">${t('report.lifetimeSummary')}</div>
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left w-full sm:w-1/3 mb-3 sm:mb-0">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalIncurredDeposit')}</div>
                   <div class="text-2xl md:text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeTotals.inc.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-center w-full sm:w-1/3 mb-3 sm:mb-0 sm:border-l sm:border-gray-100 sm:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPaid')}</div>
                   <div class="text-2xl md:text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeTotals.paid.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-right w-full sm:w-1/3 sm:border-l sm:border-gray-100 sm:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.colBalance')}</div>
                   <div class="text-2xl md:text-3xl font-black ${lifeTotals.due > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeTotals.due.toFixed(2)}</div>
                </div>
             </div>
             <div class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 pt-1">${t('report.selectedDateRangeSummary')}</div>
             <div class="flex flex-wrap justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center px-2"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeIncurred')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngTotals.inc.toFixed(2)}</div></div>
                <div class="text-center px-2 border-l border-blue-200"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaid')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngTotals.paid.toFixed(2)}</div></div>
                <div class="text-center px-2 border-l border-blue-200"><div class="text-red-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeDue')}</div><div class="text-lg font-bold ${rngTotals.due > 0 ? 'text-red-700' : 'text-emerald-700'} font-mono mt-1">SAR ${rngTotals.due.toFixed(2)}</div></div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        const listRows = heads.map((rec) => {
          const mainHead = getCol(rec, ["Expense Parent Head", "Parent Head", "Main Head", "Parent Category"]) || '';
          const subHead = getCol(rec, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';
          const totals = accumulateExpenseTxnAmounts(
            txns,
            mainHead.trim().toUpperCase(),
            subHead.trim().toUpperCase(),
            fDate,
            tDate
          );
          return { mainHead, subHead, ...totals };
        }).filter((row) => row.inc > 0 || row.paid > 0).sort((a, b) => {
          const cmp = String(a.mainHead).localeCompare(String(b.mainHead));
          return cmp !== 0 ? cmp : String(a.subHead).localeCompare(String(b.subHead));
        });

        tableContainer.innerHTML = `
          <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div class="bg-slate-800 text-white font-bold p-3 uppercase tracking-wider text-xs text-center">${t('report.expenseHeadSummary')}</div>
            <div class="erp-report-scroll overflow-x-auto">
              <table class="erp-report-table w-full text-left border-collapse text-xs">
                <thead class="bg-gray-100 text-gray-600 uppercase border-b whitespace-nowrap">
                  <tr>
                    <th class="p-2.5 w-12 text-center">${t('report.colSl')}</th>
                    <th class="p-2.5">${t('report.colParentHead')}</th>
                    <th class="p-2.5">${t('report.colSubHead')}</th>
                    <th class="p-2.5 text-right">${t('report.colTotalIncurred')}</th>
                    <th class="p-2.5 text-right">${t('report.colTotalPaid')}</th>
                    <th class="p-2.5 text-right">${t('report.colBalance')}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-gray-700">
                  ${listRows.length > 0 ? listRows.map((row, i) => `
                    <tr class="hover:bg-gray-50">
                      <td class="p-2.5 text-center text-gray-400 font-mono">${i + 1}</td>
                      <td class="p-2.5 font-bold text-gray-900">${row.mainHead || '-'}</td>
                      <td class="p-2.5 text-blue-600 font-medium">${row.subHead || '-'}</td>
                      <td class="p-2.5 text-right font-mono font-bold text-blue-600">${row.inc.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono font-bold text-emerald-600">${row.paid.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono font-bold ${row.due > 0 ? 'text-red-600' : 'text-emerald-600'}">${row.due.toFixed(2)}</td>
                    </tr>
                  `).join('') : `<tr><td colspan="6" class="p-6 text-center text-gray-400 font-bold">${heads.length > 0 ? t('report.noExpenseActivity') : t('report.noExpenseHeadsConfigured')}</td></tr>`}
                </tbody>
                ${listRows.length > 0 ? `
                <tfoot class="bg-gray-50 border-t-2 border-gray-200 font-bold">
                  <tr>
                    <td class="p-2.5 text-right uppercase text-[10px] text-gray-500" colspan="3">${t('report.grandTotalRange')}</td>
                    <td class="p-2.5 text-right font-mono text-blue-700">${rngTotals.inc.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-emerald-700">${rngTotals.paid.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono ${rngTotals.due > 0 ? 'text-red-700' : 'text-emerald-700'}">${rngTotals.due.toFixed(2)}</td>
                  </tr>
                </tfoot>` : ''}
              </table>
            </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // CUSTOMER DUE / BALANCE REPORT (BY USER, OUTSTANDING INVOICES ONLY)
      // ====================================================================
      case 'customer_due_balance': {
        titleEl.textContent = t('report.titleCustomerDueBalance');
        tgtEl.textContent = secText && secVal ? t('report.targetUserSales', { name: secText }) : '';

        const clnUser = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const isUserMatch = (rec) => clnUser(getCol(rec, ["Username", "Logged By", "Created By"])) === clnUser(secVal);

        const rows = [];
        if (rCust.success && Array.isArray(rCust.records)) {
          rCust.records.filter(isUserMatch).forEach((rec) => {
            const uid = getCol(rec, ["System Unique ID", "Sys UID", "UNIQUEID"]) || '-';
            const name = getCol(rec, ["Customer Name", "Name"]) || '-';
            const memo = getCol(rec, ["Invoice", "Memo", "Invoice / Memo Number"]) || '-';
            const user = getCol(rec, ["Username", "Logged By", "Created By"]) || secText || '-';
            const dateStr = getCol(rec, ["Creation Stamp", "Timestamp", "Date"]);
            const d = dateStr ? new Date(dateStr) : new Date();

            if (useDateFilter && (d < fDate || d > tDate)) return;

            const sell = parseFloat(getCol(rec, ["Total Sell", "Sell Amount", "Gross Sell"])) || 0;
            const cash = parseFloat(getCol(rec, ["Cash Amt", "Cash Amount", "Cash"])) || 0;
            const card = parseFloat(getCol(rec, ["Card Amt", "Card Amount", "Card"])) || 0;
            const discount = parseFloat(getCol(rec, ["Discount", "Discount Allowed"])) || 0;
            let received = cash + card;
            if (received === 0) {
              received = parseFloat(getCol(rec, ["Received Amount", "Total Received", "Received"])) || 0;
            }
            let due = sell - received - discount;
            if (due <= 0.009) {
              due = parseFloat(getCol(rec, ["Due Balance", "Due", "Outstanding Balance Due"])) || 0;
            }
            if (due <= 0.009) return;

            rows.push({
              d,
              uid,
              name,
              memo,
              user,
              sell,
              received,
              cash,
              card,
              due,
              idLabel: `${uid} | ${name} | Inv: ${memo} | ${d.toLocaleDateString()} | ${user}`
            });
          });
        }

        rows.sort((a, b) => b.d - a.d);

        const sum = rows.reduce((acc, r) => {
          acc.count += 1;
          acc.billed += r.sell;
          acc.received += r.received;
          acc.cash += r.cash;
          acc.card += r.card;
          acc.due += r.due;
          return acc;
        }, { count: 0, billed: 0, received: 0, cash: 0, card: 0, due: 0 });

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 bg-white border border-gray-200 p-4 md:p-5 rounded-xl shadow-sm mb-2">
            <div class="text-center md:text-left">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryInvoicesDue')}</div>
              <div class="text-2xl font-black text-slate-800 font-mono mt-1">${sum.count}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryTotalBilled')}</div>
              <div class="text-xl font-black text-blue-600 font-mono mt-1 break-all">SAR ${sum.billed.toFixed(2)}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryTotalReceived')}</div>
              <div class="text-xl font-black text-emerald-600 font-mono mt-1 break-all">SAR ${sum.received.toFixed(2)}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryCashReceived')}</div>
              <div class="text-xl font-black text-emerald-700 font-mono mt-1 break-all">SAR ${sum.cash.toFixed(2)}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryCardReceived')}</div>
              <div class="text-xl font-black text-purple-600 font-mono mt-1 break-all">SAR ${sum.card.toFixed(2)}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryTotalDue')}</div>
              <div class="text-xl font-black text-red-600 font-mono mt-1 break-all">SAR ${sum.due.toFixed(2)}</div>
            </div>
          </div>
        `;
        cardsEl.className = 'grid grid-cols-1 mb-6';

        tableContainer.innerHTML = `
          <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div class="bg-red-50 text-red-900 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">
              ${t('report.customerDueLedger')} ${useDateFilter ? t('report.selectedRange') : t('report.allTime')}
            </div>
            <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
              <table class="erp-report-table w-full text-left border-collapse text-xs">
                <thead class="bg-slate-800 text-white uppercase whitespace-nowrap">
                  <tr>
                    <th class="p-2.5 w-12 text-center">${t('report.colSl')}</th>
                    <th class="p-2.5 min-w-[220px]">${t('report.colCustomerIdName')}</th>
                    <th class="p-2.5 text-right">${t('report.colBilledAmount')}</th>
                    <th class="p-2.5 text-right">${t('report.colReceivedAmount')}</th>
                    <th class="p-2.5 text-right">${t('report.colCashReceived')}</th>
                    <th class="p-2.5 text-right">${t('report.colCardReceived')}</th>
                    <th class="p-2.5 text-right">${t('report.colIndividualDue')}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-gray-700">
                  ${rows.length > 0 ? rows.map((row, i) => `
                    <tr class="hover:bg-gray-50">
                      <td class="p-2.5 text-center text-gray-400 font-mono">${i + 1}</td>
                      <td class="p-2.5 font-medium leading-snug">
                        <div class="font-mono text-[10px] text-gray-500 break-all">${row.uid}</div>
                        <div class="font-bold text-gray-900">${row.name}</div>
                        <div class="text-[10px] text-gray-600">${t('col.memo')}: ${row.memo} · ${row.d.toLocaleDateString()} · ${row.user}</div>
                      </td>
                      <td class="p-2.5 text-right font-mono font-bold text-blue-600">${row.sell.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono font-bold text-emerald-600">${row.received.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono text-emerald-700">${row.cash.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono text-purple-600">${row.card.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono font-bold text-red-600">${row.due.toFixed(2)}</td>
                    </tr>
                  `).join('') : `<tr><td colspan="7" class="p-8 text-center text-gray-400 font-bold">${t('report.noCustomerDueForUser')}</td></tr>`}
                </tbody>
                ${rows.length > 0 ? `
                <tfoot class="bg-gray-50 border-t-2 border-gray-200 font-bold">
                  <tr>
                    <td class="p-2.5 text-right uppercase text-[10px] text-gray-500" colspan="2">${t('report.grandTotal')}</td>
                    <td class="p-2.5 text-right font-mono text-blue-700">${sum.billed.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-emerald-700">${sum.received.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-emerald-800">${sum.cash.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-purple-700">${sum.card.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-red-700">${sum.due.toFixed(2)}</td>
                  </tr>
                </tfoot>` : ''}
              </table>
            </div>
          </div>
        `;
        break;
      }

      default:
        tBody.innerHTML = `<tr><td class="p-6 text-center text-red-500 font-bold">${t('report.underConstruction')}</td></tr>`;
    }

  } catch (err) {
    console.error(err);
    tBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-red-500 font-bold">${t('alert.errorGenerate')}</td></tr>`;
  }
}

/**
 * SECURITY: PASSWORD MANAGEMENT PROTOCOL
 */
const pwdModal = document.getElementById('modal-change-password');
const openPwdBtn = document.getElementById('btn-open-password-modal');
const closePwdBtn = document.getElementById('close-password-modal');
const formPwd = document.getElementById('form-change-password');

setupPasswordToggle('toggle-cp-old', 'cp-old');
setupPasswordToggle('toggle-cp-new', 'cp-new');
setupPasswordToggle('toggle-cp-confirm', 'cp-confirm');

if (openPwdBtn) {
  openPwdBtn.addEventListener('click', () => { 
    closeMenu(); 
    if (pwdModal) pwdModal.classList.remove('hidden'); 
  });
}

if (closePwdBtn) {
  closePwdBtn.addEventListener('click', () => { 
    if (pwdModal) pwdModal.classList.add('hidden'); 
    if (formPwd) {
      formPwd.reset();
      resetPasswordToggles([
        ['toggle-cp-old', 'cp-old'],
        ['toggle-cp-new', 'cp-new'],
        ['toggle-cp-confirm', 'cp-confirm']
      ]);
    }
  });
}

if (formPwd) {
  formPwd.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPwd = document.getElementById('cp-old').value;
    const newPwd = document.getElementById('cp-new').value;
    const confirmPwd = document.getElementById('cp-confirm').value;

    if (newPwd !== confirmPwd) {
      alert("Verification Failed: New passwords do not match.");
      return;
    }

    const currentUser = fetchSessionUser();
    try {
      const result = await apiRequest({
        action: "CHANGE_PASSWORD",
        payload: { username: currentUser.username, oldPassword: oldPwd, newPassword: newPwd }
      });
      alert(result.message);
      
      if (result.success) {
        pwdModal.classList.add('hidden');
        formPwd.reset();
        resetPasswordToggles([
          ['toggle-cp-old', 'cp-old'],
          ['toggle-cp-new', 'cp-new'],
          ['toggle-cp-confirm', 'cp-confirm']
        ]);
      }
    } catch (err) {
      alert("Pipeline Error: Failed to connect to security database.");
    }
  });
}

/**
 * SECURITY COMPONENT LAYER & ACTIVE DIRECTORIES
 */
function initUserManagementFormListener() {
  const userForm = document.getElementById('form-create-user');
  if (!userForm || userForm.dataset.bound === 'true') return;
  userForm.dataset.bound = 'true';
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault(); const currentUser = fetchSessionUser();
    const mobile = document.getElementById('new-mobile')?.value.trim() || '';
    const email = document.getElementById('new-email')?.value.trim() || '';
    if (!mobile && !email) { alert(t('users.contactRequired')); return; }
    const permittedMenus = readPermCheckboxes('create-user-perms');
    const newUserPayload = {
      username: document.getElementById('new-username').value.trim(),
      password: document.getElementById('new-password').value,
      role: document.getElementById('new-role').value,
      permissions: permittedMenus,
      mobile,
      email
    };
    try {
      const result = await apiRequest({ action: "CREATE_USER", payload: { newUser: newUserPayload, actorUsername: currentUser.username, actorRole: currentUser.role } }); alert(result.message);
      if (result.success) {
         userForm.reset();
         resetPasswordToggles([['toggle-new-password', 'new-password']]);
         await loadUserDirectories();
      }
    } catch (err) { alert(t('users.registerFailed')); }
  });
}


function setDashboardDrawersSectionVisible(visible) {
  const adminContainer = document.getElementById('admin-global-balance-container');
  if (!visible && adminContainer) adminContainer.innerHTML = '';
  setMobilePageMode(visible ? 'dashboard' : activeModuleTarget);
}

function initDashboardInsightsToggle(forceReapply = false) {
  const panel = document.getElementById('dashboard-insights-panel');
  const toggle = document.getElementById('dashboard-insights-toggle');
  const body = document.getElementById('dashboard-insights-body');
  const chevron = document.getElementById('insights-toggle-chevron');
  if (!panel || !toggle || !body) return;
  if (panel.classList.contains('hidden')) return;

  const syncToggleUi = () => {
    const isExpanded = !body.classList.contains('hidden');
    toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    if (chevron) chevron.classList.toggle('rotate-180', isExpanded);
    syncChromeBarHeight();
  };

  const applyLayout = () => {
    if (forceReapply) {
      body.classList.add('hidden');
      body.classList.remove('user-expanded');
    } else if (!body.classList.contains('user-expanded')) {
      body.classList.add('hidden');
    }
    syncToggleUi();
  };

  if (toggle.dataset.bound !== 'true') {
    toggle.dataset.bound = 'true';
    toggle.addEventListener('click', () => {
      body.classList.toggle('hidden');
      body.classList.toggle('user-expanded', !body.classList.contains('hidden'));
      syncToggleUi();
    });
  }

  applyLayout();
}

function updateDashboardInsightsSummary(globalBalance, drawerCount) {
  const summary = document.getElementById('insights-toggle-summary');
  if (!summary) return;
  const parts = [];
  if (globalBalance !== null && globalBalance !== undefined) {
    parts.push(t('dash.balanceSummary', { amount: Number(globalBalance).toFixed(2) }));
  }
  if (drawerCount > 0) {
    parts.push(drawerCount === 1 ? t('dash.drawerCount', { count: drawerCount }) : t('dash.drawerCountPlural', { count: drawerCount }));
  }
  summary.textContent = parts.length ? parts.join(' · ') : t('dash.tapToView');
}

/**
 * ------------------------------------------------------------------
 * MASTER DASHBOARD ENGINE (FIXED: STRICT MATH & NO DOUBLE COUNTING)
 * ------------------------------------------------------------------
 */
async function loadDashboardData() {
  const container = document.getElementById('dash-user-drawers');
  if (container) container.innerHTML = `<div class="snap-start shrink-0 w-full md:w-auto col-span-full p-3 text-center text-blue-500 text-xs font-bold animate-pulse">${t('dash.calculatingBalances')}</div>`;
  
  try {
    const fetchS = async (sheetName) => {
      try { return await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName } }); } catch(e) { return {success:false, records:[]}; }
    };

    const [rCust, rCustT, rSup, rSupT, rExp, rHr, rHrT, rInc, rIncT, rCrd, rCrdT, rCapT, rInt, rUsers] = await Promise.all([
      fetchS("Customers"), fetchS("Customer_Transactions"), fetchS("Suppliers"), fetchS("Supplier_Transactions"),
      fetchS("Expense_Transactions"), fetchS("HR"), fetchS("HR_Transactions"), fetchS("Income_Heads"), fetchS("Income_Transactions"),
      fetchS("Creditor_Heads"), fetchS("Creditor_Transactions"), fetchS("Capital_Transactions"), fetchS("Internal_Transfers"), fetchS("Users")
    ]);

    const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
    const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };

    let adminUsers = [];
    if (rUsers.success) { rUsers.records.forEach(u => { if (cln(gV(u, ["role"])).includes("admin")) adminUsers.push(cln(gV(u, ["username"]))); }); }
    const isAdm = (usr) => adminUsers.includes(cln(usr));

    const sellCols = ["soldamount", "soldamt", "totalsell", "sellamount", "grosssell", "sell"];
    const recvCols = ["receivedamount", "receivedamt", "received", "cashreceived", "cashamt", "cashamount", "paidamount", "paidamt", "amountpaid"];
    const methCols = ["paymentmethod", "method", "paymenttype", "type"];

    let saleSold=0, saleRecv=0, saleCash=0, saleCard=0, saleDue=0;
    let incBilled=0, incRecv=0, incDue=0;
    let purPur=0, purPaid=0, purDue=0;
    let expInc=0, expPaid=0, expDue=0;
    let crdRecv=0, crdRet=0, crdDue=0;
    let capIn=0, capOut=0, capNet=0;
    let hrEarned=0, hrPaid=0, hrDue=0; 
    let tRecv=0, tPay=0;
    
    let userCash = {};
    const addCash = (usr, amt) => { if(!usr) return; let u=String(usr).trim(); if(!userCash[u]) userCash[u]=0; userCash[u]+=amt; };

    let txnTotals = {};
    if(rCustT.success) rCustT.records.forEach(t => {
        let uid = cln(gV(t, ["systemuniqueid", "sysuid", "uniqueid"]));
        let check = cln(gV(t, ["remarks", "category", "method", "type", "paymentmethod"]));
        if(!uid || check.includes("previousdue") || check.includes("openingbalance")) return; // Ignore Previous Due for live cash subtract
        if(!txnTotals[uid]) txnTotals[uid] = { cash: 0 };
        let method = cln(gV(t, methCols)); if (method === "") method = "cash"; 
        if (method.includes("cash")) txnTotals[uid].cash += gF(t, recvCols);
    });

    // CUSTOMER LOGIC
    if(rCust.success) rCust.records.forEach(r => {
       let uid = cln(gV(r, ["systemuniqueid", "sysuid", "uniqueid"]));
       let sell = gF(r, sellCols); let cash = gF(r, ["cashamt", "cashamount", "cash"]); let card = gF(r, ["cardamt", "cardamount", "card"]); let discount = gF(r, ["discount", "discountallowed"]);
       let recv = cash + card; let due = sell - recv - discount;
       saleSold += sell; saleCash += cash; saleCard += card; saleRecv += recv; saleDue += due;
       let initCash = cash - (txnTotals[uid] ? txnTotals[uid].cash : 0);
       let creator = gV(r, ["username", "loggedby", "createdby"]);
       if (creator) addCash(creator, initCash);
    });
    if(rCustT.success) rCustT.records.forEach(t => {
       let amt = gF(t, recvCols);
       let check = cln(gV(t, ["remarks", "category", "method", "type", "paymentmethod"]));
       if (check.includes("previousdue") || check.includes("openingbalance")) {
           saleSold += amt; saleDue += amt;
       } else {
           let method = cln(gV(t, methCols)); if (method === "") method = "cash";
           let logger = gV(t, ["username", "loggedby"]);
           if (method.includes("cash") && logger) addCash(logger, amt);
       }
    });

    // INCOME LOGIC
    if(rIncT.success) rIncT.records.forEach(r => {
       const amounts = parseTxnDualAmounts(r, INCOME_TXN_FIELDS);
       let check = cln(getDualTxnCategory(r, INCOME_TXN_FIELDS) + " " + gV(r, ["remarks", "parenthead", "subhead"]));
       if (check.includes("previousdue") || check.includes("openingbalance")) {
           let prevAmt = Math.max(amounts.bill, amounts.pay);
           incBilled += prevAmt; incDue += prevAmt;
       } else {
           incBilled += amounts.bill; incRecv += amounts.pay; incDue += amounts.txnDue;
       }
    });

    // SUPPLIER LOGIC — transaction totals only (master sheet columns are backend cache, not display source)
    const supTotals = {};
    if (rSupT.success) rSupT.records.forEach(r => {
      const name = String(gV(r, ["suppliername"]) || '').trim();
      if (!name) return;
      if (!supTotals[name]) supTotals[name] = { bill: 0, discount: 0, pay: 0 };
      const p = parseSupplierTxnAmounts(r);
      supTotals[name].bill += p.bill;
      supTotals[name].discount += p.discount;
      supTotals[name].pay += p.pay;
      const logger = gV(r, ["username", "loggedby"]);
      if (logger && !isAdm(logger) && p.pay > 0) addCash(logger, -p.pay);
    });
    Object.values(supTotals).forEach((s) => {
      purPur += s.bill;
      purPaid += s.pay;
      purDue += Math.max(0, s.bill - s.discount - s.pay);
    });

    // EXPENSE LOGIC
    if(rExp.success) rExp.records.forEach(r => {
       const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
       let check = cln(getDualTxnCategory(r, EXPENSE_TXN_FIELDS) + " " + gV(r, ["remarks", "parenthead", "subhead"]));
       if (check.includes("previousdue") || check.includes("openingbalance")) {
           let prevAmt = Math.max(amounts.bill, amounts.pay);
           expInc += prevAmt; expDue += prevAmt;
       } else {
           expInc += amounts.bill; expPaid += amounts.pay; expDue += amounts.txnDue;
           let logger = gV(r, ["username", "loggedby"]);
           if (logger && !isAdm(logger) && amounts.pay > 0) addCash(logger, -amounts.pay);
       }
    });

    // CREDITOR LOGIC
    if(rCrdT.success) rCrdT.records.forEach(r => {
       const amounts = parseTxnDualAmounts(r, CREDITOR_TXN_FIELDS);
       let check = cln(getDualTxnCategory(r, CREDITOR_TXN_FIELDS) + " " + gV(r, ["remarks", "method", "type"]));
       if (check.includes("previousdue") || check.includes("openingbalance")) {
           let prevAmt = Math.max(amounts.bill, amounts.pay);
           crdRecv += prevAmt; crdDue += prevAmt;
       } else {
           crdRecv += amounts.bill; crdRet += amounts.pay; crdDue += amounts.txnDue;
           let logger = gV(r, ["username", "loggedby"]);
           if (logger && !isAdm(logger) && amounts.pay > 0) addCash(logger, -amounts.pay);
       }
    });

    // CAPITAL LOGIC
    if(rCapT.success) rCapT.records.forEach(r => {
       const amounts = parseTxnDualAmounts(r, CAPITAL_TXN_FIELDS);
       let check = cln(getDualTxnCategory(r, CAPITAL_TXN_FIELDS) + " " + gV(r, ["remarks", "subhead"]));
       if (check.includes("previousdue") || check.includes("openingbalance")) {
           let prevAmt = Math.max(amounts.bill, amounts.pay);
           capIn += prevAmt; capNet += prevAmt;
       } else {
           capIn += amounts.bill; capOut += amounts.pay; capNet += amounts.txnDue;
           let logger = gV(r, ["username", "loggedby"]);
           if (logger && !isAdm(logger)) {
               addCash(logger, amounts.bill);
               addCash(logger, -amounts.pay);
           }
       }
    });

    // HR LOGIC (STRICT DYNAMIC MATH - NO DOUBLE COUNTING)
    if(rHrT.success) rHrT.records.forEach(r => { 
        let amt = Math.abs(gF(r, ["amount"])); let check = cln(gV(r, ["category", "remarks"])); let logger = gV(r, ["username", "loggedby"]);
        if (check.includes("previousdue") || check.includes("openingbalance") || check.includes("earn") || check.includes("bill")) {
            hrEarned += amt; // ONLY Actual Earned or Previous Due. NO INCREMENTS.
        } else if (check.includes("paid")) {
            hrPaid += amt;
            if (logger && !isAdm(logger)) addCash(logger, -amt);
        }
    });
    hrDue = hrEarned - hrPaid;

    // INTERNAL TRANSFERS
    if(rInt.success) rInt.records.forEach(r => { addCash(gV(r, ["username", "transferredby", "loggedby"]), -Math.abs(gF(r, ["transferamount", "amount"]))); });

    // MASTER AGGREGATION (Flawless Totals)
    tRecv = saleDue + incDue;
    tPay = purDue + expDue + crdDue + hrDue;

    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = Number(val).toFixed(2); };
    setVal('dash-recv', tRecv); setVal('dash-pay', tPay);
    setVal('dash-sale-sold', saleSold); setVal('dash-sale-recv', saleRecv); setVal('dash-sale-due', saleDue); setVal('dash-sale-cash', saleCash); setVal('dash-sale-card', saleCard);
    setVal('dash-inc-billed', incBilled); setVal('dash-inc-recv', incRecv); setVal('dash-inc-due', incDue);
    setVal('dash-sup-pur', purPur); setVal('dash-sup-paid', purPaid); setVal('dash-sup-due', purDue);
    setVal('dash-exp-inc', expInc); setVal('dash-exp-paid', expPaid); setVal('dash-exp-due', expDue);
    setVal('dash-hr-earned', hrEarned); setVal('dash-hr-paid', hrPaid); setVal('dash-hr-due', hrDue);
    setVal('dash-crd-recv', crdRecv); setVal('dash-crd-ret', crdRet); setVal('dash-crd-due', crdDue);
    setVal('dash-cap-in', capIn); setVal('dash-cap-out', capOut); setVal('dash-cap-net', capNet);

    const sessionUser = fetchSessionUser();
    const adminContainer = document.getElementById('admin-global-balance-container');
    let globalBalance = null;
    if (sessionUser && (sessionUser.role === "Super Admin" || sessionUser.role === "Admin")) {
        let globalInflows = saleRecv + incRecv + crdRecv + capIn; let globalOutflows = purPaid + expPaid + crdRet + hrPaid + capOut; globalBalance = globalInflows - globalOutflows;
        if (adminContainer) {
            adminContainer.innerHTML = `<div class="bg-slate-900 border border-slate-800 rounded-lg md:rounded-xl p-3 md:p-5 shadow-md text-white"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4"><div class="min-w-0"><div class="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5"><svg class="w-3 h-3 md:w-4 md:h-4 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg><span class="truncate">${t('dash.globalBalance')}</span></div><div class="text-xl sm:text-2xl md:text-3xl font-black font-mono text-teal-400 truncate">SAR ${globalBalance.toFixed(2)}</div></div><div class="grid grid-cols-2 gap-2 sm:flex sm:gap-3 shrink-0"><div class="bg-slate-800/70 rounded-lg px-2.5 py-1.5 md:px-3 md:py-2"><div class="text-[8px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider">${t('dash.inflows')}</div><div class="text-emerald-400 font-mono font-bold text-xs md:text-base">SAR ${globalInflows.toFixed(2)}</div></div><div class="bg-slate-800/70 rounded-lg px-2.5 py-1.5 md:px-3 md:py-2"><div class="text-[8px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider">${t('dash.outflows')}</div><div class="text-red-400 font-mono font-bold text-xs md:text-base">SAR ${globalOutflows.toFixed(2)}</div></div></div></div></div>`;
        }
    } else { if (adminContainer) adminContainer.innerHTML = ''; }

    let drawerHTML = "";
    let drawerCount = 0;
    Object.keys(userCash).forEach(usr => {
       let bal = userCash[usr];
       if(Math.abs(bal) > 0.01) { 
          drawerCount++;
          let clr = bal >= 0 ? 'text-emerald-600' : 'text-red-600';
          drawerHTML += `<div class="snap-start shrink-0 w-[108px] sm:w-[120px] md:w-auto md:shrink bg-white border border-gray-200 rounded-lg p-2 md:p-3 shadow-sm text-center"><div class="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5 truncate" title="${usr}">${usr}</div><div class="font-mono font-bold text-sm md:text-lg ${clr} whitespace-nowrap">SAR ${bal.toFixed(2)}</div></div>`;
       }
    });
    if(drawerHTML === "" && container) drawerHTML = `<div class="snap-start w-full md:col-span-full p-2.5 md:p-3 text-center text-gray-400 text-xs font-semibold border border-gray-100 rounded-lg bg-white">${t('dash.allDrawersBalanced')}</div>`;
    if(container) container.innerHTML = drawerHTML;
    updateDashboardInsightsSummary(globalBalance, drawerCount);

  } catch (err) { console.error("Dashboard Load Error:", err); }
}

function bindDashboardRefreshOnce() {
  if (window._erpDashRefreshBound) return;
  window._erpDashRefreshBound = true;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#btn-refresh-dash, #btn-refresh-dash-insights');
    if (!btn || btn.disabled) return;
    refreshDashboardData(btn);
  });
}

async function refreshDashboardData(triggerBtn) {
  const btn = triggerBtn || document.getElementById('btn-refresh-dash');
  const busyLabel = t('dash.refreshing');
  if (btn) {
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    if (!btn.dataset.refreshLabel) btn.dataset.refreshLabel = btn.textContent.trim();
    btn.textContent = busyLabel;
  }
  try {
    await syncSessionPermissions();
    if (!fetchSessionUser() || !userCanAccessModule(fetchSessionUser(), 'dashboard')) return;
    await Promise.all([loadDashboardData(), updateLiveUserCashDrawerBalance()]);
    if (btn) {
      btn.textContent = t('dash.refreshDone');
      setTimeout(() => {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.textContent = btn.dataset.refreshLabel || t('common.refresh');
        applyTranslations(btn.closest('div') || document);
      }, 900);
    }
  } catch (err) {
    console.error('Dashboard refresh failed:', err);
    alert(t('alert.errorLoad'));
    if (btn) {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = btn.dataset.refreshLabel || t('common.refresh');
    }
  }
}

async function loadUserDirectories() {
  const container = document.getElementById('table-users-list'); if(!container) return;
  try {
    const result = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: "Users" } });
    if (result.success && result.records.length > 0) {
      cacheUserRecords(result.records);
      container.innerHTML = result.records.map(rec => renderUserDirectoryRow(rec)).join('');
    } else {
      container.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400">${t('users.noOperators')}</td></tr>`;
    }
  } catch(err) {
    container.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500 font-bold">${t('users.loadFailedDirectory')}</td></tr>`;
  }
}

initApp();