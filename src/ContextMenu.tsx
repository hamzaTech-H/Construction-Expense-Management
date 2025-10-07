import { useRef, useEffect } from "react";
import { Button } from "@/components/base/buttons/button";
import { Edit05, Trash01, CreditCard01 } from "@untitledui/icons";
import { Expense } from "./types";

type ContextMenuProps = {
  x: number;
  y: number;
  visible: boolean;
  expense: Expense | null;
  onModify: (expense: Expense) => void;
  onAddPayment: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onClose: () => void;
};

export const ContextMenu = ({
  x,
  y,
  visible,
  expense,
  onModify,
  onAddPayment,
  onDelete,
  onClose,
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // optional: close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mouseup", handleClickOutside);
    return () => {
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, [onClose]);

  if (!visible || !expense) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] flex flex-col"
      style={{ left: x, top: y }}
    >
      <Button
        className="justify-start"
        color="tertiary"
        size="sm"
        iconLeading={<CreditCard01 data-icon />}
        onClick={() => onAddPayment(expense)}
      >
        Afficher les paiements
      </Button>
      
      <Button
        className="justify-start"
        color="tertiary"
        size="sm"
        iconLeading={<Edit05 data-icon />}
        onClick={() => onModify(expense)}
      >
        Modifier
      </Button>
      
      <Button
        className="justify-start"
        color="tertiary-destructive"
        size="sm"
        iconLeading={<Trash01 data-icon />}
        onClick={() => onDelete(expense)}
      >
        Supprimer
      </Button>
    </div>
  );
};
