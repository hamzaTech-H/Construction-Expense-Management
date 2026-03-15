import { electron } from "node:process";
import { Payment, Settings, Contact } from "./types";
import { deleteExpenseCategory, getSettings } from "electron/database";


// Updated interface for database methods
export {};

// Extend CSS properties to include webkit-specific properties
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

declare global {
  interface Window {
    database: {
      // Settings
      getSettings: () => Promise<Settings[]>;
      updateSettings: (id: number, language: string, company_name: string|null, owner_first_name:string|null, owner_last_name:string|null, address: string|null, email: string|null, phone_number: string|null) => Promise<any>;
      // Projects
      getAllProjects: () => Promise<any[]>;
      getProjectById: (id: number) => Promise<any>;
      addProject: (name: string, date:string, client:string|undefined, budget:number|null, description: string) => Promise<number>;
      updateProject: (id: number, name: string, date:string, client:string|undefined, budget:number|null, description: string) => Promise<any>;
      deleteProject: (id: number) => Promise<any>;
      getProjectStats: (id: number) => Promise<any>;

      // Expense Categories
      addEXpenseCategory: (fr_name: string, ar_name: string) => Promise<number>;
      getAllExpenseCategories: () => Promise<any[]>;
      getExpenseCategoriesByProject: (projectId: number) => Promise<any[]>;
      deleteExpenseCategory: (id: number) => Promise<any>;

      // Expenses
      getExpensesByProject: (projectId: number) => Promise<any[]>;
      getExpenseById: (id: number) => Promise<any>;
      addExpense: (projectId: number, categoryId: number, description: string, date: string, amountTotal: number, isNotPaid: boolean) => Promise<Expense>;
      updateExpense: (id:number, categoryId: number, description:string, date: string, amountTotal: number) => Promise<any>;
      deleteExpense: (id: number) => Promise<any>;
      updateExpenseAmounts: (expenseId: number, amountPaid: number, remainingAmount: number, status: string) => Promise<any>;

      // Payments
      getPaymentsByExpense: (expenseId: number) => Promise<Payment[]>;
      addPayment: (expenseId: number, amount: number, date: string, note: string) => Promise<any>;
      updatePayment: (id: number, amount: number, date: string, note: string) => Promise<any>;
      deletePayment: (id: number) => Promise<any>;

      // Contacts
      getAllContacts: () => Promise<Contact[]>;
      addContact: (name: string, phone_number: string, role: string | null) => Promise<number>;
      updateContact: (id: number, name: string, phone_number: string, role: string | null) => Promise<any>;
      deleteContact: (id: number) => Promise<any>;
    };

    pdf: {
      print: (projectId: number) =>void;
      printPayments: (expenseId: number) =>void;
    };

    electronAPI: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      openExternal: (url: string) => Promise<void>;
    };

    googleDrive: {
      hasAuth: () => Promise<boolean>;
      connect: () => Promise<{ success: boolean; error?: string }>;
      disconnect: () => Promise<void>;
      backupNow: () => Promise<{ success: boolean; error?: string }>;
      listBackups: () => Promise<{ success: boolean; files?: { id: string; name: string; createdTime?: string }[]; error?: string }>;
      restore: (fileId: string) => Promise<{ success: boolean; error?: string }>;
      deleteBackup: (fileId: string) => Promise<{ success: boolean; error?: string }>;
    };
  }

}