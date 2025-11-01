import { useEffect, useState } from "react";
import { Table } from "@/components/application/table/table";
import { ButtonUtility } from "./components/base/buttons/button-utility";
import { Edit01 } from "@untitledui/icons";
import { Input } from "./components/base/input/input";
import { Expense, ProjectStats } from "./types";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Props {
  expense: Expense;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setStats: React.Dispatch<React.SetStateAction<ProjectStats>>;
}

export default function EditableCell({ expense, setExpenses, setStats }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(expense.amount_total.toString());

  useEffect(() => {
  setValue(expense.amount_total.toString());
}, [expense.amount_total]);

  const resetValue = () => setValue(expense.amount_total.toString());

  const showReductionError = () => {
    toast.error(t("The total cannot be reduced. Delete a payment first"));
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
  const strValue = value.toString().trim();

  // ✅ Allow only numbers, one optional dot or comma, up to 2 decimals
  const validNumberPattern = /^\d+([.,]\d{0,2})?$/;

  if (!validNumberPattern.test(strValue)) {
    toast.error(t("Please enter a valid number (max two decimals)"));
    return;
  }

  // ✅ Convert comma to dot and parse to float
  const totalAmount = parseFloat(strValue.replace(",", "."));

  setEditing(false);

  // ✅ If unchanged, skip update
  if (totalAmount === expense.amount_total) {
    return;
  }

  // ✅ Prevent reducing below paid amount
  if (totalAmount < expense.amount_paid) {
    showReductionError();
    return;
  }

  // ✅ Save update
  const updatedExpense = await window.database.updateExpense(
    expense.id,
    expense.category_id,
    expense.description,
    expense.date,
    totalAmount
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
      <Input
        autoFocus
        isRequired
        name="total"
        aria-label="Total"
        type="text" // ✅ switched to text to allow '.' and ','
        value={value.toString()}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        onChange={(val: string) => setValue(val)} // ✅ keep as string for now
      />
    ) : (
      <div className="flex items-center gap-x-1">
        <span>
          {new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(expense.amount_total)}
        </span>
        <ButtonUtility
          size="xs"
          color="tertiary"
          tooltip={t("Edit")}
          icon={Edit01}
          onClick={() => setEditing(true)}
        />
      </div>
    )}
  </Table.Cell>
);

}
