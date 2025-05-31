"use client";

import { updateProject } from "@/app/actions/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import {
  Client,
  Project,
  ProjectHealth,
  ProjectStatus
} from "@/types";
import {
  AlertTriangle,
  BarChart4,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Save,
  Search,
  Target,
  Trash2,
  User,
  X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
}

export function ProjectsView({ projects, clients }: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterHealth, setFilterHealth] = useState<string>("all");

  // Filter projects based on search, client, and health filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.clientName && project.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClient = filterClient === "all" || project.clientId === filterClient;
    const matchesHealth = filterHealth === "all" || project.health === filterHealth;

    return matchesSearch && matchesClient && matchesHealth;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "client":
        return (a.clientName || "").localeCompare(b.clientName || "");
      case "status":
        return a.status.localeCompare(b.status);
      case "due":
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case "budget":
        return (b.totalBudget || 0) - (a.totalBudget || 0);
      default: // updated
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col space-y-4 p-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects, clients, or descriptions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterHealth} onValueChange={setFilterHealth}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health</SelectItem>
                <SelectItem value="ON_TRACK">On Track</SelectItem>
                <SelectItem value="AT_RISK">At Risk</SelectItem>
                <SelectItem value="DELAYED">Delayed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="due">Due Date</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Project Tabs */}
        <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="proposal">Proposals</TabsTrigger>
            <TabsTrigger value="on_hold">On Hold</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ProjectGrid
              projects={sortedProjects}
              emptyMessage={
                searchQuery || filterClient !== "all" || filterHealth !== "all"
                  ? "No projects match your filters"
                  : "No projects yet. Create your first project to get started."
              }
            />
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <ProjectGrid
              projects={sortedProjects.filter(p => p.status === "ACTIVE")}
              emptyMessage="No active projects found."
            />
          </TabsContent>

          <TabsContent value="proposal" className="mt-4">
            <ProjectGrid
              projects={sortedProjects.filter(p => p.status === "PROPOSAL")}
              emptyMessage="No proposals found."
            />
          </TabsContent>

          <TabsContent value="on_hold" className="mt-4">
            <ProjectGrid
              projects={sortedProjects.filter(p => p.status === "ON_HOLD")}
              emptyMessage="No projects on hold."
            />
          </TabsContent>

          <TabsContent value="overdue" className="mt-4">
            <ProjectGrid
              projects={sortedProjects.filter(p => {
                return p.endDate && new Date(p.endDate) < new Date() && p.status !== "COMPLETED";
              })}
              emptyMessage="No overdue projects found."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ProjectGridProps {
  projects: Project[];
  emptyMessage: string;
}

function ProjectGrid({ projects, emptyMessage }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart4 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>(project.name);
  const [description, setDescription] = useState<string>(project.description || "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [startDate, setStartDate] = useState<string>(
    project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ""
  );
  const [endDate, setEndDate] = useState<string>(
    project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ""
  );
  const [budgetType, setBudgetType] = useState<string>(project.budgetType || "FIXED");
  const [totalBudget, setTotalBudget] = useState<string>(
    project.totalBudget ? project.totalBudget.toString() : ""
  );
  const [estimatedHours, setEstimatedHours] = useState<string>(
    project.estimatedHours ? project.estimatedHours.toString() : ""
  );
  const [hourlyRate, setHourlyRate] = useState<string>(
    project.hourlyRate ? project.hourlyRate.toString() : ""
  );

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("status", status);
      if (startDate) formData.append("startDate", startDate);
      if (endDate) formData.append("endDate", endDate);
      formData.append("budgetType", budgetType);
      if (totalBudget) formData.append("totalBudget", totalBudget);
      if (estimatedHours) formData.append("estimatedHours", estimatedHours);
      if (hourlyRate) formData.append("hourlyRate", hourlyRate);

      await updateProject(project.id, formData);
      toast.success("Project updated successfully");
      setIsEditing(false);
      // Note: In a real app, you'd want to refresh the project data here
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form state to original values
    setName(project.name);
    setDescription(project.description || "");
    setStatus(project.status);
    setStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "");
    setEndDate(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "");
    setBudgetType(project.budgetType || "FIXED");
    setTotalBudget(project.totalBudget ? project.totalBudget.toString() : "");
    setEstimatedHours(project.estimatedHours ? project.estimatedHours.toString() : "");
    setHourlyRate(project.hourlyRate ? project.hourlyRate.toString() : "");
    setIsEditing(false);
  };

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

  const getHealthColor = (health?: ProjectHealth) => {
    switch (health) {
      case "ON_TRACK":
        return "text-chart-2";
      case "AT_RISK":
        return "text-chart-3";
      case "DELAYED":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getHealthIcon = (health?: ProjectHealth) => {
    switch (health) {
      case "ON_TRACK":
        return CheckCircle2;
      case "AT_RISK":
        return AlertTriangle;
      case "DELAYED":
        return Clock;
      default:
        return Target;
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

  const isOverdue = project.endDate &&
    new Date(project.endDate) < new Date() &&
    project.status !== "COMPLETED";

  const HealthIcon = getHealthIcon(project.health || "ON_TRACK");

  return (
    <div className="card-elevated hover-lift rounded-lg p-6 bg-card">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 flex-1 mr-3">
          <div className={`p-2 rounded-lg ${project.status === "ACTIVE" ? "status-bg-success" :
            project.status === "PROPOSAL" ? "status-bg-primary" :
              project.status === "ON_HOLD" ? "status-bg-warning" :
                project.status === "COMPLETED" ? "bg-secondary" :
                  "status-bg-danger"
            }`}>
            <BarChart4 className={`h-5 w-5 ${project.status === "ACTIVE" ? "text-chart-2" :
              project.status === "PROPOSAL" ? "text-chart-1" :
                project.status === "ON_HOLD" ? "text-chart-3" :
                  project.status === "COMPLETED" ? "text-secondary-foreground" :
                    "text-destructive"
              }`} />
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-semibold mb-2"
                placeholder="Project name"
              />
            ) : (
              <h3 className="font-semibold text-headline truncate">{project.name}</h3>
            )}
            {project.health && (
              <div className="flex items-center gap-1 mt-1">
                <HealthIcon className={`h-3 w-3 ${getHealthColor(project.health || "ON_TRACK")}`} />
                <span className={`text-xs ${getHealthColor(project.health || "ON_TRACK")}`}>
                  {project.health?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || "On Track"}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
          {isEditing ? (
            <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
              <SelectTrigger className="w-24 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROPOSAL">Proposal</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELED">Canceled</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {isEditing ? (
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Project description..."
          rows={2}
          className="text-sm mb-4 resize-none"
        />
      ) : (
        project.description && (
          <p className="text-sm text-body line-clamp-2 mb-4">
            {project.description}
          </p>
        )
      )}

      {/* Progress Bar */}
      {project.progress !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
      )}

      {/* Client Info */}
      <div className="flex items-center text-sm text-body mb-4">
        <User className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="truncate">
          {project.clientName}
          {project.clientCompany && ` (${project.clientCompany})`}
        </span>
      </div>

      {/* Project Stats */}
      {isEditing ? (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Budget Type</label>
            <Select value={budgetType} onValueChange={setBudgetType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Fixed Price</SelectItem>
                <SelectItem value="HOURLY">Hourly Rate</SelectItem>
                <SelectItem value="RETAINER">Monthly Retainer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Total Budget ($)</label>
              <Input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="0.00"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Estimated Hours</label>
              <Input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Hourly Rate ($)</label>
            <Input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0.00"
              className="h-8 text-xs"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          {project.totalBudget && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-medium">${project.totalBudget.toLocaleString()}</span>
            </div>
          )}

          {project.estimatedHours && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Est:</span>
              <span className="font-medium">{project.estimatedHours}h</span>
            </div>
          )}

          {project.milestoneCount !== undefined && (
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Milestones:</span>
              <span className="font-medium">{project.milestoneCount}</span>
            </div>
          )}

          {project.taskCount !== undefined && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Tasks:</span>
              <span className="font-medium">
                {project.completedTaskCount || 0}/{project.taskCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>
            {project.endDate ? formatDate(project.endDate.toString()) : "No deadline"}
          </span>
        </div>
        <span>
          Updated {project.lastActivity ? formatDate(project.lastActivity.toString()) : "recently"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading}
            >
              {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        ) : (
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Link>
        )}

        {!isEditing && (
          <div className="flex items-center gap-2">
            {project.status === "ACTIVE" && (
              <Link
                href={`/projects/${project.id}/share`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}/share`}>
                    <ExternalLink className="h-4 w-4" />
                    Share with Client
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
} 