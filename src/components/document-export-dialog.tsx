"use client";

import {
  createDocumentVersion,
  exportDocumentAsHtml,
  exportDocumentAsPdf,
  exportProcessedDocument,
  getDocumentMetrics,
  updateDocumentStatus
} from "@/app/actions/document-export";
import {
  getDocumentVersions,
  restoreDocumentToVersion
} from "@/app/actions/documents";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocumentStorage } from "@/lib/document-generator";
import { Document, DocumentStatus, DocumentVersion } from "@/types";
import {
  BookOpen,
  Clock,
  Copy,
  Download,
  FileText,
  History,
  Loader2,
  Printer,
  RotateCcw,
  Save,
  Target,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DocumentExportDialogProps {
  document: Document;
  children: React.ReactNode;
}

interface DocumentMetrics {
  wordCount: number;
  pageCount: number;
  estimatedReadTime: number;
  versions: number;
}

export function DocumentExportDialog({ document, children }: DocumentExportDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'txt' | 'pdf'>('html');
  const [includeVariables, setIncludeVariables] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<DocumentMetrics | null>(null);

  // Load metrics when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);

    if (isOpen && !metrics) {
      try {
        const result = await getDocumentMetrics(document.id);
        if (result.success) {
          setMetrics(result.metrics || null);
        }
      } catch (error) {
        console.error("Failed to load metrics:", error);
      }
    }
  };

  const handleExportHtml = async () => {
    setLoading(true);
    try {
      const result = await exportDocumentAsHtml(document.id);

      if (result.success && result.content && result.filename) {
        DocumentStorage.downloadFile(result.content, result.filename, 'text/html');
        toast.success("Document exported as HTML");
      } else {
        toast.error(result.error || "Failed to export document");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export document");
    } finally {
      setLoading(false);
    }
  };

  const handleExportText = async () => {
    setLoading(true);
    try {
      const result = await exportProcessedDocument(document.id);

      if (result.success && result.content && result.filename) {
        DocumentStorage.downloadFile(result.content, result.filename, 'text/plain');
        toast.success("Document exported as text");
      } else {
        toast.error(result.error || "Failed to export document");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export document");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setLoading(true);
    try {
      const result = await exportDocumentAsPdf(document.id);

      if (result.success && result.content && result.filename) {
        // Use the browser's print dialog to save as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.content);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
          toast.success("PDF export dialog opened");
        }
      } else {
        toast.error(result.error || "Failed to export document");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export document");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = async () => {
    try {
      const result = await exportProcessedDocument(document.id);

      if (result.success && result.content) {
        await DocumentStorage.copyToClipboard(result.content);
        toast.success("Content copied to clipboard");
      } else {
        toast.error(result.error || "Failed to copy content");
      }
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy content");
    }
  };

  const handlePrint = async () => {
    try {
      const result = await exportDocumentAsHtml(document.id);

      if (result.success && result.content) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.content);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
          toast.success("Document prepared for printing");
        }
      } else {
        toast.error(result.error || "Failed to prepare document for printing");
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to prepare document for printing");
    }
  };

  const handleCreateVersion = async () => {
    setLoading(true);
    try {
      const result = await createDocumentVersion(document.id, "Manual version snapshot");

      if (result.success) {
        toast.success("Document version created");
        // Reload metrics to show updated version count
        const metricsResult = await getDocumentMetrics(document.id);
        if (metricsResult.success) {
          setMetrics(metricsResult.metrics || null);
        }
      } else {
        toast.error(result.error || "Failed to create document version");
      }
    } catch (error) {
      console.error("Version creation error:", error);
      toast.error("Failed to create document version");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Document
          </DialogTitle>
          <DialogDescription>
            Export &quot;{document.name}&quot; in various formats or manage document versions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Document Metrics */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{metrics.wordCount}</div>
                <div className="text-xs text-muted-foreground">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{metrics.pageCount}</div>
                <div className="text-xs text-muted-foreground">Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{metrics.estimatedReadTime}</div>
                <div className="text-xs text-muted-foreground">Min read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{metrics.versions}</div>
                <div className="text-xs text-muted-foreground">Versions</div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={handleExportHtml}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                HTML
              </Button>
              <Button
                onClick={handleExportText}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Text
              </Button>
              <Button
                onClick={handleExportPdf}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCopyContent}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Content
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          {/* Version Management */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Version Management</Label>
              <Badge variant="secondary">
                {metrics?.versions || 0} versions
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateVersion}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Create Version
              </Button>

              <DocumentHistoryDialog document={document}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  View History
                </Button>
              </DocumentHistoryDialog>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4">
            <Label className="text-base font-medium mb-3 block">Advanced Export Options</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-variables">Include Variable Values</Label>
                <input
                  id="include-variables"
                  type="checkbox"
                  checked={includeVariables}
                  onChange={(e) => setIncludeVariables(e.target.checked)}
                  className="rounded"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="export-format">Export Format</Label>
                <Select value={exportFormat} onValueChange={(value: 'html' | 'txt' | 'pdf') => setExportFormat(value)}>
                  <SelectTrigger id="export-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML Document</SelectItem>
                    <SelectItem value="txt">Plain Text</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          <Button
            onClick={
              exportFormat === 'html' ? handleExportHtml :
                exportFormat === 'pdf' ? handleExportPdf :
                  handleExportText
            }
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Download className="h-4 w-4 mr-2" />
            Export {exportFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Status Update Dialog Component
interface StatusUpdateDialogProps {
  document: Document;
  children: React.ReactNode;
}

export function StatusUpdateDialog({ document, children }: StatusUpdateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<DocumentStatus>(document.status);
  const [notes, setNotes] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === document.status) {
      toast.error("Please select a different status");
      return;
    }

    setLoading(true);

    try {
      const result = await updateDocumentStatus(document.id, status, notes);

      if (result.success) {
        toast.success("Document status updated");
        setOpen(false);
        setNotes("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update document status");
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Update Status
            </DialogTitle>
            <DialogDescription>
              Change the status of &quot;{document.name}&quot; and add optional notes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Current Status</Label>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(document.status)}>
                  {document.status}
                </Badge>
                <span className="text-sm text-muted-foreground">→</span>
                <Badge className={getStatusColor(status)}>
                  {status}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as DocumentStatus)}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
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
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Document History Dialog Component
interface DocumentHistoryDialogProps {
  document: Document;
  children: React.ReactNode;
}

export function DocumentHistoryDialog({ document, children }: DocumentHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);

  const router = useRouter();

  // Load versions when dialog opens
  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const versionsData = await getDocumentVersions(document.id);
      setVersions(versionsData);
    } catch (error) {
      console.error("Failed to load versions:", error);
      toast.error("Failed to load document history");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
    setLoading(true);
    try {
      await restoreDocumentToVersion(document.id, versionId);
      toast.success(`Document restored to version ${versionNumber}`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast.error("Failed to restore document version");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getVersionBadgeColor = (index: number) => {
    if (index === 0) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (index === 1) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Document History
          </DialogTitle>
          <DialogDescription>
            View and manage version history for &quot;{document.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[500px] gap-4">
          {/* Versions List */}
          <div className="w-1/2 border-r pr-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-medium">Versions ({versions.length})</Label>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            <ScrollArea className="h-[450px]">
              <div className="space-y-2">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedVersion?.id === version.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                      }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getVersionBadgeColor(index)}>
                        v{version.versionNumber}
                        {index === 0 && " (Current)"}
                      </Badge>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(version.createdAt)}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" />
                      {version.createdBy}
                    </div>

                    {version.changeNotes && (
                      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                        {version.changeNotes}
                      </div>
                    )}

                    {version.metrics && (
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{version.metrics.wordCount} words</span>
                        <span>{version.metrics.pageCount} pages</span>
                      </div>
                    )}
                  </div>
                ))}

                {versions.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No versions found</p>
                    <p className="text-xs">Create your first version to start tracking changes</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Version Preview */}
          <div className="w-1/2 pl-4">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">
                    Version {selectedVersion.versionNumber} Preview
                  </Label>
                  <div className="flex gap-2">
                    {selectedVersion.versionNumber > 1 && (
                      <Button
                        onClick={() => handleRestoreVersion(selectedVersion.id, selectedVersion.versionNumber)}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="h-[400px] border rounded p-3">
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{
                      __html: selectedVersion.content.replace(/\n/g, '<br>')
                    }} />
                  </div>
                </ScrollArea>

                {selectedVersion.metrics && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/30 p-2 rounded text-center">
                      <div className="font-medium">{selectedVersion.metrics.wordCount}</div>
                      <div className="text-muted-foreground">Words</div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded text-center">
                      <div className="font-medium">{selectedVersion.metrics.pageCount}</div>
                      <div className="text-muted-foreground">Pages</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a version to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 