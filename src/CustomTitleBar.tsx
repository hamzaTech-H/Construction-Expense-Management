import { X, Minus, Maximize2, Settings, ArrowLeft, CloudUpload, CloudDownload, Cloud, CloudOff, Users, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionChecking, setConnectionChecking] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);

  const refreshConnection = useCallback(async () => {
    if (typeof window === 'undefined' || !window.googleDrive) return;
    setConnectionChecking(true);
    try {
      const connected = await window.googleDrive.hasAuth();
      setIsConnected(connected);
    } finally {
      setConnectionChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

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

  const handleConnect = async () => {
    if (!window.googleDrive || connectLoading) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast.error(t('No internet connection.'));
      return;
    }
    setConnectLoading(true);
    try {
      const res = await window.googleDrive.connect();
      if (res.success) {
        setIsConnected(true);
        toast.success(t('Connected to Google Drive.'));
      } else {
        toast.error(res.error ? t(res.error) : t('Failed to connect to Google Drive.'));
      }
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.googleDrive) return;
    await window.googleDrive.disconnect();
    setIsConnected(false);
    toast.success(t('Disconnected from Google Drive.'));
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

  const handleContacts = () => {
    if (location.pathname !== '/contacts') {
      navigate('/contacts');
    }
  };

  const handleHome = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const canGoBack = location.pathname !== '/';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft' && canGoBack) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const isTyping =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          (target as HTMLElement | null)?.isContentEditable;
        if (isTyping) return;

        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack]);

  return (
    <div className="title-bar flex items-center justify-between bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-10 px-4 select-none" dir="ltr">
      {/* Left side - Traffic lights + app name + navigation icons + draggable fill */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>

        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 ml-2">
          {title}
        </span>

        {/* Navigation icons */}
        <div className="flex items-center gap-0.5 ml-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={handleHome}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={t('Home')}
          >
            <Home className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={handleContacts}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={t('Contacts')}
          >
            <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          {typeof window !== 'undefined' && window.googleDrive && !connectionChecking && (
            <>
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={connectLoading}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                  title={t('Connect Google Drive')}
                >
                  <Cloud className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              ) : (
                <>
                  <button
                    onClick={handleBackupNow}
                    disabled={backupLoading}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                    title={t('Upload Backup')}
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
                  <button
                    onClick={handleDisconnect}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title={t('Disconnect Google Drive')}
                  >
                    <CloudOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </>
              )}
            </>
          )}
          <button
            onClick={handleSettings}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={t('Settings')}
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          {canGoBack && (
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={t('Go Back')}
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Draggable fill */}
        <div
          className="flex-1 min-w-0 cursor-move"
          style={{ WebkitAppRegion: 'drag' }}
        />
      </div>

      {/* Right side - Window controls only */}
      <div className="flex items-center gap-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={handleMinimize}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title={t('Minimize')}
        >
          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title={t('Maximize')}
        >
          <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-red-500 hover:text-white rounded transition-colors"
          title={t('Close')}
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <RestoreBackupModal isOpen={restoreModalOpen} onClose={() => setRestoreModalOpen(false)} />
    </div>
  );
}
