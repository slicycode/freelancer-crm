import { getClients } from "@/app/actions/clients";
import { getDocumentTemplates } from "@/app/actions/document-templates";
import { getDocuments } from "@/app/actions/documents";
import { getProjects } from "@/app/actions/projects";
import { DocumentsView } from "@/components/documents-view";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documents - FreelancerCRM",
  description: "Manage your document templates and generate professional documents",
};

export default async function DocumentsPage() {
  const [documents, templates, clients, projects] = await Promise.all([
    getDocuments(),
    getDocumentTemplates(),
    getClients(),
    getProjects(),
  ]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold text-headline">Document Templates</h1>
          <p className="text-muted-foreground">
            Create templates once, generate professional documents instantly
          </p>
        </div>
        <Link href="/documents/tutorial">
          <Button variant="outline" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            View Tutorial
          </Button>
        </Link>
      </div>
      <DocumentsView
        documents={documents}
        templates={templates}
        clients={clients}
        projects={projects}
      />
    </div>
  );
} 