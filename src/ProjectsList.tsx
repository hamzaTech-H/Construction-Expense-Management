import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Plus, SearchMd } from '@untitledui/icons';
import ProjectModal from "./ProjectModal"
import ProjectCard from "./ProjectCard";
import { useEffect, useState, createContext } from "react";

interface Project {
  id: number;
  name: string;
  date: string;
  description?: string;
}

type FetchProjectsType = () => Promise<void>;

export const fetchProjectsContext = createContext<FetchProjectsType>(
  async () => {} // dummy default function
);

export default function ProjectsList() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [search, setSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const filteredProjects = projects.filter((project) =>
    [project.name, project.description ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
    <>
      <div className="flex items-center gap-4 mt-4">
        <Input name="name" type="search" icon={SearchMd} placeholder="Rechercher par nom ou description..." onChange={(value: string) => setSearch(value)}/>
        <Button 
          onClick={() => {
            setIsModalOpen(true) 
            setSelectedProject(null)
          }} 
          iconLeading={<Plus data-icon />}
          >Ajouter Nouveau Projet
        </Button>
      </div>

      <fetchProjectsContext.Provider value={fetchProjects}>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {filteredProjects.map((project) => (
            <ProjectCard
              id={project.id}
              name={project.name}
              date={project.date}
              description={project.description}
              key={project.id}
              setIsModalOpen={setIsModalOpen} 
              setSelectedProject={setSelectedProject}
            />
          ))}
        </div>
      </fetchProjectsContext.Provider>
      
      {isModalOpen && (
        <fetchProjectsContext.Provider value={fetchProjects}>
          <ProjectModal 
            setIsModalOpen={setIsModalOpen}
            project={selectedProject}
        />
        </fetchProjectsContext.Provider>
      )}
    </>
    
  );
}