/** Searchable native selects — type to filter options; keeps scroll and existing values. */
let TomSelectCtor = null;
let observerInstalled = false;
let tomSelectLoader = null;

/** React/Vite client can inject bundled Tom Select before init. */
export function setTomSelectLoader(loader) {
  tomSelectLoader = loader;
}

async function loadTomSelect() {
  if (!TomSelectCtor) {
    if (tomSelectLoader) {
      TomSelectCtor = await tomSelectLoader();
    } else {
      TomSelectCtor = (await import('https://esm.sh/tom-select@2.3.1')).default;
    }
  }
  return TomSelectCtor;
}

export function shouldEnhanceSelect(el) {
  if (!el || el.tagName !== 'SELECT') return false;
  if (el.disabled || el.hidden) return false;
  if (el.hasAttribute('data-no-search') || el.classList.contains('erp-no-search')) return false;
  if (el.options.length < 2) return false;
  return true;
}

function buildTomSelectOptions(el) {
  const placeholderOpt = [...el.options].find((opt) => opt.value === '');
  return {
    create: false,
    maxOptions: 5000,
    allowEmptyOption: true,
    openOnFocus: true,
    selectOnTab: true,
    closeAfterSelect: true,
    dropdownParent: document.body,
    placeholder: placeholderOpt?.textContent?.trim() || undefined,
    render: {
      no_results: (_data, escape) =>
        `<div class="no-results px-3 py-2 text-xs text-gray-500">${escape('No matches found')}</div>`
    }
  };
}

export function syncSearchableSelect(el) {
  const ts = el?.tomselect;
  if (!ts) return;
  const current = el.value;
  ts.clearOptions();
  [...el.options].forEach((opt) => {
    ts.addOption({
      value: opt.value,
      text: (opt.textContent || opt.text || opt.value || '').trim()
    });
  });
  ts.refreshOptions(false);
  if (current !== undefined && current !== null && current !== '') {
    ts.setValue(current, true);
  } else {
    ts.clear(true);
  }
}

export function destroySearchableSelect(el) {
  if (el?.tomselect) {
    el.tomselect.destroy();
  }
}

export async function enhanceSearchableSelect(el) {
  if (!shouldEnhanceSelect(el)) {
    if (el?.tomselect) destroySearchableSelect(el);
    return null;
  }
  if (el.tomselect) {
    syncSearchableSelect(el);
    return el.tomselect;
  }
  const TomSelect = await loadTomSelect();
  return new TomSelect(el, buildTomSelectOptions(el));
}

export async function initSearchableSelects(root = document) {
  await loadTomSelect();
  const scope = root?.querySelectorAll ? root : document;
  const selects = scope === document ? document.querySelectorAll('select') : scope.querySelectorAll('select');
  for (const el of selects) {
    await enhanceSearchableSelect(el);
  }
}

export async function refreshSearchableSelects(root = document) {
  await initSearchableSelects(root);
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
  const scheduleRefresh = (target) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (target?.tagName === 'SELECT' && target.tomselect) {
        syncSearchableSelect(target);
        return;
      }
      await refreshSearchableSelects(root);
    }, 60);
  };

  const observer = new MutationObserver((mutations) => {
    let added = false;
    let optionChange = false;

    for (const m of mutations) {
      m.removedNodes.forEach((node) => {
        collectSelectsFromNode(node).forEach(destroySearchableSelect);
      });

      if (m.type === 'childList') {
        m.addedNodes.forEach((node) => {
          if (collectSelectsFromNode(node).length) added = true;
        });
        if (m.target.tagName === 'SELECT') optionChange = true;
      }
    }

    if (optionChange) {
      scheduleRefresh(mutations.find((m) => m.target.tagName === 'SELECT')?.target);
    } else if (added) {
      scheduleRefresh();
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true
  });

  root.__erpSearchableObserver = observer;
  observerInstalled = true;
  return observer;
}

export async function installSearchableSelectSystem(root = document) {
  await initSearchableSelects(root);
  const observeRoot = root?.body || (root?.nodeType === 1 ? root : document.body);
  installSearchableSelectObserver(observeRoot);
}
