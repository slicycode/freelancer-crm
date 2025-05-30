"use client";

import { createDocumentTemplate } from "@/app/actions/document-templates";
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
import { Textarea } from "@/components/ui/textarea";
import { DocumentType, DocumentVariable, VariableSource, VariableType } from "@/types";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CreateTemplateDialogProps {
  children?: React.ReactNode;
}

export function CreateTemplateDialog({ children }: CreateTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DocumentType | "">("");
  const [content, setContent] = useState("");
  const [variables, setVariables] = useState<DocumentVariable[]>([]);
  const [showVariableForm, setShowVariableForm] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !type || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      await createDocumentTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        content: content.trim(),
        variables,
      });

      toast.success("Template created successfully");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Failed to create template:", error);
      toast.error("Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setType("");
    setContent("");
    setVariables([]);
    setShowVariableForm(false);
  };

  const addVariable = (variable: DocumentVariable) => {
    setVariables(prev => [...prev, variable]);
    setShowVariableForm(false);
  };

  const removeVariable = (index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
  };

  const insertVariable = (variableKey: string) => {
    const placeholder = `{{${variableKey}}}`;
    setContent(prev => prev + placeholder);
  };

  const addCommonVariables = () => {
    const commonVars: DocumentVariable[] = [
      { key: "client_name", label: "Client Name", type: "text", source: "client", required: true },
      { key: "client_company", label: "Client Company", type: "text", source: "client" },
      { key: "project_name", label: "Project Name", type: "text", source: "project" },
      { key: "project_description", label: "Project Description", type: "textarea", source: "project" },
      { key: "current_date", label: "Current Date", type: "date", source: "system", defaultValue: new Date().toISOString().split('T')[0] },
      { key: "my_name", label: "Your Name", type: "text", source: "user" },
    ];

    setVariables(prev => {
      const existingKeys = prev.map(v => v.key);
      const newVars = commonVars.filter(v => !existingKeys.includes(v.key));
      return [...prev, ...newVars];
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader>
            <DialogTitle>Create Document Template</DialogTitle>
            <DialogDescription>
              Create a reusable template with variables that can be automatically filled when generating documents.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Web Development Proposal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Document Type *</Label>
                <Select value={type} onValueChange={(value) => setType(value as DocumentType)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROPOSAL">Proposal</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INVOICE">Invoice</SelectItem>
                    <SelectItem value="REPORT">Report</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of what this template is for"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Variables Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Template Variables</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCommonVariables}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Add Common Variables
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVariableForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variable
                  </Button>
                </div>
              </div>

              {variables.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable, index) => (
                      <div key={variable.key} className="flex items-center gap-1">
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => insertVariable(variable.key)}
                          title={`Click to insert {{${variable.key}}} into content`}
                        >
                          {variable.label}
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1"
                          onClick={() => removeVariable(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click on a variable to insert it into your template content.
                  </p>
                </div>
              )}

              {showVariableForm && (
                <VariableForm
                  onSave={addVariable}
                  onCancel={() => setShowVariableForm(false)}
                />
              )}
            </div>

            {/* Content Section */}
            <div className="space-y-2">
              <Label htmlFor="content">Template Content *</Label>
              <div className="border rounded-md">
                <Textarea
                  id="content"
                  placeholder={`Enter your template content here. Use variables like {{client_name}}, {{project_scope}}, etc.
Example:
Dear {{client_name}},

Thank you for considering our services for your {{project_name}} project.

Project Scope:
{{project_description}}

Investment: {{project_cost}}

Best regards,
{{my_name}}`
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={13}
                  className="border-0 resize-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use double curly braces around variable names, e.g., {`{{client_name}}`}
              </p>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
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
              Create Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface VariableFormProps {
  onSave: (variable: DocumentVariable) => void;
  onCancel: () => void;
}

function VariableForm({ onSave, onCancel }: VariableFormProps) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<VariableType>("text");
  const [source, setSource] = useState<VariableSource>("manual");
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!key.trim() || !label.trim()) {
      toast.error("Variable key and label are required");
      return;
    }

    const variable: DocumentVariable = {
      key: key.trim().toLowerCase().replace(/\s+/g, '_'),
      label: label.trim(),
      type,
      source,
      required,
      defaultValue: defaultValue.trim() || undefined,
      description: description.trim() || undefined,
      options: type === 'select' ? options.split(',').map(opt => opt.trim()).filter(Boolean) : undefined,
    };

    onSave(variable);

    // Reset form
    setKey("");
    setLabel("");
    setType("text");
    setSource("manual");
    setRequired(false);
    setDefaultValue("");
    setDescription("");
    setOptions("");
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="variable-key">Variable Key *</Label>
            <Input
              id="variable-key"
              placeholder="e.g., client_name"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="variable-label">Display Label *</Label>
            <Input
              id="variable-label"
              placeholder="e.g., Client Name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="variable-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as VariableType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="select">Select (Dropdown)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="variable-source">Source</Label>
            <Select value={source} onValueChange={(value) => setSource(value as VariableSource)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Input</SelectItem>
                <SelectItem value="client">Client Data</SelectItem>
                <SelectItem value="project">Project Data</SelectItem>
                <SelectItem value="user">User Data</SelectItem>
                <SelectItem value="system">System Generated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {type === 'select' && (
          <div className="space-y-2">
            <Label htmlFor="variable-options">Options (comma-separated)</Label>
            <Input
              id="variable-options"
              placeholder="Option 1, Option 2, Option 3"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="variable-default">Default Value (Optional)</Label>
          <Input
            id="variable-default"
            placeholder="Default value for this variable"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="variable-description">Description (Optional)</Label>
          <Input
            id="variable-description"
            placeholder="Help text for this variable"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="variable-required"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="variable-required">Required field</Label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Add Variable
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
} 