import { useMemo, useState } from "react";
import { CalendarDate, Check, ChevronRight, EqualNot, FilterLines, Plus, Printer, SearchLg, User01, X, } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { Table, TableCard, TableRowActionsDropdown } from "@/components/application/table/table";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { ExpenseStatus } from "../shared/expense";
import { Expense, ProjectStats } from "./types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { ContextMenu } from "./ContextMenu";
import ExpensePaymentsModal from "./ExpensePaymentsModal";
import EditableCell from "./EditableCell";
import { Input } from "./components/base/input/input";
import { MultiSelect } from "./components/base/select/multi-select";
import { useListData } from "react-stately";
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

type StatusItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
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
    const selectedItems = useListData<StatusItem>({
        initialItems: [],
    });

    const sortedItems = useMemo(() => {
        const normalizedSearch = search.toLowerCase();

        const selectedStatusIds = selectedItems.items.map((item) => item.id);

        const filtered = expenses.filter(({ description, status }) => {
            const matchesSearch = description.toLowerCase().includes(normalizedSearch);

        // If no status filter selected, show all
            const matchesStatus =
                selectedStatusIds.length === 0 || selectedStatusIds.includes(status);

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
    }, [expenses, sortDescriptor, search,selectedItems.items]);

    const handleContextMenu = (e: React.MouseEvent, expense: Expense) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            expense: expense,
        });
    };

    const items = [
        { label: ExpenseStatus.PAID, id: ExpenseStatus.PAID, icon: Check },
        { label: ExpenseStatus.PARTIALLY_PAID, id: ExpenseStatus.PARTIALLY_PAID, icon: EqualNot },
        { label: ExpenseStatus.NOT_PAID, id: ExpenseStatus.NOT_PAID, icon: X },
    ];

    function handlePrint() {
       window.pdf.print(projectData.id);
    }


    const [openMultiSelect, setOpenMultiSelect] = useState(false);

    const handleSelectionChange = (selection) => {
        console.log(selection);
        if (selection?.currentKey === "status") {
        setOpenMultiSelect(true); // open multiselect
        } else {
        setOpenMultiSelect(false);
        }
    };

    return (
        <>
            {/* <div className="relative flex items-end gap-3 mb-10">
                <MultiSelect
                    label="status"
                    placeholderIcon={null}
                    isRequired
                    selectedItems={selectedItems}
                    placeholder="Status"
                    items={items}
                >
                    {(item) => (
                        <MultiSelect.Item id={item.id} icon={item.icon}>
                            {item.label}
                        </MultiSelect.Item>
                    )}
                </MultiSelect>
                
            </div> */}
        
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
                        <Button size="md" color="secondary" iconLeading={FilterLines}>
                            Filters
                        </Button>
 
                        <Dropdown.Popover placement="bottom left">
                            <Dropdown.Menu onSelectionChange={handleSelectionChange}>
                                <Dropdown.Section>
                                    <Dropdown.Item id="status" icon={User01}>
                                        <div className="flex items-center justify-between w-full">
                                            Status
                                            <ChevronRight size={16} className="text-fg-quaternary" />
                                            
                                        </div>
                                    </Dropdown.Item>
                                    <Dropdown.Item id="date" icon={CalendarDate}>
                                        <div className="flex items-center justify-between w-full">
                                            Date
                                            <ChevronRight size={16} className="text-fg-quaternary" />
                                        </div>
                                    </Dropdown.Item>
                                    
                                </Dropdown.Section>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>

                    <Dropdown.Root>
                        <Button size="md" color="secondary" iconLeading={FilterLines}>
                            status
                        </Button>
 
                        <Dropdown.Popover placement="bottom left">
                            <Dropdown.Menu selectionMode="multiple" onSelectionChange={handleSelectionChange}>
                                <Dropdown.Section>
                                    <Dropdown.Item id="status">
                                        <Checkbox label={`${ExpenseStatus.PAID}`} size="sm" />
                                    </Dropdown.Item>
                                    <Dropdown.Item id="date">
                                        <Checkbox label={`${ExpenseStatus.PARTIALLY_PAID}`} size="sm" />
                                    </Dropdown.Item>
                                    <Dropdown.Item id="stas">
                                        <Checkbox label={`${ExpenseStatus.NOT_PAID}`} size="sm" />
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
