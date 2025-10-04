import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { XClose } from '@untitledui/icons';
import { useState } from "react";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { useParams } from "react-router-dom";
import { Expense, ProjectStats} from "./types";
import { ExpenseStatus } from "../shared/expense";

interface ExpenseModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expense?: Expense | null;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setStats: React.Dispatch<React.SetStateAction<ProjectStats>>;
}

export default function ExpenseModal({ setIsModalOpen, expense, setExpenses, setStats}: ExpenseModalProps) {    
    
    const projectId = Number(useParams<{ projectId: string }>().projectId);
    const [form, setForm] = useState({
        description: expense?.description ?? "",
        date: expense?.date ?? new Date().toISOString().split("T")[0],
        total: expense?.amount_total ?? 0,
        isPaid: expense?.status === ExpenseStatus.PAID
    });

    const handleChange = (field: keyof typeof form, value: string | number | boolean) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (expense) {
            const updatedExpense = await window.database.updateExpense(expense.id, form.description, form.date, form.total, form.isPaid);
            
            setExpenses(prev =>
                prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp)
            );
            setStats(prev => {
                return {
                    total: prev.total - expense.amount_total + updatedExpense.amount_total,
                    paid: prev.paid - expense.amount_paid + updatedExpense.amount_paid,
                    remaining: prev.remaining - expense.amount_remaining + updatedExpense.amount_remaining
                };
            });
        } else {
            const newExpense = await window.database.addExpense(projectId, form.description, form.date, form.total, form.isPaid);
            
            setExpenses(prev => [newExpense, ...prev]);
            setStats(prev => {
                return {
                    total: prev.total + newExpense.amount_total,
                    paid: prev.paid + newExpense.amount_paid,
                    remaining: prev.remaining + newExpense.amount_remaining
                };
            });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg relative">
                <h2 className="mb-4 text-lg font-semibold">Ajouter la dépense</h2>
                <Button color="tertiary" size="md" iconLeading={<XClose data-icon />} onClick={() => setIsModalOpen(false)} aria-label="Button CTA" className="absolute top-3 right-3"/>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input isRequired name="description" label="Description" placeholder="une description sur la dépense" value={form.description} onChange={(value: string) => handleChange("description", value)}/>
                    <Input isRequired name="date" label="Date" type="date" value={form.date} onChange={(value: string) => handleChange("date", value)}/> 
                    <Input isRequired name="total" label="Total" type="number" value={form.total.toString()} onChange={(value: String) => handleChange("total", Number(value))}/>                          
                    <Checkbox 
                        label="marquer comme payé" 
                        size="sm" 
                        isSelected={form.isPaid}      
                        onChange={(checked: boolean) => handleChange("isPaid", checked)}
                    ></Checkbox>
                    <div className="flex justify-end gap-2">
                        <Button type="submit" size="md" className="mt-2">Sauvegarder</Button> 
                    </div>
                </form>
            </div>
        </div>
    )
}