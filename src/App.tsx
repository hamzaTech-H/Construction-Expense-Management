import { Routes, Route } from 'react-router-dom';
import ProjectPage from "./ProjectPage";
import ProjectsList from './ProjectsList';
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useEffect } from 'react';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <main className="flex flex-col px-8 py-0 mx-auto">
      <header className="flex justify-end gap-2 py-4">
        <button onClick={() => i18n.changeLanguage("fr")}>🇫🇷 FR</button>
        <button onClick={() => i18n.changeLanguage("ar")}>🇸🇦 AR</button>
      </header>
      
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<ProjectsList />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
      </Routes>
    </main>
  );
}

export default App