import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { XClose } from '@untitledui/icons';
import { useState } from "react";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { useParams } from "react-router-dom";

interface ProjectModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ExpenseModal({ setIsModalOpen }: ProjectModalProps) {    
    const projectId = Number(useParams<{ projectId: string }>().projectId);
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [total, setTotal] = useState(0);
    const [isPaid, setIsPaid] = useState(false);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await window.database.addExpense(projectId, description, date, total, isPaid);
       setIsModalOpen(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg relative">

                <h2 className="mb-4 text-lg font-semibold">Ajouter la dépense</h2>
                <Button color="tertiary" size="md" iconLeading={<XClose data-icon />} onClick={() => setIsModalOpen(false)} aria-label="Button CTA" className="absolute top-3 right-3"/>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input isRequired name="description" label="Description" placeholder="une description sur la dépense" value={description} onChange={(value: string) => setDescription(value)}/>
                    <Input isRequired name="date" label="Date" type="date" value={date} onChange={(value: string) => setDate(value)}/> 
                    <Input isRequired name="total" label="Total" type="number" value={total.toString()} onChange={(value: string) => setTotal(Number(value))}/>                          
                    <Checkbox 
                        label="marquer comme payé" 
                        size="sm" 
                        isSelected={isPaid}                     // controlled state
                        onChange={(checked: boolean) => setIsPaid(checked)} // update state/>
                    ></Checkbox>
                    <div className="flex justify-end gap-2">
                        <Button type="submit" size="md" className="mt-2">Sauvegarder</Button> 
                    </div>
                </form>
            </div>
        </div>
    )
}