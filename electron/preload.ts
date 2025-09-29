import { ipcRenderer, contextBridge } from 'electron'

type DatabaseAPI = Window['database'];

const database: DatabaseAPI = {
  // Projects
  getAllProjects: () => ipcRenderer.invoke('get-all-projects'),
  getProjectById: (id) => ipcRenderer.invoke('get-project-by-id', id),
  addProject: (name, date, description) => 
    ipcRenderer.invoke('add-project', { name, date, description }),
  updateProject: (id, name, date, description) => 
    ipcRenderer.invoke('update-project', { id, name, date, description }),
  deleteProject: (id) => ipcRenderer.invoke('delete-project', id),

  // Invoices
  getInvoicesByProject: (projectId) => ipcRenderer.invoke('get-invoices-by-project', projectId),
  getInvoiceById: (id) => ipcRenderer.invoke('get-invoice-by-id', id),
  addInvoice: (projectId, name, date) => 
    ipcRenderer.invoke('add-invoice', { projectId, name, date }),
  updateInvoice: (id, name, date) => 
    ipcRenderer.invoke('update-invoice', { id, name, date }),
  deleteInvoice: (id) => ipcRenderer.invoke('delete-invoice', id),
  updateInvoiceAmounts: (invoiceId, projectAmount, amountPaid, remainingAmount) => 
    ipcRenderer.invoke('update-invoice-amounts', { invoiceId, projectAmount, amountPaid, remainingAmount }),

  // Expenses
  getExpensesByInvoice: (invoiceId) => ipcRenderer.invoke('get-expenses-by-invoice', invoiceId),
  getExpenseById: (id) => ipcRenderer.invoke('get-expense-by-id', id),
  addExpense: (invoiceId, description, unitPrice, quantity) => 
    ipcRenderer.invoke('add-expense', { invoiceId, description, unitPrice, quantity }),
  updateExpense: (id, description, unitPrice, quantity) => 
    ipcRenderer.invoke('update-expense', { id, description, unitPrice, quantity }),
  deleteExpense: (id) => ipcRenderer.invoke('delete-expense', id),
  updateExpenseAmounts: (expenseId, amountPaid, remainingAmount, status) => 
    ipcRenderer.invoke('update-expense-amounts', { expenseId, amountPaid, remainingAmount, status }),

  // Payments
  getPaymentsByExpense: (expenseId) => ipcRenderer.invoke('get-payments-by-expense', expenseId),
  addPayment: (expenseId, amount, date, note) => 
    ipcRenderer.invoke('add-payment', { expenseId, amount, date, note }),
  deletePayment: (id) => ipcRenderer.invoke('delete-payment', id),
}


contextBridge.exposeInMainWorld("database", database);