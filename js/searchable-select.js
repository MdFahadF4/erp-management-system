/** Searchable native selects — type to filter options; keeps scroll and existing values. */
let TomSelectCtor = null;
let observerInstalled = false;
let tomSelectLoader = null;
let pauseObserver = false;

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

function tomSelectOptionCount(el) {
  return Object.keys(el?.tomselect?.options || {}).length;
}

export function shouldEnhanceSelect(el) {
  if (!el || el.tagName !== 'SELECT') return false;
  if (el.disabled || el.hidden) return false;
  if (el.hasAttribute('data-no-search') || el.classList.contains('erp-no-search')) return false;

  const nativeCount = el.options.length;
  const tsCount = tomSelectOptionCount(el);

  if (nativeCount < 2) {
    // Tom Select strips most native <option> nodes after init — keep enhanced list during loading placeholders.
    return tsCount >= 2;
  }
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

/**
 * Re-read options from the native select only when it has a full option list.
 * Tom Select removes unselected <option> nodes from the DOM after init — syncing
 * against that stripped DOM was clearing every dropdown (the production bug).
 */
export function syncSearchableSelect(el) {
  const ts = el?.tomselect;
  if (!ts) return;

  const nativeCount = el.options.length;
  const tsCount = tomSelectOptionCount(el);

  if (nativeCount < 2) return;

  if (nativeCount >= tsCount) {
    pauseObserver = true;
    try {
      ts.sync(true);
    } finally {
      window.setTimeout(() => {
        pauseObserver = false;
      }, 0);
    }
  }
}

/** Call after programmatically replacing select.innerHTML in legacy modules. */
export function notifySelectOptionsUpdated(el) {
  if (!el || el.tagName !== 'SELECT') return;
  if (el.tomselect) {
    syncSearchableSelect(el);
    return;
  }
  if (shouldEnhanceSelect(el)) {
    enhanceSearchableSelect(el).catch((err) => {
      console.warn('Searchable select enhance failed', err);
    });
  }
}

export function destroySearchableSelect(el) {
  if (el?.tomselect) {
    pauseObserver = true;
    try {
      el.tomselect.destroy();
    } finally {
      window.setTimeout(() => {
        pauseObserver = false;
      }, 0);
    }
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

  pauseObserver = true;
  try {
    const TomSelect = await loadTomSelect();
    const instance = new TomSelect(el, buildTomSelectOptions(el));
    return instance;
  } catch (err) {
    console.warn('Searchable select init failed', err);
    return null;
  } finally {
    window.setTimeout(() => {
      pauseObserver = false;
    }, 0);
  }
}

export async function initSearchableSelects(root = document) {
  await loadTomSelect();
  const scope = root?.querySelectorAll ? root : document;
  const selects = scope === document ? document.querySelectorAll('select') : scope.querySelectorAll('select');
  for (const el of selects) {
    try {
      await enhanceSearchableSelect(el);
    } catch (err) {
      console.warn('Searchable select skipped', err);
    }
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
  const scheduleSync = (target) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (pauseObserver) return;
      if (target?.tagName === 'SELECT') {
        if (target.tomselect) {
          syncSearchableSelect(target);
        } else if (shouldEnhanceSelect(target)) {
          enhanceSearchableSelect(target).catch((err) => {
            console.warn('Searchable select enhance failed', err);
          });
        }
        return;
      }
      const pending = [];
      root.querySelectorAll?.('select').forEach((el) => {
        if (!el.tomselect && shouldEnhanceSelect(el)) pending.push(el);
      });
      pending.forEach((el) => {
        enhanceSearchableSelect(el).catch((err) => {
          console.warn('Searchable select enhance failed', err);
        });
      });
    }, 80);
  };

  const observer = new MutationObserver((mutations) => {
    if (pauseObserver) return;

    let optionChangeTarget = null;
    let addedSelect = false;

    for (const m of mutations) {
      m.removedNodes.forEach((node) => {
        if (pauseObserver) return;
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

    if (optionChangeTarget) {
      scheduleSync(optionChangeTarget);
    } else if (addedSelect) {
      scheduleSync(null);
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
