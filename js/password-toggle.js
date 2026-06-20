import { t } from './i18n.js';

export function setupPasswordToggle(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input || btn.dataset.toggleBound === 'true') return;
  btn.dataset.toggleBound = 'true';
  btn.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = t('common.hide');
    } else {
      input.type = 'password';
      btn.textContent = t('common.show');
    }
  });
}

export function resetPasswordToggle(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (input) input.type = 'password';
  if (btn) btn.textContent = t('common.show');
}

export function resetPasswordToggles(pairs) {
  pairs.forEach(([btnId, inputId]) => resetPasswordToggle(btnId, inputId));
}
