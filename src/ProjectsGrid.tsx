import ProjectCard from "./ProjectCard";

interface Project {
  name: string;
  date: string;
  description?: string;
}

interface ProjectsGridProps {
  projects: Project[];
}

export default function ProjectsGrid({ projects }: ProjectsGridProps) {

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8">
      {projects.map((project) => (
        <ProjectCard
          name={project.name}
          date={project.date}
          description={project.description}
        />
      ))}
    </div>
  );
}