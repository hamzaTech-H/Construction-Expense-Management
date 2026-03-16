import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { google } from 'googleapis';
import Store from 'electron-store';
import { getDbPath, closeDatabase } from './database';

const BACKUP_FOLDER_NAME = 'MyApp Backups';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const REDIRECT_PORT = 35867;

interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

const store = new Store<{ googleDriveTokens: StoredTokens | null }>({
  defaults: { googleDriveTokens: null },
});

function getClientIds(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID ?? '';
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? '';
  return { clientId, clientSecret };
}

function getOAuth2Client(redirectUri: string) {
  const { clientId, clientSecret } = getClientIds();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getStoredTokens(): StoredTokens | null {
  const tokens = store.get('googleDriveTokens');
  if (tokens?.access_token && tokens?.refresh_token) return tokens;
  return null;
}

function setStoredTokens(tokens: StoredTokens): void {
  store.set('googleDriveTokens', tokens);
}

function clearStoredTokens(): void {
  store.set('googleDriveTokens', null);
}

/** Returns the OAuth URL to open in a browser. redirectUri must match the one used in Google Console (e.g. http://localhost:35867/callback). */
export function getAuthUrl(redirectUri: string): string {
  const oauth2Client = getOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

/** Exchange authorization code for tokens and store them. */
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<void> {
  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  const access_token = tokens.access_token;
  const refresh_token = tokens.refresh_token ?? undefined;
  const expiry_date = tokens.expiry_date ?? undefined;
  if (!access_token) throw new Error('No access token in response');
  setStoredTokens({ access_token, refresh_token, expiry_date });
}

/** Returns true if we have valid (or refreshable) tokens. */
export function hasStoredTokens(): boolean {
  return !!getStoredTokens();
}

/** Revoke and clear stored tokens. */
export function clearTokens(): void {
  clearStoredTokens();
}

async function getValidAccessToken(): Promise<string> {
  const stored = getStoredTokens();
  if (!stored) throw new Error('Not authenticated with Google Drive.');
  const redirectUri = `http://localhost:${REDIRECT_PORT}/callback`;
  const oauth2Client = getOAuth2Client(redirectUri);
  oauth2Client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date: stored.expiry_date,
  });
  const { credentials } = await oauth2Client.refreshAccessToken();
  const access_token = credentials.access_token;
  if (access_token) {
    setStoredTokens({
      access_token,
      refresh_token: credentials.refresh_token ?? stored.refresh_token,
      expiry_date: credentials.expiry_date ?? undefined,
    });
    return access_token;
  }
  throw new Error('Failed to refresh Google Drive token.');
}

async function getDriveClient() {
  const accessToken = await getValidAccessToken();
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

async function getOrCreateBackupFolderId(drive: ReturnType<typeof google.drive>) {
  const list = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder' and name='" + BACKUP_FOLDER_NAME + "' and trashed=false",
    fields: 'files(id, name)',
  });
  const files = list.data.files || [];
  if (files.length > 0) return files[0].id!;
  const folder = await drive.files.create({
    requestBody: { name: BACKUP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
  });
  return folder.data.id!;
}

function getBackupFileName(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `myapp-db-backup-${y}-${m}-${d}-${h}-${min}.db`;
}

/** Upload the local database to Google Drive. */
export async function backupNow(): Promise<{ success: boolean; error?: string }> {
  try {
    const drive = await getDriveClient();
    const folderId = await getOrCreateBackupFolderId(drive);
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      return { success: false, error: 'Database file not found.' };
    }
    const fileName = getBackupFileName();
    const media = {
      mimeType: 'application/x-sqlite3',
      body: fs.createReadStream(dbPath),
    };
    await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media,
      fields: 'id, name',
    });
    return { success: true };
  } catch (e: any) {
    console.error('Backup error:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

export interface BackupFile {
  id: string;
  name: string;
  createdTime?: string;
}

/** List backup files in the MyApp Backups folder. */
export async function listBackups(): Promise<{ success: boolean; files?: BackupFile[]; error?: string }> {
  try {
    const drive = await getDriveClient();
    const folderId = await getOrCreateBackupFolderId(drive);
    const list = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and name contains 'myapp-db-backup-' and name contains '.db'`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime)',
    });
    const files = (list.data.files || []).map((f) => ({
      id: f.id!,
      name: f.name!,
      createdTime: f.createdTime || undefined,
    }));
    return { success: true, files };
  } catch (e: any) {
    console.error('List backups error:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Delete a backup file from Google Drive. */
export async function deleteBackup(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const drive = await getDriveClient();
    await drive.files.delete({ fileId });
    return { success: true };
  } catch (e: any) {
    console.error('Delete backup error:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Download a backup file from Drive and replace the local database, then relaunch the app. */
export async function restoreFromBackup(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const drive = await getDriveClient();
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    const tempPath = path.join(dir, `restore-${Date.now()}.db`);
    const dest = fs.createWriteStream(tempPath);
    await new Promise<void>((resolve, reject) => {
      (res.data as any).pipe(dest);
      dest.on('finish', () => resolve());
      dest.on('error', reject);
      (res.data as any).on('error', reject);
    });
    closeDatabase();
    fs.copyFileSync(tempPath, dbPath);
    try { fs.unlinkSync(tempPath); } catch (_) {}
    setImmediate(() => {
      app.relaunch();
      app.quit();
    });
    return { success: true };
  } catch (e: any) {
    console.error('Restore error:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Start a local HTTP server to catch OAuth redirect and return the auth code. Returns promise + close so caller can cancel (e.g. when auth window is closed). */
function startLocalAuthServer(): { promise: Promise<string>; close: () => void } {
  let resolve: (value: string) => void;
  let reject: (reason: Error) => void;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url!, `http://localhost:${REDIRECT_PORT}`);
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        '<!DOCTYPE html><html><body><p>Authorization successful. You can close this window.</p></body></html>'
      );
      server.close();
      if (code) resolve(code);
      else reject(new Error('No code in callback'));
    }
  });
  server.listen(REDIRECT_PORT, '127.0.0.1');
  server.on('error', (err) => reject(err));
  const close = () => {
    server.close();
    reject(new Error('Auth window closed'));
  };
  return { promise, close };
}

/** Open a window for the user to complete Google sign-in; returns when we have the code. Rejects if user closes the window without completing. */
export async function openAuthWindowAndGetCode(): Promise<string> {
  const redirectUri = `http://localhost:${REDIRECT_PORT}/callback`;
  const authUrl = getAuthUrl(redirectUri);
  const { promise: codePromise, close: closeServer } = startLocalAuthServer();
  const authWindow = new BrowserWindow({
    width: 500,
    height: 650,
    show: true,
    webPreferences: { nodeIntegration: false },
  });
  authWindow.setMenu(null);
  authWindow.on('closed', () => {
    closeServer();
  });
  authWindow.loadURL(authUrl);
  const code = await codePromise;
  authWindow.close();
  return code;
}

/** Ensure we have valid tokens; opens auth window if not. Call before backup/list/restore. */
export async function ensureAuth(): Promise<{ success: boolean; error?: string }> {
  const { clientId } = getClientIds();
  if (!clientId) {
    return { success: false, error: 'Google Drive credentials not configured. Set GOOGLE_DRIVE_CLIENT_ID (and optionally GOOGLE_DRIVE_CLIENT_SECRET) in a .env file (project root or app user data folder) or in environment variables.' };
  }
  if (hasStoredTokens()) {
    try {
      await getValidAccessToken();
      return { success: true };
    } catch (_) {
      clearStoredTokens();
    }
  }
  try {
    const code = await openAuthWindowAndGetCode();
    const redirectUri = `http://localhost:${REDIRECT_PORT}/callback`;
    await exchangeCodeForTokens(code, redirectUri);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Authorization failed.' };
  }
}
