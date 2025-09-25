import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { X } from '@untitledui/icons';
import { useState } from "react";


interface ProjectModalProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onProjectAdded: () => void;
}

export default function ProjectModal({ setIsOpen, onProjectAdded }: ProjectModalProps) {    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const date = formData.get("date") as string;
        const description = formData.get("description") as string;
        
        await window.database.addProject(name, date, description);
        onProjectAdded();
        setIsOpen(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                    <h2 className="mb-4 text-lg font-semibold">Ajouter projet</h2>
                    <Button color="secondary" size="sm" iconLeading={<X data-icon />} onClick={() => setIsOpen(false)} aria-label="Button CTA" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input isRequired name="name" label="Nom" placeholder="Nom de Projet" />
                    <Input isRequired name="date" label="Date" type="date" />                           
                    <TextArea name='description' placeholder="Ajouter un description" label="Description" rows={4} />
                    
                    <div className="flex justify-end gap-2">
                        <Button type="submit" className="mt-2">Sauvegarder</Button> 
                    </div>
                </form>
            </div>
        </div>
    )
}