import Database from 'better-sqlite3';
import path from 'path';
import { ExpenseStatus } from "../shared/expense";

// Ensure database file is stored properly
const dbPath = path.join(process.cwd(), 'database.db');

// Create connection
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// ✅ Create all necessary tables
db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date DATE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// db.prepare(`
//   CREATE TABLE IF NOT EXISTS invoices (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     project_id INTEGER NOT NULL,
//     name TEXT NOT NULL,
//     date TEXT NOT NULL,
//     project_amount DECIMAL(10,2) DEFAULT 0,
//     amount_paid DECIMAL(10,2) DEFAULT 0,
//     remaining_amount DECIMAL(10,2) DEFAULT 0,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
//   )
// `).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    amount_total DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_remaining DECIMAL(10,2) NOT NULL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE
  )
`).run();

// ===== PROJECTS =====
export function getAllProjects() {
  const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
  return stmt.all();
}

export function getProjectById(id: number) {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(id);
}

export function addProject(name: string, date: string, description: string) {
  const stmt = db.prepare('INSERT INTO projects (name, date, description) VALUES (?, ?, ?)');
  const result = stmt.run(name, date, description);
  return result.lastInsertRowid;
}

export function updateProject(id: number, name: string, date: string, description: string) {
  const stmt = db.prepare('UPDATE projects SET name = ?, date = ? ,description = ? WHERE id = ?');
  return stmt.run(name, date, description, id);
}

export function deleteProject(id: number) {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  return stmt.run(id);
}

export function getProjectStats(projectId: number) {
  const stmt = db.prepare(`
    SELECT 
      SUM(amount_total) AS total,
      SUM(amount_paid) AS paid,
      SUM(amount_remaining) AS remaining
    FROM expenses
    WHERE project_id = ?
  `);
    const result = stmt.get(projectId)
    return result;
}

// ===== INVOICES =====
// export function getInvoicesByProject(projectId: number) {
//   const stmt = db.prepare('SELECT * FROM invoices WHERE project_id = ? ORDER BY created_at DESC');
//   return stmt.all(projectId);
// }

// export function getInvoiceById(id: number) {
//   const stmt = db.prepare('SELECT * FROM invoices WHERE id = ?');
//   return stmt.get(id);
// }

// export function addInvoice(projectId: number, name: string, date: string) {
//   const stmt = db.prepare('INSERT INTO invoices (project_id, name, date) VALUES (?, ?, ?)');
//   const result = stmt.run(projectId, name, date);
//   return result.lastInsertRowid;
// }

// export function updateInvoice(id: number, name: string, date: string) {
//   const stmt = db.prepare('UPDATE invoices SET name = ?, date = ? WHERE id = ?');
//   return stmt.run(name, date, id);
// }

// export function deleteInvoice(id: number) {
//   const stmt = db.prepare('DELETE FROM invoices WHERE id = ?');
//   return stmt.run(id);
// }

// export function updateInvoiceAmounts(invoiceId: number, projectAmount: number, amountPaid: number, remainingAmount: number) {
//   const stmt = db.prepare('UPDATE invoices SET project_amount = ?, amount_paid = ?, remaining_amount = ? WHERE id = ?');
//   return stmt.run(projectAmount, amountPaid, remainingAmount, invoiceId);
// }

// ===== EXPENSES =====
export function getExpensesByProject(projectId: number) {
  const stmt = db.prepare('SELECT * FROM expenses WHERE project_id = ? ORDER BY created_at DESC');
  return stmt.all(projectId);
}

export function getExpenseById(id: number) {
  const stmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
  return stmt.get(id);
}

export function addExpense(projectId: number, description: string, date: string, amountTotal: number, isPaid: boolean) {
  let amountPaid = 0;
  let amountRemainig = 0;
  let status = ExpenseStatus.NOT_PAID

  if (isPaid) {
    amountPaid = amountTotal;
    status = ExpenseStatus.PAID;
  } else {
    amountRemainig = amountTotal;
  }
  
  const stmt = db.prepare('INSERT INTO expenses (project_id, description, date, amount_total, amount_paid, amount_remaining, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(projectId, description, date, amountTotal, amountPaid ,amountRemainig, status);
  return result.lastInsertRowid;
}

export function updateExpense(id: number, description: string, unitPrice: number, quantity: number) {
  const totalPrice = unitPrice * quantity;
  const stmt = db.prepare('UPDATE expenses SET description = ?, unit_price = ?, quantity = ?, total_price = ? WHERE id = ?');
  return stmt.run(description, unitPrice, quantity, totalPrice, id);
}

export function deleteExpense(id: number) {
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
  return stmt.run(id);
}

export function updateExpenseAmounts(expenseId: number, amountPaid: number, remainingAmount: number, status: string) {
  const stmt = db.prepare('UPDATE expenses SET amount_paid = ?, remaining_amount = ?, status = ? WHERE id = ?');
  return stmt.run(amountPaid, remainingAmount, status, expenseId);
}

// ===== PAYMENTS =====
export function getPaymentsByExpense(expenseId: number) {
  const stmt = db.prepare('SELECT * FROM payments WHERE expense_id = ? ORDER BY date DESC');
  return stmt.all(expenseId);
}

export function addPayment(expenseId: number, amount: number, date: string, note: string) {
  const stmt = db.prepare('INSERT INTO payments (expense_id, amount, date, note) VALUES (?, ?, ?, ?)');
  const result = stmt.run(expenseId, amount, date, note);
  return result.lastInsertRowid;
}

export function deletePayment(id: number) {
  const stmt = db.prepare('DELETE FROM payments WHERE id = ?');
  return stmt.run(id);
}

export default db;
