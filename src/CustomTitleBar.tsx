import { X, Minus, Maximize2, Settings, ArrowLeft, CloudUpload, CloudDownload } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { RestoreBackupModal } from './RestoreBackupModal';

interface CustomTitleBarProps {
  title?: string;
}

export function CustomTitleBar({ title = "Progest" }: CustomTitleBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleBackupNow = async () => {
    if (!window.googleDrive || backupLoading) return;
    setBackupLoading(true);
    try {
      const res = await window.googleDrive.backupNow();
      if (res.success) {
        toast.success(t('Backup uploaded to Google Drive.'));
      } else {
        toast.error(res.error || t('Backup failed.'));
      }
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreClick = () => {
    setRestoreModalOpen(true);
  };

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const handleSettings = () => {
    if (location.pathname !== '/settings') {
      navigate('/settings');
    }
  };

  const canGoBack = location.pathname !== '/';

  return (
    <div className="title-bar flex items-center justify-between bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-10 px-4 select-none" dir="ltr">
      {/* Left side - Draggable area with title and back button */}
      <div 
        className="flex items-center gap-3 flex-1 -ml-4 pl-4 cursor-move"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
          {title}
        </span>
        
        {/* Back button - only show when not on home page */}
        {canGoBack && (
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ml-2"
            title="Go Back"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Right side - Window controls and settings */}
      <div 
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Settings button */}
        <button
          onClick={handleSettings}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Google Drive Backup - only in Electron */}
        {typeof window !== 'undefined' && window.googleDrive && (
          <>
            <button
              onClick={handleBackupNow}
              disabled={backupLoading}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              title={t('Backup Now')}
            >
              <CloudUpload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleRestoreClick}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={t('Restore Backup')}
            >
              <CloudDownload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}

        {/* Window controls */}
        <button
          onClick={handleMinimize}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        <button
          onClick={handleMaximize}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Maximize"
        >
          <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-red-500 hover:text-white rounded transition-colors"
          title="Close"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <RestoreBackupModal isOpen={restoreModalOpen} onClose={() => setRestoreModalOpen(false)} />
    </div>
  );
}
