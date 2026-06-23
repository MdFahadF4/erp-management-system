import { getCompanyInfo, getCompanyLegalLine, getCompanyDisplayTitle } from './company.js';
import { t } from './i18n.js';

let lastReportMeta = null;

export function getLastReportMeta() {
  return lastReportMeta;
}

export function formatPrintDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseMoney(text) {
  const n = parseFloat(String(text || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function isNumericCell(text) {
  if (!text || text === '-' || text === '—') return false;
  return parseMoney(text) !== null;
}

function buildQrPayload(meta) {
  const co = getCompanyInfo();
  return [
    co.COMPANY_NAME,
    `CR:${co.CR_NUMBER}`,
    `VAT:${co.VAT_NUMBER}`,
    meta.title || '',
    meta.dateRange || ''
  ].filter(Boolean).join(' | ');
}

export function updateReportPrintHeader({ title, dateRange, target }) {
  const co = getCompanyInfo();
  const nameEl = document.getElementById('report-company-name');
  const legalEl = document.getElementById('report-company-legal');
  const titleEl = document.getElementById('report-title-display');
  const dateEl = document.getElementById('report-date-display');
  const tgtEl = document.getElementById('report-target-display');
  const dtEl = document.getElementById('report-print-datetime');

  if (nameEl) nameEl.textContent = co.COMPANY_NAME;
  if (legalEl) legalEl.textContent = getCompanyLegalLine();
  if (titleEl && title) titleEl.textContent = title;
  if (dateEl && dateRange) dateEl.textContent = dateRange;
  if (tgtEl) tgtEl.textContent = target || '';
  if (dtEl) dtEl.textContent = `${t('report.printedOn')}: ${formatPrintDateTime()}`;

  lastReportMeta = {
    title: title || titleEl?.textContent || '',
    dateRange: dateRange || dateEl?.textContent || '',
    target: target || tgtEl?.textContent || '',
    generatedAt: new Date()
  };
}

export async function renderReportQr(meta = lastReportMeta) {
  const host = document.getElementById('report-qr-code');
  if (!host || !meta) return;
  host.innerHTML = '';
  const payload = buildQrPayload(meta);
  try {
    const QRCode = (await import('https://esm.sh/qrcode@1.5.4')).default;
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    canvas.className = 'erp-report-qr-canvas';
    await QRCode.toCanvas(canvas, payload, { width: 96, margin: 1 });
    host.appendChild(canvas);
  } catch (err) {
    console.warn('QR render failed', err);
    host.textContent = 'QR';
  }
}

function addGrandTotalToTable(table) {
  if (!table || table.querySelector('tfoot')) return;
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  if (!thead || !tbody) return;
  const headerCells = thead.querySelectorAll('th');
  const rows = [...tbody.querySelectorAll('tr')].filter((tr) => !tr.querySelector('[colspan]'));
  if (!rows.length || !headerCells.length) return;

  const colCount = headerCells.length;
  const sums = new Array(colCount).fill(null);

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    cells.forEach((cell, i) => {
      if (i >= colCount) return;
      const val = parseMoney(cell.textContent);
      if (val !== null) {
        sums[i] = (sums[i] || 0) + val;
      }
    });
  });

  if (!sums.some((v) => v !== null)) return;

  const firstNumIdx = sums.findIndex((v) => v !== null);
  if (firstNumIdx < 0) return;

  const tfoot = document.createElement('tfoot');
  const tr = document.createElement('tr');
  tr.className = 'erp-report-grand-total bg-gray-100 font-bold border-t-2 border-gray-400';

  for (let i = 0; i < colCount; i += 1) {
    const td = document.createElement('td');
    td.className = 'p-2.5';
    if (i === 0) {
      if (firstNumIdx > 0) {
        td.colSpan = firstNumIdx;
        td.textContent = t('report.grandTotal');
        td.className += ' font-bold uppercase text-[10px] text-gray-700';
        tr.appendChild(td);
        i = firstNumIdx - 1;
        continue;
      }
      td.textContent = t('report.grandTotal');
      td.className += ' font-bold uppercase text-[10px] text-gray-700';
      if (sums[i] !== null) {
        td.className += ' text-right font-mono';
        td.textContent = `${t('report.grandTotal')} ${sums[i].toFixed(2)}`;
      }
      tr.appendChild(td);
      continue;
    }
    if (sums[i] !== null) {
      td.className += ' text-right font-mono font-bold text-gray-800';
      td.textContent = sums[i].toFixed(2);
      tr.appendChild(td);
    } else {
      tr.appendChild(td);
    }
  }
  tfoot.appendChild(tr);
  table.appendChild(tfoot);
}

export function addGrandTotalRows(container) {
  if (!container) return;
  container.querySelectorAll('table').forEach(addGrandTotalToTable);
}

export function addSectionDividers(container) {
  if (!container) return;
  const wrap = container.querySelector(':scope > .space-y-6') || container;
  const blocks = [...wrap.children].filter((el) => el.tagName === 'DIV');
  blocks.forEach((block, idx) => {
    if (idx === 0) return;
    if (block.classList.contains('erp-report-section-divider')) return;
    const div = document.createElement('div');
    div.className = 'erp-report-section-divider my-4 border-t-2 border-gray-300';
    block.parentNode.insertBefore(div, block);
  });
}

export function reorderAndSplitReportSummary() {
  const results = document.querySelector('.erp-report-results');
  const cardsEl = document.getElementById('report-summary-cards');
  const tableContainer = document.getElementById('report-table-container');
  if (!results || !cardsEl || !tableContainer) return;
  if (!cardsEl.innerHTML.trim() || cardsEl.querySelector('.erp-report-summary-split')) return;

  const bluePanel = cardsEl.querySelector('.bg-blue-50');
  let lifetimeHtml = cardsEl.innerHTML;
  let rangeHtml = `<p class="text-xs text-gray-400 italic">${t('report.noRangeSummary')}</p>`;

  if (bluePanel) {
    const innerCard = cardsEl.querySelector('.col-span-1') || cardsEl.firstElementChild;
    if (innerCard) {
      const clone = innerCard.cloneNode(true);
      clone.querySelector('.bg-blue-50')?.remove();
      lifetimeHtml = clone.innerHTML;
      rangeHtml = bluePanel.outerHTML;
    }
  }

  cardsEl.innerHTML = `
    <div class="erp-report-summary-split col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-gray-200 pt-4 mt-4">
      <div class="erp-report-summary-col-lifetime border border-gray-200 rounded-xl p-4 bg-gray-50">
        <div class="text-[10px] font-bold uppercase text-gray-500 mb-3 tracking-wider">${t('report.lifetimeSummary')}</div>
        ${lifetimeHtml}
      </div>
      <div class="erp-report-summary-col-range border border-blue-100 rounded-xl p-4 bg-blue-50/30">
        <div class="text-[10px] font-bold uppercase text-blue-700 mb-3 tracking-wider">${t('report.rangeSummary')}</div>
        ${rangeHtml}
      </div>
    </div>`;
  cardsEl.className = 'grid grid-cols-1 erp-report-summary-footer';

  if (tableContainer.nextElementSibling !== cardsEl) {
    results.appendChild(cardsEl);
  }
}

export async function finalizeReportPrintLayout(meta) {
  updateReportPrintHeader(meta);
  const tableContainer = document.getElementById('report-table-container');
  addSectionDividers(tableContainer);
  addGrandTotalRows(tableContainer);
  reorderAndSplitReportSummary();
  await renderReportQr(meta);
}

function getReportExportRoot() {
  return document.querySelector('.erp-report-results');
}

export function printReportsOnly() {
  const printed = `${t('report.printedOn')}: ${formatPrintDateTime()}`;
  const dtEl = document.getElementById('report-print-datetime');
  const footerDt = document.getElementById('report-print-footer-datetime');
  if (dtEl) dtEl.textContent = printed;
  if (footerDt) footerDt.textContent = printed;
  document.body.classList.add('erp-print-reports');
  const cleanup = () => document.body.classList.remove('erp-print-reports');
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}

function collectReportTables(root) {
  return [...root.querySelectorAll('table')].map((table, idx) => {
    const titleEl = table.closest('div.border')?.querySelector('.bg-slate-800, .bg-gray-800, .bg-violet-50, .bg-blue-50, .font-bold.p-3');
    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    const rows = [...table.querySelectorAll('tbody tr')].filter((tr) => !tr.querySelector('td[colspan]')).map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())
    );
    return { title: titleEl?.textContent?.trim() || `Table ${idx + 1}`, headers, rows };
  });
}

function buildExportHtml(root, meta) {
  const co = getCompanyInfo();
  const clone = root.cloneNode(true);
  clone.querySelectorAll('.print\\:hidden, .erp-report-tools').forEach((el) => el.remove());
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${meta?.title || co.COMPANY_NAME}</title>
<style>
body{font-family:Arial,sans-serif;margin:24px;color:#111}
.erp-export-header{text-align:center;margin-bottom:20px;border-bottom:2px solid #333;padding-bottom:12px}
.erp-export-header h1{margin:0;font-size:22px}
.erp-export-header p{margin:4px 0;font-size:12px;color:#555}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:11px}
th,td{border:1px solid #ccc;padding:6px 8px}
th{background:#f3f4f6}
tfoot td{font-weight:bold;background:#f9fafb}
.erp-report-section-divider{border-top:2px solid #999;margin:20px 0}
</style></head><body>
<div class="erp-export-header">
  <h1>${co.COMPANY_NAME}</h1>
  <p>${getCompanyLegalLine()}</p>
  <p><strong>${meta?.title || ''}</strong></p>
  <p>${meta?.dateRange || ''}</p>
  <p>${meta?.target || ''}</p>
  <p>${t('report.printedOn')}: ${formatPrintDateTime()}</p>
</div>
${clone.innerHTML}
</body></html>`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeFilename(text) {
  return String(text || 'report').replace(/[^\w\-]+/g, '_').slice(0, 60);
}

export async function exportReportAs(format) {
  const root = getReportExportRoot();
  if (!root || !lastReportMeta) {
    alert(t('report.runQueryFirst'));
    return;
  }
  const meta = lastReportMeta;
  const base = safeFilename(meta.title);

  if (format === 'print') {
    printReportsOnly();
    return;
  }

  if (format === 'word') {
    const html = buildExportHtml(root, meta);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    downloadBlob(blob, `${base}.doc`);
    return;
  }

  if (format === 'excel') {
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
      const wb = XLSX.utils.book_new();
      const tables = collectReportTables(root);
      tables.forEach((tbl, i) => {
        const aoa = tbl.headers.length ? [tbl.headers, ...tbl.rows] : tbl.rows;
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, (tbl.title || `Sheet${i + 1}`).slice(0, 31));
      });
      if (!tables.length) {
        const ws = XLSX.utils.aoa_to_sheet([[getCompanyDisplayTitle()], [getCompanyLegalLine()], [meta.title], [meta.dateRange]]);
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
      }
      XLSX.writeFile(wb, `${base}.xlsx`);
    } catch (err) {
      console.error(err);
      alert(t('report.exportFailed'));
    }
    return;
  }

  if (format === 'pdf') {
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm'),
        import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')
      ]);
      const canvas = await html2canvas(root, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = pageW / canvas.width;
      const imgH = canvas.height * ratio;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(img, 'PNG', 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, position, pageW, imgH);
        heightLeft -= pageH;
      }
      pdf.save(`${base}.pdf`);
    } catch (err) {
      console.error(err);
      alert(t('report.exportFailed'));
    }
    return;
  }

  if (format === 'ppt') {
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/+esm');
      const pptx = new mod.default();
      const co = getCompanyInfo();
      const slide1 = pptx.addSlide();
      slide1.addText(co.COMPANY_NAME, { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 24, bold: true, align: 'center' });
      slide1.addText(getCompanyLegalLine(), { x: 0.5, y: 1.5, w: 9, h: 0.4, fontSize: 12, align: 'center' });
      slide1.addText(meta.title, { x: 0.5, y: 2.2, w: 9, h: 0.5, fontSize: 16, align: 'center' });
      slide1.addText(`${meta.dateRange}\n${meta.target || ''}`, { x: 0.5, y: 3, w: 9, h: 0.8, fontSize: 11, align: 'center' });

      collectReportTables(root).forEach((tbl) => {
        if (!tbl.headers.length && !tbl.rows.length) return;
        const slide = pptx.addSlide();
        slide.addText(tbl.title, { x: 0.3, y: 0.2, w: 9.4, h: 0.4, fontSize: 14, bold: true });
        const tableRows = [tbl.headers, ...tbl.rows].filter((r) => r.length);
        if (tableRows.length) {
          slide.addTable(tableRows, { x: 0.3, y: 0.7, w: 9.4, fontSize: 9, border: { type: 'solid', color: 'CCCCCC', pt: 1 } });
        }
      });
      await pptx.writeFile({ fileName: `${base}.pptx` });
    } catch (err) {
      console.error(err);
      alert(t('report.exportFailed'));
    }
  }
}

export function initReportExportButtons() {
  const map = {
    'btn-report-print': 'print',
    'btn-report-pdf': 'pdf',
    'btn-report-word': 'word',
    'btn-report-excel': 'excel',
    'btn-report-ppt': 'ppt'
  };
  Object.entries(map).forEach(([id, format]) => {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => exportReportAs(format));
  });
}

function collectCustomerTxnSlipData() {
  const uid = document.getElementById('cust-txn-uid')?.value || '';
  const uidText = document.getElementById('cust-txn-uid')?.selectedOptions?.[0]?.textContent?.trim() || uid;
  return {
    date: document.getElementById('cust-txn-date')?.value || '',
    uid,
    uidText,
    sell: document.getElementById('cust-txn-sell')?.value || '0',
    discount: document.getElementById('cust-txn-discount')?.value || '0',
    received: document.getElementById('cust-txn-received')?.value || '0',
    method: document.getElementById('cust-txn-method')?.value || 'Cash',
    due: document.getElementById('cust-txn-due')?.value || '0',
    remarks: document.getElementById('cust-txn-remarks')?.value || '',
    refundMode: document.getElementById('form-cust-txn-entry')?.dataset?.refundMode === 'true',
    user: (() => { try { return JSON.parse(localStorage.getItem('currentUser') || '{}').username || ''; } catch { return ''; } })(),
    draft: true
  };
}

export function buildCustomerTxnSlipHtml(data, metaExtra = {}) {
  const co = getCompanyInfo();
  const isDraft = data.draft !== false;
  const slipTitle = isDraft ? t('custTxn.slipDraftTitle') : t('custTxn.slipTitle');
  return `
    <div class="erp-txn-slip print:block">
      <div class="erp-txn-slip-header text-center border-b-2 border-gray-800 pb-3 mb-4 relative">
        <div class="erp-txn-slip-qr-slot absolute top-0 right-0 w-24 h-24" id="cust-txn-slip-qr"></div>
        <h1 class="text-xl font-black uppercase tracking-wide">${co.COMPANY_NAME}</h1>
        <p class="text-xs text-gray-600 mt-1">${getCompanyLegalLine()}</p>
        <p class="text-sm font-bold mt-3 uppercase">${slipTitle}</p>
        ${isDraft ? `<p class="text-[10px] text-amber-700 font-bold uppercase mt-1">${t('custTxn.slipDraftNotice')}</p>` : ''}
        <p class="text-[10px] text-gray-500 mt-2">${t('report.printedOn')}: ${formatPrintDateTime()}</p>
      </div>
      <table class="w-full text-xs border-collapse mb-4">
        <tbody>
          <tr><td class="p-2 border font-bold w-1/3">${t('col.date')}</td><td class="p-2 border">${data.date || '-'}</td></tr>
          <tr><td class="p-2 border font-bold">${t('col.sysUid')}</td><td class="p-2 border">${data.uidText || data.uid || '-'}</td></tr>
          <tr><td class="p-2 border font-bold">${t('col.soldAmt')}</td><td class="p-2 border font-mono">${Number(data.sell).toFixed(2)}</td></tr>
          <tr><td class="p-2 border font-bold">${t('col.discount')}</td><td class="p-2 border font-mono">${Number(data.discount).toFixed(2)}</td></tr>
          <tr><td class="p-2 border font-bold">${t('col.receivedAmt')}</td><td class="p-2 border font-mono">${Number(data.received).toFixed(2)}</td></tr>
          <tr><td class="p-2 border font-bold">${t('col.method')}</td><td class="p-2 border">${data.method || '-'}</td></tr>
          <tr><td class="p-2 border font-bold">${t('col.txnDue')}</td><td class="p-2 border font-mono font-bold text-red-700">${Number(data.due).toFixed(2)}</td></tr>
          <tr><td class="p-2 border font-bold">${t('col.remarks')}</td><td class="p-2 border">${data.remarks || '-'}</td></tr>
          <tr><td class="p-2 border font-bold">${t('col.loggedBy')}</td><td class="p-2 border">${data.user || '-'}</td></tr>
        </tbody>
      </table>
      <div class="text-center text-[10px] text-gray-500 border-t pt-2">${metaExtra.footer || t('custTxn.slipFooter')}</div>
    </div>`;
}

async function renderSlipQr(hostId, data) {
  const host = document.getElementById(hostId);
  if (!host) return;
  host.innerHTML = '';
  const payload = buildQrPayload({
    title: t('custTxn.slipTitle'),
    dateRange: data.date || formatPrintDateTime()
  });
  try {
    const QRCode = (await import('https://esm.sh/qrcode@1.5.4')).default;
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, payload, { width: 80, margin: 1 });
    host.appendChild(canvas);
  } catch { /* optional */ }
}

export async function openCustomerTxnSlipPreview(data) {
  let modal = document.getElementById('modal-cust-txn-slip');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-cust-txn-slip';
    modal.className = 'fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[145] flex items-center justify-center p-4 hidden';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center p-4 border-b no-print">
          <h3 class="font-bold text-gray-800">${t('custTxn.slipPreview')}</h3>
          <button type="button" id="close-cust-txn-slip" class="text-2xl text-gray-400 hover:text-gray-700">&times;</button>
        </div>
        <div id="cust-txn-slip-body" class="p-4"></div>
        <div class="p-4 border-t flex flex-wrap gap-2 justify-end no-print">
          <button type="button" id="cust-txn-slip-print" class="bg-slate-800 text-white font-bold px-4 py-2 rounded text-xs">${t('common.print')}</button>
          <button type="button" id="cust-txn-slip-word" class="bg-blue-700 text-white font-bold px-4 py-2 rounded text-xs">Word</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#close-cust-txn-slip')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal.querySelector('#cust-txn-slip-print')?.addEventListener('click', () => {
      document.body.classList.add('erp-print-slip');
      const cleanup = () => {
        document.body.classList.remove('erp-print-slip');
        modal.classList.add('hidden');
      };
      window.addEventListener('afterprint', cleanup, { once: true });
      window.print();
    });
    modal.querySelector('#cust-txn-slip-word')?.addEventListener('click', () => {
      const root = document.getElementById('cust-txn-slip-print-root');
      if (!root) return;
      const slipData = collectCustomerTxnSlipData();
      const html = buildExportHtml(root, { title: t('custTxn.slipTitle'), dateRange: slipData.date, target: slipData.uidText });
      downloadBlob(new Blob(['\ufeff', html], { type: 'application/msword' }), 'customer_txn_slip.doc');
    });
  }

  const body = modal.querySelector('#cust-txn-slip-body');
  if (body) {
    body.innerHTML = `<div id="cust-txn-slip-print-root">${buildCustomerTxnSlipHtml(data)}</div>`;
    await renderSlipQr('cust-txn-slip-qr', data);
  }
  modal.classList.remove('hidden');
}

export function initCustomerTxnSlipButtons() {
  const previewBtn = document.getElementById('cust-txn-preview-slip');
  if (!previewBtn || previewBtn.dataset.bound === 'true') return;
  previewBtn.dataset.bound = 'true';
  previewBtn.addEventListener('click', async () => {
    const uid = document.getElementById('cust-txn-uid')?.value;
    if (!uid) { alert(t('custTxn.selectCustomerFirst')); return; }
    await openCustomerTxnSlipPreview(collectCustomerTxnSlipData());
  });
}

export async function openCustomerTxnSlipAfterSubmit(data) {
  data.draft = false;
  await openCustomerTxnSlipPreview(data);
}
