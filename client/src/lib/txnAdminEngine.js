import { getCol, roundMoney } from './recordHelpers.js';
import {
  getDualTxnCategory,
  getSupplierTxnCategory,
  parseSupplierTxnAmounts,
  parseTxnDualAmounts
} from './txnParsers.js';
import { buildModuleTxnTrackingId } from './dualHeadEngine.js';
import { getHrTxnCategory } from './hrEngine.js';
import {
  CAPITAL_TXN_FIELDS,
  CREDITOR_TXN_FIELDS,
  EXPENSE_TXN_FIELDS,
  INCOME_TXN_FIELDS
} from './txnFields.js';

export function getRecordId(rec) {
  if (!rec || typeof rec !== 'object') return null;
  if (rec.ID !== undefined && rec.ID !== null && String(rec.ID).trim() !== '') {
    return String(rec.ID).trim();
  }
  const id = getCol(rec, ['ID', 'Id', 'id', 'Record ID']);
  if (id !== undefined && id !== null && String(id).trim() !== '') return String(id).trim();
  for (const key of Object.keys(rec)) {
    if (String(key).trim().toUpperCase() === 'ID') {
      const v = rec[key];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
  }
  const fallback = rec?.id;
  if (fallback !== undefined && fallback !== null && String(fallback).trim() !== '') {
    return String(fallback).trim();
  }
  return null;
}

export function formatDateInput(val) {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
  const pad = (n) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const HR_TXN_CATEGORIES = ['Salary Earn', 'Salary Paid', 'Salary Increment', 'Previous Due'];
export const SUPPLIER_TXN_CATEGORIES = ['Purchase', 'Payment Paid', 'Previous Due'];
export const EXPENSE_TXN_CATEGORIES = ['Incurred', 'Payment Paid', 'Previous Due'];
export const CREDITOR_TXN_CATEGORIES = ['Received', 'Return', 'Previous Due'];
export const INCOME_TXN_CATEGORIES = ['Receivable', 'Received', 'Previous Due'];
export const CAPITAL_TXN_CATEGORIES = ['Capital In', 'Capital Out', 'Previous Due'];
export const PAYMENT_METHODS = ['Cash', 'Card'];

/** Dual-amount sheets: bill/pay field keys and auto-synced due field */
export const TXN_DUAL_DUE_SYNC = {
  Customer_Transactions: { bill: 'sold', pay: 'received', discount: 'discount', due: 'due' },
  Supplier_Transactions: { bill: 'purchase', pay: 'paid', discount: 'discount', due: 'due' },
  Expense_Transactions: { bill: 'deposit', pay: 'paid', discount: 'discount', due: 'due' },
  Creditor_Transactions: { bill: 'received', pay: 'returned', discount: 'discount', due: 'due' },
  Income_Transactions: { bill: 'receivable', pay: 'received', discount: 'discount', due: 'due' },
  Capital_Transactions: { bill: 'capin', pay: 'capout', discount: 'discount', due: 'due' }
};

export function computeTxnDue(bill, discount, pay) {
  return ((parseFloat(bill) || 0) - (parseFloat(discount) || 0) - (parseFloat(pay) || 0)).toFixed(2);
}

function loggedByFrom(original, user) {
  return getCol(original, ['Username', 'Logged By', 'Transferred By']) || user?.username || '';
}

function stampNow() {
  return new Date().toLocaleString();
}

/**
 * Returns initial form values and field definitions for the edit modal.
 */
export function getTxnEditForm(sheetName, record) {
  switch (sheetName) {
    case 'HR_Transactions':
      return {
        values: {
          date: formatDateInput(getCol(record, ['Date', 'Transaction Date'])),
          employee: getCol(record, ['Employee Name', 'Employee', 'Name']) || '',
          amount: getCol(record, ['Amount', 'Amt', 'Transaction Amount']) ?? '',
          category: getHrTxnCategory(record),
          remarks: getCol(record, ['Remarks', 'Remarks / Reference']) || ''
        },
        fields: [
          { key: 'date', labelKey: 'field.transactionDate', type: 'date' },
          { key: 'employee', labelKey: 'field.employeeName', type: 'text' },
          { key: 'amount', labelKey: 'field.amount', type: 'number' },
          { key: 'category', labelKey: 'field.categoryClassification', type: 'select', options: HR_TXN_CATEGORIES },
          { key: 'remarks', labelKey: 'field.remarksReference', type: 'textarea' }
        ]
      };

    case 'Supplier_Transactions': {
      const p = parseSupplierTxnAmounts(record);
      const category = getSupplierTxnCategory(record);
      return {
        values: {
          date: formatDateInput(getCol(record, ['Date'])),
          supplier: getCol(record, ['Supplier Name']) || '',
          category,
          purchase: p.bill,
          discount: p.discount,
          paid: p.pay,
          due: p.txnDue,
          remarks: getCol(record, ['Remarks / Reference', 'Remarks']) || ''
        },
        fields: [
          { key: 'date', labelKey: 'field.transactionDate', type: 'date' },
          { key: 'supplier', labelKey: 'field.supplierName', type: 'text' },
          { key: 'category', labelKey: 'field.categoryClassification', type: 'select', options: SUPPLIER_TXN_CATEGORIES },
          { key: 'purchase', labelKey: 'field.purchaseAmount', type: 'number' },
          { key: 'discount', labelKey: 'field.discountAllowed', type: 'number' },
          { key: 'paid', labelKey: 'field.paymentPaidAmount', type: 'number' },
          { key: 'due', labelKey: 'field.transactionDueBalance', type: 'number', readOnly: true },
          { key: 'remarks', labelKey: 'field.remarksReference', type: 'textarea' }
        ]
      };
    }

    case 'Customer_Transactions':
      return {
        values: {
          date: formatDateInput(getCol(record, ['Date'])),
          uid: getCol(record, ['System Unique ID', 'Sys UID']) || '',
          sold: getCol(record, ['Sold Amount', 'Sold Amt']) ?? '',
          discount: getCol(record, ['Discount', 'Discount Amount', 'Txn Discount']) ?? '',
          received: getCol(record, ['Received Amount', 'Received Amt']) ?? '',
          method: getCol(record, ['Payment Method', 'Method']) || 'Cash',
          due: getCol(record, ['Transaction Due', 'Txn Due', 'Due']) ?? '',
          remarks: getCol(record, ['Remarks', 'Remarks / Reference']) || ''
        },
        fields: [
          { key: 'date', labelKey: 'field.transactionDate', type: 'date' },
          { key: 'uid', labelKey: 'field.systemUniqueId', type: 'text', readOnly: true },
          { key: 'sold', labelKey: 'field.soldAmount', type: 'number' },
          { key: 'discount', labelKey: 'field.discountAllowed', type: 'number' },
          { key: 'received', labelKey: 'field.receivedAmount', type: 'number' },
          { key: 'method', labelKey: 'field.paymentMethod', type: 'select', options: PAYMENT_METHODS },
          { key: 'due', labelKey: 'field.transactionDueBalance', type: 'number', readOnly: true },
          { key: 'remarks', labelKey: 'field.remarksReference', type: 'textarea' }
        ]
      };

    case 'Internal_Transfers':
      return {
        values: {
          date: formatDateInput(getCol(record, ['Date'])),
          amount: getCol(record, ['Transfer Amount', 'Amount']) ?? '',
          desc: getCol(record, ['Description', 'Description / Purpose', 'Remarks']) || '',
          toUser: getCol(record, ['Transfer To User', 'Transfer To', 'Received By']) || '',
          status: getCol(record, ['Status']) || 'Pending',
          approvedBy: getCol(record, ['Approved By']) || '',
          approvedAt: getCol(record, ['Approved At']) || ''
        },
        fields: [
          { key: 'date', labelKey: 'field.transferDate', type: 'date' },
          { key: 'amount', labelKey: 'field.transferCashAmount', type: 'number' },
          { key: 'desc', labelKey: 'field.descriptionNarrative', type: 'textarea' },
          { key: 'toUser', labelKey: 'field.transferToUser', type: 'text' },
          { key: 'status', labelKey: 'col.status', type: 'text', readOnly: true },
          { key: 'approvedBy', labelKey: 'internalTransfer.approvedBy', type: 'text', readOnly: true },
          { key: 'approvedAt', labelKey: 'internalTransfer.approvedAt', type: 'text', readOnly: true }
        ]
      };

    case 'Expense_Transactions':
      return buildDualHeadEditForm(record, EXPENSE_TXN_FIELDS, EXPENSE_TXN_CATEGORIES, {
        txnIdCols: ['Transaction ID', 'Tracking ID', 'Txn ID', 'System Unique ID'],
        mainLabelKey: 'field.expenseParentHead',
        billKey: 'deposit',
        billLabelKey: 'field.totalDepositIncurred',
        payKey: 'paid',
        payLabelKey: 'field.actuallyPaidAmount',
        idPrefix: 'EXT'
      });

    case 'Creditor_Transactions':
      return buildDualHeadEditForm(record, CREDITOR_TXN_FIELDS, CREDITOR_TXN_CATEGORIES, {
        txnIdCols: ['Transaction ID', 'Tracking ID', 'Txn ID', 'System Unique ID'],
        mainLabelKey: 'field.creditorParentHead',
        billKey: 'received',
        billLabelKey: 'field.receivedAmountCashIn',
        payKey: 'returned',
        payLabelKey: 'field.returnAmountCashOut',
        idPrefix: 'CRD'
      });

    case 'Income_Transactions':
      return buildDualHeadEditForm(record, INCOME_TXN_FIELDS, INCOME_TXN_CATEGORIES, {
        txnIdCols: ['Transaction ID', 'Tracking ID', 'Txn ID', 'System Unique ID'],
        mainLabelKey: 'field.incomeParentHead',
        billKey: 'receivable',
        billLabelKey: 'field.receivableAmountBilled',
        payKey: 'received',
        payLabelKey: 'field.actuallyReceivedCashIn',
        idPrefix: 'INC'
      });

    case 'Capital_Transactions':
      return buildDualHeadEditForm(record, CAPITAL_TXN_FIELDS, CAPITAL_TXN_CATEGORIES, {
        txnIdCols: ['Transaction ID', 'Tracking ID', 'Txn ID', 'System Unique ID'],
        mainLabelKey: 'field.capitalParentHead',
        billKey: 'capin',
        billLabelKey: 'field.capitalInAmount',
        payKey: 'capout',
        payLabelKey: 'field.capitalOutAmount',
        idPrefix: 'CAP'
      });

    default:
      return { values: {}, fields: [] };
  }
}

function buildDualHeadEditForm(record, fieldMap, categories, opts) {
  const p = parseTxnDualAmounts(record, fieldMap);
  const category = getDualTxnCategory(record, fieldMap);
  const values = {
    date: formatDateInput(getCol(record, ['Date'])),
    txnId: getCol(record, opts.txnIdCols) || '',
    main: getCol(record, fieldMap.main) || '',
    sub: getCol(record, fieldMap.sub) || '',
    category,
    discount: p.discount,
    due: p.txnDue,
    remarks: getCol(record, fieldMap.remarks) || ''
  };
  values[opts.billKey] = p.bill;
  values[opts.payKey] = p.pay;

  const fields = [
    { key: 'date', labelKey: 'field.transactionDate', type: 'date' },
    { key: 'txnId', labelKey: 'col.trackingId', type: 'text', readOnly: true },
    { key: 'main', labelKey: opts.mainLabelKey, type: 'text' },
    { key: 'sub', labelKey: 'field.subHeadMapping', type: 'text' },
    { key: 'category', labelKey: 'field.categoryClassification', type: 'select', options: categories },
    { key: opts.billKey, labelKey: opts.billLabelKey, type: 'number' },
    { key: 'discount', labelKey: 'field.discountAllowed', type: 'number' },
    { key: opts.payKey, labelKey: opts.payLabelKey, type: 'number' },
    { key: 'due', labelKey: 'field.transactionDueBalance', type: 'number', readOnly: true },
    { key: 'remarks', labelKey: 'field.remarksNarrative', type: 'textarea' }
  ];

  return { values, fields, idPrefix: opts.idPrefix };
}

export function buildUpdateRowData(sheetName, original, values, user) {
  const loggedBy = loggedByFrom(original, user);
  const stamp = stampNow();
  const date = values.date ?? '';

  switch (sheetName) {
    case 'HR_Transactions':
      return [
        date,
        values.employee ?? '',
        roundMoney(parseFloat(values.amount) || 0),
        values.category ?? '',
        String(values.remarks ?? '').trim(),
        loggedBy,
        stamp
      ];

    case 'Supplier_Transactions': {
      const purchase = roundMoney(parseFloat(values.purchase) || 0);
      const discount = roundMoney(parseFloat(values.discount) || 0);
      const paid = roundMoney(parseFloat(values.paid) || 0);
      const category = values.category || 'Purchase';
      return [
        date,
        values.supplier ?? '',
        purchase,
        discount,
        paid,
        roundMoney(purchase - discount - paid),
        category,
        String(values.remarks ?? '').trim(),
        loggedBy,
        stamp
      ];
    }

    case 'Customer_Transactions': {
      const sold = roundMoney(parseFloat(values.sold) || 0);
      const discount = roundMoney(parseFloat(values.discount) || 0);
      const recv = roundMoney(parseFloat(values.received) || 0);
      return [
        date,
        values.uid ?? '',
        sold,
        discount,
        recv,
        values.method ?? 'Cash',
        roundMoney(sold - discount - recv),
        String(values.remarks ?? '').trim(),
        loggedBy,
        stamp
      ];
    }

    case 'Internal_Transfers':
      return [
        date,
        parseFloat(values.amount) || 0,
        String(values.desc ?? '').trim(),
        loggedBy,
        String(values.toUser ?? '').trim(),
        values.status || getCol(original, ['Status']) || 'Pending',
        values.approvedBy || getCol(original, ['Approved By']) || '',
        values.approvedAt || getCol(original, ['Approved At']) || '',
        stamp
      ];

    case 'Expense_Transactions': {
      const incurred = roundMoney(parseFloat(values.deposit) || 0);
      const discount = roundMoney(parseFloat(values.discount) || 0);
      const paid = roundMoney(parseFloat(values.paid) || 0);
      const category = values.category || 'Incurred';
      const txnId =
        values.txnId ||
        buildModuleTxnTrackingId('EXT', values.main, values.sub, date) ||
        `EXT-${Date.now()}`;
      return [
        txnId,
        date,
        values.main ?? '',
        values.sub ?? '',
        incurred,
        discount,
        paid,
        roundMoney(incurred - discount - paid),
        category,
        String(values.remarks ?? '').trim(),
        loggedBy,
        stamp
      ];
    }

    case 'Creditor_Transactions': {
      const received = parseFloat(values.received) || 0;
      const discount = parseFloat(values.discount) || 0;
      const returned = parseFloat(values.returned) || 0;
      const category = values.category || 'Received';
      const txnId =
        values.txnId ||
        buildModuleTxnTrackingId('CRD', values.main, values.sub, date) ||
        `CRD-${Date.now()}`;
      return [
        txnId,
        date,
        values.main ?? '',
        values.sub ?? '',
        received,
        discount,
        returned,
        received - discount - returned,
        category,
        String(values.remarks ?? '').trim(),
        loggedBy,
        stamp
      ];
    }

    case 'Income_Transactions': {
      const receivable = parseFloat(values.receivable) || 0;
      const discount = parseFloat(values.discount) || 0;
      const received = parseFloat(values.received) || 0;
      const category = values.category || 'Receivable';
      const txnId =
        values.txnId ||
        buildModuleTxnTrackingId('INC', values.main, values.sub, date) ||
        `INC-${Date.now()}`;
      return [
        txnId,
        date,
        values.main ?? '',
        values.sub ?? '',
        receivable,
        discount,
        received,
        receivable - discount - received,
        category,
        String(values.remarks ?? '').trim(),
        loggedBy,
        stamp
      ];
    }

    case 'Capital_Transactions': {
      const capin = parseFloat(values.capin) || 0;
      const discount = parseFloat(values.discount) || 0;
      const capout = parseFloat(values.capout) || 0;
      const category = values.category || 'Capital In';
      const txnId =
        values.txnId ||
        buildModuleTxnTrackingId('CAP', values.main, values.sub, date) ||
        `CAP-${Date.now()}`;
      return [
        txnId,
        date,
        values.main ?? '',
        values.sub ?? '',
        capin,
        discount,
        capout,
        capin - discount - capout,
        category,
        String(values.remarks ?? '').trim(),
        loggedBy,
        stamp
      ];
    }

    default:
      return [];
  }
}
