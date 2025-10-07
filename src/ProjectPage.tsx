import { useParams, useSearchParams } from "react-router-dom";
import { Link } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Plus, Printer, ArrowNarrowLeft} from '@untitledui/icons';
import { ProjectStatsCard } from './ProjectStatsCard';
import ExpenseModal from "./ExpenseModal";
import { useEffect, useState } from "react";
import { ExpensesTable } from "./ExpensesTable";
import { Expense, ProjectStats } from "./types";


export default function ProjectPage() {
  const {projectId} = useParams<{ projectId: string }>();
  const id = Number(projectId); 
  const [searchParams] = useSearchParams();
  
  const projectName = searchParams.get('name'); 
  
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

  return (
    <div className="h-screen flex flex-col py-4 px-2">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          <Button color="link-gray" size="md" iconLeading={<ArrowNarrowLeft data-icon />} aria-label="Button CTA" />
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 text-center tracking-tight truncate">
          Projet: {projectName}
        </h1>

        <div className="flex gap-3">
          <Button
            color="secondary"
            size="md"
            iconLeading={<Printer data-icon />}
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
      </div>

      {/* Project stats row */}
    <div className="flex flex-wrap gap-6 mb-4">
      {stats ? (
        <>
          <ProjectStatsCard
            title="Total général"
            value={stats.total}
            colorClasses="bg-blue-100 text-blue-900 border-l-4 border-blue-500"
          />
          <ProjectStatsCard
            title="Total payé"
            value={stats.paid}
            colorClasses="bg-green-100 text-green-900 border-l-4 border-green-500"
          />
          <ProjectStatsCard
            title="Total restant"
            value={stats.remaining}
            colorClasses="bg-red-100 text-red-900 border-l-4 border-red-500"
          />
        </>
      ) : (
        <div className="text-gray-400 animate-pulse">Chargement des stats...</div>
      )}
    </div>

      <ExpensesTable expenses={expenses} setIsExpenseModalOpen={setIsExpenseModalOpen} setSelectedExpense={setSelectedExpense} setExpenses={setExpenses} setStats={setStats}/>

      {/* Modal */}
      {isExpenseModalOpen && (
        <ExpenseModal setIsModalOpen={setIsExpenseModalOpen} expense={selectedExpense} setExpenses={setExpenses} setStats={setStats}/>
      )}
    </div>
  );
}