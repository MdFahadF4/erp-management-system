import DashboardPage from '../pages/DashboardPage.jsx';
import HrManagementPage from '../pages/HrManagementPage.jsx';
import HrTransactionsPage from '../pages/HrTransactionsPage.jsx';
import HrFactoryPage from '../pages/HrFactoryPage.jsx';
import CustomersPage from '../pages/CustomersPage.jsx';
import CustomerTransactionsPage from '../pages/CustomerTransactionsPage.jsx';
import SuppliersPage from '../pages/SuppliersPage.jsx';
import SupplierTransactionsPage from '../pages/SupplierTransactionsPage.jsx';
import InternalTransferPage from '../pages/InternalTransferPage.jsx';
import InternalTransferViewPage from '../pages/InternalTransferViewPage.jsx';
import HeadManagementPage from '../pages/HeadManagementPage.jsx';
import DualTxnPage from '../pages/DualTxnPage.jsx';
import DeliveryDashboardPage from '../pages/DeliveryDashboardPage.jsx';
import AllTransactionsPage from '../pages/AllTransactionsPage.jsx';
import UsersPage from '../pages/UsersPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import {
  CAPITAL_HEADS_CONFIG,
  CAPITAL_TXN_CONFIG,
  CREDITOR_HEADS_CONFIG,
  CREDITOR_TXN_CONFIG,
  EXPENSE_HEADS_CONFIG,
  EXPENSE_TXN_CONFIG,
  INCOME_HEADS_CONFIG,
  INCOME_TXN_CONFIG
} from '../config/headModules.js';

/**
 * Maps sidebar module id → React component factory.
 * Each factory receives { user, metrics, loading, refreshing, onRefresh, onDataChange }.
 */
export function resolveModuleComponent(moduleId, ctx) {
  const { user, metrics, loading, refreshing, onRefresh, onDataChange } = ctx;

  switch (moduleId) {
    case 'dashboard':
      return (
        <DashboardPage metrics={metrics} loading={loading} refreshing={refreshing} onRefresh={onRefresh} />
      );
    case 'hr':
      return <HrManagementPage user={user} onDataChange={onDataChange} />;
    case 'hr_transactions':
      return <HrTransactionsPage user={user} onDataChange={onDataChange} />;
    case 'hr_factory':
      return <HrFactoryPage user={user} />;
    case 'customers':
      return <CustomersPage user={user} onDataChange={onDataChange} />;
    case 'customer_transactions':
      return <CustomerTransactionsPage user={user} onDataChange={onDataChange} />;
    case 'suppliers':
      return <SuppliersPage user={user} onDataChange={onDataChange} />;
    case 'supplier_transactions':
      return <SupplierTransactionsPage user={user} onDataChange={onDataChange} />;
    case 'internal_transfer':
      return <InternalTransferPage user={user} onDataChange={onDataChange} />;
    case 'internal_transfer_view':
      return <InternalTransferViewPage user={user} onDataChange={onDataChange} />;
    case 'expense_heads':
      return <HeadManagementPage user={user} config={EXPENSE_HEADS_CONFIG} onDataChange={onDataChange} />;
    case 'expense_transactions':
      return <DualTxnPage user={user} config={EXPENSE_TXN_CONFIG} onDataChange={onDataChange} />;
    case 'creditors':
      return <HeadManagementPage user={user} config={CREDITOR_HEADS_CONFIG} onDataChange={onDataChange} />;
    case 'creditor_transactions':
      return <DualTxnPage user={user} config={CREDITOR_TXN_CONFIG} onDataChange={onDataChange} />;
    case 'income_heads':
      return <HeadManagementPage user={user} config={INCOME_HEADS_CONFIG} onDataChange={onDataChange} />;
    case 'income_transactions':
      return <DualTxnPage user={user} config={INCOME_TXN_CONFIG} onDataChange={onDataChange} />;
    case 'capital_heads':
      return <HeadManagementPage user={user} config={CAPITAL_HEADS_CONFIG} onDataChange={onDataChange} />;
    case 'capital_transactions':
      return <DualTxnPage user={user} config={CAPITAL_TXN_CONFIG} onDataChange={onDataChange} />;
    case 'delivery_dashboard':
      return <DeliveryDashboardPage user={user} />;
    case 'all_transactions':
      return <AllTransactionsPage user={user} onDataChange={onDataChange} />;
    case 'reports':
      return <ReportsPage />;
    case 'users':
      return <UsersPage user={user} />;
    default:
      return null;
  }
}
