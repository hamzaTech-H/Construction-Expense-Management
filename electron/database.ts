import Database from 'better-sqlite3';
import path from 'path';
import { ExpenseStatus } from "../shared/expense";
import { Payment } from '@/types';
import Decimal from 'decimal.js';

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
    client TEXT NULL,
    budget INTEGER NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fr_name TEXT NOT NULL UNIQUE,
    ar_name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

const predefinedCategories = [
  { fr_name: 'Employés', ar_name: 'العمال' },    
  { fr_name: 'Marchandises', ar_name: 'السلع' },  
  { fr_name: 'Autres', ar_name: 'أخرى' },
];

// insert only if not exists
const insert = db.prepare(`
  INSERT OR IGNORE INTO expense_categories (fr_name, ar_name)
  VALUES (@fr_name, @ar_name)
`);

const insertMany = db.transaction((categories) => {
  for (const category of categories) insert.run(category);
});

insertMany(predefinedCategories);

db.prepare(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    amount_total DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_remaining DECIMAL(10,2) NOT NULL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES expense_categories (id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language TEXT NOT NULL,
    company_name TEXT,
    owner_first_name TEXT,
    owner_last_name TEXT,
    address TEXT,
    email TEXT,
    phone_number TEXT
  )
`).run();

db.prepare(`
  INSERT OR IGNORE INTO settings (
    id,
    language,
    company_name,
    owner_first_name,
    owner_last_name,
    address,
    email,
    phone_number
  ) VALUES (
    1,
    'fr',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
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

db.prepare(
  `CREATE TRIGGER IF NOT EXISTS update_expense_after_payment_delete
  AFTER DELETE ON payments
  BEGIN
    UPDATE expenses
    SET 
      amount_paid = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE expense_id = OLD.expense_id
      ),
       amount_remaining = amount_total - (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE expense_id = OLD.expense_id
      ),
      status = CASE
        WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE expense_id = OLD.expense_id) = 0 THEN '${ExpenseStatus.NOT_PAID}'
        ELSE '${ExpenseStatus.PARTIALLY_PAID}'
      END
    WHERE id = OLD.expense_id;
  END;`
).run();

db.prepare(`
  CREATE TRIGGER IF NOT EXISTS update_expense_after_payment_update
  AFTER UPDATE ON payments
  BEGIN
    UPDATE expenses
    SET 
      amount_paid = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE expense_id = NEW.expense_id
      ),
       amount_remaining = amount_total - (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE expense_id = OLD.expense_id
      ),
      status = CASE
        WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE expense_id = NEW.expense_id) = 0 THEN '${ExpenseStatus.NOT_PAID}'
        WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE expense_id = NEW.expense_id) < amount_total THEN '${ExpenseStatus.PARTIALLY_PAID}'
        ELSE '${ExpenseStatus.PAID}'
      END
    WHERE id = NEW.expense_id;
  END;

`).run();


// ===== SETTINGS =====

export function getSettings() {
  const stmt = db.prepare('SELECT * FROM settings');
  return stmt.all();
}

export function updateSettings(id: number, language: string, company_name: string, owner_first_name:string, owner_last_name:string, address: string, email: string, phone_number: string) {
  const stmt = db.prepare('UPDATE settings SET language = ?, company_name = ? , owner_first_name = ?, owner_last_name = ?, address = ?, email = ?, phone_number = ? WHERE id = ?');
  return stmt.run(language, company_name, owner_first_name, owner_last_name, address, email, phone_number, id);
}

// ===== PROJECTS =====
export function getAllProjects() {
  const stmt = db.prepare(`
    SELECT 
      p.*, 
      IFNULL(SUM(e.amount_total), 0) AS total_spent
    FROM projects p
    LEFT JOIN expenses e ON e.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  return stmt.all();
}

export function getProjectById(id: number) {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(id);
}

export function addProject(name: string, date: string, client:string, budget:number, description: string) {
  const stmt = db.prepare('INSERT INTO projects (name, date, client, budget, description) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(name, date, client, budget, description);
  return result.lastInsertRowid;
}

export function updateProject(id: number, name: string, date: string, client:string, budget:number, description: string) {
  const stmt = db.prepare('UPDATE projects SET name = ?, date = ? , client = ?, budget = ?, description = ? WHERE id = ?');
  return stmt.run(name, date, client, budget, description, id);
}

export function deleteProject(id: number) {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  return stmt.run(id);
}

export function getProjectStats(projectId: number) {
  const stmt = db.prepare(`
    SELECT 
      ROUND(IFNULL(SUM(amount_total), 0), 2) AS total,
      ROUND(IFNULL(SUM(amount_paid), 0), 2) AS paid,
      ROUND(IFNULL(SUM(amount_remaining), 0), 2) AS remaining
    FROM expenses
    WHERE project_id = ?
  `);

  const result = stmt.get(projectId);
  return result;
}

// ===== EXPENSE CATEGORIES =====

export function addEXpenseCategory(fr_name: string, ar_name: string) {
  const stmt = db.prepare('INSERT INTO expense_categories (fr_name, ar_name) VALUES (?, ?)');
  const result = stmt.run(fr_name, ar_name);
  return result.lastInsertRowid;
}

export function getAllExpenseCategories() {
  const stmt = db.prepare('SELECT * FROM expense_categories');
  return stmt.all();
}

export function getExpenseCategoriesByProject(projectId: number) {
  const stmt = db.prepare(`
    SELECT expense_categories.id, expense_categories.fr_name, expense_categories.ar_name
    FROM expenses
    JOIN expense_categories ON expenses.category_id = expense_categories.id
    WHERE expenses.project_id = ?
    GROUP BY expense_categories.id, expense_categories.fr_name, expense_categories.ar_name`);
  return stmt.all(projectId);
}

export function deleteExpenseCategory(id: number) {
  const stmt = db.prepare('DELETE FROM expense_categories WHERE id = ?');
  return stmt.run(id);
}

// ===== EXPENSES =====
export function getExpensesByProject(projectId: number) {
  const stmt = db.prepare('SELECT * FROM expenses WHERE project_id = ? ORDER BY created_at DESC');
  return stmt.all(projectId);
}

export function getExpenseById(id: number) {
  const stmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
  return stmt.get(id);
}

export function addExpense(projectId: number, categoryId: number, description: string, date: string, amountTotal: number, isNotPaid: boolean) {
  let amountPaid = 0;
  let amountRemainig = 0;
  let status = ExpenseStatus.NOT_PAID

  if (!isNotPaid) {
    amountPaid = amountTotal;
    status = ExpenseStatus.PAID;
  } else {
    amountRemainig = amountTotal;
  }
  
  const stmt = db.prepare('INSERT INTO expenses (project_id, category_id, description, date, amount_total, amount_paid, amount_remaining, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(projectId, categoryId, description, date, amountTotal, amountPaid ,amountRemainig, status);
  const createdExpense = {
    id: result.lastInsertRowid as number,
    category_id: categoryId,
    description,
    date,
    amount_total: amountTotal,
    amount_paid: amountPaid,
    amount_remaining: amountRemainig,
    status
  };

  if (!isNotPaid) {
    const today = new Date().toISOString().split('T')[0];
    const stmt = db.prepare('INSERT INTO payments (expense_id, amount, date, note) VALUES (?, ?, ?, ?)');
    stmt.run(createdExpense.id, amountTotal, today, '');
  }

  return createdExpense;
}

export function updateExpense(id: number, categoryId:number ,description: string, date: string, amountTotal: number) {
  let amountPaid = 0;
  let amountRemainig = 0;
  let status = ExpenseStatus.NOT_PAID

  const expense:any = getExpenseById(id);

  if (expense.status === ExpenseStatus.NOT_PAID) {
    amountPaid = 0;
    amountRemainig = new Decimal(amountTotal).toNumber();
    status = ExpenseStatus.NOT_PAID;
} else {
    const amountRemainingDecimal = new Decimal(expense.amount_remaining)
        .plus(new Decimal(amountTotal))
        .minus(new Decimal(expense.amount_total));

    amountPaid = expense.amount_paid;
    amountRemainig = amountRemainingDecimal.toNumber();

    status = new Decimal(amountTotal).equals(expense.amount_paid)
        ? ExpenseStatus.PAID
        : ExpenseStatus.PARTIALLY_PAID;
}
  const stmt = db.prepare('UPDATE expenses SET category_id = ?, description = ?, date = ?, amount_total = ?, amount_paid = ?, amount_remaining = ?, status = ? WHERE id = ?');
  stmt.run(categoryId, description, date, amountTotal, amountPaid, amountRemainig, status, id);
  const updatedExpense = {
    id: id,
    category_id: categoryId,
    description,
    date,
    amount_total: amountTotal,
    amount_paid: amountPaid,
    amount_remaining: amountRemainig,
    status
  };

  return updatedExpense;
}

export function deleteExpense(id: number) {
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
  return stmt.run(id);
}

export function updateExpenseAmounts(expenseId: number, amountPaid: number, remainingAmount: number, status: string) {
  const stmt = db.prepare('UPDATE expenses SET amount_paid = ?, amount_remaining = ?, status = ? WHERE id = ?');
  return stmt.run(amountPaid, remainingAmount, status, expenseId);
}

// ===== PAYMENTS =====
export function getPaymentsByExpense(expenseId: number) {
  const stmt = db.prepare('SELECT * FROM payments WHERE expense_id = ? ORDER BY date DESC');
  return stmt.all(expenseId)  as Payment[];;
}

export function addPayment(expenseId: number, amount: number, date: string, note: string) {
  const expense:any = getExpenseById(expenseId);

  if (amount <= 0) throw new Error("Le montant doit être supérieur à 0");
  
  const newAmountPaid = expense.amount_paid + amount;
  if (newAmountPaid > expense.amount_total)
    throw new Error("Le montant payé dépasse le total de la dépense !");
  
  const status =
    newAmountPaid === expense.amount_total
      ? ExpenseStatus.PAID
      : ExpenseStatus.PARTIALLY_PAID;

  const stmt = db.prepare('INSERT INTO payments (expense_id, amount, date, note) VALUES (?, ?, ?, ?)');
  const result = stmt.run(expenseId, amount, date, note);
  const paymentId = result.lastInsertRowid;
  updateExpenseAmounts(expense.id, newAmountPaid, expense.amount_total - newAmountPaid, status)
  return { paymentId, newAmountPaid, remaining: expense.amount_total - newAmountPaid, status };
}

export function updatePayment(id: number, amount: number, date: string, note: string) {
  if (amount <= 0) throw new Error("Le montant doit être supérieur à 0");

  const payment: any = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);

  const expense:any = getExpenseById(payment.expense_id);

  const difference = amount - payment.amount;

  if (difference > 0 && expense.amount_paid + difference > expense.amount_total) {
    throw new Error("Le montant payé dépasse le total de la dépense !");
  }

  const stmt = db.prepare(`UPDATE payments SET amount = ?, date = ?, note = ? WHERE id = ?`);
  stmt.run(amount, date, note, id);

  const updatedExpense = getExpenseById(payment.expense_id);
  return updatedExpense;
}


export function deletePayment(id: number) {
  const payment:any = db.prepare('SELECT expense_id FROM payments WHERE id = ?').get(id);

  const deleteStmt = db.prepare('DELETE FROM payments WHERE id = ?');
  deleteStmt.run(id);

  const updatedExpense = getExpenseById(payment.expense_id)

  return updatedExpense;
}

export default db;
