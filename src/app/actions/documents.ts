"use server";

import { prisma } from "@/lib/prisma";
import { Document, DocumentStatus, DocumentType } from "@/types";
import { auth } from "@clerk/nextjs/server";
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
      variableValues: (document.variableValues as unknown as Record<string, any>) || undefined,
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
  variableValues?: Record<string, any>;
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
        variableValues: documentData.variableValues ? (documentData.variableValues as unknown as any) : null,
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
      variableValues: (document.variableValues as unknown as Record<string, any>) || undefined,
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
    variableValues: Record<string, any>;
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
    const updateData: any = {};
    
    if (documentData.name !== undefined) updateData.name = documentData.name;
    if (documentData.type !== undefined) updateData.type = documentData.type;
    if (documentData.status !== undefined) updateData.status = documentData.status;
    if (documentData.content !== undefined) updateData.content = documentData.content;
    if (documentData.url !== undefined) updateData.url = documentData.url;
    if (documentData.size !== undefined) updateData.size = documentData.size;
    if (documentData.clientId !== undefined) updateData.clientId = documentData.clientId;
    if (documentData.projectId !== undefined) updateData.projectId = documentData.projectId;
    if (documentData.variableValues !== undefined) updateData.variableValues = documentData.variableValues as unknown as any;

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
      variableValues: (document.variableValues as unknown as Record<string, any>) || undefined,
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
      variableValues: (document.variableValues as unknown as Record<string, any>) || undefined,
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