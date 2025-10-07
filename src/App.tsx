import { Routes, Route } from 'react-router-dom';
import ProjectPage from "./ProjectPage";
import ProjectsList from './ProjectsList';
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <main className="flex flex-col px-8 py-0 mx-auto">
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route 
          path="/" 
          element={<ProjectsList />} 
        />
              
        <Route 
          path="/projects/:projectId" 
          element={<ProjectPage />} 
        />
      </Routes>
    </main>
  );
}

export default App