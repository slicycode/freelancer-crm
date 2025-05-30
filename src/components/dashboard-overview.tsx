"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunicationType } from "@/types";
import { ArrowRight, BarChart4, FileCheck, FileText, Mail, Phone, Users, Video } from "lucide-react";
import Link from "next/link";

interface DashboardOverviewProps {
  stats: {
    totalClients: number;
    activeProjects: number;
    pendingInvoices: number;
    recentCommunications: number;
  };
  recentClients: {
    id: string;
    name: string;
    company?: string | null;
    email?: string | null;
    lastContact: string;
  }[];
  recentCommunications: {
    id: string;
    type: CommunicationType;
    subject: string;
    content: string;
    sentAt: string;
    clientId: string;
    clientName: string;
    projectName?: string | null;
  }[];
}

export function DashboardOverview({ stats, recentClients, recentCommunications }: DashboardOverviewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClients === 0
                ? "Add your first client to get started"
                : "Manage all your client relationships"}
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/clients" className="w-full">
              <Button variant="outline" className="w-full text-xs gap-1">
                <span>View All Clients</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects === 0
                ? "No active projects"
                : `${stats.activeProjects} project${stats.activeProjects === 1 ? "" : "s"} in progress`}
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/projects" className="w-full">
              <Button variant="outline" className="w-full text-xs gap-1">
                <span>View All Projects</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingInvoices === 0
                ? "No pending invoices"
                : `${stats.pendingInvoices} invoice${stats.pendingInvoices === 1 ? "" : "s"} awaiting payment`}
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/invoices" className="w-full">
              <Button variant="outline" className="w-full text-xs gap-1">
                <span>View All Invoices</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentCommunications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentCommunications === 0
                ? "No recent communications"
                : `${stats.recentCommunications} recent communication${stats.recentCommunications === 1 ? "" : "s"}`}
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/clients" className="w-full">
              <Button variant="outline" className="w-full text-xs gap-1">
                <span>View All Communications</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card className="col-span-1 glass">
          <CardHeader>
            <CardTitle>Recent Clients</CardTitle>
            <CardDescription>Your most recently updated clients</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {recentClients.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No clients yet</p>
                <Link href="/clients/new" className="mt-2 inline-block">
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <span>Add Your First Client</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentClients.map((client) => (
                  <Link key={client.id} href={`/clients/${client.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent hover:text-accent-foreground">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.company || "No company"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(client.lastContact)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
          {recentClients.length > 0 && (
            <CardFooter>
              <Link href="/clients" className="w-full">
                <Button variant="ghost" className="w-full text-xs gap-1">
                  <span>View All Clients</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>

        <Card className="col-span-1 glass">
          <CardHeader>
            <CardTitle>Recent Communications</CardTitle>
            <CardDescription>Your most recent client interactions</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {recentCommunications.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No communications yet</p>
                {recentClients.length > 0 && (
                  <Link href={`/clients/${recentClients[0].id}`} className="mt-2 inline-block">
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <span>Add Your First Communication</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {recentCommunications.map((comm) => (
                  <Link key={comm.id} href={`/clients/${comm.clientId}`}>
                    <div className="flex gap-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${comm.type === "EMAIL" ? "status-bg-primary text-chart-1" :
                          comm.type === "CALL" ? "status-bg-success text-chart-2" :
                            comm.type === "MEETING" ? "status-bg-info text-chart-5" :
                              "status-bg-warning text-chart-3"
                          }`}>
                          {comm.type === "EMAIL" && <Mail className="h-4 w-4" />}
                          {comm.type === "CALL" && <Phone className="h-4 w-4" />}
                          {comm.type === "MEETING" && <Video className="h-4 w-4" />}
                          {comm.type === "NOTE" && <FileText className="h-4 w-4" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm truncate">{comm.subject}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatTimeAgo(comm.sentAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {comm.clientName} {comm.projectName ? `(${comm.projectName})` : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
          {recentCommunications.length > 0 && (
            <CardFooter>
              <Link href="/clients" className="w-full">
                <Button variant="ghost" className="w-full text-xs gap-1">
                  <span>View All Communications</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}