import { electron } from "node:process";
import { Payment } from "./types";

// Updated interface for database methods
export {};

declare global {
  interface Window {
    database: {
      // Projects
      getAllProjects: () => Promise<any[]>;
      getProjectById: (id: number) => Promise<any>;
      addProject: (name: string, date:string, description: string) => Promise<number>;
      updateProject: (id: number, name: string, date:string, description: string) => Promise<any>;
      deleteProject: (id: number) => Promise<any>;
      getProjectStats: (id: number) => Promise<any>;

      // Expenses
      getExpensesByProject: (projectId: number) => Promise<any[]>;
      getExpenseById: (id: number) => Promise<any>;
      addExpense: (projectId: number, description: string, date: string, amountTotal: number, isPaid: boolean) => Promise<Expense>;
      updateExpense: (id:number, description:string, date: string, amountTotal: number) => Promise<any>;
      deleteExpense: (id: number) => Promise<any>;
      updateExpenseAmounts: (expenseId: number, amountPaid: number, remainingAmount: number, status: string) => Promise<any>;

      // Payments
      getPaymentsByExpense: (expenseId: number) => Promise<Payment[]>;
      addPayment: (expenseId: number, amount: number, date: string, note: string) => Promise<any>;
      updatePayment: (id: number, amount: number, date: string, note: string) => Promise<any>;
      deletePayment: (id: number) => Promise<any>;
    };

    pdf: {
      print: (projectId: number) =>void;
      printPayments: (expenseId: number) =>void;
    };
  }

}