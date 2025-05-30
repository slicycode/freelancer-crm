"use client";

import { generateEnhancedDocument } from "@/app/actions/document-export";
import {
  deleteDocumentTemplate,
  generateTemplatePreview,
  getVariableValues,
  updateDocumentTemplate
} from "@/app/actions/document-templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { formatDate, getSampleVariables, processTemplateVariables } from "@/lib/utils";
import {
  Client,
  Document,
  DocumentTemplate,
  DocumentType,
  DocumentVariable,
  Project
} from "@/types";
import {
  ArrowLeft,
  Copy,
  Edit,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Save,
  Star,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface TemplateDetailViewProps {
  template: DocumentTemplate;
  generatedDocuments: Document[];
  clients: Client[];
  projects: Project[];
}

export function TemplateDetailView({
  template,
  generatedDocuments,
  clients,
  projects
}: TemplateDetailViewProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState<boolean>(false);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [isHeaderMinimized, setIsHeaderMinimized] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>(template.name);
  const [description, setDescription] = useState<string>(template.description || "");
  const [content, setContent] = useState<string>(template.content);
  const [variables, setVariables] = useState<DocumentVariable[]>(template.variables);

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

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Template content is required");
      return;
    }

    setLoading(true);

    try {
      await updateDocumentTemplate(template.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        variables,
      });

      toast.success("Template updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update template:", error);
      toast.error("Failed to update template");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      await deleteDocumentTemplate(template.id);
      toast.success("Template deleted successfully");
      router.push("/documents");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewDialogOpen(true);

    try {
      const preview = await generateTemplatePreview(template.id);
      setPreviewContent(preview.content);
    } catch (error) {
      console.error("Failed to generate preview:", error);
      toast.error("Failed to generate preview");
      setPreviewDialogOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const addVariable = (variable: DocumentVariable) => {
    setVariables([...variables, variable]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const insertVariable = (variableKey: string) => {
    const placeholder = `{{${variableKey}}}`;
    setContent(content + placeholder);
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
                } ${template.type === "PROPOSAL" ? "status-bg-primary" :
                  template.type === "CONTRACT" ? "status-bg-success" :
                    template.type === "INVOICE" ? "status-bg-warning" :
                      template.type === "REPORT" ? "status-bg-info" :
                        "bg-secondary"
                }`}>
                <FileText className={`transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'h-4 w-4' : 'h-5 w-5'
                  } ${template.type === "PROPOSAL" ? "text-chart-1" :
                    template.type === "CONTRACT" ? "text-chart-2" :
                      template.type === "INVOICE" ? "text-chart-3" :
                        template.type === "REPORT" ? "text-chart-5" :
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
                    placeholder="Template name"
                  />
                ) : (
                  <h1 className={`font-bold text-headline truncate transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'text-lg' : 'text-2xl'
                    }`}>
                    {template.name}
                  </h1>
                )}
                <div className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'mt-0.5' : 'mt-1'
                  }`}>
                  <Badge className={`text-xs transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'text-xs py-0.5 px-1.5' : 'text-xs'
                    } ${getTypeColor(template.type)}`}>
                    {getTypeLabel(template.type)} Template
                  </Badge>
                  {template.isDefault && (
                    <Badge variant="secondary" className={`text-xs transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'py-0.5 px-1.5' : ''
                      }`}>
                      <Star className={`mr-1 transition-all duration-300 ease-in-out ${isHeaderMinimized ? 'h-2.5 w-2.5' : 'h-3 w-3'
                        }`} />
                      Default
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
                {isHeaderMinimized ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <GenerateDocumentDialog
                          template={template}
                          clients={clients}
                          projects={projects}
                        >
                          <Button
                            className="shine transition-all duration-300 ease-in-out px-2"
                            size="sm"
                          >
                            <Wand2 className="h-3 w-3" />
                          </Button>
                        </GenerateDocumentDialog>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate Document</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <GenerateDocumentDialog
                    template={template}
                    clients={clients}
                    projects={projects}
                  >
                    <Button
                      className="shine transition-all duration-300 ease-in-out"
                      size="default"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </GenerateDocumentDialog>
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
                      <p>Preview Template</p>
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
                      <p>Edit Template</p>
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
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(template.content)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Content
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Template
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
            {/* Template Description */}
            {(isEditing || template.description) && (
              <div className="card-elevated p-6">
                <Label className="text-base font-medium mb-4 block">Description</Label>
                {isEditing ? (
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter template description..."
                    rows={3}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {template.description || "No description provided"}
                  </p>
                )}
              </div>
            )}

            {/* Template Content */}
            <div className="card-elevated p-6">
              <Label className="text-base font-medium mb-4 block">Template Content</Label>
              {isEditing ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter template content with variables like {{client_name}}..."
                  rows={20}
                  className="resize-none font-mono text-sm"
                />
              ) : (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap p-4 bg-muted/50 rounded-md border min-h-[400px] font-mono text-sm">
                    {template.content}
                  </div>
                </div>
              )}
            </div>

            {/* Variables */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium">Template Variables</Label>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Simple variable addition - can be enhanced later
                      const newVariable = {
                        key: `variable_${variables.length + 1}`,
                        label: `Variable ${variables.length + 1}`,
                        type: 'text' as const,
                        source: 'manual' as const,
                        required: false
                      };
                      addVariable(newVariable);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variable
                  </Button>
                )}
              </div>

              {variables.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No variables defined. {isEditing && "Add variables to make your template dynamic."}
                </p>
              ) : (
                <div className="space-y-3">
                  {variables.map((variable, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {`{{${variable.key}}}`}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {variable.type}
                          </Badge>
                          {variable.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{variable.label}</p>
                        {variable.description && (
                          <p className="text-xs text-muted-foreground">{variable.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => insertVariable(variable.key)}
                          >
                            Insert
                          </Button>
                        )}
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeVariable(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generated Documents */}
            <div className="card-elevated p-6">
              <Label className="text-base font-medium mb-4 block">
                Generated Documents ({generatedDocuments.length})
              </Label>

              {generatedDocuments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No documents generated from this template yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {generatedDocuments.map((document) => (
                    <Link
                      key={document.id}
                      href={`/documents/${document.id}`}
                      className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{document.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {document.clientName || "No client"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {document.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(document.createdAt.toString())}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Info */}
            <div className="card-elevated p-6">
              <Label className="text-base font-medium mb-4 block">Template Information</Label>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(template.createdAt.toString())}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDate(template.updatedAt.toString())}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Variables</span>
                  <span>{template.variables.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Documents</span>
                  <span>{generatedDocuments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{template.name}&quot;? This action cannot be undone.
              {generatedDocuments.length > 0 && (
                <span className="block mt-2 text-amber-600">
                  Note: {generatedDocuments.length} document(s) generated from this template will remain but lose their template reference.
                </span>
              )}
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
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Preview
            </DialogTitle>
            <DialogDescription>
              This is how your template will look with sample data. Variables are automatically filled with realistic examples.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            {previewLoading ? (
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
                      <h3 className="font-semibold text-headline">Template Preview</h3>
                      <p className="text-sm text-body">Generated from template with sample data</p>
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
                    <Markdown>
                      {processTemplateVariables(previewContent, getSampleVariables())}
                    </Markdown>
                  </div>
                </div>

                {/* Sample Variables Used */}
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
                  navigator.clipboard.writeText(previewContent);
                  toast.success("Template content copied to clipboard");
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

// Generate Document Dialog Component
interface GenerateDocumentDialogProps {
  template: DocumentTemplate;
  clients: Client[];
  projects: Project[];
  children: React.ReactNode;
}

function GenerateDocumentDialog({ template, clients, projects, children }: GenerateDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [variableValues, setVariableValues] = useState<Record<string, string | number | boolean>>({});

  const router = useRouter();

  // Filter projects based on selected client
  const filteredProjects = clientId
    ? projects.filter(project => project.clientId === clientId)
    : projects;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a document name");
      return;
    }

    setLoading(true);

    try {
      const result = await generateEnhancedDocument({
        templateId: template.id,
        name: name.trim(),
        variableValues,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        createVersion: true
      });

      if (result.success && result.documentId) {
        toast.success("Document generated successfully");
        setOpen(false);
        resetForm();
        router.push(`/documents/${result.documentId}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to generate document");
      }
    } catch (error) {
      console.error("Failed to generate document:", error);
      toast.error("Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setClientId("");
    setProjectId("");
    setVariableValues({});
  };

  const handleClientChange = async (value: string) => {
    setClientId(value);
    setProjectId(""); // Reset project selection when client changes

    // Auto-populate variables from client/project data
    try {
      const values = await getVariableValues(value || undefined, undefined);
      setVariableValues(prev => ({ ...prev, ...values }));
    } catch (error) {
      console.error("Failed to get variable values:", error);
    }
  };

  const handleProjectChange = async (value: string) => {
    setProjectId(value);

    // Auto-populate variables from client/project data
    try {
      const values = await getVariableValues(clientId || undefined, value || undefined);
      setVariableValues(prev => ({ ...prev, ...values }));
    } catch (error) {
      console.error("Failed to get variable values:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Generate Document from Template</DialogTitle>
            <DialogDescription>
              Generate a new document from &quot;{template.name}&quot; template. Fill in the variables below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[50vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                placeholder="Enter document name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {clients.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="client">Client (Optional)</Label>
                <Select value={clientId} onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filteredProjects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project">Project (Optional)</Label>
                <Select value={projectId} onValueChange={handleProjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {template.variables.length > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Template Variables</Label>
                {template.variables.map(variable => (
                  <VariableInput
                    key={variable.key}
                    variable={variable}
                    value={variableValues[variable.key] || ''}
                    onChange={(value) => {
                      setVariableValues(prev => ({
                        ...prev,
                        [variable.key]: value
                      }));
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Variable Input Component (reused from documents-view)
interface VariableInputProps {
  variable: DocumentVariable;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}

function VariableInput({ variable, value, onChange }: VariableInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    // Apply formatting based on variable type
    if (variable.type === 'currency') {
      // Remove non-numeric characters except decimal point
      newValue = newValue.replace(/[^0-9.]/g, '');
    } else if (variable.type === 'number') {
      newValue = newValue.replace(/[^0-9.]/g, '');
    } else if (variable.type === 'phone') {
      // Basic phone number formatting (US)
      newValue = newValue.replace(/\D/g, '');
      if (newValue.length === 10) {
        newValue = `(${newValue.slice(0, 3)}) ${newValue.slice(3, 6)}-${newValue.slice(6)}`;
      }
    }

    const finalValue = variable.type === 'number' ? Number(newValue) || newValue : newValue;
    onChange(finalValue);
  };

  switch (variable.type) {
    case 'textarea':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id={variable.key}
            placeholder={variable.description || `Enter ${variable.label.toLowerCase()}...`}
            value={value as string || ''}
            onChange={handleChange}
            required={variable.required}
            rows={3}
          />
          {variable.description && (
            <p className="text-xs text-muted-foreground">{variable.description}</p>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select value={value as string || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${variable.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {variable.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {variable.description && (
            <p className="text-xs text-muted-foreground">{variable.description}</p>
          )}
        </div>
      );

    case 'date':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={variable.key}
            type="date"
            value={value as string || ''}
            onChange={handleChange}
            required={variable.required}
          />
          {variable.description && (
            <p className="text-xs text-muted-foreground">{variable.description}</p>
          )}
        </div>
      );

    case 'email':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={variable.key}
            type="email"
            placeholder={variable.description || `Enter ${variable.label.toLowerCase()}...`}
            value={value as string || ''}
            onChange={handleChange}
            required={variable.required}
          />
          {variable.description && (
            <p className="text-xs text-muted-foreground">{variable.description}</p>
          )}
        </div>
      );

    case 'phone':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={variable.key}
            type="tel"
            placeholder="(555) 123-4567"
            value={value as string || ''}
            onChange={handleChange}
            required={variable.required}
          />
          {variable.description && (
            <p className="text-xs text-muted-foreground">{variable.description}</p>
          )}
        </div>
      );

    case 'url':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={variable.key}
            type="url"
            placeholder="https://example.com"
            value={value as string || ''}
            onChange={handleChange}
            required={variable.required}
          />
          {variable.description && (
            <p className="text-xs text-muted-foreground">{variable.description}</p>
          )}
        </div>
      );

    case 'currency':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id={variable.key}
              type="text"
              placeholder="0.00"
              value={value as string ? (value as string).replace(/[^0-9.]/g, '') : ''}
              onChange={handleChange}
              required={variable.required}
              className="pl-8"
            />
          </div>
          {variable.description && (
            <p className="text-xs text-muted-foreground">{variable.description}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={variable.key}
            type="number"
            placeholder={variable.description || `Enter ${variable.label.toLowerCase()}...`}
            value={value as string || ''}
            onChange={handleChange}
            required={variable.required}
          />
          {variable.description && (
            <p className="text-xs text-muted-foreground">{variable.description}</p>
          )}
        </div>
      );

    default: // 'text'
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={variable.key}
            type="text"
            placeholder={variable.description || `Enter ${variable.label.toLowerCase()}...`}
            value={value as string || ''}
            onChange={handleChange}
            required={variable.required}
          />
          {variable.description && (
            <p className="text-xs text-muted-foreground">{variable.description}</p>
          )}
        </div>
      );
  }
} 