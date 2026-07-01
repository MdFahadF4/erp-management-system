/**
 * Searchable native <select> — keeps the original dropdown intact.
 * Adds a small search field that filters options (option.hidden) so React
 * controlled selects and legacy innerHTML updates keep working.
 */
import { t } from './i18n.js';

const WRAP_CLASS = 'erp-searchable-select-wrap';
const FILTER_CLASS = 'erp-searchable-select-filter';
const ENHANCED_ATTR = 'data-erp-searchable';

let observerInstalled = false;
let pauseObserver = false;

/** Backwards compatible no-op (React client used to inject Tom Select). */
export function setTomSelectLoader() {}

export function shouldEnhanceSelect(el) {
  if (!el || el.tagName !== 'SELECT') return false;
  if (el.disabled || el.hidden) return false;
  if (el.hasAttribute('data-no-search') || el.classList.contains('erp-no-search')) return false;
  if (el.options.length < 2) return false;
  return true;
}

function cleanupTomSelect(el) {
  if (!el?.tomselect) return;
  try {
    el.tomselect.destroy();
  } catch (_) {
    el.classList.remove('tomselected', 'ts-hidden-accessible');
  }
}

function normalizeQuery(value) {
  return String(value || '').trim().toLowerCase();
}

function optionSearchText(opt) {
  return (opt.textContent || opt.text || opt.value || '').trim().toLowerCase();
}

function getFilterInput(select) {
  return select.closest(`.${WRAP_CLASS}`)?.querySelector(`.${FILTER_CLASS}`) || null;
}

function applyFilter(select, query) {
  const q = normalizeQuery(query);
  [...select.options].forEach((opt) => {
    if (!q) {
      opt.hidden = false;
      return;
    }
    if (opt.value === '') {
      opt.hidden = false;
      return;
    }
    opt.hidden = !optionSearchText(opt).includes(q);
  });
}

function resetAllOptionsVisible(select) {
  [...select.options].forEach((opt) => {
    opt.hidden = false;
  });
}

function bindFilterInput(select, input) {
  const openSelect = () => {
    if (select.disabled) return;
    select.focus();
    if (typeof select.showPicker === 'function') {
      try {
        select.showPicker();
      } catch (_) {
        select.click();
      }
    } else {
      select.click();
    }
  };

  input.addEventListener('input', () => {
    applyFilter(select, input.value);
    if (normalizeQuery(input.value)) openSelect();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      openSelect();
    } else if (e.key === 'Escape') {
      input.value = '';
      applyFilter(select, '');
    }
  });

  select.addEventListener('change', () => {
    if (!input.value) return;
    input.value = '';
    applyFilter(select, '');
  });
}

function wrapSelect(select) {
  cleanupTomSelect(select);

  if (select.hasAttribute(ENHANCED_ATTR)) {
    resetAllOptionsVisible(select);
    applyFilter(select, getFilterInput(select)?.value || '');
    return select.closest(`.${WRAP_CLASS}`);
  }

  const parent = select.parentElement;
  if (!parent) return null;

  const wrap = document.createElement('div');
  wrap.className = WRAP_CLASS;

  const input = document.createElement('input');
  input.type = 'search';
  input.className = FILTER_CLASS;
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('data-i18n-placeholder', 'dropdown.typeToSearch');
  input.placeholder = t('dropdown.typeToSearch');

  parent.insertBefore(wrap, select);
  wrap.appendChild(input);
  wrap.appendChild(select);

  bindFilterInput(select, input);
  select.setAttribute(ENHANCED_ATTR, '1');
  applyFilter(select, '');

  return wrap;
}

export function destroySearchableSelect(el) {
  if (!el || el.tagName !== 'SELECT') return;
  cleanupTomSelect(el);
  resetAllOptionsVisible(el);

  const wrap = el.closest(`.${WRAP_CLASS}`);
  if (wrap?.parentElement) {
    wrap.parentElement.insertBefore(el, wrap);
    wrap.remove();
  }

  el.removeAttribute(ENHANCED_ATTR);
}

export function syncSearchableSelect(el) {
  if (!el || el.tagName !== 'SELECT') return;
  cleanupTomSelect(el);

  if (!shouldEnhanceSelect(el)) {
    if (el.hasAttribute(ENHANCED_ATTR)) destroySearchableSelect(el);
    return;
  }

  if (!el.hasAttribute(ENHANCED_ATTR)) {
    wrapSelect(el);
    return;
  }

  resetAllOptionsVisible(el);
  applyFilter(el, getFilterInput(el)?.value || '');
}

export function notifySelectOptionsUpdated(el) {
  syncSearchableSelect(el);
}

export function enhanceSearchableSelect(el) {
  if (!shouldEnhanceSelect(el)) {
    if (el?.hasAttribute(ENHANCED_ATTR)) destroySearchableSelect(el);
    return null;
  }
  return wrapSelect(el);
}

export function initSearchableSelects(root = document) {
  const scope = root?.querySelectorAll ? root : document;
  const selects = scope === document ? document.querySelectorAll('select') : scope.querySelectorAll('select');

  selects.forEach((el) => {
    try {
      cleanupTomSelect(el);
      if (shouldEnhanceSelect(el)) {
        if (el.hasAttribute(ENHANCED_ATTR)) syncSearchableSelect(el);
        else wrapSelect(el);
      } else if (el.hasAttribute(ENHANCED_ATTR)) {
        destroySearchableSelect(el);
      }
    } catch (err) {
      console.warn('Searchable select skipped', err);
    }
  });
}

export async function refreshSearchableSelects(root = document) {
  initSearchableSelects(root);
}

function collectSelectsFromNode(node) {
  const list = [];
  if (!node || node.nodeType !== 1) return list;
  if (node.tagName === 'SELECT') list.push(node);
  node.querySelectorAll?.('select').forEach((el) => list.push(el));
  return list;
}

export function installSearchableSelectObserver(root = document.body) {
  if (observerInstalled && root.__erpSearchableObserver) return root.__erpSearchableObserver;

  let timer = null;
  const scheduleSync = (target) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (pauseObserver) return;
      if (target?.tagName === 'SELECT') {
        syncSearchableSelect(target);
        return;
      }
      root.querySelectorAll?.('select').forEach((el) => {
        if (shouldEnhanceSelect(el) && !el.hasAttribute(ENHANCED_ATTR)) {
          enhanceSearchableSelect(el);
        }
      });
    }, 80);
  };

  const observer = new MutationObserver((mutations) => {
    if (pauseObserver) return;

    let optionChangeTarget = null;
    let addedSelect = false;

    for (const m of mutations) {
      m.removedNodes.forEach((node) => {
        collectSelectsFromNode(node).forEach((el) => {
          if (!document.body.contains(el)) destroySearchableSelect(el);
        });
      });

      if (m.type !== 'childList') continue;

      if (m.target.tagName === 'SELECT') {
        optionChangeTarget = m.target;
        continue;
      }

      m.addedNodes.forEach((node) => {
        if (collectSelectsFromNode(node).length) addedSelect = true;
      });
    }

    if (optionChangeTarget) scheduleSync(optionChangeTarget);
    else if (addedSelect) scheduleSync(null);
  });

  observer.observe(root, { childList: true, subtree: true });
  root.__erpSearchableObserver = observer;
  observerInstalled = true;
  return observer;
}

export async function installSearchableSelectSystem(root = document) {
  initSearchableSelects(root);
  const observeRoot = root?.body || (root?.nodeType === 1 ? root : document.body);
  installSearchableSelectObserver(observeRoot);
}
