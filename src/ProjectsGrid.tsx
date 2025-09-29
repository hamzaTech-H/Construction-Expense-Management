import ProjectCard from "./ProjectCard";

interface Project {
  id: number;
  name: string;
  date: string;
  description?: string;
}

interface ProjectsGridProps {
  projects: Project[];
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

export default function ProjectsGrid({ projects, setIsModalOpen, setSelectedProject }: ProjectsGridProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8">
      {projects.map((project) => (
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
  );
}