import { useParams, useSearchParams } from "react-router-dom";
import { Key } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ProjectStatsCard } from './ProjectStatsCard';
import ExpenseModal from "./ExpenseModal";
import { useEffect, useState } from "react";
import { ExpensesTable } from "./ExpensesTable";
import { Expense, ProjectStats } from "./types";
import { ExpensesTabs } from "./ExpensesTabs"
import { Plus, Printer } from "lucide-react";


export default function ProjectPage() {
  const {projectId} = useParams<{ projectId: string }>();
  const id = Number(projectId); 
  const [searchParams] = useSearchParams();
  
  const projectName = searchParams.get('name'); 
  
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  useEffect(() => {
    async function fetchCategories() {
      const categories = await window.database.getExpenseCategoriesByProject(Number(projectId));
      // Ensure it's an array
      setExpenseCategories(Array.isArray(categories) ? categories : []);
    }

    fetchCategories();
  }, [projectId]);

  const [selectedTabIndex, setSelectedTabIndex] = useState<Key>("all");

  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    paid: 0,
    remaining: 0,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null); 
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [statsResult, expensesResult] = await Promise.all([
      window.database.getProjectStats(id),
      window.database.getExpensesByProject(id),
    ]);
    setStats(statsResult);
    setExpenses(expensesResult);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500 animate-pulse text-lg">
          Chargement du projet...
        </div>
      </div>
    );
  }

  function handlePrint() {
       window.pdf.print(id);
  }

  return (
    <div className="h-screen flex flex-col py-4 px-2" id='rapport'>
      
      {/* Project stats row */}
    <div className="flex flex-wrap gap-6 mb-4">
      {stats ? (
        <>
          <ProjectStatsCard
            title="Montant total du projet"
            value={stats.total}
            colorClasses="bg-blue-100 text-blue-900 border-l-4 border-blue-500"
          />
          <ProjectStatsCard
            title="Montant total payé"
            value={stats.paid}
            colorClasses="bg-green-100 text-green-900 border-l-4 border-green-500"
          />
          <ProjectStatsCard
            title="Montant restant à payer"
            value={stats.remaining}
            colorClasses="bg-red-100 text-red-900 border-l-4 border-red-500"
          />
        </>
      ) : (
        <div className="text-gray-400 animate-pulse">Chargement des stats...</div>
      )}
    </div>
    
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

      <ExpensesTabs tabs={[{ id: "all", label: "All" }, ...expenseCategories.map(c => ({ id: c.id, label: c.name }))]} selectedTabIndex={selectedTabIndex} setSelectedTabIndex={setSelectedTabIndex}/>

      <ExpensesTable projectData={{ id, name:projectName! }} expenses={expenses} setIsExpenseModalOpen={setIsExpenseModalOpen} setSelectedExpense={setSelectedExpense} setExpenses={setExpenses} setStats={setStats} selectedTabIndex={selectedTabIndex} />

      {/* Modal */}
      {isExpenseModalOpen && (
        <ExpenseModal setIsModalOpen={setIsExpenseModalOpen} expense={selectedExpense} setExpenses={setExpenses} setStats={setStats}/>
      )}
    </div>
  );
}