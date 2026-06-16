import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Dev: load .env from project root (when running un-packaged)
config({ path: path.join(__dirname, '..', '.env') })

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { printProjectReport, printExpensePayments } from './printReports';
import {
  backupNow as gdBackupNow,
  listBackups,
  restoreFromBackup,
  deleteBackup,
  ensureAuth,
  hasStoredTokens,
  clearTokens,
} from './googleDrive';
import {
  initDatabase,
  getAllProjects, getProjectById, addProject, updateProject, deleteProject, getProjectStats,
  getExpensesByProject, getExpenseById, addExpense, updateExpense, deleteExpense, updateExpenseAmounts,
  getPaymentsByExpense, addPayment, deletePayment,
  updatePayment,
  getAllExpenseCategories,
  getExpenseCategoriesByProject,
  addEXpenseCategory,
  deleteExpenseCategory,
  getSettings,
  updateSettings,
  getAllContacts,
  addContact,
  updateContact,
  deleteContact,
} from './database';

process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    minWidth: 900,
    minHeight: 750,
    frame: false,
    autoHideMenuBar:true,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })
  
  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools();
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  try {
    // Production: prefer userData/.env (easy to update without reinstall),
    // fallback to packaged resources/.env (if shipped as extraResources).
    config({ path: path.join(app.getPath('userData'), '.env'), override: false })
    config({ path: path.join(process.resourcesPath, '.env'), override: false })
  } catch (_) {}
  initDatabase(app.getPath('userData'), app.getPath('exe'))
  createWindow()
})

// ===== SETTINGS =====
ipcMain.handle('get-settings', () => {
  return getSettings();
});

ipcMain.handle('update-settings', (_event, { id, language, company_name, owner_first_name, owner_last_name, address, email, phone_number }) => {
  return updateSettings(id, language, company_name, owner_first_name, owner_last_name, address, email, phone_number);
});

// ===== CONTACTS =====
ipcMain.handle('get-all-contacts', () => getAllContacts());
ipcMain.handle('add-contact', (_event, { name, phone_number, role }) => addContact(name, phone_number, role ?? null));
ipcMain.handle('update-contact', (_event, { id, name, phone_number, role }) => updateContact(id, name, phone_number, role ?? null));
ipcMain.handle('delete-contact', (_event, id: number) => deleteContact(id));

// ===== PROJECTS =====
ipcMain.handle('get-all-projects', () => {
  return getAllProjects();
});

ipcMain.handle('get-project-by-id', (_event, id) => {
  return getProjectById(id);
});

ipcMain.handle('add-project', (_event, { name, date, client, budget, description }) => {
  return addProject(name, date, client, budget, description);
});

ipcMain.handle('update-project', (_event, { id, name, date, client, budget, description }) => {
  return updateProject(id, name, date, client, budget, description);
});

ipcMain.handle('delete-project', (_event, id) => {
  return deleteProject(id);
});

ipcMain.handle('get-project-stats', (_event, id) => {
  return getProjectStats(id);
});

// ===== Expense Categories ======

ipcMain.handle('add-expense-category', (_event, { fr_name, ar_name }) => {
  return addEXpenseCategory(fr_name, ar_name);
});

ipcMain.handle('get-all-expense-categories', () => {
  return getAllExpenseCategories();
});

ipcMain.handle('get-expense-categories-by-project', (_event, projectId) => {
  return getExpenseCategoriesByProject(projectId);
});

ipcMain.handle("delete-expense-category", async (_, id: number) => {
  try {
    deleteExpenseCategory(id);
    return { success: true };
  } catch (error: any) {
    console.error("Delete category failed:", error);
    return { success: false, message: error.message };
  }
});


// ===== EXPENSES =====
ipcMain.handle('get-expenses-by-project', (_event, projectId) => {
  return getExpensesByProject(projectId);
});

ipcMain.handle('get-expense-by-id', (_event, id) => {
  return getExpenseById(id);
});

ipcMain.handle('add-expense', (_event, { projectId, categoryId, description, date, amountTotal, isNotPaid }) => {
  return addExpense(projectId, categoryId, description, date, amountTotal, isNotPaid);
});

ipcMain.handle('update-expense', (_event, { id, categoryId, description, date, amountTotal}) => {
  return updateExpense(id, categoryId, description, date, amountTotal);
});

ipcMain.handle('delete-expense', (_event, id) => {
  return deleteExpense(id);
});

ipcMain.handle('update-expense-amounts', (_event, { expenseId, amountPaid, remainingAmount, status }) => {
  return updateExpenseAmounts(expenseId, amountPaid, remainingAmount, status);
});

// ===== PAYMENTS =====
ipcMain.handle('get-payments-by-expense', (_event, expenseId) => {
  return getPaymentsByExpense(expenseId);
});

ipcMain.handle('add-payment', (_event, { expenseId, amount, date, note }) => {
  return addPayment(expenseId, amount, date, note);
});

ipcMain.handle('update-payment', (_event, { id, amount, date, note }) => {
  return updatePayment(id, amount, date, note);
});

ipcMain.handle('delete-payment', (_event, id) => {
  return deletePayment(id);
});

ipcMain.on('print-rapport', async (_event, projectId, categoryId, tabLabel) => {
  await printProjectReport(projectId, categoryId, tabLabel);
});

ipcMain.on('print-payments', async (_event, expenseId) => {
  await printExpensePayments(expenseId);
});

// ===== WINDOW CONTROLS =====
ipcMain.on('window-minimize', () => {
  if (win) {
    win.minimize();
  }
});

ipcMain.on('window-maximize', () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (win) {
    win.close();
  }
});

ipcMain.handle('open-external', (_event, url: string) => {
  if (typeof url === 'string' && url.startsWith('http')) {
    shell.openExternal(url);
  }
});

// ===== GOOGLE DRIVE BACKUP =====
ipcMain.handle('google-drive-has-auth', () => hasStoredTokens());

ipcMain.handle('google-drive-connect', async () => ensureAuth());

ipcMain.handle('google-drive-disconnect', () => {
  clearTokens();
});

ipcMain.handle('google-drive-backup-now', async () => {
  const auth = await ensureAuth();
  if (!auth.success) return auth;
  return gdBackupNow();
});

ipcMain.handle('google-drive-list-backups', async () => {
  const auth = await ensureAuth();
  if (!auth.success) return auth;
  return listBackups();
});

ipcMain.handle('google-drive-restore', async (_e, fileId: string) => {
  const auth = await ensureAuth();
  if (!auth.success) return auth;
  return restoreFromBackup(fileId);
});

ipcMain.handle('google-drive-delete-backup', async (_e, fileId: string) => {
  const auth = await ensureAuth();
  if (!auth.success) return auth;
  return deleteBackup(fileId);
});