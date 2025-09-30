import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { XClose } from '@untitledui/icons';
import { useState, useEffect, useContext } from "react";
import { fetchProjectsContext } from "./ProjectsList";

interface ProjectModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  project: { id: number; name: string; date: string; description?: string } | null;
}

export default function ProjectModal({ setIsModalOpen, project }: ProjectModalProps) {    
    
    const fetchProjects = useContext(fetchProjectsContext)
    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDate(project.date);
            setDescription(project.description ?? "");
        } else {
            setName("");
            setDate(() => {
                return new Date().toISOString().split("T")[0];
            });
            setDescription("");
        }
    }, [project]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if(project) {
            const id = project.id
            await window.database.updateProject(id, name, date, description);
            await fetchProjects();
            setIsModalOpen(false);
        } else {
            await window.database.addProject(name, date, description);
            await fetchProjects();
            setIsModalOpen(false);
        }
       
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg relative">

                <h2 className="mb-4 text-lg font-semibold">{project ? "Modifier projet" : "Ajouter projet"}</h2>
                <Button color="tertiary" size="md" iconLeading={<XClose data-icon />} onClick={() => setIsModalOpen(false)} aria-label="Button CTA" className="absolute top-3 right-3"/>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input isRequired name="name" label="Nom" placeholder="Nom de Projet" value={name} onChange={(value: string) => setName(value)}/>
                    <Input isRequired name="date" label="Date" type="date" value={date} onChange={(value: string) => setDate(value)}/>                           
                    <TextArea name='description' placeholder="Ajouter un description" label="Description" rows={4} value={description} onChange={(value: string) => setDescription(value)}/>
                    
                    <div className="flex justify-end gap-2">
                        <Button type="submit" size="md" className="mt-2">Sauvegarder</Button> 
                    </div>
                </form>
            </div>
        </div>
    )
}