import { useEffect, useState } from 'react';
import { Button } from '@/components/base/buttons/button';
import { Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export interface BackupFile {
  id: string;
  name: string;
  createdTime?: string;
}

interface RestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestoreBackupModal({ isOpen, onClose }: RestoreBackupModalProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !window.googleDrive) return;
    setLoading(true);
    setError(null);
    window.googleDrive
      .listBackups()
      .then((res) => {
        if (res.success && res.files) {
          setFiles(res.files);
          if (res.files.length === 0) setError(t('No backups found in Google Drive.'));
        } else {
          setError(res.error || t('Failed to list backups.'));
        }
      })
      .catch(() => setError(t('Failed to list backups.')))
      .finally(() => setLoading(false));
  }, [isOpen, t]);

  const handleRestore = async (fileId: string) => {
    if (!window.googleDrive) return;
    setRestoringId(fileId);
    const res = await window.googleDrive.restore(fileId);
    setRestoringId(null);
    if (res.success) {
      toast.success(t('Restoring backup. The app will restart.'));
      onClose();
      // App will relaunch; no need to update UI
    } else {
      toast.error(res.error || t('Restore failed.'));
    }
  };

  const handleDelete = async (file: BackupFile) => {
    if (!window.googleDrive) return;
    setDeletingId(file.id);
    const res = await window.googleDrive.deleteBackup(file.id);
    setDeletingId(null);
    if (res.success) {
      setFiles((prev) => {
        const next = prev.filter((f) => f.id !== file.id);
        if (next.length === 0) setError(t('No backups found in Google Drive.'));
        return next;
      });
      toast.success(t('Backup deleted from Google Drive.'));
    } else {
      toast.error(res.error || t('Failed to delete backup.'));
    }
  };

  const formatDate = (createdTime?: string) => {
    if (!createdTime) return '';
    try {
      const d = new Date(createdTime);
      return d.toLocaleString();
    } catch {
      return createdTime;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div
        className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg relative"
        dir={i18n.dir()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isAr ? 'font-arabic text-start' : ''}`}>{t('Restore Backup')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label={t('Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className={`text-sm text-gray-600 dark:text-gray-400 mb-4 ${isAr ? 'font-arabic text-start' : ''}`}>
          {t('Select a backup from Google Drive to restore. The app will restart with the selected database.')}
        </p>
        {loading && <p className={`text-sm text-gray-500 py-4 ${isAr ? 'font-arabic text-start' : ''}`}>{t('Loading backups...')}</p>}
        {error && !loading && (
          <p className={`text-sm text-red-600 dark:text-red-400 py-2 ${isAr ? 'font-arabic text-start' : ''}`}>{error}</p>
        )}
        {!loading && !error && files.length > 0 && (
          <ul className="space-y-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  {f.createdTime && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatDate(f.createdTime)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    color="secondary"
                    onClick={() => handleDelete(f)}
                    isDisabled={restoringId !== null || deletingId !== null}
                    title={t('Delete backup from Google Drive')}
                  >
                    {deletingId === f.id ? t('Deleting...') : <Trash2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRestore(f.id)}
                    isDisabled={restoringId !== null || deletingId !== null}
                  >
                    {restoringId === f.id ? t('Restoring...') : t('Restore')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <Button color="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
