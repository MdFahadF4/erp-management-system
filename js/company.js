/**
 * Company branding — override via js/config.js (local) or Vercel env vars (COMPANY_NAME, VAT_NUMBER, CR_NUMBER).
 */
const runtime = globalThis.__ERP_CONFIG__;
const DEFAULTS = {
  COMPANY_NAME: 'Mehrin Trading Co.',
  VAT_NUMBER: '000000000000000',
  CR_NUMBER: '0000000000'
};

let company = { ...DEFAULTS };

if (runtime?.COMPANY_NAME) {
  company = {
    COMPANY_NAME: runtime.COMPANY_NAME,
    VAT_NUMBER: runtime.VAT_NUMBER || DEFAULTS.VAT_NUMBER,
    CR_NUMBER: runtime.CR_NUMBER || DEFAULTS.CR_NUMBER
  };
} else {
  try {
    const config = await import('./config.js');
    company = {
      COMPANY_NAME: config.COMPANY_NAME || DEFAULTS.COMPANY_NAME,
      VAT_NUMBER: config.VAT_NUMBER || DEFAULTS.VAT_NUMBER,
      CR_NUMBER: config.CR_NUMBER || DEFAULTS.CR_NUMBER
    };
  } catch {
    company = { ...DEFAULTS };
  }
}

export function getCompanyInfo() {
  return { ...company };
}

export function getCompanyDisplayTitle() {
  return company.COMPANY_NAME;
}

export function getCompanyLegalLine() {
  return `VAT:${company.VAT_NUMBER}  |  CR:${company.CR_NUMBER}`;
}

export function applyCompanyBranding(root = document) {
  const name = company.COMPANY_NAME;
  const legal = getCompanyLegalLine();

  document.title = name;

  const headerTitle = root.getElementById('header-company-name');
  const headerLegal = root.getElementById('header-company-legal');
  if (headerTitle) headerTitle.textContent = name;
  if (headerLegal) headerLegal.textContent = legal;

  root.querySelectorAll('[data-company-name]').forEach((el) => { el.textContent = name; });
  root.querySelectorAll('[data-company-legal]').forEach((el) => { el.textContent = legal; });
}
