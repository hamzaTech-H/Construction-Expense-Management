import { Routes, Route } from 'react-router-dom';
import ProjectPage from "./ProjectPage";
import ProjectsList from './ProjectsList';
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useEffect } from 'react';
import { CustomTitleBar } from './CustomTitleBar';
import SettingsPage from './SettingsPage';
function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  {/* <header className="flex justify-end gap-2 py-4">
          <button onClick={() => i18n.changeLanguage("fr")}>🇫🇷 FR</button>
          <button onClick={() => i18n.changeLanguage("ar")}>🇸🇦 AR</button>
        </header> */}

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <CustomTitleBar />
          <main className="flex flex-col flex-1 overflow-auto custom-scrollbar">
              <Routes>
                <Route path="/" element={<ProjectsList />} />
                <Route path="/projects/:projectId" element={<ProjectPage />} />
                <Route path='/settings' element={<SettingsPage />} />
              </Routes>
          </main>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}

export default App