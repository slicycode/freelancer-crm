import { getClients } from "@/app/actions/clients";
import { getDocument } from "@/app/actions/documents";
import { getProjects } from "@/app/actions/projects";
import { DocumentDetailView } from "@/components/document-detail-view";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface DocumentPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: DocumentPageProps): Promise<Metadata> {
  try {
    const document = await getDocument(params.id);
    return {
      title: `${document.name} - FreelancerCRM`,
      description: `View and edit ${document.name}`,
    };
  } catch {
    return {
      title: "Document Not Found - FreelancerCRM",
      description: "The requested document could not be found",
    };
  }
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  try {
    const [document, clients, projects] = await Promise.all([
      getDocument(params.id),
      getClients(),
      getProjects(),
    ]);

    return (
      <DocumentDetailView
        document={document}
        clients={clients}
        projects={projects}
      />
    );
  } catch (error) {
    console.error("Error fetching document:", error);
    notFound();
  }
} 