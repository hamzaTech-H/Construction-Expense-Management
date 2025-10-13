import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { XClose, Printer, Trash01, Edit01 } from '@untitledui/icons';
import { Expense, Payment, ProjectStats } from "./types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ButtonUtility } from "./components/base/buttons/button-utility";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

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

    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);

    function handlePrint() {
        window.pdf.printPayments(expense.id);
    }

    useEffect(() => {
        const fetchPayments = async () => {
        const data = await window.database.getPaymentsByExpense(expense.id);
        setPayments(data); 
        };

        fetchPayments();
    }, [expense.id]);

    function handleEditPayment(payment: Payment) {
        setPaymentToEdit(payment);
        setForm({
            amount: payment.amount.toString(),
            date: payment.date,
            note: payment.note,
        });
    }
        
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (paymentToEdit) {
            try {
                const updatedExpense = await window.database.updatePayment(
                    paymentToEdit.id,
                    Number(form.amount),
                    form.date,
                    form.note
                );
                // Update state/UI
                setPaymentToEdit(null);
                setPayments(prev => prev.map(pay => pay.id === paymentToEdit.id ? {id: paymentToEdit.id, amount:Number(form.amount), date:form.date, note:form.note } : pay ))
                setExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp ));
                setStats(prev => ({ total: prev.total, paid: prev.paid - (paymentToEdit.amount - parseFloat(form.amount)), remaining: prev.remaining + (paymentToEdit.amount - parseFloat(form.amount)) }));
                setForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
            } catch (error:any) {
                const messageParts = error.message.split(': ');
                const backendMessage = messageParts[messageParts.length - 1];
                toast.error(backendMessage);
            }
            
        } else {
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
            <div className="flex justify-end mb-2">
                <Button
                    color="secondary"
                    size="sm"
                    iconLeading={<Printer data-icon />}
                    onClick={handlePrint}
                >
                    Imprimer
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
                {payments.length > 0 ? (
                    payments.map((payment) => (
                    <div
                        key={payment.id}
                        className="flex justify-between items-center border rounded-lg p-2 text-sm"
                    >
                        <div className="flex flex-col">
                        <span className="font-mono text-primary">
                            {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                            }).format(Number(payment.amount))}
                        </span>
                        <span className="text-xs text-gray-500">{payment.date}</span>
                        </div>

                        <span className="italic text-gray-700">{payment.note}</span>

                        <div className="flex gap-2">
                            <ButtonUtility size="xs" color="tertiary" tooltip="modifier" icon={Edit01}  onClick={() => handleEditPayment(payment)}/>
                            <ButtonUtility size="xs" color="tertiary" tooltip="supprimer" icon={Trash01} onClick={() => setPaymentToDelete(payment)}/>
                        </div>
                    </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-sm italic">Aucun paiement trouvé</p>
                )}
            </div>

            <form
                onSubmit={handleSubmit}
                className="border-t pt-3 flex flex-col gap-4 mt-1"
            >
                <h3 className="text-md font-semibold">{paymentToEdit ? "Modifier Paiement" : "Ajouter Paiement"}</h3>
                <div className="flex gap-3">
                    <Input isRequired name="amount" label="Montant" type="number"  value={form.amount} onChange={(value: string) => setForm(prev => ({ ...prev, amount: value }))}/>
                    <div
                        onClick={(e) => {
                            const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                            input?.showPicker?.();
                        }}
                    >
                        <Input isRequired name="date" label="Date" type="date" value={form.date} onChange={(value: string) => setForm((prev) => ({ ...prev, date: value }))}/>
                    </div>
                    <Input name="note" label="Notes" placeholder="note" value={form.note} onChange={(value: string) => setForm(prev => ({ ...prev, note: value }))} />
                </div>
                <div className="flex justify-end gap-2">
                    {paymentToEdit && (
                        <Button
                            size="md"
                            color="secondary"
                            onClick={() => {
                                setPaymentToEdit(null);
                                setForm({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
                            }}
                        >
                            Annuler modification
                        </Button>
                    )}

                    <Button type="submit" size="md">
                        {paymentToEdit ? "Enregistrer" : "Ajouter Paiement"}
                    </Button> 
                </div>
            </form>

           {paymentToDelete && (
                <ConfirmDeleteModal
                    setIsConfirmOpen={() => setPaymentToDelete(null)}
                    name={paymentToDelete.amount.toString()}
                    id={paymentToDelete.id}
                    entityLabel="Paiement"
                    onDelete={async (id) => {
                        const updatedExpense = await window.database.deletePayment(id);
                        setPayments((prev) => prev.filter((p) => p.id !== id));
                        setExpenses(prev => prev.map(exp => exp.id === expense.id ? updatedExpense : exp));
                        setStats(prev => ({ total: prev.total, paid: prev.paid - paymentToDelete.amount, remaining: prev.remaining + paymentToDelete.amount }));
                    }}
                />
            )}

        </div>
    </div>
    );
}