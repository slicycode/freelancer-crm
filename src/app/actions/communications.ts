"use server";

import { prisma } from "@/lib/prisma";
import { Communication, CommunicationType } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getClientCommunications(clientId: string): Promise<Communication[]> {
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

    // Verify client belongs to this user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id
      }
    });

    if (!client) {
      throw new Error("Client not found or access denied");
    }

    // Fetch communications with attachments and project info
    const communications = await prisma.communication.findMany({
      where: { clientId },
      orderBy: { sentAt: "desc" },
      include: {
        attachments: true,
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        }
      }
    });

    // Transform communications to match the UI expected format
    return communications.map(comm => ({
      id: comm.id,
      type: comm.type,
      subject: comm.subject,
      content: comm.content,
      sentAt: comm.sentAt,
      clientId: comm.clientId,
      projectId: comm.projectId,
      projectTag: comm.project?.name,
      attachments: comm.attachments.map(att => ({
        id: att.id,
        name: att.name,
        url: att.url,
        size: att.size,
        type: att.type,
        communicationId: att.communicationId,
        createdAt: att.createdAt,
        updatedAt: att.updatedAt,
      })),
      createdAt: comm.createdAt,
      updatedAt: comm.updatedAt,
    }));

  } catch (error) {
    console.error("Error fetching communications:", error);
    throw error;
  }
}

export async function createCommunication(
  clientId: string, 
  formData: FormData
): Promise<Communication> {
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

    // Verify client belongs to this user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id
      }
    });

    if (!client) {
      throw new Error("Client not found or access denied");
    }

    // Extract form data
    const typeString = formData.get("type") as string;
    const type = typeString as CommunicationType;
    const subject = formData.get("subject") as string;
    const content = formData.get("content") as string;
    const projectId = formData.get("projectId") as string;
    
    // File attachments would require additional handling with file uploads
    // For now, we'll handle attachments as a simplified version
    
    // Validate required fields
    if (!type || !subject || !content) {
      throw new Error("Type, subject and content are required");
    }

    // Create the communication
    const communication = await prisma.communication.create({
      data: {
        type,
        subject,
        content,
        sentAt: new Date(),
        client: {
          connect: { id: clientId }
        },
        project: projectId ? {
          connect: { id: projectId }
        } : undefined
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // For a real implementation, you would handle file uploads here
    // and create attachments linked to the communication

    // Revalidate the client communications page to reflect the new communication
    revalidatePath(`/clients/${clientId}`);

    return {
      ...communication,
      projectTag: communication.project?.name,
      attachments: [],
    };

  } catch (error) {
    console.error("Error creating communication:", error);
    throw error;
  }
}

export async function updateCommunication(
  clientId: string,
  communicationId: string, 
  formData: FormData
): Promise<Communication> {
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

    // Verify client belongs to this user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id
      }
    });

    if (!client) {
      throw new Error("Client not found or access denied");
    }

    // Verify communication belongs to this client
    const existingCommunication = await prisma.communication.findFirst({
      where: {
        id: communicationId,
        clientId
      }
    });

    if (!existingCommunication) {
      throw new Error("Communication not found or access denied");
    }

    // Extract form data
    const typeString = formData.get("type") as string;
    const type = typeString as CommunicationType;
    const subject = formData.get("subject") as string;
    const content = formData.get("content") as string;
    const projectId = formData.get("projectId") as string;
    
    // Validate required fields
    if (!type || !subject || !content) {
      throw new Error("Type, subject and content are required");
    }

    // Update the communication
    const communication = await prisma.communication.update({
      where: { id: communicationId },
      data: {
        type,
        subject,
        content,
        project: projectId ? {
          connect: { id: projectId }
        } : {
          disconnect: true
        }
      },
      include: {
        attachments: true,
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Revalidate the client communications page to reflect the changes
    revalidatePath(`/clients/${clientId}`);

    return {
      ...communication,
      projectTag: communication.project?.name,
      attachments: communication.attachments,
    };

  } catch (error) {
    console.error("Error updating communication:", error);
    throw error;
  }
}

export async function deleteCommunication(
  clientId: string,
  communicationId: string
): Promise<void> {
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

    // Verify client belongs to this user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id
      }
    });

    if (!client) {
      throw new Error("Client not found or access denied");
    }

    // Verify communication belongs to this client
    const communication = await prisma.communication.findFirst({
      where: {
        id: communicationId,
        clientId
      }
    });

    if (!communication) {
      throw new Error("Communication not found or access denied");
    }

    // Delete the communication (cascade will handle attachments)
    await prisma.communication.delete({
      where: { id: communicationId }
    });

    // Revalidate the client communications page to reflect the deletion
    revalidatePath(`/clients/${clientId}`);

  } catch (error) {
    console.error("Error deleting communication:", error);
    throw error;
  }
}