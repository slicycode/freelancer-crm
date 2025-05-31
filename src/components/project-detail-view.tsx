"use client";

import { createCommunication, getClientCommunications } from "@/app/actions/communications";
import { createDocument, getDocuments } from "@/app/actions/documents";
import { completeMilestone, deleteMilestone, getMilestones } from "@/app/actions/milestones";
import { updateProject } from "@/app/actions/projects";
import { completeTask, deleteTask, getTasks, updateTaskStatus } from "@/app/actions/tasks";
import { getActiveTimer, startTimer, stopTimer } from "@/app/actions/time-tracking";
import { getProjectTimeline } from "@/app/actions/timeline";
import { MilestoneModal } from "@/components/milestone-modal";
import { TaskModal } from "@/components/task-modal";
import { TimeLogModal } from "@/components/time-log-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";
import {
  Client,
  Communication,
  Document,
  Milestone,
  Project,
  ProjectHealth,
  ProjectStatus,
  Task,
  TimeEntry
} from "@/types";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Play,
  Plus,
  Save,
  Square,
  Target,
  Timer,
  Trash2,
  User,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProjectDetailViewProps {
  project: Project;
  client?: Client;
}

export function ProjectDetailView({ project, client }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex-1 overflow-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b px-6 py-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 p-6">
          <TabsContent value="overview" className="mt-0">
            <ProjectOverview project={project} client={client} onRefresh={refreshData} />
          </TabsContent>

          <TabsContent value="milestones" className="mt-0">
            <ProjectMilestones project={project} key={`milestones-${refreshKey}`} onRefresh={refreshData} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <ProjectTasks project={project} key={`tasks-${refreshKey}`} onRefresh={refreshData} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <ProjectTimeline project={project} key={`timeline-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <ProjectDocuments project={project} key={`documents-${refreshKey}`} onRefresh={refreshData} />
          </TabsContent>

          <TabsContent value="communications" className="mt-0">
            <ProjectCommunications project={project} client={client} key={`communications-${refreshKey}`} onRefresh={refreshData} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Project Overview Component
function ProjectOverview({ project, client, onRefresh }: { project: Project; client?: Client; onRefresh: () => void }) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Time tracking state
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTask, setCurrentTask] = useState<string>("General Project Work");
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);

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

  // Check for active timer on mount
  useEffect(() => {
    const checkActiveTimer = async () => {
      try {
        const timer = await getActiveTimer(project.id);
        if (timer && timer.projectId === project.id) {
          setActiveTimer(timer);
          setIsTracking(true);
          setStartTime(new Date(timer.startTime).getTime());
        }
      } catch (error) {
        console.error('Error checking active timer:', error);
      }
    };
    checkActiveTimer();
  }, [project.id]);

  // Timer functionality
  const formatTimer = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    try {
      const timer = await startTimer(project.id, undefined, currentTask);
      setActiveTimer(timer);
      setIsTracking(true);
      setStartTime(Date.now());
      setCurrentTime(0);
      onRefresh();
      toast.success("Timer started");
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error(error instanceof Error ? error.message : "Failed to start timer");
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer(project.id);
      setActiveTimer(null);
      setIsTracking(false);
      setStartTime(null);
      onRefresh();
      toast.success(`Time logged: ${formatTimer(currentTime)}`);
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error(error instanceof Error ? error.message : "Failed to stop timer");
    }
  };

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, startTime]);

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
      onRefresh();
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

  const HealthIcon = project.health ?
    (project.health === "ON_TRACK" ? CheckCircle2 :
      project.health === "AT_RISK" ? AlertTriangle : Clock) : Target;

  return (
    <div className="space-y-6">
      {/* Project Header with Edit Controls */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl font-bold border-none px-0 h-auto"
                placeholder="Project name"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project description..."
                rows={2}
                className="resize-none border-none px-0"
              />
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-headline">{project.name}</h1>
              {project.description && (
                <p className="text-body mt-2">{project.description}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions Toolbar */}
      {!isEditing && (
        <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isTracking ? handleStopTimer : handleStartTimer}
                  className={isTracking ? "bg-destructive/10 text-destructive border-destructive" : ""}
                >
                  <Timer className="h-4 w-4 mr-2" />
                  {isTracking ? "Stop Timer" : "Start Timer"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTracking ? "Stop tracking time for this project" : "Start tracking time for this project"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TimeLogModal
                  projectId={project.id}
                  onSuccess={onRefresh}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Log Time
                    </Button>
                  }
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Manually log time spent on this project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => toast.info("Client update coming soon")}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Update Client
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send progress update to client</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => toast.info("Milestone completion coming soon")}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Milestone
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark milestone as complete and request client approval</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => toast.info("Invoice creation coming soon")}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate invoice for completed work</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => toast.info("File upload coming soon")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload project files, deliverables, or contracts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Project Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
                <SelectTrigger>
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
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
                {project.health && (
                  <div className="flex items-center gap-1">
                    <HealthIcon className={`h-4 w-4 ${getHealthColor(project.health)}`} />
                    <span className={`text-sm ${getHealthColor(project.health)}`}>
                      {project.health.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Timer display */}
              <div className="text-2xl font-bold font-mono">
                {isTracking ? formatTimer(currentTime) : "00:00:00"}
              </div>

              {/* Task context */}
              <div className="text-xs text-muted-foreground">
                {isTracking ? `Working on: ${currentTask}` : "Not tracking"}
              </div>

              {/* Quick task selection when tracking */}
              {isTracking && (
                <Select value={currentTask} onValueChange={setCurrentTask}>
                  <SelectTrigger className="h-6 text-xs">
                    <SelectValue placeholder="Select task..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Project Work">General Project Work</SelectItem>
                    <SelectItem value="Design & Planning">Design & Planning</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Testing & Review">Testing & Review</SelectItem>
                    <SelectItem value="Client Communication">Client Communication</SelectItem>
                    <SelectItem value="Documentation">Documentation</SelectItem>
                    <SelectItem value="Revisions">Revisions</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Quick actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isTracking ? "destructive" : "default"}
                  onClick={isTracking ? handleStopTimer : handleStartTimer}
                  className="flex-1"
                >
                  {isTracking ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
                <TimeLogModal
                  projectId={project.id}
                  onSuccess={onRefresh}
                  trigger={
                    <Button size="sm" variant="outline">
                      <Clock className="h-3 w-3" />
                    </Button>
                  }
                />
              </div>

              {/* Progress against estimate */}
              <div className="text-xs text-muted-foreground">
                {project.actualHours || 0}h of {project.estimatedHours || 0}h
                {project.estimatedHours ? ` (${Math.round(((project.actualHours || 0) / project.estimatedHours) * 100)}%)` : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="0.00"
                />
                <Select value={budgetType} onValueChange={setBudgetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Price</SelectItem>
                    <SelectItem value="HOURLY">Hourly Rate</SelectItem>
                    <SelectItem value="RETAINER">Monthly Retainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {project.totalBudget?.toLocaleString() || "0"}
                  </span>
                </div>
                {project.budgetType && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {project.budgetType.toLowerCase()} project
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {project.endDate ? formatDate(project.endDate.toString()) : "No deadline"}
                  </span>
                </div>
                {project.startDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Started {formatDate(project.startDate.toString())}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion</span>
                <span className="font-medium">{project.progress || 0}%</span>
              </div>
              <Progress value={project.progress || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hours and Rate Information */}
      {isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
              />
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hourly Rate ($)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="0.00"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Client Information */}
      {client && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">{client.name}</h4>
                {client.company && (
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                )}
              </div>
              <div className="space-y-1">
                {client.email && (
                  <p className="text-sm text-body">{client.email}</p>
                )}
                {client.phone && (
                  <p className="text-sm text-body">{client.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Health Indicators */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Project Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Budget health */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {(() => {
                  const actualCost = (project.actualHours || 0) * (project.hourlyRate || 0);
                  const budgetUsage = project.totalBudget ? (actualCost / project.totalBudget) * 100 : 0;
                  const dotColor = budgetUsage < 70 ? 'bg-green-500' : budgetUsage < 90 ? 'bg-yellow-500' : 'bg-red-500';

                  return (
                    <>
                      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="text-sm font-medium">Budget Usage</span>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const actualCost = (project.actualHours || 0) * (project.hourlyRate || 0);
                  const budgetUsage = project.totalBudget ? (actualCost / project.totalBudget) * 100 : 0;
                  const budgetHealth = budgetUsage < 70 ? 'success' : budgetUsage < 90 ? 'warning' : 'destructive';

                  return (
                    <>
                      <Badge variant={budgetHealth === 'success' ? 'default' : budgetHealth === 'warning' ? 'secondary' : 'destructive'}>
                        {Math.round(budgetUsage)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ${actualCost.toLocaleString()} / ${(project.totalBudget || 0).toLocaleString()}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Timeline health */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {(() => {
                  if (!project.endDate) {
                    return (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-sm font-medium">Timeline</span>
                      </>
                    );
                  }

                  const now = new Date();
                  const endDate = new Date(project.endDate);
                  const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  let dotColor = 'bg-green-500';

                  if (daysUntilDeadline < 0) {
                    dotColor = 'bg-red-500';
                  } else if (daysUntilDeadline < 7) {
                    dotColor = 'bg-red-500';
                  } else if (daysUntilDeadline < 14) {
                    dotColor = 'bg-yellow-500';
                  }

                  return (
                    <>
                      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="text-sm font-medium">Timeline</span>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  if (!project.endDate) {
                    return <Badge variant="secondary">No deadline</Badge>;
                  }

                  const now = new Date();
                  const endDate = new Date(project.endDate);
                  const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  let timelineHealth: 'default' | 'secondary' | 'destructive' = 'default';
                  let timelineStatus = '';

                  if (daysUntilDeadline < 0) {
                    timelineHealth = 'destructive';
                    timelineStatus = `${Math.abs(daysUntilDeadline)} days overdue`;
                  } else if (daysUntilDeadline < 7) {
                    timelineHealth = 'destructive';
                    timelineStatus = `${daysUntilDeadline} days left`;
                  } else if (daysUntilDeadline < 14) {
                    timelineHealth = 'secondary';
                    timelineStatus = `${daysUntilDeadline} days left`;
                  } else {
                    timelineHealth = 'default';
                    timelineStatus = `${daysUntilDeadline} days left`;
                  }

                  return <Badge variant={timelineHealth}>{timelineStatus}</Badge>;
                })()}
              </div>
            </div>

            {/* Time efficiency */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {(() => {
                  const actualHours = project.actualHours || 0;
                  const estimatedHours = project.estimatedHours || 0;

                  if (estimatedHours === 0) {
                    return (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-sm font-medium">Time Efficiency</span>
                      </>
                    );
                  }

                  const efficiency = (actualHours / estimatedHours) * 100;
                  const dotColor = efficiency < 90 ? 'bg-green-500' : efficiency < 110 ? 'bg-yellow-500' : 'bg-red-500';

                  return (
                    <>
                      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="text-sm font-medium">Time Efficiency</span>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const actualHours = project.actualHours || 0;
                  const estimatedHours = project.estimatedHours || 0;

                  if (estimatedHours === 0) {
                    return <Badge variant="secondary">No estimate</Badge>;
                  }

                  const efficiency = (actualHours / estimatedHours) * 100;
                  const efficiencyHealth = efficiency < 90 ? 'default' : efficiency < 110 ? 'secondary' : 'destructive';

                  return (
                    <>
                      <Badge variant={efficiencyHealth}>
                        {Math.round(efficiency)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {actualHours}h / {estimatedHours}h
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Profitability indicator */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {(() => {
                  const revenue = project.totalBudget || 0;
                  const costs = (project.actualHours || 0) * (project.hourlyRate || 0);
                  const profit = revenue - costs;
                  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

                  const dotColor = profitMargin > 20 ? 'bg-green-500' : profitMargin > 0 ? 'bg-yellow-500' : 'bg-red-500';

                  return (
                    <>
                      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="text-sm font-medium">Estimated Profit</span>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const revenue = project.totalBudget || 0;
                  const costs = (project.actualHours || 0) * (project.hourlyRate || 0);
                  const profit = revenue - costs;
                  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

                  const profitHealth = profitMargin > 20 ? 'default' : profitMargin > 0 ? 'secondary' : 'destructive';

                  return (
                    <>
                      <Badge variant={profitHealth}>
                        {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(profitMargin)}% margin
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.milestoneCount || 0}</div>
            <p className="text-xs text-muted-foreground">milestones defined</p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.completedTaskCount || 0}/{project.taskCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">tasks completed</p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.actualHours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              of {project.estimatedHours || 0}h estimated
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Milestones Component
function ProjectMilestones({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMilestones = async () => {
      try {
        const data = await getMilestones(project.id);
        setMilestones(data);
      } catch (error) {
        console.error('Error loading milestones:', error);
        toast.error('Failed to load milestones');
      } finally {
        setLoading(false);
      }
    };
    loadMilestones();
  }, [project.id]);

  const handleComplete = async (milestoneId: string) => {
    try {
      await completeMilestone(milestoneId);
      onRefresh();
      // Reload milestones
      const data = await getMilestones(project.id);
      setMilestones(data);
      toast.success('Milestone completed successfully');
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone');
    }
  };

  const handleDelete = async (milestoneId: string) => {
    try {
      await deleteMilestone(milestoneId);
      onRefresh();
      // Reload milestones
      const data = await getMilestones(project.id);
      setMilestones(data);
      toast.success('Milestone deleted successfully');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete milestone');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-headline">Project Milestones</h3>
          <MilestoneModal projectId={project.id} onSuccess={onRefresh} trigger={
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
          } />
        </div>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading milestones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-headline">Project Milestones</h3>
        <MilestoneModal projectId={project.id} onSuccess={onRefresh} trigger={
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>
        } />
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No milestones defined yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Break down your project into clear milestones with deliverables and deadlines.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${milestone.status === 'APPROVED' || milestone.status === 'REJECTED' ? 'bg-green-100 text-green-600' :
                      milestone.status === 'IN_PROGRESS' || milestone.status === 'REVIEW' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{milestone.name}</CardTitle>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      milestone.status === 'APPROVED' ? 'default' :
                        milestone.status === 'IN_PROGRESS' || milestone.status === 'REVIEW' ? 'secondary' :
                          'outline'
                    }>
                      {milestone.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComplete(milestone.id)}
                      disabled={milestone.status === 'APPROVED' || milestone.status === 'REJECTED'}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(milestone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {milestone.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due {formatDate(milestone.dueDate.toString())}</span>
                      </div>
                    )}
                    {milestone.paymentAmount && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>${milestone.paymentAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs">
                    Order: {milestone.order}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Tasks Component
function ProjectTasks({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksData, milestonesData] = await Promise.all([
          getTasks(project.id),
          getMilestones(project.id)
        ]);
        setTasks(tasksData);
        setMilestones(milestonesData);
      } catch (error) {
        console.error('Error loading tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [project.id]);

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);
      onRefresh();
      // Reload tasks
      const data = await getTasks(project.id);
      setTasks(data);
      toast.success('Task completed successfully');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      onRefresh();
      // Reload tasks
      const data = await getTasks(project.id);
      setTasks(data);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleStatusUpdate = async (taskId: string, status: string) => {
    try {
      await updateTaskStatus(taskId, status as any);
      onRefresh();
      // Reload tasks
      const data = await getTasks(project.id);
      setTasks(data);
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-headline">Tasks</h3>
          <TaskModal projectId={project.id} milestones={milestones} onSuccess={onRefresh} trigger={
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          } />
        </div>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-headline">Tasks</h3>
        <TaskModal projectId={project.id} milestones={milestones} onSuccess={onRefresh} trigger={
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        } />
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No tasks created yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create tasks to track specific work items and their progress.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                      task.status === 'IN_PROGRESS' || task.status === 'REVIEW' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      task.priority === 'HIGH' ? 'destructive' :
                        task.priority === 'MEDIUM' ? 'secondary' :
                          'outline'
                    }>
                      {task.priority?.toLowerCase()}
                    </Badge>
                    <Select value={task.status} onValueChange={(value) => handleStatusUpdate(task.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">Todo</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="REVIEW">Review</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComplete(task.id)}
                      disabled={task.status === 'COMPLETED'}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due {formatDate(task.dueDate.toString())}</span>
                      </div>
                    )}
                    {task.estimatedHours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimatedHours}h estimated</span>
                      </div>
                    )}
                  </div>
                  {task.milestoneId && (
                    <div className="text-xs">
                      Milestone: {milestones.find(m => m.id === task.milestoneId)?.name || 'Unknown'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Timeline Component
function ProjectTimeline({ project }: { project: Project }) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const data = await getProjectTimeline(project.id);
        setTimeline(data);
      } catch (error) {
        console.error('Error loading timeline:', error);
        toast.error('Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };
    loadTimeline();
  }, [project.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-headline">Project Timeline</h3>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-headline">Project Timeline</h3>

      {timeline.length === 0 ? (
        <div className="text-center py-12">
          <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No timeline events yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Timeline will show project activities as they happen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {timeline.map((entry) => (
            <Card key={entry.id} className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${entry.importance === 'high' ? 'bg-red-100 text-red-600' :
                    entry.importance === 'medium' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                    <Timer className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{entry.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(entry.timestamp.toString())}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Documents Component
function ProjectDocuments({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const allDocuments = await getDocuments();
        const projectDocuments = allDocuments.filter(doc => doc.projectId === project.id);
        setDocuments(projectDocuments);
      } catch (error) {
        console.error('Error loading documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, [project.id]);

  const handleCreateDocument = async () => {
    try {
      await createDocument({
        name: "New Document",
        type: "PROPOSAL",
        projectId: project.id
      });
      onRefresh();
      // Reload documents
      const allDocuments = await getDocuments();
      const projectDocuments = allDocuments.filter(doc => doc.projectId === project.id);
      setDocuments(projectDocuments);
      toast.success('Document created successfully');
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-headline">Project Documents</h3>
          <Button className="flex items-center gap-2" onClick={handleCreateDocument}>
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </div>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-headline">Project Documents</h3>
        <Button className="flex items-center gap-2" onClick={handleCreateDocument}>
          <Plus className="h-4 w-4" />
          Add Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No documents uploaded yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload project files, proposals, contracts, and deliverables.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((document) => (
            <Card key={document.id} className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{document.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{document.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{document.status}</Badge>
                    {document.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={document.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground">
                  Created {formatDate(document.createdAt.toString())}
                  {document.size && ` • ${(document.size / 1024).toFixed(1)} KB`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Communications Component
function ProjectCommunications({ project, client, onRefresh }: { project: Project; client?: Client; onRefresh: () => void }) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCommunications = async () => {
      if (!client) {
        setLoading(false);
        return;
      }

      try {
        const allCommunications = await getClientCommunications(client.id);
        const projectCommunications = allCommunications.filter(comm => comm.projectId === project.id);
        setCommunications(projectCommunications);
      } catch (error) {
        console.error('Error loading communications:', error);
        toast.error('Failed to load communications');
      } finally {
        setLoading(false);
      }
    };
    loadCommunications();
  }, [project.id, client]);

  const handleCreateCommunication = async () => {
    if (!client) {
      toast.error('No client associated with this project');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', 'NOTE');
      formData.append('subject', 'Project Update');
      formData.append('content', 'New project communication');
      formData.append('projectId', project.id);

      await createCommunication(client.id, formData);
      onRefresh();
      // Reload communications
      const allCommunications = await getClientCommunications(client.id);
      const projectCommunications = allCommunications.filter(comm => comm.projectId === project.id);
      setCommunications(projectCommunications);
      toast.success('Communication created successfully');
    } catch (error) {
      console.error('Error creating communication:', error);
      toast.error('Failed to create communication');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-headline">Communications</h3>
          <Button className="flex items-center gap-2" onClick={handleCreateCommunication}>
            <Plus className="h-4 w-4" />
            Add Communication
          </Button>
        </div>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-headline">Communications</h3>
        <Button className="flex items-center gap-2" onClick={handleCreateCommunication} disabled={!client}>
          <Plus className="h-4 w-4" />
          Add Communication
        </Button>
      </div>

      {!client ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No client associated with this project.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Associate a client to track communications.
          </p>
        </div>
      ) : communications.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No communications logged yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Track all client communications related to this project.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {communications.map((communication) => (
            <Card key={communication.id} className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${communication.type === 'EMAIL' ? 'bg-blue-100 text-blue-600' :
                      communication.type === 'CALL' ? 'bg-green-100 text-green-600' :
                        communication.type === 'MEETING' ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                      }`}>
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{communication.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">{communication.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{communication.type}</Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(communication.sentAt.toString())}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusColor(status: ProjectStatus): string {
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
}

function getStatusLabel(status: ProjectStatus): string {
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
}

function getHealthColor(health?: ProjectHealth): string {
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
} 