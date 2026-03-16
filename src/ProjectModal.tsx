import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { XClose } from '@untitledui/icons';
import { useEffect, useRef, useState } from "react";
import { FocusScope } from "react-aria";
import { Project } from "./types";
import { useTranslation } from "react-i18next";

interface ProjectModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  project: Project | null;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export default function ProjectModal({ setIsModalOpen, project, setProjects }: ProjectModalProps) {    
    const { t } = useTranslation();
    const [form, setForm] = useState({
        name: project?.name ?? "",
        date: project?.date ?? new Date().toISOString().split("T")[0],
        client: project?.client,
        budget: project?.budget ?? null,
        description: project?.description ?? "",
    });

    const formRef = useRef<HTMLFormElement>(null);

    const handleChange = (field: keyof typeof form, value: string|number|null) =>
        setForm(prev => ({ ...prev, [field]: value }));

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const first = formRef.current?.querySelector<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="combobox"], [tabindex="0"]'
            );
            first?.focus();
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsModalOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setIsModalOpen]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if(project) {
            await window.database.updateProject(project.id, form.name, form.date, form.client, form.budget, form.description);
            const updatedProject: Project = {
                id: project.id,
                name: form.name,
                date: form.date,
                client: form.client,
                budget: form.budget ?? null,
                description: form.description,
                total_spent: project.total_spent,
            };
            setProjects((prev) =>
                prev.map((p) => (p.id === project.id ? updatedProject : p))
            );
           
        } else {
            const projectId = await window.database.addProject(form.name, form.date, form.client, form.budget, form.description);
           
            const newProject: Project = {
                id: projectId as number,
                name: form.name,
                date: form.date,
                client: form.client,
                budget: form.budget ?? null,
                description: form.description,
                total_spent: 0,
            };

            setProjects(prev => [newProject, ...prev]);
        }

        setIsModalOpen(false);    
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <FocusScope contain restoreFocus autoFocus={false}>
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg relative">

                <div className="flex justify-between items-center mb-4">
                    <h2 className="mb-4 text-lg font-semibold">{project ? t("Edit project") : t("Add project")}</h2>
                    <Button color="tertiary" size="md" iconLeading={<XClose data-icon />} onClick={() => setIsModalOpen(false)} aria-label="Button CTA" className="absolute top-2 end-2"/>
                </div>
                

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <Input isRequired name="name" label={t("Name")} placeholder={t("Project name")} value={form.name} onChange={(value: string) => handleChange("name", value)}/>
                     <div
                        onClick={(e) => {
                            const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                            input?.showPicker?.();
                        }}
                    >
                        <Input isRequired name="date" label={t("Date")} type="date" value={form.date} onChange={(value: string) => handleChange("date", value)}/>
                    </div>

                    <Input name="client" label={t("Client")}  value={form.client} onChange={(value: string) => handleChange("client", value)}/>
                    <Input name="budget" label={t("Budget")} type="number" value={form.budget?.toString() ?? ""} onChange={(value: string) => handleChange("budget", value === "" ? null : Number(value)) }/>
                                               
                    <TextArea name='description' placeholder={t("Add a description")} label={t("Description")} rows={4} value={form.description} onChange={(value: string) => handleChange("description", value)}/>
                    
                    <div className="flex justify-end gap-2">
                        <Button type="submit" size="md" className="mt-2">{t("Save")}</Button> 
                    </div>
                </form>
            </div>
            </FocusScope>
        </div>
    )
}