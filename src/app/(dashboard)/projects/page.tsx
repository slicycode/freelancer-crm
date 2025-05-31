import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { ProjectsView } from "@/components/projects-view";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart4, Plus } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projects - FreelancerCRM",
  description: "Manage your projects, milestones, and track progress with powerful project management tools",
};

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    getProjects(),
    getClients(),
  ]);

  // Calculate project statistics
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "ACTIVE").length,
    proposals: projects.filter(p => p.status === "PROPOSAL").length,
    onHold: projects.filter(p => p.status === "ON_HOLD").length,
    completed: projects.filter(p => p.status === "COMPLETED").length,
    overdue: projects.filter(p => {
      return p.endDate && new Date(p.endDate) < new Date() && p.status !== "COMPLETED";
    }).length,
  };

  const completionRate = stats.total > 0 ?
    Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold text-headline">Project Management</h1>
          <p className="text-muted-foreground">
            Organize projects, track milestones, and deliver exceptional results
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                <BarChart4 className="h-4 w-4" />
                Analytics
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Analytics coming soon</p>
            </TooltipContent>
          </Tooltip>
          <Link href="/projects/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="p-6 border-b bg-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-card rounded-lg p-4 card-elevated">
            <div className="text-2xl font-bold text-headline">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </div>
          <div className="bg-card rounded-lg p-4 card-elevated">
            <div className="text-2xl font-bold text-chart-2">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="bg-card rounded-lg p-4 card-elevated">
            <div className="text-2xl font-bold text-chart-1">{stats.proposals}</div>
            <div className="text-sm text-muted-foreground">Proposals</div>
          </div>
          <div className="bg-card rounded-lg p-4 card-elevated">
            <div className="text-2xl font-bold text-chart-3">{stats.onHold}</div>
            <div className="text-sm text-muted-foreground">On Hold</div>
          </div>
          <div className="bg-card rounded-lg p-4 card-elevated">
            <div className="text-2xl font-bold text-primary">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="bg-card rounded-lg p-4 card-elevated">
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </div>
          <div className="bg-card rounded-lg p-4 card-elevated">
            <div className="text-2xl font-bold text-chart-5">{completionRate}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </div>

      <ProjectsView projects={projects} clients={clients} />
    </div>
  );
} 