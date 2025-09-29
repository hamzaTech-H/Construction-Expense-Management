import { useParams } from "react-router-dom";
import { Link } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Plus, Printer } from '@untitledui/icons';
import { ProjectStatsCard } from './ProjectStatsCard';
import ExpenseModal from "./ExpenseModal";
import { useEffect, useState } from "react";


type ProjectStats = {
  total: number | null;
  paid: number | null;
  remaining: number | null;
};


export default function ProjectPage() {
  const {projectId} = useParams<{ projectId: string }>();
  const id = Number(projectId); 
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false); 
  const [stats, setStats] = useState<ProjectStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const result: ProjectStats = await window.database.getProjectStats(id);
      setStats(result);
    }
    fetchStats();
  }, [id]);

  return (
  <div className="container mx-auto mt-8 px-4">
    {/* Top row: Back link (left) and Buttons (right) */}
    <div className="flex items-center justify-between mb-8">
      <Link
        href="/"
        className="text-blue-600 hover:underline text-sm font-medium"
      >
        ← Retour aux projets
      </Link>

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
          onClick={() => setIsExpenseModalOpen(true)}
        >
          Ajouter dépense
        </Button>
      </div>
    </div>

    {/* Project stats row */}
    <div className="flex flex-wrap gap-6 mb-8">
      <ProjectStatsCard
        title="Total Budget"
        value={stats?.total ?? 0}
        colorClasses="bg-blue-100 text-blue-900 border-l-4 border-blue-500"
      />
      <ProjectStatsCard
        title="Total Paid"
        value={stats?.paid ?? 0}
        colorClasses="bg-green-100 text-green-900 border-l-4 border-green-500"
      />
      <ProjectStatsCard
        title="Remaining"
        value={stats?.remaining ?? 0}
        colorClasses="bg-red-100 text-red-900 border-l-4 border-red-500"
      />
    </div>

    {/* Modal */}
    {isExpenseModalOpen && (
      <ExpenseModal setIsModalOpen={setIsExpenseModalOpen} />
    )}
  </div>
);
}