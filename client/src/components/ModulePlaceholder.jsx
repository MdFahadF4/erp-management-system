export default function ModulePlaceholder({ moduleId }) {
  const title = moduleId.replace(/_/g, ' ');
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-2 capitalize">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">
        This module will be migrated next with the same forms, tables, and calculations as your current ERP.
      </p>
      <div className="rounded-lg bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900">
        Coming in the next migration phase. Dashboard, HR, and Customer modules are live.
      </div>
    </div>
  );
}
