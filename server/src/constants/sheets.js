/** Google Sheet names → MongoDB collection names (lowercase) */
export const SHEET_COLLECTION_MAP = {
  Users: 'users',
  Admin_Settings: 'admin_settings',
  HR: 'hr',
  HR_Transactions: 'hr_transactions',
  Customers: 'customers',
  Customer_Transactions: 'customer_transactions',
  Delivery_Queue: 'delivery_queue',
  Suppliers: 'suppliers',
  Supplier_Transactions: 'supplier_transactions',
  Internal_Transfers: 'internal_transfers',
  Expense_Heads: 'expense_heads',
  Expense_Transactions: 'expense_transactions',
  Creditor_Heads: 'creditor_heads',
  Creditor_Transactions: 'creditor_transactions',
  Income_Heads: 'income_heads',
  Income_Transactions: 'income_transactions',
  Capital_Heads: 'capital_heads',
  Capital_Transactions: 'capital_transactions'
};

export const TXN_SHEETS_WITH_IDS = new Set([
  'HR_Transactions',
  'Supplier_Transactions',
  'Customer_Transactions',
  'Internal_Transfers',
  'Expense_Transactions',
  'Creditor_Transactions',
  'Income_Transactions',
  'Capital_Transactions'
]);

export function sheetToCollection(sheetName) {
  const key = String(sheetName || '').trim();
  return SHEET_COLLECTION_MAP[key] || key.toLowerCase().replace(/\s+/g, '_');
}
