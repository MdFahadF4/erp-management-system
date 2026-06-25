const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(root, 'js/i18n-reports.js'), 'utf8');
const formSrc = fs.readFileSync(path.join(root, 'js/i18n-forms.js'), 'utf8');

const strings = {};
const re = /'([^']+)':\s*'((?:\\'|[^'])*)'/g;

const enBlock = src.split('export const REPORT_EN = {')[1]?.split('};')[0] || '';
let m;
while ((m = re.exec(enBlock))) {
  strings[m[1]] = m[2].replace(/\\'/g, "'");
}

const formBlock = formSrc.split('export const FORM_EN = {')[1]?.split('};')[0] || '';
while ((m = re.exec(formBlock))) {
  if (m[1].startsWith('col.') || m[1].startsWith('common.') || m[1].startsWith('alert.')) {
    strings[m[1]] = m[2].replace(/\\'/g, "'");
  }
}

Object.assign(strings, {
  'common.print': 'Print',
  'common.fromDate': 'From Date',
  'common.toDate': 'To Date',
  'common.executeQuery': 'Execute Query',
  'common.chooseReport': '-- Choose Report Type --',
  'common.selectMasterReport': 'Select Master Report',
  'alert.errorGenerate': 'Error generating report. Check console for details.'
});

const out = `/** Auto-generated English report strings (stub i18n). */
const STRINGS = ${JSON.stringify(strings, null, 2)};

export function t(key, params = {}) {
  let text = STRINGS[key] || key.replace(/^[^.]+\./, '').replace(/([A-Z])/g, ' $1').trim();
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(new RegExp(\`\\\\{\${k}\\\\}\`, 'g'), String(v ?? ''));
  });
  return text;
}

const FLOW_TYPE_I18N = {
  'Cash IN': 'report.flowCashIn',
  'Card IN': 'report.flowCardIn',
  'Cash OUT': 'report.flowCashOut'
};

const SOURCE_I18N = {
  'Income (Revenue)': 'report.srcIncome',
  'Creditor (Loan Recv)': 'report.srcCreditorLoan',
  'Creditor Return': 'report.srcCreditorReturn',
  'Customer Sale': 'report.srcCustomerSale',
  'Operational Expense': 'report.srcExpense',
  'HR Salary Paid': 'report.srcHrSalary',
  'Supplier Payment': 'report.srcSupplierPayment'
};

const CATEGORY_I18N = {
  Active: 'status.active',
  Inactive: 'status.inactive',
  Released: 'status.released',
  Vacation: 'status.vacation',
  Cash: 'report.cashMethod',
  Card: 'report.cardMethod',
  Purchase: 'report.purchaseType',
  'Payment Paid': 'report.paymentPaid',
  'Previous Due': 'report.previousDue',
  'Salary Earn': 'report.salaryEarn',
  'Salary Paid': 'report.salaryPaid',
  'Salary Increment': 'report.salaryIncrement'
};

export function getReportFlowTypeLabel(type, tFn = t) {
  const key = FLOW_TYPE_I18N[type];
  return key ? tFn(key) : type;
}

export function getReportSourceLabel(src, tFn = t) {
  const key = SOURCE_I18N[src];
  return key ? tFn(key) : src;
}

export function getCategoryLabel(value, tFn = t) {
  const key = CATEGORY_I18N[value];
  return key ? tFn(key) : value;
}
`;

fs.writeFileSync(path.join(root, 'client/src/lib/reportI18n.js'), out);
console.log('Wrote reportI18n.js with', Object.keys(strings).length, 'strings');
