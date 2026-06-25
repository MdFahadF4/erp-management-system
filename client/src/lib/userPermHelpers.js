import { USER_PERM_MODULES } from '../config/userPermModules.js';
import { parsePermissionMap, permNameToModuleKey } from '../utils/userSession.js';

export function permissionsToString(permMap) {
  const tokens = [];
  for (const { perm } of USER_PERM_MODULES) {
    const mod = permNameToModuleKey(perm);
    const access = permMap[mod] || { view: false, edit: false };
    if (access.view) tokens.push(`${perm}:view`);
    if (access.edit) tokens.push(`${perm}:edit`);
  }
  return tokens.join(',');
}

export function defaultCreatePermMap() {
  return parsePermissionMap('Dashboard:view,Dashboard:edit');
}

export function emptyPermMap() {
  const map = {};
  for (const { perm } of USER_PERM_MODULES) {
    map[permNameToModuleKey(perm)] = { view: false, edit: false };
  }
  return map;
}
