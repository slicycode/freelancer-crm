"use server";

import { prisma } from "@/lib/prisma";
import { Milestone, MilestoneStatus } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createTimelineEntry, TimelineEntry } from "./timeline";

export async function getMilestones(projectId: string): Promise<Milestone[]> {
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

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { order: "asc" }
    });

    return milestones.map(milestone => ({
      id: milestone.id,
      name: milestone.name,
      description: milestone.description || undefined,
      dueDate: milestone.dueDate,
      status: milestone.status,
      deliverables: Array.isArray(milestone.deliverables) ? milestone.deliverables as string[] : [],
      paymentAmount: milestone.paymentAmount ? Number(milestone.paymentAmount) : undefined,
      clientApprovalRequired: milestone.clientApprovalRequired,
      projectId: milestone.projectId,
      order: milestone.order,
      completedAt: milestone.completedAt || undefined,
      userId: milestone.userId,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    }));

  } catch (error) {
    console.error("Error fetching milestones:", error);
    throw error;
  }
}

export async function createMilestone(formData: FormData): Promise<Milestone> {
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
    const projectId = formData.get("projectId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const dueDate = formData.get("dueDate") as string;
    const paymentAmount = formData.get("paymentAmount") as string;
    const clientApprovalRequired = formData.get("clientApprovalRequired") === "true";
    const deliverables = formData.get("deliverables") as string;

    // Validate required fields
    if (!projectId || !name || !dueDate) {
      throw new Error("Project ID, name, and due date are required");
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

    // Get the next order number
    const lastMilestone = await prisma.milestone.findFirst({
      where: { projectId },
      orderBy: { order: "desc" }
    });

    const order = (lastMilestone?.order || 0) + 1;

    // Parse deliverables
    const deliverablesArray = deliverables 
      ? deliverables.split('\n').filter(d => d.trim()).map(d => d.trim())
      : [];

    // Create the milestone
    const milestone = await prisma.milestone.create({
      data: {
        name,
        description: description || null,
        dueDate: new Date(dueDate),
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : null,
        clientApprovalRequired,
        deliverables: deliverablesArray,
        order,
        projectId,
        userId: user.id
      }
    });

    // Update project milestone count
    await updateProjectMilestoneCount(projectId);

    // Create timeline entry
    await createTimelineEntryHelper(projectId, user.id, "milestone", "Milestone Created", 
      `Created milestone: ${name}`, milestone.id);

    // Revalidate project pages
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");

    return {
      id: milestone.id,
      name: milestone.name,
      description: milestone.description || undefined,
      dueDate: milestone.dueDate,
      status: milestone.status,
      deliverables: Array.isArray(milestone.deliverables) ? milestone.deliverables as string[] : [],
      paymentAmount: milestone.paymentAmount ? Number(milestone.paymentAmount) : undefined,
      clientApprovalRequired: milestone.clientApprovalRequired,
      projectId: milestone.projectId,
      order: milestone.order,
      completedAt: milestone.completedAt || undefined,
      userId: milestone.userId,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    };

  } catch (error) {
    console.error("Error creating milestone:", error);
    throw error;
  }
}

export async function updateMilestone(milestoneId: string, formData: FormData): Promise<Milestone> {
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

    // Verify milestone belongs to this user
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        userId: user.id
      }
    });

    if (!existingMilestone) {
      throw new Error("Milestone not found or access denied");
    }

    // Extract form data
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const dueDate = formData.get("dueDate") as string;
    const status = formData.get("status") as string;
    const paymentAmount = formData.get("paymentAmount") as string;
    const clientApprovalRequired = formData.get("clientApprovalRequired") === "true";
    const deliverables = formData.get("deliverables") as string;

    // Validate required fields
    if (!name || !dueDate) {
      throw new Error("Name and due date are required");
    }

    // Parse deliverables
    const deliverablesArray = deliverables 
      ? deliverables.split('\n').filter(d => d.trim()).map(d => d.trim())
      : [];

    // Update the milestone
    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        name,
        description: description || null,
        dueDate: new Date(dueDate),
        status: status as MilestoneStatus,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : null,
        clientApprovalRequired,
        deliverables: deliverablesArray,
        completedAt: status === "APPROVED" ? new Date() : null
      }
    });

    // Update project progress
    await updateProjectProgress(existingMilestone.projectId);

    // Create timeline entry for status changes
    if (status !== existingMilestone.status) {
      await createTimelineEntryHelper(existingMilestone.projectId, user.id, "milestone", 
        "Milestone Status Updated", 
        `${name} status changed to ${status.toLowerCase().replace('_', ' ')}`, milestone.id);
    }

    // Revalidate project pages
    revalidatePath(`/projects/${existingMilestone.projectId}`);
    revalidatePath("/projects");

    return {
      id: milestone.id,
      name: milestone.name,
      description: milestone.description || undefined,
      dueDate: milestone.dueDate,
      status: milestone.status,
      deliverables: Array.isArray(milestone.deliverables) ? milestone.deliverables as string[] : [],
      paymentAmount: milestone.paymentAmount ? Number(milestone.paymentAmount) : undefined,
      clientApprovalRequired: milestone.clientApprovalRequired,
      projectId: milestone.projectId,
      order: milestone.order,
      completedAt: milestone.completedAt || undefined,
      userId: milestone.userId,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    };

  } catch (error) {
    console.error("Error updating milestone:", error);
    throw error;
  }
}

export async function completeMilestone(milestoneId: string): Promise<{
  milestone: Milestone,
  projectUpdate: any,
  communicationCreated?: boolean
}> {
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

    // Get milestone with project and client info
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        userId: user.id
      },
      include: {
        project: {
          include: {
            client: true
          }
        }
      }
    });

    if (!milestone) {
      throw new Error("Milestone not found or access denied");
    }

    // Update milestone status
    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: milestone.clientApprovalRequired ? "REVIEW" : "APPROVED",
        completedAt: new Date()
      }
    });

    // Update project progress
    const projectUpdate = await updateProjectProgress(milestone.projectId);

    // Create auto-generated client communication if required
    let communicationCreated = false;
    if (milestone.clientApprovalRequired) {
      try {
        await prisma.communication.create({
          data: {
            type: "EMAIL",
            subject: `Milestone Completed: ${milestone.name}`,
            content: generateMilestoneCompletionEmail(milestone),
            clientId: milestone.project.clientId,
            projectId: milestone.projectId
          }
        });
        communicationCreated = true;
      } catch (error) {
        console.warn("Failed to create auto-communication:", error);
      }
    }

    // Create timeline entry
    await createTimelineEntryHelper(milestone.projectId, user.id, "milestone", 
      "Milestone Completed", 
      `${milestone.name} has been completed${milestone.clientApprovalRequired ? ' and sent for client approval' : ''}`, 
      milestone.id);

    // Revalidate project pages
    revalidatePath(`/projects/${milestone.projectId}`);
    revalidatePath("/projects");

    return {
      milestone: {
        id: updatedMilestone.id,
        name: updatedMilestone.name,
        description: updatedMilestone.description || undefined,
        dueDate: updatedMilestone.dueDate,
        status: updatedMilestone.status,
        deliverables: Array.isArray(updatedMilestone.deliverables) ? updatedMilestone.deliverables as string[] : [],
        paymentAmount: updatedMilestone.paymentAmount ? Number(updatedMilestone.paymentAmount) : undefined,
        clientApprovalRequired: updatedMilestone.clientApprovalRequired,
        projectId: updatedMilestone.projectId,
        order: updatedMilestone.order,
        completedAt: updatedMilestone.completedAt || undefined,
        userId: updatedMilestone.userId,
        createdAt: updatedMilestone.createdAt,
        updatedAt: updatedMilestone.updatedAt,
      },
      projectUpdate,
      communicationCreated
    };

  } catch (error) {
    console.error("Error completing milestone:", error);
    throw error;
  }
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
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

    // Verify milestone belongs to this user
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        userId: user.id
      }
    });

    if (!milestone) {
      throw new Error("Milestone not found or access denied");
    }

    // Delete the milestone
    await prisma.milestone.delete({
      where: { id: milestoneId }
    });

    // Update project milestone count
    await updateProjectMilestoneCount(milestone.projectId);

    // Create timeline entry
    await createTimelineEntryHelper(milestone.projectId, user.id, "milestone", 
      "Milestone Deleted", 
      `Deleted milestone: ${milestone.name}`, milestoneId);

    // Revalidate project pages
    revalidatePath(`/projects/${milestone.projectId}`);
    revalidatePath("/projects");

  } catch (error) {
    console.error("Error deleting milestone:", error);
    throw error;
  }
}

export async function reorderMilestones(projectId: string, milestoneIds: string[]): Promise<void> {
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

    // Update milestone orders
    await Promise.all(
      milestoneIds.map((milestoneId, index) =>
        prisma.milestone.update({
          where: { id: milestoneId },
          data: { order: index + 1 }
        })
      )
    );

    // Revalidate project pages
    revalidatePath(`/projects/${projectId}`);

  } catch (error) {
    console.error("Error reordering milestones:", error);
    throw error;
  }
}

// Helper functions
async function updateProjectMilestoneCount(projectId: string) {
  const milestoneCount = await prisma.milestone.count({
    where: { projectId }
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { 
      // We'll need to add this field to the project model if not exists
      // For now, this is a placeholder
    }
  });
}

async function updateProjectProgress(projectId: string) {
  // Calculate progress based on completed milestones
  const totalMilestones = await prisma.milestone.count({
    where: { projectId }
  });

  const completedMilestones = await prisma.milestone.count({
    where: { 
      projectId,
      status: "APPROVED"
    }
  });

  const progress = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  return await prisma.project.update({
    where: { id: projectId },
    data: { progress }
  });
}

function generateMilestoneCompletionEmail(milestone: any): string {
  return `Hi ${milestone.project.client.name},

I'm pleased to inform you that the milestone "${milestone.name}" has been completed for the ${milestone.project.name} project.

${milestone.deliverables.length > 0 ? `
Deliverables completed:
${milestone.deliverables.map((d: string) => `• ${d}`).join('\n')}
` : ''}

${milestone.clientApprovalRequired ? `
Please review the completed work and let me know if you have any questions or feedback. Your approval will help us move forward with the next phase of the project.
` : ''}

${milestone.paymentAmount ? `
This milestone represents $${milestone.paymentAmount} of the project budget.
` : ''}

Thank you for your continued collaboration.

Best regards,
[Your Name]`;
}

// Placeholder for timeline entries
async function createTimelineEntryHelper(
  projectId: string,
  userId: string,
  type: TimelineEntry['type'],
  title: string,
  description: string,
  relatedId?: string
) {
  try {
    await createTimelineEntry(
      projectId,
      type,
      title,
      description,
      relatedId,
      type === "milestone" ? 'medium' : 'low'
    );
  } catch (error) {
    console.error("Failed to create timeline entry:", error);
  }
} 