import { fmtMoney } from '../lib/recordHelpers.js';

function StatCard({ label, value, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</div>
      <div className="font-mono font-bold text-base text-gray-700">
        SAR <span>{fmtMoney(value)}</span>
      </div>
    </div>
  );
}

function rankBadgeClass(rank) {
  if (rank === 1) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (rank === 2) return 'bg-slate-200 text-slate-700 border-slate-300';
  if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

export default function DashboardPage({ metrics, loading, onRefresh, refreshing }) {
  const t = metrics?.totals;

  return (
    <div className="space-y-6 pb-10">
      <div className="border-b border-gray-200 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Executive Dashboard</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || refreshing}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait text-white font-bold px-4 py-2 rounded shadow-sm text-xs uppercase tracking-wider transition"
        >
          {refreshing ? 'Refreshing…' : loading ? 'Loading…' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Market Receivable</h3>
          <div className="text-4xl font-black font-mono tracking-tight">
            SAR {loading ? '…' : fmtMoney(t?.tRecv)}
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Enterprise Payable</h3>
          <div className="text-4xl font-black font-mono tracking-tight">
            SAR {loading ? '…' : fmtMoney(t?.tPay)}
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mt-2">
        Current Month User Sales Performance
      </h3>
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-gray-100 pb-3">
          <div>
            <h4 className="font-bold text-blue-800 text-base md:text-lg">Sales Ranking (This Month)</h4>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              Ranked by sold amount — day 1 through last day of this month
            </p>
          </div>
          <span className="self-start sm:self-auto bg-blue-100 text-blue-800 text-[10px] px-2.5 py-1 rounded font-bold whitespace-nowrap">
            {metrics?.salesLeaderboard?.label || '—'}
          </span>
        </div>
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full text-left text-xs border-collapse min-w-[320px]">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase whitespace-nowrap">
              <tr>
                <th className="p-2.5 font-semibold w-12 text-center">Rank</th>
                <th className="p-2.5 font-semibold">Username</th>
                <th className="p-2.5 font-semibold text-right">Sold Amount</th>
                <th className="p-2.5 font-semibold text-right">Received Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-blue-500 font-bold animate-pulse text-[11px]">
                    Calculating monthly sales performance…
                  </td>
                </tr>
              ) : metrics?.salesLeaderboard?.ranked?.length ? (
                metrics.salesLeaderboard.ranked.map((row, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr key={row.name} className={`hover:bg-gray-50 ${rank <= 3 ? 'bg-gray-50' : ''}`}>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 rounded border text-[10px] font-bold ${rankBadgeClass(rank)}`}
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-gray-800 capitalize">{row.name}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                        SAR {fmtMoney(row.sold)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        SAR {fmtMoney(row.recv)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400 font-semibold">
                    No sales recorded for this month yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mt-4">
        Revenue Streams (Lifetime)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-blue-800 text-lg">Customer Sales</h4>
            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-bold">LIFETIME</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Sold" value={t?.saleSold} />
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Balance</div>
              <div className="font-mono font-bold text-lg text-red-500">SAR {fmtMoney(t?.saleDue)}</div>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-3 mt-1">
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Received</div>
                <div className="font-mono font-black text-2xl text-emerald-600">SAR {fmtMoney(t?.saleRecv)}</div>
                <div className="text-xs font-medium text-gray-500 mt-1 flex gap-4">
                  <span>
                    Cash: <b className="text-emerald-500 font-mono">{fmtMoney(t?.saleCash)}</b>
                  </span>
                  <span>
                    Card: <b className="text-blue-500 font-mono">{fmtMoney(t?.saleCard)}</b>
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Discount</div>
                <div className="font-mono font-black text-2xl text-purple-600">SAR {fmtMoney(t?.saleDiscount)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-indigo-800 text-lg">Other Income</h4>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-1 rounded font-bold">LIFETIME</span>
          </div>
          <div className="space-y-4 mt-2 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Initiated / Billed</div>
              <div className="font-mono font-bold text-gray-800 text-lg">SAR {fmtMoney(t?.incBilled)}</div>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Received</div>
              <div className="font-mono font-bold text-emerald-600 text-lg">SAR {fmtMoney(t?.incRecv)}</div>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Discount</div>
              <div className="font-mono font-bold text-purple-600 text-lg">SAR {fmtMoney(t?.incDiscount)}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Due / Balance</div>
              <div className="font-mono font-bold text-red-500 text-lg">SAR {fmtMoney(t?.incDue)}</div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mt-4">
        Owner Capital & Equity (Lifetime)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-2">
        <div className="bg-white border border-violet-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-violet-800 mb-3 border-b border-gray-200 pb-2">Owner&apos;s Capital</h4>
          <div className="space-y-3">
            <StatCard label="Total Capital In" value={t?.capIn} />
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Capital Out</div>
              <div className="font-mono font-bold text-emerald-600 text-base">SAR {fmtMoney(t?.capOut)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Net Capital Balance</div>
              <div className="font-mono font-bold text-violet-600 text-base">SAR {fmtMoney(t?.capNet)}</div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mt-4">
        Expenditures & Liabilities (Lifetime)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Supplier Purchases</h4>
          <div className="space-y-3">
            <StatCard label="Total Purchased" value={t?.purPur} />
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Discount</div>
              <div className="font-mono font-bold text-purple-600 text-base">SAR {fmtMoney(t?.purDiscount)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Paid</div>
              <div className="font-mono font-bold text-emerald-600 text-base">SAR {fmtMoney(t?.purPaid)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Balance</div>
              <div className="font-mono font-bold text-red-500 text-base">SAR {fmtMoney(t?.purDue)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Operational Expenses</h4>
          <div className="space-y-3">
            <StatCard label="Total Incurred" value={t?.expInc} />
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Discount</div>
              <div className="font-mono font-bold text-purple-600 text-base">SAR {fmtMoney(t?.expDiscount)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Paid</div>
              <div className="font-mono font-bold text-emerald-600 text-base">SAR {fmtMoney(t?.expPaid)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Balance</div>
              <div className="font-mono font-bold text-red-500 text-base">SAR {fmtMoney(t?.expDue)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-orange-800 mb-3 border-b border-gray-200 pb-2">HR & Payroll</h4>
          <div className="space-y-3">
            <StatCard label="Total Earned" value={t?.hrEarned} />
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Salary Paid</div>
              <div className="font-mono font-bold text-emerald-600 text-base">SAR {fmtMoney(t?.hrPaid)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Balance</div>
              <div className="font-mono font-bold text-red-500 text-base">SAR {fmtMoney(t?.hrDue)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Creditors (Loans)</h4>
          <div className="space-y-3">
            <StatCard label="Total Received" value={t?.crdRecv} />
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Returned</div>
              <div className="font-mono font-bold text-emerald-600 text-base">SAR {fmtMoney(t?.crdRet)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Balance</div>
              <div className="font-mono font-bold text-red-500 text-base">SAR {fmtMoney(t?.crdDue)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
