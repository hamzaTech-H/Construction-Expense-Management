import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { XClose } from '@untitledui/icons';
import { useState } from "react";
import { Project } from "./types";

interface ProjectModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  project: Project | null;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export default function ProjectModal({ setIsModalOpen, project, setProjects }: ProjectModalProps) {    
    
    const [form, setForm] = useState({
        name: project?.name ?? "",
        date: project?.date ?? new Date().toISOString().split("T")[0],
        description: project?.description ?? "",
    });

    const handleChange = (field: keyof typeof form, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if(project) {
            await window.database.updateProject(project.id, form.name, form.date, form.description);
            const updatedProject: Project = {
                id: project.id,
                name: form.name,
                date: form.date,
                description: form.description,
            };
            setProjects((prev) =>
                prev.map((p) => (p.id === project.id ? updatedProject : p))
            );
           
        } else {
            const projectId = await window.database.addProject(form.name, form.date, form.description);
            const newProject: Project = {
                id: projectId as number,
                name: form.name,
                date: form.date,
                description: form.description,
            };

            setProjects(prev => [newProject, ...prev]);
        }

        setIsModalOpen(false);    
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg relative">

                <h2 className="mb-4 text-lg font-semibold">{project ? "Modifier projet" : "Ajouter projet"}</h2>
                <Button color="tertiary" size="md" iconLeading={<XClose data-icon />} onClick={() => setIsModalOpen(false)} aria-label="Button CTA" className="absolute top-3 right-3"/>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input isRequired name="name" label="Nom" placeholder="Nom de Projet" value={form.name} onChange={(value: string) => handleChange("name", value)}/>
                     <div
                        onClick={(e) => {
                            const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                            input?.showPicker?.();
                        }}
                    >
                        <Input isRequired name="date" label="Date" type="date" value={form.date} onChange={(value: string) => handleChange("date", value)}/>
                    </div>
                                               
                    <TextArea name='description' placeholder="Ajouter un description" label="Description" rows={4} value={form.description} onChange={(value: string) => handleChange("description", value)}/>
                    
                    <div className="flex justify-end gap-2">
                        <Button type="submit" size="md" className="mt-2">Sauvegarder</Button> 
                    </div>
                </form>
            </div>
        </div>
    )
}