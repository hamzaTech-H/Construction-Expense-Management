import { ipcRenderer, contextBridge } from 'electron'

type DatabaseAPI = Window['database'];
type pdfAPI = Window['pdf'];

const database: DatabaseAPI = {
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
  getAllExpenseCategories: () => ipcRenderer.invoke('get-all-expense-categories'),
  getExpenseCategoriesByProject: (projectId) => ipcRenderer.invoke('get-expense-categories-by-project', projectId),

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