import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Plus, SearchMd } from '@untitledui/icons';
import ProjectModal from "./ProjectModal"
import { useEffect, useState, useCallback, useMemo } from "react";
import { Project } from "./types";
import { useTranslation } from "react-i18next";
import { ProjectCard } from "./ProjectCard";
import { useNavigate } from "react-router-dom";


export default function ProjectsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

 const handleProjectClick = (project: Project) => {
  navigate(`/projects/${project.id}?name=${project.name}`);
};

  return (
    <>
      <div className="sticky top-0 z-10 border-b bg-background px-8 py-6 bg-muted">
        <div className="mx-auto flex max-w-6xl gap-4">
          <Input
            name="name"
            type="search"
            icon={SearchMd}
            placeholder={t("Search by name or description...")}
            onChange={(value: string) => setSearch(value)}
          />
          <Button
            size="md"
            iconLeading={<Plus data-icon />}
            onClick={() => {
              setIsModalOpen(true);
              setSelectedProject(null);
            }}
          >
            {t("Add new project")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center px-8 gap-4 mt-8">
        {filteredProjects.map((project) => (
          <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project)}
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