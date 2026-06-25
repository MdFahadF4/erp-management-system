import { useCallback, useEffect, useMemo, useState } from 'react';
import { COMPANY_NAME, companyLegalLine } from '../config/company.js';
import { fetchHrModuleData } from '../services/dataService.js';
import { finalizeHrFactoryPrintLayout } from '../lib/reportExport.js';
import {
  buildHrDetailsDateRange,
  buildHrLedgerRow,
  computeHrDetailsReport,
  defaultDateRange,
  fmtMoney,
  getCol,
  getHrEmployeeName,
  isHrFactoryDesignation
} from '../lib/hrEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

function formatPrintDateTime() {
  return new Date().toLocaleString();
}

export default function HrFactoryPage({ user }) {
  const canEdit = userCanEditModule(user, 'hr_factory');
  const [activeTab, setActiveTab] = useState('ledger');
  const [hrRecords, setHrRecords] = useState([]);
  const [hrTxns, setHrTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaults = defaultDateRange();
  const [employee, setEmployee] = useState('');
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportMeta, setReportMeta] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHrModuleData();
      setHrRecords(data.hrRecords);
      setHrTxns(data.hrTxns);
    } catch (err) {
      console.error('Failed to load HR factory data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!reportVisible || !reportData || !reportMeta || reportLoading) return;
    finalizeHrFactoryPrintLayout({
      title: reportMeta.title,
      dateRange: reportMeta.dateRange,
      target: reportMeta.target
    });
  }, [reportVisible, reportData, reportMeta, reportLoading]);

  const factoryRecords = useMemo(
    () =>
      hrRecords.filter((rec) =>
        isHrFactoryDesignation(getCol(rec, ['Designation']) || rec['Designation'])
      ),
    [hrRecords]
  );

  const factoryRows = useMemo(
    () => factoryRecords.map((rec) => buildHrLedgerRow(rec, hrTxns, canEdit)),
    [factoryRecords, hrTxns, canEdit]
  );

  const employeeOptions = useMemo(
    () =>
      factoryRecords.map((emp) => ({
        name: getHrEmployeeName(emp),
        designation: getCol(emp, ['Designation']) || '-'
      })),
    [factoryRecords]
  );

  const handleExecuteQuery = async () => {
    if (!employee) {
      alert('Please select an employee.');
      return;
    }
    if (!fromDate || !toDate) {
      alert('Please select both From and To dates.');
      return;
    }

    setReportLoading(true);
    setReportVisible(true);
    try {
      const data = await fetchHrModuleData();
      setHrTxns(data.hrTxns);
      const report = computeHrDetailsReport(employee, fromDate, toDate, data.hrTxns);
      setReportData(report);

      const selected = employeeOptions.find((o) => o.name === employee);
      const label = selected ? `${selected.name} (${selected.designation})` : employee;
      const { fDate, tDate } = buildHrDetailsDateRange(fromDate, toDate);
      setReportMeta({
        title: 'Factory Details Report',
        dateRange: `${fDate.toLocaleDateString()} to ${tDate.toLocaleDateString()}`,
        target: label,
        printedAt: formatPrintDateTime()
      });
    } catch {
      alert('Failed to load factory details report.');
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportVisible || !reportData) {
      alert('Run a query first.');
      return;
    }
    document.body.classList.add('erp-print-hr-factory');
    const cleanup = () => document.body.classList.remove('erp-print-hr-factory');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  };

  const tabClass = (tab) => {
    const active = activeTab === tab;
    return active
      ? 'px-4 py-2 rounded-lg text-sm font-bold transition bg-amber-600 text-white shadow-sm'
      : 'px-4 py-2 rounded-lg text-sm font-bold transition bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  return (
    <div id="hr-factory-root" className="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold text-gray-800">HR Factory</h2>
        <p className="text-xs text-gray-500 mt-1">
          Factory-designation personnel — master ledger list and date-wise details report.
        </p>
        <div className="hr-factory-tab-bar flex flex-wrap gap-2 mt-4">
          <button type="button" className={tabClass('ledger')} onClick={() => setActiveTab('ledger')}>
            Factory Ledger
          </button>
          <button type="button" className={tabClass('details')} onClick={() => setActiveTab('details')}>
            Factory Details Report
          </button>
        </div>
      </div>

      {activeTab === 'ledger' && (
        <div id="hr-factory-panel-ledger" className="bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 flex flex-col w-full">
          <h3 className="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider">
            Factory Personnel Ledger
          </h3>
          <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap sticky top-0 z-[1]">
                <tr>
                  <th className="p-2.5">Employee Name</th>
                  <th className="p-2.5">Designation</th>
                  <th className="p-2.5">Join Date</th>
                  <th className="p-2.5">Start Sal</th>
                  <th className="p-2.5">Increment</th>
                  <th className="p-2.5">Current Sal</th>
                  <th className="p-2.5">Total Earn</th>
                  <th className="p-2.5">Paid</th>
                  <th className="p-2.5">Due/Balance</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 erp-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody id="table-hr-factory-rows" className="divide-y divide-gray-100 text-gray-600 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-3 text-center text-gray-400">
                      Querying factory ledger…
                    </td>
                  </tr>
                ) : factoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-3 text-center text-gray-400">
                      No factory-designation employees found. Add staff with &quot;factory&quot; in designation.
                    </td>
                  </tr>
                ) : (
                  factoryRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="p-2.5 font-bold text-gray-900">{row.empName}</td>
                      <td className="p-2.5">{row.designation}</td>
                      <td className="p-2.5">{row.joinDate}</td>
                      <td className="p-2.5 font-mono">{fmtMoney(row.baseSalary)}</td>
                      <td className="p-2.5 font-mono text-purple-600">+{fmtMoney(row.totalInc)}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-600">{fmtMoney(row.currentSalary)}</td>
                      <td className="p-2.5 font-mono text-amber-600">{fmtMoney(row.dbEarned)}</td>
                      <td className="p-2.5 font-mono text-emerald-600">{fmtMoney(row.dbPaid)}</td>
                      <td className="p-2.5 font-mono font-bold text-red-600">{fmtMoney(row.dbDue)}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${row.badgeClass}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-2.5 erp-col-actions">
                        {row.canEdit ? (
                          <span className="text-gray-400 text-[10px] italic">Edit (soon)</span>
                        ) : (
                          <span className="text-gray-300 italic text-[10px]">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p id="hr-factory-count" className="text-[11px] text-gray-500 mt-2 font-medium">
            {!loading && factoryRows.length > 0 ? `Total factory workers: ${factoryRows.length}` : ''}
          </p>
        </div>
      )}

      {activeTab === 'details' && (
        <div id="hr-factory-panel-details" className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 p-3 md:p-4 rounded-lg flex flex-col md:flex-row md:flex-wrap md:items-end gap-3 md:gap-4 text-xs shadow-inner erp-mobile-filter-bar">
            <div className="w-full md:flex-1 md:min-w-[180px]">
              <label className="block text-gray-600 font-bold mb-1">Select Employee</label>
              <select
                id="hr-factory-details-employee"
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                className="w-full border border-gray-200 rounded p-2.5 outline-none bg-white focus:border-amber-500 text-sm font-medium"
              >
                <option value="">
                  {employeeOptions.length === 0 ? 'No factory employees' : '-- Select Employee --'}
                </option>
                {employeeOptions.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.name} ({opt.designation})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:flex-1 md:min-w-[120px]">
              <label className="block text-gray-600 font-bold mb-1">From Date</label>
              <input
                type="date"
                id="hr-factory-details-from"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-gray-200 rounded p-2.5 outline-none focus:border-amber-500 text-sm"
              />
            </div>
            <div className="w-full md:flex-1 md:min-w-[120px]">
              <label className="block text-gray-600 font-bold mb-1">To Date</label>
              <input
                type="date"
                id="hr-factory-details-to"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-gray-200 rounded p-2.5 outline-none focus:border-amber-500 text-sm"
              />
            </div>
            <div className="w-full md:w-auto">
              <button
                type="button"
                id="btn-hr-factory-details"
                onClick={handleExecuteQuery}
                className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded transition shadow-sm min-h-[44px]"
              >
                Execute Query
              </button>
            </div>
          </div>

          {reportVisible && (
            <>
              <div
                id="hr-factory-export-toolbar"
                className="hr-factory-export-toolbar print:hidden flex flex-wrap gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded text-xs transition shadow-sm"
                >
                  Print
                </button>
              </div>

              <div
                id="hr-factory-report-results"
                className="erp-factory-report-results erp-report-results bg-white p-3 md:p-5 rounded-xl shadow border border-gray-200 flex flex-col overflow-visible print:shadow-none print:border-none print:p-0"
              >
                <div id="hr-factory-report-print-header" className="hidden mb-4 md:mb-6 border-b border-gray-200 pb-4 print:block">
                  <div className="erp-report-print-meta flex items-start justify-between gap-4 px-2">
                    <div className="erp-report-print-center flex-1 text-center">
                      <h1
                        id="hr-factory-report-company-name"
                        className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-wide"
                      >
                        {COMPANY_NAME}
                      </h1>
                      <p id="hr-factory-report-company-legal" className="text-[10px] md:text-xs font-semibold text-gray-600 mt-1">
                        {companyLegalLine()}
                      </p>
                      <h2
                        id="hr-factory-report-title-display"
                        className="text-base md:text-xl font-bold text-gray-800 mt-3 uppercase tracking-wide"
                      >
                        {reportMeta?.title || 'Factory Details Report'}
                      </h2>
                      <p id="hr-factory-report-date-display" className="text-xs md:text-sm font-medium text-gray-500 mt-1">
                        {reportMeta?.dateRange}
                      </p>
                      <p id="hr-factory-report-target-display" className="text-sm md:text-base font-bold text-gray-900 mt-2 break-words">
                        {reportMeta?.target}
                      </p>
                      <p id="hr-factory-report-print-datetime" className="text-[10px] text-gray-500 mt-2">
                        Printed: {reportMeta?.printedAt}
                      </p>
                    </div>
                    <div
                      id="hr-factory-report-qr-code"
                      className="shrink-0 w-28 h-28 md:w-32 md:h-32 flex items-center justify-center border border-gray-200 rounded bg-white print:block overflow-hidden"
                      title="Scan for full report summary and details"
                    />
                  </div>
                </div>

                {reportLoading ? (
                  <div className="p-6 text-center text-blue-500 font-bold animate-pulse">Running query…</div>
                ) : reportData ? (
                  <>
                    <div id="hr-factory-details-summary" className="grid grid-cols-1 mb-6">
                      <div className="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
                        <div className="flex flex-wrap justify-between border-b border-gray-100 pb-4 gap-4">
                          <div className="text-left">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                              Lifetime Total Earned
                            </div>
                            <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                              SAR {fmtMoney(reportData.globalEarn)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                              Lifetime Salary Paid
                            </div>
                            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                              SAR {fmtMoney(reportData.globalPaid)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                              Current Due Balance
                            </div>
                            <div
                              className={`text-2xl font-black font-mono mt-1 ${
                                reportData.globalDue > 0 ? 'text-red-600' : 'text-emerald-600'
                              }`}
                            >
                              SAR {fmtMoney(reportData.globalDue)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-around bg-gray-50 p-4 rounded-lg flex-wrap gap-4">
                          <div className="text-center">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                              Range Earned ({reportData.fDate.toLocaleDateString()} –{' '}
                              {reportData.tDate.toLocaleDateString()})
                            </div>
                            <div className="text-lg font-bold text-blue-500 font-mono mt-1">
                              SAR {fmtMoney(reportData.hrRangeEarn)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                              Range Paid ({reportData.fDate.toLocaleDateString()} –{' '}
                              {reportData.tDate.toLocaleDateString()})
                            </div>
                            <div className="text-lg font-bold text-emerald-500 font-mono mt-1">
                              SAR {fmtMoney(reportData.hrRangePaid)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div id="hr-factory-details-table" className="erp-report-panel order-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:border-none">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start p-3 md:p-4">
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">
                            Salary Earned Ledger
                          </div>
                          <div className="erp-report-ledger-wrap overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                <tr>
                                  <th className="p-2.5 font-semibold">Earned Date</th>
                                  <th className="p-2.5 font-semibold">Amount</th>
                                  <th className="p-2.5 font-semibold">Remarks</th>
                                  <th className="p-2.5 font-semibold">User</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {reportData.hrEarns.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="p-6 text-center text-gray-400">
                                      No earnings in selected range.
                                    </td>
                                  </tr>
                                ) : (
                                  reportData.hrEarns.map((s, i) => (
                                    <tr key={`earn-${i}`} className="hover:bg-gray-50">
                                      <td className="p-2.5 whitespace-nowrap">
                                        {new Date(s.d).toLocaleDateString()}
                                      </td>
                                      <td className="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                                        {fmtMoney(s.amt)}
                                        <br />
                                        <span className="text-[9px] text-gray-400 font-normal leading-none">
                                          {s.type}
                                        </span>
                                      </td>
                                      <td className="p-2.5 break-words">{s.rem}</td>
                                      <td className="p-2.5">{s.usr}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">
                            Salary Paid Ledger
                          </div>
                          <div className="erp-report-ledger-wrap overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                <tr>
                                  <th className="p-2.5 font-semibold">Payment Date</th>
                                  <th className="p-2.5 font-semibold">Amount</th>
                                  <th className="p-2.5 font-semibold">Remarks</th>
                                  <th className="p-2.5 font-semibold">User</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {reportData.hrPayments.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="p-6 text-center text-gray-400">
                                      No payments in selected range.
                                    </td>
                                  </tr>
                                ) : (
                                  reportData.hrPayments.map((p, i) => (
                                    <tr key={`pay-${i}`} className="hover:bg-gray-50">
                                      <td className="p-2.5 whitespace-nowrap">
                                        {new Date(p.d).toLocaleDateString()}
                                      </td>
                                      <td className="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">
                                        {fmtMoney(p.amt)}
                                      </td>
                                      <td className="p-2.5 break-words">{p.rem}</td>
                                      <td className="p-2.5">{p.usr}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-red-500 font-bold">Failed to load report.</div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
