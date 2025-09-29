interface ProjectStatsCardProps {
  /** The primary label for the card (e.g., "Total Budget") */
  title: string;
  /** The main numeric value (e.g., "$15,000") */
  value: number;
  /** Tailwind CSS classes for background and border color */
  colorClasses: string;
}

export const ProjectStatsCard: React.FC<ProjectStatsCardProps> = ({ title, value, colorClasses }) => {
  return (
    <div className={`p-4 rounded-lg shadow-md flex-1 min-w-[200px] ${colorClasses}`}>
      <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
      <p className="text-3xl font-bold">{value} DA</p>
    </div>
  );
};