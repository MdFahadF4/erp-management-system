import { USER_PERM_MODULES } from '../config/userPermModules.js';
import { permNameToModuleKey } from '../utils/userSession.js';

export default function UserPermGrid({ permMap, onChange, disabled = false }) {
  const toggle = (mod, type) => {
    if (disabled) return;
    const current = permMap[mod] || { view: false, edit: false };
    onChange({
      ...permMap,
      [mod]: { ...current, [type]: !current[type] }
    });
  };

  return (
    <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-64 overflow-y-auto text-xs">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[10px] font-bold uppercase text-gray-500 border-b border-gray-200 pb-1 mb-1">
        <span>Menu</span>
        <span className="text-center w-12">View</span>
        <span className="text-center w-12">Edit</span>
      </div>
      {USER_PERM_MODULES.map(({ perm, label }) => {
        const mod = permNameToModuleKey(perm);
        const access = permMap[mod] || { view: false, edit: false };
        return (
          <div key={perm} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center py-0.5">
            <span className="leading-tight">{label}</span>
            <label className="flex justify-center w-12">
              <input
                type="checkbox"
                disabled={disabled}
                checked={!!access.view}
                onChange={() => toggle(mod, 'view')}
              />
            </label>
            <label className="flex justify-center w-12">
              <input
                type="checkbox"
                disabled={disabled}
                checked={!!access.edit}
                onChange={() => toggle(mod, 'edit')}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}
