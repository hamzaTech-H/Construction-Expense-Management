import { Routes, Route } from 'react-router-dom';
import ProjectPage from "./ProjectPage";
import ProjectsList from './ProjectsList';


function App() {
  return (
    <main className="container mx-auto p-4">

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