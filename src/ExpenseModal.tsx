import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { XClose } from '@untitledui/icons';
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { useParams } from "react-router-dom";
import { Expense, ProjectStats} from "./types";
import { ExpenseStatus } from "../shared/expense";
import toast from "react-hot-toast";
import { Select, SelectItemType } from "./components/base/select/select";
import { useTranslation } from "react-i18next";

interface ExpenseModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expense?: Expense | null;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setStats: React.Dispatch<React.SetStateAction<ProjectStats>>;
}

export default function ExpenseModal({ setIsModalOpen, expense, setExpenses, setStats}: ExpenseModalProps) {    
    const { t } = useTranslation();
    const [categories, setCategories] = useState<SelectItemType[]>([]);

    useEffect(() => {
    (async () => {
        const data = await window.database.getAllExpenseCategories(); 

        const formatted: SelectItemType[] = data.map((c) => ({
            id: c.id,
            label: c.fr_name,          
        }));

        setCategories(formatted);
    })();
    }, []);
    
    const projectId = Number(useParams<{ projectId: string }>().projectId);
    const [form, setForm] = useState({
        categoryId: expense?.category_id,
        description: expense?.description ?? "",
        date: expense?.date ?? new Date().toISOString().split("T")[0],
        total: expense?.amount_total.toString() ?? "",
        isNotPaid: expense?.status === ExpenseStatus.PAID
    });

    const handleChange = (field: keyof typeof form, value: string | number | boolean) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const totalAmount = parseFloat(form.total);
        if (isNaN(totalAmount)) {
            toast.error(t('Please enter a valid number'));
            return;
        }

        if (expense) {

            if (totalAmount < expense.amount_paid) {
                toast.error(t("The total cannot be reduced. Delete a payment first"));
                return; 
            } 

            const updatedExpense = await window.database.updateExpense(expense.id, Number(form.categoryId), form.description, form.date, totalAmount);
            
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
            const newExpense = await window.database.addExpense(projectId, Number(form.categoryId), form.description, form.date, totalAmount, form.isNotPaid);
            
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
                <h2 className="mb-4 text-lg font-semibold">{t("Add expense")}</h2>
                <Button color="tertiary" size="md" iconLeading={<XClose data-icon />} onClick={() => setIsModalOpen(false)} aria-label={t("Close")} className="absolute top-3 right-3"/>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        selectedKey={form.categoryId}
                        onSelectionChange={(key) =>
                            setForm((prev) => ({ ...prev, categoryId: Number(key)}))
                        }
                        isRequired
                        label={t("Category")}
                        placeholder={t("Select category")}
                        items={categories}
                    >
                        {(item) => (
                            <Select.Item id={item.id}  >
                                {item.label}
                            </Select.Item>
                        )}
                    </Select>

                    <Input isRequired name="description" label={t("Description")} placeholder={t("Enter expense description")} value={form.description} onChange={(value: string) => handleChange("description", value)} maxLength={100}/>
                    <div
                        onClick={(e) => {
                            const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                            input?.showPicker?.();
                        }}
                    >
                        <Input isRequired name="date" label={t("Date")} type="date" value={form.date} onChange={(value: string) => handleChange("date", value)}/> 
                    </div>
                    
                    <Input isRequired name="total" label={t("Total")} type="text" value={form.total} onChange={(value: string) => handleChange("total", value)}/>                          
                    {!expense && (
                        <Checkbox
                            label={t("Mark as unpaid")}
                            size="sm"
                            isSelected={form.isNotPaid}
                            onChange={(checked: boolean) => handleChange("isNotPaid", checked)}
                        />
                    )}
                    <div className="flex justify-end gap-2">
                        <Button type="submit" size="md" className="mt-2">{t("Save")}</Button> 
                    </div>
                </form>
            </div>
        </div>
    )
}