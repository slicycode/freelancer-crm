"use client";

import {
  copyGlobalTemplate,
  deleteDocumentTemplate,
  generateDocumentFromTemplate,
  getVariableValues,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatFileSize } from "@/lib/utils";
import {
  Client,
  Document,
  DocumentTemplate,
  DocumentType,
  DocumentVariable,
  Project
} from "@/types";
import {
  Calendar,
  Copy,
  Edit,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  User,
  Wand2,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateTemplateDialog } from "./create-template-dialog";
import { DocumentGenerationDemo } from "./document-generation-demo";

interface DocumentsViewProps {
  documents: Document[];
  templates: DocumentTemplate[];
  clients: Client[];
  projects: Project[];
}

export function DocumentsView({ documents, templates, clients, projects }: DocumentsViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<string>("templates");
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialDismissed, setTutorialDismissed] = useState<boolean>(false);

  // Check if user is new (no templates and no documents)
  const userTemplates = templates.filter(template => !template.isGlobal);
  const isNewUser = userTemplates.length === 0 && documents.length === 0;

  // Load tutorial state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('document-tutorial-dismissed');
    setTutorialDismissed(dismissed === 'true');

    // Show tutorial automatically for new users who haven't dismissed it
    if (isNewUser && dismissed !== 'true') {
      setShowTutorial(true);
    }
  }, [isNewUser]);

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    setTutorialDismissed(true);
    localStorage.setItem('document-tutorial-dismissed', 'true');
  };

  const handleShowTutorial = () => {
    setShowTutorial(true);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDocuments = documents.filter(document =>
    document.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (document.clientName && document.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col space-y-4 p-6">
        {/* Tutorial Banner for New Users */}
        {isNewUser && !tutorialDismissed && !showTutorial && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                  <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Welcome to Document Management!
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Learn how to create templates and generate professional documents in minutes.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowTutorial}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
                >
                  Start Tutorial
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissTutorial}
                  className="text-blue-700 hover:bg-blue-100 dark:text-blue-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Tutorial */}
        {showTutorial && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Document Generation Tutorial
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissTutorial}
                className="text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <p className="text-indigo-700 dark:text-indigo-300 mb-4">
                  Follow this interactive demo to learn how our document system works:
                </p>
                <ul className="space-y-2 text-sm text-indigo-600 dark:text-indigo-400">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-xs flex items-center justify-center font-medium">1</span>
                    Choose or create a template with variables
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-xs flex items-center justify-center font-medium">2</span>
                    Configure variables with client/project data
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-xs flex items-center justify-center font-medium">3</span>
                    Generate professional documents instantly
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-xs flex items-center justify-center font-medium">4</span>
                    Export as HTML, PDF, or manage versions
                  </li>
                </ul>
              </div>

              <div className="lg:w-96">
                <DocumentGenerationDemo />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates and documents..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <CreateTemplateDialog />
        </div>

        <Tabs defaultValue="templates" value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Templates ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({documents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-6">
            <TemplatesGrid
              templates={filteredTemplates}
              clients={clients}
              projects={projects}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentsGrid
              documents={filteredDocuments}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface TemplatesGridProps {
  templates: DocumentTemplate[];
  clients: Client[];
  projects: Project[];
}

function TemplatesGrid({ templates, clients, projects }: TemplatesGridProps) {
  const [showGallery, setShowGallery] = useState<boolean>(true);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Separate global templates from user-created templates
  const globalTemplates = templates.filter(template => template.isGlobal);
  const userTemplates = templates.filter(template => !template.isGlobal);

  const router = useRouter();

  const handleCopyGlobalTemplate = async (templateId: string) => {
    setLoading(templateId);
    try {
      await copyGlobalTemplate(templateId);
      toast.success("Template copied to your templates!");
      router.refresh();
    } catch (error) {
      console.error("Failed to copy template:", error);
      toast.error("Failed to copy template");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setLoading(templateId);
    try {
      await deleteDocumentTemplate(templateId);
      toast.success("Template deleted successfully");
      setDeleteDialogOpen(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Template Gallery (Global Templates) */}
      {globalTemplates.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-headline">Template Gallery</h3>
              <Badge variant="secondary" className="text-xs">
                {globalTemplates.length} templates
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGallery(!showGallery)}
              className="flex items-center gap-2"
            >
              {showGallery ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Gallery
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Gallery
                </>
              )}
            </Button>
          </div>
          {showGallery && (
            <TemplateGrid
              templates={globalTemplates}
              clients={clients}
              projects={projects}
              onCopyTemplate={handleCopyGlobalTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              loading={loading}
              generateDialogOpen={generateDialogOpen}
              setGenerateDialogOpen={setGenerateDialogOpen}
              deleteDialogOpen={deleteDialogOpen}
              setDeleteDialogOpen={setDeleteDialogOpen}
            />
          )}
        </div>
      )}

      {/* User Templates Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-headline">Your Templates</h3>
            <Badge variant="secondary" className="text-xs">
              {userTemplates.length} templates
            </Badge>
          </div>
        </div>

        {userTemplates.length > 0 ? (
          <TemplateGrid
            templates={userTemplates}
            clients={clients}
            projects={projects}
            onCopyTemplate={handleCopyGlobalTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            loading={loading}
            generateDialogOpen={generateDialogOpen}
            setGenerateDialogOpen={setGenerateDialogOpen}
            deleteDialogOpen={deleteDialogOpen}
            setDeleteDialogOpen={setDeleteDialogOpen}
          />
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg bg-muted/20">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-chart-1/20 to-chart-2/20 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-chart-1" />
            </div>
            <h3 className="text-lg font-medium text-headline mb-2">Create Your First Template</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Build custom templates with variables to generate professional documents quickly and consistently.
            </p>
            <CreateTemplateDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CreateTemplateDialog>
          </div>
        )}
      </div>
    </div>
  );
}

interface TemplateGridProps {
  templates: DocumentTemplate[];
  clients: Client[];
  projects: Project[];
  onCopyTemplate: (templateId: string) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  loading: string | null;
  generateDialogOpen: string | null;
  setGenerateDialogOpen: React.Dispatch<React.SetStateAction<string | null>>;
  deleteDialogOpen: string | null;
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<string | null>>;
}

function TemplateGrid({ templates, clients, projects, onCopyTemplate, onDeleteTemplate, loading, generateDialogOpen, setGenerateDialogOpen, deleteDialogOpen, setDeleteDialogOpen }: TemplateGridProps) {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="card-elevated p-6 hover:shadow-md transition-shadow hover-lift rounded-md"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
              <div className={`p-1.5 rounded shrink-0 ${template.type === "PROPOSAL" ? "status-bg-primary" :
                template.type === "CONTRACT" ? "status-bg-success" :
                  template.type === "INVOICE" ? "status-bg-warning" :
                    template.type === "REPORT" ? "status-bg-info" :
                      "bg-secondary"
                }`}>
                <FileText className={`h-4 w-4 ${template.type === "PROPOSAL" ? "text-chart-1" :
                  template.type === "CONTRACT" ? "text-chart-2" :
                    template.type === "INVOICE" ? "text-chart-3" :
                      template.type === "REPORT" ? "text-chart-5" :
                        "text-secondary-foreground"
                  }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate text-headline">{template.name}</h3>
                {template.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {template.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <Badge className={`text-xs ${getTypeColor(template.type)}`}>
                {getTypeLabel(template.type)}
              </Badge>
              {template.isGlobal && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Professional
                </Badge>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Variables: {template.variables.length}</p>
            <div className="text-xs text-muted-foreground">
              {formatDate(template.updatedAt.toString())}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <GenerateDocumentDialog
              template={template}
              clients={clients}
              projects={projects}
              open={generateDialogOpen === template.id}
              onOpenChange={(open) => setGenerateDialogOpen(open ? template.id : null)}
            >
              <Button size="sm" className="flex-1 shine">
                <Wand2 className="h-3 w-3 mr-1" />
                Generate
              </Button>
            </GenerateDocumentDialog>

            {template.isGlobal ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCopyTemplate(template.id)}
                disabled={loading === template.id}
              >
                <Copy className="h-3 w-3 mr-1" />
                {loading === template.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Copy"}
              </Button>
            ) : (
              <>
                <Link href={`/documents/templates/${template.id}`}>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(template.id)}
                  disabled={loading === template.id}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(null)}
              disabled={loading === deleteDialogOpen}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogOpen && onDeleteTemplate(deleteDialogOpen)}
              disabled={loading === deleteDialogOpen}
            >
              {loading === deleteDialogOpen && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DocumentsGridProps {
  documents: Document[];
}

function DocumentsGrid({ documents }: DocumentsGridProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No documents yet. Generate documents from your templates to get started.</p>
      </div>
    );
  }

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

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {documents.map((document) => (
        <Link
          key={document.id}
          href={`/documents/${document.id}`}
          className="block p-6 rounded-lg card-elevated hover-lift"
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
              <div className="flex-1">
                <h3 className="font-semibold line-clamp-1 text-headline">{document.name}</h3>
                {document.templateName && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    From: {document.templateName}
                  </p>
                )}
              </div>
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
            <span className="line-clamp-1">
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

interface GenerateDocumentDialogProps {
  template: DocumentTemplate;
  clients: Client[];
  projects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function GenerateDocumentDialog({ template, clients, projects, open, onOpenChange, children }: GenerateDocumentDialogProps) {
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
      const result = await generateDocumentFromTemplate({
        templateId: template.id,
        name: name.trim(),
        variableValues,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
      });

      toast.success("Document generated successfully");
      onOpenChange(false);
      resetForm();
      router.push(`/documents/${result.id}`);
      router.refresh();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild className="shine">
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
              onClick={() => onOpenChange(false)}
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

interface VariableInputProps {
  variable: DocumentVariable;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}

function VariableInput({ variable, value, onChange }: VariableInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = (variable.type === 'number' || variable.type === 'currency')
      ? Number(e.target.value)
      : e.target.value;
    onChange(newValue);
  };

  switch (variable.type) {
    case 'textarea':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <textarea
            id={variable.key}
            placeholder={variable.description || `Enter ${variable.label.toLowerCase()}...`}
            value={value as string || ''}
            onChange={handleChange}
            required={variable.required}
            className="w-full p-2 border rounded-md resize-none"
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

    case 'number':
    case 'currency':
      return (
        <div className="space-y-1">
          <Label htmlFor={variable.key}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={variable.key}
            type="number"
            step={variable.type === 'currency' ? '0.01' : '1'}
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