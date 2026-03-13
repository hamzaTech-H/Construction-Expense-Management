import { useMemo, useState } from "react";
import { Check, EqualNot, FilterLines, SearchLg, X, } from "@untitledui/icons";
import { type SortDescriptor } from "react-aria-components";
import { Table, TableCard } from "@/components/application/table/table";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { ExpenseStatus, getExpenseStatusLabel } from "../shared/expense";
import { Expense, ProjectStats } from "./types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { ContextMenu } from "./ContextMenu";
import ExpensePaymentsModal from "./ExpensePaymentsModal";
import EditableCell from "./EditableCell";
import { Input } from "./components/base/input/input";
import { Button } from "./components/base/buttons/button";
import { Dropdown } from "./components/base/dropdown/dropdown";
import { Checkbox } from "./components/base/checkbox/checkbox";
import { useTranslation } from "react-i18next";

type ExpensesTableProps = {
  expenses: Expense[];

  setIsExpenseModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedExpense: React.Dispatch<React.SetStateAction<Expense | null>>
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setStats: React.Dispatch<React.SetStateAction<ProjectStats>>;
  selectedTabIndex: string | number;
};

export const ExpensesTable = ({ expenses, setIsExpenseModalOpen, setSelectedExpense, setExpenses, setStats, selectedTabIndex}: ExpensesTableProps) => {
    const { t, i18n } = useTranslation();

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

        const filtered = expenses.filter(({ description, status, category_id }) => {
            const matchesSearch = description.toLowerCase().includes(normalizedSearch);
            const matchesStatus =
                selectedStatuses.length === 0 || selectedStatuses.includes(status);
            
            const matchesCategory =
                selectedTabIndex === "all" || category_id === selectedTabIndex;

            return matchesSearch && matchesStatus && matchesCategory;
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
    }, [expenses, sortDescriptor, search,selectedStatuses, selectedTabIndex]);

    const handleContextMenu = (e: React.MouseEvent, expense: Expense) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            expense: expense,
        });
    };

    return (
        <>
            <div className="flex justify-start items-center gap-4 py-5">
                <Input icon={SearchLg} aria-label={t("Search")} placeholder={t("Search by description")} className="w-70" onChange={(value: string) => setSearch(value)} />

                <Dropdown.Root>
                    <Button size="md" color={isFiltered ? "primary" : "secondary"} iconLeading={FilterLines}>
                        {t("Status")}
                    </Button>

                    <Dropdown.Popover placement={i18n.dir() === "rtl" ? "bottom right" : "bottom left"}>
                        <Dropdown.Menu selectionMode="multiple">
                            <Dropdown.Section dir={i18n.dir()}>
                                <Dropdown.Item>
                                    <Checkbox label={getExpenseStatusLabel(t, ExpenseStatus.PAID)} size="sm" isSelected={selectedStatuses.includes(ExpenseStatus.PAID)}
                                        onChange={(checked) => handleCheckboxChange(ExpenseStatus.PAID, checked)}/>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <Checkbox label={getExpenseStatusLabel(t, ExpenseStatus.PARTIALLY_PAID)} size="sm"  isSelected={selectedStatuses.includes(ExpenseStatus.PARTIALLY_PAID)}
                                        onChange={(checked) => handleCheckboxChange(ExpenseStatus.PARTIALLY_PAID, checked)}/>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <Checkbox label={getExpenseStatusLabel(t, ExpenseStatus.NOT_PAID)} size="sm" isSelected={selectedStatuses.includes(ExpenseStatus.NOT_PAID)}
                                        onChange={(checked) => handleCheckboxChange(ExpenseStatus.NOT_PAID, checked)}/>
                                </Dropdown.Item>
                            </Dropdown.Section>
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </div>
            <TableCard.Root size="sm" className="flex flex-col">
                <TableCard.Header  className="flex items-center justify-between"
                    title={t("Expenses")}
                    badge={`${sortedItems.length} ${t("of")} ${expenses.length} ${t("expenses")}`}
                />

                <Table aria-label={t("Expenses")} selectionMode="none" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
                    <Table.Header className="sticky top-0 z-40">
                        <Table.Head id="description" label={t("Description")} isRowHeader />
                        <Table.Head id="date" label={t("Date")} allowsSorting />
                        <Table.Head id="status" label={t("Status")} allowsSorting />
                        <Table.Head id="amount_total" label={t("Total Amount (DA)")}/>
                        <Table.Head id="amount_paid" label={t("Amount Paid (DA)")}/>
                        <Table.Head id="amount_remaining" label={t("Remaining to Pay (DA)")}/>
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
                                            {getExpenseStatusLabel(t, item.status)}
                                        </BadgeWithIcon>
                                    ) : item.status === ExpenseStatus.PARTIALLY_PAID  ? (
                                        <BadgeWithIcon size="sm" color="gray" iconLeading={EqualNot} className="capitalize">
                                            {getExpenseStatusLabel(t, item.status)}
                                        </BadgeWithIcon>
                                    ) : (
                                        <BadgeWithIcon size="sm" color="error" iconLeading={X} className="capitalize">
                                            {getExpenseStatusLabel(t, item.status as ExpenseStatus)}
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
                        setSelectedExpense(contextMenu.expense)
                        setIsExpenseModalOpen(true);
                        closeContextMenu(); 
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
                                    entityLabel={t("Expense")}
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
