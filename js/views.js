export const templates = {
  dashboard: `
    <div class="space-y-6 pb-10">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.dashboard.title">Executive Dashboard</h2>
        <button id="btn-refresh-dash" type="button" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait text-white font-bold px-4 py-2 rounded shadow-sm text-xs uppercase tracking-wider transition" data-i18n="common.refresh">Refresh Data</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div class="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <h3 class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2" data-i18n="dash.totalReceivable">Total Market Receivable</h3>
            <div class="text-4xl font-black font-mono tracking-tight">SAR <span id="dash-recv">0.00</span></div>
         </div>
         <div class="bg-gradient-to-r from-red-500 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <h3 class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2" data-i18n="dash.totalPayable">Total Enterprise Payable</h3>
            <div class="text-4xl font-black font-mono tracking-tight">SAR <span id="dash-pay">0.00</span></div>
         </div>
      </div>

      <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mt-4" data-i18n="dash.revenueStreams">Revenue Streams (Lifetime)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div class="flex justify-between items-center mb-4">
               <h4 class="font-bold text-blue-800 text-lg" data-i18n="dash.customerSales">Customer Sales</h4>
               <span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-bold" data-i18n="dash.lifetime">LIFETIME</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
               <div>
                  <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.totalSold">Total Sold</div>
                  <div class="font-mono font-bold text-lg text-gray-700">SAR <span id="dash-sale-sold">0.00</span></div>
               </div>
               <div>
                  <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.dueBalance">Due / Balance</div>
                  <div class="font-mono font-bold text-lg text-red-500">SAR <span id="dash-sale-due">0.00</span></div>
               </div>
               <div class="col-span-2 border-t pt-3 mt-1">
                  <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1" data-i18n="dash.totalReceived">Total Received</div>
                  <div class="font-mono font-black text-2xl text-emerald-600">SAR <span id="dash-sale-recv">0.00</span></div>
                  <div class="text-xs font-medium text-gray-500 mt-1 flex gap-4">
                     <span data-i18n="dash.cash">Cash:</span> <b class="text-emerald-500 font-mono" id="dash-sale-cash">0.00</b></span>
                     <span><span data-i18n="dash.card">Card:</span> <b class="text-blue-500 font-mono" id="dash-sale-card">0.00</b></span>
                  </div>
               </div>
            </div>
         </div>

         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
            <div class="flex justify-between items-center mb-4">
               <h4 class="font-bold text-indigo-800 text-lg" data-i18n="dash.otherIncome">Other Income</h4>
               <span class="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-1 rounded font-bold" data-i18n="dash.lifetime">LIFETIME</span>
            </div>
            <div class="space-y-4 mt-2 flex-1 flex flex-col justify-center">
               <div class="flex justify-between items-center border-b pb-2">
                  <div class="text-xs text-gray-500 font-bold uppercase tracking-wider" data-i18n="dash.initiatedBilled">Initiated / Billed</div>
                  <div class="font-mono font-bold text-gray-800 text-lg">SAR <span id="dash-inc-billed">0.00</span></div>
               </div>
               <div class="flex justify-between items-center border-b pb-2">
                  <div class="text-xs text-gray-500 font-bold uppercase tracking-wider" data-i18n="dash.totalReceived">Total Received</div>
                  <div class="font-mono font-bold text-emerald-600 text-lg">SAR <span id="dash-inc-recv">0.00</span></div>
               </div>
               <div class="flex justify-between items-center">
                  <div class="text-xs text-gray-500 font-bold uppercase tracking-wider" data-i18n="dash.dueBalance">Due / Balance</div>
                  <div class="font-mono font-bold text-red-500 text-lg">SAR <span id="dash-inc-due">0.00</span></div>
               </div>
            </div>
         </div>

      </div>

      <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mt-4" data-i18n="dash.expenditures">Expenditures & Liabilities (Lifetime)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         
         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 class="font-bold text-gray-800 mb-3 border-b pb-2" data-i18n="dash.supplierPurchases">Supplier Purchases</h4>
            <div class="space-y-3">
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.totalPurchased">Total Purchased</div><div class="font-mono font-bold text-gray-700 text-base">SAR <span id="dash-sup-pur">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.totalPaid">Total Paid</div><div class="font-mono font-bold text-emerald-600 text-base">SAR <span id="dash-sup-paid">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.dueBalance">Due / Payable</div><div class="font-mono font-bold text-red-500 text-base">SAR <span id="dash-sup-due">0.00</span></div></div>
            </div>
         </div>

         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 class="font-bold text-gray-800 mb-3 border-b pb-2" data-i18n="dash.operationalExpenses">Operational Expenses</h4>
            <div class="space-y-3">
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.totalIncurred">Total Incurred</div><div class="font-mono font-bold text-gray-700 text-base">SAR <span id="dash-exp-inc">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.totalPaid">Total Paid</div><div class="font-mono font-bold text-emerald-600 text-base">SAR <span id="dash-exp-paid">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.dueBalance">Due / Balance</div><div class="font-mono font-bold text-red-500 text-base">SAR <span id="dash-exp-due">0.00</span></div></div>
            </div>
         </div>

         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 class="font-bold text-orange-800 mb-3 border-b pb-2" data-i18n="dash.hrPayroll">HR & Payroll</h4>
            <div class="space-y-3">
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.totalEarned">Total Earned</div><div class="font-mono font-bold text-gray-700 text-base">SAR <span id="dash-hr-earned">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.salaryPaid">Salary Paid</div><div class="font-mono font-bold text-emerald-600 text-base">SAR <span id="dash-hr-paid">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.dueBalance">Due / Payable</div><div class="font-mono font-bold text-red-500 text-base">SAR <span id="dash-hr-due">0.00</span></div></div>
            </div>
         </div>

         <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 class="font-bold text-gray-800 mb-3 border-b pb-2" data-i18n="dash.creditorsLoans">Creditors (Loans)</h4>
            <div class="space-y-3">
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.totalReceived">Total Received</div><div class="font-mono font-bold text-gray-700 text-base">SAR <span id="dash-crd-recv">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.totalReturned">Total Returned</div><div class="font-mono font-bold text-emerald-600 text-base">SAR <span id="dash-crd-ret">0.00</span></div></div>
               <div><div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider" data-i18n="dash.dueBalance">Due / Payable</div><div class="font-mono font-bold text-red-500 text-base">SAR <span id="dash-crd-due">0.00</span></div></div>
            </div>
         </div>

      </div>

    </div>
  `,
  hr: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.hr.title">HR Ledger & Payroll Management</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider" data-i18n="page.hr.newEmployee">New Employee Entry</h3>
          <form id="form-hr-entry" class="space-y-3 text-xs">
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.employeeName">Employee Name</label><input type="text" id="hr-name" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.designationManual">Designation (Manual Write)</label><input type="text" id="hr-designation" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.dateOfJoining">Date of Joining</label><input type="date" id="hr-joining" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.salaryStart">Salary Start</label><input type="number" id="hr-sal-start" value="0" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.incrementAmount">Increment Amount</label><input type="number" id="hr-sal-inc" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.currentSalary">Current Salary</label><input type="number" id="hr-sal-current" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-semibold text-blue-600 outline-none text-sm"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.totalEarnEarning">Total Earn Earning</label><input type="number" id="hr-earn" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.paidSalary">Paid Salary</label><input type="number" id="hr-paid" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.dueBalanceSalary">Due Balance Salary</label><input type="number" id="hr-due" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-semibold text-red-600 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.employmentStatus">Employment Status</label><select id="hr-status" class="w-full border rounded p-1.5 bg-white text-sm font-medium outline-none"><option value="Active" data-i18n="status.active">Active</option><option value="Inactive" data-i18n="status.inactive">Inactive</option><option value="Released" data-i18n="status.released">Released</option></select></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded text-sm transition" data-i18n="form.hr.commitStaff">COMMIT STAFF ENTITY</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider" data-i18n="page.hr.personnelRecords">Personnel Database Records</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5" data-i18n="col.employeeName">Employee Name</th><th class="p-2.5" data-i18n="col.designation">Designation</th><th class="p-2.5" data-i18n="col.joinDate">Join Date</th><th class="p-2.5" data-i18n="col.startSal">Start Sal</th><th class="p-2.5" data-i18n="col.increment">Increment</th><th class="p-2.5" data-i18n="col.currentSal">Current Sal</th><th class="p-2.5" data-i18n="col.totalEarn">Total Earn</th><th class="p-2.5" data-i18n="col.paid">Paid</th><th class="p-2.5" data-i18n="col.dueBalance">Due/Balance</th><th class="p-2.5" data-i18n="col.status">Status</th><th class="p-2.5" data-i18n="col.actions">Actions</th>
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
        <div class="flex justify-between items-center border-b pb-3 mb-4"><h3 class="text-lg font-bold text-gray-800" data-i18n="form.hr.modifyTitle">Modify Employee Administrative File</h3><button id="close-hr-modal" class="text-2xl font-bold text-gray-400 hover:text-gray-700 focus:outline-none">&times;</button></div>
        <form id="form-hr-edit" class="grid grid-cols-2 gap-4 text-xs">
          <input type="hidden" id="edit-hr-id">
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1" data-i18n="field.employeeName">Employee Name</label><input type="text" id="edit-hr-name" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.designation">Designation</label><input type="text" id="edit-hr-designation" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.dateOfJoining">Date of Joining</label><input type="date" id="edit-hr-joining" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.salaryStart">Salary Start</label><input type="number" id="edit-hr-sal-start" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.totalAccumulatedIncrement">Total Accumulated Increment</label><input type="number" id="edit-hr-sal-inc" required class="w-full border rounded p-2 text-sm outline-none" readonly bg-gray-50></div>
          <div><label class="block font-bold text-gray-500 mb-1" data-i18n="field.currentSalary">Current Salary</label><input type="number" id="edit-hr-sal-current" readonly class="w-full border rounded p-2 text-sm bg-gray-50 text-blue-600 font-bold"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.employmentStatus">Employment Status</label><select id="edit-hr-status" class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Active" data-i18n="status.active">Active</option><option value="Inactive" data-i18n="status.inactive">Inactive</option><option value="Released" data-i18n="status.released">Released</option></select></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.totalEarnEarning">Total Earn Earning</label><input type="number" id="edit-hr-earn" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.paidSalary">Paid Salary</label><input type="number" id="edit-hr-paid" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div class="col-span-2"><label class="block font-bold text-gray-500 mb-1" data-i18n="field.dueBalanceSalary">Due Balance Salary</label><input type="number" id="edit-hr-due" readonly class="w-full border rounded p-2 text-sm bg-gray-50 text-red-600 font-bold"></div>
          <div class="col-span-2 border-t border-purple-100 pt-3 mt-1">
            <h4 class="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2" data-i18n="form.hr.grantIncrement">Grant New Salary Increment (Logs to History)</h4>
            <div class="grid grid-cols-3 gap-2 bg-purple-50/40 p-2.5 rounded-lg border border-purple-100">
              <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.incrementAmt">Increment Amt</label><input type="number" id="edit-hr-new-inc-amt" step="0.01" class="w-full border rounded p-1 text-xs outline-none focus:border-purple-500 font-mono" placeholder="0.00" data-i18n-placeholder="placeholder.zero"></div>
              <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.effectiveDate">Effective Date</label><input type="date" id="edit-hr-new-inc-date" class="w-full border rounded p-1 text-xs outline-none focus:border-purple-500"></div>
              <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.reasonRemarks">Reason / Remarks</label><input type="text" id="edit-hr-new-inc-reason" class="w-full border rounded p-1 text-xs outline-none focus:border-purple-500" placeholder="e.g. Annual Bonus" data-i18n-placeholder="placeholder.annualBonus"></div>
              <div class="col-span-3 flex justify-end pt-1"><button type="button" id="btn-apply-increment" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1 rounded text-[11px] shadow-sm transition" data-i18n="form.hr.applyIncrement">Apply & Log Increment</button></div>
            </div>
          </div>
          <div class="col-span-2 pt-2 border-t flex justify-end space-x-2"><button type="button" id="btn-cancel-hr" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm" data-i18n="common.cancel">Cancel</button><button type="submit" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm shadow-md" data-i18n="common.saveOverwrite">SAVE OVERWRITE EDITS</button></div>
        </form>
      </div>
    </div>
  `,
  hr_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.hrTransactions.title">HR Transaction Ledger</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.logTransaction">Log Transaction</h3>
          <form id="form-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.transactionDate">Transaction Date</label><input type="date" id="txn-date" required class="w-full border rounded p-2 text-sm outline-none"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.employeeName">Employee Name</label><select id="txn-employee" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="" data-i18n="dropdown.queryingPersonnel">-- Querying Personnel --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.amount">Amount</label><input type="number" step="0.01" id="txn-amount" required class="w-full border rounded p-2 text-sm outline-none" placeholder="0.00" data-i18n-placeholder="placeholder.zero"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.categoryClassification">Category Classification</label><select id="txn-category" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Salary Earn" data-i18n="category.salaryEarn">Salary Earn</option><option value="Salary Paid" data-i18n="category.salaryPaid">Salary Paid</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.remarksReference">Remarks / Reference</label><textarea id="txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none" placeholder="Optional notes..." data-i18n-placeholder="placeholder.optionalNotes"></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition" data-i18n="form.postTransaction">POST TRANSACTION</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.txnHistoryLog">Transaction History Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.fromDate">From Date</label><input type="date" id="filter-from-hr" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.toDate">To Date</label><input type="date" id="filter-to-hr" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div><button id="btn-filter-hr" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm" data-i18n="common.expandLoadLedger">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5" data-i18n="col.date">Date</th><th class="p-2.5" data-i18n="col.employeeName">Employee Name</th><th class="p-2.5" data-i18n="col.amount">Amount</th><th class="p-2.5" data-i18n="col.category">Category</th><th class="p-2.5" data-i18n="col.remarks">Remarks</th><th class="p-2.5" data-i18n="col.loggedBy">Logged By</th><th class="p-2.5" data-i18n="col.systemStamp">System Stamp</th><th class="p-2.5" data-i18n="col.actions">Actions</th></tr>
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
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.suppliers.title">Supplier Account Management</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider" data-i18n="form.sup.newEntry">New Supplier Entry</h3>
          <form id="form-sup-entry" class="space-y-3 text-xs">
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.supplierName">Supplier Name</label><input type="text" id="sup-name" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.mobileContactNumber">Mobile Contact Number</label><input type="text" id="sup-mobile" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.emailAddress">Email Address</label><input type="email" id="sup-email" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.physicalBusinessAddress">Physical Business Address</label><input type="text" id="sup-address" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.totalPurchase">Total Purchase</label><input type="number" id="sup-purchase" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.totalPayments">Total Payments</label><input type="number" id="sup-payments" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.dueBalanceAuto">Due / Balance (Auto Calculate)</label><input type="number" id="sup-due" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-semibold text-red-600 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.accountStatus">Account Status</label><select id="sup-status" class="w-full border rounded p-1.5 bg-white text-sm font-medium outline-none"><option value="Active" data-i18n="status.active">Active</option><option value="Inactive" data-i18n="status.inactive">Inactive</option></select></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded text-sm transition tracking-wider" data-i18n="form.sup.register">REGISTER SUPPLIER</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider" data-i18n="form.sup.masterAccounts">Supplier Master Accounts</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5" data-i18n="col.supplierName">Supplier Name</th><th class="p-2.5" data-i18n="col.mobile">Mobile</th><th class="p-2.5" data-i18n="col.email">Email</th><th class="p-2.5" data-i18n="col.address">Address</th><th class="p-2.5" data-i18n="col.totalPurchase">Total Purchase</th><th class="p-2.5" data-i18n="col.totalPayments">Total Payments</th><th class="p-2.5" data-i18n="col.dueBalance">Due/Balance</th><th class="p-2.5" data-i18n="col.status">Status</th><th class="p-2.5" data-i18n="col.actions">Actions</th>
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
        <div class="flex justify-between items-center border-b pb-3 mb-4"><h3 class="text-lg font-bold text-gray-800" data-i18n="form.sup.modifyTitle">Modify Supplier Profile File</h3><button id="close-sup-modal" class="text-2xl font-bold text-gray-400 hover:text-gray-700 focus:outline-none">&times;</button></div>
        <form id="form-sup-edit" class="grid grid-cols-2 gap-4 text-xs">
          <input type="hidden" id="edit-sup-id">
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1" data-i18n="field.supplierName">Supplier Name</label><input type="text" id="edit-sup-name" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="col.mobile">Mobile</label><input type="text" id="edit-sup-mobile" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="col.email">Email</label><input type="email" id="edit-sup-email" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1" data-i18n="col.address">Address</label><input type="text" id="edit-sup-address" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.totalPurchase">Total Purchase</label><input type="number" id="edit-sup-purchase" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.totalPayments">Total Payments</label><input type="number" id="edit-sup-payments" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-500 mb-1" data-i18n="field.dueBalanceCalc">Due Balance (Calculated)</label><input type="number" id="edit-sup-due" readonly class="w-full border rounded p-2 text-sm bg-gray-50 text-red-600 font-bold"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.accountStatus">Account Status</label><select id="edit-sup-status" class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Active" data-i18n="status.active">Active</option><option value="Inactive" data-i18n="status.inactive">Inactive</option></select></div>
          <div class="col-span-2 pt-2 border-t flex justify-end space-x-2"><button type="button" id="btn-cancel-sup" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm" data-i18n="common.cancel">Cancel</button><button type="submit" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm shadow-md" data-i18n="common.saveOverwrite">SAVE OVERWRITE EDITS</button></div>
        </form>
      </div>
    </div>
  `,
  supplier_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.supplierTransactions.title">Supplier Transaction Ledger</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.sup.logTransaction">Log Supplier Transaction</h3>
          <form id="form-sup-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.transactionDate">Transaction Date</label><input type="date" id="sup-txn-date" required class="w-full border rounded p-2 text-sm outline-none"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.supplierAccountSelection">Supplier Account Selection</label><select id="sup-txn-supplier" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="" data-i18n="dropdown.queryingAccounts">-- Querying Registered Accounts --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.transactionAmount">Transaction Amount</label><input type="number" step="0.01" id="sup-txn-amount" required class="w-full border rounded p-2 text-sm outline-none" placeholder="0.00" data-i18n-placeholder="placeholder.zero"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.categoryClassification">Category Classification</label><select id="sup-txn-category" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Purchase" data-i18n="category.purchaseIncreases">Purchase (Increases Due)</option><option value="Payment Paid" data-i18n="category.paymentDecreases">Payment Paid (Decreases Due)</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.remarksReferenceInfo">Remarks / Reference Info</label><textarea id="sup-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none" placeholder="Invoice reference number, notes..." data-i18n-placeholder="placeholder.invoiceRef"></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider" data-i18n="form.postTransactionEntry">POST TRANSACTION ENTRY</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.sup.historicalLedger">Historical Book Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.fromDate">From Date</label><input type="date" id="filter-from-sup" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.toDate">To Date</label><input type="date" id="filter-to-sup" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div><button id="btn-filter-sup" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm" data-i18n="common.expandLoadLedger">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5" data-i18n="col.date">Date</th><th class="p-2.5" data-i18n="col.supplierName">Supplier Name</th><th class="p-2.5" data-i18n="col.amount">Amount</th><th class="p-2.5" data-i18n="col.category">Category</th><th class="p-2.5" data-i18n="field.remarksReference">Remarks / Reference</th><th class="p-2.5" data-i18n="col.loggedBy">Logged By</th><th class="p-2.5" data-i18n="col.systemStamp">System Stamp</th><th class="p-2.5" data-i18n="col.actions">Actions</th></tr>
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
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.customers.title">Customer Accounts Matrix</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider" data-i18n="form.cust.newSalesEntry">New Customer Sales Entry</h3>
          <form id="form-cust-entry" class="space-y-2.5 text-xs">
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.invoiceMemoNumber">Invoice / Memo Number</label><input type="text" id="cust-memo" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. INV-5501" data-i18n-placeholder="placeholder.memoExample"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.customerName">Customer Name</label><input type="text" id="cust-name" required class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.mobileContact">Mobile Contact</label><input type="text" id="cust-mobile" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.emailAddress">Email Address</label><input type="email" id="cust-email" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div><label class="block font-bold text-gray-600 mb-0.5" data-i18n="field.physicalAddress">Physical Address</label><input type="text" id="cust-address" class="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"></div>
            <div class="border-t border-gray-100 pt-2 mt-2"><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.totalGrossSell">Total Gross Sell Amount</label><input type="number" step="0.01" id="cust-sell" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono font-bold"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.cashPaidAmt">Cash Paid Amt</label><input type="number" step="0.01" id="cust-cash" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.cardPaidAmt">Card Paid Amt</label><input type="number" step="0.01" id="cust-card" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.totalReceived">Total Received</label><input type="number" id="cust-received" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-semibold text-gray-700 outline-none text-sm font-mono"></div>
              <div><label class="block font-bold text-gray-500 mb-0.5" data-i18n="field.discountIssued">Discount Issued</label><input type="number" step="0.01" id="cust-discount" value="0" readonly tabindex="-1" class="w-full border rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"></div>
            </div>
            <div><label class="block font-bold text-red-600 mb-0.5" data-i18n="field.outstandingBalanceDue">Outstanding Balance Due</label><input type="number" id="cust-due" value="0" readonly class="w-full border rounded p-1.5 bg-gray-50 font-bold text-red-600 outline-none text-sm font-mono"></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded text-sm transition tracking-wider" data-i18n="form.cust.commitSale">COMMIT CUSTOMER SALE</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-md font-bold text-gray-700 mb-3 uppercase tracking-wider" data-i18n="form.cust.masterLedger">Customer Master Invoice Ledger</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5" data-i18n="col.systemUniqueId">System Unique ID</th><th class="p-2.5" data-i18n="field.customerName">Customer Name</th><th class="p-2.5" data-i18n="col.memo">Memo #</th><th class="p-2.5" data-i18n="col.totalSell">Total Sell</th><th class="p-2.5" data-i18n="col.cashAmt">Cash Amt</th><th class="p-2.5" data-i18n="col.cardAmt">Card Amt</th><th class="p-2.5" data-i18n="col.received">Received</th><th class="p-2.5" data-i18n="col.discount">Discount</th><th class="p-2.5" data-i18n="col.dueBalance">Due Balance</th><th class="p-2.5" data-i18n="col.actions">Actions</th>
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
        <div class="flex justify-between items-center border-b pb-3 mb-4"><h3 class="text-lg font-bold text-gray-800" data-i18n="form.cust.modifyTitle">Modify Customer Sales Record</h3><button id="close-cust-modal" class="text-2xl font-bold text-gray-400 hover:text-gray-700 focus:outline-none">&times;</button></div>
        <form id="form-cust-edit" class="grid grid-cols-2 gap-4 text-xs">
          <input type="hidden" id="edit-cust-id">
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1" data-i18n="field.systemUniqueTrackingId">System Unique Tracking ID</label><input type="text" id="edit-cust-uid" readonly class="w-full border rounded p-2 text-sm bg-gray-50 font-mono text-gray-500"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.customerName">Customer Name</label><input type="text" id="edit-cust-name" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.invoiceMemo">Invoice / Memo #</label><input type="text" id="edit-cust-memo" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.mobileContact">Mobile Contact</label><input type="text" id="edit-cust-mobile" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.emailAddress">Email Address</label><input type="email" id="edit-cust-email" required class="w-full border rounded p-2 text-sm outline-none"></div>
          <div class="col-span-2"><label class="block font-bold text-gray-600 mb-1" data-i18n="field.physicalAddress">Physical Address</label><input type="text" id="edit-cust-address" required class="w-full border rounded p-2 text-sm outline-none"></div>
          
          <div class="col-span-2 border-t pt-2 mt-1"><label class="block font-bold text-gray-600 mb-1" data-i18n="field.grossSellAmount">Gross Sell Amount</label><input type="number" step="0.01" id="edit-cust-sell" required class="w-full border rounded p-2 text-sm font-bold font-mono"></div>
          <div><label class="block font-bold text-emerald-700 mb-1" data-i18n="field.cashPaidAmt">Cash Paid Amt</label><input type="number" step="0.01" id="edit-cust-cash" required class="w-full border rounded p-2 text-sm font-mono"></div>
          <div><label class="block font-bold text-blue-700 mb-1" data-i18n="field.cardPaidAmt">Card Paid Amt</label><input type="number" step="0.01" id="edit-cust-card" required class="w-full border rounded p-2 text-sm font-mono"></div>
          <div><label class="block font-bold text-gray-500 mb-1" data-i18n="field.totalReceivedCalc">Total Received (Calculated)</label><input type="number" id="edit-cust-received" readonly class="w-full border rounded p-2 text-sm bg-gray-50 font-mono"></div>
          <div><label class="block font-bold text-purple-700 mb-1" data-i18n="field.discountAllowed">Discount Allowed</label><input type="number" step="0.01" id="edit-cust-discount" required class="w-full border rounded p-2 text-sm font-mono"></div>
          <div class="col-span-2"><label class="block font-bold text-red-600 mb-1" data-i18n="field.outstandingBalanceDue">Outstanding Balance Due</label><input type="number" id="edit-cust-due" readonly class="w-full border rounded p-2 text-sm bg-gray-50 text-red-600 font-bold font-mono"></div>
          
          <div class="col-span-2 pt-2 border-t flex justify-end space-x-2"><button type="button" id="btn-cancel-cust" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm" data-i18n="common.cancel">Cancel</button><button type="submit" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm shadow-md" data-i18n="form.cust.overwriteRecalc">OVERWRITE RE-CALCULATE</button></div>
        </form>
      </div>
    </div>
  `,
  customer_transactions: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.customerTransactions.title">Customer Transaction Logging</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.cust.logPayment">Log Customer Payment</h3>
          <form id="form-cust-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.transactionDate">Transaction Date</label><input type="date" id="cust-txn-date" required class="w-full border rounded p-2 text-sm outline-none"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.systemUniqueId">System Unique ID</label><select id="cust-txn-uid" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="" data-i18n="dropdown.queryingCustomerAccounts">-- Querying Accounts --</option></select></div>
            <div id="cust-txn-due-info" class="hidden bg-red-50 border border-red-100 rounded-lg p-3 space-y-1.5">
              <div class="flex justify-between items-center gap-2">
                <span class="font-bold text-red-800 text-[11px] uppercase" data-i18n="field.currentCustomerDue">Current Customer Due / Balance</span>
                <span id="cust-txn-current-due" class="font-mono font-black text-red-700 text-sm">0.00</span>
              </div>
              <div class="flex justify-between items-center gap-2 border-t border-red-100 pt-1.5">
                <span class="font-bold text-gray-600 text-[11px] uppercase" data-i18n="field.remainingDueAfterTxn">Remaining Due After This Transaction</span>
                <span id="cust-txn-remaining-due" class="font-mono font-bold text-orange-700 text-sm">0.00</span>
              </div>
            </div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.soldAmountOptional">Sold Amount (optional)</label><input type="number" step="0.01" id="cust-txn-sell" value="0" min="0" class="w-full border rounded p-2 text-sm outline-none" placeholder="0.00" data-i18n-placeholder="placeholder.zeroPaymentOnly"></div>
            <p class="text-[10px] text-gray-400 -mt-2" data-i18n="field.soldAmountOptionalHint">Leave 0 when customer is only paying a previous due balance.</p>
            <div><label class="block font-bold text-purple-700 mb-1" data-i18n="field.discountAllowed">Discount Allowed</label><input type="number" step="0.01" id="cust-txn-discount" value="0" class="w-full border rounded p-2 text-sm outline-none font-mono" placeholder="0.00" data-i18n-placeholder="placeholder.zero"></div>
            <div><label class="block font-bold text-emerald-700 mb-1" data-i18n="field.receivedAmount">Received Amount</label><input type="number" step="0.01" id="cust-txn-received" value="0" required class="w-full border rounded p-2 text-sm outline-none focus:ring-emerald-500" placeholder="0.00" data-i18n-placeholder="placeholder.zero"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.paymentMethod">Payment Method</label><select id="cust-txn-method" required class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Cash" data-i18n="option.cash">Cash</option><option value="Card" data-i18n="option.card">Card</option></select></div>
            <div><label class="block font-bold text-gray-500 mb-1" data-i18n="field.transactionDueBalance">Transaction Due / Balance</label><input type="number" id="cust-txn-due" readonly class="w-full border rounded p-2 text-sm bg-gray-50 font-bold text-red-600 outline-none"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.remarksReferenceInfo">Remarks / Reference Info</label><textarea id="cust-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none" placeholder="Invoice details, receipt #..." data-i18n-placeholder="placeholder.invoiceDetails"></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider" data-i18n="form.postTransaction">POST TRANSACTION</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.cust.historicalLedger">Customer Historical Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.fromDate">From Date</label><input type="date" id="filter-from-cust" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.toDate">To Date</label><input type="date" id="filter-to-cust" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div><button id="btn-filter-cust" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm" data-i18n="common.expandLoadLedger">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5" data-i18n="col.date">Date</th><th class="p-2.5" data-i18n="col.sysUid">Sys UID</th><th class="p-2.5" data-i18n="col.soldAmt">Sold Amt</th><th class="p-2.5" data-i18n="col.discount">Discount</th><th class="p-2.5" data-i18n="col.receivedAmt">Received Amt</th><th class="p-2.5" data-i18n="col.method">Method</th><th class="p-2.5" data-i18n="col.txnDue">Txn Due</th><th class="p-2.5" data-i18n="col.remarks">Remarks</th><th class="p-2.5" data-i18n="col.loggedBy">Logged By</th><th class="p-2.5" data-i18n="col.stamp">Stamp</th><th class="p-2.5" data-i18n="col.actions">Actions</th></tr>
              </thead>
              <tbody id="table-cust-txn-rows" class="divide-y text-gray-600 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  delivery_dashboard: `
    <div id="delivery-dashboard-root" class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.deliveryDashboard.title">Delivery Dashboard</h2>
        <button type="button" id="btn-refresh-delivery" class="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.refresh">Refresh</button>
      </div>
      <p class="text-xs text-gray-500" data-i18n="delivery.hint">Customer unique IDs queue as Pending (newest first). Users with edit access can mark items Delivered with delivery remarks.</p>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="bg-white p-4 md:p-5 rounded-xl shadow border border-amber-200 flex flex-col min-h-[420px]">
          <h3 class="text-md font-bold text-amber-800 mb-3 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span data-i18n="delivery.pendingList">Pending List</span>
            <span class="text-[10px] font-normal normal-case text-gray-400" data-i18n="delivery.lifoHint">(LIFO — newest first)</span>
          </h3>
          <div class="overflow-x-auto border rounded-lg flex-1 min-h-0 max-h-[calc(100vh-16rem)] overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-amber-50 font-bold text-amber-900 uppercase border-b whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th class="p-2.5" data-i18n="col.systemUniqueId">System Unique ID</th>
                  <th class="p-2.5" data-i18n="col.remarks">Remarks</th>
                  <th class="p-2.5" data-i18n="delivery.issuedDate">Issued Date</th>
                  <th class="p-2.5" data-i18n="field.username">Username</th>
                  <th class="p-2.5" data-i18n="col.status">Status</th>
                </tr>
              </thead>
              <tbody id="table-delivery-pending" class="divide-y text-gray-600 font-medium">
                <tr><td colspan="5" class="p-6 text-center text-gray-400 animate-pulse" data-i18n="delivery.loading">Loading delivery queue...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="bg-white p-4 md:p-5 rounded-xl shadow border border-emerald-200 flex flex-col min-h-[420px]">
          <h3 class="text-md font-bold text-emerald-800 mb-3 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span data-i18n="delivery.deliveredList">Delivered List</span>
          </h3>
          <div class="overflow-x-auto border rounded-lg flex-1 min-h-0 max-h-[calc(100vh-16rem)] overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-emerald-50 font-bold text-emerald-900 uppercase border-b whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th class="p-2.5" data-i18n="col.systemUniqueId">System Unique ID</th>
                  <th class="p-2.5" data-i18n="col.remarks">Remarks</th>
                  <th class="p-2.5" data-i18n="field.username">Username</th>
                  <th class="p-2.5" data-i18n="delivery.deliveryDate">Delivery Date</th>
                  <th class="p-2.5" data-i18n="delivery.deliveredRemarks">Delivered Remarks</th>
                </tr>
              </thead>
              <tbody id="table-delivery-delivered" class="divide-y text-gray-600 font-medium">
                <tr><td colspan="5" class="p-6 text-center text-gray-400 animate-pulse" data-i18n="delivery.loading">Loading delivery queue...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  internal_transfer: `
      <div class="space-y-4 md:space-y-6 erp-module-page pb-6">
      <div class="border-b pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.internalTransfer.title">Internal Cash Handover Transfer</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.int.logTransfer">Log Transfer to Owner</h3>
          <form id="form-internal-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.transferDate">Transfer Date</label><input type="date" id="int-date" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"></div>
            <div><label class="block font-bold text-emerald-700 mb-1" data-i18n="field.transferCashAmount">Transfer Cash Amount</label><input type="number" step="0.01" id="int-amount" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold" placeholder="0.00" data-i18n-placeholder="placeholder.zero"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.descriptionNarrative">Description / Narrative Note</label><textarea id="int-desc" rows="3" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Cash handed over to owner for bank deposit..." data-i18n-placeholder="placeholder.handoverExample"></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider uppercase" data-i18n="form.int.executeHandover">Execute Cash Handover</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.int.historicalTransfer">Historical Cash Transfer Ledger</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.fromDate">From Date</label><input type="date" id="filter-from-int" class="w-full border rounded p-2 outline-none focus:border-emerald-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.toDate">To Date</label><input type="date" id="filter-to-int" class="w-full border rounded p-2 outline-none focus:border-emerald-500"></div>
            <div><button id="btn-filter-int" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm" data-i18n="common.expandLoadLedger">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5" data-i18n="col.date">Date</th><th class="p-2.5" data-i18n="col.systemUniqueId">System Unique ID</th><th class="p-2.5" data-i18n="col.transferAmount">Transfer Amount</th><th class="p-2.5" data-i18n="col.descriptionPurpose">Description / Purpose</th><th class="p-2.5" data-i18n="col.transferredBy">Transferred By</th><th class="p-2.5" data-i18n="col.systemStamp">System Stamp</th><th class="p-2.5" data-i18n="col.actions">Actions</th></tr>
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
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.expenseHeads.title">Expense Category Setup</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.exp.createMatrix">Create Expense Matrix</h3>
          <form id="form-exp-head-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.expenseParentHead">Expense Parent Head</label><input type="text" id="exp-head-main" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Utilities, Logistics" data-i18n-placeholder="placeholder.utilities"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.subHeadAssignment">Sub Head Assignment</label><input type="text" id="exp-head-sub" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Electricity, Diesel Fuel" data-i18n-placeholder="placeholder.subHeadExample"></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition uppercase tracking-wider" data-i18n="form.exp.registerCategory">Register Category</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.exp.configuredStructures">Configured Expense Structures</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5" data-i18n="col.systemUniqueId">System Unique ID</th><th class="p-2.5" data-i18n="col.expenseParentHead">Expense Parent Head</th><th class="p-2.5" data-i18n="col.subHeadName">Sub Head Name</th><th class="p-2.5 font-bold text-gray-700" data-i18n="col.totalIncurred">Total Incurred</th><th class="p-2.5 font-bold text-emerald-600" data-i18n="col.totalPaid">Total Paid</th><th class="p-2.5 font-bold text-red-600" data-i18n="col.dueBalance">Due/Balance</th><th class="p-2.5" data-i18n="col.authorizedBy">Authorized By</th><th class="p-2.5" data-i18n="col.creationStamp">Creation Stamp</th>
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
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.expenseTransactions.title">Operational Expense Ledger</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.exp.logEntry">Log Transaction Entry</h3>
          <form id="form-exp-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.transactionDate">Transaction Date</label><input type="date" id="exp-txn-date" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.expenseParentHead">Expense Parent Head</label><select id="exp-txn-main" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"><option value="" data-i18n="dropdown.loadParentHead">-- Load Parent Head --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.subHeadMapping">Sub Head Mapping</label><select id="exp-txn-sub" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"><option value="" data-i18n="dropdown.chooseParentFirst">-- Choose Parent First --</option></select></div>
            <div class="p-3 bg-gray-50 border rounded-lg space-y-3">
              <div><label class="block font-bold text-gray-700 mb-1" data-i18n="field.totalDepositIncurred">Total Deposit (Incurred Amt)</label><input type="number" step="0.01" id="exp-txn-deposit" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-blue-500"></div>
              <div><label class="block font-bold text-emerald-700 mb-1" data-i18n="field.actuallyPaidAmount">Actually Paid Amount</label><input type="number" step="0.01" id="exp-txn-paid" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-emerald-500"></div>
              <div class="pt-2 border-t border-gray-200"><label class="block font-bold text-red-600 mb-1" data-i18n="field.transactionDueBalance">Transaction Due / Balance</label><input type="number" id="exp-txn-due" readonly class="w-full border rounded p-2 text-sm bg-white font-bold text-red-600 outline-none shadow-inner"></div>
            </div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.remarksNarrative">Remarks / Narrative</label><textarea id="exp-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-red-500" placeholder="Invoice details, voucher references..." data-i18n-placeholder="placeholder.voucherRef"></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-red-600 hover:bg-red-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider uppercase" data-i18n="form.exp.postLine">Post Expense Line</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          
          <div class="bg-gradient-to-r from-red-500 to-orange-600 p-6 rounded-2xl shadow-xl border text-white flex justify-between items-center mb-6">
            <div class="flex gap-8">
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80" data-i18n="form.exp.filteredPaidTotal">Filtered Paid Total</h4><div class="text-3xl font-black font-mono tracking-tight mt-1">SAR <span id="expense-total-paid">0.00</span></div></div>
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80" data-i18n="form.exp.filteredDueBalance">Filtered Due Balance</h4><div class="text-3xl font-black font-mono tracking-tight mt-1 text-red-100">SAR <span id="expense-total-due">0.00</span></div></div>
            </div>
            <div class="bg-white/20 p-3 rounded-xl backdrop-blur-md hidden sm:block">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10m9-10V4a2 2 0 00-2-2H5a2 2 0 00-2 2v5m15 0h2a2 2 0 002-2V4a2 2 0 00-2-2h-2a2 2 0 00-2 2v5m-4 0h4a2 2 0 002-2V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v5m0 0v14a2 2 0 002 2h2a2 2 0 002-2V9"></path></svg>
            </div>
          </div>

          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.historicalLedger">Historical Book Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.fromDate">From Date</label><input type="date" id="filter-from-exp" class="w-full border rounded p-2 outline-none focus:border-red-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.toDate">To Date</label><input type="date" id="filter-to-exp" class="w-full border rounded p-2 outline-none focus:border-red-500"></div>
            <div><button id="btn-filter-exp" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm" data-i18n="common.expandLoadLedger">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5" data-i18n="col.date">Date</th><th class="p-2.5" data-i18n="col.parentCategory">Parent Category</th><th class="p-2.5" data-i18n="col.subHead">Sub Head</th><th class="p-2.5" data-i18n="col.deposit">Deposit</th><th class="p-2.5" data-i18n="col.paidAmt">Paid Amt</th><th class="p-2.5" data-i18n="col.txnDue">Txn Due</th><th class="p-2.5" data-i18n="col.remarksVouchers">Remarks / Vouchers</th><th class="p-2.5" data-i18n="col.loggedBy">Logged By</th><th class="p-2.5" data-i18n="col.stamp">Stamp</th><th class="p-2.5" data-i18n="col.actions">Actions</th></tr>
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
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.creditors.title">Creditor Setup (Liabilities)</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.cred.createHead">Create Creditor Head</h3>
          <form id="form-cred-head-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.creditorParentHead">Creditor Parent Head</label><input type="text" id="cred-head-main" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g., Bank Loans, Investor X" data-i18n-placeholder="placeholder.bankLoans"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.subHeadName">Sub Head Name</label><input type="text" id="cred-head-sub" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g., Term Loan #1" data-i18n-placeholder="placeholder.termLoan"></div>
            <button type="submit" class="erp-submit-btn w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded text-sm transition uppercase tracking-wider" data-i18n="form.cred.register">Register Creditor</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.cred.configuredStructures">Configured Creditor Structures</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5" data-i18n="col.trackingId">Tracking ID</th><th class="p-2.5" data-i18n="col.creditorParentHead">Creditor Parent Head</th><th class="p-2.5" data-i18n="col.subHead">Sub Head</th><th class="p-2.5 font-bold text-gray-700" data-i18n="col.received">Total Received</th><th class="p-2.5 font-bold text-emerald-600" data-i18n="col.totalReturned">Total Returned</th><th class="p-2.5 font-bold text-red-600" data-i18n="col.dueBalance">Due/Balance</th><th class="p-2.5" data-i18n="col.createdBy">Created By</th><th class="p-2.5" data-i18n="col.creationStamp">Creation Stamp</th>
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
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.creditorTransactions.title">Creditor Ledger (Loans & Returns)</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.cred.logAction">Log Creditor Action</h3>
          <form id="form-cred-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.transactionDate">Transaction Date</label><input type="date" id="cred-txn-date" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.creditorParentHead">Creditor Parent Head</label><select id="cred-txn-main" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-orange-500"><option value="" data-i18n="dropdown.loadParentHead">-- Load Parent Head --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.subHeadMapping">Sub Head Mapping</label><select id="cred-txn-sub" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-orange-500"><option value="" data-i18n="dropdown.chooseParentFirst">-- Choose Parent First --</option></select></div>
            
            <div class="p-3 bg-gray-50 border rounded-lg space-y-3">
              <div><label class="block font-bold text-gray-700 mb-1" data-i18n="field.receivedAmountCashIn">Received Amount (Cash In)</label><input type="number" step="0.01" id="cred-txn-received" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-gray-500"></div>
              <div><label class="block font-bold text-emerald-700 mb-1" data-i18n="field.returnAmountCashOut">Return Amount (Cash Out)</label><input type="number" step="0.01" id="cred-txn-return" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-emerald-500"></div>
              <div class="pt-2 border-t border-gray-200"><label class="block font-bold text-red-600 mb-1" data-i18n="field.transactionDueBalance">Transaction Due / Balance</label><input type="number" id="cred-txn-due" readonly class="w-full border rounded p-2 text-sm bg-white font-bold text-red-600 outline-none shadow-inner"></div>
            </div>

            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.remarksNarrative">Remarks / Narrative</label><textarea id="cred-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-orange-500" placeholder="Bank receipt, check numbers..." data-i18n-placeholder="placeholder.bankReceipt"></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider uppercase" data-i18n="form.cred.postLine">Post Creditor Line</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          
          <div class="bg-gradient-to-r from-orange-500 to-amber-600 p-6 rounded-2xl shadow-xl border text-white flex justify-between items-center mb-6">
            <div class="flex gap-8">
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80" data-i18n="form.cred.filteredReceived">Filtered Received Total</h4><div class="text-3xl font-black font-mono tracking-tight mt-1">SAR <span id="cred-total-received">0.00</span></div></div>
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80" data-i18n="form.cred.filteredReturned">Filtered Returned Total</h4><div class="text-3xl font-black font-mono tracking-tight mt-1 text-emerald-100">SAR <span id="cred-total-returned">0.00</span></div></div>
            </div>
          </div>

          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.historicalLedgerShort">Historical Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.fromDate">From Date</label><input type="date" id="filter-from-cred" class="w-full border rounded p-2 outline-none focus:border-orange-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.toDate">To Date</label><input type="date" id="filter-to-cred" class="w-full border rounded p-2 outline-none focus:border-orange-500"></div>
            <div><button id="btn-filter-cred" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm" data-i18n="common.expandLoadLedger">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5" data-i18n="col.date">Date</th><th class="p-2.5" data-i18n="col.parentCategory">Parent Category</th><th class="p-2.5" data-i18n="col.subHead">Sub Head</th><th class="p-2.5" data-i18n="col.receivedAmt">Received Amt</th><th class="p-2.5" data-i18n="col.returnAmt">Return Amt</th><th class="p-2.5" data-i18n="col.txnDue">Txn Due</th><th class="p-2.5" data-i18n="col.remarks">Remarks</th><th class="p-2.5" data-i18n="col.loggedBy">Logged By</th><th class="p-2.5" data-i18n="col.stamp">Stamp</th><th class="p-2.5" data-i18n="col.actions">Actions</th></tr>
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
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.incomeHeads.title">Income Category Setup (Revenues)</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.inc.createMatrix">Create Income Matrix</h3>
          <form id="form-inc-head-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.incomeParentHead">Income Parent Head</label><input type="text" id="inc-head-main" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Services, Rent" data-i18n-placeholder="placeholder.services"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.subHeadAssignment">Sub Head Assignment</label><input type="text" id="inc-head-sub" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Consulting, Warehouse A" data-i18n-placeholder="placeholder.consulting"></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition uppercase tracking-wider" data-i18n="form.inc.registerCategory">Register Income Category</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.inc.configuredStructures">Configured Income Structures</h3>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr>
                  <th class="p-2.5" data-i18n="col.systemUniqueId">System Unique ID</th><th class="p-2.5" data-i18n="field.incomeParentHead">Income Parent Head</th><th class="p-2.5" data-i18n="col.subHeadName">Sub Head Name</th><th class="p-2.5 font-bold text-gray-700" data-i18n="col.totalReceivable">Total Receivable</th><th class="p-2.5 font-bold text-emerald-600" data-i18n="col.received">Total Received</th><th class="p-2.5 font-bold text-red-600" data-i18n="col.dueBalance">Due/Balance</th><th class="p-2.5" data-i18n="col.authorizedBy">Authorized By</th><th class="p-2.5" data-i18n="col.creationStamp">Creation Stamp</th>
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
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.incomeTransactions.title">Income Ledger Logging</h2>
        <button id="toggle-ledger-btn" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded text-sm transition shadow-sm" data-i18n="common.ledgerView">Ledger View</button>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div id="form-container" class="bg-white p-5 rounded-xl shadow border border-gray-200 xl:col-span-4 max-w-2xl mx-auto w-full max-h-none md:max-h-[85vh] overflow-y-auto pb-24 md:pb-5 transition-all duration-300">
          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.inc.logEntry">Log Income Entry</h3>
          <form id="form-inc-txn-entry" class="space-y-4 text-xs">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.transactionDate">Transaction Date</label><input type="date" id="inc-txn-date" required class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.incomeParentHead">Income Parent Head</label><select id="inc-txn-main" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"><option value="" data-i18n="dropdown.loadParentHead">-- Load Parent Head --</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.subHeadMapping">Sub Head Mapping</label><select id="inc-txn-sub" required class="w-full border rounded p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"><option value="" data-i18n="dropdown.chooseParentFirst">-- Choose Parent First --</option></select></div>
            
            <div class="p-3 bg-gray-50 border rounded-lg space-y-3">
              <div><label class="block font-bold text-gray-700 mb-1" data-i18n="field.receivableAmountBilled">Receivable Amount (Billed)</label><input type="number" step="0.01" id="inc-txn-receivable" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-gray-500"></div>
              <div><label class="block font-bold text-emerald-700 mb-1" data-i18n="field.actuallyReceivedCashIn">Actually Received (Cash In)</label><input type="number" step="0.01" id="inc-txn-received" value="0.00" required class="w-full border rounded p-2 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-emerald-500"></div>
              <div class="pt-2 border-t border-gray-200"><label class="block font-bold text-red-600 mb-1" data-i18n="field.transactionDueBalance">Transaction Due / Balance</label><input type="number" id="inc-txn-due" readonly class="w-full border rounded p-2 text-sm bg-white font-bold text-red-600 outline-none shadow-inner"></div>
            </div>

            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.remarksNarrative">Remarks / Narrative</label><textarea id="inc-txn-remarks" rows="2" class="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Client names, details..." data-i18n-placeholder="placeholder.clientDetails"></textarea></div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition tracking-wider uppercase" data-i18n="form.inc.postLine">Post Income Line</button>
          </form>
        </div>
        <div id="ledger-container" class="erp-ledger-panel bg-white p-4 md:p-5 rounded-xl shadow border border-gray-200 xl:col-span-3 flex flex-col overflow-visible md:overflow-hidden hidden transition-all duration-300 w-full">
          
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-xl border text-white flex justify-between items-center mb-6">
            <div class="flex gap-8">
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80" data-i18n="form.inc.filteredReceived">Filtered Received Total</h4><div class="text-3xl font-black font-mono tracking-tight mt-1">SAR <span id="inc-total-received">0.00</span></div></div>
              <div><h4 class="text-xs font-bold uppercase tracking-widest opacity-80" data-i18n="form.inc.filteredDue">Filtered Due Balance</h4><div class="text-3xl font-black font-mono tracking-tight mt-1 text-red-200">SAR <span id="inc-total-due">0.00</span></div></div>
            </div>
          </div>

          <h3 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider" data-i18n="form.historicalLedger">Historical Book Ledger Log</h3>
          <div class="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.fromDate">From Date</label><input type="date" id="filter-from-inc" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div class="flex-1 min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.toDate">To Date</label><input type="date" id="filter-to-inc" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
            <div><button id="btn-filter-inc" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm" data-i18n="common.expandLoadLedger">Expand / Load Ledger</button></div>
          </div>
          <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-gray-100 font-bold text-gray-600 uppercase border-b whitespace-nowrap">
                <tr><th class="p-2.5" data-i18n="col.date">Date</th><th class="p-2.5" data-i18n="col.parentCategory">Parent Category</th><th class="p-2.5" data-i18n="col.subHead">Sub Head</th><th class="p-2.5" data-i18n="col.totalReceivable">Receivable</th><th class="p-2.5" data-i18n="col.receivedAmt">Received Amt</th><th class="p-2.5" data-i18n="col.txnDue">Txn Due</th><th class="p-2.5" data-i18n="col.remarks">Remarks</th><th class="p-2.5" data-i18n="col.loggedBy">Logged By</th><th class="p-2.5" data-i18n="col.stamp">Stamp</th><th class="p-2.5" data-i18n="col.actions">Actions</th></tr>
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
        <h2 class="text-2xl font-bold text-gray-800" data-i18n="page.allTransactions.title">All Transaction View (Master Audit)</h2>
      </div>
      <div class="bg-white p-3 md:p-5 rounded-xl shadow border border-gray-200 flex flex-col overflow-visible md:overflow-hidden md:h-[85vh]">
        
        <div class="bg-gray-50 border border-gray-200 p-3 md:p-4 rounded-lg mb-4 flex flex-col md:flex-row md:flex-wrap md:items-end gap-3 md:gap-4 text-xs shadow-inner erp-mobile-filter-bar">
          <div class="flex-1 min-w-[140px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.fromDate">From Date</label><input type="date" id="filter-from-all" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
          <div class="flex-1 min-w-[140px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.toDate">To Date</label><input type="date" id="filter-to-all" class="w-full border rounded p-2 outline-none focus:border-blue-500"></div>
          <div class="flex-1 min-w-[160px]">
            <label class="block text-gray-600 font-bold mb-1" data-i18n="allTxn.transactionCategory">Transaction Category</label>
            <select id="filter-module-all" class="w-full border rounded p-2 outline-none bg-white focus:border-blue-500 font-medium">
              <option value="" data-i18n="allTxn.categoryAll">All Categories (Default)</option>
              <option value="HR" data-i18n="allTxn.catHR">HR Transactions</option>
              <option value="Supplier" data-i18n="allTxn.catSupplier">Supplier Transactions</option>
              <option value="Customer" data-i18n="allTxn.catCustomer">Customer Transactions</option>
              <option value="Expense" data-i18n="allTxn.catExpense">Expense Transactions</option>
              <option value="Creditor" data-i18n="allTxn.catCreditor">Creditor Transactions</option>
              <option value="Income" data-i18n="allTxn.catIncome">Income Transactions</option>
              <option value="Internal" data-i18n="allTxn.catInternal">Internal Transfers</option>
            </select>
          </div>
          <div><button id="btn-filter-all" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded transition shadow-sm" data-i18n="allTxn.searchFilter">Search / Filter Records</button></div>
        </div>

        <div class="erp-ledger-wrap overflow-x-auto border rounded-lg md:flex-1 md:min-h-0 md:overflow-y-auto relative">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-800 text-white uppercase whitespace-nowrap sticky top-0 z-10 shadow">
              <tr>
                <th class="p-3" data-i18n="allTxn.colDate">Date</th>
                <th class="p-3" data-i18n="allTxn.colCategory">Category</th>
                <th class="p-3" data-i18n="allTxn.colDetails">Transaction Details</th>
                <th class="p-3" data-i18n="allTxn.colFinancial">Financial Impact</th>
                <th class="p-3" data-i18n="allTxn.colRemarks">Remarks / Narrative</th>
                <th class="p-3" data-i18n="allTxn.colLoggedBy">Logged By</th>
                <th class="p-3" data-i18n="allTxn.colStamp">Stamp</th>
                <th class="p-3" data-i18n="col.actions">Actions</th>
              </tr>
            </thead>
            <tbody id="table-all-txn-rows" class="divide-y text-gray-600 font-medium">
              <tr><td colspan="8" class="p-6 text-center text-gray-400" data-i18n="allTxn.loadingToday">Loading today's transactions...</td></tr>
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
          <h2 class="text-lg md:text-2xl font-bold text-gray-800" data-i18n="page.reports.title">Enterprise Reporting System</h2>
          <button onclick="window.print()" class="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded text-sm transition shadow-sm flex items-center justify-center gap-2" data-i18n="common.printExport">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print / Export
          </button>
        </div>

        <div id="report-filters-panel" class="bg-gray-50 border border-gray-200 p-3 md:p-4 rounded-lg mt-3 md:mt-4 mb-2 md:mb-0 flex flex-col md:flex-row md:flex-wrap md:items-end gap-3 md:gap-4 text-xs shadow-inner erp-report-filters">
          <div class="w-full md:flex-1 md:min-w-[200px]">
            <label class="block text-gray-600 font-bold mb-1" data-i18n="common.selectMasterReport">Select Master Report</label>
            <select id="report-type" class="w-full border rounded p-2.5 outline-none bg-white focus:border-blue-500 font-medium text-sm">
              <option value="" data-i18n="common.chooseReport">-- Choose Report Type --</option>
              <option value="daily_monthly" data-i18n-report="report.dailyMonthly">Daily / Monthly Aggregate Report</option>
              <option value="daily_cashflow" data-i18n-report="report.dailyCashflow">Daily Accounts Cash Flow (IN & OUT)</option>
              <option value="pnl" data-i18n-report="report.pnl">Profit & Loss Report</option>
              <option value="receivable_payable" data-i18n-report="report.receivablePayable">Receivable and Payable Report</option>
              <option value="expense_report" data-i18n-report="report.expenseReport">Expense Report</option>
              <option value="customer_details" class="font-bold text-blue-600" data-i18n-report="report.customerDetails">Customer Details Report (Statement)</option>
              <option value="customer_due_balance" class="font-bold text-red-600" data-i18n-report="report.customerDueBalance">Customer Due/Balance Report</option>
              <option value="supplier_details" data-i18n-report="report.supplierDetails">Supplier Details Report</option>
              <option value="hr_details" data-i18n-report="report.hrDetails">HR Details Report</option>
              <option value="user_transaction" data-i18n-report="report.userPerformance">User Sells Performance Report</option>
              <option value="individual_user" data-i18n-report="report.individualUser">Individual User Report</option>
            </select>
          </div>
          
          <div class="w-full md:flex-1 md:min-w-[150px] hidden" id="report-secondary-filter-container">
            <label class="block text-gray-600 font-bold mb-1" id="report-secondary-label" data-i18n="report.specificTarget">Specific Target</label>
            <select id="report-secondary-filter" class="w-full border rounded p-2.5 outline-none bg-white focus:border-blue-500 text-sm">
            </select>
          </div>

          <div class="w-full md:flex-1 md:min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.fromDate">From Date</label><input type="date" id="report-from" class="w-full border rounded p-2.5 outline-none focus:border-blue-500 text-sm"></div>
          <div class="w-full md:flex-1 md:min-w-[120px]"><label class="block text-gray-600 font-bold mb-1" data-i18n="common.toDate">To Date</label><input type="date" id="report-to" class="w-full border rounded p-2.5 outline-none focus:border-blue-500 text-sm"></div>
          <div id="report-date-filter-wrap" class="w-full md:flex-1 md:min-w-[170px] hidden">
            <label class="block text-gray-600 font-bold mb-1" data-i18n="report.dateFilter">Date Filter</label>
            <label class="flex items-center gap-2 border rounded p-2.5 bg-white cursor-pointer min-h-[44px]">
              <input type="checkbox" id="report-use-date-filter" class="rounded">
              <span class="text-gray-600 font-bold text-[11px] leading-tight" data-i18n="report.applyDateRangeFilter">Apply date range filter</span>
            </label>
          </div>
          <div class="w-full md:w-auto"><button id="btn-generate-report" class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded transition shadow-sm min-h-[44px]" data-i18n="common.executeQuery">Execute Query</button></div>
        </div>
      </div>

      <div id="report-results-anchor" aria-hidden="true"></div>
      
      <div class="bg-white p-3 md:p-5 rounded-xl shadow border border-gray-200 flex flex-col overflow-visible print:shadow-none print:border-none print:p-0 erp-report-results">
        <div id="report-print-header" class="hidden mb-4 md:mb-6 text-center border-b pb-4 print:block">
          <h1 class="text-lg md:text-2xl font-black text-gray-800 uppercase tracking-wide md:tracking-widest px-2" id="report-title-display" data-i18n="report.reportName">Report Name</h1>
          <p class="text-xs md:text-sm font-medium text-gray-500 mt-1 px-2" id="report-date-display" data-i18n="report.dateRangeLabel">Date Range: </p>
          <p class="text-[10px] md:text-xs text-gray-400 mt-1 px-2 break-words" id="report-target-display"></p>
        </div>

        <div id="report-summary-cards" class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6 hidden">
        </div>

        <div id="report-table-container" class="erp-report-panel border rounded-lg relative print:border-none bg-white">
           <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
              <table class="erp-report-table w-full text-left border-collapse text-xs">
                <thead id="report-table-head" class="bg-slate-800 text-white sticky top-0 z-10 shadow print:bg-gray-100 print:text-gray-800 print:shadow-none border-b">
                  <tr><th class="p-3 text-center text-gray-300 font-normal normal-case" data-i18n="report.selectParamsExecute">Select parameters and execute query to build report.</th></tr>
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
      <div class="border-b pb-4"><h2 class="text-2xl font-bold text-gray-800" data-i18n="page.users.title">User Access Management</h2></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="bg-white p-6 rounded-xl shadow border lg:col-span-1 border-gray-200 erp-mobile-user-form">
          <h3 class="text-lg font-semibold text-gray-700 mb-4" data-i18n="form.users.provision">Provision Account</h3>
          <form id="form-create-user" class="space-y-4">
            <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1" data-i18n="field.username">Username</label><input type="text" id="new-username" required class="w-full border rounded p-2 outline-none"></div>
            <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1" data-i18n="field.password">Password</label>
              <div class="relative">
                <input type="password" id="new-password" required minlength="6" class="w-full border rounded p-2 pr-12 outline-none">
                <button type="button" id="toggle-new-password" class="absolute right-3 top-2.5 text-[10px] font-bold uppercase text-gray-400 hover:text-blue-600 transition tracking-wider focus:outline-none" data-i18n="common.show">Show</button>
              </div>
            </div>
            <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1" data-i18n="field.mobileContact">Mobile Contact</label><input type="text" id="new-mobile" class="w-full border rounded p-2 outline-none" placeholder="Required for password recovery" data-i18n-placeholder="users.mobileRecoveryHint"></div>
            <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1" data-i18n="field.emailAddress">Email Address</label><input type="email" id="new-email" class="w-full border rounded p-2 outline-none" placeholder="Required for password recovery" data-i18n-placeholder="users.emailRecoveryHint"></div>
            <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1" data-i18n="field.accountRole">Account Assignment Role</label><select id="new-role" class="w-full border rounded p-2 bg-white outline-none"><option value="User" data-i18n="option.standardUser">Standard operational User</option><option value="Admin" data-i18n="option.admin">System Admin</option></select></div>
            <div>
              <label class="block text-xs font-bold uppercase text-gray-500 mb-2" data-i18n="users.menuScopes">Menu Execution Scopes</label>
              <div id="create-user-perms" class="bg-gray-50 p-3 rounded border text-xs max-h-64 overflow-y-auto"></div>
            </div>
            <button type="submit" class="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded transition" data-i18n="form.users.register">Register User</button>
          </form>
        </div>
        <div class="bg-white p-6 rounded-xl shadow border border-gray-200 lg:col-span-2 flex flex-col h-[70vh]">
          <h3 class="text-lg font-semibold text-gray-700 mb-4" data-i18n="form.users.activeDirectories">Active Directories</h3>
          <div class="overflow-y-auto border rounded-lg flex-1">
             <table class="w-full text-left border-collapse text-xs">
               <thead class="bg-slate-800 text-white uppercase whitespace-nowrap sticky top-0 z-10 shadow">
                 <tr><th class="p-3" data-i18n="field.username">Username</th><th class="p-3" data-i18n="col.role">Role</th><th class="p-3" data-i18n="col.status">Status</th><th class="p-3" data-i18n="users.contact">Contact</th><th class="p-3" data-i18n="col.permissionsScope">Permissions Scope</th><th class="p-3" data-i18n="col.actions">Actions</th></tr>
               </thead>
               <tbody id="table-users-list" class="divide-y text-gray-600 font-medium">
                 <tr><td colspan="6" class="p-6 text-center text-gray-400 animate-pulse" data-i18n="users.loadingOperators">Loading system operators...</td></tr>
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>

    <div id="modal-user-edit" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 hidden">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <div class="flex justify-between items-center border-b pb-3 mb-4">
          <h3 class="text-lg font-bold text-gray-800" data-i18n="users.editTitle">Edit User Access</h3>
          <button type="button" id="close-user-modal" class="text-2xl font-bold text-gray-400 hover:text-gray-700">&times;</button>
        </div>
        <form id="form-edit-user" class="space-y-3 text-xs">
          <input type="hidden" id="edit-user-username">
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.mobileContact">Mobile Contact</label><input type="text" id="edit-user-mobile" class="w-full border rounded p-2 text-sm outline-none"></div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.emailAddress">Email Address</label><input type="email" id="edit-user-email" class="w-full border rounded p-2 text-sm outline-none"></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="field.accountRole">Account Assignment Role</label><select id="edit-user-role" class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="User" data-i18n="option.standardUser">Standard operational User</option><option value="Admin" data-i18n="option.admin">System Admin</option></select></div>
            <div><label class="block font-bold text-gray-600 mb-1" data-i18n="col.status">Status</label><select id="edit-user-status" class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Active" data-i18n="users.statusActive">Active</option><option value="Paused" data-i18n="users.statusPaused">Paused</option><option value="Removed" data-i18n="users.statusRemoved">Removed</option></select></div>
          </div>
          <div><label class="block font-bold text-gray-600 mb-1" data-i18n="users.newPasswordOptional">New Password (optional)</label>
            <div class="relative">
              <input type="password" id="edit-user-password" minlength="6" class="w-full border rounded p-2 pr-12 text-sm outline-none" placeholder="Leave blank to keep current" data-i18n-placeholder="users.leaveBlankPassword">
              <button type="button" id="toggle-edit-user-password" class="absolute right-3 top-2.5 text-[10px] font-bold uppercase text-gray-400 hover:text-blue-600 transition tracking-wider focus:outline-none" data-i18n="common.show">Show</button>
            </div>
          </div>
          <div><label class="block font-bold text-gray-600 mb-2" data-i18n="users.menuScopes">Menu Execution Scopes</label><div id="edit-user-perms" class="bg-gray-50 p-3 rounded border max-h-52 overflow-y-auto"></div></div>
          <div class="flex justify-end gap-2 pt-3 border-t">
            <button type="button" id="btn-cancel-user-edit" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm" data-i18n="common.cancel">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm" data-i18n="common.save">Save</button>
          </div>
        </form>
      </div>
    </div>
  `
};