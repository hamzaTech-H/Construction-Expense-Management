import { ipcRenderer, contextBridge } from 'electron'

type DatabaseAPI = Window['database'];
type pdfAPI = Window['pdf'];

const database: DatabaseAPI = {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (id, language, company_name, owner_first_name, owner_last_name, address, email, phone_number) => 
    ipcRenderer.invoke('update-settings', { id, language, company_name, owner_first_name, owner_last_name, address, email, phone_number }),
  // Projects
  getAllProjects: () => ipcRenderer.invoke('get-all-projects'),
  getProjectById: (id) => ipcRenderer.invoke('get-project-by-id', id),
  addProject: (name, date, client, budget, description) => 
    ipcRenderer.invoke('add-project', { name, date, client, budget, description }),
  updateProject: (id, name, date, client, budget, description) => 
    ipcRenderer.invoke('update-project', { id, name, date, client, budget, description }),
  deleteProject: (id) => ipcRenderer.invoke('delete-project', id),
  getProjectStats: (id) => ipcRenderer.invoke('get-project-stats', id),

  // Expense Categories
  addEXpenseCategory: (fr_name, ar_name) => ipcRenderer.invoke('add-expense-category', { fr_name, ar_name}),
  getAllExpenseCategories: () => ipcRenderer.invoke('get-all-expense-categories'),
  getExpenseCategoriesByProject: (projectId) => ipcRenderer.invoke('get-expense-categories-by-project', projectId),
  deleteExpenseCategory: (id) => ipcRenderer.invoke('delete-expense-category', id),

  // Expenses
  getExpensesByProject: (projectId) => ipcRenderer.invoke('get-expenses-by-project', projectId),
  getExpenseById: (id) => ipcRenderer.invoke('get-expense-by-id', id),
  addExpense: (projectId, categoryId, description, date, amountTotal, isNotPaid) => 
    ipcRenderer.invoke('add-expense', { projectId, categoryId, description, date, amountTotal, isNotPaid }),
  updateExpense: (id, categoryId, description, date, amountTotal) => 
    ipcRenderer.invoke('update-expense', { id, categoryId, description, date, amountTotal }),
  deleteExpense: (id) => ipcRenderer.invoke('delete-expense', id),
  updateExpenseAmounts: (expenseId, amountPaid, remainingAmount, status) => 
    ipcRenderer.invoke('update-expense-amounts', { expenseId, amountPaid, remainingAmount, status }),

  // Payments
  getPaymentsByExpense: (expenseId) => ipcRenderer.invoke('get-payments-by-expense', expenseId),
  addPayment: (expenseId, amount, date, note) => 
    ipcRenderer.invoke('add-payment', { expenseId, amount, date, note }),
  updatePayment: (id, amount, date, note) => 
    ipcRenderer.invoke('update-payment', { id, amount, date, note }),
  deletePayment: (id) => ipcRenderer.invoke('delete-payment', id),
}


contextBridge.exposeInMainWorld("database", database);


const pdf: pdfAPI = {
  print: (projectId) => ipcRenderer.send('print-rapport', projectId),
  printPayments: (expenseId) => ipcRenderer.send('print-payments', expenseId),
}

contextBridge.exposeInMainWorld("pdf", pdf);

// Window controls API
const electronAPI = {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
}

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// Google Drive backup API
const googleDrive = {
  hasAuth: () => ipcRenderer.invoke('google-drive-has-auth'),
  connect: () => ipcRenderer.invoke('google-drive-connect'),
  disconnect: () => ipcRenderer.invoke('google-drive-disconnect'),
  backupNow: () => ipcRenderer.invoke('google-drive-backup-now'),
  listBackups: () => ipcRenderer.invoke('google-drive-list-backups'),
  restore: (fileId: string) => ipcRenderer.invoke('google-drive-restore', fileId),
  deleteBackup: (fileId: string) => ipcRenderer.invoke('google-drive-delete-backup', fileId),
};

contextBridge.exposeInMainWorld("googleDrive", googleDrive);