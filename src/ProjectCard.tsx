interface ProjectCardProps {
  name: string;
  date: string;
  description?: string;
}

export default function ProjectCard({ name, date, description }: ProjectCardProps) {
  return (
    <div className="max-w-sm w-full bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
      
      {/* Project Name */}
      <h2 className="text-xl font-semibold text-gray-800 mb-1">{name}</h2>

      {/* Date */}
      <p className="text-sm text-gray-500 mb-3">{date}</p>

      {/* Optional Description */}
      {description && <p className="text-gray-600 text-sm">{description}</p>}
      
    </div>
  );
}
