# Updating the app via USB (preserving user data)

This guide explains how to deliver a new version of the app to your client via USB so that **the existing database and user settings are kept**.

## How the app stores data

- **Database** (`database.db`) is stored in the **user data folder**, not next to the app executable:
  - **Windows**: `%APPDATA%\<app name>\database.db` (e.g. `C:\Users\<user>\AppData\Roaming\Progest\database.db`)
  - **macOS**: `~/Library/Application Support/<app name>/database.db`
  - **Linux**: `~/.config/<app name>/database.db`

- **Google Drive tokens** (if the user connected Google Drive) are also in the user data folder (via `electron-store`).

Because the database and settings live in user data, **replacing the app folder or the installer does not delete them**.

## On first launch after an update

1. **The app never replaces the user's database.** It decides which file to use:
   - If `database.db` already exists in the **user data** folder → use it.
   - If not, it looks for an existing `database.db` next to the app executable or in the current working directory. If found, it **copies** it once to user data and then uses that copy.
   - Only if no existing database is found anywhere does it create a **new** empty one in user data.
2. It then ensures all required tables exist: **CREATE TABLE IF NOT EXISTS** for each table. Missing tables (e.g. `contacts` in an old version) are created; existing tables and all their data are left unchanged.
3. **Optionally**, before adding any new table, it creates a backup: `database.db.backup-<timestamp>` in the same folder.
4. UI and code changes apply; user data (projects, expenses, contacts, settings) is preserved.

## Step-by-step: delivering an update via USB

### 1. Build the new version

```bash
npm run build
# Package the app (e.g. with electron-builder)
npm run build:win   # or your packaging script
```

### 2. Prepare the USB

- Copy the **new** app package (e.g. the built `.exe` + folder, or the installer) onto the USB.
- Do **not** include or overwrite any `database.db` from the client’s machine.

### 3. On the client machine

**Option A – Installer (recommended)**

1. Close the app completely.
2. Run the **new** installer from the USB.
3. Install to the **same** location as before (or the desired location).
4. The installer should **not** remove the user data folder (it is under `%APPDATA%`, not in the install directory). Standard Electron/electron-builder installers do not delete user data.
5. Launch the app. It will use the existing database and settings; new tables are added automatically if needed.

**Option B – Replace app folder (no installer)**

1. Close the app completely.
2. Copy the **new** app files from the USB over the existing installation folder (replace `.exe`, `resources`, etc.).
3. **Do not** delete the whole folder and then paste: that can remove a `database.db` if it was ever stored there. Prefer overwriting files/folders.
4. Since the app now uses the **user data** folder for the database, even if the old install had `database.db` next to the exe, the first run after update will **copy** that file into user data (one-time migration). So the data is preserved.
5. Launch the app.

### 4. If the client had the very old version (database next to the exe)

- On **first launch** after update, the app looks for `database.db` in the **current working directory** (old location). If it finds it and there is no database yet in the user data folder, it **copies** it to user data.
- After that, the app always uses the user data copy. The old file next to the exe is no longer used and can be deleted by the user if they want.

## Ensuring the installer does not delete user data

- Use a standard Electron/electron-builder (or similar) setup.
- **Do not** add custom install or uninstall steps that delete `%APPDATA%\<app name>` (or the equivalent on macOS/Linux).
- The default behavior of Electron is to keep the user data directory across updates and uninstalls unless you explicitly remove it.

## Optional: backup before schema changes

The app can create a one-off backup of the database before adding new tables:

- In `electron/database.ts`, `ensureSchema()` checks if the `contacts` table (or another “new” table) is missing. If it is, it copies `database.db` to `database.db.backup-<timestamp>` in the same directory before running any new `CREATE TABLE`.
- Backups are stored in the user data folder next to `database.db`. The client (or you) can delete old backups to save space.

## Summary

| Requirement | How it’s done |
|------------|----------------|
| New table on first launch | `ensureSchema()` runs on every startup; `CREATE TABLE IF NOT EXISTS` for all tables (and triggers). |
| UI improvements without touching data | Only code and assets are updated; DB path and content are unchanged. |
| Optional backup before schema change | If a “new” table is missing, `backupDatabase()` copies `database.db` to `database.db.backup-<timestamp>`. |
| Installer does not delete DB/settings | Database and settings live in user data (`app.getPath('userData')`); installer only replaces app files. |
| Update via USB | Copy new build/installer to USB; client runs installer or overwrites app folder; they do not delete user data. |
