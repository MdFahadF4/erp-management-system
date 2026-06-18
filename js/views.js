export const templates = {
  dashboard: `
    <div class="space-y-6 pb-10">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Executive Dashboard</h2>
        <button id="btn-refresh-dash" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded shadow-sm text-xs uppercase tracking-wider transition">Refresh Data</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div class="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <h3 class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Market Receivable</h3>
            <div class="text-4xl font-black font-mono tracking-tight">SAR <span id="dash-recv">0.00</span></div>
         </div>
         <div class="bg-gradient-to-r from-red-500 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <h3 class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Enterprise Payable</h3>
            <div class="text-4xl font-black font-mono tracking-tight">SAR <span id="dash-pay">0.00</span></div>
         </div>
      </div>

      <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mt-4">Revenue Streams (Lifetime)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div class="flex justify-between items-center mb-4">
               <h4 class="font-bold text-blue-800 text-lg">Customer Sales</h4>
               <span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-bold">LIFETIME</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
               <div>
                  <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Sold</div>
                  <div class="font-mono font-bold text-lg text-gray-700">SAR <span id="dash-sale-sold">0.00</span></div>
               </div>
               <div>
                  <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Balance</div>
                  <div class="font-mono font-bold text-lg text-red-500">SAR <span id="dash-sale-due">0.00</span></div>
               </div>
               <div class="col-span-2 border-t pt-3 mt-1">
                  <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Received</div>
                  <div class="font-mono font-black text-2xl text-emerald-600">SAR <span id="dash-sale-recv">0.00</span></div>
                  <div class="text-xs font-medium text-gray-500 mt-1 flex gap-4">
                     <span>Cash: <b class="text-emerald-500 font-mono" id="dash-sale-cash">0.00</b></span>
                     <span>Card: <b class="text-blue-500 font-mono" id="dash-sale-card">0.00</b></span>
                  </div>
               </div>
            </div>
         </div>

         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
            <div class="flex justify-between items-center mb-4">
               <h4 class="font-bold text-indigo-800 text-lg">Other Income</h4>
               <span class="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-1 rounded font-bold">LIFETIME</span>
            </div>
            <div class="space-y-4 mt-2 flex-1 flex flex-col justify-center">
               <div class="flex justify-between items-center border-b pb-2">
                  <div class="text-xs text-gray-500 font-bold uppercase tracking-wider">Initiated / Billed</div>
                  <div class="font-mono font-bold text-gray-800 text-lg">SAR <span id="dash-inc-billed">0.00</span></div>
               </div>
               <div class="flex justify-between items-center border-b pb-2">
                  <div class="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Received</div>
                  <div class="font-mono font-bold text-emerald-600 text-lg">SAR <span id="dash-inc-recv">0.00</span></div>
               </div>
               <div class="flex justify-between items-center">
                  <div class="text-xs text-gray-500 font-bold uppercase tracking-wider">Due / Balance</div>
                  <div class="font-mono font-bold text-red-500 text-lg">SAR <span id="dash-inc-due">0.00</span></div>
               </div>
            </div>
         </div>

      </div>

      <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mt-4">Expenditures & Liabilities (Lifetime)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         
         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 class="font-bold text-gray-800 mb-3 border-b pb-2">Supplier Purchases</h4>
            <div class="space-y-3">
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Purchased</div><div class="font-mono font-bold text-gray-700 text-base">SAR <span id="dash-sup-pur">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Paid</div><div class="font-mono font-bold text-emerald-600 text-base">SAR <span id="dash-sup-paid">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Payable</div><div class="font-mono font-bold text-red-500 text-base">SAR <span id="dash-sup-due">0.00</span></div></div>
            </div>
         </div>

         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 class="font-bold text-gray-800 mb-3 border-b pb-2">Operational Expenses</h4>
            <div class="space-y-3">
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Incurred</div><div class="font-mono font-bold text-gray-700 text-base">SAR <span id="dash-exp-inc">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Paid</div><div class="font-mono font-bold text-emerald-600 text-base">SAR <span id="dash-exp-paid">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Balance</div><div class="font-mono font-bold text-red-500 text-base">SAR <span id="dash-exp-due">0.00</span></div></div>
            </div>
         </div>

         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 class="font-bold text-orange-800 mb-3 border-b pb-2">HR & Payroll</h4>
            <div class="space-y-3">
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Earned</div><div class="font-mono font-bold text-gray-700 text-base">SAR <span id="dash-hr-earned">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Salary Paid</div><div class="font-mono font-bold text-emerald-600 text-base">SAR <span id="dash-hr-paid">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Payable</div><div class="font-mono font-bold text-red-500 text-base">SAR <span id="dash-hr-due">0.00</span></div></div>
            </div>
         </div>

         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 class="font-bold text-gray-800 mb-3 border-b pb-2">Creditors (Loans)</h4>
            <div class="space-y-3">
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Received</div><div class="font-mono font-bold text-gray-700 text-base">SAR <span id="dash-crd-recv">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Returned</div><div class="font-mono font-bold text-emerald-600 text-base">SAR <span id="dash-crd-ret">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due / Payable</div><div class="font-mono font-bold text-red-500 text-base">SAR <span id="dash-crd-due">0.00</span></div></div>
            </div>
         </div>

      </div>

    </div>
  `,
  hr: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">HR Ledger & Payroll Management</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider">New Employee Entry</h3>
          <form id="form-hr-entry" class="space-y-3 text-xs">
            <div><label class="block font-bold text-gray-600 mb-0.5">Employee Name</label><input type="text" id="hr-name" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Designation (Manual Write)</label><input type="text" id="hr-designation" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Date of Joining</label><input type="date" id="hr-joining" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-600 mb-0.5">Salary Start</label><input type="number" id="hr-sal-start" value="0" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5">Increment Amount</label><input type="number" id="hr-sal-inc" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div><label class="block font-bold text-gray-500 mb-0.5">Current Salary</label><input type="number" id="hr-sal-current" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-semibold text-blue-600 outline-none text-sm"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-500 mb-0.5">Total Earn Earning</label><input type="number" id="hr-earn" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5">Paid Salary</label><input type="number" id="hr-paid" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div><label class="block font-bold text-gray-500 mb-0.5">Due Balance Salary</label><input type="number" id="hr-due" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-semibold text-red-600 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Employment Status</label><select id="hr-status" class="w-full border rounded p-1.5 bg-white text-sm font-medium outline-none"><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Released">Released</option></select></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded text-sm transition">COMMIT STAFF ENTITY</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider">Personnel Database Records</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5">Employee Name</th><th class="p-2.5">Designation</th><th class="p-2.5">Join Date</th><th class="p-2.5">Start Sal</th><th class="p-2.5">Increment</th><th class="p-2.5">Current Sal</th><th class="p-2.5">Total Earn</th><th class="p-2.5">Paid</th><th class="p-2.5">Due/Balance</th><th class="p-2.5">Status</th><th class="p-2.5">Actions</th>
                </tr>
              </thead>
              <tbody id="table-hr-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div id="modal-hr-edit" class="fixed inset-0 bg-slate-900/60 backup-blur-sm z-50 flex items-center justify-center p-4 hidden">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <div class="flex justify-between items-center border-b pb-3 mb-4"><h3 class="text-lg font-bold text-gray-800">Modify Employee Administrative File</h3><button id="close-hr-modal" class="text-2xl font-bold text-gray-400 hover:text-gray-700 focus:outline-none">&times;</button></div>
        <form id="form-hr-edit" class="grid grid-cols-2 gap-4 text-xs">
          <input type="hidden" id="edit-hr-id">
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1">Employee Name</label><input type="text" id="edit-hr-name" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Designation</label><input type="text" id="edit-hr-designation" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Date of Joining</label><input type="date" id="edit-hr-joining" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Salary Start</label><input type="number" id="edit-hr-sal-start" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Total Accumulated Increment</label><input type="number" id="edit-hr-sal-inc" required class="w-full border rounded p-2 text-sm outline-none" readonly bg-gray-50></div>
          <div><label class="block font-bold text-gray-500 mb-1">Current Salary</label><input type="number" id="edit-hr-sal-current" readonly class="w-full border rounded p-2 text-sm bg-gray-50 text-blue-600 font-bold"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Employment Status</label><select id="edit-hr-status" class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Released">Released</option></select></div>
          <div><label class="block font-bold text-gray-600 mb-1">Total Earn Earning</label><input type="number" id="edit-hr-earn" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Paid Salary</label><input type="number" id="edit-hr-paid" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div class="col-span-2"><label class="block font-bold text-gray-500 mb-1">Due Balance Salary</label><input type="number" id="edit-hr-due" readonly class="w-full border rounded p-2 text-sm bg-gray-50 text-red-600 font-bold"></div>
          <div class="col-span-2 border-t border-purple-100 pt-3 mt-1">
            <h4 class="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Grant New Salary Increment (Logs to History)</h4>
            <div class="grid grid-cols-3 gap-2 bg-purple-50/40 p-2.5 rounded-lg border border-purple-100">
              <div><label class="block font-bold text-gray-600 mb-0.5">Increment Amt</label><input type="number" id="edit-hr-new-inc-amt" step="0.01" class="w-full border rounded p-1 text-xs outline-none focus:border-purple-500 font-mono" placeholder="0.00"></div>
              <div><label class="block font-bold text-gray-600 mb-0.5">Effective Date</label><input type="date" id="edit-hr-new-inc-date" class="w-full border rounded p-1 text-xs outline-none focus:border-purple-500"></div>
              <div><label class="block font-bold text-gray-600 mb-0.5">Reason / Remarks</label><input type="text" id="edit-hr-new-inc-reason" class="w-full border rounded p-1 text-xs outline-none focus:border-purple-500" placeholder="e.g. Annual Bonus"></div>
              <div class="col-span-3 flex justify-end pt-1"><button type="button" id="btn-apply-increment" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1 rounded text-[11px] shadow-sm transition">Apply & Log Increment</button></div>
            </div>
          </div>
          <div class="col-span-2 pt-2 border-t flex justify-end space-x-2"><button type="button" id="btn-cancel-hr" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm">Cancel</button><button type="submit" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm shadow-md">SAVE OVERWRITE EDITS</button></div>
        </form>
      </div>
    </div>
  `,
  hr_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">HR Transaction Ledger</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Log Transaction</h3>
          <form id="form-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Transaction Date</label><input type="date" id="txn-date" required class="w-full border rounded p-2 text-sm outline-none"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Employee Name</label><select id="txn-employee" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="">-- Querying Personnel --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1">Amount</label><input type="number" step="0.01" id="txn-amount" required class="w-full border rounded p-2 text-sm outline-none" placeholder="0.00"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Category Classification</label><select id="txn-category" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Salary Earn">Salary Earn</option><option value="Salary Paid">Salary Paid</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1">Remarks / Reference</label><textarea id="txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none" placeholder="Optional notes..."></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition">POST TRANSACTION</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Transaction History Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">From Date</label><input type="date" id="filter-from-hr" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">To Date</label><input type="date" id="filter-to-hr" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div><button id="btn-filter-hr" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5">Date</th><th class="p-2.5">Employee Name</th><th class="p-2.5">Amount</th><th class="p-2.5">Category</th><th class="p-2.5">Remarks</th><th class="p-2.5">Logged By</th><th class="p-2.5">System Stamp</th></tr>
              </thead>
              <tbody id="table-txn-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  suppliers: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Supplier Account Management</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider">New Supplier Entry</h3>
          <form id="form-sup-entry" class="space-y-3 text-xs">
            <div><label class="block font-bold text-gray-600 mb-0.5">Supplier Name</label><input type="text" id="sup-name" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Mobile Contact Number</label><input type="text" id="sup-mobile" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Email Address</label><input type="email" id="sup-email" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Physical Business Address</label><input type="text" id="sup-address" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-500 mb-0.5">Total Purchase</label><input type="number" id="sup-purchase" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5">Total Payments</label><input type="number" id="sup-payments" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div><label class="block font-bold text-gray-500 mb-0.5">Due / Balance (Auto Calculate)</label><input type="number" id="sup-due" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-semibold text-red-600 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Account Status</label><select id="sup-status" class="w-full border rounded p-1.5 bg-white text-sm font-medium outline-none"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded text-sm transition tracking-wider">REGISTER SUPPLIER</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider">Supplier Master Accounts</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5">Supplier Name</th><th class="p-2.5">Mobile</th><th class="p-2.5">Email</th><th class="p-2.5">Address</th><th class="p-2.5">Total Purchase</th><th class="p-2.5">Total Payments</th><th class="p-2.5">Due/Balance</th><th class="p-2.5">Status</th><th class="p-2.5">Actions</th>
                </tr>
              </thead>
              <tbody id="table-sup-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div id="modal-sup-edit" class="fixed inset-0 bg-slate-900/60 backup-blur-sm z-50 flex items-center justify-center p-4 hidden">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <div class="flex justify-between items-center border-b pb-3 mb-4"><h3 class="text-lg font-bold text-gray-800">Modify Supplier Profile File</h3><button id="close-sup-modal" class="text-2xl font-bold text-gray-400 hover:text-gray-700 focus:outline-none">&times;</button></div>
        <form id="form-sup-edit" class="grid grid-cols-2 gap-4 text-xs">
          <input type="hidden" id="edit-sup-id">
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1">Supplier Name</label><input type="text" id="edit-sup-name" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Mobile</label><input type="text" id="edit-sup-mobile" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Email</label><input type="email" id="edit-sup-email" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1">Address</label><input type="text" id="edit-sup-address" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Total Purchase</label><input type="number" id="edit-sup-purchase" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Total Payments</label><input type="number" id="edit-sup-payments" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-500 mb-1">Due Balance (Calculated)</label><input type="number" id="edit-sup-due" readonly class="w-full border rounded p-2 text-sm bg-gray-50 text-red-600 font-bold"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Account Status</label><select id="edit-sup-status" class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
          <div class="col-span-2 pt-2 border-t flex justify-end space-x-2"><button type="button" id="btn-cancel-sup" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm">Cancel</button><button type="submit" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm shadow-md">SAVE OVERWRITE EDITS</button></div>
        </form>
      </div>
    </div>
  `,
  supplier_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Supplier Transaction Ledger</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Log Supplier Transaction</h3>
          <form id="form-sup-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Transaction Date</label><input type="date" id="sup-txn-date" required class="w-full border rounded p-2 text-sm outline-none"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Supplier Account Selection</label><select id="sup-txn-supplier" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="">-- Querying Registered Accounts --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1">Transaction Amount</label><input type="number" step="0.01" id="sup-txn-amount" required class="w-full border rounded p-2 text-sm outline-none" placeholder="0.00"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Category Classification</label><select id="sup-txn-category" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Purchase">Purchase (Increases Due)</option><option value="Payment Paid">Payment Paid (Decreases Due)</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1">Remarks / Reference Info</label><textarea id="sup-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none" placeholder="Invoice reference number, notes..."></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider">POST TRANSACTION ENTRY</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Historical Book Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">From Date</label><input type="date" id="filter-from-sup" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">To Date</label><input type="date" id="filter-to-sup" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div><button id="btn-filter-sup" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5">Date</th><th class="p-2.5">Supplier Name</th><th class="p-2.5">Amount</th><th class="p-2.5">Category</th><th class="p-2.5">Remarks / Reference</th><th class="p-2.5">Logged By</th><th class="p-2.5">System Stamp</th></tr>
              </thead>
              <tbody id="table-sup-txn-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  customers: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Customer Accounts Matrix</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider">New Customer Sales Entry</h3>
          <form id="form-cust-entry" class="space-y-2.5 text-xs">
            <div><label class="block font-bold text-gray-600 mb-0.5">Invoice / Memo Number</label><input type="text" id="cust-memo" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. INV-5501"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Customer Name</label><input type="text" id="cust-name" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Mobile Contact</label><input type="text" id="cust-mobile" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Email Address</label><input type="email" id="cust-email" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5">Physical Address</label><input type="text" id="cust-address" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div class="border-t border-gray-100 pt-2 mt-2"><label class="block font-bold text-gray-500 mb-0.5">Total Gross Sell Amount</label><input type="number" step="0.01" id="cust-sell" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono font-bold"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-500 mb-0.5">Cash Paid Amt</label><input type="number" step="0.01" id="cust-cash" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5">Card Paid Amt</label><input type="number" step="0.01" id="cust-card" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-500 mb-0.5">Total Received</label><input type="number" id="cust-received" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-semibold text-gray-700 outline-none text-sm font-mono"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5">Discount Issued</label><input type="number" step="0.01" id="cust-discount" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div><label class="block font-bold text-red-600 mb-0.5">Outstanding Balance Due</label><input type="number" id="cust-due" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-bold text-red-600 outline-none text-sm font-mono"></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded text-sm transition tracking-wider">COMMIT CUSTOMER SALE</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider">Customer Master Invoice Ledger</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5">System Unique ID</th><th class="p-2.5">Customer Name</th><th class="p-2.5">Memo #</th><th class="p-2.5">Total Sell</th><th class="p-2.5">Cash Amt</th><th class="p-2.5">Card Amt</th><th class="p-2.5">Received</th><th class="p-2.5">Discount</th><th class="p-2.5">Due Balance</th><th class="p-2.5">Actions</th>
                </tr>
              </thead>
              <tbody id="table-cust-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div id="modal-cust-edit" class="fixed inset-0 bg-slate-900/60 backup-blur-sm z-50 flex items-center justify-center p-4 hidden">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <div class="flex justify-between items-center border-b pb-3 mb-4"><h3 class="text-lg font-bold text-gray-800">Modify Customer Sales Record</h3><button id="close-cust-modal" class="text-2xl font-bold text-gray-400 hover:text-gray-700 focus:outline-none">&times;</button></div>
        <form id="form-cust-edit" class="grid grid-cols-2 gap-4 text-xs">
          <input type="hidden" id="edit-cust-id">
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1">System Unique Tracking ID</label><input type="text" id="edit-cust-uid" readonly class="w-full border rounded p-2 text-sm bg-gray-50 font-mono text-gray-500"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Customer Name</label><input type="text" id="edit-cust-name" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Invoice / Memo #</label><input type="text" id="edit-cust-memo" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Mobile Contact</label><input type="text" id="edit-cust-mobile" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1">Email Address</label><input type="email" id="edit-cust-email" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1">Physical Address</label><input type="text" id="edit-cust-address" required class="w-full border rounded p-2 text-sm outline-none"></div>
          
          <div class="col-span-2 border-t pt-2 mt-1"><label class="block font-bold text-gray-600 mb-1">Gross Sell Amount</label><input type="number" step="0.01" id="edit-cust-sell" required class="w-full border rounded p-2 text-sm font-bold font-mono"></div>
          <div><label class="block font-bold text-emerald-700 mb-1">Cash Paid Amt</label><input type="number" step="0.01" id="edit-cust-cash" required class="w-full border rounded p-2 text-sm font-mono"></div>
          <div><label class="block font-bold text-blue-700 mb-1">Card Paid Amt</label><input type="number" step="0.01" id="edit-cust-card" required class="w-full border rounded p-2 text-sm font-mono"></div>
          <div><label class="block font-bold text-gray-500 mb-1">Total Received (Calculated)</label><input type="number" id="edit-cust-received" readonly class="w-full border rounded p-2 text-sm bg-gray-50 font-mono"></div>
          <div><label class="block font-bold text-purple-700 mb-1">Discount Allowed</label><input type="number" step="0.01" id="edit-cust-discount" required class="w-full border rounded p-2 text-sm font-mono"></div>
          <div class="col-span-2"><label class="block font-bold text-red-600 mb-1">Outstanding Balance Due</label><input type="number" id="edit-cust-due" readonly class="w-full border rounded p-2 text-sm bg-gray-50 text-red-600 font-bold font-mono"></div>
          
          <div class="col-span-2 pt-2 border-t flex justify-end space-x-2"><button type="button" id="btn-cancel-cust" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm">Cancel</button><button type="submit" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm shadow-md">OVERWRITE RE-CALCULATE</button></div>
        </form>
      </div>
    </div>
  `,
  customer_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Customer Transaction Logging</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Log Customer Payment</h3>
          <form id="form-cust-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Transaction Date</label><input type="date" id="cust-txn-date" required class="w-full border rounded p-2 text-sm outline-none"></div>
            <div><label class="block font-bold text-gray-600 mb-1">System Unique ID</label><select id="cust-txn-uid" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="">-- Querying Accounts --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1">Sold Amount</label><input type="number" step="0.01" id="cust-txn-sell" value="0" required class="w-full border rounded p-2 text-sm outline-none" placeholder="0.00"></div>
            <div><label class="block font-bold text-emerald-700 mb-1">Received Amount</label><input type="number" step="0.01" id="cust-txn-received" value="0" required class="w-full border rounded p-2 text-sm outline-none focus:ring-emerald-500" placeholder="0.00"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Payment Method</label><select id="cust-txn-method" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Cash">Cash</option><option value="Card">Card</option></select></div>
            <div><label class="block font-bold text-gray-500 mb-1">Transaction Due / Balance</label><input type="number" id="cust-txn-due" readonly class="w-full border rounded p-2 text-sm bg-gray-50 font-bold text-red-600 outline-none"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Remarks / Reference Info</label><textarea id="cust-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none" placeholder="Invoice details, receipt #..."></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider">POST TRANSACTION</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Customer Historical Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">From Date</label><input type="date" id="filter-from-cust" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">To Date</label><input type="date" id="filter-to-cust" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div><button id="btn-filter-cust" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5">Date</th><th class="p-2.5">Sys UID</th><th class="p-2.5">Sold Amt</th><th class="p-2.5">Received Amt</th><th class="p-2.5">Method</th><th class="p-2.5">Txn Due</th><th class="p-2.5">Remarks</th><th class="p-2.5">Logged By</th><th class="p-2.5">Stamp</th></tr>
              </thead>
              <tbody id="table-cust-txn-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  internal_transfer: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Internal Cash Handover Transfer</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Log Transfer to Owner</h3>
          <form id="form-internal-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Transfer Date</label><input type="date" id="int-date" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"></div>
            <div><label class="block font-bold text-emerald-700 mb-1">Transfer Cash Amount</label><input type="number" step="0.01" id="int-amount" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold" placeholder="0.00"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Description / Narrative Note</label><textarea id="int-desc" rows="3" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Cash handed over to owner for bank deposit..."></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider uppercase">Execute Cash Handover</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Historical Cash Transfer Ledger</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">From Date</label><input type="date" id="filter-from-int" class="w-full border rounded p-2 outline-none focus:border-emerald-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">To Date</label><input type="date" id="filter-to-int" class="w-full border rounded p-2 outline-none focus:border-emerald-500"></div>
            <div><button id="btn-filter-int" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5">Date</th><th class="p-2.5">System Unique ID</th><th class="p-2.5">Transfer Amount</th><th class="p-2.5">Description / Purpose</th><th class="p-2.5">Transferred By</th><th class="p-2.5">System Stamp</th></tr>
              </thead>
              <tbody id="table-internal-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  expense_heads: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Expense Category Setup</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Create Expense Matrix</h3>
          <form id="form-exp-head-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Expense Parent Head</label><input type="text" id="exp-head-main" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Utilities, Logistics"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Sub Head Assignment</label><input type="text" id="exp-head-sub" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Electricity, Diesel Fuel"></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition uppercase tracking-wider">Register Category</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Configured Expense Structures</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5">System Unique ID</th><th class="p-2.5">Expense Parent Head</th><th class="p-2.5">Sub Head Name</th><th class="p-2.5 font-bold text-gray-700">Total Incurred</th><th class="p-2.5 font-bold text-emerald-600">Total Paid</th><th class="p-2.5 font-bold text-red-600">Due/Balance</th><th class="p-2.5">Authorized By</th><th class="p-2.5">Creation Stamp</th>
                </tr>
              </thead>
              <tbody id="table-exp-head-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  expense_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Operational Expense Ledger</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Log Transaction Entry</h3>
          <form id="form-exp-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Transaction Date</label><input type="date" id="exp-txn-date" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Expense Parent Head</label><select id="exp-txn-main" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"><option value="">-- Load Parent Head --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1">Sub Head Mapping</label><select id="exp-txn-sub" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"><option value="">-- Choose Parent First --</option></select></div>
            <div class="p-3 bg-gray-50 border rounded-lg space-y-3">
              <div><label class="block font-bold text-gray-700 mb-1">Total Deposit (Incurred Amt)</label><input type="number" step="0.01" id="exp-txn-deposit" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-blue-500"></div>
              <div><label class="block font-bold text-emerald-700 mb-1">Actually Paid Amount</label><input type="number" step="0.01" id="exp-txn-paid" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-emerald-500"></div>
              <div class="pt-2 border-t border-gray-200"><label class="block font-bold text-red-600 mb-1">Transaction Due / Balance</label><input type="number" id="exp-txn-due" readonly class="w-full border rounded p-2 text-sm bg-white font-bold text-red-600 outline-none shadow-inner"></div>
            </div>
            <div><label class="block font-bold text-gray-600 mb-1">Remarks / Narrative</label><textarea id="exp-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-red-500" placeholder="Invoice details, voucher references..."></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-red-600 hover:bg-red-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider uppercase">Post Expense Line</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          
          <div class="bg-gradient-to-r from-red-500 to-orange-600 p-6 rounded-2xl shadow-xl border text-white flex justify-between items-center mb-6">
            <div class="flex gap-8">
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80">Filtered Paid Total</h4><div class="text-3xl font-black font-mono tracking-tight mt-1">SAR <span id="expense-total-paid">0.00</span></div></div>
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80">Filtered Due Balance</h4><div class="text-3xl font-black font-mono tracking-tight mt-1 text-red-100">SAR <span id="expense-total-due">0.00</span></div></div>
            </div>
            <div class="bg-white/20 p-3 rounded-xl backdrop-blur-md hidden sm:block">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10m9-10V4a2 2 0 00-2-2H5a2 2 0 00-2 2v5m15 0h2a2 2 0 002-2V4a2 2 0 00-2-2h-2a2 2 0 00-2 2v5m-4 0h4a2 2 0 002-2V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v5m0 0v14a2 2 0 002 2h2a2 2 0 002-2V9"></path></svg>
            </div>
          </div>

          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Historical Book Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">From Date</label><input type="date" id="filter-from-exp" class="w-full border rounded p-2 outline-none focus:border-red-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">To Date</label><input type="date" id="filter-to-exp" class="w-full border rounded p-2 outline-none focus:border-red-500"></div>
            <div><button id="btn-filter-exp" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5">Date</th><th class="p-2.5">Parent Category</th><th class="p-2.5">Sub Head</th><th class="p-2.5">Deposit</th><th class="p-2.5">Paid Amt</th><th class="p-2.5">Txn Due</th><th class="p-2.5">Remarks / Vouchers</th><th class="p-2.5">Logged By</th><th class="p-2.5">Stamp</th></tr>
              </thead>
              <tbody id="table-exp-txn-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  creditors: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Creditor Setup (Liabilities)</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Create Creditor Head</h3>
          <form id="form-cred-head-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Creditor Parent Head</label><input type="text" id="cred-head-main" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g., Bank Loans, Investor X"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Sub Head Name</label><input type="text" id="cred-head-sub" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g., Term Loan #1"></div>
            <button type="submit" class="erp-submit-btn w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded text-sm transition uppercase tracking-wider">Register Creditor</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Configured Creditor Structures</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5">Tracking ID</th><th class="p-2.5">Creditor Parent Head</th><th class="p-2.5">Sub Head</th><th class="p-2.5 font-bold text-gray-700">Total Received</th><th class="p-2.5 font-bold text-emerald-600">Total Returned</th><th class="p-2.5 font-bold text-red-600">Due/Balance</th><th class="p-2.5">Created By</th><th class="p-2.5">Creation Stamp</th>
                </tr>
              </thead>
              <tbody id="table-cred-head-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  creditor_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Creditor Ledger (Loans & Returns)</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Log Creditor Action</h3>
          <form id="form-cred-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Transaction Date</label><input type="date" id="cred-txn-date" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Creditor Parent Head</label><select id="cred-txn-main" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-orange-500"><option value="">-- Load Parent Head --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1">Sub Head Mapping</label><select id="cred-txn-sub" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-orange-500"><option value="">-- Choose Parent First --</option></select></div>
            
            <div class="p-3 bg-gray-50 border rounded-lg space-y-3">
              <div><label class="block font-bold text-gray-700 mb-1">Received Amount (Cash In)</label><input type="number" step="0.01" id="cred-txn-received" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-gray-500"></div>
              <div><label class="block font-bold text-emerald-700 mb-1">Return Amount (Cash Out)</label><input type="number" step="0.01" id="cred-txn-return" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-emerald-500"></div>
              <div class="pt-2 border-t border-gray-200"><label class="block font-bold text-red-600 mb-1">Transaction Due / Balance</label><input type="number" id="cred-txn-due" readonly class="w-full border rounded p-2 text-sm bg-white font-bold text-red-600 outline-none shadow-inner"></div>
            </div>

            <div><label class="block font-bold text-gray-600 mb-1">Remarks / Narrative</label><textarea id="cred-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-orange-500" placeholder="Bank receipt, check numbers..."></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider uppercase">Post Creditor Line</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          
          <div class="bg-gradient-to-r from-orange-500 to-amber-600 p-6 rounded-2xl shadow-xl border text-white flex justify-between items-center mb-6">
            <div class="flex gap-8">
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80">Filtered Received Total</h4><div class="text-3xl font-black font-mono tracking-tight mt-1">SAR <span id="cred-total-received">0.00</span></div></div>
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80">Filtered Returned Total</h4><div class="text-3xl font-black font-mono tracking-tight mt-1 text-emerald-100">SAR <span id="cred-total-returned">0.00</span></div></div>
            </div>
          </div>

          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Historical Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">From Date</label><input type="date" id="filter-from-cred" class="w-full border rounded p-2 outline-none focus:border-orange-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">To Date</label><input type="date" id="filter-to-cred" class="w-full border rounded p-2 outline-none focus:border-orange-500"></div>
            <div><button id="btn-filter-cred" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5">Date</th><th class="p-2.5">Parent Category</th><th class="p-2.5">Sub Head</th><th class="p-2.5">Received Amt</th><th class="p-2.5">Return Amt</th><th class="p-2.5">Txn Due</th><th class="p-2.5">Remarks</th><th class="p-2.5">Logged By</th><th class="p-2.5">Stamp</th></tr>
              </thead>
              <tbody id="table-cred-txn-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  income_heads: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Income Category Setup (Revenues)</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Create Income Matrix</h3>
          <form id="form-inc-head-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Income Parent Head</label><input type="text" id="inc-head-main" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Services, Rent"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Sub Head Assignment</label><input type="text" id="inc-head-sub" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Consulting, Warehouse A"></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition uppercase tracking-wider">Register Income Category</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Configured Income Structures</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5">System Unique ID</th><th class="p-2.5">Income Parent Head</th><th class="p-2.5">Sub Head Name</th><th class="p-2.5 font-bold text-gray-700">Total Receivable</th><th class="p-2.5 font-bold text-emerald-600">Total Received</th><th class="p-2.5 font-bold text-red-600">Due/Balance</th><th class="p-2.5">Authorized By</th><th class="p-2.5">Creation Stamp</th>
                </tr>
              </thead>
              <tbody id="table-inc-head-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  income_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Income Ledger Logging</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Log Income Entry</h3>
          <form id="form-inc-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1">Transaction Date</label><input type="date" id="inc-txn-date" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"></div>
            <div><label class="block font-bold text-gray-600 mb-1">Income Parent Head</label><select id="inc-txn-main" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"><option value="">-- Load Parent Head --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1">Sub Head Mapping</label><select id="inc-txn-sub" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"><option value="">-- Choose Parent First --</option></select></div>
            
            <div class="p-3 bg-gray-50 border rounded-lg space-y-3">
              <div><label class="block font-bold text-gray-700 mb-1">Receivable Amount (Billed)</label><input type="number" step="0.01" id="inc-txn-receivable" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-gray-500"></div>
              <div><label class="block font-bold text-emerald-700 mb-1">Actually Received (Cash In)</label><input type="number" step="0.01" id="inc-txn-received" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-emerald-500"></div>
              <div class="pt-2 border-t border-gray-200"><label class="block font-bold text-red-600 mb-1">Transaction Due / Balance</label><input type="number" id="inc-txn-due" readonly class="w-full border rounded p-2 text-sm bg-white font-bold text-red-600 outline-none shadow-inner"></div>
            </div>

            <div><label class="block font-bold text-gray-600 mb-1">Remarks / Narrative</label><textarea id="inc-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Client names, details..."></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider uppercase">Post Income Line</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-xl border text-white flex justify-between items-center mb-6">
            <div class="flex gap-8">
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80">Filtered Received Total</h4><div class="text-3xl font-black font-mono tracking-tight mt-1">SAR <span id="inc-total-received">0.00</span></div></div>
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80">Filtered Due Balance</h4><div class="text-3xl font-black font-mono tracking-tight mt-1 text-red-200">SAR <span id="inc-total-due">0.00</span></div></div>
            </div>
          </div>

          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Historical Book Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">From Date</label><input type="date" id="filter-from-inc" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">To Date</label><input type="date" id="filter-to-inc" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div><button id="btn-filter-inc" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5">Date</th><th class="p-2.5">Parent Category</th><th class="p-2.5">Sub Head</th><th class="p-2.5">Receivable</th><th class="p-2.5">Received Amt</th><th class="p-2.5">Txn Due</th><th class="p-2.5">Remarks</th><th class="p-2.5">Logged By</th><th class="p-2.5">Stamp</th></tr>
              </thead>
              <tbody id="table-inc-txn-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  all_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">All Transaction View (Master Audit)</h2>
      </div>
      <div class="bg-white p-3 md:p-5 rounded-xl shadow border border-gray-200 flex flex-col overflow-visible md:overflow-hidden md:h-[85vh]">
        
        <div class="bg-gray-50 border border-gray-200 p-3 md:p-4 rounded-lg mb-4 flex flex-col md:flex-row md:flex-wrap md:items-end gap-3 md:gap-4 text-xs shadow-inner erp-mobile-filter-bar">
          <div class="flex-1 min-w-[140px]"><label class="block text-gray-600 font-bold mb-1">From Date</label><input type="date" id="filter-from-all" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
          <div class="flex-1 min-w-[140px]"><label class="block text-gray-600 font-bold mb-1">To Date</label><input type="date" id="filter-to-all" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
          <div class="flex-1 min-w-[160px]">
            <label class="block text-gray-600 font-bold mb-1">Transaction Category</label>
            <select id="filter-module-all" class="w-full border rounded p-2 outline-none bg-white focus:border-blue-500 font-medium">
              <option value="">All Categories (Default)</option>
              <option value="HR">HR Transactions</option>
              <option value="Supplier">Supplier Transactions</option>
              <option value="Customer">Customer Transactions</option>
              <option value="Expense">Expense Transactions</option>
              <option value="Creditor">Creditor Transactions</option>
              <option value="Income">Income Transactions</option>
              <option value="Internal">Internal Transfers</option>
            </select>
          </div>
          <div><button id="btn-filter-all" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded transition shadow-sm">Search / Filter Records</button></div>
        </div>

        <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:overflow-y-auto relative">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-800 text-white uppercase whitespace-nowrap sticky top-0 z-10 shadow">
              <tr><th class="p-3">Date</th><th class="p-3">Category</th><th class="p-3">Transaction Details</th><th class="p-3">Financial Impact</th><th class="p-3">Remarks / Narrative</th><th class="p-3">Logged By</th><th class="p-3">Stamp</th></tr>
            </thead>
            <tbody id="table-all-txn-rows" class="divide-y text-gray-600 font-medium">
              <tr><td colspan="7" class="p-6 text-center text-gray-400">Loading today's transactions...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  reports: `
    <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="erp-report-tools print:hidden">
        <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 class="text-lg md:text-2xl font-bold text-gray-800">Enterprise Reporting System</h2>
          <button onclick="window.print()" class="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded text-sm transition shadow-sm flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print / Export
          </button>
        </div>

        <div id="report-filters-panel" class="bg-gray-50 border border-gray-200 p-3 md:p-4 rounded-lg mt-3 md:mt-4 mb-2 md:mb-0 flex flex-col md:flex-row md:flex-wrap md:items-end gap-3 md:gap-4 text-xs shadow-inner erp-report-filters">
          <div class="w-full md:flex-1 md:min-w-[200px]">
            <label class="block text-gray-600 font-bold mb-1">Select Master Report</label>
            <select id="report-type" class="w-full border rounded p-2.5 outline-none bg-white focus:border-blue-500 font-medium text-sm">
              <option value="">-- Choose Report Type --</option>
              <option value="daily_monthly">Daily / Monthly Aggregate Report</option>
              <option value="daily_cashflow">Daily Accounts Cash Flow (IN & OUT)</option>
              <option value="pnl">Profit & Loss Report</option>
              <option value="receivable_payable">Receivable and Payable Report</option>
              <option value="expense_report">Expense Report</option>
              <option value="customer_details" class="font-bold text-blue-600">Customer Details Report (Statement)</option>
              <option value="supplier_details">Supplier Details Report</option>
              <option value="hr_details">HR Details Report</option>
              <option value="user_transaction">User Sells Performance Report</option>
              <option value="individual_user">Individual User Report</option>
            </select>
          </div>
          
          <div class="w-full md:flex-1 md:min-w-[150px] hidden" id="report-secondary-filter-container">
            <label class="block text-gray-600 font-bold mb-1" id="report-secondary-label">Specific Target</label>
            <select id="report-secondary-filter" class="w-full border rounded p-2.5 outline-none bg-white focus:border-blue-500 text-sm">
            </select>
          </div>

          <div class="w-full md:flex-1 md:min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">From Date</label><input type="date" id="report-from" class="w-full border rounded p-2.5 outline-none focus:border-blue-500 text-sm"></div>
          <div class="w-full md:flex-1 md:min-w-[120px]"><label class="block text-gray-600 font-bold mb-1">To Date</label><input type="date" id="report-to" class="w-full border rounded p-2.5 outline-none focus:border-blue-500 text-sm"></div>
          <div class="w-full md:w-auto"><button id="btn-generate-report" class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded transition shadow-sm min-h-[44px]">Execute Query</button></div>
        </div>
      </div>

      <div id="report-results-anchor" aria-hidden="true"></div>
      
      <div class="bg-white p-3 md:p-5 rounded-xl shadow border border-gray-200 flex flex-col overflow-visible print:shadow-none print:border-none print:p-0 erp-report-results">
        <div id="report-print-header" class="hidden mb-4 md:mb-6 text-center border-b pb-4 print:block">
          <h1 class="text-lg md:text-2xl font-black text-gray-800 uppercase tracking-wide md:tracking-widest px-2" id="report-title-display">Report Name</h1>
          <p class="text-xs md:text-sm font-medium text-gray-500 mt-1 px-2" id="report-date-display">Date Range: </p>
          <p class="text-[10px] md:text-xs text-gray-400 mt-1 px-2 break-words" id="report-target-display"></p>
        </div>

        <div id="report-summary-cards" class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6 hidden">
        </div>

        <div id="report-table-container" class="erp-report-panel border rounded-lg relative print:border-none bg-white">
           <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
              <table class="erp-report-table w-full text-left border-collapse text-xs">
                <thead id="report-table-head" class="bg-slate-800 text-white sticky top-0 z-10 shadow print:bg-gray-100 print:text-gray-800 print:shadow-none border-b">
                  <tr><th class="p-3 text-center text-gray-300 font-normal normal-case">Select parameters and execute query to build report.</th></tr>
                </thead>
                <tbody id="report-table-body" class="divide-y text-gray-600 font-medium">
                </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  `,
  users: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-4"><h2 class="text-2xl font-bold text-gray-800">User Access Management</h2></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="bg-white p-6 rounded-xl shadow border lg:col-span-1 border-gray-200 erp-mobile-user-form">
          <h3 class="text-lg font-semibold text-gray-700 mb-4">Provision Account</h3>
          <form id="form-create-user" class="space-y-4">
            <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1">Username</label><input type="text" id="new-username" required class="w-full border rounded p-2 outline-none"></div>
            <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label><input type="password" id="new-password" required class="w-full border rounded p-2 outline-none"></div>
            <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1">Account Assignment Role</label><select id="new-role" class="w-full border rounded p-2 bg-white outline-none"><option value="User">Standard operational User</option><option value="Admin">System Admin</option></select></div>
            <div>
              <label class="block text-xs font-bold uppercase text-gray-500 mb-2">Menu Execution Scopes</label>
              <div class="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded border text-xs">
                
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Dashboard" checked> <span>Dashboard</span></label>
                
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="HR"> <span>HR Menu</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="HR_Transactions"> <span>HR Transactions</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Suppliers"> <span>Suppliers</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Supplier_Transactions"> <span>Supplier Transactions</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Customers"> <span>Customers</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Customer_Transactions"> <span>Customer Transactions</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Internal_Transfer"> <span>Internal Transfer</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Expense_Heads"> <span>Expense Heads</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Expense_Transactions"> <span>Expense Ledger</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Creditors"> <span class="text-orange-600 font-bold">Creditors</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Creditor_Transactions"> <span class="text-orange-600 font-bold">Creditor Txns</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Income_Heads"> <span class="text-blue-600 font-bold">Income Heads</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Income_Transactions"> <span class="text-blue-600 font-bold">Income Txns</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="All_Transactions"> <span class="text-slate-800 font-bold">All Transactions</span></label>
                <label class="flex items-center space-x-2"><input type="checkbox" name="perm" value="Reports"> <span class="text-purple-600 font-bold">Reports</span></label>
              </div>
            </div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded transition">Register User</button>
          </form>
        </div>
        <div class="bg-white p-6 rounded-xl shadow border border-gray-200 lg:col-span-2 flex flex-col h-[70vh]">
          <h3 class="text-lg font-semibold text-gray-700 mb-4">Active Directories</h3>
          <div class="overflow-y-auto border rounded-lg flex-1">
             <table class="w-full text-left border-collapse text-xs">
               <thead class="bg-slate-800 text-white uppercase whitespace-nowrap sticky top-0 z-10 shadow">
                 <tr><th class="p-3">Username</th><th class="p-3">Role</th><th class="p-3">Permissions Scope</th></tr>
               </thead>
               <tbody id="table-users-list" class="divide-y text-gray-600 font-medium">
                 <tr><td colspan="3" class="p-6 text-center text-gray-400 animate-pulse">Loading system operators...</td></tr>
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  `
};