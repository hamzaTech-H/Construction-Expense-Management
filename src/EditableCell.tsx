import { useEffect, useState } from "react";
import { Table } from "@/components/application/table/table";
import { ButtonUtility } from "./components/base/buttons/button-utility";
import { Edit01 } from "@untitledui/icons";
import { Input } from "./components/base/input/input";
import { Expense, ProjectStats } from "./types";
import toast from "react-hot-toast";

interface Props {
  expense: Expense;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setStats: React.Dispatch<React.SetStateAction<ProjectStats>>;
}

export default function EditableCell({ expense, setExpenses, setStats }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(expense.amount_total);

  useEffect(() => {
    setValue(expense.amount_total);
  }, [expense.amount_total]);

  const resetValue = () => setValue(expense.amount_total);

  const showReductionError = () => {
    toast.error("Le total ne peut pas être réduit. Supprimez d’abord un paiement");
    resetValue();
  };

  const updateLocalState = (updatedExpense: Expense) => {
    setExpenses(prev =>
      prev.map(exp => (exp.id === updatedExpense.id ? updatedExpense : exp))
    );

    setStats(prev => ({
      total: prev.total - expense.amount_total + updatedExpense.amount_total,
      paid: prev.paid - expense.amount_paid + updatedExpense.amount_paid,
      remaining: prev.remaining - expense.amount_remaining + updatedExpense.amount_remaining,
    }));
  };

  const handleSave = async () => {
    setEditing(false);
    if (value === expense.amount_total) {
        return
    }

    if (value < expense.amount_paid) {
      showReductionError();
      return;
    }

    const updatedExpense = await window.database.updateExpense(
      expense.id,
      expense.description,
      expense.date,
      value
    );

    updateLocalState(updatedExpense);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      await handleSave();
    } else if (e.key === "Escape") {
      resetValue();
      setEditing(false);
    }
  };

  return (
    <Table.Cell className="font-medium text-primary font-mono">
      {editing ? (
        <Input autoFocus isRequired name="total" aria-label="Total" type="number" value={value.toString()}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          onChange={(val: string) => setValue(Number(val))}
        />
      ) : (
        <div className="flex items-center gap-x-1">
          <span>
            {new Intl.NumberFormat("en-US", {minimumFractionDigits: 2,maximumFractionDigits: 2,}).format(expense.amount_total)}
          </span>
          <ButtonUtility size="xs" color="tertiary" tooltip="Edit" icon={Edit01} onClick={() => setEditing(true)} />
        </div>
      )}
    </Table.Cell>
  );
}
