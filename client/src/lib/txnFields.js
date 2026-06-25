export const CREDITOR_TXN_FIELDS = {
  main: ['Creditor Parent Head', 'Parent Head', 'Main Head'],
  sub: ['Sub Head', 'SubCategory'],
  bill: ['Received Amount', 'Received Amt'],
  discount: ['Discount', 'Discount Allowed'],
  pay: ['Return Amount', 'Return Amt'],
  due: ['Transaction Due', 'Txn Due'],
  remarks: ['Remarks', 'Remarks / Reference', 'Description'],
  categories: { bill: 'Received', pay: 'Return', prev: 'Previous Due' }
};

export const INCOME_TXN_FIELDS = {
  main: ['Income Parent Head', 'Parent Head', 'Main Head'],
  sub: ['Sub Head', 'SubCategory'],
  bill: ['Receivable Amount', 'Receivable'],
  discount: ['Discount', 'Discount Allowed'],
  pay: ['Received Amount', 'Received Amt'],
  due: ['Transaction Due', 'Txn Due'],
  remarks: ['Remarks', 'Remarks / Reference', 'Description'],
  categories: { bill: 'Receivable', pay: 'Received', prev: 'Previous Due' }
};

export const CAPITAL_TXN_FIELDS = {
  main: ['Capital Parent Head', 'Parent Head', 'Main Head'],
  sub: ['Sub Head', 'SubCategory'],
  bill: ['Capital In Amount', 'Capital In Amt', 'Capital In'],
  discount: ['Discount', 'Discount Allowed'],
  pay: ['Capital Out Amount', 'Capital Out Amt', 'Capital Out'],
  due: ['Transaction Due', 'Txn Due', 'Transaction Net'],
  remarks: ['Remarks', 'Remarks / Reference', 'Description'],
  categories: { bill: 'Capital In', pay: 'Capital Out', prev: 'Previous Due' }
};

export const EXPENSE_TXN_FIELDS = {
  main: ['Expense Parent Head', 'Parent Category', 'Parent Head', 'Main Head'],
  sub: ['Sub Head', 'Sub Head Name', 'SubCategory'],
  bill: [
    'Incurred Amount',
    'Total Deposit Incurred Amt',
    'Total Deposit',
    'Deposit/Incurred',
    'Deposit',
    'Incurred',
    'Bill Amount'
  ],
  discount: ['Discount', 'Discount Allowed'],
  pay: ['Payment Paid', 'Paid Amt', 'Paid Amount', 'Amount Paid'],
  due: ['Transaction Due', 'Txn Due'],
  remarks: ['Remarks / Vouchers', 'Remarks', 'Description'],
  categories: { bill: 'Incurred', pay: 'Payment Paid', prev: 'Previous Due' }
};
