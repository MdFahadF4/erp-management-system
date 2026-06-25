const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const appLines = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8').split(/\r?\n/);
const extract = (s, e) => appLines.slice(s - 1, e).join('\n');

const header = `import { apiRequest } from '../services/auth.js';
import { getCol, gV, gF, cln } from './recordHelpers.js';
import { parseRecordDate } from './hrEngine.js';
import { rollupSupplierTxnTotals } from './supplierEngine.js';
import { isDualTxnPrevDue } from './dualHeadEngine.js';
import {
  parseTxnDualAmounts,
  getDualTxnCategory,
  parseSupplierTxnAmounts,
  getSupplierTxnCategory
} from './txnParsers.js';
import {
  EXPENSE_TXN_FIELDS,
  CREDITOR_TXN_FIELDS,
  INCOME_TXN_FIELDS,
  CAPITAL_TXN_FIELDS
} from './txnFields.js';
import { finalizeReportPrintLayout } from './reportExport.js';
import { t, getCategoryLabel, getReportFlowTypeLabel, getReportSourceLabel } from './reportI18n.js';

`;

const customerTxnCol = extract(85, 95);

const helpers = [
  extract(856, 868),
  extract(870, 872),
  extract(874, 923),
  extract(925, 937),
  extract(939, 959),
  extract(969, 975),
  extract(977, 1102),
  extract(1177, 1183),
  extract(1539, 1568)
].join('\n\n');

let initReports = extract(4135, 4295);
initReports = initReports
  .replace(
    /const pageRoot = document\.querySelector\('\.erp-module-page'\);\s*\n\s*const mobileSnapshot = activeMobileSnapshot \|\| pageRoot\?\._mobileSnapshot;\s*\n\s*/s,
    ''
  )
  .replace(/\/\/ --- MAGIC INJECTOR:[\s\S]*?\/\/ ---------------------------------------------------------------------------\s*\n\s*/s, '')
  .replace(/\s*translateReportSelect\(typeSelect\);\s*\n\s*/s, '\n')
  .replace(
    /const reportLabel = typeSelect\.options[\s\S]*?mainContent\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\);\s*\n\s*\}/s,
    `const resultsAnchor = document.getElementById('report-results-anchor');
      if (resultsAnchor) resultsAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });`
  );

let execute = extract(4297, 7216);
execute = execute.replace(
  /^async function executeReportGeneration/,
  'export async function executeReportGeneration'
);
initReports = initReports.replace(/^function initReportsSystem/, 'export function initReportsSystem');

const out = `${header}${customerTxnCol}\n\n${helpers}\n\n${initReports}\n\n${execute}\n`;
fs.writeFileSync(path.join(root, 'client/src/lib/reportsEngine.js'), out);
console.log('Wrote reportsEngine.js, lines:', out.split('\n').length);
