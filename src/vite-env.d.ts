/// <reference types="vite/client" />

declare global {
  interface Window {
    database: {
      // Projects
      getAllProjects: () => Promise<any[]>;
      getProjectById: (id: number) => Promise<any>;
      addProject: (name: string, clientName: string, description: string) => Promise<number>;
      updateProject: (id: number, name: string, clientName: string, description: string) => Promise<any>;
      deleteProject: (id: number) => Promise<any>;

      // Invoices
      getInvoicesByProject: (projectId: number) => Promise<any[]>;
      getInvoiceById: (id: number) => Promise<any>;
      addInvoice: (projectId: number, name: string, date: string) => Promise<number>;
      updateInvoice: (id: number, name: string, date: string) => Promise<any>;
      deleteInvoice: (id: number) => Promise<any>;
      updateInvoiceAmounts: (invoiceId: number, projectAmount: number, amountPaid: number, remainingAmount: number) => Promise<any>;

      // Expenses
      getExpensesByInvoice: (invoiceId: number) => Promise<any[]>;
      getExpenseById: (id: number) => Promise<any>;
      addExpense: (invoiceId: number, description: string, unitPrice: number, quantity: number) => Promise<number>;
      updateExpense: (id: number, description: string, unitPrice: number, quantity: number) => Promise<any>;
      deleteExpense: (id: number) => Promise<any>;
      updateExpenseAmounts: (expenseId: number, amountPaid: number, remainingAmount: number, status: string) => Promise<any>;

      // Payments
      getPaymentsByExpense: (expenseId: number) => Promise<any[]>;
      addPayment: (expenseId: number, amount: number, date: string, note: string) => Promise<number>;
      deletePayment: (id: number) => Promise<any>;
    };
  }
}