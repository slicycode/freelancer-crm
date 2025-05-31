import { getClients } from "@/app/actions/clients";
import { getProject } from "@/app/actions/projects";
import { ProjectDetailView } from "@/components/project-detail-view";
import { Button } from "@/components/ui/button";
import { Client } from "@/types";
import { ExternalLink, Trash2 } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const id = await params.id;

  try {
    const project = await getProject(id);

    return {
      title: `${project.name} - FreelancerCRM`,
      description: `Project details and management for ${project.name}`,
    };
  } catch (_error) {
    return {
      title: "Project Not Found - FreelancerCRM",
      description: "The requested project could not be found",
    };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  try {
    const id = await params.id;
    const project = await getProject(id);
    const clients = await getClients();

    const client: Client | undefined = clients.find((c: Client) => c.id === project.clientId);

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-headline truncate">{project.name}</h1>
              {project.status === "ACTIVE" && (
                <Link href={`/projects/${project.id}/share`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Share with Client
                  </Button>
                </Link>
              )}
            </div>
            <p className="text-muted-foreground">
              {project.description || "No description provided"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete Project
            </Button>
          </div>
        </div>

        <ProjectDetailView project={project} client={client} />
      </div>
    );
  } catch (_error) {
    notFound();
  }
}
