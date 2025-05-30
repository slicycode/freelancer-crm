"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, ProjectStatus } from "@/types";
import { BarChart4, Calendar, Search, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProjectListViewProps {
  projects: Project[];
}

export function ProjectListView({ projects }: ProjectListViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<string>("all");

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.clientName && project.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "ACTIVE":
        return "status-success";
      case "PROPOSAL":
        return "status-info";
      case "ON_HOLD":
        return "status-warning";
      case "COMPLETED":
        return "bg-secondary text-secondary-foreground";
      case "CANCELED":
        return "status-error";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "PROPOSAL":
        return "Proposal";
      case "ON_HOLD":
        return "On Hold";
      case "COMPLETED":
        return "Completed";
      case "CANCELED":
        return "Canceled";
      default:
        return status;
    }
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="proposal">Proposals</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <ProjectGrid
              projects={filteredProjects}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              emptyMessage={
                searchQuery
                  ? "No projects match your search"
                  : "No projects yet. Create your first project to get started."
              }
            />
          </TabsContent>
          <TabsContent value="active" className="mt-4">
            <ProjectGrid
              projects={filteredProjects.filter(p => p.status === "ACTIVE")}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              emptyMessage={
                searchQuery
                  ? "No active projects match your search"
                  : "No active projects."
              }
            />
          </TabsContent>
          <TabsContent value="proposal" className="mt-4">
            <ProjectGrid
              projects={filteredProjects.filter(p => p.status === "PROPOSAL")}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              emptyMessage={
                searchQuery
                  ? "No proposals match your search"
                  : "No proposals."
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ProjectGridProps {
  projects: Project[];
  getStatusColor: (status: ProjectStatus) => string;
  getStatusLabel: (status: ProjectStatus) => string;
  emptyMessage: string;
}

function ProjectGrid({ projects, getStatusColor, getStatusLabel, emptyMessage }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="block p-6 rounded-lg card-elevated hover-lift shine"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-1 mr-2">
              <div className={`p-1 rounded ${project.status === "ACTIVE" ? "status-bg-success" :
                project.status === "PROPOSAL" ? "status-bg-primary" :
                  project.status === "ON_HOLD" ? "status-bg-warning" :
                    project.status === "COMPLETED" ? "bg-secondary" :
                      "status-bg-danger"
                }`}>
                <BarChart4 className={`h-4 w-4 ${project.status === "ACTIVE" ? "text-chart-2" :
                  project.status === "PROPOSAL" ? "text-chart-1" :
                    project.status === "ON_HOLD" ? "text-chart-3" :
                      project.status === "COMPLETED" ? "text-secondary-foreground" :
                        "text-destructive"
                  }`} />
              </div>
              <h2 className="font-semibold truncate flex-1 text-headline">{project.name}</h2>
            </div>
            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>

          {project.description && (
            <p className="text-sm text-body line-clamp-2 mb-3">
              {project.description}
            </p>
          )}

          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <User className="h-4 w-4 mr-1" />
            <span className="truncate">
              {project.clientName}
              {project.clientCompany && ` (${project.clientCompany})`}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                {project.lastActivity ? formatDate(project.lastActivity.toString()) : "No activity"}
              </span>
            </div>
            <span>
              {project.communicationCount || 0} communication{(project.communicationCount || 0) === 1 ? "" : "s"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
} 