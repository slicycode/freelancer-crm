import { getClients } from "@/app/actions/clients";
import { getDocumentTemplate } from "@/app/actions/document-templates";
import { getDocuments } from "@/app/actions/documents";
import { getProjects } from "@/app/actions/projects";
import { TemplateDetailView } from "@/components/template-detail-view";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface TemplatePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: TemplatePageProps): Promise<Metadata> {
  try {
    const template = await getDocumentTemplate(params.id);
    return {
      title: `${template.name} - FreelancerCRM`,
      description: `View and edit ${template.name} template`,
    };
  } catch {
    return {
      title: "Template Not Found - FreelancerCRM",
      description: "The requested template could not be found",
    };
  }
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  try {
    const [template, documents, clients, projects] = await Promise.all([
      getDocumentTemplate(params.id),
      getDocuments(), // Get all documents to filter by template
      getClients(),
      getProjects(),
    ]);

    // Filter documents generated from this template
    const generatedDocuments = documents.filter(doc => doc.templateId === params.id);

    return (
      <TemplateDetailView
        template={template}
        generatedDocuments={generatedDocuments}
        clients={clients}
        projects={projects}
      />
    );
  } catch (error) {
    console.error("Error fetching template:", error);
    notFound();
  }
} 