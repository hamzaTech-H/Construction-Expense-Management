import { useMemo, useState } from "react";
import { Check, EqualNot, FilterLines, Plus, Printer, SearchLg, X, } from "@untitledui/icons";
import { type SortDescriptor } from "react-aria-components";
import { Table, TableCard } from "@/components/application/table/table";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { ExpenseStatus } from "../shared/expense";
import { Expense, ProjectStats } from "./types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { ContextMenu } from "./ContextMenu";
import ExpensePaymentsModal from "./ExpensePaymentsModal";
import EditableCell from "./EditableCell";
import { Input } from "./components/base/input/input";
import { Button } from "./components/base/buttons/button";
import { Dropdown } from "./components/base/dropdown/dropdown";
import { Checkbox } from "./components/base/checkbox/checkbox";

type ExpensesTableProps = {
  expenses: Expense[];
  projectData: {
    id: number;
    name: string;
  };
  setIsExpenseModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedExpense: React.Dispatch<React.SetStateAction<Expense | null>>
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setStats: React.Dispatch<React.SetStateAction<ProjectStats>>;
};

export const ExpensesTable = ({ expenses, projectData, setIsExpenseModalOpen, setSelectedExpense, setExpenses, setStats}: ExpensesTableProps) => {
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "",
        direction: "ascending",
    });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isExpensePaymentsModalOpen, setIsExpensePaymentsModalOpen] = useState(false);

    const closeContextMenu = () =>
        setContextMenu((prev) => ({
            ...prev,
            visible: false,
        }));
    
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        expense: Expense | null;
    }>({
        visible: false,
        x: 0,
        y: 0,
        expense: null,
    });
    
    const [search, setSearch] = useState<string>("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    const handleCheckboxChange = (id: string, checked: boolean) => {
        setSelectedStatuses((prev) => {
        if (checked) {
            return [...new Set([...prev, id])];
        } else {
            return prev.filter((status) => status !== id);
        }
        });
    };

    const isFiltered = selectedStatuses.length > 0;

    const sortedItems = useMemo(() => {
        const normalizedSearch = search.toLowerCase();

        const filtered = expenses.filter(({ description, status }) => {
            const matchesSearch = description.toLowerCase().includes(normalizedSearch);
            const matchesStatus =
                selectedStatuses.length === 0 || selectedStatuses.includes(status);

            return matchesSearch && matchesStatus;
        });

        return filtered.sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Expense];
            const second = b[sortDescriptor.column as keyof Expense];

            if ((typeof first === "number" && typeof second === "number") || (typeof first === "boolean" && typeof second === "boolean")) {
                return sortDescriptor.direction === "descending" ? second - first : first - second;
            }

            if (typeof first === "string" && typeof second === "string") {
                let cmp = first.localeCompare(second);
                if (sortDescriptor.direction === "descending") {
                    cmp *= -1;
                }
                return cmp;
            }

            return 0;
        });
    }, [expenses, sortDescriptor, search,selectedStatuses]);

    const handleContextMenu = (e: React.MouseEvent, expense: Expense) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            expense: expense,
        });
    };

    function handlePrint() {
       window.pdf.print(projectData.id);
    }

    return (
        <>
            <TableCard.Root size="sm" className="flex flex-col">
                <TableCard.Header  className="flex items-center justify-between"
                    title={`Projet: ${projectData.name}`}
                    badge={`${expenses.length} dépenses`}
                    contentTrailing={
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                color="secondary"
                                size="md"
                                iconLeading={<Printer data-icon />}
                                onClick={handlePrint}
                            >
                                Imprimer
                            </Button>
                            <Button
                                size="md"
                                iconLeading={<Plus data-icon />}
                                onClick={() => {
                                setSelectedExpense(null)
                                setIsExpenseModalOpen(true)
                                }}
                            >
                                Ajouter dépense
                            </Button>

                        </div>
                    }
                />

                <div className="flex justify-start items-center gap-4 border-b border-secondary px-4 py-3">
                    <Input icon={SearchLg} aria-label="Search" placeholder="Recherche par description" className="w-70" onChange={(value: string) => setSearch(value)} />

                    <Dropdown.Root>
                        <Button size="md" color={isFiltered ? "primary" : "secondary"} iconLeading={FilterLines}>
                            Status
                        </Button>

                        <Dropdown.Popover placement="bottom left">
                            <Dropdown.Menu selectionMode="multiple">
                                <Dropdown.Section>
                                    <Dropdown.Item>
                                        <Checkbox label={`${ExpenseStatus.PAID}`} size="sm" isSelected={selectedStatuses.includes(ExpenseStatus.PAID)}
                                            onChange={(checked) => handleCheckboxChange(ExpenseStatus.PAID, checked)}/>
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        <Checkbox label={`${ExpenseStatus.PARTIALLY_PAID}`} size="sm"  isSelected={selectedStatuses.includes(ExpenseStatus.PARTIALLY_PAID)}
                                            onChange={(checked) => handleCheckboxChange(ExpenseStatus.PARTIALLY_PAID, checked)}/>
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        <Checkbox label={`${ExpenseStatus.NOT_PAID}`} size="sm" isSelected={selectedStatuses.includes(ExpenseStatus.NOT_PAID)}
                                            onChange={(checked) => handleCheckboxChange(ExpenseStatus.NOT_PAID, checked)}/>
                                    </Dropdown.Item>
                                </Dropdown.Section>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>
                </div>

                <Table aria-label="Team members" selectionMode="none" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
                    <Table.Header className="sticky top-0 z-40">
                        <Table.Head id="description" label="Description" isRowHeader />
                        <Table.Head id="date" label="Date" allowsSorting />
                        <Table.Head id="status" label="Status" allowsSorting />
                        <Table.Head id="amount_total" label="Montant Total (DA)"/>
                        <Table.Head id="amount_paid" label="Montant Payé (DA)"/>
                        <Table.Head id="amount_remaining" label="Reste à Payer (DA)"/>
                    </Table.Header>
                    <Table.Body items={sortedItems} className="flex-1">
                        {(item) => (
                            <Table.Row 
                                id={item.id} 
                                className="odd:bg-secondary_subtle"
                                onContextMenu={(e) => handleContextMenu(e, item)}
                            >
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
                                <EditableCell expense={item} setExpenses={setExpenses} setStats={setStats}/>
                                <Table.Cell className="font-medium text-primary font-mono"> {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.amount_paid)} </Table.Cell>
                                <Table.Cell className="font-medium text-primary font-mono"> {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.amount_remaining)} </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </TableCard.Root>

            {/* Context Menu */}
            {contextMenu.visible && contextMenu.expense && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    visible={contextMenu.visible}
                    expense={contextMenu.expense}
                    onModify={() => {
                        setIsExpenseModalOpen(true);
                        closeContextMenu();
                        setSelectedExpense(contextMenu.expense)
                    }}
                    onAddPayment={() => {
                        setIsExpensePaymentsModalOpen(true);
                        closeContextMenu();
                    }}
                    onDelete={() => {
                        setIsConfirmOpen(true);
                        closeContextMenu();
                    }}
                    onClose={closeContextMenu}
                    />
            )}

            {isConfirmOpen && contextMenu.expense && (
                <ConfirmDeleteModal
                    setIsConfirmOpen={setIsConfirmOpen}
                    name={contextMenu.expense.description}
                    id={contextMenu.expense.id}
                    entityLabel="Dépense"
                    onDelete={async (id) => {
                        const exp = contextMenu.expense!;
                        await window.database.deleteExpense(id);

                        setExpenses(prev => prev.filter(e => e.id !== exp.id));
                        setStats(prev => prev && {
                            total: prev.total - exp.amount_total,
                            paid: prev.paid - exp.amount_paid,
                            remaining: prev.remaining - exp.amount_remaining
                        });
                    }}
                />
            )}

            {isExpensePaymentsModalOpen && (
                <ExpensePaymentsModal setIsPaymentsModalOpen={setIsExpensePaymentsModalOpen} expense={contextMenu.expense!} setExpenses={setExpenses} setStats={setStats}/>
            )}
        </>
    );
};
