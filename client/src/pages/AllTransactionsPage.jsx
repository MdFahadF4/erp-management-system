import { useMemo, useState } from 'react';
import { fetchAllTransactionSheets } from '../services/dataService.js';
import { defaultDateRange, filterRecordsByDateRange, parseRecordDate } from '../lib/hrEngine.js';
import { getCol } from '../lib/dualHeadEngine.js';

export default function AllTransactionsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const defaults = defaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [loaded, setLoaded] = useState(false);

  const rows = useMemo(() => {
    if (!loaded || !data) return [];
    const combined = [];
    Object.entries(data).forEach(([sheet, records]) => {
      const filtered = filterRecordsByDateRange(records, from, to) || [];
      filtered.forEach((rec) => {
        combined.push({
          id: rec.ID,
          sheet,
          date: getCol(rec, ['Date', 'Transaction Date']),
          summary: summarizeTxn(sheet, rec),
          user: getCol(rec, ['Logged By', 'Username', 'Transferred By']) || '',
          stamp: getCol(rec, ['Stamp', 'Timestamp']) || ''
        });
      });
    });
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data, from, to, loaded]);

  const load = async () => {
    if (!from || !to) {
      alert('Select both dates.');
      return;
    }
    setLoading(true);
    try {
      setData(await fetchAllTransactionSheets());
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 erp-module-page pb-6">
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold text-gray-800">All Transaction View</h2>
        <p className="text-xs text-gray-500 mt-1">Combined audit view across all transaction ledgers.</p>
      </div>
      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-wrap items-end gap-3 text-xs shadow-inner">
        <div>
          <label className="block font-bold text-gray-600 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded p-2" />
        </div>
        <div>
          <label className="block font-bold text-gray-600 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded p-2" />
        </div>
        <button type="button" onClick={load} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded">
          {loading ? 'Loading…' : 'Load All Transactions'}
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800 text-white uppercase">
            <tr>
              <th className="p-2.5">Date</th>
              <th className="p-2.5">Module</th>
              <th className="p-2.5">Summary</th>
              <th className="p-2.5">User</th>
              <th className="p-2.5">Stamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loaded ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 italic">
                  Select date range and load
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No transactions in range
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.sheet}-${row.id}`} className="hover:bg-gray-50">
                  <td className="p-2.5">{parseRecordDate(row.date)?.toLocaleDateString() || ''}</td>
                  <td className="p-2.5 font-bold text-blue-700">{row.sheet.replace(/_/g, ' ')}</td>
                  <td className="p-2.5">{row.summary}</td>
                  <td className="p-2.5">{row.user}</td>
                  <td className="p-2.5 text-gray-400 font-mono text-[10px]">{row.stamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function summarizeTxn(sheet, rec) {
  if (sheet.includes('HR')) return `${getCol(rec, ['Employee Name'])} — ${getCol(rec, ['Category'])} ${getCol(rec, ['Amount'])}`;
  if (sheet.includes('Customer')) return `${getCol(rec, ['System Unique ID'])} — Sold ${getCol(rec, ['Sold Amount'])} Rec ${getCol(rec, ['Received Amount'])}`;
  if (sheet.includes('Supplier')) return `${getCol(rec, ['Supplier Name'])} — ${getCol(rec, ['Category'])}`;
  if (sheet.includes('Internal')) return `Transfer SAR ${getCol(rec, ['Amount'])} to ${getCol(rec, ['Transfer To User']) || '-'}`;
  return getCol(rec, ['Remarks', 'Remarks / Reference']) || getCol(rec, ['Category']) || '-';
}
