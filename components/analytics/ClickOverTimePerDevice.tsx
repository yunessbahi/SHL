import { Button } from "@/components/ui/button";
import {
  LaptopMinimal,
  RefreshCw,
  Smartphone,
  TabletSmartphoneIcon,
} from "lucide-react";
import React, { useState } from "react";

interface Project {
  name: string;
  icon: React.ReactNode;
  tasksCompleted: number;
  totalTasks: number;
  colorClass: string;
}

interface ProjectDashboardCardProps {
  // Chart section props
  chartComponent: React.ReactNode;

  // Project List section props
  projectListTitle?: string;
  projectListSubtitle?: string;
  projects?: Project[];

  // Refresh props
  onRefresh?: () => Promise<void>;

  // Layout props
  showProjectList?: boolean;
  className?: string;
}

const ProjectDashboardCard: React.FC<ProjectDashboardCardProps> = ({
  chartComponent,
  projectListTitle = "",
  projectListSubtitle = "",
  projects: customProjects,
  onRefresh,
  showProjectList = true,
  className = "",
}) => {
  const [refreshLoading, setRefreshLoading] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshLoading(true);
    try {
      await onRefresh();
    } finally {
      setRefreshLoading(false);
    }
  };
  const defaultProjects: Project[] = [
    {
      name: "Mobile",
      icon: <Smartphone className="size-4.25" />,
      tasksCompleted: 840,
      totalTasks: 2500,
      colorClass: "bg-chart-2/10 text-chart-5",
    },
    {
      name: "Desktop",
      icon: <LaptopMinimal className="size-4.25" />,
      tasksCompleted: 99,
      totalTasks: 1420,
      colorClass: "bg-chart-5/10 text-chart-2",
    },
    {
      name: "Other",
      icon: <TabletSmartphoneIcon className="size-4.25" />,
      tasksCompleted: 58,
      totalTasks: 100,
      colorClass: "bg-chart-3/10 text-chart-3",
    },
  ];

  const projects = customProjects || defaultProjects;

  return (
    <div
      className={`bg-muted text-card-foreground border-l ansparent grid gap-0 ${
        showProjectList ? "lg:grid-cols-3" : "lg:grid-cols-1"
      } w-full ${className}`}
    >
      {/* Chart Section - TimeSeriesChart already has Card wrapper */}
      <div
        className={`flex flex-col h-full ${showProjectList ? "max-lg:border-b lg:col-span-2 lg:border-r" : ""}`}
      >
        {chartComponent}
      </div>

      {/* Project List Section */}
      {showProjectList && (
        <div className="flex flex-col justify-between gap-8 py-6">
          <div className="flex justify-between gap-2 px-6">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold">{projectListTitle}</span>
              <span className="text-muted-foreground text-sm">
                {projectListSubtitle}
              </span>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshLoading ? "animate-spin" : ""}`}
                />
              </Button>
            )}
          </div>

          <div className="px-6">
            <div className="flex h-full flex-col justify-between gap-6">
              {projects.map((project, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="relative flex shrink-0 overflow-hidden size-8.5 rounded-sm">
                    <span
                      className={`flex size-full items-center justify-center shrink-0 rounded-sm ${project.colorClass}`}
                    >
                      {project.icon}
                    </span>
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{project.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {project.totalTasks > 0
                        ? `${((project.tasksCompleted / project.totalTasks) * 100).toFixed(1)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboardCard;
