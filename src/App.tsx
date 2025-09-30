import { Routes, Route } from 'react-router-dom';
import ProjectPage from "./ProjectPage";
import ProjectsList from './ProjectsList';


function App() {
  return (
    <main className="h-screen flex flex-col px-4 py-0 mx-auto">

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