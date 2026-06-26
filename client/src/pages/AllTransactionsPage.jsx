import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminTxnLedgerActions from '../components/AdminTxnLedgerActions.jsx';
import { fetchAllTransactionSheets } from '../services/dataService.js';
import { getCol } from '../lib/dualHeadEngine.js';
import { filterRecordsByDateRange, parseRecordDate, todayDateRange, getHrTxnCategory } from '../lib/hrEngine.js';
import { parseTxnDualAmounts, parseSupplierTxnAmounts } from '../lib/txnParsers.js';
import {
  CAPITAL_TXN_FIELDS,
  CREDITOR_TXN_FIELDS,
  EXPENSE_TXN_FIELDS,
  INCOME_TXN_FIELDS
} from '../lib/txnFields.js';
import { getAllTxnModuleLabel } from '../../../js/i18n.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

const MODULE_COLORS = {
  HR: 'bg-blue-100 text-blue-800',
  Supplier: 'bg-purple-100 text-purple-800',
  Customer: 'bg-emerald-100 text-emerald-800',
  Expense: 'bg-red-100 text-red-800',
  Creditor: 'bg-orange-100 text-orange-800',
  Income: 'bg-indigo-100 text-indigo-800',
  Capital: 'bg-violet-100 text-violet-800',
  Internal: 'bg-teal-100 text-teal-800'
};

export default function AllTransactionsPage({ user, onDataChange }) {
  const { t } = useI18n();
  const defaults = todayDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!from || !to) {
      alert(t('alert.selectBothDates'));
      return;
    }
    setLoading(true);
    try {
      setData(await fetchAllTransactionSheets());
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [from, to, t]);

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    if (!loaded || !data) return [];
    const combined = [];
    Object.entries(data).forEach(([sheet, records]) => {
      const filtered = filterRecordsByDateRange(records, from, to) || [];
      filtered.forEach((rec) => {
        const mapped = mapAllTxnRow(sheet, rec);
        combined.push({ ...mapped, id: rec.ID, sheet, rawRec: rec });
      });
    });
    return combined.sort((a, b) => (b.rawDate?.getTime() || 0) - (a.rawDate?.getTime() || 0));
  }, [data, from, to, loaded]);

  const reload = async () => {
    await load();
    onDataChange?.();
  };

  return (
    <div className="space-y-4 erp-module-page pb-6">
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold text-gray-800">{t('page.allTransactions.title')}</h2>
        <p className="text-xs text-gray-500 mt-1">{t('allTxn.auditSubtitle')}</p>
      </div>
      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-wrap items-end gap-3 text-xs shadow-inner">
        <div>
          <label className="block font-bold text-gray-600 mb-1">{t('common.fromDate')}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded p-2" />
        </div>
        <div>
          <label className="block font-bold text-gray-600 mb-1">{t('common.toDate')}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded p-2" />
        </div>
        <button type="button" onClick={load} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded disabled:opacity-60">
          {loading ? t('common.loading') : t('common.executeQuery')}
        </button>
      </div>
      <div className="erp-ledger-wrap bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800 text-white uppercase">
            <tr>
              <th className="p-2.5">{t('allTxn.colDate')}</th>
              <th className="p-2.5">{t('allTxn.colModule')}</th>
              <th className="p-2.5">{t('allTxn.colDetails')}</th>
              <th className="p-2.5">{t('allTxn.colFinancial')}</th>
              <th className="p-2.5">{t('allTxn.colRemarks')}</th>
              <th className="p-2.5">{t('allTxn.colLoggedBy')}</th>
              <th className="p-2.5">{t('allTxn.colStamp')}</th>
              <th className="p-2.5 erp-col-actions">{t('allTxn.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && !loaded ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-blue-500 animate-pulse">
                  {t('allTxn.aggregating')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  {t('allTxn.noResultsRange')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.sheet}-${row.id}`} className="hover:bg-gray-50">
                  <td className="p-2.5 erp-cell-nowrap">{row.rawDate ? row.rawDate.toLocaleDateString() : ''}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${MODULE_COLORS[row.module] || 'bg-gray-100 text-gray-700'}`}>
                      {getAllTxnModuleLabel(row.module)}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-gray-800 break-words">{row.details}</td>
                  <td className="p-2.5 font-mono text-gray-700 break-words">{row.financial}</td>
                  <td className="p-2.5 break-words">{row.remarks}</td>
                  <td className="p-2.5 break-words">{row.user}</td>
                  <td className="p-2.5 text-gray-400 font-mono text-[10px] break-words">{row.stamp}</td>
                  <AdminTxnLedgerActions user={user} sheetName={row.sheet} record={row.rawRec} onMutate={reload} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function mapAllTxnRow(sheet, rec) {
  const rawDate = parseRecordDate(getCol(rec, ['Date', 'Transaction Date']));
  if (sheet === 'HR_Transactions') {
    const amt = Number(getCol(rec, ['Amount', 'Amt']) || 0).toFixed(2);
    return {
      module: 'HR',
      rawDate,
      details: `${getCol(rec, ['Employee Name']) || '-'} — ${getHrTxnCategory(rec)}`,
      financial: `SAR ${amt}`,
      remarks: getCol(rec, ['Remarks', 'Remarks / Reference']) || '-',
      user: getCol(rec, ['Username', 'Logged By']) || '',
      stamp: getCol(rec, ['Timestamp', 'Stamp']) || ''
    };
  }
  if (sheet === 'Supplier_Transactions') {
    const p = parseSupplierTxnAmounts(rec);
    return {
      module: 'Supplier',
      rawDate,
      details: getCol(rec, ['Supplier Name']) || '-',
      financial: `Pur ${p.bill.toFixed(2)} | Paid ${p.pay.toFixed(2)} | Due ${p.txnDue.toFixed(2)}`,
      remarks: getCol(rec, ['Remarks / Reference', 'Remarks']) || '-',
      user: getCol(rec, ['Username', 'Logged By']) || '',
      stamp: getCol(rec, ['Timestamp', 'Stamp']) || ''
    };
  }
  if (sheet === 'Customer_Transactions') {
    return {
      module: 'Customer',
      rawDate,
      details: `${getCol(rec, ['System Unique ID']) || '-'} — ${getCol(rec, ['Payment Method']) || '-'}`,
      financial: `Sold ${Number(getCol(rec, ['Sold Amount']) || 0).toFixed(2)} | Rec ${Number(getCol(rec, ['Received Amount']) || 0).toFixed(2)}`,
      remarks: getCol(rec, ['Remarks / Reference', 'Remarks']) || '-',
      user: getCol(rec, ['Username', 'Logged By']) || '',
      stamp: getCol(rec, ['Timestamp', 'Stamp']) || ''
    };
  }
  if (sheet === 'Internal_Transfers') {
    return {
      module: 'Internal',
      rawDate,
      details: `Transfer → ${getCol(rec, ['Transfer To User', 'Transfer To']) || '-'}`,
      financial: `SAR ${Number(getCol(rec, ['Amount', 'Transfer Amount']) || 0).toFixed(2)}`,
      remarks: getCol(rec, ['Remarks', 'Description']) || '-',
      user: getCol(rec, ['Transferred By', 'Username']) || '',
      stamp: getCol(rec, ['Timestamp', 'Stamp', 'System Stamp']) || ''
    };
  }
  if (sheet === 'Expense_Transactions') {
    const a = parseTxnDualAmounts(rec, EXPENSE_TXN_FIELDS);
    return {
      module: 'Expense',
      rawDate,
      details: `${getCol(rec, EXPENSE_TXN_FIELDS.main) || '-'} > ${getCol(rec, EXPENSE_TXN_FIELDS.sub) || '-'}`,
      financial: `Inc ${a.bill.toFixed(2)} | Paid ${a.pay.toFixed(2)} | Due ${a.txnDue.toFixed(2)}`,
      remarks: getCol(rec, EXPENSE_TXN_FIELDS.remarks) || '-',
      user: getCol(rec, ['Username', 'Logged By']) || '',
      stamp: getCol(rec, ['Timestamp', 'Stamp']) || ''
    };
  }
  if (sheet === 'Creditor_Transactions') {
    const a = parseTxnDualAmounts(rec, CREDITOR_TXN_FIELDS);
    return {
      module: 'Creditor',
      rawDate,
      details: `${getCol(rec, CREDITOR_TXN_FIELDS.main) || '-'} > ${getCol(rec, CREDITOR_TXN_FIELDS.sub) || '-'}`,
      financial: `Recv ${a.bill.toFixed(2)} | Ret ${a.pay.toFixed(2)} | Due ${a.txnDue.toFixed(2)}`,
      remarks: getCol(rec, CREDITOR_TXN_FIELDS.remarks) || '-',
      user: getCol(rec, ['Username', 'Logged By']) || '',
      stamp: getCol(rec, ['Timestamp', 'Stamp']) || ''
    };
  }
  if (sheet === 'Income_Transactions') {
    const a = parseTxnDualAmounts(rec, INCOME_TXN_FIELDS);
    return {
      module: 'Income',
      rawDate,
      details: `${getCol(rec, INCOME_TXN_FIELDS.main) || '-'} > ${getCol(rec, INCOME_TXN_FIELDS.sub) || '-'}`,
      financial: `Bill ${a.bill.toFixed(2)} | Rec ${a.pay.toFixed(2)} | Due ${a.txnDue.toFixed(2)}`,
      remarks: getCol(rec, INCOME_TXN_FIELDS.remarks) || '-',
      user: getCol(rec, ['Username', 'Logged By']) || '',
      stamp: getCol(rec, ['Timestamp', 'Stamp']) || ''
    };
  }
  if (sheet === 'Capital_Transactions') {
    const a = parseTxnDualAmounts(rec, CAPITAL_TXN_FIELDS);
    return {
      module: 'Capital',
      rawDate,
      details: `${getCol(rec, CAPITAL_TXN_FIELDS.main) || '-'} > ${getCol(rec, CAPITAL_TXN_FIELDS.sub) || '-'}`,
      financial: `In ${a.bill.toFixed(2)} | Out ${a.pay.toFixed(2)} | Due ${a.txnDue.toFixed(2)}`,
      remarks: getCol(rec, CAPITAL_TXN_FIELDS.remarks) || '-',
      user: getCol(rec, ['Username', 'Logged By']) || '',
      stamp: getCol(rec, ['Timestamp', 'Stamp']) || ''
    };
  }
  return {
    module: sheet.replace(/_/g, ' '),
    rawDate,
    details: '-',
    financial: '-',
    remarks: getCol(rec, ['Remarks']) || '-',
    user: '',
    stamp: ''
  };
}
