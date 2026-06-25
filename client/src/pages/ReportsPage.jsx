import { useEffect } from 'react';
import { COMPANY_NAME, getCompanyLegalLine } from '../config/company.js';
import { initReportsSystem } from '../lib/reportsEngine.js';
import { initReportExportButtons } from '../lib/reportExport.js';

function todayIsoDate() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function ReportsPage() {
  useEffect(() => {
    const fromEl = document.getElementById('report-from');
    const toEl = document.getElementById('report-to');
    if (fromEl && !fromEl.value) fromEl.value = '2020-01-01';
    if (toEl && !toEl.value) toEl.value = todayIsoDate();

    initReportsSystem();
    initReportExportButtons();
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div className="erp-report-tools print:hidden">
        <div className="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">Enterprise Reporting System</h2>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              id="btn-report-print"
              type="button"
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded text-xs transition shadow-sm"
            >
              Print
            </button>
            <button
              id="btn-report-pdf"
              type="button"
              className="flex-1 sm:flex-none bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-2 rounded text-xs transition shadow-sm"
            >
              PDF
            </button>
            <button
              id="btn-report-word"
              type="button"
              className="flex-1 sm:flex-none bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-2 rounded text-xs transition shadow-sm"
            >
              Word
            </button>
            <button
              id="btn-report-excel"
              type="button"
              className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-2 rounded text-xs transition shadow-sm"
            >
              Excel
            </button>
            <button
              id="btn-report-ppt"
              type="button"
              className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-2 rounded text-xs transition shadow-sm"
            >
              PPT
            </button>
          </div>
        </div>

        <div
          id="report-filters-panel"
          className="bg-gray-50 border border-gray-200 p-3 md:p-4 rounded-lg mt-3 md:mt-4 mb-2 md:mb-0 flex flex-col md:flex-row md:flex-wrap md:items-end gap-3 md:gap-4 text-xs shadow-inner erp-report-filters"
        >
          <div className="w-full md:flex-1 md:min-w-[200px]">
            <label className="block text-gray-600 font-bold mb-1">Select Master Report</label>
            <select
              id="report-type"
              className="w-full border rounded p-2.5 outline-none bg-white focus:border-blue-500 font-medium text-sm"
              defaultValue=""
            >
              <option value="">-- Choose Report Type --</option>
              <option value="daily_monthly">Daily / Monthly Aggregate Report</option>
              <option value="daily_cashflow">Daily Accounts Cash Flow (IN &amp; OUT)</option>
              <option value="pnl">Profit &amp; Loss Report</option>
              <option value="receivable_payable">Receivable and Payable Report</option>
              <option value="expense_report">Expense Report</option>
              <option value="customer_details" className="font-bold text-blue-600">
                Customer Details Report (Statement)
              </option>
              <option value="customer_due_balance" className="font-bold text-red-600">
                Customer Due/Balance Report
              </option>
              <option value="supplier_details">Supplier Details Report</option>
              <option value="hr_details">HR Details Report</option>
              <option value="user_transaction">User Sells Performance Report</option>
              <option value="individual_user">Individual User Report</option>
              <option value="expense_details">Expense Details Report</option>
              <option value="creditor_details">Creditor Details Report</option>
              <option value="master_executive">Master Executive Dashboard</option>
              <option value="income_details">Income Details Report</option>
              <option value="capital_details">Capital Details Report</option>
            </select>
          </div>

          <div className="w-full md:flex-1 md:min-w-[150px] hidden" id="report-secondary-filter-container">
            <label className="block text-gray-600 font-bold mb-1" id="report-secondary-label">
              Specific Target
            </label>
            <select
              id="report-secondary-filter"
              className="w-full border rounded p-2.5 outline-none bg-white focus:border-blue-500 text-sm"
            />
          </div>

          <div className="w-full md:flex-1 md:min-w-[120px]">
            <label className="block text-gray-600 font-bold mb-1">From Date</label>
            <input
              type="date"
              id="report-from"
              defaultValue="2020-01-01"
              className="w-full border rounded p-2.5 outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div className="w-full md:flex-1 md:min-w-[120px]">
            <label className="block text-gray-600 font-bold mb-1">To Date</label>
            <input type="date" id="report-to" defaultValue={todayIsoDate()} className="w-full border rounded p-2.5 outline-none focus:border-blue-500 text-sm" />
          </div>
          <div id="report-date-filter-wrap" className="w-full md:flex-1 md:min-w-[170px] hidden">
            <label className="block text-gray-600 font-bold mb-1">Date Filter</label>
            <label className="flex items-center gap-2 border rounded p-2.5 bg-white cursor-pointer min-h-[44px]">
              <input type="checkbox" id="report-use-date-filter" className="rounded" />
              <span className="text-gray-600 font-bold text-[11px] leading-tight">Apply date range filter</span>
            </label>
          </div>
          <div className="w-full md:w-auto">
            <button
              id="btn-generate-report"
              type="button"
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded transition shadow-sm min-h-[44px]"
            >
              Execute Query
            </button>
          </div>
        </div>
      </div>

      <div id="report-results-anchor" aria-hidden="true" />

      <div className="bg-white p-3 md:p-5 rounded-xl shadow border border-gray-200 flex flex-col overflow-visible print:shadow-none print:border-none print:p-0 erp-report-results">
        <div id="report-print-header" className="hidden mb-4 md:mb-6 border-b pb-4 print:block">
          <div className="erp-report-print-meta flex items-start justify-between gap-4 px-2">
            <div className="erp-report-print-center flex-1 text-center">
              <h1 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-wide" id="report-company-name">
                {COMPANY_NAME}
              </h1>
              <p className="text-[10px] md:text-xs font-semibold text-gray-600 mt-1" id="report-company-legal">
                {getCompanyLegalLine()}
              </p>
              <h2 className="text-base md:text-xl font-bold text-gray-800 mt-3 uppercase tracking-wide" id="report-title-display">
                Report Name
              </h2>
              <p className="text-xs md:text-sm font-medium text-gray-500 mt-1" id="report-date-display">
                Date Range:{' '}
              </p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 break-words" id="report-target-display" />
              <p className="text-[10px] text-gray-500 mt-2" id="report-print-datetime" />
            </div>
            <div
              id="report-qr-code"
              className="shrink-0 w-28 h-28 md:w-32 md:h-32 flex items-center justify-center border border-gray-200 rounded bg-white print:block overflow-hidden"
              title="Scan for full report summary and details"
            />
          </div>
        </div>

        <div id="report-table-container" className="erp-report-panel border rounded-lg relative print:border-none bg-white order-1">
          <div className="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
            <table className="erp-report-table w-full text-left border-collapse text-xs">
              <thead
                id="report-table-head"
                className="bg-slate-800 text-white sticky top-0 z-10 shadow print:bg-gray-100 print:text-gray-800 print:shadow-none border-b"
              >
                <tr>
                  <th className="p-3 text-center text-gray-300 font-normal normal-case">
                    Select parameters and execute query to build report.
                  </th>
                </tr>
              </thead>
              <tbody id="report-table-body" className="divide-y text-gray-600 font-medium" />
            </table>
          </div>
        </div>

        <div
          id="report-summary-cards"
          className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6 hidden order-2 erp-report-summary-footer"
        />

        <div className="erp-print-page-footer hidden print:block text-center text-[10px] text-gray-500 pt-2 pb-8 order-3">
          <span id="report-print-footer-datetime" />
        </div>
      </div>
    </div>
  );
}
