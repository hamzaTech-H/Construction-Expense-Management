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
import { useTranslation } from "react-i18next";


export default function ProjectPage() {
  const { t, i18n } = useTranslation();
  const {projectId} = useParams<{ projectId: string }>();
  const id = Number(projectId); 
  const [searchParams] = useSearchParams();
  
  const projectName = searchParams.get('name'); 
  const projectDescription =  searchParams.get('description'); 

  const [tabs, setTabs] = useState<{ id: string | number; label: string }[]>([]);
  
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchCategories() {
      const categories = await window.database.getExpenseCategoriesByProject(Number(projectId));
      // Ensure it's an array
      setExpenseCategories(Array.isArray(categories) ? categories : []);
    }

    fetchCategories();
  }, [projectId]);

  useEffect(() => {
    const generatedTabs = [
      { id: "all", label: t("All") },
      ...expenseCategories.map(c => ({
        id: c.id,
        label: i18n.language === "ar" ? c.ar_name : c.fr_name,
      })),
    ];

    setTabs(generatedTabs);
  }, [expenseCategories]);

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
          {t("Loading project...")}
        </div>
      </div>
    );
  }

  function handlePrint() {
       window.pdf.print(id);
  }

  return (
    <div className="h-screen flex flex-col py-4 px-8" id='rapport'>
      
      {/* Project stats row */}
      <div className="flex flex-wrap gap-6 mb-4">
        {stats ? (
          <>
            <ProjectStatsCard
              title={t("Total project amount")}
              value={stats.total.toFixed(2)}
              colorClasses="bg-blue-100 text-blue-900 border-l-4 border-blue-500"
            />
            <ProjectStatsCard
              title={t("Total amount paid")}
              value={stats.paid.toFixed(2)}
              colorClasses="bg-green-100 text-green-900 border-l-4 border-green-500"
            />
            <ProjectStatsCard
              title={t("Remaining amount to pay")}
              value={stats.remaining.toFixed(2)}
              colorClasses="bg-red-100 text-red-900 border-l-4 border-red-500"
            />
          </>
        ) : (
          <div className="text-gray-400 animate-pulse">{t("Loading stats...")}</div>
        )}
      </div>
    
      <div className="flex items-center justify-between mb-5">
        {/* Left side: title + description */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{projectName}</h2>
          <p className="text-base text-gray-600 mt-1">{projectDescription}</p>
        </div>

        {/* Right side: buttons */}
        <div className="flex items-center gap-3">
          <Button
            color="secondary"
            size="md"
            iconLeading={<Printer data-icon />}
            onClick={handlePrint}
          >
            {t("Print")}
          </Button>

          <Button
            size="md"
            iconLeading={<Plus data-icon />}
            onClick={() => {
              setSelectedExpense(null);
              setIsExpenseModalOpen(true);
            }}
          >
            {t("Add expense")}
          </Button>
        </div>
      </div>

      <ExpensesTabs tabs={tabs} selectedTabIndex={selectedTabIndex} setSelectedTabIndex={setSelectedTabIndex} />

      <ExpensesTable expenses={expenses} setIsExpenseModalOpen={setIsExpenseModalOpen} setSelectedExpense={setSelectedExpense} setExpenses={setExpenses} setStats={setStats} selectedTabIndex={selectedTabIndex}/>

      {/* Modal */}
      {isExpenseModalOpen && (
        <ExpenseModal
          setIsModalOpen={setIsExpenseModalOpen}
          expense={selectedExpense}
          setExpenses={setExpenses}
          setStats={setStats}
          setExpenseCategories={setExpenseCategories}
          activeTabCategoryId={selectedTabIndex === "all" ? undefined : selectedTabIndex}
        />
      )}
    </div>
  );
}