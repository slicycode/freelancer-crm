"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentGenerator, DocumentStorage } from "@/lib/document-generator";
import { Document, DocumentType, DocumentStatus } from "@/types";
import {
  ArrowRight,
  Download,
  FileText,
  Loader2,
  Save,
  Wand2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DemoDocument extends Document {
  metrics: {
    wordCount: number;
    characterCount: number;
    estimatedReadTime: number;
    pageCount: number;
  };
}

interface DocumentGenerationDemoProps {
  className?: string;
}

export function DocumentGenerationDemo({ className }: DocumentGenerationDemoProps) {
  const [step, setStep] = useState<'template' | 'variables' | 'generate' | 'export'>('template');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedDocument, setGeneratedDocument] = useState<DemoDocument | null>(null);

  // Sample template and data
  const sampleTemplate = {
    name: "Web Development Proposal",
    content: `# {{project_name}} - Proposal

Dear {{client_name}},

Thank you for considering {{my_name}} for your web development project.

## Project Overview
{{project_description}}

## Timeline
- Start Date: {{start_date}}
- Estimated Completion: {{end_date}}
- Duration: {{duration}}

## Investment
- Total Cost: {{total_cost}}
- Payment Terms: {{payment_terms}}

Looking forward to working with you!

Best regards,
{{my_name}}
{{my_email}}`,
    variables: {
      project_name: "E-commerce Website",
      client_name: "John Smith",
      my_name: "Sarah Johnson",
      my_email: "sarah@webdev.com",
      project_description: "A modern, responsive e-commerce website with shopping cart, payment integration, and admin dashboard.",
      start_date: "January 15, 2024",
      end_date: "March 1, 2024",
      duration: "6 weeks",
      total_cost: "$8,500",
      payment_terms: "50% upfront, 50% on completion"
    }
  };

  const handleGenerateDocument = async () => {
    setLoading(true);
    try {
      // Simulate document generation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const processedContent = DocumentGenerator.processTemplate(
        sampleTemplate.content,
        sampleTemplate.variables
      );

      const metrics = DocumentGenerator.calculateMetrics(processedContent);

      const mockDocument: DemoDocument = {
        id: "demo-doc-123",
        name: `${sampleTemplate.variables.project_name} - Proposal`,
        content: processedContent,
        type: "PROPOSAL" as DocumentType,
        status: "DRAFT" as DocumentStatus,
        variableValues: sampleTemplate.variables,
        metrics,
        userId: "demo-user",
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setGeneratedDocument(mockDocument);
      setStep('export');
      toast.success("Document generated successfully!");
    } catch (error: unknown) {
      console.error('Document generation failed:', error);
      toast.error("Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  const handleExportHtml = () => {
    if (!generatedDocument || !generatedDocument.content) return;

    const htmlContent = DocumentGenerator.formatForExport(
      generatedDocument.content,
      generatedDocument.name
    );

    DocumentStorage.downloadAsHtml(htmlContent, generatedDocument.name);
    toast.success("Document exported as HTML!");
  };

  const handleExportText = () => {
    if (!generatedDocument || !generatedDocument.content) return;

    DocumentStorage.downloadAsText(generatedDocument.content, generatedDocument.name);
    toast.success("Document exported as text!");
  };

  const handleExportPdf = () => {
    if (!generatedDocument || !generatedDocument.content) return;

    const htmlContent = DocumentGenerator.formatForExport(
      generatedDocument.content,
      generatedDocument.name
    );

    // Use browser's print dialog for PDF export
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      toast.success("PDF export dialog opened!");
    }
  };

  const handleCreateVersion = () => {
    if (!generatedDocument) return;

    // Simulate version creation for demo
    const versionId = `demo-v${Date.now()}`;
    toast.success(`Version ${versionId} created!`);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'template':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Template Setup
              </CardTitle>
              <CardDescription>
                Start with a professional template with variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Template Content Preview:</h4>
                  <div className="p-3 bg-muted/50 rounded border text-sm font-mono">
                    {sampleTemplate.content.slice(0, 200)}...
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Variables ({Object.keys(sampleTemplate.variables).length}):</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(sampleTemplate.variables).map(key => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {`{{${key}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={() => setStep('variables')} className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Configure Variables
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'variables':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Variable Configuration
              </CardTitle>
              <CardDescription>
                Variables automatically populated from client/project data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(sampleTemplate.variables).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm font-medium">{key}:</span>
                    <span className="text-sm text-muted-foreground">{value}</span>
                  </div>
                ))}
                <Button onClick={() => setStep('generate')} className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'generate':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Document Generation
              </CardTitle>
              <CardDescription>
                Process template with variables and create professional document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Processing template variables...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Ready to generate your professional document
                      </p>
                      <Button onClick={handleGenerateDocument} className="w-full">
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Document
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'export':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export & Manage
              </CardTitle>
              <CardDescription>
                Export in multiple formats and track versions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedDocument && (
                <div className="space-y-4">
                  {/* Document Metrics */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">
                        {generatedDocument.metrics.wordCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">
                        {generatedDocument.metrics.pageCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">
                        {generatedDocument.metrics.estimatedReadTime}
                      </div>
                      <div className="text-xs text-muted-foreground">Min read</div>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={handleExportHtml} variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      HTML
                    </Button>
                    <Button onClick={handleExportText} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Text
                    </Button>
                    <Button onClick={handleExportPdf} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>

                  {/* Version Management */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Version Control</span>
                      <Badge variant="secondary">v1.0</Badge>
                    </div>
                    <Button onClick={handleCreateVersion} variant="outline" size="sm" className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Create Version Snapshot
                    </Button>
                  </div>

                  {/* Reset Demo */}
                  <div className="border-t pt-4">
                    <Button
                      onClick={() => {
                        setStep('template');
                        setGeneratedDocument(null);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Start Over
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card >
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {['template', 'variables', 'generate', 'export'].map((s, index) => (
          <div
            key={s}
            className={`flex items-center ${index < 3 ? 'flex-1' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${step === s
                ? 'bg-primary text-primary-foreground'
                : ['template', 'variables', 'generate'].indexOf(step) > ['template', 'variables', 'generate'].indexOf(s) ||
                  (step === 'export' && s !== 'export')
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
                }`}
            >
              {index + 1}
            </div>
            {index < 3 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${['template', 'variables', 'generate'].indexOf(step) > index ||
                  step === 'export'
                  ? 'bg-primary/20'
                  : 'bg-muted'
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
} 