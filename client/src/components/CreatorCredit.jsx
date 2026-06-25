import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CREATOR } from '../config/creator.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import ModalPortal from './ModalPortal.jsx';

const VARIANTS = {
  login: {
    wrap: 'erp-creator-credit erp-creator-credit--login mt-6 pt-4 border-t border-gray-100 text-center',
    text: 'text-[11px] text-gray-500',
    trigger: 'erp-creator-credit-trigger text-blue-700 font-semibold hover:text-blue-900 underline-offset-2 hover:underline ml-1'
  },
  sidebar: {
    wrap: 'erp-creator-credit erp-creator-credit--sidebar text-center pb-1',
    text: 'text-[10px] text-slate-400 leading-relaxed',
    trigger: 'erp-creator-credit-trigger text-slate-100 font-semibold hover:text-white underline-offset-2 hover:underline ml-1'
  },
  page: {
    wrap: 'erp-creator-credit erp-creator-credit--page',
    text: 'text-[11px] text-gray-500 leading-relaxed',
    trigger: 'erp-creator-credit-trigger text-slate-700 font-semibold hover:text-blue-700 underline-offset-2 hover:underline ml-1'
  }
};

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.3-1.39a10 10 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C22 6.45 17.5 2 12.04 2zm5.9 13.53c-.25.7-1.45 1.34-2 1.42-.5.08-1.16.12-1.87-.12-.43-.14-1-.46-1.73-.9-3.04-1.79-5.02-4.97-5.17-5.2-.15-.23-1.24-1.65-1.24-3.15 0-1.5.79-2.24 1.07-2.55.28-.31.61-.39.81-.39.2 0 .41 0 .59.01.19.01.44-.07.69.53.25.59.85 2.08.92 2.23.08.16.13.34.02.55-.11.21-.17.34-.34.53-.17.19-.36.42-.51.56-.17.15-.34.31-.15.61.19.29.84 1.39 1.81 2.25 1.25 1.12 2.3 1.47 2.69 1.63.39.16.62.14.85-.08.23-.22.98-1.14 1.24-1.53.26-.39.52-.33.85-.2.34.13 2.13 1 2.49 1.18.37.18.61.27.7.42.09.15.09.88-.16 1.58z" />
    </svg>
  );
}

export default function CreatorCredit({ variant = 'page' }) {
  const { t } = useI18n();
  const styles = VARIANTS[variant] || VARIANTS.page;
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [positioned, setPositioned] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setPositioned(false);
  }, []);

  const positionMenu = useCallback(() => {
    const btn = btnRef.current;
    const menu = menuRef.current;
    if (!btn || !menu) return;

    const rect = btn.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    let top = rect.top - menuRect.height - 10;
    let left = rect.left + rect.width / 2 - menuRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));
    if (top < 8) top = rect.bottom + 10;
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    positionMenu();
    setPositioned(true);
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) return undefined;

    const onDocClick = () => close();
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    const onResize = () => close();

    document.addEventListener('click', onDocClick);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  const toggle = (e) => {
    e.stopPropagation();
    setOpen((v) => !v);
  };

  return (
    <>
      <div className={styles.wrap}>
        <p className={styles.text}>
          {t('credit.developedBy')}{' '}
          <button
            ref={btnRef}
            type="button"
            className={styles.trigger}
            aria-haspopup="true"
            aria-expanded={open}
            onClick={toggle}
          >
            {CREATOR.name}
          </button>
        </p>
      </div>

      {open && (
        <ModalPortal>
          <div
            ref={menuRef}
            id="creator-credit-menu"
            className="erp-creator-credit-menu"
            style={{ top: `${pos.top}px`, left: `${pos.left}px`, visibility: positioned ? 'visible' : 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t('credit.contactTitle')}
            </p>
            <a href={`mailto:${CREATOR.email}`} className="erp-creator-credit-link erp-creator-credit-link--email">
              <span className="erp-creator-credit-icon" aria-hidden="true">
                <EmailIcon />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase text-gray-500">{t('credit.email')}</span>
                <span className="block text-xs font-semibold text-gray-800 truncate">{CREATOR.email}</span>
              </span>
            </a>
            <a
              href={CREATOR.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="erp-creator-credit-link erp-creator-credit-link--whatsapp"
            >
              <span className="erp-creator-credit-icon" aria-hidden="true">
                <WhatsAppIcon />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase text-gray-500">{t('credit.whatsapp')}</span>
                <span className="block text-xs font-semibold text-gray-800">{CREATOR.whatsapp}</span>
              </span>
            </a>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
