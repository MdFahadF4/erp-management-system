import { COMPANY_NAME, CR_NUMBER, VAT_NUMBER, getCompanyLegalLine } from '../config/company.js';
import { formatPrintDateTime } from './reportExport.js';
import { t } from '../../../js/i18n.js';
import { roundMoney } from './recordHelpers.js';

const SLIP_QR_DISPLAY = 96;

function getSlipQrRenderOptions(payloadLength) {
  let width = 200;
  if (payloadLength > 500) width = 240;
  if (payloadLength > 750) width = 280;
  if (payloadLength > 1000) width = 320;
  return { width, margin: 2, errorCorrectionLevel: 'L' };
}

function safeFilename(base) {
  return String(base || 'export')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildCustomerTxnSlipData({
  date,
  uid,
  uidText,
  customerName = '',
  sell = 0,
  discount = 0,
  received = 0,
  method = 'Cash',
  due = 0,
  remainingDue = null,
  remarks = '',
  refundMode = false,
  user = '',
  txnId = '',
  stamp = ''
}) {
  return {
    date: date || '',
    uid: uid || '',
    uidText: uidText || uid || '',
    customerName: customerName || '',
    sell: roundMoney(sell),
    discount: roundMoney(discount),
    received: roundMoney(received),
    method: method || 'Cash',
    due: roundMoney(due),
    remainingDue: remainingDue == null ? null : roundMoney(remainingDue),
    remarks: String(remarks || '').trim(),
    refundMode: !!refundMode,
    user: user || '',
    txnId: txnId || '',
    stamp: stamp || ''
  };
}

export function buildCustomerTxnSlipQrPayload(data) {
  const typeLabel = data.refundMode ? t('custTxn.modeRefund') : t('custTxn.modeNormal');
  const lines = [
    '=== MEHRIN CUSTOMER INVOICE ===',
    COMPANY_NAME,
    getCompanyLegalLine(),
    `CR: ${CR_NUMBER}`,
    `VAT: ${VAT_NUMBER}`,
    t('custTxn.slipTitle'),
    typeLabel,
    `${t('report.printedOn')}: ${formatPrintDateTime()}`,
    '------------------------------'
  ];

  customerSlipFieldRows(data).forEach(([label, val]) => {
    lines.push(`${label}: ${String(val ?? '-').trim()}`);
  });

  if (data.remainingDue != null) {
    lines.push(`${t('field.remainingDueAfterTxn')}: ${Number(data.remainingDue).toFixed(2)}`);
  }
  if (data.txnId) lines.push(`Txn ID: ${data.txnId}`);
  if (data.stamp) lines.push(`Posted: ${data.stamp}`);

  return lines.join('\n');
}

function customerSlipFieldRows(data) {
  return [
    [t('col.date'), data.date || '-'],
    [t('col.sysUid'), data.uidText || data.uid || '-'],
    [t('field.customerName'), data.customerName || '-'],
    [t('col.soldAmt'), Number(data.sell).toFixed(2)],
    [t('col.discount'), Number(data.discount).toFixed(2)],
    [t('col.receivedAmt'), Number(data.received).toFixed(2)],
    [t('col.method'), data.method || '-'],
    [t('col.txnDue'), Number(data.due).toFixed(2)],
    [t('col.remarks'), data.remarks || '-'],
    [t('col.loggedBy'), data.user || '-']
  ];
}

function buildSlipQrBlock(qrDataUrl, slotId = 'cust-txn-slip-qr') {
  const wrapStyle = `width:${SLIP_QR_DISPLAY}px;height:${SLIP_QR_DISPLAY}px;min-width:${SLIP_QR_DISPLAY}px;min-height:${SLIP_QR_DISPLAY}px;`;
  const wrapClass =
    'erp-txn-slip-qr-wrap flex-shrink-0 border border-gray-200 rounded bg-white flex items-center justify-center overflow-hidden';
  const title = 'Scan to view full customer transaction invoice details';
  if (qrDataUrl) {
    return `<div class="${wrapClass}" style="${wrapStyle}" title="${title}"><img src="${qrDataUrl}" alt="Invoice QR" class="block w-full h-full object-contain" width="${SLIP_QR_DISPLAY}" height="${SLIP_QR_DISPLAY}" /></div>`;
  }
  return `<div class="${wrapClass}" style="${wrapStyle}" id="${slotId}" title="${title}"></div>`;
}

function buildSlipHeaderHtml({ qrDataUrl, typeLabel, qrSlotId = 'cust-txn-slip-qr' }) {
  return `
    <div class="erp-txn-slip-header border-b-2 border-gray-800 pb-3 mb-4">
      <div class="grid grid-cols-[minmax(0,1fr)_96px] gap-3 items-start">
        <div class="erp-txn-slip-header-main text-center min-w-0 pr-1">
          <h1 class="text-xl font-black uppercase tracking-wide break-words">${COMPANY_NAME}</h1>
          <p class="text-xs text-gray-600 mt-1">${getCompanyLegalLine()}</p>
          <p class="text-sm font-bold mt-3 text-gray-900">${t('custTxn.slipTitle')}</p>
          <p class="text-[11px] font-semibold text-gray-700 mt-1">${typeLabel}</p>
          <p class="text-[10px] text-gray-500 mt-2">${t('report.printedOn')}: ${formatPrintDateTime()}</p>
        </div>
        ${buildSlipQrBlock(qrDataUrl, qrSlotId)}
      </div>
    </div>`;
}

export function buildCustomerTxnSlipHtml(data, options = {}) {
  const qrDataUrl = options.qrDataUrl || '';
  const typeLabel = data.refundMode ? t('custTxn.modeRefund') : t('custTxn.modeNormal');
  return `
    <div class="erp-txn-slip print:block">
      ${buildSlipHeaderHtml({ qrDataUrl, typeLabel })}
      <table class="w-full text-xs border-collapse mb-4">
        <tbody>
          ${customerSlipFieldRows(data)
            .map(([label, val]) => `<tr><td class="p-2 border font-bold w-1/3">${label}</td><td class="p-2 border">${val}</td></tr>`)
            .join('')}
          ${
            data.remainingDue != null
              ? `<tr><td class="p-2 border font-bold w-1/3">${t('field.remainingDueAfterTxn')}</td><td class="p-2 border">${Number(data.remainingDue).toFixed(2)}</td></tr>`
              : ''
          }
        </tbody>
      </table>
      <div class="erp-txn-slip-footer">${options.footer || t('custTxn.slipFooter')}</div>
    </div>`;
}

function buildCustomerTxnSlipExportHtml(data, qrDataUrl) {
  const rows = customerSlipFieldRows(data);
  const typeLabel = data.refundMode ? t('custTxn.modeRefund') : t('custTxn.modeNormal');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t('custTxn.slipTitle')}</title>
<style>
body{font-family:Arial,sans-serif;margin:24px;color:#111}
.header{display:grid;grid-template-columns:minmax(0,1fr) 96px;gap:12px;align-items:start;border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:16px}
.header-main{text-align:center;min-width:0;padding-right:4px}
.header-qr{width:96px;height:96px;min-width:96px;border:1px solid #ccc;border-radius:4px;padding:2px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
.header-qr img{width:100%;height:100%;object-fit:contain;display:block}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px}
td{border:1px solid #ccc;padding:8px}
.footer{text-align:center;font-size:12px;color:#444;margin-top:20px;padding:12px 8px 16px;line-height:1.6;border-top:1px solid #ccc}
</style></head><body>
<div class="header">
  <div class="header-main">
    <h1 style="margin:0;font-size:22px">${COMPANY_NAME}</h1>
    <p style="font-size:12px;color:#555">${getCompanyLegalLine()}</p>
    <p style="font-weight:bold;margin-top:12px">${t('custTxn.slipTitle')}</p>
    <p style="font-size:11px;margin-top:6px">${typeLabel}</p>
    <p style="font-size:11px;color:#666">${t('report.printedOn')}: ${formatPrintDateTime()}</p>
  </div>
  <div class="header-qr">${qrDataUrl ? `<img src="${qrDataUrl}" alt="Invoice QR" width="${SLIP_QR_DISPLAY}" height="${SLIP_QR_DISPLAY}" />` : ''}</div>
</div>
<table><tbody>
  ${rows.map(([l, v]) => `<tr><td><b>${l}</b></td><td>${v}</td></tr>`).join('')}
  ${data.remainingDue != null ? `<tr><td><b>${t('field.remainingDueAfterTxn')}</b></td><td>${Number(data.remainingDue).toFixed(2)}</td></tr>` : ''}
</tbody></table>
<p class="footer">${t('custTxn.slipFooter')}</p>
</body></html>`;
}

function buildCustomerSlipSheetRows(slipData) {
  return [
    [COMPANY_NAME],
    [getCompanyLegalLine()],
    [t('custTxn.slipTitle')],
    [t('report.printedOn'), formatPrintDateTime()],
    ['QR', buildCustomerTxnSlipQrPayload(slipData)],
    [],
    [t('report.slipField'), t('report.slipValue')],
    ...customerSlipFieldRows(slipData),
    ...(slipData.remainingDue != null
      ? [[t('field.remainingDueAfterTxn'), Number(slipData.remainingDue).toFixed(2)]]
      : []),
    [],
    [t('custTxn.slipFooter')]
  ];
}

async function getSlipQrDataUrl(data) {
  const payload = buildCustomerTxnSlipQrPayload(data);
  const QRCode = (await import('https://esm.sh/qrcode@1.5.4')).default;
  return QRCode.toDataURL(payload, getSlipQrRenderOptions(payload.length));
}

async function renderSlipQr(hostEl, data) {
  if (!hostEl) return;
  hostEl.innerHTML = '';
  try {
    const payload = buildCustomerTxnSlipQrPayload(data);
    const QRCode = (await import('https://esm.sh/qrcode@1.5.4')).default;
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, payload, getSlipQrRenderOptions(payload.length));
    canvas.style.width = `${SLIP_QR_DISPLAY}px`;
    canvas.style.height = `${SLIP_QR_DISPLAY}px`;
    canvas.style.display = 'block';
    canvas.setAttribute('aria-label', 'Customer transaction invoice QR code');
    hostEl.appendChild(canvas);
  } catch (err) {
    console.warn('Customer slip QR render failed', err);
  }
}

async function renderSlipPdf(slipData, qrDataUrl, base) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:720px;background:#fff;padding:24px;z-index:-1;';
  host.innerHTML = buildCustomerTxnSlipHtml(slipData, { qrDataUrl });
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm'),
      import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')
    ]);
    const canvas = await html2canvas(host.firstElementChild, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = pageW / canvas.width;
    const imgH = canvas.height * ratio;
    pdf.addImage(img, 'PNG', 0, 0, pageW, imgH);
    if (imgH > pageH) {
      let left = imgH - pageH;
      let pos = -pageH;
      while (left > 0) {
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, pos, pageW, imgH);
        left -= pageH;
        pos -= pageH;
      }
    }
    pdf.save(`${base}.pdf`);
  } finally {
    host.remove();
  }
}

function slipExportFilename(data) {
  return safeFilename(`customer_txn_${data.uid}_${data.date}`);
}

export async function exportCustomerTxnSlipAs(format, slipData) {
  if (!slipData?.uid) {
    alert(t('custTxn.selectCustomerFirst'));
    return;
  }

  let qrDataUrl = '';
  try {
    qrDataUrl = await getSlipQrDataUrl(slipData);
  } catch {
    /* continue without QR image */
  }

  const base = slipExportFilename(slipData);

  if (format === 'word') {
    downloadBlob(new Blob(['\ufeff', buildCustomerTxnSlipExportHtml(slipData, qrDataUrl)], { type: 'application/msword' }), `${base}.doc`);
    return;
  }

  if (format === 'excel') {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
    const aoa = buildCustomerSlipSheetRows(slipData);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 28 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Transaction');
    XLSX.writeFile(wb, `${base}.xlsx`);
    return;
  }

  if (format === 'pdf') {
    await renderSlipPdf(slipData, qrDataUrl, base);
    return;
  }

  if (format === 'ppt') {
    const mod = await import('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/+esm');
    const pptx = new mod.default();
    const slide1 = pptx.addSlide();
    slide1.addText(COMPANY_NAME, { x: 0.5, y: 0.5, w: 7.5, h: 0.6, fontSize: 22, bold: true, align: 'center' });
    slide1.addText(getCompanyLegalLine(), { x: 0.5, y: 1.2, w: 7.5, h: 0.4, fontSize: 11, align: 'center' });
    slide1.addText(t('custTxn.slipTitle'), { x: 0.5, y: 1.8, w: 7.5, h: 0.4, fontSize: 14, bold: true, align: 'center' });
    slide1.addText(`${t('report.printedOn')}: ${formatPrintDateTime()}`, { x: 0.5, y: 2.4, w: 7.5, h: 0.3, fontSize: 10, align: 'center' });
    if (qrDataUrl) slide1.addImage({ data: qrDataUrl, x: 8.2, y: 0.3, w: 1.2, h: 1.2 });
    const slide2 = pptx.addSlide();
    slide2.addTable([[t('report.slipField'), t('report.slipValue')], ...customerSlipFieldRows(slipData)], {
      x: 0.4,
      y: 0.5,
      w: 9.2,
      fontSize: 11,
      border: { type: 'solid', color: 'CCCCCC', pt: 1 }
    });
    slide2.addText(t('custTxn.slipFooter'), { x: 0.5, y: 6.8, w: 9, h: 0.5, fontSize: 12, align: 'center', color: '666666' });
    await pptx.writeFile({ fileName: `${base}.pptx` });
  }
}

export async function renderCustomerTxnSlipPreview(bodyEl, slipData) {
  if (!bodyEl) return;
  bodyEl.innerHTML = buildCustomerTxnSlipHtml(slipData);
  await renderSlipQr(bodyEl.querySelector('#cust-txn-slip-qr'), slipData);
}

export function printCustomerTxnSlip(bodyEl, slipData) {
  document.body.classList.add('erp-print-slip');
  const cleanup = () => document.body.classList.remove('erp-print-slip');
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}
