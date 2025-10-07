import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { XClose } from '@untitledui/icons';
import { Expense, Payment, ProjectStats } from "./types";
import { useEffect, useState } from "react";
import { ExpenseStatus } from "../shared/expense";
import toast from "react-hot-toast";

interface ExpensePaymentsModalProps {
  setIsPaymentsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expense: Expense; 
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setStats: React.Dispatch<React.SetStateAction<ProjectStats>>;
}

export default function ExpensePaymentsModal({ setIsPaymentsModalOpen, expense, setExpenses, setStats}: ExpensePaymentsModalProps) {  
    
    const [payments, setPayments] = useState<Payment[]>([]);
    const [form, setForm] = useState({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
    });

    useEffect(() => {
        const fetchPayments = async () => {
        const data = await window.database.getPaymentsByExpense(expense.id);
        setPayments(data); 
        };

        fetchPayments();
    }, [expense.id]);
        
    const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const { paymentId, newAmountPaid, remaining, status } = await window.database.addPayment(
                expense.id,
                parseFloat(form.amount),
                form.date,
                form.note
            );

            setPayments(prev => [...prev, { id: paymentId, amount: parseFloat(form.amount), date: form.date, note: form.note }]);
            setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, amount_paid: newAmountPaid, amount_remaining: remaining, status } : exp));
            setStats(prev => ({ total: prev.total, paid: prev.paid + parseFloat(form.amount), remaining: prev.remaining - parseFloat(form.amount) }));
            setForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });

            toast.success("Paiement ajouté avec succès !");
        } catch (error:any) {
            const messageParts = error.message.split(': ');
            const backendMessage = messageParts[messageParts.length - 1];
            toast.error(backendMessage);
        }
    };

   return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg relative flex flex-col max-h-[70vh]">
            <h2 className="mb-4 text-lg font-semibold">Paiements</h2>

            {/* Close button */}
            <Button
                color="tertiary"
                size="md"
                iconLeading={<XClose data-icon />}
                onClick={() => setIsPaymentsModalOpen(false)}
                aria-label="Fermer"
                className="absolute top-3 right-3"
            />

            {/* Payments list */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                {payments.length > 0 ? (
                    payments.map((payment) => (
                    <div
                        key={payment.id}
                        className="flex justify-between items-center border rounded-lg p-2 text-sm"
                    >
                        <div className="flex flex-col">
                        <span className="font-mono text-primary">
                            {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "DZD",
                            }).format(payment.amount)}
                        </span>
                        <span className="text-xs text-gray-500">{payment.date}</span>
                        </div>
                        <span className="italic text-gray-700">{payment.note}</span>
                    </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-sm italic">Aucun paiement trouvé</p>
                )}
                </div>

            {/* Add payment form */}
            <form
                onSubmit={handleAddPayment}
                className="border-t pt-3 flex flex-col gap-4"
            >
                <h3 className="text-md font-semibold">Ajouter Paiement</h3>

                <div className="flex gap-3">
                    <Input isRequired name="amount" label="Montant" type="number"  value={form.amount} onChange={(value: string) => setForm(prev => ({ ...prev, amount: value }))}/>
                    <Input isRequired name="date" label="Date" type="date" value={form.date} onChange={(value: string) => setForm(prev => ({ ...prev, date: value }))}/>
                    <Input name="note" label="Notes" placeholder="note" value={form.note} onChange={(value: string) => setForm(prev => ({ ...prev, note: value }))} />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" size="md">
                        Ajouter Paiement
                    </Button>
                </div>
            </form>

        </div>
    </div>
    );
}