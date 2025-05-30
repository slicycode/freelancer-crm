"use server";

import { DocumentGenerator } from "@/lib/document-generator";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createDocumentVersion as createVersionInDB } from "./documents";

/**
 * Export document as HTML
 */
export async function exportDocumentAsHtml(documentId: string): Promise<{
  success: boolean;
  filename?: string;
  content?: string;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Fetch the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      },
      include: {
        client: true,
        project: true,
        template: true
      }
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    if (!document.content) {
      return { success: false, error: "Document has no content to export" };
    }

    // Process template variables if document was generated from template
    let processedContent = document.content;
    if (document.variableValues) {
      processedContent = DocumentGenerator.processTemplate(
        document.content,
        document.variableValues as Record<string, string | number | boolean>
      );
    }

    // Format for export
    const htmlContent = DocumentGenerator.formatForExport(processedContent, document.name);
    const filename = DocumentGenerator.generateFilename(document.name, 'html');

    // Update document with export metadata
    await prisma.document.update({
      where: { id: documentId },
      data: {
        size: htmlContent.length,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      filename,
      content: htmlContent
    };

  } catch (error) {
    console.error("Error exporting document as HTML:", error);
    return { success: false, error: "Failed to export document" };
  }
}

/**
 * Export document with processed variables
 */
export async function exportProcessedDocument(documentId: string): Promise<{
  success: boolean;
  content?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Fetch the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!document || !document.content) {
      return { success: false, error: "Document not found or has no content" };
    }

    // Process variables if available
    let processedContent = document.content;
    if (document.variableValues) {
      processedContent = DocumentGenerator.processTemplate(
        document.content,
        document.variableValues as Record<string, string | number | boolean>
      );
    }

    const filename = DocumentGenerator.generateFilename(document.name, 'txt');

    return {
      success: true,
      content: processedContent,
      filename
    };

  } catch (error) {
    console.error("Error exporting processed document:", error);
    return { success: false, error: "Failed to export document" };
  }
}

/**
 * Create document version snapshot
 */
export async function createDocumentVersion(
  documentId: string,
  changeDescription?: string
): Promise<{
  success: boolean;
  versionId?: string;
  error?: string;
}> {
  try {
    const version = await createVersionInDB(documentId, changeDescription);
    
    revalidatePath(`/documents/${documentId}`);

    return {
      success: true,
      versionId: version.id
    };

  } catch (error) {
    console.error("Error creating document version:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create document version" 
    };
  }
}

/**
 * Get document metrics and analytics
 */
export async function getDocumentMetrics(documentId: string): Promise<{
  success: boolean;
  metrics?: {
    wordCount: number;
    characterCount: number;
    estimatedReadTime: number;
    pageCount: number;
    lastModified: Date;
    versions: number;
  };
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Fetch the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Calculate metrics
    const contentMetrics = DocumentGenerator.calculateMetrics(document.content || '');
    
    // Count versions from database
    const versionCount = await prisma.documentVersion.count({
      where: { documentId }
    });

    return {
      success: true,
      metrics: {
        ...contentMetrics,
        lastModified: document.updatedAt,
        versions: versionCount
      }
    };

  } catch (error) {
    console.error("Error getting document metrics:", error);
    return { success: false, error: "Failed to get document metrics" };
  }
}

/**
 * Generate document with enhanced processing
 */
export async function generateEnhancedDocument(data: {
  templateId: string;
  name: string;
  variableValues: Record<string, string | number | boolean>;
  clientId?: string;
  projectId?: string;
  status?: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "ARCHIVED";
  createVersion?: boolean;
}): Promise<{
  success: boolean;
  documentId?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get the template
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: data.templateId,
        OR: [
          { userId: user.id },
          { isGlobal: true }
        ]
      }
    });

    if (!template) {
      return { success: false, error: "Template not found or access denied" };
    }

    // Process template with variables
    const processedContent = DocumentGenerator.processTemplate(
      template.content,
      data.variableValues
    );

    // Calculate metrics
    const metrics = DocumentGenerator.calculateMetrics(processedContent);

    // Create the document with enhanced metadata
    const document = await prisma.document.create({
      data: {
        name: data.name,
        type: template.type,
        status: data.status || "DRAFT",
        content: processedContent,
        size: processedContent.length,
        variableValues: {
          ...data.variableValues,
          metrics,
          generatedAt: new Date().toISOString(),
          templateVersion: template.updatedAt.toISOString(),
        } as Prisma.InputJsonValue,
        isTemplate: false,
        user: {
          connect: { id: user.id }
        },
        template: {
          connect: { id: template.id }
        },
        ...(data.clientId && {
          client: {
            connect: { id: data.clientId }
          }
        }),
        ...(data.projectId && {
          project: {
            connect: { id: data.projectId }
          }
        })
      }
    });

    // Create initial version if requested
    if (data.createVersion) {
      await createVersionInDB(document.id, "Initial version");
    }

    revalidatePath("/documents");

    const filename = DocumentGenerator.generateFilename(document.name, 'html');

    return {
      success: true,
      documentId: document.id,
      filename
    };

  } catch (error) {
    console.error("Error generating enhanced document:", error);
    return { success: false, error: "Failed to generate document" };
  }
}

/**
 * Update document status with tracking
 */
export async function updateDocumentStatus(
  documentId: string,
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "ARCHIVED",
  notes?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get current document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Track status change
    const statusHistory = ((document.variableValues as Record<string, string | number | boolean>)?.statusHistory || []) as {
      from: string;
      to: string;
      changedBy: string;
      changedAt: string;
      notes: string;
    }[];
    statusHistory.push({
      from: document.status,
      to: status,
      changedBy: user.name || user.email,
      changedAt: new Date().toISOString(),
      notes: notes || ''
    });

    // Update document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        variableValues: {
          ...(document.variableValues as Record<string, string | number | boolean> || {}),
          statusHistory
        },
        updatedAt: new Date()
      }
    });

    revalidatePath(`/documents/${documentId}`);
    revalidatePath("/documents");

    return { success: true };

  } catch (error) {
    console.error("Error updating document status:", error);
    return { success: false, error: "Failed to update document status" };
  }
}

/**
 * Export document as PDF
 */
export async function exportDocumentAsPdf(documentId: string): Promise<{
  success: boolean;
  filename?: string;
  content?: string;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Fetch the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      },
      include: {
        client: true,
        project: true,
        template: true
      }
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    if (!document.content) {
      return { success: false, error: "Document has no content to export" };
    }

    // Process template variables if document was generated from template
    let processedContent = document.content;
    if (document.variableValues) {
      processedContent = DocumentGenerator.processTemplate(
        document.content,
        document.variableValues as Record<string, string | number | boolean>
      );
    }

    // Format for export with PDF-optimized styling
    const htmlContent = DocumentGenerator.formatForExport(processedContent, document.name);
    const filename = DocumentGenerator.generateFilename(document.name, 'pdf');

    // Update document with export metadata
    await prisma.document.update({
      where: { id: documentId },
      data: {
        size: htmlContent.length,
        updatedAt: new Date()
      }
    });

    // Return HTML content that will be converted to PDF on the client side
    return {
      success: true,
      filename,
      content: htmlContent
    };

  } catch (error) {
    console.error("Error exporting document as PDF:", error);
    return { success: false, error: "Failed to export document" };
  }
} 