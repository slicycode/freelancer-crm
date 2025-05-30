import { DocumentGenerationDemo } from "@/components/document-generation-demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  GraduationCap,
  Save,
  Target,
  Wand2
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Document Generation Tutorial - FreelancerCRM",
  description: "Learn how to create templates and generate professional documents",
};

export default function DocumentTutorialPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/documents">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-3">
              <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                Document Generation Tutorial
              </h1>
              <p className="text-indigo-700 dark:text-indigo-300">
                Master the art of creating professional documents in minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                What You&apos;ll Learn
              </CardTitle>
              <CardDescription>
                Everything you need to know about creating documents (5 min read)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Template System</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Create reusable document templates
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Use variables for dynamic content
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Auto-populate with client data
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Preview before generating
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Document Management</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Generate professional documents
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Export as HTML, PDF, or text
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Version control and tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Status management workflow
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Interactive Demo
              </CardTitle>
              <CardDescription>
                Follow along with this hands-on demonstration of the document generation process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">How It Works</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium">Template Setup</h4>
                          <p className="text-sm text-muted-foreground">
                            Start with a professional template or create your own with variable placeholders like <code className="bg-muted px-1 rounded">{"{{client_name}}"}</code>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium">Variable Configuration</h4>
                          <p className="text-sm text-muted-foreground">
                            Fill in variables automatically from your client and project data, or customize manually
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium">Document Generation</h4>
                          <p className="text-sm text-muted-foreground">
                            Process the template with your variables to create a professional, formatted document
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          4
                        </div>
                        <div>
                          <h4 className="font-medium">Export & Management</h4>
                          <p className="text-sm text-muted-foreground">
                            Export in multiple formats, track versions, and manage document status throughout its lifecycle
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Key Features</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-blue-500" />
                        Multiple export formats
                      </div>
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4 text-green-500" />
                        Version control
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-orange-500" />
                        Status tracking
                      </div>
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-purple-500" />
                        Smart automation
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:w-96">
                  <DocumentGenerationDemo />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                Ready to start creating your own documents?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Now that you understand how the system works, here&apos;s what you can do:
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/documents">
                    <Button className="w-full" size="lg">
                      <FileText className="h-4 w-4 mr-2" />
                      Browse Template Gallery
                    </Button>
                  </Link>

                  <Link href="/documents">
                    <Button variant="outline" className="w-full" size="lg">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  </Link>
                </div>

                <div className="text-xs text-muted-foreground text-center pt-4">
                  <p>
                    Need help? The tutorial button is always available in the documents section.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 