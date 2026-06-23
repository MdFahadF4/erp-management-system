import { t, applyTranslations } from './i18n.js';

export const CREATOR = {
  name: 'Md. Fahad Hossain',
  email: 'fhdfrj27@gmail.com',
  whatsapp: '+96655340971',
  whatsappLink: 'https://wa.me/96655340971'
};

function buildCreatorMenu() {
  let menu = document.getElementById('creator-credit-menu');
  if (menu) return menu;

  menu = document.createElement('div');
  menu.id = 'creator-credit-menu';
  menu.className = 'hidden erp-creator-credit-menu';
  menu.innerHTML = `
    <p class="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400" data-i18n="credit.contactTitle">Contact Developer</p>
    <a href="mailto:${CREATOR.email}" class="erp-creator-credit-link erp-creator-credit-link--email">
      <span class="erp-creator-credit-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg>
      </span>
      <span class="min-w-0">
        <span class="block text-[10px] font-bold uppercase text-gray-500" data-i18n="credit.email">Email</span>
        <span class="block text-xs font-semibold text-gray-800 truncate">${CREATOR.email}</span>
      </span>
    </a>
    <a href="${CREATOR.whatsappLink}" target="_blank" rel="noopener noreferrer" class="erp-creator-credit-link erp-creator-credit-link--whatsapp">
      <span class="erp-creator-credit-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.3-1.39a10 10 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C22 6.45 17.5 2 12.04 2zm5.9 13.53c-.25.7-1.45 1.34-2 1.42-.5.08-1.16.12-1.87-.12-.43-.14-1-.46-1.73-.9-3.04-1.79-5.02-4.97-5.17-5.2-.15-.23-1.24-1.65-1.24-3.15 0-1.5.79-2.24 1.07-2.55.28-.31.61-.39.81-.39.2 0 .41 0 .59.01.19.01.44-.07.69.53.25.59.85 2.08.92 2.23.08.16.13.34.02.55-.11.21-.17.34-.34.53-.17.19-.36.42-.51.56-.17.15-.34.31-.15.61.19.29.84 1.39 1.81 2.25 1.25 1.12 2.3 1.47 2.69 1.63.39.16.62.14.85-.08.23-.22.98-1.14 1.24-1.53.26-.39.52-.33.85-.2.34.13 2.13 1 2.49 1.18.37.18.61.27.7.42.09.15.09.88-.16 1.58z"/></svg>
      </span>
      <span class="min-w-0">
        <span class="block text-[10px] font-bold uppercase text-gray-500" data-i18n="credit.whatsapp">WhatsApp</span>
        <span class="block text-xs font-semibold text-gray-800">${CREATOR.whatsapp}</span>
      </span>
    </a>`;
  document.body.appendChild(menu);
  applyTranslations(menu);
  return menu;
}

function positionCreatorMenu(btn, menu) {
  menu.classList.remove('hidden');
  const rect = btn.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  let top = rect.top - menuRect.height - 10;
  let left = rect.left + rect.width / 2 - menuRect.width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));
  if (top < 8) top = rect.bottom + 10;
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

export function initCreatorCredit() {
  const menu = buildCreatorMenu();

  document.querySelectorAll('.erp-creator-credit-trigger').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !menu.classList.contains('hidden');
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      if (isOpen) return;
      applyTranslations(menu);
      positionCreatorMenu(btn, menu);
      btn.setAttribute('aria-expanded', 'true');
    });
  });

  if (document.body.dataset.creatorCreditBound === 'true') return;
  document.body.dataset.creatorCreditBound = 'true';

  document.addEventListener('click', () => {
    menu.classList.add('hidden');
    document.querySelectorAll('.erp-creator-credit-trigger').forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    menu.classList.add('hidden');
    document.querySelectorAll('.erp-creator-credit-trigger').forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  window.addEventListener('resize', () => menu.classList.add('hidden'));
}
