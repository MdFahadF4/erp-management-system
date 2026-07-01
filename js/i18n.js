import { FORM_STRINGS, getCategoryLabel } from './i18n-forms.js';
import { REPORT_STRINGS, getReportFlowTypeLabel, getReportSourceLabel } from './i18n-reports.js';

const STORAGE_KEY = 'erp-language';
const DEFAULT_LANG = 'en';

export { getCategoryLabel, getReportFlowTypeLabel, getReportSourceLabel };

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ur', label: 'Urdu', native: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' }
];

const STRINGS = {
  en: {
    'app.title': 'Mehrin Trading Co.',
    'header.workspace': 'Mehrin Trading Co.',
    'header.cashDrawer': 'Cash Drawer:',
    'header.changeLanguage': 'Change language',
    'login.title': 'System Gateway',
    'login.subtitle': 'Please input authorization credentials.',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'sidebar.corePanel': 'CORE PANEL',
    'sidebar.changePassword': 'Change Password',
    'sidebar.signOut': 'Sign Out',
    'nav.dashboard': 'Dashboard',
    'nav.hr': 'HR Management',
    'nav.hrTransactions': 'HR Transactions',
    'nav.hrFactory': 'HR Factory',
    'nav.customers': 'Customers',
    'nav.customerTransactions': 'Customer Transactions',
    'nav.deliveryDashboard': 'Delivery Dashboard',
    'nav.internalTransfer': 'Internal Transfer',
    'nav.internalTransferView': 'Internal Transfer View',
    'nav.suppliers': 'Suppliers',
    'nav.supplierTransactions': 'Supplier Transactions',
    'nav.expenseHeads': 'Expense Heads',
    'nav.expenseTransactions': 'Expense Transactions',
    'nav.creditorHeads': 'Creditor Heads',
    'nav.creditorTransactions': 'Creditor Transactions',
    'nav.incomeHeads': 'Income Heads',
    'nav.incomeTransactions': 'Income Transactions',
    'nav.capitalHeads': 'Capital Heads',
    'nav.capitalTransactions': 'Capital Transactions',
    'nav.allTransactions': 'All Transaction View',
    'nav.reports': 'Reports System',
    'nav.users': 'User Access Control',
    'chrome.dashboardSnapshot': 'Dashboard Snapshot',
    'chrome.dashboardSummary': 'Tap to view balance & cash drawers',
    'chrome.moduleOptions': 'Module Options',
    'chrome.moduleSummary': 'Tap to show form & options',
    'chrome.liveDrawers': 'Live User Cash Drawers',
    'chrome.calculatingDrawers': 'Calculating enterprise drawer balances...',
    'modal.updateCredentials': 'Update Credentials',
    'modal.currentPassword': 'Current Password',
    'modal.newPassword': 'New Password',
    'modal.confirmPassword': 'Confirm New Password',
    'modal.overwritePassword': 'OVERWRITE PASSWORD',
    'common.show': 'Show',
    'common.print': 'Print',
    'common.share': 'Share',
    'common.hide': 'Hide',
    'common.refresh': 'Refresh Data',
    'common.ledgerView': 'Ledger View',
    'common.backToForm': 'Back to Form',
    'common.hideLedger': 'Hide Ledger',
    'common.fromDate': 'From Date',
    'common.toDate': 'To Date',
    'common.executeQuery': 'Execute Query',
    'common.printExport': 'Print / Export',
    'common.loading': 'Loading...',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.locked': 'Locked',
    'credit.developedBy': 'Developed by',
    'credit.contactTitle': 'Contact Developer',
    'credit.email': 'Email',
    'credit.whatsapp': 'WhatsApp',
    'common.chooseReport': '-- Choose Report Type --',
    'common.selectMasterReport': 'Select Master Report',
    'common.welcome': 'Welcome, {name}. Select a module from the menu to begin.',
    'page.dashboard.title': 'Executive Dashboard',
    'page.hr.title': 'HR Ledger & Payroll Management',
    'page.hr.newEmployee': 'New Employee Entry',
    'page.hr.personnelRecords': 'Personnel Database Records',
    'page.hrTransactions.title': 'HR Transaction Ledger',
    'page.hrFactory.title': 'HR Factory',
    'page.hrFactory.subtitle': 'Factory-designation personnel — master ledger list and date-wise details report.',
    'page.hrFactory.ledgerTitle': 'Factory Personnel Ledger',
    'page.suppliers.title': 'Supplier Account Management',
    'page.supplierTransactions.title': 'Supplier Transaction Ledger',
    'page.customers.title': 'Customer Accounts Matrix',
    'page.customerTransactions.title': 'Customer Transaction Logging',
    'page.deliveryDashboard.title': 'Delivery Dashboard',
    'page.internalTransfer.title': 'Internal Cash Handover Transfer',
    'page.internalTransferView.title': 'Internal Transfer View (Admin)',
    'page.internalTransferView.subtitle': 'Review all internal cash handovers by date. Approve owner handovers before they deduct from the sender cash drawer.',
    'page.expenseHeads.title': 'Expense Category Setup',
    'page.expenseTransactions.title': 'Operational Expense Ledger',
    'page.creditors.title': 'Creditor Setup (Liabilities)',
    'page.creditorTransactions.title': 'Creditor Ledger (Loans & Returns)',
    'page.incomeHeads.title': 'Income Category Setup (Revenues)',
    'page.incomeTransactions.title': 'Income Ledger Logging',
    'page.capitalHeads.title': 'Capital Head Setup (Equity)',
    'page.capitalTransactions.title': 'Capital Ledger (Investment & Withdrawals)',
    'page.allTransactions.title': 'All Transaction View (Master Audit)',
    'page.reports.title': 'Enterprise Reporting System',
    'page.users.title': 'User Access Management',
    'report.dailyMonthly': 'Daily / Monthly Aggregate Report',
    'report.dailyCashflow': 'Daily Accounts Cash Flow (IN & OUT)',
    'report.pnl': 'Profit & Loss Report',
    'report.receivablePayable': 'Receivable and Payable Report',
    'report.expenseReport': 'Expense Report',
    'report.customerDetails': 'Customer Details Report (Statement)',
    'report.supplierDetails': 'Supplier Details Report',
    'report.hrDetails': 'HR Details Report',
    'report.userPerformance': 'User Sells Performance Report',
    'report.individualUser': 'Individual User Report',
    'report.expenseDetails': 'Expense Details Report',
    'report.creditorDetails': 'Creditor Details Report',
    'report.incomeDetails': 'Income Details Report',
    'report.capitalDetails': 'Capital Details Report',
    'report.masterExecutive': 'Master Executive Dashboard',
    'mobile.collapseLedger': 'Ledger loaded · Tap to show entry form',
    'mobile.collapseFilters': 'Showing audit records · Tap to change filters',
    'mobile.viewingLedger': 'Viewing ledger · Tap to show form',
    'mobile.tapHideForm': 'Tap to hide form & options',
    'mobile.tapShowForm': 'Tap to show form & options',
    'mobile.reportOptions': 'Report Options',
    'mobile.reportSummary': 'Tap to select report & dates',
    'mobile.auditFilters': 'Audit Filters',
    'mobile.auditSummary': 'Tap to set dates & category',
    'mobile.userManagement': 'User Management',
    'mobile.userSummary': 'Tap to provision new account',
    'mobile.formActions': 'Tap to show entry form & actions',
    'allTxn.transactionCategory': 'Transaction Category',
    'allTxn.categoryAll': 'All Categories (Default)',
    'allTxn.catHR': 'HR Transactions',
    'allTxn.catSupplier': 'Supplier Transactions',
    'allTxn.catCustomer': 'Customer Transactions',
    'allTxn.catExpense': 'Expense Transactions',
    'allTxn.catCreditor': 'Creditor Transactions',
    'allTxn.catIncome': 'Income Transactions',
    'allTxn.catCapital': 'Capital Transactions',
    'allTxn.catInternal': 'Internal Transfers',
    'allTxn.searchFilter': 'Search / Filter Records',
    'allTxn.colDate': 'Date',
    'allTxn.colCategory': 'Category',
    'allTxn.colDetails': 'Transaction Details',
    'allTxn.colFinancial': 'Financial Impact',
    'allTxn.colRemarks': 'Remarks / Narrative',
    'allTxn.colLoggedBy': 'Logged By',
    'allTxn.colStamp': 'Stamp',
    'allTxn.loadingToday': "Loading today's transactions...",
    'allTxn.aggregating': 'Aggregating enterprise logs across all modules... Please wait.',
    'allTxn.selectDates': 'Please select dates to search.',
    'allTxn.noResults': 'No transactions found for the selected criteria.',
    'allTxn.loadFailed': 'Failed to load aggregate ledger data.',
    'allTxn.moduleHR': 'HR',
    'allTxn.moduleSupplier': 'Supplier',
    'allTxn.moduleCustomer': 'Customer',
    'allTxn.moduleExpense': 'Expense',
    'allTxn.moduleCreditor': 'Creditor',
    'allTxn.moduleIncome': 'Income',
    'allTxn.moduleCapital': 'Capital',
    'allTxn.moduleInternal': 'Internal',
    'allTxn.finAmount': 'SAR {amount}',
    'allTxn.finSoldRecv': 'Sold: {sold} | Recv: {recv}',
    'allTxn.finSoldDiscRecv': 'Sold: {sold} | Disc: {disc} | Recv: {recv}',
    'allTxn.finSupTxn': 'Purchase: {purchase} | Disc: {disc} | Paid: {paid} | Due: {due}',
    'allTxn.finCredTxn': 'Recv: {recv} | Disc: {disc} | Ret: {ret} | Due: {due}',
    'allTxn.finIncTxn': 'Billed: {billed} | Disc: {disc} | Recv: {recv} | Due: {due}',
    'allTxn.finCapTxn': 'In: {capIn} | Disc: {disc} | Out: {capOut} | Due: {due}',
    'allTxn.finExpTxn': 'Inc: {inc} | Disc: {disc} | Paid: {paid} | Due: {due}',
    'allTxn.cashHandover': 'Cash Handover to Owner',
    'allTxn.finDepPaid': 'Dep: {dep} | Paid: {paid}',
    'allTxn.finRecvRet': 'Recv: {recv} | Ret: {ret}',
    'allTxn.finBilledRecv': 'Billed: {billed} | Recv: {recv}',
    'allTxn.finCapInOut': 'In: {capIn} | Out: {capOut}',
    'allTxn.detailsUid': 'UID: {uid} | {method}',
    'allTxn.detailsNamed': '{name} ({category})',
    'allTxn.noRemarks': '-'
  },
  ar: {
    'app.title': 'نظام إدارة المؤسسة',
    'header.workspace': 'مساحة عمل النظام',
    'header.cashDrawer': 'درج النقد:',
    'header.changeLanguage': 'تغيير اللغة',
    'login.title': 'بوابة النظام',
    'login.subtitle': 'يرجى إدخال بيانات الاعتماد.',
    'login.username': 'اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.signIn': 'تسجيل الدخول',
    'sidebar.corePanel': 'اللوحة الرئيسية',
    'sidebar.changePassword': 'تغيير كلمة المرور',
    'sidebar.signOut': 'تسجيل الخروج',
    'nav.dashboard': 'لوحة التحكم',
    'nav.hr': 'إدارة الموارد البشرية',
    'nav.hrTransactions': 'معاملات الموارد البشرية',
    'nav.hrFactory': 'موارد بشرية المصنع',
    'nav.customers': 'العملاء',
    'nav.customerTransactions': 'معاملات العملاء',
    'nav.internalTransfer': 'تحويل داخلي',
    'nav.suppliers': 'الموردون',
    'nav.supplierTransactions': 'معاملات الموردين',
    'nav.expenseHeads': 'رؤوس المصروفات',
    'nav.expenseTransactions': 'معاملات المصروفات',
    'nav.creditorHeads': 'رؤوس الدائنين',
    'nav.creditorTransactions': 'معاملات الدائنين',
    'nav.incomeHeads': 'رؤوس الدخل',
    'nav.incomeTransactions': 'معاملات الدخل',
    'nav.allTransactions': 'عرض جميع المعاملات',
    'nav.reports': 'نظام التقارير',
    'nav.users': 'التحكم في المستخدمين',
    'chrome.dashboardSnapshot': 'لمحة لوحة التحكم',
    'chrome.dashboardSummary': 'اضغط لعرض الرصيد والأدراج النقدية',
    'chrome.moduleOptions': 'خيارات الوحدة',
    'chrome.moduleSummary': 'اضغط لإظهار النموذج والخيارات',
    'chrome.liveDrawers': 'أدراج النقد المباشرة',
    'chrome.calculatingDrawers': 'جاري حساب أرصدة الأدراج...',
    'modal.updateCredentials': 'تحديث بيانات الدخول',
    'modal.currentPassword': 'كلمة المرور الحالية',
    'modal.newPassword': 'كلمة المرور الجديدة',
    'modal.confirmPassword': 'تأكيد كلمة المرور',
    'modal.overwritePassword': 'تحديث كلمة المرور',
    'common.show': 'إظهار',
    'common.hide': 'إخفاء',
    'common.refresh': 'تحديث البيانات',
    'common.ledgerView': 'عرض السجل',
    'common.backToForm': 'العودة للنموذج',
    'common.hideLedger': 'إخفاء السجل',
    'common.fromDate': 'من تاريخ',
    'common.toDate': 'إلى تاريخ',
    'common.executeQuery': 'تنفيذ الاستعلام',
    'common.printExport': 'طباعة / تصدير',
    'common.loading': 'جاري التحميل...',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.edit': 'تعديل',
    'common.locked': 'مقفل',
    'credit.developedBy': 'تطوير',
    'credit.contactTitle': 'تواصل مع المطور',
    'credit.email': 'البريد الإلكتروني',
    'credit.whatsapp': 'واتساب',
    'common.chooseReport': '-- اختر نوع التقرير --',
    'common.selectMasterReport': 'اختر التقرير الرئيسي',
    'common.welcome': 'مرحباً {name}. اختر وحدة من القائمة للبدء.',
    'page.dashboard.title': 'لوحة التحكم التنفيذية',
    'page.hr.title': 'إدارة الموارد البشرية والرواتب',
    'page.hr.newEmployee': 'إدخال موظف جديد',
    'page.hr.personnelRecords': 'سجلات الموظفين',
    'page.hrTransactions.title': 'سجل معاملات الموارد البشرية',
    'page.hrFactory.title': 'موارد بشرية المصنع',
    'page.hrFactory.subtitle': 'موظفون بتسمية وظيفية متعلقة بالمصنع فقط — نفس حقول سجل الموارد البشرية.',
    'page.hrFactory.ledgerTitle': 'سجل موظفي المصنع',
    'page.suppliers.title': 'إدارة حسابات الموردين',
    'page.supplierTransactions.title': 'سجل معاملات الموردين',
    'page.customers.title': 'مصفوفة حسابات العملاء',
    'page.customerTransactions.title': 'تسجيل معاملات العملاء',
    'page.internalTransfer.title': 'وحدة التحويل النقدي الداخلي',
    'page.expenseHeads.title': 'إعداد فئات المصروفات',
    'page.expenseTransactions.title': 'سجل معاملات المصروفات',
    'page.creditors.title': 'إدارة حسابات الدائنين',
    'page.creditorTransactions.title': 'سجل معاملات الدائنين',
    'page.incomeHeads.title': 'إعداد فئات الدخل',
    'page.incomeTransactions.title': 'سجل معاملات الدخل',
    'page.allTransactions.title': 'سجل تدقيق المؤسسة (جميع المعاملات)',
    'page.reports.title': 'نظام التقارير المؤسسي',
    'page.users.title': 'مصفوفة التحكم في المستخدمين',
    'report.dailyMonthly': 'تقرير يومي / شهري',
    'report.dailyCashflow': 'تقرير التدفق النقدي اليومي',
    'report.pnl': 'تقرير الأرباح والخسائر',
    'report.receivablePayable': 'تقرير المستحقات والمدفوعات',
    'report.expenseReport': 'تقرير المصروفات',
    'report.customerDetails': 'تقرير تفاصيل العميل',
    'report.supplierDetails': 'تقرير تفاصيل المورد',
    'report.hrDetails': 'تقرير تفاصيل الموارد البشرية',
    'report.userPerformance': 'تقرير أداء المبيعات',
    'report.individualUser': 'تقرير المستخدم الفردي',
    'report.expenseDetails': 'تقرير تفاصيل المصروفات',
    'report.creditorDetails': 'تقرير تفاصيل الدائن',
    'report.incomeDetails': 'تقرير تفاصيل الدخل',
    'report.masterExecutive': 'لوحة التحكم التنفيذية',
    'mobile.collapseLedger': 'تم تحميل السجل · اضغط لإظهار النموذج',
    'mobile.collapseFilters': 'عرض السجلات · اضغط لتغيير الفلاتر',
    'mobile.viewingLedger': 'عرض السجل · اضغط لإظهار النموذج',
    'mobile.tapHideForm': 'اضغط لإخفاء النموذج',
    'mobile.tapShowForm': 'اضغط لإظهار النموذج',
    'allTxn.transactionCategory': 'فئة المعاملة',
    'allTxn.categoryAll': 'جميع الفئات (افتراضي)',
    'allTxn.catHR': 'معاملات الموارد البشرية',
    'allTxn.catSupplier': 'معاملات الموردين',
    'allTxn.catCustomer': 'معاملات العملاء',
    'allTxn.catExpense': 'معاملات المصروفات',
    'allTxn.catCreditor': 'معاملات الدائنين',
    'allTxn.catIncome': 'معاملات الدخل',
    'allTxn.catInternal': 'التحويلات الداخلية',
    'allTxn.searchFilter': 'بحث / تصفية السجلات',
    'allTxn.colDate': 'التاريخ',
    'allTxn.colCategory': 'الفئة',
    'allTxn.colDetails': 'تفاصيل المعاملة',
    'allTxn.colFinancial': 'الأثر المالي',
    'allTxn.colRemarks': 'الملاحظات / السرد',
    'allTxn.colLoggedBy': 'سجل بواسطة',
    'allTxn.colStamp': 'الطابع',
    'allTxn.loadingToday': 'جاري تحميل معاملات اليوم...',
    'allTxn.aggregating': 'جاري تجميع سجلات المؤسسة... يرجى الانتظار.',
    'allTxn.selectDates': 'يرجى اختيار التواريخ للبحث.',
    'allTxn.noResults': 'لم يتم العثور على معاملات للمعايير المحددة.',
    'allTxn.loadFailed': 'فشل تحميل بيانات السجل المجمع.',
    'allTxn.moduleHR': 'موارد بشرية',
    'allTxn.moduleSupplier': 'مورد',
    'allTxn.moduleCustomer': 'عميل',
    'allTxn.moduleExpense': 'مصروف',
    'allTxn.moduleCreditor': 'دائن',
    'allTxn.moduleIncome': 'دخل',
    'allTxn.moduleInternal': 'داخلي',
    'allTxn.finAmount': 'SAR {amount}',
    'allTxn.finSoldRecv': 'مباع: {sold} | مستلم: {recv}',
    'allTxn.cashHandover': 'تسليم نقدي للمالك',
    'allTxn.finDepPaid': 'إيداع: {dep} | مدفوع: {paid}',
    'allTxn.finRecvRet': 'مستلم: {recv} | مرتجع: {ret}',
    'allTxn.finBilledRecv': 'مفوتر: {billed} | مستلم: {recv}',
    'allTxn.detailsUid': 'UID: {uid} | {method}',
    'allTxn.detailsNamed': '{name} ({category})',
    'allTxn.noRemarks': '-'
  },
  bn: {
    'app.title': 'এন্টারপ্রাইজ ম্যানেজমেন্ট সিস্টেম',
    'header.workspace': 'সিস্টেম ওয়ার্কস্পেস',
    'header.cashDrawer': 'ক্যাশ ড্রয়ার:',
    'header.changeLanguage': 'ভাষা পরিবর্তন',
    'login.title': 'সিস্টেম গেটওয়ে',
    'login.subtitle': 'অনুগ্রহ করে লগইন তথ্য দিন।',
    'login.username': 'ব্যবহারকারীর নাম',
    'login.password': 'পাসওয়ার্ড',
    'login.signIn': 'সাইন ইন',
    'sidebar.corePanel': 'মূল প্যানেল',
    'sidebar.changePassword': 'পাসওয়ার্ড পরিবর্তন',
    'sidebar.signOut': 'সাইন আউট',
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.hr': 'এইচআর ব্যবস্থাপনা',
    'nav.hrTransactions': 'এইচআর লেনদেন',
    'nav.hrFactory': 'এইচআর ফ্যাক্টরি',
    'nav.customers': 'গ্রাহক',
    'nav.customerTransactions': 'গ্রাহক লেনদেন',
    'nav.internalTransfer': 'অভ্যন্তরীণ স্থানান্তর',
    'nav.suppliers': 'সরবরাহকারী',
    'nav.supplierTransactions': 'সরবরাহকারী লেনদেন',
    'nav.expenseHeads': 'খরচের হেড',
    'nav.expenseTransactions': 'খরচের লেনদেন',
    'nav.creditorHeads': 'ঋণদাতা হেড',
    'nav.creditorTransactions': 'ঋণদাতা লেনদেন',
    'nav.incomeHeads': 'আয়ের হেড',
    'nav.incomeTransactions': 'আয়ের লেনদেন',
    'nav.allTransactions': 'সমস্ত লেনদেন',
    'nav.reports': 'রিপোর্ট সিস্টেম',
    'nav.users': 'ব্যবহারকারী নিয়ন্ত্রণ',
    'chrome.dashboardSnapshot': 'ড্যাশবোর্ড স্ন্যাপশট',
    'chrome.dashboardSummary': 'ব্যালেন্স দেখতে ট্যাপ করুন',
    'chrome.moduleOptions': 'মডিউল অপশন',
    'chrome.moduleSummary': 'ফর্ম দেখতে ট্যাপ করুন',
    'chrome.liveDrawers': 'লাইভ ক্যাশ ড্রয়ার',
    'chrome.calculatingDrawers': 'ব্যালেন্স হিসাব হচ্ছে...',
    'modal.updateCredentials': 'পাসওয়ার্ড আপডেট',
    'modal.currentPassword': 'বর্তমান পাসওয়ার্ড',
    'modal.newPassword': 'নতুন পাসওয়ার্ড',
    'modal.confirmPassword': 'পাসওয়ার্ড নিশ্চিত করুন',
    'modal.overwritePassword': 'পাসওয়ার্ড আপডেট করুন',
    'common.show': 'দেখান',
    'common.hide': 'লুকান',
    'common.refresh': 'ডেটা রিফ্রেশ',
    'common.ledgerView': 'লেজার দেখুন',
    'common.backToForm': 'ফর্মে ফিরুন',
    'common.hideLedger': 'লেজার লুকান',
    'common.fromDate': 'শুরুর তারিখ',
    'common.toDate': 'শেষ তারিখ',
    'common.executeQuery': 'রিপোর্ট চালান',
    'common.printExport': 'প্রিন্ট / এক্সপোর্ট',
    'common.loading': 'লোড হচ্ছে...',
    'common.cancel': 'বাতিল',
    'common.save': 'সংরক্ষণ',
    'common.edit': 'সম্পাদনা',
    'common.locked': 'লক',
    'credit.developedBy': 'ডেভেলপ করেছেন',
    'credit.contactTitle': 'ডেভেলপারের সাথে যোগাযোগ',
    'credit.email': 'ইমেইল',
    'credit.whatsapp': 'হোয়াটসঅ্যাপ',
    'common.chooseReport': '-- রিপোর্ট নির্বাচন --',
    'common.selectMasterReport': 'রিপোর্ট নির্বাচন',
    'common.welcome': 'স্বাগতম {name}। মেনু থেকে একটি মডিউল নির্বাচন করুন।',
    'page.dashboard.title': 'এক্সিকিউটিভ ড্যাশবোর্ড',
    'page.hr.title': 'এইচআর ও পে-Roll ব্যবস্থাপনা',
    'page.hr.newEmployee': 'নতুন কর্মী এন্ট্রি',
    'page.hr.personnelRecords': 'কর্মী ডাটাবেস',
    'page.hrTransactions.title': 'এইচআর লেনদেন লেজার',
    'page.hrFactory.title': 'এইচআর ফ্যাক্টরি',
    'page.hrFactory.subtitle': 'শুধু ফ্যাক্টরি-সংক্রান্ত পদবি — HR মাস্টার লেজারের মতো একই ক্ষেত্র।',
    'page.hrFactory.ledgerTitle': 'ফ্যাক্টরি কর্মী লেজার',
    'page.suppliers.title': 'সরবরাহকারী ব্যবস্থাপনা',
    'page.supplierTransactions.title': 'সরবরাহকারী লেনদেন লেজার',
    'page.customers.title': 'গ্রাহক অ্যাকাউন্ট',
    'page.customerTransactions.title': 'গ্রাহক লেনদেন',
    'page.internalTransfer.title': 'অভ্যন্তরীণ স্থানান্তর',
    'page.expenseHeads.title': 'খরচ ক্যাটাগরি',
    'page.expenseTransactions.title': 'খরচ লেনদেন লেজার',
    'page.creditors.title': 'ঋণদাতা ব্যবস্থাপনা',
    'page.creditorTransactions.title': 'ঋণদাতা লেনদেন',
    'page.incomeHeads.title': 'আয় ক্যাটাগরি',
    'page.incomeTransactions.title': 'আয় লেনদেন',
    'page.allTransactions.title': 'সমস্ত লেনদেন অডিট',
    'page.reports.title': 'এন্টারপ্রাইজ রিপোর্টিং',
    'page.users.title': 'ব্যবহারকারী নিয়ন্ত্রণ',
    'report.dailyMonthly': 'দৈনিক / মাসিক রিপোর্ট',
    'report.dailyCashflow': 'দৈনিক ক্যাশ ফ্লো',
    'report.pnl': 'লাভ ও ক্ষতি রিপোর্ট',
    'report.receivablePayable': 'পাওনা ও দেনা রিপোর্ট',
    'report.expenseReport': 'খরচ রিপোর্ট',
    'report.customerDetails': 'গ্রাহক বিবরণ রিপোর্ট',
    'report.supplierDetails': 'সরবরাহকারী বিবরণ',
    'report.hrDetails': 'এইচআর বিবরণ',
    'report.userPerformance': 'বিক্রয় পারফরম্যান্স',
    'report.individualUser': 'ব্যক্তিগত ব্যবহারকারী রিপোর্ট',
    'report.expenseDetails': 'খরচ বিবরণ রিপোর্ট',
    'report.creditorDetails': 'ঋণদাতা বিবরণ',
    'report.incomeDetails': 'আয় বিবরণ',
    'report.masterExecutive': 'এক্সিকিউটিভ ড্যাশবোর্ড',
    'mobile.collapseLedger': 'লেজার লোড · ফর্ম দেখতে ট্যাপ',
    'mobile.collapseFilters': 'রেকর্ড দেখানো · ফিল্টার পরিবর্তন',
    'mobile.viewingLedger': 'লেজার দেখছেন · ফর্ম দেখতে ট্যাপ',
    'mobile.tapHideForm': 'ফর্ম লুকাতে ট্যাপ',
    'mobile.tapShowForm': 'ফর্ম দেখতে ট্যাপ',
    'allTxn.transactionCategory': 'লেনদেনের বিভাগ',
    'allTxn.categoryAll': 'সব বিভাগ (ডিফল্ট)',
    'allTxn.catHR': 'এইচআর লেনদেন',
    'allTxn.catSupplier': 'সরবরাহকারী লেনদেন',
    'allTxn.catCustomer': 'গ্রাহক লেনদেন',
    'allTxn.catExpense': 'খরচের লেনদেন',
    'allTxn.catCreditor': 'ঋণদাতা লেনদেন',
    'allTxn.catIncome': 'আয়ের লেনদেন',
    'allTxn.catInternal': 'অভ্যন্তরীণ স্থানান্তর',
    'allTxn.searchFilter': 'অনুসন্ধান / ফিল্টার',
    'allTxn.colDate': 'তারিখ',
    'allTxn.colCategory': 'বিভাগ',
    'allTxn.colDetails': 'লেনদেনের বিবরণ',
    'allTxn.colFinancial': 'আর্থিক প্রভাব',
    'allTxn.colRemarks': 'মন্তব্য / বর্ণনা',
    'allTxn.colLoggedBy': 'লগ করেছেন',
    'allTxn.colStamp': 'স্ট্যাম্প',
    'allTxn.loadingToday': 'আজকের লেনদেন লোড হচ্ছে...',
    'allTxn.aggregating': 'সব মডিউল থেকে লগ সংগ্রহ হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।',
    'allTxn.selectDates': 'অনুসন্ধানের জন্য তারিখ নির্বাচন করুন।',
    'allTxn.noResults': 'নির্বাচিত মানদণ্ডে কোনো লেনদেন পাওয়া যায়নি।',
    'allTxn.loadFailed': 'সমষ্টি লেজার ডেটা লোড করতে ব্যর্থ।',
    'allTxn.moduleHR': 'এইচআর',
    'allTxn.moduleSupplier': 'সরবরাহকারী',
    'allTxn.moduleCustomer': 'গ্রাহক',
    'allTxn.moduleExpense': 'খরচ',
    'allTxn.moduleCreditor': 'ঋণদাতা',
    'allTxn.moduleIncome': 'আয়',
    'allTxn.moduleInternal': 'অভ্যন্তরীণ',
    'allTxn.finAmount': 'SAR {amount}',
    'allTxn.finSoldRecv': 'বিক্রি: {sold} | প্রাপ্ত: {recv}',
    'allTxn.cashHandover': 'মালিকের কাছে নগদ হস্তান্তর',
    'allTxn.finDepPaid': 'জমা: {dep} | পরিশোধ: {paid}',
    'allTxn.finRecvRet': 'প্রাপ্ত: {recv} | ফেরত: {ret}',
    'allTxn.finBilledRecv': 'বিল: {billed} | প্রাপ্ত: {recv}',
    'allTxn.detailsUid': 'UID: {uid} | {method}',
    'allTxn.detailsNamed': '{name} ({category})',
    'allTxn.noRemarks': '-'
  },
  de: {
    'app.title': 'Unternehmens-Managementsystem',
    'header.workspace': 'System-Arbeitsbereich',
    'header.cashDrawer': 'Kassenlade:',
    'header.changeLanguage': 'Sprache ändern',
    'login.title': 'System-Gateway',
    'login.subtitle': 'Bitte Anmeldedaten eingeben.',
    'login.username': 'Benutzername',
    'login.password': 'Passwort',
    'login.signIn': 'Anmelden',
    'sidebar.corePanel': 'HAUPTPANEL',
    'sidebar.changePassword': 'Passwort ändern',
    'sidebar.signOut': 'Abmelden',
    'nav.dashboard': 'Dashboard',
    'nav.hr': 'Personalverwaltung',
    'nav.hrTransactions': 'Personal-Transaktionen',
    'nav.hrFactory': 'HR Fabrik',
    'nav.customers': 'Kunden',
    'nav.customerTransactions': 'Kundentransaktionen',
    'nav.internalTransfer': 'Interner Transfer',
    'nav.suppliers': 'Lieferanten',
    'nav.supplierTransactions': 'Lieferantentransaktionen',
    'nav.expenseHeads': 'Ausgabenköpfe',
    'nav.expenseTransactions': 'Ausgabentransaktionen',
    'nav.creditorHeads': 'Gläubigerköpfe',
    'nav.creditorTransactions': 'Gläubigertransaktionen',
    'nav.incomeHeads': 'Einkommensköpfe',
    'nav.incomeTransactions': 'Einkommenstransaktionen',
    'nav.allTransactions': 'Alle Transaktionen',
    'nav.reports': 'Berichtssystem',
    'nav.users': 'Benutzerverwaltung',
    'chrome.dashboardSnapshot': 'Dashboard-Snapshot',
    'chrome.dashboardSummary': 'Tippen für Saldo & Kassen',
    'chrome.moduleOptions': 'Moduloptionen',
    'chrome.moduleSummary': 'Tippen für Formular & Optionen',
    'chrome.liveDrawers': 'Live-Kassen',
    'chrome.calculatingDrawers': 'Kassen werden berechnet...',
    'modal.updateCredentials': 'Anmeldedaten aktualisieren',
    'modal.currentPassword': 'Aktuelles Passwort',
    'modal.newPassword': 'Neues Passwort',
    'modal.confirmPassword': 'Passwort bestätigen',
    'modal.overwritePassword': 'PASSWORT AKTUALISIEREN',
    'common.show': 'Anzeigen',
    'common.hide': 'Ausblenden',
    'common.refresh': 'Daten aktualisieren',
    'common.ledgerView': 'Hauptbuch',
    'common.backToForm': 'Zurück zum Formular',
    'common.hideLedger': 'Hauptbuch ausblenden',
    'common.fromDate': 'Von Datum',
    'common.toDate': 'Bis Datum',
    'common.executeQuery': 'Abfrage ausführen',
    'common.printExport': 'Drucken / Export',
    'common.loading': 'Laden...',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.edit': 'Bearbeiten',
    'common.locked': 'Gesperrt',
    'credit.developedBy': 'Entwickelt von',
    'credit.contactTitle': 'Entwickler kontaktieren',
    'credit.email': 'E-Mail',
    'credit.whatsapp': 'WhatsApp',
    'common.chooseReport': '-- Berichtstyp wählen --',
    'common.selectMasterReport': 'Hauptbericht wählen',
    'common.welcome': 'Willkommen, {name}. Wählen Sie ein Modul aus dem Menü.',
    'page.dashboard.title': 'Executive Dashboard',
    'page.hr.title': 'Personal- & Gehaltsverwaltung',
    'page.hr.newEmployee': 'Neuer Mitarbeiter',
    'page.hr.personnelRecords': 'Personaldatenbank',
    'page.hrTransactions.title': 'Personal-Transaktionsbuch',
    'page.hrFactory.title': 'HR Fabrik',
    'page.hrFactory.subtitle': 'Nur Personal mit fabrikbezogener Bezeichnung — gleiche Felder wie das HR-Hauptbuch.',
    'page.hrFactory.ledgerTitle': 'Fabrik-Personalbuch',
    'page.suppliers.title': 'Lieferantenverwaltung',
    'page.supplierTransactions.title': 'Lieferanten-Transaktionsbuch',
    'page.customers.title': 'Kundenkonten',
    'page.customerTransactions.title': 'Kundentransaktionen',
    'page.internalTransfer.title': 'Interner Geldtransfer',
    'page.expenseHeads.title': 'Ausgabenkategorien',
    'page.expenseTransactions.title': 'Ausgaben-Transaktionsbuch',
    'page.creditors.title': 'Gläubigerverwaltung',
    'page.creditorTransactions.title': 'Gläubiger-Transaktionsbuch',
    'page.incomeHeads.title': 'Einkommenskategorien',
    'page.incomeTransactions.title': 'Einkommen-Transaktionsbuch',
    'page.allTransactions.title': 'Unternehmens-Audit (Alle Transaktionen)',
    'page.reports.title': 'Unternehmens-Berichtssystem',
    'page.users.title': 'Benutzerzugriff',
    'report.dailyMonthly': 'Tages-/Monatsbericht',
    'report.dailyCashflow': 'Täglicher Cashflow',
    'report.pnl': 'Gewinn- und Verlustbericht',
    'report.receivablePayable': 'Forderungen & Verbindlichkeiten',
    'report.expenseReport': 'Ausgabenbericht',
    'report.customerDetails': 'Kundendetails',
    'report.supplierDetails': 'Lieferantendetails',
    'report.hrDetails': 'Personal-Details',
    'report.userPerformance': 'Verkaufsleistung',
    'report.individualUser': 'Einzelbenutzerbericht',
    'report.expenseDetails': 'Ausgabendetails',
    'report.creditorDetails': 'Gläubigerdetails',
    'report.incomeDetails': 'Einkommensdetails',
    'report.masterExecutive': 'Executive Dashboard',
    'mobile.collapseLedger': 'Hauptbuch geladen · Formular anzeigen',
    'mobile.collapseFilters': 'Datensätze · Filter ändern',
    'mobile.viewingLedger': 'Hauptbuch · Formular anzeigen',
    'mobile.tapHideForm': 'Formular ausblenden',
    'mobile.tapShowForm': 'Formular anzeigen',
    'allTxn.transactionCategory': 'Transaktionskategorie',
    'allTxn.categoryAll': 'Alle Kategorien (Standard)',
    'allTxn.catHR': 'Personal-Transaktionen',
    'allTxn.catSupplier': 'Lieferantentransaktionen',
    'allTxn.catCustomer': 'Kundentransaktionen',
    'allTxn.catExpense': 'Ausgabentransaktionen',
    'allTxn.catCreditor': 'Gläubigertransaktionen',
    'allTxn.catIncome': 'Einkommenstransaktionen',
    'allTxn.catInternal': 'Interne Überweisungen',
    'allTxn.searchFilter': 'Suchen / Filtern',
    'allTxn.colDate': 'Datum',
    'allTxn.colCategory': 'Kategorie',
    'allTxn.colDetails': 'Transaktionsdetails',
    'allTxn.colFinancial': 'Finanzielle Auswirkung',
    'allTxn.colRemarks': 'Bemerkungen / Narrativ',
    'allTxn.colLoggedBy': 'Erfasst von',
    'allTxn.colStamp': 'Zeitstempel',
    'allTxn.loadingToday': 'Heutige Transaktionen werden geladen...',
    'allTxn.aggregating': 'Unternehmensprotokolle werden aggregiert... Bitte warten.',
    'allTxn.selectDates': 'Bitte Datumsbereich zum Suchen wählen.',
    'allTxn.noResults': 'Keine Transaktionen für die ausgewählten Kriterien gefunden.',
    'allTxn.loadFailed': 'Aggregierte Hauptbuchdaten konnten nicht geladen werden.',
    'allTxn.moduleHR': 'Personal',
    'allTxn.moduleSupplier': 'Lieferant',
    'allTxn.moduleCustomer': 'Kunde',
    'allTxn.moduleExpense': 'Ausgabe',
    'allTxn.moduleCreditor': 'Gläubiger',
    'allTxn.moduleIncome': 'Einkommen',
    'allTxn.moduleInternal': 'Intern',
    'allTxn.finAmount': 'SAR {amount}',
    'allTxn.finSoldRecv': 'Verkauft: {sold} | Erhalten: {recv}',
    'allTxn.cashHandover': 'Bargeldübergabe an Eigentümer',
    'allTxn.finDepPaid': 'Einzahlung: {dep} | Bezahlt: {paid}',
    'allTxn.finRecvRet': 'Erhalten: {recv} | Zurück: {ret}',
    'allTxn.finBilledRecv': 'Fakturiert: {billed} | Erhalten: {recv}',
    'allTxn.detailsUid': 'UID: {uid} | {method}',
    'allTxn.detailsNamed': '{name} ({category})',
    'allTxn.noRemarks': '-'
  }
};

const ALL_TXN_I18N = {
  fr: {
    'nav.allTransactions': 'Vue de toutes les transactions',
    'page.allTransactions.title': 'Vue de toutes les transactions (Audit principal)',
    'mobile.auditFilters': "Filtres d'audit",
    'mobile.auditSummary': 'Appuyez pour définir dates et catégorie',
    'allTxn.transactionCategory': 'Catégorie de transaction',
    'allTxn.categoryAll': 'Toutes les catégories (par défaut)',
    'allTxn.catHR': 'Transactions RH',
    'allTxn.catSupplier': 'Transactions fournisseur',
    'allTxn.catCustomer': 'Transactions client',
    'allTxn.catExpense': 'Transactions de dépenses',
    'allTxn.catCreditor': 'Transactions créancier',
    'allTxn.catIncome': 'Transactions de revenus',
    'allTxn.catInternal': 'Transferts internes',
    'allTxn.searchFilter': 'Rechercher / Filtrer les enregistrements',
    'allTxn.colDate': 'Date',
    'allTxn.colCategory': 'Catégorie',
    'allTxn.colDetails': 'Détails de la transaction',
    'allTxn.colFinancial': 'Impact financier',
    'allTxn.colRemarks': 'Remarques / Narratif',
    'allTxn.colLoggedBy': 'Enregistré par',
    'allTxn.colStamp': 'Horodatage',
    'allTxn.loadingToday': 'Chargement des transactions du jour...',
    'allTxn.aggregating': "Agrégation des journaux de l'entreprise... Veuillez patienter.",
    'allTxn.selectDates': 'Veuillez sélectionner des dates pour rechercher.',
    'allTxn.noResults': 'Aucune transaction trouvée pour les critères sélectionnés.',
    'allTxn.loadFailed': 'Échec du chargement des données du grand livre agrégé.',
    'allTxn.moduleHR': 'RH',
    'allTxn.moduleSupplier': 'Fournisseur',
    'allTxn.moduleCustomer': 'Client',
    'allTxn.moduleExpense': 'Dépense',
    'allTxn.moduleCreditor': 'Créancier',
    'allTxn.moduleIncome': 'Revenu',
    'allTxn.moduleInternal': 'Interne',
    'allTxn.finAmount': 'SAR {amount}',
    'allTxn.finSoldRecv': 'Vendu: {sold} | Reçu: {recv}',
    'allTxn.cashHandover': "Remise d'espèces au propriétaire",
    'allTxn.finDepPaid': 'Dépôt: {dep} | Payé: {paid}',
    'allTxn.finRecvRet': 'Reçu: {recv} | Retour: {ret}',
    'allTxn.finBilledRecv': 'Facturé: {billed} | Reçu: {recv}',
    'allTxn.detailsUid': 'UID: {uid} | {method}',
    'allTxn.detailsNamed': '{name} ({category})',
    'allTxn.noRemarks': '-'
  },
  hi: {
    'nav.allTransactions': 'सभी लेनदेन दृश्य',
    'page.allTransactions.title': 'सभी लेनदेन दृश्य (मास्टर ऑडिट)',
    'mobile.auditFilters': 'ऑडिट फ़िल्टर',
    'mobile.auditSummary': 'तिथि और श्रेणी सेट करने के लिए टैप करें',
    'allTxn.transactionCategory': 'लेनदेन श्रेणी',
    'allTxn.categoryAll': 'सभी श्रेणियाँ (डिफ़ॉल्ट)',
    'allTxn.catHR': 'एचआर लेनदेन',
    'allTxn.catSupplier': 'आपूर्तिकर्ता लेनदेन',
    'allTxn.catCustomer': 'ग्राहक लेनदेन',
    'allTxn.catExpense': 'खर्च लेनदेन',
    'allTxn.catCreditor': 'लेनदार लेनदेन',
    'allTxn.catIncome': 'आय लेनदेन',
    'allTxn.catInternal': 'आंतरिक स्थानांतरण',
    'allTxn.searchFilter': 'खोजें / रिकॉर्ड फ़िल्टर करें',
    'allTxn.colDate': 'तिथि',
    'allTxn.colCategory': 'श्रेणी',
    'allTxn.colDetails': 'लेनदेन विवरण',
    'allTxn.colFinancial': 'वित्तीय प्रभाव',
    'allTxn.colRemarks': 'टिप्पणियाँ / विवरण',
    'allTxn.colLoggedBy': 'दर्ज किया',
    'allTxn.colStamp': 'स्टैम्प',
    'allTxn.loadingToday': 'आज के लेनदेन लोड हो रहे हैं...',
    'allTxn.aggregating': 'सभी मॉड्यूल से उद्यम लॉग एकत्र किए जा रहे हैं... कृपया प्रतीक्षा करें।',
    'allTxn.selectDates': 'खोज के लिए कृपया तिथियाँ चुनें।',
    'allTxn.noResults': 'चयनित मानदंडों के लिए कोई लेनदेन नहीं मिला।',
    'allTxn.loadFailed': 'संयुक्त खाता बही डेटा लोड करने में विफल।',
    'allTxn.moduleHR': 'एचआर',
    'allTxn.moduleSupplier': 'आपूर्तिकर्ता',
    'allTxn.moduleCustomer': 'ग्राहक',
    'allTxn.moduleExpense': 'खर्च',
    'allTxn.moduleCreditor': 'लेनदार',
    'allTxn.moduleIncome': 'आय',
    'allTxn.moduleInternal': 'आंतरिक',
    'allTxn.finAmount': 'SAR {amount}',
    'allTxn.finSoldRecv': 'बिक्री: {sold} | प्राप्त: {recv}',
    'allTxn.cashHandover': 'मालिक को नकद सौंपना',
    'allTxn.finDepPaid': 'जमा: {dep} | भुगतान: {paid}',
    'allTxn.finRecvRet': 'प्राप्त: {recv} | वापसी: {ret}',
    'allTxn.finBilledRecv': 'बिल: {billed} | प्राप्त: {recv}',
    'allTxn.detailsUid': 'UID: {uid} | {method}',
    'allTxn.detailsNamed': '{name} ({category})',
    'allTxn.noRemarks': '-'
  },
  ur: {
    'nav.allTransactions': 'تمام لین دین کا منظر',
    'page.allTransactions.title': 'تمام لین دین کا منظر (ماسٹر آڈٹ)',
    'mobile.auditFilters': 'آڈٹ فلٹرز',
    'mobile.auditSummary': 'تاریخیں اور زمرہ سیٹ کرنے کے لیے ٹیپ کریں',
    'allTxn.transactionCategory': 'لین دین کا زمرہ',
    'allTxn.categoryAll': 'تمام زمرے (ڈیفالٹ)',
    'allTxn.catHR': 'ایچ آر لین دین',
    'allTxn.catSupplier': 'سپلائر لین دین',
    'allTxn.catCustomer': 'کسٹمر لین دین',
    'allTxn.catExpense': 'اخراجات کے لین دین',
    'allTxn.catCreditor': 'قرض دہندہ لین دین',
    'allTxn.catIncome': 'آمدنی کے لین دین',
    'allTxn.catInternal': 'اندرونی منتقلیاں',
    'allTxn.searchFilter': 'تلاش / ریکارڈز فلٹر کریں',
    'allTxn.colDate': 'تاریخ',
    'allTxn.colCategory': 'زمرہ',
    'allTxn.colDetails': 'لین دین کی تفصیل',
    'allTxn.colFinancial': 'مالی اثر',
    'allTxn.colRemarks': 'ریمارکس / بیان',
    'allTxn.colLoggedBy': 'درج کیا',
    'allTxn.colStamp': 'مہر',
    'allTxn.loadingToday': 'آج کے لین دین لوڈ ہو رہے ہیں...',
    'allTxn.aggregating': 'تمام ماڈیولز سے ادارے کے لاگ جمع ہو رہے ہیں... براہ کرم انتظار کریں۔',
    'allTxn.selectDates': 'تلاش کے لیے براہ کرم تاریخیں منتخب کریں۔',
    'allTxn.noResults': 'منتخب معیار کے لیے کوئی لین دین نہیں ملا۔',
    'allTxn.loadFailed': 'مجموعی لیجر ڈیٹا لوڈ کرنے میں ناکام۔',
    'allTxn.moduleHR': 'ایچ آر',
    'allTxn.moduleSupplier': 'سپلائر',
    'allTxn.moduleCustomer': 'کسٹمر',
    'allTxn.moduleExpense': 'اخراج',
    'allTxn.moduleCreditor': 'قرض دہندہ',
    'allTxn.moduleIncome': 'آمدنی',
    'allTxn.moduleInternal': 'اندرونی',
    'allTxn.finAmount': 'SAR {amount}',
    'allTxn.finSoldRecv': 'فروخت: {sold} | موصول: {recv}',
    'allTxn.cashHandover': 'مالک کو نقد حوالگی',
    'allTxn.finDepPaid': 'جمع: {dep} | ادا: {paid}',
    'allTxn.finRecvRet': 'موصول: {recv} | واپسی: {ret}',
    'allTxn.finBilledRecv': 'بل: {billed} | موصول: {recv}',
    'allTxn.detailsUid': 'UID: {uid} | {method}',
    'allTxn.detailsNamed': '{name} ({category})',
    'allTxn.noRemarks': '-'
  },
  es: {
    'nav.allTransactions': 'Vista de todas las transacciones',
    'page.allTransactions.title': 'Vista de todas las transacciones (Auditoría maestra)',
    'mobile.auditFilters': 'Filtros de auditoría',
    'mobile.auditSummary': 'Toque para establecer fechas y categoría',
    'allTxn.transactionCategory': 'Categoría de transacción',
    'allTxn.categoryAll': 'Todas las categorías (predeterminado)',
    'allTxn.catHR': 'Transacciones de RR. HH.',
    'allTxn.catSupplier': 'Transacciones de proveedor',
    'allTxn.catCustomer': 'Transacciones de cliente',
    'allTxn.catExpense': 'Transacciones de gastos',
    'allTxn.catCreditor': 'Transacciones de acreedor',
    'allTxn.catIncome': 'Transacciones de ingresos',
    'allTxn.catInternal': 'Transferencias internas',
    'allTxn.searchFilter': 'Buscar / Filtrar registros',
    'allTxn.colDate': 'Fecha',
    'allTxn.colCategory': 'Categoría',
    'allTxn.colDetails': 'Detalles de la transacción',
    'allTxn.colFinancial': 'Impacto financiero',
    'allTxn.colRemarks': 'Observaciones / Narrativa',
    'allTxn.colLoggedBy': 'Registrado por',
    'allTxn.colStamp': 'Marca de tiempo',
    'allTxn.loadingToday': 'Cargando transacciones de hoy...',
    'allTxn.aggregating': 'Agregando registros empresariales de todos los módulos... Espere.',
    'allTxn.selectDates': 'Seleccione fechas para buscar.',
    'allTxn.noResults': 'No se encontraron transacciones para los criterios seleccionados.',
    'allTxn.loadFailed': 'Error al cargar los datos del libro mayor agregado.',
    'allTxn.moduleHR': 'RR. HH.',
    'allTxn.moduleSupplier': 'Proveedor',
    'allTxn.moduleCustomer': 'Cliente',
    'allTxn.moduleExpense': 'Gasto',
    'allTxn.moduleCreditor': 'Acreedor',
    'allTxn.moduleIncome': 'Ingreso',
    'allTxn.moduleInternal': 'Interno',
    'allTxn.finAmount': 'SAR {amount}',
    'allTxn.finSoldRecv': 'Vendido: {sold} | Recibido: {recv}',
    'allTxn.cashHandover': 'Entrega de efectivo al propietario',
    'allTxn.finDepPaid': 'Depósito: {dep} | Pagado: {paid}',
    'allTxn.finRecvRet': 'Recibido: {recv} | Devuelto: {ret}',
    'allTxn.finBilledRecv': 'Facturado: {billed} | Recibido: {recv}',
    'allTxn.detailsUid': 'UID: {uid} | {method}',
    'allTxn.detailsNamed': '{name} ({category})',
    'allTxn.noRemarks': '-'
  }
};

['fr', 'hi', 'ur', 'es'].forEach((code) => {
  STRINGS[code] = { ...STRINGS.en, ...ALL_TXN_I18N[code] };
});

Object.entries(FORM_STRINGS).forEach(([lang, pack]) => {
  if (STRINGS[lang]) Object.assign(STRINGS[lang], pack);
  else STRINGS[lang] = { ...STRINGS.en, ...pack };
});

Object.entries(REPORT_STRINGS).forEach(([lang, pack]) => {
  if (STRINGS[lang]) Object.assign(STRINGS[lang], pack);
  else STRINGS[lang] = { ...STRINGS.en, ...pack };
});

let currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
const listeners = new Set();

export function getLanguage() {
  return currentLang;
}

export function getLanguageMeta(code = currentLang) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

export function t(key, vars = {}) {
  const pack = STRINGS[currentLang] || STRINGS.en;
  let text = pack[key] ?? STRINGS.en[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  });
  return text;
}

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key));
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(key));
  });
  document.title = t('app.title');
}

function applyDocumentLanguage() {
  const meta = getLanguageMeta();
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
  document.body.classList.toggle('erp-rtl', meta.dir === 'rtl');
}

export function setLanguage(code, { silent = false } = {}) {
  if (!LANGUAGES.some((l) => l.code === code)) code = DEFAULT_LANG;
  currentLang = code;
  localStorage.setItem(STORAGE_KEY, code);
  applyDocumentLanguage();
  applyTranslations(document);
  updateLanguageSwitcherUi();
  if (!silent) listeners.forEach((fn) => fn(code));
}

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function updateLanguageSwitcherUi() {
  const btn = document.getElementById('lang-switcher-btn');
  const menu = document.getElementById('lang-switcher-menu');
  const meta = getLanguageMeta();
  if (btn) {
    btn.setAttribute('aria-label', t('header.changeLanguage'));
    btn.title = `${meta.native} (${meta.label})`;
  }
  if (menu) {
    menu.querySelectorAll('[data-lang-option]').forEach((opt) => {
      const active = opt.dataset.langOption === currentLang;
      opt.classList.toggle('bg-blue-50', active);
      opt.classList.toggle('text-blue-700', active);
      opt.classList.toggle('font-bold', active);
    });
  }
}

export function initLanguageSwitcher(onChange) {
  applyDocumentLanguage();
  applyTranslations(document);
  updateLanguageSwitcherUi();

  const btn = document.getElementById('lang-switcher-btn');
  const menu = document.getElementById('lang-switcher-menu');
  if (!btn || !menu) return;

  if (menu.dataset.bound !== 'true') {
    menu.dataset.bound = 'true';
    menu.innerHTML = LANGUAGES.map((lang) => `
      <button type="button" data-lang-option="${lang.code}" class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition">
        <span class="text-base leading-none">${lang.flag}</span>
        <span class="min-w-0 flex-1 truncate">${lang.native}</span>
        <span class="text-[10px] text-gray-400 uppercase">${lang.code}</span>
      </button>
    `).join('');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });

    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('[data-lang-option]');
      if (!opt) return;
      const code = opt.dataset.langOption;
      if (code && code !== currentLang) setLanguage(code);
      menu.classList.add('hidden');
    });

    document.addEventListener('click', () => menu.classList.add('hidden'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') menu.classList.add('hidden');
    });
  }

  if (onChange) onLanguageChange(onChange);
}

export const ALL_TXN_MODULE_I18N = {
  HR: 'allTxn.moduleHR',
  Supplier: 'allTxn.moduleSupplier',
  Customer: 'allTxn.moduleCustomer',
  Expense: 'allTxn.moduleExpense',
  Creditor: 'allTxn.moduleCreditor',
  Income: 'allTxn.moduleIncome',
  Capital: 'allTxn.moduleCapital',
  Internal: 'allTxn.moduleInternal'
};

export function getAllTxnModuleLabel(code) {
  const key = ALL_TXN_MODULE_I18N[code];
  return key ? t(key) : code;
}

export const REPORT_OPTION_I18N = {
  daily_monthly: 'report.dailyMonthly',
  daily_cashflow: 'report.dailyCashflow',
  pnl: 'report.pnl',
  receivable_payable: 'report.receivablePayable',
  expense_report: 'report.expenseReport',
  customer_details: 'report.customerDetails',
  customer_due_balance: 'report.customerDueBalance',
  supplier_details: 'report.supplierDetails',
  hr_details: 'report.hrDetails',
  user_transaction: 'report.userPerformance',
  individual_user: 'report.individualUser',
  expense_details: 'report.expenseDetails',
  creditor_details: 'report.creditorDetails',
  income_details: 'report.incomeDetails',
  capital_details: 'report.capitalDetails',
  master_executive: 'report.masterExecutive'
};

export function translateReportSelect(typeSelect) {
  if (!typeSelect) return;
  Array.from(typeSelect.options).forEach((opt) => {
    const reportKey = opt.getAttribute('data-i18n-report');
    const plainKey = opt.getAttribute('data-i18n');
    if (reportKey) {
      opt.textContent = t(reportKey);
      return;
    }
    if (plainKey) {
      opt.textContent = t(plainKey);
      return;
    }
    if (!opt.value) {
      opt.textContent = t('common.chooseReport');
      return;
    }
    const key = REPORT_OPTION_I18N[opt.value];
    if (key) opt.textContent = t(key);
  });
}
