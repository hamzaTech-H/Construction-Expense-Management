
import { Calendar, User, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ProgressBar } from "./components/base/progress-indicators/progress-indicators";
import { Badge } from "./components/base/badges/badges";
import { Dropdown } from "./components/base/dropdown/dropdown";
import { Edit05, Trash01 } from "@untitledui/icons";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { Project } from "./types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ProjectCardProps {
  project: Project;
  spent?: number;
  onClick?: () => void;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>;
    fetchProjects: ()=>void;
}

export function ProjectCard({ project, spent, onClick, setIsModalOpen, setSelectedProject, fetchProjects }: ProjectCardProps) {
  const { t, i18n } = useTranslation();
  const currencySymbol = i18n.language === 'ar' ? 'دج' : 'DA';
  const isOverBudget = project.budget !== null && spent !== undefined && spent > project.budget;
  const spentPercentage = project.budget && spent ? (spent / project.budget) * 100 : 0;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  return (
    <>
        <Card
            className="w-full max-w-sm cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
            onClick={onClick}
            >
            <CardHeader className="flex items-start justify-between mb-3">
                <CardTitle className="pr-8 font-semibold">{project.name}</CardTitle>
                <Dropdown.Root>
                    <Dropdown.DotsButton onMouseEnter={(e) => e.stopPropagation()} />
                    <Dropdown.Popover>
                        <Dropdown.Menu>
                            <Dropdown.Item
                            icon={Edit05}
                            onClick={() => {
                                setIsModalOpen(true);
                                setSelectedProject(project);
                            }}
                            >
                                {t("Edit")}
                            </Dropdown.Item>
                            <Dropdown.Item
                            icon={Trash01}
                            onClick={() => {
                                setIsConfirmOpen(true);
                            }}
                            >
                                {t("Delete")}
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("Client")}:</span>
                    {project.client ? (
                        <span>{project.client}</span>
                    ) : (
                        <Badge type="color" color="gray" size="sm">
                            {t("Not specified")}
                        </Badge>
                    )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("Date")}:</span>
                    <span>{project.date}</span>
                </div>
                
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("Budget")}:</span>
                        {project.budget !== null ? (
                            <span>{new Intl.NumberFormat("en-US", {minimumFractionDigits: 2,maximumFractionDigits: 2}).format(project.budget)} {currencySymbol}</span>
                            ) : (
                                <Badge type="color" color="gray" size="sm">
                                    {t("Budget not available")}
                                </Badge>
                        )}
                    </div>
                
                    {project.budget !== null && spent !== undefined && (
                        <>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("Spent")}:</span>
                                <span className={isOverBudget ? "text-red-600" : "text-green-600"}>
                                {new Intl.NumberFormat("en-US", {minimumFractionDigits: 2,maximumFractionDigits: 2}).format(spent)} {currencySymbol}
                                </span>
                                {isOverBudget && (
                                <Badge type="color" color="error" size="sm">
                                    {t("Over Budget")}
                                </Badge>
                                )}
                            </div>
                            
                            <ProgressBar min={0} max={100} value={Math.min(spentPercentage, 100) }  className={isOverBudget ? "[&>div]:bg-red-600" : "[&>div]:bg-green-600"}/>
               
                            <div className="text-sm text-muted-foreground">
                                {spentPercentage.toFixed(1)}% {t("of budget used")}
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>

        {isConfirmOpen && (
            <ConfirmDeleteModal
                setIsConfirmOpen={setIsConfirmOpen}
                name={project.name}
                id={project.id}
                entityLabel={t("Project")}
                onDelete={async (id) => {
                await window.database.deleteProject(id);
                fetchProjects();
                }}
            />
        )}
    </>
  );
}