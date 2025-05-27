import { getDocuments } from "@/app/actions/documents";
import { DocumentListView } from "@/components/document-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents - FreelancerCRM",
  description: "Manage your documents, templates, and files",
};

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="flex flex-col h-full">
      <DocumentListView documents={documents} />
    </div>
  );
} 