import {
  CAPITAL_TXN_FIELDS,
  CREDITOR_TXN_FIELDS,
  EXPENSE_TXN_FIELDS,
  INCOME_TXN_FIELDS
} from '../lib/txnFields.js';

export const EXPENSE_HEADS_CONFIG = {
  moduleId: 'expense_heads',
  title: 'Expense Categories Matrix',
  formTitle: 'New Expense Head Entry',
  ledgerTitle: 'Expense Head Structures',
  headSheet: 'Expense_Heads',
  txnSheet: 'Expense_Transactions',
  fieldMap: EXPENSE_TXN_FIELDS,
  trackingPrefix: 'EXP',
  mainCols: ['Parent Head', 'Expense Parent Head', 'Main Head', 'Parent Category'],
  subCols: ['Sub Head Name', 'Sub Head', 'SubCategory'],
  billLabel: 'Total Incurred',
  payLabel: 'Total Paid'
};

export const EXPENSE_TXN_CONFIG = {
  moduleId: 'expense_transactions',
  title: 'Expense Transaction Ledger',
  formTitle: 'Log Expense Transaction',
  ledgerTitle: 'Expense Historical Ledger',
  headSheet: 'Expense_Heads',
  txnSheet: 'Expense_Transactions',
  fieldMap: EXPENSE_TXN_FIELDS,
  txnIdPrefix: 'EXT',
  categories: [
    { value: 'Incurred', label: 'Incurred (Increases Due)' },
    { value: 'Payment Paid', label: 'Payment Paid (Decreases Due)' },
    { value: 'Previous Due', label: 'Previous Due' }
  ],
  billLabel: 'Incurred Amount',
  discountLabel: 'Discount Allowed',
  payLabel: 'Payment Paid'
};

export const CREDITOR_HEADS_CONFIG = {
  moduleId: 'creditors',
  title: 'Creditor Heads Management',
  formTitle: 'New Creditor Head Entry',
  ledgerTitle: 'Creditor Master Structures',
  headSheet: 'Creditor_Heads',
  txnSheet: 'Creditor_Transactions',
  fieldMap: CREDITOR_TXN_FIELDS,
  trackingPrefix: 'CRD',
  mainCols: ['Creditor Parent Head', 'Parent Head', 'Main Head'],
  subCols: ['Sub Head', 'SubCategory'],
  billLabel: 'Total Received',
  payLabel: 'Total Return'
};

export const CREDITOR_TXN_CONFIG = {
  moduleId: 'creditor_transactions',
  title: 'Creditor Transaction Ledger',
  formTitle: 'Log Creditor Transaction',
  ledgerTitle: 'Creditor Historical Ledger',
  headSheet: 'Creditor_Heads',
  txnSheet: 'Creditor_Transactions',
  fieldMap: CREDITOR_TXN_FIELDS,
  txnIdPrefix: 'CRD',
  categories: [
    { value: 'Received', label: 'Received (Increases Due)' },
    { value: 'Return', label: 'Return (Decreases Due)' },
    { value: 'Previous Due', label: 'Previous Due' }
  ],
  billLabel: 'Received Amount',
  discountLabel: 'Discount',
  payLabel: 'Return Amount'
};

export const INCOME_HEADS_CONFIG = {
  moduleId: 'income_heads',
  title: 'Income Heads Management',
  formTitle: 'New Income Head Entry',
  ledgerTitle: 'Income Master Structures',
  headSheet: 'Income_Heads',
  txnSheet: 'Income_Transactions',
  fieldMap: INCOME_TXN_FIELDS,
  trackingPrefix: 'INC',
  mainCols: ['Income Parent Head', 'Parent Head', 'Main Head'],
  subCols: ['Sub Head', 'SubCategory'],
  billLabel: 'Total Receivable',
  payLabel: 'Total Received'
};

export const INCOME_TXN_CONFIG = {
  moduleId: 'income_transactions',
  title: 'Income Transaction Ledger',
  formTitle: 'Log Income Transaction',
  ledgerTitle: 'Income Historical Ledger',
  headSheet: 'Income_Heads',
  txnSheet: 'Income_Transactions',
  fieldMap: INCOME_TXN_FIELDS,
  txnIdPrefix: 'INC',
  categories: [
    { value: 'Receivable', label: 'Receivable (Increases Due)' },
    { value: 'Received', label: 'Received (Decreases Due)' },
    { value: 'Previous Due', label: 'Previous Due' }
  ],
  billLabel: 'Receivable Amount',
  discountLabel: 'Discount',
  payLabel: 'Received Amount'
};

export const CAPITAL_HEADS_CONFIG = {
  moduleId: 'capital_heads',
  title: 'Capital Heads Management',
  formTitle: 'New Capital Head Entry',
  ledgerTitle: 'Capital Master Structures',
  headSheet: 'Capital_Heads',
  txnSheet: 'Capital_Transactions',
  fieldMap: CAPITAL_TXN_FIELDS,
  trackingPrefix: 'CAP',
  mainCols: ['Capital Parent Head', 'Parent Head', 'Main Head'],
  subCols: ['Sub Head', 'SubCategory'],
  billLabel: 'Capital In',
  payLabel: 'Capital Out'
};

export const CAPITAL_TXN_CONFIG = {
  moduleId: 'capital_transactions',
  title: 'Capital Transaction Ledger',
  formTitle: 'Log Capital Transaction',
  ledgerTitle: 'Capital Historical Ledger',
  headSheet: 'Capital_Heads',
  txnSheet: 'Capital_Transactions',
  fieldMap: CAPITAL_TXN_FIELDS,
  txnIdPrefix: 'CAP',
  categories: [
    { value: 'Capital In', label: 'Capital In (Increases Due)' },
    { value: 'Capital Out', label: 'Capital Out (Decreases Due)' },
    { value: 'Previous Due', label: 'Previous Due' }
  ],
  billLabel: 'Capital In Amount',
  discountLabel: 'Discount',
  payLabel: 'Capital Out Amount'
};

export const HEAD_MODULE_MAP = {
  expense_heads: EXPENSE_HEADS_CONFIG,
  creditors: CREDITOR_HEADS_CONFIG,
  income_heads: INCOME_HEADS_CONFIG,
  capital_heads: CAPITAL_HEADS_CONFIG
};

export const TXN_MODULE_MAP = {
  expense_transactions: EXPENSE_TXN_CONFIG,
  creditor_transactions: CREDITOR_TXN_CONFIG,
  income_transactions: INCOME_TXN_CONFIG,
  capital_transactions: CAPITAL_TXN_CONFIG
};
