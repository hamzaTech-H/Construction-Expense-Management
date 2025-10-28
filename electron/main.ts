import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import { printProjectReport, printExpensePayments } from './printReports';
import path from 'node:path'
import { 
  getAllProjects, getProjectById, addProject, updateProject, deleteProject, getProjectStats,
  getExpensesByProject, getExpenseById, addExpense, updateExpense, deleteExpense, updateExpenseAmounts,
  getPaymentsByExpense, addPayment, deletePayment,
  updatePayment,
  getAllExpenseCategories,
  getExpenseCategoriesByProject,
  addEXpenseCategory,
  deleteExpenseCategory,
  getSettings,
  updateSettings
} from './database';

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

app.whenReady().then(createWindow)

// ===== SETTINGS =====
ipcMain.handle('get-settings', () => {
  return getSettings();
});

ipcMain.handle('update-settings', (_event, { id, language, company_name, owner_first_name, owner_last_name, address, email, phone_number }) => {
  return updateSettings(id, language, company_name, owner_first_name, owner_last_name, address, email, phone_number);
});

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

ipcMain.handle('delete-expense-category', (_event, id) => {
  return deleteExpenseCategory(id);
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

ipcMain.on('print-rapport', async (_event, projectId) => {
  await printProjectReport(projectId);
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