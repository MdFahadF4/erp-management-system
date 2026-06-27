import { apiRequest } from '../services/auth.js';

async function fetchSheet(sheetName) {
  try {
    return await apiRequest({ action: 'FETCH_RECORDS', payload: { sheetName } });
  } catch {
    return { success: false, records: [] };
  }
}

export async function fetchDashboardData() {
  await syncCustomerMaster().catch(() => null);
  const [
    customers,
    customerTxns,
    suppliers,
    supplierTxns,
    expenseTxns,
    hr,
    hrTxns,
    incomeHeads,
    incomeTxns,
    creditorHeads,
    creditorTxns,
    capitalTxns,
    internalTransfers,
    users
  ] = await Promise.all([
    fetchSheet('Customers'),
    fetchSheet('Customer_Transactions'),
    fetchSheet('Suppliers'),
    fetchSheet('Supplier_Transactions'),
    fetchSheet('Expense_Transactions'),
    fetchSheet('HR'),
    fetchSheet('HR_Transactions'),
    fetchSheet('Income_Heads'),
    fetchSheet('Income_Transactions'),
    fetchSheet('Creditor_Heads'),
    fetchSheet('Creditor_Transactions'),
    fetchSheet('Capital_Transactions'),
    fetchSheet('Internal_Transfers'),
    fetchSheet('Users')
  ]);

  return {
    customers,
    customerTxns,
    suppliers,
    supplierTxns,
    expenseTxns,
    hr,
    hrTxns,
    incomeHeads,
    incomeTxns,
    creditorHeads,
    creditorTxns,
    capitalTxns,
    internalTransfers,
    users
  };
}

export async function fetchCashDrawerData() {
  const [customers, customerTxns, expenseTxns, hrTxns, supplierTxns, internalTransfers, creditorTxns] =
    await Promise.all([
      fetchSheet('Customers'),
      fetchSheet('Customer_Transactions'),
      fetchSheet('Expense_Transactions'),
      fetchSheet('HR_Transactions'),
      fetchSheet('Supplier_Transactions'),
      fetchSheet('Internal_Transfers'),
      fetchSheet('Creditor_Transactions')
    ]);

  return { customers, customerTxns, expenseTxns, hrTxns, supplierTxns, internalTransfers, creditorTxns };
}

export async function createRecord(sheetName, rowData) {
  return apiRequest({ action: 'CREATE_RECORD', payload: { sheetName, rowData } });
}

export async function deleteRecord(sheetName, id) {
  return apiRequest({ action: 'DELETE_RECORD', payload: { sheetName, id } });
}

export async function updateRecord(sheetName, recordId, rowData) {
  return apiRequest({
    action: 'UPDATE_RECORD',
    payload: { sheetName, recordId, id: recordId, rowData }
  });
}

export async function syncDeliveryQueue() {
  return apiRequest({ action: 'SYNC_DELIVERY_QUEUE' });
}

export async function syncHrMaster() {
  return apiRequest({ action: 'SYNC_HR_MASTER' });
}

export async function syncCustomerMaster() {
  return apiRequest({ action: 'SYNC_CUSTOMER_MASTER' });
}

export async function fetchHrModuleData() {
  await syncHrMaster().catch(() => null);
  const [hr, hrTxns] = await Promise.all([fetchSheet('HR'), fetchSheet('HR_Transactions')]);
  return {
    hrRecords: hr.success ? hr.records : [],
    hrTxns: hrTxns.success ? hrTxns.records : []
  };
}

export async function fetchCustomerModuleData() {
  await syncCustomerMaster().catch(() => null);
  const [customers, customerTxns] = await Promise.all([
    fetchSheet('Customers'),
    fetchSheet('Customer_Transactions')
  ]);
  return {
    customers: customers.success ? customers.records : [],
    customerTxns: customerTxns.success ? customerTxns.records : []
  };
}

export async function syncSupplierMaster() {
  return apiRequest({ action: 'SYNC_SUPPLIER_MASTER' });
}

export async function fetchSupplierModuleData() {
  await syncSupplierMaster().catch(() => null);
  const [suppliers, supplierTxns] = await Promise.all([
    fetchSheet('Suppliers'),
    fetchSheet('Supplier_Transactions')
  ]);
  return {
    supplierRecords: suppliers.success ? suppliers.records : [],
    supplierTxns: supplierTxns.success ? supplierTxns.records : []
  };
}

export async function fetchHeadModuleData(headSheet, txnSheet) {
  const [heads, txns] = await Promise.all([fetchSheet(headSheet), fetchSheet(txnSheet)]);
  return {
    heads: heads.success ? heads.records : [],
    txns: txns.success ? txns.records : []
  };
}

export async function fetchInternalTransfers() {
  const res = await fetchSheet('Internal_Transfers');
  return res.success ? res.records : [];
}

export async function fetchDeliveryQueue() {
  const res = await fetchSheet('Delivery_Queue');
  return res.success ? res.records : [];
}

export async function fetchUsers() {
  const res = await fetchSheet('Users');
  return res.success ? res.records : [];
}

export async function createUser(newUser, actor) {
  return apiRequest({
    action: 'CREATE_USER',
    payload: {
      newUser,
      actorUsername: actor.username,
      actorRole: actor.role
    }
  });
}

export async function updateUser(payload) {
  return apiRequest({ action: 'UPDATE_USER', payload });
}

export async function fetchAllTransactionSheets() {
  const sheets = [
    'HR_Transactions',
    'Customer_Transactions',
    'Supplier_Transactions',
    'Expense_Transactions',
    'Creditor_Transactions',
    'Income_Transactions',
    'Capital_Transactions',
    'Internal_Transfers'
  ];
  const results = await Promise.all(sheets.map((s) => fetchSheet(s)));
  const out = {};
  sheets.forEach((name, i) => {
    out[name] = results[i].success ? results[i].records : [];
  });
  return out;
}
