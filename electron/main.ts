import { app, BrowserWindow, ipcMain} from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { 
  getAllProjects, getProjectById, addProject, updateProject, deleteProject, getProjectStats,
  getExpensesByProject, getExpenseById, addExpense, updateExpense, deleteExpense, updateExpenseAmounts,
  getPaymentsByExpense, addPayment, deletePayment
} from './database';

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
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

// ===== PROJECTS =====
ipcMain.handle('get-all-projects', () => {
  return getAllProjects();
});

ipcMain.handle('get-project-by-id', (_event, id) => {
  return getProjectById(id);
});

ipcMain.handle('add-project', (_event, { name, date, description }) => {
  return addProject(name, date, description);
});

ipcMain.handle('update-project', (_event, { id, name, date, description }) => {
  return updateProject(id, name, date, description);
});

ipcMain.handle('delete-project', (_event, id) => {
  return deleteProject(id);
});

ipcMain.handle('get-project-stats', (_event, id) => {
  return getProjectStats(id);
});

// ===== INVOICES =====
// ipcMain.handle('get-invoices-by-project', (_event, projectId) => {
//   return getInvoicesByProject(projectId);
// });

// ipcMain.handle('get-invoice-by-id', (_event, id) => {
//   return getInvoiceById(id);
// });

// ipcMain.handle('add-invoice', (_event, { projectId, name, date }) => {
//   return addInvoice(projectId, name, date);
// });

// ipcMain.handle('update-invoice', (_event, { id, name, date }) => {
//   return updateInvoice(id, name, date);
// });

// ipcMain.handle('delete-invoice', (_event, id) => {
//   return deleteInvoice(id);
// });

// ipcMain.handle('update-invoice-amounts', (_event, { invoiceId, projectAmount, amountPaid, remainingAmount }) => {
//   return updateInvoiceAmounts(invoiceId, projectAmount, amountPaid, remainingAmount);
// });

// ===== EXPENSES =====
ipcMain.handle('get-expenses-by-project', (_event, projectId) => {
  return getExpensesByProject(projectId);
});

ipcMain.handle('get-expense-by-id', (_event, id) => {
  return getExpenseById(id);
});

ipcMain.handle('add-expense', (_event, { projectId, description, date, amountTotal, isPaid }) => {
  return addExpense(projectId, description, date, amountTotal, isPaid);
});

ipcMain.handle('update-expense', (_event, { id, description, date, amountTotal}) => {
  return updateExpense(id, description, date, amountTotal);
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

ipcMain.handle('delete-payment', (_event, id) => {
  return deletePayment(id);
});