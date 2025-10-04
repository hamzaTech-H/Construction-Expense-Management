import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Edit05, Trash01 } from "@untitledui/icons";
import { useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { Link } from "react-aria-components";
import { Project } from "./types";
import { memo } from "react";

interface ProjectCardProps {
  project: Project;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>;
  fetchProjects: ()=>void;
}


const ProjectCardComponent = ({project, setIsModalOpen, setSelectedProject, fetchProjects}: ProjectCardProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Link
        href={`/projects/${project.id}`}  
        className="max-w-sm w-full bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">{project.name}</h2>
          <Dropdown.Root>
            <Dropdown.DotsButton /> 
            <Dropdown.Popover>           
              <Dropdown.Menu>
                <Dropdown.Item icon={Edit05} onClick={() => {
                  setIsModalOpen(true) 
                  setSelectedProject(project)
                }}>Modifier
                </Dropdown.Item>                    
                <Dropdown.Item icon={Trash01} onClick={() => {
                    setIsConfirmOpen(true);   
                  }}>Supprimer
                </Dropdown.Item>                         
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
        </div>

        <p className="text-sm text-gray-500 mb-3">{project.date}</p>
        {project.description && <p className="text-gray-600 text-sm">{project.description}</p>}
      </Link>

      {isConfirmOpen && (
        <ConfirmDeleteModal
          setIsConfirmOpen={setIsConfirmOpen}
          name={project.name}
          id={project.id}
          entityLabel="Projet"
          onDelete={async (id) => {
            await window.database.deleteProject(id);
            fetchProjects();
          }}
        />
      )}
    </>
  )
}


const ProjectCard = memo(ProjectCardComponent);

export default ProjectCard;