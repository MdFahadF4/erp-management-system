import { useState } from 'react';
import { fmtMoney } from '../lib/recordHelpers.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function DashboardInsightsPanel({ metrics, loading, visible }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const drawerCount = metrics?.drawers?.length || 0;
  const globalBalance = metrics?.globalBalance;
  const summaryParts = [];
  if (globalBalance !== null && globalBalance !== undefined) {
    summaryParts.push(t('dash.balanceSummary', { amount: fmtMoney(globalBalance) }));
  }
  if (drawerCount > 0) {
    summaryParts.push(
      t(drawerCount === 1 ? 'dash.drawerCount' : 'dash.drawerCountPlural', { count: drawerCount })
    );
  }
  const summaryText = summaryParts.length ? summaryParts.join(' · ') : t('chrome.dashboardSummary');

  return (
    <div id="dashboard-insights-panel" className="shrink-0 border-b border-gray-200 bg-gray-50/80 z-10">
      <div className="erp-dashboard-chrome-toggle flex items-stretch border-b border-gray-100 bg-white w-full">
        <button
          id="dashboard-insights-toggle"
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex-1 flex items-center justify-between gap-2 px-3 py-2.5 md:px-6 text-left hover:bg-gray-50 transition min-h-[2.75rem]"
          aria-expanded={expanded}
          aria-controls="dashboard-insights-body"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('chrome.dashboardSnapshot')}</div>
            <div id="insights-toggle-summary" className="text-xs text-gray-600 leading-snug break-words">
              {summaryText}
            </div>
          </div>
          <svg
            id="insights-toggle-chevron"
            className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div
        id="dashboard-insights-body"
        className={`${expanded ? '' : 'hidden'} px-3 md:px-6 py-2 md:py-3 overflow-y-auto space-y-2 md:space-y-3`}
      >
        {globalBalance !== null && globalBalance !== undefined && (
          <div id="admin-global-balance-container">
            <div className="bg-slate-900 border border-slate-800 rounded-lg md:rounded-xl p-3 md:p-5 shadow-md text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                <div className="min-w-0">
                  <div className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span className="truncate">{t('dash.globalBalance')}</span>
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-teal-400 truncate">
                    SAR {fmtMoney(globalBalance)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 shrink-0">
                  <div className="bg-slate-800/70 rounded-lg px-2.5 py-1.5 md:px-3 md:py-2">
                    <div className="text-[8px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('dash.inflows')}</div>
                    <div className="text-emerald-400 font-mono font-bold text-xs md:text-base">
                      SAR {fmtMoney(metrics.globalInflows)}
                    </div>
                  </div>
                  <div className="bg-slate-800/70 rounded-lg px-2.5 py-1.5 md:px-3 md:py-2">
                    <div className="text-[8px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('dash.outflows')}</div>
                    <div className="text-red-400 font-mono font-bold text-xs md:text-base">
                      SAR {fmtMoney(metrics.globalOutflows)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div id="dash-user-drawers-section">
          <div className="flex items-center justify-between gap-2 mb-1.5 md:mb-2">
            <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t('chrome.liveDrawers')}
            </h3>
          </div>
          <div
            id="dash-user-drawers"
            className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-3 md:overflow-visible snap-x snap-mandatory"
          >
            {loading ? (
              <div className="snap-start shrink-0 w-full md:w-auto col-span-full p-3 text-center text-blue-500 text-xs font-bold animate-pulse">
                {t('dash.calculatingBalances')}
              </div>
            ) : drawerCount === 0 ? (
              <div className="snap-start w-full md:col-span-full p-2.5 md:p-3 text-center text-gray-400 text-xs font-semibold border border-gray-100 rounded-lg bg-white">
                {t('dash.allDrawersBalanced')}
              </div>
            ) : (
              metrics.drawers.map(({ username, balance }) => {
                const clr = balance >= 0 ? 'text-emerald-600' : 'text-red-600';
                return (
                  <div
                    key={username}
                    className="snap-start shrink-0 w-[108px] sm:w-[120px] md:w-auto md:shrink bg-white border border-gray-200 rounded-lg p-2 md:p-3 shadow-sm text-center"
                  >
                    <div
                      className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5 truncate"
                      title={username}
                    >
                      {username}
                    </div>
                    <div className={`font-mono font-bold text-sm md:text-lg ${clr} whitespace-nowrap`}>
                      SAR {fmtMoney(balance)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
