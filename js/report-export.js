import { getCompanyInfo, getCompanyLegalLine, getCompanyDisplayTitle } from './company.js';
import { t } from './i18n.js';

let lastReportMeta = null;
let lastHrFactoryReportMeta = null;

const MAIN_REPORT_EXPORT_PROFILE = {
  key: 'main',
  getRoot: () => document.querySelector('.erp-report-results:not(#hr-factory-report-results)'),
  getMeta: () => lastReportMeta,
  setMeta: (meta) => { lastReportMeta = meta; },
  printBodyClass: 'erp-print-reports',
  printHeaderId: 'report-print-header',
  tableContainerId: 'report-table-container',
  summaryCardsId: 'report-summary-cards',
  headerIds: {
    companyName: 'report-company-name',
    companyLegal: 'report-company-legal',
    title: 'report-title-display',
    dateRange: 'report-date-display',
    target: 'report-target-display',
    datetime: 'report-print-datetime',
    footerDatetime: 'report-print-footer-datetime',
    qr: 'report-qr-code'
  }
};

const HR_FACTORY_EXPORT_PROFILE = {
  key: 'hrFactory',
  getRoot: () => document.getElementById('hr-factory-report-results'),
  getMeta: () => lastHrFactoryReportMeta,
  setMeta: (meta) => { lastHrFactoryReportMeta = meta; },
  printBodyClass: 'erp-print-factory-report',
  printHeaderId: 'hr-factory-report-print-header',
  tableContainerId: 'hr-factory-details-table',
  summaryCardsId: 'hr-factory-details-summary',
  headerIds: {
    companyName: 'hr-factory-report-company-name',
    companyLegal: 'hr-factory-report-company-legal',
    title: 'hr-factory-report-title-display',
    dateRange: 'hr-factory-report-date-display',
    target: 'hr-factory-report-target-display',
    datetime: 'hr-factory-report-print-datetime',
    footerDatetime: 'hr-factory-print-footer-datetime',
    qr: 'hr-factory-report-qr-code'
  }
};

export function getLastReportMeta() {
  return lastReportMeta;
}

export function formatPrintDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseMoney(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  if (/\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/.test(raw)) return null;
  if (/\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}/.test(raw)) return null;
  const n = parseFloat(raw.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function isNonAmountColumn(headerText) {
  const h = String(headerText || '').trim().toLowerCase();
  return /date|user|remark|name|method|type|uid|memo|status|stamp|tracking|contact|permission|role|serial|sno|\bsl\b|^sl\.|^no\.|^#|^nr|^n°|^n\.º|^क्र|^ম\.|^ن\./.test(h);
}

function isSummableCell(cell, headerText) {
  if (isNonAmountColumn(headerText)) return false;
  const val = parseMoney(cell.textContent);
  if (val === null) return false;
  const h = String(headerText || '').toLowerCase();
  if (/amount|amt|sar|paid|earn|due|bill|recv|sell|balance|total|purchase|discount|cash|card|flow|profit|loss/.test(h)) {
    return true;
  }
  return cell.classList.contains('font-mono') && cell.classList.contains('text-right');
}

function isNumericCell(text) {
  if (!text || text === '-' || text === '—') return false;
  return parseMoney(text) !== null;
}

function buildQrPayload(meta, root, profile) {
  return buildStructuredReportQrPayload(meta, root, profile);
}

function resolveExportProfile(qrHostId) {
  if (qrHostId === HR_FACTORY_EXPORT_PROFILE.headerIds.qr) return HR_FACTORY_EXPORT_PROFILE;
  return MAIN_REPORT_EXPORT_PROFILE;
}

function sanitizeQrCell(text) {
  return String(text || '')
    .replace(/\|/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatTableSectionForQr(table, maxRows = 35) {
  const lines = [];
  if (table.title) lines.push(`[${sanitizeQrCell(table.title)}]`);
  if (table.headers?.length) {
    lines.push(table.headers.map(sanitizeQrCell).join(' | '));
  }
  const rows = table.rows || [];
  rows.slice(0, maxRows).forEach((row) => {
    lines.push(row.map(sanitizeQrCell).join(' | '));
  });
  if (rows.length > maxRows) {
    lines.push(`...+${rows.length - maxRows} rows`);
  }
  (table.footerRows || []).forEach((row) => {
    const txt = row.filter(Boolean).map(sanitizeQrCell).join(' | ');
    if (txt) lines.push(`TOTAL: ${txt}`);
  });
  return lines;
}

function buildStructuredReportQrPayload(meta, root, profile) {
  const co = getCompanyInfo();
  const lines = [
    '=== MEHRIN ERP REPORT ===',
    `Company: ${co.COMPANY_NAME}`,
    getCompanyLegalLine(),
    `Report: ${sanitizeQrCell(meta?.title)}`,
    `Period: ${sanitizeQrCell(meta?.dateRange)}`,
    meta?.target ? `Subject: ${sanitizeQrCell(meta.target)}` : '',
    `Printed: ${formatPrintDateTime()}`,
    ''
  ].filter(Boolean);

  if (root && profile) {
    const summary = collectReportSummaryForExport(root, profile.summaryCardsId);
    if (summary.rows?.length) {
      lines.push('--- SUMMARY ---');
      summary.rows.forEach((row) => {
        if (!row?.length) return;
        if (row.length === 1) lines.push(sanitizeQrCell(row[0]));
        else lines.push(`${sanitizeQrCell(row[0])}: ${sanitizeQrCell(row[1])}`);
      });
      lines.push('');
    }

    const tables = collectReportTables(root, profile.tableContainerId);
    if (tables.length) {
      lines.push('--- DETAIL ---');
      tables.forEach((table, idx) => {
        if (idx > 0) lines.push('');
        lines.push(...formatTableSectionForQr(table));
      });
    }
  }

  if (lines.length <= 7) {
    return [
      co.COMPANY_NAME,
      `CR:${co.CR_NUMBER}`,
      `VAT:${co.VAT_NUMBER}`,
      meta?.title || '',
      meta?.dateRange || '',
      meta?.target || '',
      `Printed: ${formatPrintDateTime()}`
    ]
      .filter(Boolean)
      .join(' | ');
  }

  let payload = lines.join('\n').trim();
  const MAX_CHARS = 2800;
  if (payload.length > MAX_CHARS) {
    payload = `${payload.slice(0, MAX_CHARS - 18)}\n...(truncated)`;
  }
  return payload;
}

function buildReportInfoRows(meta) {
  const co = getCompanyInfo();
  return [
    [co.COMPANY_NAME],
    [getCompanyLegalLine()],
    [meta?.title || ''],
    [meta?.dateRange || ''],
    [meta?.target || ''],
    [`${t('report.printedOn')}: ${formatPrintDateTime()}`],
    []
  ];
}

function revealExportPrintHeader(profile) {
  document.getElementById(profile.printHeaderId)?.classList.remove('hidden');
}

async function withExportHeaderVisible(profile, fn) {
  const header = document.getElementById(profile.printHeaderId);
  const wasHidden = header?.classList.contains('hidden');
  header?.classList.remove('hidden');
  try {
    await fn();
  } finally {
    if (wasHidden) header?.classList.add('hidden');
  }
}

export function updateReportPrintHeader({ title, dateRange, target }) {
  updateExportPrintHeader(MAIN_REPORT_EXPORT_PROFILE, { title, dateRange, target });
}

function updateExportPrintHeader(profile, { title, dateRange, target }) {
  const co = getCompanyInfo();
  const ids = profile.headerIds;
  const nameEl = document.getElementById(ids.companyName);
  const legalEl = document.getElementById(ids.companyLegal);
  const titleEl = document.getElementById(ids.title);
  const dateEl = document.getElementById(ids.dateRange);
  const tgtEl = document.getElementById(ids.target);
  const dtEl = document.getElementById(ids.datetime);

  if (nameEl) nameEl.textContent = co.COMPANY_NAME;
  if (legalEl) legalEl.textContent = getCompanyLegalLine();
  if (titleEl && title) titleEl.textContent = title;
  if (dateEl && dateRange) dateEl.textContent = dateRange;
  if (tgtEl) tgtEl.textContent = target || '';
  if (dtEl) dtEl.textContent = `${t('report.printedOn')}: ${formatPrintDateTime()}`;

  profile.setMeta({
    title: title || titleEl?.textContent || '',
    dateRange: dateRange || dateEl?.textContent || '',
    target: target || tgtEl?.textContent || '',
    generatedAt: new Date()
  });
  revealExportPrintHeader(profile);
}

export function updateHrFactoryReportPrintHeader({ title, dateRange, target }) {
  updateExportPrintHeader(HR_FACTORY_EXPORT_PROFILE, { title, dateRange, target });
}

export async function renderReportQr(meta = lastReportMeta, qrHostId = 'report-qr-code') {
  const host = document.getElementById(qrHostId);
  if (!host) return;
  const profile = resolveExportProfile(qrHostId);
  const metaResolved = meta || profile.getMeta?.();
  if (!metaResolved) return;
  host.innerHTML = '';
  const root = profile.getRoot?.();
  const payload = buildStructuredReportQrPayload(metaResolved, root, profile);
  try {
    const QRCode = (await import('https://esm.sh/qrcode@1.5.4')).default;
    const size = payload.length > 900 ? 128 : 96;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.className = 'erp-report-qr-canvas';
    host.title = 'Scan for full report summary and details';
    await QRCode.toCanvas(canvas, payload, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'L'
    });
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
      const headerText = headerCells[i]?.textContent || '';
      if (!isSummableCell(cell, headerText)) return;
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

export function removeGrandTotalRows(container) {
  if (!container) return;
  container.querySelectorAll('table tfoot').forEach((el) => el.remove());
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
  const cardsEl = document.getElementById('report-summary-cards');
  if (!cardsEl || !cardsEl.innerHTML.trim() || cardsEl.querySelector('.erp-report-summary-split')) return;
  if (cardsEl.dataset.skipSummarySplit === 'true') return;

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
}

/** Keep detail tables before summary/footer for print and all export formats. */
export function ensureReportExportLayout(profile = MAIN_REPORT_EXPORT_PROFILE) {
  const root = profile.getRoot?.();
  const cardsEl = document.getElementById(profile.summaryCardsId);
  const tableContainer = document.getElementById(profile.tableContainerId);
  const pageFooter = root?.querySelector('.erp-print-page-footer');
  if (!root || !tableContainer) return;

  if (profile.key === 'main') reorderAndSplitReportSummary();

  const anchor = pageFooter || null;
  if (anchor) {
    root.insertBefore(tableContainer, anchor);
    if (cardsEl?.innerHTML.trim()) root.insertBefore(cardsEl, anchor);
  }
}

function extractSummaryMetricPairs(container) {
  const pairs = [];
  const seen = new Set();
  if (!container) return pairs;

  container.querySelectorAll('h4').forEach((h4) => {
    const label = h4.textContent.trim();
    const value = h4.parentElement?.querySelector('.font-mono, .font-black')?.textContent?.trim();
    if (label && value && !seen.has(label)) {
      seen.add(label);
      pairs.push([label, value]);
    }
  });

  container.querySelectorAll('.grid > div, .flex.flex-wrap > div, .flex.justify-around > div').forEach((cell) => {
    const labelEl = cell.querySelector('h4, .text-gray-500, [class*="uppercase"]');
    const label = labelEl?.textContent?.trim();
    const value = cell.querySelector('.font-mono, .font-black, .text-xl, .text-lg')?.textContent?.trim();
    if (label && value && !seen.has(label)) {
      seen.add(label);
      pairs.push([label, value]);
    }
  });

  return pairs;
}

function collectReportSummaryForExport(root, summaryCardsId = 'report-summary-cards') {
  const el = root.querySelector(`#${summaryCardsId}`);
  if (!el || el.classList.contains('hidden') || !el.innerHTML.trim()) {
    return { html: '', rows: [] };
  }

  const rows = [];
  rows.push([]);
  rows.push([t('report.exportSummarySection')]);

  const lifetime = el.querySelector('.erp-report-summary-col-lifetime');
  const range = el.querySelector('.erp-report-summary-col-range');

  if (lifetime || range) {
    if (lifetime) {
      const heading = lifetime.querySelector(':scope > .uppercase')?.textContent?.trim() || t('report.lifetimeSummary');
      rows.push([heading]);
      extractSummaryMetricPairs(lifetime).forEach((pair) => rows.push(pair));
      rows.push([]);
    }
    if (range) {
      const heading = range.querySelector(':scope > .uppercase')?.textContent?.trim() || t('report.rangeSummary');
      rows.push([heading]);
      extractSummaryMetricPairs(range).forEach((pair) => rows.push(pair));
    }
  } else {
    extractSummaryMetricPairs(el).forEach((pair) => rows.push(pair));
  }

  return { html: el.outerHTML, rows: rows.filter((row) => row.some((cell) => String(cell || '').trim())) };
}

function addPdfPageNumbers(pdf) {
  const total = pdf.internal.getNumberOfPages();
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i += 1) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(85);
    pdf.text(t('report.pageOf', { current: i, total }), pageW / 2, pageH - 6, { align: 'center' });
  }
}

function collectReportTables(root, tableContainerId = 'report-table-container') {
  const tableContainer = root.querySelector(`#${tableContainerId}`);
  const scope = tableContainer || root;
  return [...scope.querySelectorAll('table')].map((table, idx) => {
    const titleEl = table.closest('div.border')?.querySelector('.bg-slate-800, .bg-gray-800, .bg-violet-50, .bg-blue-50, .font-bold.p-3');
    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    const rows = [...table.querySelectorAll('tbody tr')].filter((tr) => !tr.querySelector('td[colspan]')).map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())
    );
    const footerRows = [...table.querySelectorAll('tfoot tr')].map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())
    );
    return {
      title: titleEl?.textContent?.trim() || `Table ${idx + 1}`,
      headers,
      rows,
      footerRows
    };
  });
}

function buildExportHtml(root, meta, profile = MAIN_REPORT_EXPORT_PROFILE) {
  const co = getCompanyInfo();
  const tableContainer = root.querySelector(`#${profile.tableContainerId}`);
  const summary = collectReportSummaryForExport(root, profile.summaryCardsId);
  const detailsHtml = tableContainer?.innerHTML || '';
  const printed = `${t('report.printedOn')}: ${formatPrintDateTime()}`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${meta?.title || co.COMPANY_NAME}</title>
<style>
@page { size: A4 portrait; margin: 14mm 10mm 18mm 10mm; @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: #555; } }
body{font-family:Arial,sans-serif;margin:24px;color:#111}
.erp-export-header{text-align:center;margin-bottom:20px;border-bottom:2px solid #333;padding-bottom:12px}
.erp-export-header h1{margin:0;font-size:22px}
.erp-export-header p{margin:4px 0;font-size:12px;color:#555}
.erp-export-details{margin-bottom:24px}
.erp-export-summary{margin-top:28px;padding-top:16px;border-top:2px solid #999;page-break-before:always}
.erp-export-footer{margin-top:24px;padding-top:12px;border-top:1px solid #ccc;text-align:center;font-size:10px;color:#666}
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
  <p style="font-size:14px;font-weight:700;color:#111;margin:10px 0">${meta?.target || ''}</p>
  <p>${printed}</p>
</div>
<div class="erp-export-details">${detailsHtml}</div>
${summary.html ? `<div class="erp-export-summary">${summary.html}</div>` : ''}
<div class="erp-export-footer">${printed}</div>
</body></html>`;
}

export async function finalizeReportPrintLayout(meta) {
  updateReportPrintHeader(meta);
  const tableContainer = document.getElementById(MAIN_REPORT_EXPORT_PROFILE.tableContainerId);
  addSectionDividers(tableContainer);
  addGrandTotalRows(tableContainer);
  ensureReportExportLayout(MAIN_REPORT_EXPORT_PROFILE);
  await renderReportQr(meta, MAIN_REPORT_EXPORT_PROFILE.headerIds.qr);
}

export async function finalizeHrFactoryPrintLayout(meta) {
  updateHrFactoryReportPrintHeader(meta);
  const tableContainer = document.getElementById(HR_FACTORY_EXPORT_PROFILE.tableContainerId);
  removeGrandTotalRows(tableContainer);
  addSectionDividers(tableContainer);
  ensureReportExportLayout(HR_FACTORY_EXPORT_PROFILE);
  await renderReportQr(meta, HR_FACTORY_EXPORT_PROFILE.headerIds.qr);
}

function getReportExportRoot() {
  return MAIN_REPORT_EXPORT_PROFILE.getRoot();
}

function printReportRoot(profile) {
  revealExportPrintHeader(profile);
  ensureReportExportLayout(profile);
  const printed = `${t('report.printedOn')}: ${formatPrintDateTime()}`;
  const dtEl = document.getElementById(profile.headerIds.datetime);
  const footerDt = document.getElementById(profile.headerIds.footerDatetime);
  if (dtEl) dtEl.textContent = printed;
  if (footerDt) footerDt.textContent = printed;
  document.body.classList.add(profile.printBodyClass);
  const cleanup = () => document.body.classList.remove(profile.printBodyClass);
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}

export function printReportsOnly() {
  printReportRoot(MAIN_REPORT_EXPORT_PROFILE);
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
  return exportReportRootAs(format, MAIN_REPORT_EXPORT_PROFILE);
}

export async function exportHrFactoryDetailsAs(format) {
  return exportReportRootAs(format, HR_FACTORY_EXPORT_PROFILE);
}

async function exportReportRootAs(format, profile) {
  const root = profile.getRoot?.();
  const meta = profile.getMeta?.();
  if (!root || !meta) {
    alert(t('report.runQueryFirst'));
    return;
  }
  revealExportPrintHeader(profile);
  ensureReportExportLayout(profile);
  const base = safeFilename(meta.title);
  const summary = collectReportSummaryForExport(root, profile.summaryCardsId);
  const tables = collectReportTables(root, profile.tableContainerId);

  if (format === 'print') {
    printReportRoot(profile);
    return;
  }

  if (format === 'word') {
    const html = buildExportHtml(root, meta, profile);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    downloadBlob(blob, `${base}.doc`);
    return;
  }

  if (format === 'excel') {
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
      const wb = XLSX.utils.book_new();
      const infoLabel = t('report.exportReportInfo');
      const wsInfo = XLSX.utils.aoa_to_sheet(buildReportInfoRows(meta));
      XLSX.utils.book_append_sheet(wb, wsInfo, infoLabel.slice(0, 31));

      tables.forEach((tbl, i) => {
        let aoa = tbl.headers.length ? [tbl.headers, ...tbl.rows] : tbl.rows;
        if (tbl.footerRows?.length) aoa = [...aoa, ...tbl.footerRows];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, (tbl.title || `Sheet${i + 1}`).slice(0, 31));
      });

      if (summary.rows.length) {
        const wsSummary = XLSX.utils.aoa_to_sheet(summary.rows);
        XLSX.utils.book_append_sheet(wb, wsSummary, t('report.exportSummarySection').slice(0, 31));
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
      await withExportHeaderVisible(profile, async () => {
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
        addPdfPageNumbers(pdf);
        pdf.save(`${base}.pdf`);
      });
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
      const detailSlides = tables.filter((tbl) => tbl.headers.length || tbl.rows.length);
      const totalSlides = 1 + detailSlides.length + (summary.rows.length ? 1 : 0);
      let slideNo = 0;
      const stampPage = (slide) => {
        slideNo += 1;
        slide.addText(t('report.pageOf', { current: slideNo, total: totalSlides }), {
          x: 0.5, y: 7.05, w: 9, h: 0.3, fontSize: 9, align: 'center', color: '666666'
        });
      };

      const slide1 = pptx.addSlide();
      slide1.addText(co.COMPANY_NAME, { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 24, bold: true, align: 'center' });
      slide1.addText(getCompanyLegalLine(), { x: 0.5, y: 1.5, w: 9, h: 0.4, fontSize: 12, align: 'center' });
      slide1.addText(meta.title, { x: 0.5, y: 2.2, w: 9, h: 0.5, fontSize: 16, align: 'center' });
      slide1.addText(meta.dateRange || '', { x: 0.5, y: 2.9, w: 9, h: 0.4, fontSize: 11, align: 'center' });
      if (meta.target) {
        slide1.addText(meta.target, { x: 0.5, y: 3.45, w: 9, h: 0.5, fontSize: 12, bold: true, align: 'center', color: '111827' });
      }
      stampPage(slide1);

      detailSlides.forEach((tbl) => {
        const slide = pptx.addSlide();
        slide.addText(tbl.title, { x: 0.3, y: 0.2, w: 9.4, h: 0.4, fontSize: 14, bold: true });
        const tableRows = [tbl.headers, ...tbl.rows, ...(tbl.footerRows || [])].filter((r) => r.length);
        if (tableRows.length) {
          slide.addTable(tableRows, { x: 0.3, y: 0.7, w: 9.4, fontSize: 9, border: { type: 'solid', color: 'CCCCCC', pt: 1 } });
        }
        stampPage(slide);
      });

      if (summary.rows.length) {
        const slide = pptx.addSlide();
        slide.addText(t('report.exportSummarySection'), { x: 0.3, y: 0.2, w: 9.4, h: 0.4, fontSize: 14, bold: true });
        slide.addTable(summary.rows.filter((r) => r.length), {
          x: 0.3, y: 0.7, w: 9.4, fontSize: 10, border: { type: 'solid', color: 'CCCCCC', pt: 1 }
        });
        stampPage(slide);
      }

      await pptx.writeFile({ fileName: `${base}.pptx` });
    } catch (err) {
      console.error(err);
      alert(t('report.exportFailed'));
    }
  }
}

export function initReportExportButtons() {
  bindExportButtons({
    'btn-report-print': 'print',
    'btn-report-pdf': 'pdf',
    'btn-report-word': 'word',
    'btn-report-excel': 'excel',
    'btn-report-ppt': 'ppt'
  }, exportReportAs);
}

export function initHrFactoryExportButtons() {
  bindExportButtons({
    'btn-hr-factory-print': 'print',
    'btn-hr-factory-pdf': 'pdf',
    'btn-hr-factory-word': 'word',
    'btn-hr-factory-excel': 'excel',
    'btn-hr-factory-ppt': 'ppt'
  }, exportHrFactoryDetailsAs);
}

function bindExportButtons(map, handler) {
  Object.entries(map).forEach(([id, format]) => {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => handler(format));
  });
}

function collectCustomerTxnSlipData() {
  const uid = document.getElementById('cust-txn-uid')?.value || '';
  const uidOpt = document.getElementById('cust-txn-uid')?.selectedOptions?.[0];
  const uidText = uidOpt?.textContent?.trim() || uid;
  const customerName = uidOpt?.textContent?.includes('(')
    ? uidOpt.textContent.replace(/^[^\s]+\s*/, '').replace(/^\(/, '').replace(/\)$/, '').trim()
    : '';
  return {
    date: document.getElementById('cust-txn-date')?.value || '',
    uid,
    uidText,
    customerName,
    sell: document.getElementById('cust-txn-sell')?.value || '0',
    discount: document.getElementById('cust-txn-discount')?.value || '0',
    received: document.getElementById('cust-txn-received')?.value || '0',
    method: document.getElementById('cust-txn-method')?.value || 'Cash',
    due: document.getElementById('cust-txn-due')?.value || '0',
    remarks: document.getElementById('cust-txn-remarks')?.value || '',
    refundMode: document.getElementById('form-cust-txn-entry')?.dataset?.refundMode === 'true',
    user: (() => { try { return JSON.parse(localStorage.getItem('currentUser') || '{}').username || ''; } catch { return ''; } })()
  };
}

function buildCustomerTxnSlipQrPayload(data) {
  const co = getCompanyInfo();
  const typeLabel = data.refundMode ? t('custTxn.modeRefund') : t('custTxn.modeNormal');
  const lines = [
    '=== MEHRIN CUSTOMER INVOICE ===',
    co.COMPANY_NAME,
    getCompanyLegalLine(),
    `CR: ${co.CR_NUMBER || ''}`,
    `VAT: ${co.VAT_NUMBER || ''}`,
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

const SLIP_QR_DISPLAY = 96;

function getSlipQrRenderOptions(payloadLength) {
  let width = 200;
  if (payloadLength > 500) width = 240;
  if (payloadLength > 750) width = 280;
  if (payloadLength > 1000) width = 320;
  return { width, margin: 2, errorCorrectionLevel: 'L' };
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

function buildSlipHeaderHtml({ co, qrDataUrl, typeLabel, qrSlotId = 'cust-txn-slip-qr' }) {
  return `
    <div class="erp-txn-slip-header border-b-2 border-gray-800 pb-3 mb-4">
      <div class="grid grid-cols-[minmax(0,1fr)_96px] gap-3 items-start">
        <div class="erp-txn-slip-header-main text-center min-w-0 pr-1">
          <h1 class="text-xl font-black uppercase tracking-wide break-words">${co.COMPANY_NAME}</h1>
          <p class="text-xs text-gray-600 mt-1">${getCompanyLegalLine()}</p>
          <p class="text-sm font-bold mt-3 text-gray-900">${t('custTxn.slipTitle')}</p>
          <p class="text-[11px] font-semibold text-gray-700 mt-1">${typeLabel}</p>
          <p class="text-[10px] text-gray-500 mt-2">${t('report.printedOn')}: ${formatPrintDateTime()}</p>
        </div>
        ${buildSlipQrBlock(qrDataUrl, qrSlotId)}
      </div>
    </div>`;
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

export function buildCustomerTxnSlipHtml(data, options = {}) {
  const co = getCompanyInfo();
  const qrDataUrl = options.qrDataUrl || '';
  const typeLabel = data.refundMode ? t('custTxn.modeRefund') : t('custTxn.modeNormal');
  return `
    <div class="erp-txn-slip print:block">
      ${buildSlipHeaderHtml({ co, qrDataUrl, typeLabel })}
      <table class="w-full text-xs border-collapse mb-4">
        <tbody>
          ${customerSlipFieldRows(data).map(([label, val]) =>
            `<tr><td class="p-2 border font-bold w-1/3">${label}</td><td class="p-2 border">${val}</td></tr>`
          ).join('')}
        </tbody>
      </table>
      <div class="erp-txn-slip-footer">${options.footer || t('custTxn.slipFooter')}</div>
    </div>`;
}

function buildCustomerTxnSlipExportHtml(data, qrDataUrl) {
  const co = getCompanyInfo();
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
    <h1 style="margin:0;font-size:22px">${co.COMPANY_NAME}</h1>
    <p style="font-size:12px;color:#555">${getCompanyLegalLine()}</p>
    <p style="font-weight:bold;margin-top:12px">${t('custTxn.slipTitle')}</p>
    <p style="font-size:11px;margin-top:6px">${typeLabel}</p>
    <p style="font-size:11px;color:#666">${t('report.printedOn')}: ${formatPrintDateTime()}</p>
  </div>
  <div class="header-qr">${qrDataUrl ? `<img src="${qrDataUrl}" alt="Invoice QR" width="${SLIP_QR_DISPLAY}" height="${SLIP_QR_DISPLAY}" />` : ''}</div>
</div>
<table><tbody>
  ${rows.map(([l, v]) => `<tr><td><b>${l}</b></td><td>${v}</td></tr>`).join('')}
</tbody></table>
<p class="footer">${t('custTxn.slipFooter')}</p>
</body></html>`;
}

function buildCustomerSlipSheetRows(slipData) {
  const co = getCompanyInfo();
  return [
    [co.COMPANY_NAME],
    [getCompanyLegalLine()],
    [t('custTxn.slipTitle')],
    [t('report.printedOn'), formatPrintDateTime()],
    ['QR', buildCustomerTxnSlipQrPayload(slipData)],
    [],
    [t('report.slipField'), t('report.slipValue')],
    ...customerSlipFieldRows(slipData),
    [],
    [t('custTxn.slipFooter')]
  ];
}

function styleCustomerSlipWorksheet(ws, rowCount) {
  ws['!cols'] = [{ wch: 28 }, { wch: 40 }];
  ws['!rows'] = Array.from({ length: rowCount }, (_, i) => ({
    hpt: i === rowCount - 1 ? 36 : 20
  }));
  ws['!merges'] = [{ s: { r: rowCount - 1, c: 0 }, e: { r: rowCount - 1, c: 1 } }];
}

async function renderSlipPdf(slipData, qrDataUrl, base) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:720px;background:#fff;padding:24px;z-index:-1;';
  host.innerHTML = `<div id="cust-txn-slip-print-root">${buildCustomerTxnSlipHtml(slipData, { qrDataUrl })}</div>`;
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try {
    const root = host.firstElementChild;
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

async function getSlipQrDataUrl(data) {
  const payload = buildCustomerTxnSlipQrPayload(data);
  const QRCode = (await import('https://esm.sh/qrcode@1.5.4')).default;
  return QRCode.toDataURL(payload, getSlipQrRenderOptions(payload.length));
}

async function renderSlipQr(hostId, data) {
  const host = typeof hostId === 'string' ? document.getElementById(hostId) : hostId;
  if (!host) return;
  host.innerHTML = '';
  try {
    const payload = buildCustomerTxnSlipQrPayload(data);
    const QRCode = (await import('https://esm.sh/qrcode@1.5.4')).default;
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, payload, getSlipQrRenderOptions(payload.length));
    canvas.style.width = `${SLIP_QR_DISPLAY}px`;
    canvas.style.height = `${SLIP_QR_DISPLAY}px`;
    canvas.style.display = 'block';
    canvas.setAttribute('aria-label', 'Customer transaction invoice QR code');
    host.appendChild(canvas);
  } catch (err) {
    console.warn('Customer slip QR render failed', err);
  }
}

function slipExportFilename(data) {
  return safeFilename(`customer_txn_${data.uid}_${data.date}`);
}

export async function exportCustomerTxnSlipAs(format, data = null) {
  const slipData = data || collectCustomerTxnSlipData();
  if (!slipData.uid) {
    alert(t('custTxn.selectCustomerFirst'));
    return;
  }

  let qrDataUrl = '';
  try { qrDataUrl = await getSlipQrDataUrl(slipData); } catch { /* continue without QR image */ }

  const base = slipExportFilename(slipData);

  if (format === 'print') {
    await openCustomerTxnSlipPreview(slipData, { skipShow: false });
    document.body.classList.add('erp-print-slip');
    const cleanup = () => document.body.classList.remove('erp-print-slip');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    return;
  }

  if (format === 'word') {
    const html = buildCustomerTxnSlipExportHtml(slipData, qrDataUrl);
    downloadBlob(new Blob(['\ufeff', html], { type: 'application/msword' }), `${base}.doc`);
    return;
  }

  if (format === 'excel') {
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
      const aoa = buildCustomerSlipSheetRows(slipData);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      styleCustomerSlipWorksheet(ws, aoa.length);
      XLSX.utils.book_append_sheet(wb, ws, 'Transaction');
      XLSX.writeFile(wb, `${base}.xlsx`);
    } catch (err) {
      console.error(err);
      alert(t('report.exportFailed'));
    }
    return;
  }

  if (format === 'pdf') {
    try {
      await renderSlipPdf(slipData, qrDataUrl, base);
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
      slide1.addText(co.COMPANY_NAME, { x: 0.5, y: 0.5, w: 7.5, h: 0.6, fontSize: 22, bold: true, align: 'center' });
      slide1.addText(getCompanyLegalLine(), { x: 0.5, y: 1.2, w: 7.5, h: 0.4, fontSize: 11, align: 'center' });
      slide1.addText(t('custTxn.slipTitle'), { x: 0.5, y: 1.8, w: 7.5, h: 0.4, fontSize: 14, bold: true, align: 'center' });
      slide1.addText(`${t('report.printedOn')}: ${formatPrintDateTime()}`, { x: 0.5, y: 2.4, w: 7.5, h: 0.3, fontSize: 10, align: 'center' });
      if (qrDataUrl) {
        slide1.addImage({ data: qrDataUrl, x: 8.2, y: 0.3, w: 1.2, h: 1.2 });
      }
      const slide2 = pptx.addSlide();
      slide2.addTable([[t('report.slipField'), t('report.slipValue')], ...customerSlipFieldRows(slipData)], {
        x: 0.4, y: 0.5, w: 9.2, fontSize: 11, border: { type: 'solid', color: 'CCCCCC', pt: 1 }
      });
      slide2.addText(t('custTxn.slipFooter'), {
        x: 0.5, y: 6.8, w: 9, h: 0.5, fontSize: 12, align: 'center', color: '666666'
      });
      await pptx.writeFile({ fileName: `${base}.pptx` });
    } catch (err) {
      console.error(err);
      alert(t('report.exportFailed'));
    }
  }
}

function ensureSlipModal() {
  let modal = document.getElementById('modal-cust-txn-slip');
  if (modal) return modal;

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
        <button type="button" id="cust-txn-slip-print" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded text-xs">${t('common.print')}</button>
        <button type="button" id="cust-txn-slip-pdf" class="bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-2 rounded text-xs">PDF</button>
        <button type="button" id="cust-txn-slip-word" class="bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-2 rounded text-xs">Word</button>
        <button type="button" id="cust-txn-slip-excel" class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-2 rounded text-xs">Excel</button>
        <button type="button" id="cust-txn-slip-ppt" class="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-2 rounded text-xs">PPT</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector('#close-cust-txn-slip')?.addEventListener('click', () => modal.classList.add('hidden'));

  const slipFormats = {
    'cust-txn-slip-print': 'print',
    'cust-txn-slip-pdf': 'pdf',
    'cust-txn-slip-word': 'word',
    'cust-txn-slip-excel': 'excel',
    'cust-txn-slip-ppt': 'ppt'
  };
  Object.entries(slipFormats).forEach(([id, format]) => {
    modal.querySelector(`#${id}`)?.addEventListener('click', async () => {
      await exportCustomerTxnSlipAs(format, collectCustomerTxnSlipData());
    });
  });

  return modal;
}

export async function openCustomerTxnSlipPreview(data, { skipShow = false } = {}) {
  const modal = ensureSlipModal();
  const body = modal.querySelector('#cust-txn-slip-body');
  if (body) {
    body.innerHTML = `<div id="cust-txn-slip-print-root">${buildCustomerTxnSlipHtml(data)}</div>`;
    await renderSlipQr('cust-txn-slip-qr', data);
  }
  if (!skipShow) modal.classList.remove('hidden');
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
  await openCustomerTxnSlipPreview(data);
}
