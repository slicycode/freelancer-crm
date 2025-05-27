"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Project, ProjectStatus } from "@/types";
import { Search, Calendar, User } from "lucide-react";
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
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "PROPOSAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "CANCELED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
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
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
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
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="block p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-3">
            <h2 className="font-semibold truncate flex-1 mr-2">{project.name}</h2>
            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>

          {project.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
              {project.description}
            </p>
          )}

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
            <User className="h-4 w-4 mr-1" />
            <span className="truncate">
              {project.clientName}
              {project.clientCompany && ` (${project.clientCompany})`}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
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