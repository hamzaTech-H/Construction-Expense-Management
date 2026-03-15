import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ExpenseStatus } from "../shared/expense";
import { ExpenseCategory, Payment } from '@/types';
import Decimal from 'decimal.js';

let db: Database.Database | null = null;
let _dbPath: string = path.join(process.cwd(), 'database.db');

function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

/** Returns the path to the SQLite database file (for backup/restore). */
export function getDbPath(): string {
  return _dbPath;
}

/** Closes the database connection. Call before replacing the DB file (e.g. restore). */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/** Optional: create a backup of the database before schema changes. */
function backupDatabase(dbPath: string): void {
  try {
    if (!fs.existsSync(dbPath)) return;
    const dir = path.dirname(dbPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(dir, `database.db.backup-${timestamp}`);
    fs.copyFileSync(dbPath, backupPath);
  } catch (e) {
    console.error('Database backup failed:', e);
  }
}

function tableExists(database: Database.Database, tableName: string): boolean {
  const row = database.prepare(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tableName);
  return !!row;
}

/** Ensure all tables and triggers exist; create any that are missing. Never drops or overwrites existing tables or data. */
function ensureSchema(database: Database.Database): void {
  const needsBackup = !tableExists(database, 'contacts');
  if (needsBackup) backupDatabase(_dbPath);

  database.prepare(`
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

  database.prepare(`
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
  const insert = database.prepare(`
    INSERT OR IGNORE INTO expense_categories (fr_name, ar_name)
    VALUES (@fr_name, @ar_name)
  `);
  const insertMany = database.transaction((categories: typeof predefinedCategories) => {
    for (const category of categories) insert.run(category);
  });
  insertMany(predefinedCategories);

  database.prepare(`
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

  database.prepare(`
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

  database.prepare(`
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

  database.prepare(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  database.prepare(`
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

  database.prepare(
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

  database.prepare(`
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
          WHERE expense_id = NEW.expense_id
        ),
        status = CASE
          WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE expense_id = NEW.expense_id) = 0 THEN '${ExpenseStatus.NOT_PAID}'
          WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE expense_id = NEW.expense_id) < amount_total THEN '${ExpenseStatus.PARTIALLY_PAID}'
          ELSE '${ExpenseStatus.PAID}'
        END
      WHERE id = NEW.expense_id;
    END;
  `).run();
}

/**
 * Initialize the database. Call once at app startup (e.g. in app.whenReady()).
 * - If database.db already exists in userDataPath, use it (never replace).
 * - If not in userDataPath, look for an existing database.db in exeDir or cwd and copy it to userDataPath once.
 * - Only if no existing DB is found anywhere, create a new one in userDataPath.
 * Then ensure all tables exist (CREATE TABLE IF NOT EXISTS); never drop or overwrite user data.
 */
export function initDatabase(userDataPath: string, exePath?: string): void {
  if (db) return;
  const targetPath = path.join(userDataPath, 'database.db');

  // 1) User already has a DB in userData -> always use it
  if (fs.existsSync(targetPath)) {
    _dbPath = targetPath;
    db = new Database(_dbPath);
    db.pragma('foreign_keys = ON');
    ensureSchema(db);
    return;
  }

  // 2) No DB in userData: look for existing DB from old install (exe dir, then cwd)
  const possiblePaths: string[] = [];
  if (exePath) {
    possiblePaths.push(path.join(path.dirname(exePath), 'database.db'));
  }
  possiblePaths.push(path.join(process.cwd(), 'database.db'));

  for (const sourcePath of possiblePaths) {
    if (fs.existsSync(sourcePath)) {
      try {
        fs.mkdirSync(userDataPath, { recursive: true });
        fs.copyFileSync(sourcePath, targetPath);
        _dbPath = targetPath;
        db = new Database(_dbPath);
        db.pragma('foreign_keys = ON');
        ensureSchema(db);
        return;
      } catch (e) {
        console.error('Migration of database to userData failed:', e);
      }
    }
  }

  // 3) No existing DB found: create new one in userData
  try {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  } catch (_) {}
  _dbPath = targetPath;
  db = new Database(_dbPath);
  db.pragma('foreign_keys = ON');
  ensureSchema(db);
}


// ===== SETTINGS =====

export function getSettings() {
  const stmt = getDb().prepare('SELECT * FROM settings');
  return stmt.all();
}

export function updateSettings(id: number, language: string, company_name: string, owner_first_name:string, owner_last_name:string, address: string, email: string, phone_number: string) {
  const stmt = getDb().prepare('UPDATE settings SET language = ?, company_name = ? , owner_first_name = ?, owner_last_name = ?, address = ?, email = ?, phone_number = ? WHERE id = ?');
  return stmt.run(language, company_name, owner_first_name, owner_last_name, address, email, phone_number, id);
}

// ===== CONTACTS =====

export function getAllContacts() {
  const stmt = getDb().prepare('SELECT * FROM contacts ORDER BY name COLLATE NOCASE');
  return stmt.all();
}

export function addContact(name: string, phone_number: string, role: string | null) {
  const stmt = getDb().prepare('INSERT INTO contacts (name, phone_number, role) VALUES (?, ?, ?)');
  const result = stmt.run(name, phone_number, role ?? null);
  return result.lastInsertRowid;
}

export function updateContact(id: number, name: string, phone_number: string, role: string | null) {
  const stmt = getDb().prepare('UPDATE contacts SET name = ?, phone_number = ?, role = ? WHERE id = ?');
  return stmt.run(name, phone_number, role ?? null, id);
}

export function deleteContact(id: number) {
  const stmt = getDb().prepare('DELETE FROM contacts WHERE id = ?');
  return stmt.run(id);
}

// ===== PROJECTS =====
export function getAllProjects() {
  const stmt = getDb().prepare(`
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
  const stmt = getDb().prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(id);
}

export function addProject(name: string, date: string, client:string, budget:number, description: string) {
  const stmt = getDb().prepare('INSERT INTO projects (name, date, client, budget, description) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(name, date, client, budget, description);
  return result.lastInsertRowid;
}

export function updateProject(id: number, name: string, date: string, client:string, budget:number, description: string) {
  const stmt = getDb().prepare('UPDATE projects SET name = ?, date = ? , client = ?, budget = ?, description = ? WHERE id = ?');
  return stmt.run(name, date, client, budget, description, id);
}

export function deleteProject(id: number) {
  const stmt = getDb().prepare('DELETE FROM projects WHERE id = ?');
  return stmt.run(id);
}

export function getProjectStats(projectId: number) {
  const stmt = getDb().prepare(`
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
  const stmt = getDb().prepare('INSERT INTO expense_categories (fr_name, ar_name) VALUES (?, ?)');
  const result = stmt.run(fr_name, ar_name);
  return result.lastInsertRowid;
}

export function getAllExpenseCategories() {
  const stmt = getDb().prepare('SELECT * FROM expense_categories');
  return stmt.all();
}

export function getExpenseCategoriesByProject(projectId: number) {
  const stmt = getDb().prepare(`
    SELECT expense_categories.id, expense_categories.fr_name, expense_categories.ar_name
    FROM expenses
    JOIN expense_categories ON expenses.category_id = expense_categories.id
    WHERE expenses.project_id = ?
    GROUP BY expense_categories.id, expense_categories.fr_name, expense_categories.ar_name`);
  return stmt.all(projectId);
}

export function deleteExpenseCategory(id: number) {
  const checkStmt = getDb().prepare('SELECT COUNT(*) AS count FROM expenses WHERE category_id = ?');
  const { count } = checkStmt.get(id) as { count: number };

  if (count > 0) {
    throw new Error('Cannot delete this category because it is used by one or more expenses');
  }

  const stmt = getDb().prepare('DELETE FROM expense_categories WHERE id = ?');
  return stmt.run(id);
}

// ===== EXPENSES =====
export function getExpensesByProject(projectId: number) {
  const stmt = getDb().prepare('SELECT * FROM expenses WHERE project_id = ? ORDER BY created_at DESC');
  return stmt.all(projectId);
}

export function getExpenseById(id: number) {
  const stmt = getDb().prepare('SELECT * FROM expenses WHERE id = ?');
  return stmt.get(id);
}

export function addExpense(projectId: number, categoryId: number, description: string, date: string, amountTotal: number, isNotPaid: boolean) {
  let amountPaid = 0;
  let amountRemaining = 0;
  let status = ExpenseStatus.NOT_PAID

  if (!isNotPaid) {
    amountPaid = amountTotal;
    status = ExpenseStatus.PAID;
  } else {
    amountRemaining = amountTotal;
  }
  
  const stmt = getDb().prepare('INSERT INTO expenses (project_id, category_id, description, date, amount_total, amount_paid, amount_remaining, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(projectId, categoryId, description, date, amountTotal, amountPaid ,amountRemaining, status);
  const expenseId = result.lastInsertRowid as number;

  if (!isNotPaid) {
    const today = new Date().toISOString().split('T')[0];
    const stmt = getDb().prepare('INSERT INTO payments (expense_id, amount, date, note) VALUES (?, ?, ?, ?)');
    stmt.run(expenseId, amountTotal, today, '');
  }

    const categoryStmt = getDb().prepare(`
    SELECT id, fr_name, ar_name
    FROM expense_categories
    WHERE id = ?
  `);
  const category = categoryStmt.get(categoryId) as ExpenseCategory | undefined ;

  // ✅ Return complete expense with category names
  return {
    id: expenseId,
    project_id: projectId,
    category_id: categoryId,
    category_fr_name: category?.fr_name ?? "",
    category_ar_name: category?.ar_name ?? "",
    description,
    date,
    amount_total: amountTotal,
    amount_paid: amountPaid,
    amount_remaining: amountRemaining,
    status,
  };
}

export function updateExpense(id: number, categoryId:number ,description: string, date: string, amountTotal: number) {
  let amountPaid = 0;
  let amountRemaining = 0;
  let status = ExpenseStatus.NOT_PAID

  const expense:any = getExpenseById(id);

  if (expense.status === ExpenseStatus.NOT_PAID) {
    amountPaid = 0;
    amountRemaining = new Decimal(amountTotal).toNumber();
    status = ExpenseStatus.NOT_PAID;
} else {
    const amountRemainingDecimal = new Decimal(expense.amount_remaining)
        .plus(new Decimal(amountTotal))
        .minus(new Decimal(expense.amount_total));

    amountPaid = expense.amount_paid;
    amountRemaining = amountRemainingDecimal.toNumber();

    status = new Decimal(amountTotal).equals(expense.amount_paid)
        ? ExpenseStatus.PAID
        : ExpenseStatus.PARTIALLY_PAID;
}
  const stmt = getDb().prepare('UPDATE expenses SET category_id = ?, description = ?, date = ?, amount_total = ?, amount_paid = ?, amount_remaining = ?, status = ? WHERE id = ?');
  stmt.run(categoryId, description, date, amountTotal, amountPaid, amountRemaining, status, id);

  const categoryStmt = getDb().prepare(`
    SELECT id, fr_name, ar_name
    FROM expense_categories
    WHERE id = ?
  `);
  
  const category = categoryStmt.get(categoryId) as ExpenseCategory | undefined ;

  return {
    id: id,
    category_id: categoryId,
    category_fr_name: category?.fr_name ?? "",
    category_ar_name: category?.ar_name ?? "",
    description,
    date,
    amount_total: amountTotal,
    amount_paid: amountPaid,
    amount_remaining: amountRemaining,
    status,
  };

}

export function deleteExpense(id: number) {
  const stmt = getDb().prepare('DELETE FROM expenses WHERE id = ?');
  return stmt.run(id);
}

export function updateExpenseAmounts(expenseId: number, amountPaid: number, remainingAmount: number, status: string) {
  const stmt = getDb().prepare('UPDATE expenses SET amount_paid = ?, amount_remaining = ?, status = ? WHERE id = ?');
  return stmt.run(amountPaid, remainingAmount, status, expenseId);
}

// ===== PAYMENTS =====
export function getPaymentsByExpense(expenseId: number) {
  const stmt = getDb().prepare('SELECT * FROM payments WHERE expense_id = ? ORDER BY date DESC');
  return stmt.all(expenseId)  as Payment[];;
}

export function addPayment(expenseId: number, amount: number, date: string, note: string) {
  const expense:any = getExpenseById(expenseId);
  let status;
  let newAmountPaid;


  if (amount === 0) throw new Error("The amount cannot be zero");
  
  if (amount < 0) {
    newAmountPaid = expense.amount_paid + amount;
    if (newAmountPaid < 0)
      throw new Error("The total paid amount cannot be less than zero");
    status =
      newAmountPaid === 0
        ? ExpenseStatus.NOT_PAID
        : ExpenseStatus.PARTIALLY_PAID;
  } else {
    newAmountPaid = expense.amount_paid + amount;
    if (newAmountPaid > expense.amount_total)
      throw new Error("The paid amount exceeds the total expense!");
  
    status =
      newAmountPaid === expense.amount_total
        ? ExpenseStatus.PAID
        : ExpenseStatus.PARTIALLY_PAID;
  }
 
  const stmt = getDb().prepare('INSERT INTO payments (expense_id, amount, date, note) VALUES (?, ?, ?, ?)');
  const result = stmt.run(expenseId, amount, date, note);
  const paymentId = result.lastInsertRowid;
  updateExpenseAmounts(expense.id, newAmountPaid, expense.amount_total - newAmountPaid, status)
  return { paymentId, newAmountPaid, remaining: expense.amount_total - newAmountPaid, status };
}

export function updatePayment(id: number, amount: number, date: string, note: string) { // i am using triggers to update expense
  if (amount === 0) throw new Error("The amount cannot be zero");

  const payment: any = getDb().prepare('SELECT * FROM payments WHERE id = ?').get(id);

  const expense:any = getExpenseById(payment.expense_id);

  const difference = amount - payment.amount;

  if (amount < 0 && expense.amount_paid + difference < 0) {
    throw new Error("The total paid amount cannot be less than zero");
  }

  if (difference > 0 && expense.amount_paid + difference > expense.amount_total) {
    throw new Error("The paid amount exceeds the total expense!");
  }

  const stmt = getDb().prepare(`UPDATE payments SET amount = ?, date = ?, note = ? WHERE id = ?`);
  stmt.run(amount, date, note, id);

  const updatedExpense = getExpenseById(payment.expense_id);
  return updatedExpense;
}


export function deletePayment(id: number) {
  const payment:any = getDb().prepare('SELECT expense_id FROM payments WHERE id = ?').get(id);

  const deleteStmt = getDb().prepare('DELETE FROM payments WHERE id = ?');
  deleteStmt.run(id);

  const updatedExpense = getExpenseById(payment.expense_id)

  return updatedExpense;
}

export { getDb };
