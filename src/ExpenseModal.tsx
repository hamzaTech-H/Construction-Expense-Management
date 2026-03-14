import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { XClose } from '@untitledui/icons';
import { useEffect, useRef, useState } from "react";
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
    setExpenseCategories: React.Dispatch<React.SetStateAction<any[]>>;
    /** When creating a new expense, pre-select this category. Undefined/"all" = empty. */
    activeTabCategoryId?: string | number | null;
}

export default function ExpenseModal({ setIsModalOpen, expense, setExpenses, setStats, setExpenseCategories, activeTabCategoryId }: ExpenseModalProps) {    
    const { t, i18n  } = useTranslation();
    const [categories, setCategories] = useState<SelectItemType[]>([]);

    useEffect(() => {
    (async () => {
        const data = await window.database.getAllExpenseCategories(); 

        const formatted: SelectItemType[] = data.map((c) => ({
            id: String(c.id),
            label: i18n.language === "ar" ? c.ar_name : c.fr_name,       
        }));

        setCategories(formatted);
    })();
    }, []);
    
    const projectId = Number(useParams<{ projectId: string }>().projectId);
    const [form, setForm] = useState({
        categoryId: expense?.category_id as number | undefined,
        description: expense?.description ?? "",
        date: expense?.date ?? new Date().toISOString().split("T")[0],
        total: expense?.amount_total.toString() ?? "",
        isNotPaid: expense?.status === ExpenseStatus.PAID
    });

    useEffect(() => {
        if (expense) {
            setForm({
                categoryId: expense.category_id,
                description: expense.description ?? "",
                date: expense.date ?? new Date().toISOString().split("T")[0],
                total: expense.amount_total.toString() ?? "",
                isNotPaid: expense.status === ExpenseStatus.PAID
            });
            return;
        }
        if (categories.length === 0) return;
        const tabId = activeTabCategoryId == null || activeTabCategoryId === "all"
            ? undefined
            : Number(activeTabCategoryId);
        const exists = tabId != null && categories.some((c) => String(c.id) === String(tabId));
        setForm((prev) => ({
            ...prev,
            categoryId: exists ? tabId : undefined
        }));
    }, [expense, categories, activeTabCategoryId]);

    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const first = formRef.current?.querySelector<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="combobox"], [tabindex="0"]'
            );
            first?.focus();
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleChange = (field: keyof typeof form, value: string | number | boolean) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // ✅ Allow only numbers (optionally with one decimal point)
        const value = form.total.trim();

        // ✅ Allow only numbers, optional one dot or comma, max 2 digits after it
        const validNumberPattern = /^\d+([.,]\d{1,2})?$/;

        if (!validNumberPattern.test(value)) {
            toast.error(t('Please enter a valid number (max two decimals)'));
            return;
        }

        // Normalize comma to dot and parse
        const totalAmount = parseFloat(value.replace(',', '.'));

        if (expense) {

            if (totalAmount < expense.amount_paid) {
                toast.error(t("The total cannot be reduced. Delete a payment first"));
                return; 
            } 

            const updatedExpense = await window.database.updateExpense(expense.id, Number(form.categoryId), form.description, form.date, totalAmount);
            
            // setExpenses(prev =>
            //     prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp)
            // );

            // setExpenseCategories((prevCategories) => {
            //     const exists = prevCategories.some((c) => c.id === updatedExpense.category_id);
            //     if (exists) return prevCategories;

            //     const newCategory = {
            //         id: updatedExpense.category_id,
            //         fr_name: updatedExpense.category_fr_name,
            //         ar_name: updatedExpense.category_ar_name,
            //     };

            //     return [...prevCategories, newCategory];
            // });

            setExpenses((prev) => {
                const updatedExpenses = prev.map((exp) =>
                    exp.id === updatedExpense.id ? updatedExpense : exp
                );

                // ✅ Update categories based on updated expenses
                setExpenseCategories((prevCategories) => {
                    // 1. Collect all category IDs still in use
                    const usedCategoryIds = new Set(updatedExpenses.map((e) => e.category_id));

                    // 2. Start with existing categories that are still in use
                    let updatedCategories = prevCategories.filter((c) =>
                        usedCategoryIds.has(c.id)
                    );

                    // 3. Add new category if it’s missing
                    const exists = updatedCategories.some(
                        (c) => c.id === updatedExpense.category_id
                    );

                    if (!exists && updatedExpense.category_fr_name && updatedExpense.category_ar_name) {
                        const newCategory = {
                            id: updatedExpense.category_id,
                            fr_name: updatedExpense.category_fr_name,
                            ar_name: updatedExpense.category_ar_name,
                        };
                        updatedCategories = [...updatedCategories, newCategory];
                    }

                    return updatedCategories;
                });

                return updatedExpenses;
            });


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

            setExpenseCategories((prevCategories) => {
                const exists = prevCategories.some((c) => c.id === newExpense.category_id);
                if (exists) return prevCategories; // ✅ Skip if category already exists

                // ✅ Add new category with localized names
                const newCategory = {
                    id: newExpense.category_id,
                    fr_name: newExpense.category_fr_name,
                    ar_name: newExpense.category_ar_name,
                };

                return [...prevCategories, newCategory];
            });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg relative">
                <h2 className="mb-4 text-lg font-semibold">{t("Add expense")}</h2>
                <Button color="tertiary" size="md" iconLeading={<XClose data-icon />} onClick={() => setIsModalOpen(false)} aria-label={t("Close")} className="absolute top-2 end-2"/>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        selectedKey={form.categoryId != null ? String(form.categoryId) : undefined}
                        onSelectionChange={(key) =>
                            setForm((prev) => ({ ...prev, categoryId: Number(key)}))
                        }
                        isRequired
                        label={t("Category")}
                        placeholder={t("Select category")}
                        items={categories}
                    >
                        {(item) => (
                            <Select.Item dir={i18n.language === "ar" ? "rtl" : "ltr"} id={item.id}  >
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