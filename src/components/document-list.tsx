"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Document, DocumentStatus, DocumentType } from "@/types";
import { Calendar, Download, FileText, FolderOpen, Search, User } from "lucide-react";
import { useState } from "react";

interface DocumentListViewProps {
  documents: Document[];
}

export function DocumentListView({ documents }: DocumentListViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<string>("all");

  const filteredDocuments = documents.filter(document =>
    document.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (document.clientName && document.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (document.projectName && document.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case "PROPOSAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "CONTRACT":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "INVOICE":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "REPORT":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "OTHER":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "SENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "ARCHIVED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
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
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <DocumentGrid
              documents={filteredDocuments}
              getTypeColor={getTypeColor}
              getStatusColor={getStatusColor}
              formatFileSize={formatFileSize}
              emptyMessage={
                searchQuery
                  ? "No documents match your search"
                  : "No documents yet. Create your first document to get started."
              }
            />
          </TabsContent>
          <TabsContent value="proposals" className="mt-4">
            <DocumentGrid
              documents={filteredDocuments.filter(d => d.type === "PROPOSAL")}
              getTypeColor={getTypeColor}
              getStatusColor={getStatusColor}
              formatFileSize={formatFileSize}
              emptyMessage={
                searchQuery
                  ? "No proposals match your search"
                  : "No proposals yet."
              }
            />
          </TabsContent>
          <TabsContent value="contracts" className="mt-4">
            <DocumentGrid
              documents={filteredDocuments.filter(d => d.type === "CONTRACT")}
              getTypeColor={getTypeColor}
              getStatusColor={getStatusColor}
              formatFileSize={formatFileSize}
              emptyMessage={
                searchQuery
                  ? "No contracts match your search"
                  : "No contracts yet."
              }
            />
          </TabsContent>
          <TabsContent value="reports" className="mt-4">
            <DocumentGrid
              documents={filteredDocuments.filter(d => d.type === "REPORT")}
              getTypeColor={getTypeColor}
              getStatusColor={getStatusColor}
              formatFileSize={formatFileSize}
              emptyMessage={
                searchQuery
                  ? "No reports match your search"
                  : "No reports yet."
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
  formatFileSize: (bytes: number | null) => string;
  emptyMessage: string;
}

function DocumentGrid({ documents, getTypeColor, getStatusColor, formatFileSize, emptyMessage }: DocumentGridProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <div
          key={document.id}
          className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <h2 className="font-semibold truncate">{document.name}</h2>
            </div>
            {document.url && (
              <a
                href={document.url}
                download
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Download className="h-4 w-4" />
              </a>
            )}
          </div>

          <div className="flex space-x-2 mb-3">
            <Badge className={`text-xs ${getTypeColor(document.type)}`}>
              {document.type}
            </Badge>
            <Badge className={`text-xs ${getStatusColor(document.status)}`}>
              {document.status}
            </Badge>
          </div>

          {document.clientName && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <User className="h-4 w-4 mr-1" />
              <span className="truncate">{document.clientName}</span>
            </div>
          )}

          {document.projectName && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <FolderOpen className="h-4 w-4 mr-1" />
              <span className="truncate">{document.projectName}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDate(document.updatedAt.toString())}</span>
            </div>
            <span>{formatFileSize(document.size ?? null)}</span>
          </div>
        </div>
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