"use client";

import { deleteDocument, updateDocument } from "@/app/actions/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Markdown } from "@/components/ui/markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, formatFileSize, getSampleVariables, processTemplateVariables } from "@/lib/utils";
import { Client, Document, DocumentStatus, DocumentType, Project } from "@/types";
import {
  ArrowLeft,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Save,
  Target,
  Trash2,
  User,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DocumentExportDialog, StatusUpdateDialog } from "./document-export-dialog";

interface DocumentDetailViewProps {
  document: Document;
  clients: Client[];
  projects: Project[];
}

export function DocumentDetailView({ document, clients, projects }: DocumentDetailViewProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState<boolean>(false);
  const [isHeaderMinimized, setIsHeaderMinimized] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>(document.name);
  const [status, setStatus] = useState<DocumentStatus>(document.status);
  const [content, setContent] = useState<string>(document.content || "");
  const [clientId, setClientId] = useState<string>(document.clientId || "");
  const [projectId, setProjectId] = useState<string>(document.projectId || "");

  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll detection for sticky header
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;

      const shouldMinimize = scrollTop > 50;

      setIsHeaderMinimized(shouldMinimize);
    };

    handleScroll();

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isHeaderMinimized]);

  // Filter projects based on selected client
  const filteredProjects = clientId
    ? projects.filter(project => project.clientId === clientId)
    : projects;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Document name is required");
      return;
    }

    setLoading(true);

    try {
      await updateDocument(document.id, {
        name: name.trim(),
        status,
        content: content.trim() || undefined,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
      });

      toast.success("Document updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update document:", error);
      toast.error("Failed to update document");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      await deleteDocument(document.id);
      toast.success("Document deleted successfully");
      router.push("/documents");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setPreviewDialogOpen(true);
  };

  const handleClientChange = (value: string) => {
    const newClientId = value === "none" ? "" : value;
    setClientId(newClientId);
    // Reset project selection when client changes if the project doesn't belong to the new client
    const currentProject = projects.find(p => p.id === projectId);
    if (currentProject && currentProject.clientId !== newClientId) {
      setProjectId("");
    }
  };

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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div
        ref={headerRef}
        className={`sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'py-3' : 'py-6'
          }`}
      >
        <div className={`flex items-center justify-between px-6 transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'gap-2' : 'gap-4'
          }`}>
          <div className={`flex items-center transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'gap-2' : 'gap-4'
            }`}>
            <Link href="/documents">
              <Button variant="ghost" size={isHeaderMinimized ? "sm" : "sm"}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>

            <div className={`flex items-center transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'gap-2' : 'gap-3'
              }`}>
              <div className={`p-2 rounded transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'p-1.5' : 'p-2'
                } ${document.type === "PROPOSAL" ? "status-bg-primary" :
                  document.type === "CONTRACT" ? "status-bg-success" :
                    document.type === "INVOICE" ? "status-bg-warning" :
                      document.type === "REPORT" ? "status-bg-info" :
                        "bg-secondary"
                }`}>
                <FileText className={`transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'h-4 w-4' : 'h-5 w-5'
                  } ${document.type === "PROPOSAL" ? "text-chart-1" :
                    document.type === "CONTRACT" ? "text-chart-2" :
                      document.type === "INVOICE" ? "text-chart-3" :
                        document.type === "REPORT" ? "text-chart-5" :
                          "text-secondary-foreground"
                  }`} />
              </div>

              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`font-semibold transition-all duration-300 ease-in-out min-w-96 ${isHeaderMinimized ? 'text-lg' : 'text-xl'
                      }`}
                    placeholder="Document name"
                  />
                ) : (
                  <h1 className={`font-bold text-headline truncate transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'text-lg' : 'text-2xl'
                    }`}>
                    {document.name}
                  </h1>
                )}
                <div className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'mt-0.5' : 'mt-1'
                  }`}>
                  <Badge className={`text-xs transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'text-xs py-0.5 px-1.5' : 'text-xs'
                    } ${getTypeColor(document.type)}`}>
                    {getTypeLabel(document.type)}
                  </Badge>
                  {isEditing ? (
                    <Select value={status} onValueChange={(value) => setStatus(value as DocumentStatus)}>
                      <SelectTrigger className={`transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'w-24 h-5 text-xs' : 'w-32 h-6 text-xs'
                        }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`text-xs transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'py-0.5 px-1.5' : ''
                      } ${getStatusColor(document.status)}`}>
                      {getStatusLabel(document.status)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`flex items-center transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'gap-1' : 'gap-2'
            }`}>
            {isEditing ? (
              <>
                {isHeaderMinimized ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                        size="sm"
                        className="px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancel Editing</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    size="default"
                  >
                    Cancel
                  </Button>
                )}
                {isHeaderMinimized ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        size="sm"
                        className="px-2"
                      >
                        {loading && <Loader2 className="h-3 w-3 animate-spin transition-all duration-300 ease-in-out" />}
                        <Save className="h-3 w-3 transition-all duration-300 ease-in-out" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save Changes</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    size="default"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin transition-all duration-300 ease-in-out" />}
                    <Save className="h-4 w-4 mr-2 transition-all duration-300 ease-in-out" />
                    Save Changes
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Export Dialog */}
                {isHeaderMinimized ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DocumentExportDialog document={document}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shine transition-all duration-300 ease-in-out px-2"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </DocumentExportDialog>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export Document</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <DocumentExportDialog document={document}>
                    <Button
                      variant="outline"
                      size="default"
                      className="shine transition-all duration-300 ease-in-out"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DocumentExportDialog>
                )}

                {/* Status Update Dialog */}
                {isHeaderMinimized ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <StatusUpdateDialog document={document}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2"
                          >
                            <Target className="h-3 w-3" />
                          </Button>
                        </StatusUpdateDialog>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Update Status</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <StatusUpdateDialog document={document}>
                    <Button
                      variant="outline"
                      size="default"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Status
                    </Button>
                  </StatusUpdateDialog>
                )}

                {isHeaderMinimized ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handlePreview}
                        size="sm"
                        className="px-2"
                      >
                        <FileText className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Preview Document</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    size="default"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                )}

                {isHeaderMinimized ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        size="sm"
                        className="px-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Document</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    size="default"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    {isHeaderMinimized ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-1.5"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>More Options</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(document.content || "")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Content
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Content */}
            <div className="card-elevated p-6">
              <Label className="text-base font-medium mb-4 block">Document Content</Label>
              {isEditing ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter document content..."
                  rows={20}
                  className="resize-none"
                />
              ) : (
                <div className="prose max-w-none">
                  {document.content ? (
                    <div className="whitespace-pre-wrap p-4 bg-muted/50 rounded-md border min-h-[400px]">
                      {document.content}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No content available</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Template Information */}
            {document.templateName && (
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">Generated from Template</Label>
                  {document.templateId && (
                    <Link href={`/documents/templates/${document.templateId}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Template
                      </Button>
                    </Link>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This document was generated from the &quot;{document.templateName}&quot; template.
                </p>

                {document.variableValues && Object.keys(document.variableValues).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Variable Values Used</Label>
                    <div className="space-y-2">
                      {Object.entries(document.variableValues).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <div className="card-elevated p-6">
              <Label className="text-base font-medium mb-4 block">Document Information</Label>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(document.createdAt.toString())}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDate(document.updatedAt.toString())}</span>
                </div>
                {document.size && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Size</span>
                    <span>{formatFileSize(document.size)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Client & Project */}
            <div className="card-elevated p-6">
              <Label className="text-base font-medium mb-4 block">Client & Project</Label>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="client">Client</Label>
                      <Select value={clientId || "none"} onValueChange={handleClientChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No client</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} {client.company && `(${client.company})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project">Project</Label>
                      <Select value={projectId || "none"} onValueChange={(value) => setProjectId(value === "none" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {filteredProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {document.clientName || "No client assigned"}
                      </span>
                    </div>
                    {document.projectName && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{document.projectName}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{document.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Preview
            </DialogTitle>
            <DialogDescription>
              This is how your document looks with formatted content and processed variables.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-body">Generating preview...</span>
              </div>
            ) : (
              <div className="h-full overflow-y-auto pr-1">
                {/* Document Header */}
                <div className="gradient-surface p-4 mb-6 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-headline">Document Preview</h3>
                      <p className="text-sm text-body">Generated document with processed variables</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 status-info rounded text-xs font-medium">
                        PREVIEW
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Content */}
                <div className="card-elevated rounded-lg shadow-sm">
                  {/* Document Paper Styling */}
                  <div className="p-8 md:p-12">
                    <Markdown className="prose-lg">
                      {processTemplateVariables(document.content || "", getSampleVariables())}
                    </Markdown>
                  </div>
                </div>

                {/* Sample Variables Used */}
                {document.variableValues && Object.keys(document.variableValues).length > 0 ? (
                  <div className="mt-6 p-4 card-elevated rounded-lg">
                    <h4 className="text-sm font-medium text-headline mb-3">Variable Values Used:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(document.variableValues).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                            {`{{${key}}}`}
                          </code>
                          <span className="text-body">→</span>
                          <span className="text-body truncate">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 card-elevated rounded-lg mb-6">
                    <h4 className="text-sm font-medium text-headline mb-3">Sample Variables Used in Preview:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(getSampleVariables()).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                            {`{{${key}}}`}
                          </code>
                          <span className="text-body">→</span>
                          <span className="text-body truncate">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-caption">
              <Eye className="h-4 w-4" />
              <span>Preview mode - Variables filled with sample data</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewDialogOpen(false)}
              >
                Close Preview
              </Button>
              <Button
                onClick={() => {
                  // Copy to clipboard functionality
                  navigator.clipboard.writeText(document.content || "");
                  toast.success("Document content copied to clipboard");
                }}
                variant="secondary"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Content
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 