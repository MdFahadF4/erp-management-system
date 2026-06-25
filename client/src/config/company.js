export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'Mehrin Trading Co.';
export const VAT_NUMBER = import.meta.env.VITE_VAT_NUMBER || '000000000000000';
export const CR_NUMBER = import.meta.env.VITE_CR_NUMBER || '0000000000';

export function getCompanyInfo() {
  return {
    COMPANY_NAME,
    VAT_NUMBER,
    CR_NUMBER
  };
}

export function getCompanyDisplayTitle() {
  return COMPANY_NAME;
}

export function companyLegalLine() {
  return `VAT:${VAT_NUMBER}  |  CR:${CR_NUMBER}`;
}

export function getCompanyLegalLine() {
  return companyLegalLine();
}
