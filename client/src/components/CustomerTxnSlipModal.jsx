import { useEffect, useRef } from 'react';
import ModalPortal from './ModalPortal.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import {
  exportCustomerTxnSlipAs,
  printCustomerTxnSlip,
  renderCustomerTxnSlipPreview
} from '../lib/customerSlipExport.js';

export default function CustomerTxnSlipModal({ open, slipData, onClose }) {
  const { t } = useI18n();
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!open || !slipData) return;
    renderCustomerTxnSlipPreview(bodyRef.current, slipData);
  }, [open, slipData]);

  if (!open || !slipData) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[145] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b no-print">
            <h3 className="font-bold text-gray-800">{t('custTxn.slipPreview')}</h3>
            <button type="button" onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-700">
              &times;
            </button>
          </div>
          <div id="cust-txn-slip-body" ref={bodyRef} className="p-4" />
          <div className="p-4 border-t flex flex-wrap gap-2 justify-end no-print">
            <button
              type="button"
              onClick={() => printCustomerTxnSlip(bodyRef.current, slipData)}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded text-xs"
            >
              {t('common.print')}
            </button>
            <button
              type="button"
              onClick={() => exportCustomerTxnSlipAs('pdf', slipData)}
              className="bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-2 rounded text-xs"
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => exportCustomerTxnSlipAs('word', slipData)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-2 rounded text-xs"
            >
              Word
            </button>
            <button
              type="button"
              onClick={() => exportCustomerTxnSlipAs('excel', slipData)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-2 rounded text-xs"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() => exportCustomerTxnSlipAs('ppt', slipData)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-2 rounded text-xs"
            >
              PPT
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
