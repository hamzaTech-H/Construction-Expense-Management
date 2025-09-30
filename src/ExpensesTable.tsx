import { useMemo, useState, useEffect } from "react";
import { Check, EqualNot, X } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { Table, TableCard } from "@/components/application/table/table";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { ExpenseStatus } from "../shared/expense";


type ExpensesTableProps = {
  projectId: number;
  refreshKey: number;
};

type Expense = {
  id: number;
  project_id: number;
  description: string;
  date: string;
  amount_total: number;
  amount_paid: number;
  amount_remaining: number;
  status: string;
  created_at: string;
};

export const ExpensesTable = ({ projectId, refreshKey }: ExpensesTableProps) => {
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "",
        direction: "ascending",
    });

    const [expenses, setExpenses] = useState<Expense[]>([]);

  // Fetch from DB
    useEffect(() => {
        async function fetchExpenses() {
        const result = await window.database.getExpensesByProject(projectId);
        setExpenses(result);
        }
        fetchExpenses();
    }, [projectId, refreshKey]);
    
    const sortedItems = useMemo(() => {
        return [...expenses].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Expense];
            const second = b[sortDescriptor.column as keyof Expense];

            // Compare numbers or booleans
            if ((typeof first === "number" && typeof second === "number") || (typeof first === "boolean" && typeof second === "boolean")) {
                return sortDescriptor.direction === "descending" ? second - first : first - second;
            }

            // Compare strings
            if (typeof first === "string" && typeof second === "string") {
                let cmp = first.localeCompare(second);
                if (sortDescriptor.direction === "descending") {
                    cmp *= -1;
                }
                return cmp;
            }

            return 0;
        });
    }, [expenses, sortDescriptor]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("");
    };

    return (
        <TableCard.Root className="flex-1 overflow-auto" size="sm">
            <Table aria-label="Team members" selectionMode="none" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
                <Table.Header>
                    <Table.Head id="description" label="Description" isRowHeader />
                    <Table.Head id="date" label="Date" allowsSorting />
                    <Table.Head id="status" label="Status" allowsSorting />
                    <Table.Head id="amount_total" label="Montant Total" />
                    <Table.Head id="amount_paid" label="Montant Payé" />
                    <Table.Head id="amount_remaining" label="Reste à Payer" />
                </Table.Header>
                <Table.Body items={sortedItems}>
                    {(item) => (
                        <Table.Row id={item.id} className="odd:bg-secondary_subtle" >
                            <Table.Cell className="font-medium text-primary">{item.description}</Table.Cell>
                            <Table.Cell className="whitespace-nowrap">{item.date}</Table.Cell>
                            <Table.Cell>
                                {item.status === ExpenseStatus.PAID ? (
                                    <BadgeWithIcon size="sm" color="success" iconLeading={Check} className="capitalize">
                                        {item.status}
                                    </BadgeWithIcon>
                                ) : item.status === ExpenseStatus.PARTIALLY_PAID  ? (
                                    <BadgeWithIcon size="sm" color="gray" iconLeading={EqualNot} className="capitalize">
                                        {item.status}
                                    </BadgeWithIcon>
                                ) : (
                                    <BadgeWithIcon size="sm" color="error" iconLeading={X} className="capitalize">
                                        {item.status}
                                    </BadgeWithIcon>
                                )}
                            </Table.Cell>
                            <Table.Cell className="font-medium text-primary">{item.amount_total}.00 DA</Table.Cell>
                            <Table.Cell className="font-medium text-primary">{item.amount_paid}.00 DA</Table.Cell>
                            <Table.Cell className="font-medium text-primary">{item.amount_remaining}.00 DA</Table.Cell>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>
        </TableCard.Root>
    );
};
