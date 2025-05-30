"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Document, DocumentStatus, DocumentType } from "@/types";
import { Calendar, FileText, Search, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface DocumentListViewProps {
  documents: Document[];
}

export function DocumentListView({ documents }: DocumentListViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<string>("all");

  const filteredDocuments = documents.filter(document =>
    document.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (document.clientName && document.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case "PROPOSAL":
        return "status-info";
      case "CONTRACT":
        return "status-success";
      case "INVOICE":
        return "status-warning";
      case "REPORT":
        return "bg-chart-4/10 text-chart-4";
      case "OTHER":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-secondary text-secondary-foreground";
      case "SENT":
        return "status-info";
      case "APPROVED":
        return "status-success";
      case "REJECTED":
        return "status-error";
      case "ARCHIVED":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getTypeLabel = (type: DocumentType) => {
    switch (type) {
      case "PROPOSAL":
        return "Proposal";
      case "CONTRACT":
        return "Contract";
      case "INVOICE":
        return "Invoice";
      case "REPORT":
        return "Report";
      case "OTHER":
        return "Other";
      default:
        return type;
    }
  };

  const getStatusLabel = (status: DocumentStatus) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "SENT":
        return "Sent";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "ARCHIVED":
        return "Archived";
      default:
        return status;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col space-y-4 p-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <DocumentGrid
              documents={filteredDocuments}
              getTypeColor={getTypeColor}
              getStatusColor={getStatusColor}
              getTypeLabel={getTypeLabel}
              getStatusLabel={getStatusLabel}
              emptyMessage={
                searchQuery
                  ? "No documents match your search"
                  : "No documents yet. Create your first document to get started."
              }
            />
          </TabsContent>
          <TabsContent value="draft" className="mt-4">
            <DocumentGrid
              documents={filteredDocuments.filter(d => d.status === "DRAFT")}
              getTypeColor={getTypeColor}
              getStatusColor={getStatusColor}
              getTypeLabel={getTypeLabel}
              getStatusLabel={getStatusLabel}
              emptyMessage={
                searchQuery
                  ? "No draft documents match your search"
                  : "No draft documents."
              }
            />
          </TabsContent>
          <TabsContent value="sent" className="mt-4">
            <DocumentGrid
              documents={filteredDocuments.filter(d => d.status === "SENT")}
              getTypeColor={getTypeColor}
              getStatusColor={getStatusColor}
              getTypeLabel={getTypeLabel}
              getStatusLabel={getStatusLabel}
              emptyMessage={
                searchQuery
                  ? "No sent documents match your search"
                  : "No sent documents."
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface DocumentGridProps {
  documents: Document[];
  getTypeColor: (type: DocumentType) => string;
  getStatusColor: (status: DocumentStatus) => string;
  getTypeLabel: (type: DocumentType) => string;
  getStatusLabel: (status: DocumentStatus) => string;
  emptyMessage: string;
}

function DocumentGrid({
  documents,
  getTypeColor,
  getStatusColor,
  getTypeLabel,
  getStatusLabel,
  emptyMessage
}: DocumentGridProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <Link
          key={document.id}
          href={`/documents/${document.id}`}
          className="block p-6 rounded-lg card-elevated hover-lift shine"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-1 mr-2">
              <div className={`p-1 rounded ${document.type === "PROPOSAL" ? "status-bg-primary" :
                document.type === "CONTRACT" ? "status-bg-success" :
                  document.type === "INVOICE" ? "status-bg-warning" :
                    document.type === "REPORT" ? "status-bg-info" :
                      "bg-secondary"
                }`}>
                <FileText className={`h-4 w-4 ${document.type === "PROPOSAL" ? "text-chart-1" :
                  document.type === "CONTRACT" ? "text-chart-2" :
                    document.type === "INVOICE" ? "text-chart-3" :
                      document.type === "REPORT" ? "text-chart-5" :
                        "text-secondary-foreground"
                  }`} />
              </div>
              <h2 className="font-semibold truncate text-headline">{document.name}</h2>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className={`text-xs ${getTypeColor(document.type)}`}>
                {getTypeLabel(document.type)}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(document.status)}`}>
                {getStatusLabel(document.status)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <User className="h-4 w-4 mr-1" />
            <span className="truncate">
              {document.clientName || "No client"}
              {document.projectName && ` • ${document.projectName}`}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                {formatDate(document.updatedAt.toString())}
              </span>
            </div>
            {document.size && (
              <span>
                {formatFileSize(document.size)}
              </span>
            )}
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
} 