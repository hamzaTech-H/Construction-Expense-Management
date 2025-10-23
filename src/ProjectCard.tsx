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
        href={`/projects/${project.id}?name=${project.name}`}
        className="group max-w-sm w-full bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {project.name}
            </h2>
            <p className="text-sm text-gray-500">
              {project.client?.trim() ? project.client : "pas de client"}
            </p>
          </div>

          <Dropdown.Root>
            <Dropdown.DotsButton />
            <Dropdown.Popover>
              <Dropdown.Menu>
                <Dropdown.Item
                  icon={Edit05}
                  onClick={() => {
                    setIsModalOpen(true);
                    setSelectedProject(project);
                  }}
                >
                  Modifier
                </Dropdown.Item>
                <Dropdown.Item
                  icon={Trash01}
                  onClick={() => {
                    setIsConfirmOpen(true);
                  }}
                >
                  Supprimer
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-3" />

        {/* Budget section */}
        {project.budget ? (
          <div className="bg-indigo-50 text-indigo-700 font-medium text-sm rounded-xl py-3 px-4 text-center mb-3">
            {new Intl.NumberFormat("en-US").format(1000)} DA / {new Intl.NumberFormat("en-US", {minimumFractionDigits: 2,maximumFractionDigits: 2}).format(project.budget)} DA
          </div>
        ) : (
          <div className="bg-gray-50 text-gray-500 italic text-sm rounded-xl py-3 px-4 text-center mb-3">
            No budget assigned
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-auto">
          <p className="text-xs text-gray-400">{project.date}</p>
        </div>
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