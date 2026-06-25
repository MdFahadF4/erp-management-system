import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function LanguageSwitcher({ menuAlign = 'left', compact = false }) {
  const { lang, setLanguage, languages, t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`flex items-center gap-0.5 shrink-0 text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 bg-white rounded-lg focus:outline-none transition shadow-sm ${
          compact ? 'p-1 md:p-1.5' : 'p-1.5 md:px-2 md:py-1.5'
        }`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('header.changeLanguage')}
        title={t('header.changeLanguage')}
      >
        <svg className={`${compact ? 'w-4 h-4 md:w-5 md:h-5' : 'w-5 h-5 md:w-6 md:h-6'} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
        <span className={`font-bold uppercase tracking-wide text-blue-700 ${compact ? 'hidden md:inline text-[10px]' : 'text-[10px] md:text-xs'}`}>
          {current.code}
        </span>
      </button>
      {open && (
        <div
          className={`absolute top-full ${menuAlign === 'right' ? 'right-0' : 'left-0'} mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[95] py-1 max-h-72 overflow-y-auto`}
        >
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 transition ${
                item.code === lang ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'
              }`}
            >
              <span className="text-base leading-none">{item.flag}</span>
              <span className="min-w-0 flex-1 truncate">{item.native}</span>
              <span className="text-[10px] text-gray-400 uppercase">{item.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
