import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },


  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld('database', {
  // Projects
  getAllProjects: () => ipcRenderer.invoke('get-all-projects'),
  getProjectById: (id: number) => ipcRenderer.invoke('get-project-by-id', id),
  addProject: (name: string, date: string, description: string) => 
    ipcRenderer.invoke('add-project', { name, date, description }),
  updateProject: (id: number, name: string, date: string, description: string) => 
    ipcRenderer.invoke('update-project', { id, name, date, description }),
  deleteProject: (id: number) => ipcRenderer.invoke('delete-project', id),

  // Invoices
  getInvoicesByProject: (projectId: number) => ipcRenderer.invoke('get-invoices-by-project', projectId),
  getInvoiceById: (id: number) => ipcRenderer.invoke('get-invoice-by-id', id),
  addInvoice: (projectId: number, name: string, date: string) => 
    ipcRenderer.invoke('add-invoice', { projectId, name, date }),
  updateInvoice: (id: number, name: string, date: string) => 
    ipcRenderer.invoke('update-invoice', { id, name, date }),
  deleteInvoice: (id: number) => ipcRenderer.invoke('delete-invoice', id),
  updateInvoiceAmounts: (invoiceId: number, projectAmount: number, amountPaid: number, remainingAmount: number) => 
    ipcRenderer.invoke('update-invoice-amounts', { invoiceId, projectAmount, amountPaid, remainingAmount }),

  // Expenses
  getExpensesByInvoice: (invoiceId: number) => ipcRenderer.invoke('get-expenses-by-invoice', invoiceId),
  getExpenseById: (id: number) => ipcRenderer.invoke('get-expense-by-id', id),
  addExpense: (invoiceId: number, description: string, unitPrice: number, quantity: number) => 
    ipcRenderer.invoke('add-expense', { invoiceId, description, unitPrice, quantity }),
  updateExpense: (id: number, description: string, unitPrice: number, quantity: number) => 
    ipcRenderer.invoke('update-expense', { id, description, unitPrice, quantity }),
  deleteExpense: (id: number) => ipcRenderer.invoke('delete-expense', id),
  updateExpenseAmounts: (expenseId: number, amountPaid: number, remainingAmount: number, status: string) => 
    ipcRenderer.invoke('update-expense-amounts', { expenseId, amountPaid, remainingAmount, status }),

  // Payments
  getPaymentsByExpense: (expenseId: number) => ipcRenderer.invoke('get-payments-by-expense', expenseId),
  addPayment: (expenseId: number, amount: number, date: string, note: string) => 
    ipcRenderer.invoke('add-payment', { expenseId, amount, date, note }),
  deletePayment: (id: number) => ipcRenderer.invoke('delete-payment', id),
})
