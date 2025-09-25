import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Plus, SearchMd } from '@untitledui/icons';
import ProjectModal from "./ProjectModal"
import ProjectsGrid from "./ProjectsGrid";
import { useEffect, useState } from "react";

interface Project {
  name: string;
  date: string;
  description?: string;
}

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch projects from database
  const fetchProjects = async () => {
    const allProjects: Project[] = await window.database.getAllProjects();
    setProjects(allProjects);
  };

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);


  return (
      <main className="container mx-auto p-4">
          {/* <h1 className="text-6xl font-bold">Mes Projets</h1> */}
          <div className="flex items-center gap-4">
              <Input name="name" type="search" icon={SearchMd} placeholder="Rechercher..." />
              <Button onClick={() => setIsOpen(true)} iconLeading={<Plus data-icon />}>Ajouter Nouveau Projet</Button>
          </div>
          <ProjectsGrid projects={projects}/>
          
          {isOpen && (
              <ProjectModal 
                setIsOpen={setIsOpen}
                onProjectAdded={fetchProjects}
              />
          )}
      </main>
  );
}

export default App