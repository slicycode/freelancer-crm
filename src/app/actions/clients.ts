"use server";

import { prisma } from "@/lib/prisma";
import { Client, ClientStatus } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getClients(status: "ACTIVE" | "ARCHIVED" | "ALL" = "ACTIVE"): Promise<Client[]> {
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

    // Build where clause based on status filter
    const whereClause: { userId: string; status?: ClientStatus } = { userId: user.id };
    if (status === "ACTIVE") {
      whereClause.status = "ACTIVE";
    } else if (status === "ARCHIVED") {
      whereClause.status = "ARCHIVED";
    }
    // For "ALL" or undefined, don't add status filter

    // Fetch clients for this user based on status filter
    const clients = await prisma.client.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      include: {
        communications: {
          orderBy: { sentAt: "desc" },
          take: 1, // Get only the latest communication for lastContact
        },
        _count: {
          select: { projects: true }
        },
      },
    });

    // Transform clients to match the UI expected format
    return clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      notes: client.notes,
      tags: Array.isArray(client.tags) ? client.tags as string[] : (client.tags ? [] : []),
      lastContact: client.communications[0]?.sentAt.toISOString() || client.updatedAt.toISOString(),
      userId: client.userId,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      status: client.status as "ACTIVE" | "ARCHIVED",
    }));

  } catch (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }
}

export async function createClient(formData: FormData): Promise<Client> {
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

    // Extract form data
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;
    const notes = formData.get("notes") as string;
    const tagsString = formData.get("tags") as string;
    const tags = tagsString ? tagsString.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Validate required fields
    if (!name) {
      throw new Error("Name is required");
    }

    // Create the new client
    const client = await prisma.client.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        notes: notes || null,
        tags: tags, // Store tags as JSON array
        user: {
          connect: { id: user.id }
        }
      }
    });

    // Revalidate the clients page to reflect the new client
    revalidatePath("/clients");

    return {
      ...client,
      tags: Array.isArray(client.tags) ? client.tags as string[] : [],
      lastContact: client.updatedAt.toISOString(),
    };

  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
}

export async function updateClient(clientId: string, formData: FormData): Promise<Client> {
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
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id
      }
    });

    if (!existingClient) {
      throw new Error("Client not found or access denied");
    }

    // Extract form data
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;
    const notes = formData.get("notes") as string;
    const tagsString = formData.get("tags") as string;
    const tags = tagsString ? tagsString.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Validate required fields
    if (!name) {
      throw new Error("Name is required");
    }

    // Update the client
    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        notes: notes || null,
        tags: tags, // Store tags as JSON array
      }
    });

    // Revalidate the clients page to reflect the changes
    revalidatePath(`/clients/${clientId}`);

    return {
      ...client,
      tags: Array.isArray(client.tags) ? client.tags as string[] : [],
      lastContact: client.updatedAt.toISOString(),
    };

  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
}

export async function archiveClient(clientId: string): Promise<void> {
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

    // Verify client belongs to this user and is currently active
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
        status: "ACTIVE"
      }
    });

    if (!client) {
      throw new Error("Client not found or access denied");
    }

    // Archive the client by setting status to ARCHIVED
    await prisma.client.update({
      where: { id: clientId },
      data: { status: "ARCHIVED" }
    });

    // Revalidate the clients page to reflect the archival
    revalidatePath("/clients");

  } catch (error) {
    console.error("Error archiving client:", error);
    throw error;
  }
}

export async function unarchiveClient(clientId: string): Promise<void> {
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

    // Verify client belongs to this user and is currently archived
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
        status: "ARCHIVED"
      }
    });

    if (!client) {
      throw new Error("Client not found or access denied");
    }

    // Unarchive the client by setting status to ACTIVE
    await prisma.client.update({
      where: { id: clientId },
      data: { status: "ACTIVE" }
    });

    // Revalidate the clients page to reflect the unarchival
    revalidatePath("/clients");

  } catch (error) {
    console.error("Error unarchiving client:", error);
    throw error;
  }
}