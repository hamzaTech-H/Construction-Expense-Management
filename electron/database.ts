import Database from 'better-sqlite3';
import path from 'path';

// Ensure database file is stored properly
const dbPath = path.join(process.cwd(), 'database.db');

// Create connection
const db = new Database(dbPath);

// ✅ Create table if it doesn’t exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  )
`).run();

// Function to get a user
export function getUser(id: number) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) || null; // return null if not found
}

// Function to add a user
export function addUser(name: string, email: string) {
  const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  const result = stmt.run(name, email);
  return result.lastInsertRowid; // return the new user’s ID
}

export default db;
