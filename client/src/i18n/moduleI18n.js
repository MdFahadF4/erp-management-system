/** Maps module ids to existing i18n keys in js/i18n.js and js/i18n-forms.js */
export const MODULE_I18N = {
  expense_heads: {
    titleKey: 'page.expenseHeads.title',
    formTitleKey: 'form.exp.createMatrix',
    ledgerTitleKey: 'form.exp.configuredStructures'
  },
  expense_transactions: {
    titleKey: 'page.expenseTransactions.title',
    formTitleKey: 'form.exp.logEntry',
    ledgerTitleKey: 'form.txnHistoryLog'
  },
  creditors: {
    titleKey: 'page.creditors.title',
    formTitleKey: 'form.cred.createHead',
    ledgerTitleKey: 'form.cred.configuredStructures'
  },
  creditor_transactions: {
    titleKey: 'page.creditorTransactions.title',
    formTitleKey: 'form.cred.logAction',
    ledgerTitleKey: 'form.txnHistoryLog'
  },
  income_heads: {
    titleKey: 'page.incomeHeads.title',
    formTitleKey: 'form.inc.createMatrix',
    ledgerTitleKey: 'form.inc.configuredStructures'
  },
  income_transactions: {
    titleKey: 'page.incomeTransactions.title',
    formTitleKey: 'form.inc.logEntry',
    ledgerTitleKey: 'form.txnHistoryLog'
  },
  capital_heads: {
    titleKey: 'page.capitalHeads.title',
    formTitleKey: 'form.cap.createHead',
    ledgerTitleKey: 'form.cap.configuredStructures'
  },
  capital_transactions: {
    titleKey: 'page.capitalTransactions.title',
    formTitleKey: 'form.cap.logAction',
    ledgerTitleKey: 'form.txnHistoryLog'
  }
};

export function resolveModuleText(t, config, field, fallback = '') {
  const pack = MODULE_I18N[config?.moduleId];
  const key = pack?.[field] || config?.[`${field}Key`];
  return key ? t(key) : config?.[field.replace('Key', '')] || fallback;
}
