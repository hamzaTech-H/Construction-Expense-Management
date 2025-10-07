import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Plus, SearchMd } from '@untitledui/icons';
import ProjectModal from "./ProjectModal"
import ProjectCard from "./ProjectCard";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Project } from "./types";


export default function ProjectsList() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [search, setSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = useCallback(async () => {
    const allProjects = await window.database.getAllProjects();
    setProjects(allProjects);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return projects.filter(({ name, description }) =>
      `${name} ${description ?? ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [projects, search]);

  return (
    <>
      <div className="sticky top-0 z-50 bg-white py-4 px-2 shadow-md flex items-center gap-4">
        <Input name="name" type="search" icon={SearchMd} placeholder="Rechercher par nom ou description..." onChange={(value: string) => setSearch(value)}/>
        <Button 
          size="md"
          onClick={() => {
            setIsModalOpen(true) 
            setSelectedProject(null)
          }} 
          iconLeading={<Plus data-icon />}
          >Ajouter Nouveau Projet
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-8">
        {filteredProjects.map((project) => (
          <ProjectCard
            project={project}
            key={project.id}
            setIsModalOpen={setIsModalOpen} 
            setSelectedProject={setSelectedProject}
            fetchProjects= {fetchProjects}
          />
        ))}
      </div>
      
      {isModalOpen && (
          <ProjectModal 
            setIsModalOpen={setIsModalOpen}
            project={selectedProject}
            setProjects={setProjects}
        />
      )}
    </>
    
  );
}