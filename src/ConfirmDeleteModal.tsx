import { Button } from "@/components/base/buttons/button";
import { X } from '@untitledui/icons';
import { useContext } from "react";
import { fetchProjectsContext } from "./ProjectsList";

type ConfirmDeleteModalProps = {
  setIsConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
  id: number;
};

export default function ConfirmDeleteModal({setIsConfirmOpen, name, id}: ConfirmDeleteModalProps) {
  
  const fetchProjects = useContext(fetchProjectsContext)
  const handleDeletion = async (id: number) => {
      await window.database.deleteProject(id);
      fetchProjects();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg relative">

            {/* Close button */}
            <Button
              color="tertiary"
              size="sm"
              iconLeading={<X data-icon />}
              onClick={() => setIsConfirmOpen(false)}
              aria-label="Close modal"
              className="absolute top-3 right-3"
            />

            {/* Title */}
            <h2 className="text-lg font-bold text-gray-800 mb-2">Supprimer Projet</h2>

            {/* Text */}
            <p className="text-sm text-gray-600 mb-4">
              Voulez-vous vraiment supprimer « {name} » ? Cette action est définitive et ne peut pas être annulée.
            </p>

            {/* Buttons */}
            <div className="flex flex-row gap-2 justify-end">
              <Button
                color="secondary"
                size="md"
                onClick={() => setIsConfirmOpen(false)}
              >
                Annuler
              </Button>
              <Button
                color="primary-destructive"
                size="md"
                onClick={() => {
                  handleDeletion(id);
                  setIsConfirmOpen(false);
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
  );
}