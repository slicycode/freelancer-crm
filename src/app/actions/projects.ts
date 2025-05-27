"use server";

import { prisma } from "@/lib/prisma";
import { Project, ProjectStatus } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getProjects(): Promise<Project[]> {
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

    // Fetch all projects for this user
    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          }
        },
        communications: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
        _count: {
          select: { communications: true }
        },
      },
    });

    // Transform projects to match the UI expected format
    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      clientId: project.clientId,
      clientName: project.client.name,
      clientCompany: project.client.company,
      lastActivity: project.communications[0]?.sentAt || project.updatedAt,
      communicationCount: project._count.communications,
      userId: project.userId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
}

export async function createProject(formData: FormData): Promise<Project> {
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
    const description = formData.get("description") as string;
    const clientId = formData.get("clientId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    // Validate required fields
    if (!name || !clientId) {
      throw new Error("Name and client are required");
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

    // Create the new project
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        user: {
          connect: { id: user.id }
        },
        client: {
          connect: { id: clientId }
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          }
        }
      }
    });

    // Revalidate the projects page to reflect the new project
    revalidatePath("/projects");

    return {
      ...project,
      clientName: project.client.name,
      clientCompany: project.client.company,
      lastActivity: project.updatedAt,
      communicationCount: 0,
    };

  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

export async function updateProject(projectId: string, formData: FormData): Promise<Project> {
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

    // Verify project belongs to this user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id
      }
    });

    if (!existingProject) {
      throw new Error("Project not found or access denied");
    }

    // Extract form data
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    // Validate required fields
    if (!name) {
      throw new Error("Name is required");
    }

    // Update the project
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description: description || null,
        status: status as ProjectStatus,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          }
        }
      }
    });

    // Revalidate the project page to reflect the changes
    revalidatePath(`/projects/${projectId}`);

    return {
      ...project,
      clientName: project.client.name,
      clientCompany: project.client.company,
      lastActivity: project.updatedAt,
      communicationCount: 0,
    };

  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

export async function deleteProject(projectId: string): Promise<void> {
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

    // Verify project belongs to this user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id
      }
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Delete the project (cascade will handle related records)
    await prisma.project.delete({
      where: { id: projectId }
    });

    // Revalidate the projects page to reflect the deletion
    revalidatePath("/projects");

  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

export async function getClientProjects(clientId: string): Promise<{ id: string; name: string }[]> {
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

    // Fetch the client's projects
    const projects = await prisma.project.findMany({
      where: {
        clientId,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return projects;

  } catch (error) {
    console.error("Error fetching client projects:", error);
    throw error;
  }
} 