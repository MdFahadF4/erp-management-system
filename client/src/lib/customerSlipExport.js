import { COMPANY_NAME, CR_NUMBER, VAT_NUMBER, getCompanyLegalLine } from '../config/company.js';
import { formatPrintDateTime } from './reportExport.js';
import { t } from '../../../js/i18n.js';
import { roundMoney } from './recordHelpers.js';

function resolveSlipQrSize(payloadLength) {
  if (payloadLength <= 320) return 180;
  if (payloadLength <= 480) return 220;
  if (payloadLength <= 680) return 260;
  return 300;
}

function getSlipQrRenderOptions(payloadLength) {
  const width = resolveSlipQrSize(payloadLength);
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
  const mode = data.refundMode ? 'Refund / Cancellation' : 'Normal Sale / Payment';
  const lines = [
    'MEHRIN CUSTOMER INVOICE',
    COMPANY_NAME,
    `VAT ${VAT_NUMBER}  CR ${CR_NUMBER}`,
    'Document: Customer Transaction Invoice',
    `Mode: ${mode}`,
    `Printed: ${formatPrintDateTime()}`,
    '---',
    `Date: ${data.date || '-'}`,
    `Sys UID: ${data.uidText || data.uid || '-'}`,
    `Customer: ${data.customerName || '-'}`,
    `Sold Amt: ${Number(data.sell).toFixed(2)}`,
    `Discount: ${Number(data.discount).toFixed(2)}`,
    `Received Amt: ${Number(data.received).toFixed(2)}`,
    `Method: ${data.method || '-'}`,
    `Txn Due: ${Number(data.due).toFixed(2)}`,
    `Remarks: ${String(data.remarks || '-').trim()}`,
    `Logged By: ${data.user || '-'}`
  ];

  if (data.remainingDue != null) {
    lines.push(`Remaining Due After Txn: ${Number(data.remainingDue).toFixed(2)}`);
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

function buildSlipQrBlock(qrDataUrl, slotId = 'cust-txn-slip-qr', qrSize = 220) {
  const wrapStyle = `width:${qrSize}px;height:${qrSize}px;min-width:${qrSize}px;min-height:${qrSize}px;`;
  const wrapClass =
    'erp-txn-slip-qr-wrap border border-gray-200 rounded bg-white inline-flex items-center justify-center overflow-hidden';
  const title = 'Scan to view full customer transaction invoice details';
  if (qrDataUrl) {
    return `<div class="${wrapClass}" style="${wrapStyle}" title="${title}"><img src="${qrDataUrl}" alt="Invoice QR" class="erp-txn-slip-qr-image block" width="${qrSize}" height="${qrSize}" /></div>`;
  }
  return `<div class="${wrapClass}" style="${wrapStyle}" id="${slotId}" title="${title}"></div>`;
}

function buildSlipQrSection(qrDataUrl, slotId, qrSize) {
  return `<div class="erp-txn-slip-qr-section flex justify-center mb-4 px-2">${buildSlipQrBlock(qrDataUrl, slotId, qrSize)}</div>`;
}

function buildSlipHeaderHtml({ typeLabel }) {
  return `
    <div class="erp-txn-slip-header border-b-2 border-gray-800 pb-3 mb-3 text-center">
      <h1 class="text-xl font-black uppercase tracking-wide break-words">${COMPANY_NAME}</h1>
      <p class="text-xs text-gray-600 mt-1">${getCompanyLegalLine()}</p>
      <p class="text-sm font-bold mt-3 text-gray-900">${t('custTxn.slipTitle')}</p>
      <p class="text-[11px] font-semibold text-gray-700 mt-1">${typeLabel}</p>
      <p class="text-[10px] text-gray-500 mt-2">${t('report.printedOn')}: ${formatPrintDateTime()}</p>
    </div>`;
}

export function buildCustomerTxnSlipHtml(data, options = {}) {
  const qrDataUrl = options.qrDataUrl || '';
  const qrSize = options.qrSize || resolveSlipQrSize(buildCustomerTxnSlipQrPayload(data).length);
  const typeLabel = data.refundMode ? t('custTxn.modeRefund') : t('custTxn.modeNormal');
  return `
    <div class="erp-txn-slip print:block">
      ${buildSlipHeaderHtml({ typeLabel })}
      ${buildSlipQrSection(qrDataUrl, 'cust-txn-slip-qr', qrSize)}
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
  const qrSize = resolveSlipQrSize(buildCustomerTxnSlipQrPayload(data).length);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t('custTxn.slipTitle')}</title>
<style>
body{font-family:Arial,sans-serif;margin:24px;color:#111}
.header{text-align:center;border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:12px}
.qr-wrap{display:flex;justify-content:center;margin:0 0 16px}
.qr-box{border:1px solid #ccc;border-radius:4px;padding:2px;background:#fff;display:inline-block}
.qr-box img{display:block;width:${qrSize}px;height:${qrSize}px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px}
td{border:1px solid #ccc;padding:8px}
.footer{text-align:center;font-size:12px;color:#444;margin-top:20px;padding:12px 8px 16px;line-height:1.6;border-top:1px solid #ccc}
</style></head><body>
<div class="header">
  <h1 style="margin:0;font-size:22px">${COMPANY_NAME}</h1>
  <p style="font-size:12px;color:#555">${getCompanyLegalLine()}</p>
  <p style="font-weight:bold;margin-top:12px">${t('custTxn.slipTitle')}</p>
  <p style="font-size:11px;margin-top:6px">${typeLabel}</p>
  <p style="font-size:11px;color:#666">${t('report.printedOn')}: ${formatPrintDateTime()}</p>
</div>
<div class="qr-wrap"><div class="qr-box">${qrDataUrl ? `<img src="${qrDataUrl}" alt="Invoice QR" width="${qrSize}" height="${qrSize}" />` : ''}</div></div>
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
  const payload = buildCustomerTxnSlipQrPayload(data);
  const opts = getSlipQrRenderOptions(payload.length);
  const size = opts.width;
  hostEl.innerHTML = '';
  hostEl.style.width = `${size}px`;
  hostEl.style.height = `${size}px`;
  hostEl.style.minWidth = `${size}px`;
  hostEl.style.minHeight = `${size}px`;
  try {
    const QRCode = (await import('https://esm.sh/qrcode@1.5.4')).default;
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, payload, opts);
    canvas.className = 'erp-txn-slip-qr-image block';
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.display = 'block';
    canvas.setAttribute('aria-label', 'Customer transaction invoice QR code');
    hostEl.appendChild(canvas);
  } catch (err) {
    console.warn('Customer slip QR render failed', err);
    hostEl.textContent = 'QR unavailable';
  }
}

async function renderSlipPdf(slipData, qrDataUrl, base) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:720px;background:#fff;padding:24px;z-index:-1;';
  const qrSize = resolveSlipQrSize(buildCustomerTxnSlipQrPayload(slipData).length);
  host.innerHTML = buildCustomerTxnSlipHtml(slipData, { qrDataUrl, qrSize });
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
