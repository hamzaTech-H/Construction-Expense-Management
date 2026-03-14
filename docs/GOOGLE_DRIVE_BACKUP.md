# Google Drive Backup Setup

The app can backup and restore the local SQLite database to/from a folder **MyApp Backups** in your Google Drive.

## 1. Create a Google Cloud project and OAuth client

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the **Google Drive API**: APIs & Services → Library → search "Google Drive API" → Enable.
4. Create OAuth credentials:
   - APIs & Services → Credentials → Create Credentials → **OAuth client ID**.
   - If prompted, configure the OAuth consent screen (User type: External is fine for personal use).
   - Application type: **Desktop app**.
   - Name it (e.g. "MyApp Backup").
   - After creation, add the following **Authorized redirect URI**:
     - `http://localhost:35867/callback`
   - Copy the **Client ID** and (if shown) **Client Secret**.

## 2. Configure the app

Create a `.env` file in the project root with:

```
GOOGLE_DRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
```

The app loads these when the Electron main process starts. Client Secret is optional for desktop apps.

## 3. Use Backup and Restore

- **Backup Now** (cloud upload icon in the header): uploads the current database to Google Drive with a timestamped name (e.g. `myapp-db-backup-2026-03-14-01-30.db`). The first time you use it, a browser window will open for Google sign-in.
- **Restore Backup** (cloud download icon): lists backups in **MyApp Backups**, lets you pick one, then replaces the local database and restarts the app.

Tokens are stored locally so you only need to sign in once.
