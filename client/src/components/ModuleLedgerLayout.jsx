import { useEffect, useRef, useState } from 'react';

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
}

export default function ModuleLedgerLayout({ title, formTitle, ledgerTitle, formContent, ledgerContent }) {
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const ledgerRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('erp-mobile-ledger-open', ledgerOpen);
    return () => document.body.classList.remove('erp-mobile-ledger-open');
  }, [ledgerOpen]);

  useEffect(() => {
    if (ledgerOpen && ledgerRef.current) {
      requestAnimationFrame(() => {
        ledgerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [ledgerOpen]);

  const toggleLedger = () => {
    setLedgerOpen((prev) => !prev);
  };

  let toggleLabel = 'Ledger View';
  let toggleClass = 'bg-slate-800 hover:bg-slate-900';
  if (isMobile || ledgerOpen) {
    toggleLabel = ledgerOpen ? 'Back to Form' : 'Ledger View';
  } else if (ledgerOpen) {
    toggleLabel = 'Hide Ledger';
    toggleClass = 'bg-blue-600 hover:bg-blue-700';
  }

  return (
    <div className="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div className="border-b border-gray-200 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <button
          type="button"
          id="toggle-ledger-btn"
          onClick={toggleLedger}
          className={`${toggleClass} text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm`}
        >
          {toggleLabel}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!ledgerOpen && (
          <div
            id="form-container"
            className="bg-white p-5 rounded-xl shadow border border-gray-200 w-full max-w-2xl mx-auto max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5"
          >
            {formTitle && (
              <h3 className="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider">{formTitle}</h3>
            )}
            {formContent}
          </div>
        )}

        {ledgerOpen && (
          <div
            ref={ledgerRef}
            id="ledger-container"
            className="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 flex flex-col w-full overflow-visible md:overflow-hidden"
          >
            {ledgerTitle && (
              <h3 className="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider">{ledgerTitle}</h3>
            )}
            {ledgerContent}
          </div>
        )}
      </div>
    </div>
  );
}
