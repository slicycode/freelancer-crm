"use server";

import { prisma } from "@/lib/prisma";
import { Document, DocumentStatus, DocumentType, DocumentVersion } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getDocuments(): Promise<Document[]> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Fetch all documents for this user (excluding templates)
    const documents = await prisma.document.findMany({
      where: { 
        userId: user.id,
        isTemplate: false // Only get actual documents, not templates
      },
      orderBy: { updatedAt: "desc" },
      include: {
        client: {
          select: {
            name: true,
            company: true
          }
        },
        project: {
          select: {
            name: true
          }
        },
        template: {
          select: {
            name: true
          }
        }
      },
    });

    // Transform documents to match the UI expected format
    return documents.map(document => ({
      id: document.id,
      name: document.name,
      type: document.type,
      status: document.status,
      content: document.content,
      url: document.url,
      size: document.size,
      clientId: document.clientId,
      projectId: document.projectId,
      clientName: document.client?.name || undefined,
      projectName: document.project?.name || undefined,
      templateId: document.templateId,
      templateName: document.template?.name || undefined,
      variableValues: (document.variableValues as unknown as Record<string, string | number | boolean>) || undefined,
      isTemplate: document.isTemplate,
      userId: document.userId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    }));

  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
}

export async function createDocument(documentData: {
  name: string;
  type: DocumentType;
  status?: DocumentStatus;
  content?: string;
  url?: string;
  size?: number;
  clientId?: string;
  projectId?: string;
  templateId?: string;
  variableValues?: Record<string, string | number | boolean>;
}): Promise<Document> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate required fields
    if (!documentData.name) {
      throw new Error("Document name is required");
    }

    if (!documentData.type) {
      throw new Error("Document type is required");
    }

    // If clientId is provided, verify it belongs to the user
    if (documentData.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: documentData.clientId,
          userId: user.id
        }
      });

      if (!client) {
        throw new Error("Client not found");
      }
    }

    // If projectId is provided, verify it belongs to the user
    if (documentData.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: documentData.projectId,
          userId: user.id
        }
      });

      if (!project) {
        throw new Error("Project not found");
      }
    }

    // If templateId is provided, verify it belongs to the user
    if (documentData.templateId) {
      const template = await prisma.documentTemplate.findFirst({
        where: {
          id: documentData.templateId,
          userId: user.id
        }
      });

      if (!template) {
        throw new Error("Template not found");
      }
    }

    // Create the new document
    const document = await prisma.document.create({
      data: {
        name: documentData.name,
        type: documentData.type,
        status: documentData.status || "DRAFT",
        content: documentData.content || null,
        url: documentData.url || null,
        size: documentData.size || null,
        variableValues: documentData.variableValues ? (documentData.variableValues as unknown as Prisma.InputJsonValue) : undefined,
        isTemplate: false,
        user: {
          connect: { id: user.id }
        },
        ...(documentData.clientId && {
          client: {
            connect: { id: documentData.clientId }
          }
        }),
        ...(documentData.projectId && {
          project: {
            connect: { id: documentData.projectId }
          }
        }),
        ...(documentData.templateId && {
          template: {
            connect: { id: documentData.templateId }
          }
        })
      },
      include: {
        client: {
          select: {
            name: true,
            company: true
          }
        },
        project: {
          select: {
            name: true
          }
        },
        template: {
          select: {
            name: true
          }
        }
      }
    });

    // Revalidate the documents page to reflect the new document
    revalidatePath("/documents");

    return {
      id: document.id,
      name: document.name,
      type: document.type,
      status: document.status,
      content: document.content,
      url: document.url,
      size: document.size,
      clientId: document.clientId,
      projectId: document.projectId,
      clientName: document.client?.name || undefined,
      projectName: document.project?.name || undefined,
      templateId: document.templateId,
      templateName: document.template?.name || undefined,
      variableValues: (document.variableValues as unknown as Record<string, string | number | boolean>) || undefined,
      isTemplate: document.isTemplate,
      userId: document.userId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };

  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
}

export async function updateDocument(
  documentId: string,
  documentData: Partial<{
    name: string;
    type: DocumentType;
    status: DocumentStatus;
    content: string;
    url: string;
    size: number;
    clientId: string;
    projectId: string;
    variableValues: Record<string, string | number | boolean>;
  }>
): Promise<Document> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the document exists and belongs to the user
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!existingDocument) {
      throw new Error("Document not found or access denied");
    }

    // If clientId is provided, verify it belongs to the user
    if (documentData.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: documentData.clientId,
          userId: user.id
        }
      });

      if (!client) {
        throw new Error("Client not found");
      }
    }

    // If projectId is provided, verify it belongs to the user
    if (documentData.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: documentData.projectId,
          userId: user.id
        }
      });

      if (!project) {
        throw new Error("Project not found");
      }
    }

    // Build update data object
    const updateData: Prisma.DocumentUpdateInput = {};
    
    if (documentData.name !== undefined) updateData.name = documentData.name;
    if (documentData.type !== undefined) updateData.type = documentData.type;
    if (documentData.status !== undefined) updateData.status = documentData.status;
    if (documentData.content !== undefined) updateData.content = documentData.content;
    if (documentData.url !== undefined) updateData.url = documentData.url;
    if (documentData.size !== undefined) updateData.size = documentData.size;
    if (documentData.clientId !== undefined) updateData.client = { connect: { id: documentData.clientId } };
    if (documentData.projectId !== undefined) updateData.project = { connect: { id: documentData.projectId } };
    if (documentData.variableValues !== undefined) updateData.variableValues = documentData.variableValues as unknown as Prisma.InputJsonValue;

    // Update the document
    const document = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        client: {
          select: {
            name: true,
            company: true
          }
        },
        project: {
          select: {
            name: true
          }
        },
        template: {
          select: {
            name: true
          }
        }
      }
    });

    // Revalidate the documents page to reflect the changes
    revalidatePath("/documents");
    revalidatePath(`/documents/${documentId}`);

    return {
      id: document.id,
      name: document.name,
      type: document.type,
      status: document.status,
      content: document.content,
      url: document.url,
      size: document.size,
      clientId: document.clientId,
      projectId: document.projectId,
      clientName: document.client?.name || undefined,
      projectName: document.project?.name || undefined,
      templateId: document.templateId,
      templateName: document.template?.name || undefined,
      variableValues: (document.variableValues as unknown as Record<string, string | number | boolean>) || undefined,
      isTemplate: document.isTemplate,
      userId: document.userId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };

  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the document exists and belongs to the user
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!existingDocument) {
      throw new Error("Document not found or access denied");
    }

    // Delete the document
    await prisma.document.delete({
      where: { id: documentId }
    });

    // Revalidate the documents page to reflect the deletion
    revalidatePath("/documents");

  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
}

export async function getDocument(documentId: string): Promise<Document> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Fetch the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      },
      include: {
        client: {
          select: {
            name: true,
            company: true
          }
        },
        project: {
          select: {
            name: true
          }
        },
        template: {
          select: {
            name: true
          }
        }
      }
    });

    if (!document) {
      throw new Error("Document not found or access denied");
    }

    return {
      id: document.id,
      name: document.name,
      type: document.type,
      status: document.status,
      content: document.content,
      url: document.url,
      size: document.size,
      clientId: document.clientId,
      projectId: document.projectId,
      clientName: document.client?.name || undefined,
      projectName: document.project?.name || undefined,
      templateId: document.templateId,
      templateName: document.template?.name || undefined,
      variableValues: (document.variableValues as unknown as Record<string, string | number | boolean>) || undefined,
      isTemplate: document.isTemplate,
      userId: document.userId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };

  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
}

/**
 * Create a new version of a document
 */
export async function createDocumentVersion(
  documentId: string,
  changeNotes?: string
): Promise<DocumentVersion> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the document exists and belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!document) {
      throw new Error("Document not found or access denied");
    }

    if (!document.content) {
      throw new Error("Cannot create version of document without content");
    }

    // Get the next version number
    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' }
    });

    const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

    // Calculate content hash for change detection
    let hash = 0;
    for (let i = 0; i < document.content.length; i++) {
      const char = document.content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const contentHash = Math.abs(hash).toString(36);

    // Calculate document metrics
    const text = document.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const words = text.split(' ').filter(word => word.length > 0);
    const metrics = {
      wordCount: words.length,
      characterCount: text.length,
      estimatedReadTime: Math.ceil(words.length / 200), // 200 words per minute
      pageCount: Math.ceil(words.length / 250) // ~250 words per page
    };

    // Create the version
    const version = await prisma.documentVersion.create({
      data: {
        versionNumber: nextVersionNumber,
        content: document.content,
        variableValues: document.variableValues || {},
        contentHash,
        changeNotes,
        metrics: metrics as unknown as {
          wordCount: number;
          characterCount: number;
          estimatedReadTime: number;
          pageCount: number;
        },
        createdBy: user.name || user.email,
        document: {
          connect: { id: documentId }
        }
      }
    });

    // Revalidate the document page
    revalidatePath(`/documents/${documentId}`);

    return {
      id: version.id,
      versionNumber: version.versionNumber,
      content: version.content,
      variableValues: (version.variableValues as unknown as Record<string, string | number | boolean>) || undefined,
      contentHash: version.contentHash,
      changeNotes: version.changeNotes,
      metrics: (version.metrics as unknown as {
        wordCount: number;
        characterCount: number;
        estimatedReadTime: number;
        pageCount: number;
      }) || undefined,
      createdBy: version.createdBy,
      documentId: version.documentId,
      createdAt: version.createdAt,
    };

  } catch (error) {
    console.error("Error creating document version:", error);
    throw error;
  }
}

/**
 * Get all versions of a document
 */
export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the document exists and belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!document) {
      throw new Error("Document not found or access denied");
    }

    // Fetch all versions
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' }
    });

    return versions.map(version => ({
      id: version.id,
      versionNumber: version.versionNumber,
      content: version.content,
      variableValues: (version.variableValues as unknown as Record<string, string | number | boolean>) || undefined,
      contentHash: version.contentHash,
      changeNotes: version.changeNotes,
        metrics: (version.metrics as unknown as {
        wordCount: number;
        characterCount: number;
        estimatedReadTime: number;
        pageCount: number;
      }) || undefined,
      createdBy: version.createdBy,
      documentId: version.documentId,
      createdAt: version.createdAt,
    }));

  } catch (error) {
    console.error("Error fetching document versions:", error);
    throw error;
  }
}

/**
 * Get a specific version of a document
 */
export async function getDocumentVersion(
  documentId: string, 
  versionId: string
): Promise<DocumentVersion> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the document exists and belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!document) {
      throw new Error("Document not found or access denied");
    }

    // Fetch the specific version
    const version = await prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentId
      }
    });

    if (!version) {
      throw new Error("Version not found");
    }

    return {
      id: version.id,
      versionNumber: version.versionNumber,
      content: version.content,
      variableValues: (version.variableValues as unknown as Record<string, string | number | boolean>) || undefined,
      contentHash: version.contentHash,
      changeNotes: version.changeNotes,
      metrics: (version.metrics as unknown as {
        wordCount: number;
        characterCount: number;
        estimatedReadTime: number;
        pageCount: number;
      }) || undefined,
      createdBy: version.createdBy,
      documentId: version.documentId,
      createdAt: version.createdAt,
    };

  } catch (error) {
    console.error("Error fetching document version:", error);
    throw error;
  }
}

/**
 * Restore a document to a specific version
 */
export async function restoreDocumentToVersion(
  documentId: string,
  versionId: string
): Promise<Document> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the document exists and belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!document) {
      throw new Error("Document not found or access denied");
    }

    // Get the version to restore
    const version = await prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentId
      }
    });

    if (!version) {
      throw new Error("Version not found");
    }

    // Create a new version with current content before restoring
    await createDocumentVersion(documentId, `Backup before restoring to v${version.versionNumber}`);

    // Update the document with the version content
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        content: version.content,
        variableValues: version.variableValues as Prisma.InputJsonValue,
        updatedAt: new Date()
      },
      include: {
        client: {
          select: {
            name: true,
            company: true
          }
        },
        project: {
          select: {
            name: true
          }
        },
        template: {
          select: {
            name: true
          }
        }
      }
    });

    // Create a new version for the restore action
    await createDocumentVersion(documentId, `Restored to v${version.versionNumber}`);

    // Revalidate the document page
    revalidatePath(`/documents/${documentId}`);
    revalidatePath("/documents");

    return {
      id: updatedDocument.id,
      name: updatedDocument.name,
      type: updatedDocument.type,
      status: updatedDocument.status,
      content: updatedDocument.content,
      url: updatedDocument.url,
      size: updatedDocument.size,
      clientId: updatedDocument.clientId,
      projectId: updatedDocument.projectId,
      clientName: updatedDocument.client?.name || undefined,
      projectName: updatedDocument.project?.name || undefined,
      templateId: updatedDocument.templateId,
      templateName: updatedDocument.template?.name || undefined,
      variableValues: (updatedDocument.variableValues as unknown as Record<string, string | number | boolean>) || undefined,
      isTemplate: updatedDocument.isTemplate,
      userId: updatedDocument.userId,
      createdAt: updatedDocument.createdAt,
      updatedAt: updatedDocument.updatedAt,
    };

  } catch (error) {
    console.error("Error restoring document to version:", error);
    throw error;
  }
} 