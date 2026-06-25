import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function LanguageSwitcher() {
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
        className="p-1.5 md:p-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none transition shrink-0"
        aria-haspopup="true"
        aria-expanded={open}
        title={t('header.changeLanguage')}
      >
        <span className="text-base leading-none">{current.flag}</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[95] py-1 max-h-72 overflow-y-auto">
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
