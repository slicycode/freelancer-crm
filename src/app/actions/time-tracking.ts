"use server";

import { prisma } from "@/lib/prisma";
import { TimeEntry } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createTimelineEntry, TimelineEntry } from "./timeline";

export async function startTimer(projectId: string, taskId?: string, description?: string): Promise<TimeEntry> {
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

    // Check if there's already an active timer
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        endTime: null
      }
    });

    if (activeTimer) {
      throw new Error("You already have an active timer running. Please stop it first.");
    }

    // Create the new time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId,
        taskId: taskId || null,
        startTime: new Date(),
        duration: 0,
        description: description || "Time tracking session",
        billable: true,
        hourlyRate: project.hourlyRate,
        userId: user.id
      }
    });

    // Revalidate project pages
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");

    return {
      id: timeEntry.id,
      projectId: timeEntry.projectId,
      milestoneId: timeEntry.milestoneId || undefined,
      taskId: timeEntry.taskId || undefined,
      startTime: timeEntry.startTime,
      endTime: timeEntry.endTime || undefined,
      duration: timeEntry.duration,
      description: timeEntry.description,
      billable: timeEntry.billable,
      hourlyRate: timeEntry.hourlyRate ? Number(timeEntry.hourlyRate) : undefined,
      userId: timeEntry.userId,
      createdAt: timeEntry.createdAt,
      updatedAt: timeEntry.updatedAt,
    };

  } catch (error) {
    console.error("Error starting timer:", error);
    throw error;
  }
}

export async function stopTimer(projectId: string): Promise<{ timeEntry: TimeEntry, updatedProject: any }> {
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

    // Find the active timer for this project
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        projectId,
        userId: user.id,
        endTime: null
      }
    });

    if (!activeTimer) {
      throw new Error("No active timer found for this project");
    }

    // Calculate duration in minutes
    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / (1000 * 60));

    // Update the time entry
    const timeEntry = await prisma.timeEntry.update({
      where: { id: activeTimer.id },
      data: {
        endTime,
        duration: durationMinutes
      }
    });

    // Calculate total actual hours for the project
    const totalMinutes = await prisma.timeEntry.aggregate({
      where: {
        projectId,
        endTime: { not: null }
      },
      _sum: {
        duration: true
      }
    });

    const totalHours = Math.round((totalMinutes._sum.duration || 0) / 60);

    // Update project actual hours
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        actualHours: totalHours
      },
      include: {
        client: {
          select: {
            name: true,
            company: true
          }
        }
      }
    });

    // Create timeline entry
    await createTimelineEntryHelper(projectId, user.id, "time", "Time Logged", 
      `Logged ${Math.round(durationMinutes / 60 * 10) / 10} hours`, timeEntry.id);

    // Revalidate project pages
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");

    return {
      timeEntry: {
        id: timeEntry.id,
        projectId: timeEntry.projectId,
        milestoneId: timeEntry.milestoneId || undefined,
        taskId: timeEntry.taskId || undefined,
        startTime: timeEntry.startTime,
        endTime: timeEntry.endTime || undefined,
        duration: timeEntry.duration,
        description: timeEntry.description,
        billable: timeEntry.billable,
        hourlyRate: timeEntry.hourlyRate ? Number(timeEntry.hourlyRate) : undefined,
        userId: timeEntry.userId,
        createdAt: timeEntry.createdAt,
        updatedAt: timeEntry.updatedAt,
      },
      updatedProject
    };

  } catch (error) {
    console.error("Error stopping timer:", error);
    throw error;
  }
}

export async function logManualTime(
  projectId: string, 
  hours: number, 
  description: string, 
  taskId?: string,
  billable: boolean = true
): Promise<TimeEntry> {
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

    if (hours <= 0) {
      throw new Error("Hours must be greater than 0");
    }

    // Create the time entry
    const durationMinutes = Math.round(hours * 60);
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (durationMinutes * 60 * 1000));

    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId,
        taskId: taskId || null,
        startTime,
        endTime,
        duration: durationMinutes,
        description,
        billable,
        hourlyRate: project.hourlyRate,
        userId: user.id
      }
    });

    // Calculate total actual hours for the project
    const totalMinutes = await prisma.timeEntry.aggregate({
      where: {
        projectId,
        endTime: { not: null }
      },
      _sum: {
        duration: true
      }
    });

    const totalHours = Math.round((totalMinutes._sum.duration || 0) / 60);

    // Update project actual hours
    await prisma.project.update({
      where: { id: projectId },
      data: {
        actualHours: totalHours
      }
    });

    // Create timeline entry
    await createTimelineEntryHelper(projectId, user.id, "time", "Manual Time Logged", 
      `Manually logged ${hours} hours: ${description}`, timeEntry.id);

    // Revalidate project pages
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");

    return {
      id: timeEntry.id,
      projectId: timeEntry.projectId,
      milestoneId: timeEntry.milestoneId || undefined,
      taskId: timeEntry.taskId || undefined,
      startTime: timeEntry.startTime,
      endTime: timeEntry.endTime || undefined,
      duration: timeEntry.duration,
      description: timeEntry.description,
      billable: timeEntry.billable,
      hourlyRate: timeEntry.hourlyRate ? Number(timeEntry.hourlyRate) : undefined,
      userId: timeEntry.userId,
      createdAt: timeEntry.createdAt,
      updatedAt: timeEntry.updatedAt,
    };

  } catch (error) {
    console.error("Error logging manual time:", error);
    throw error;
  }
}

export async function getActiveTimer(userId: string): Promise<TimeEntry | null> {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      throw new Error("Unauthorized");
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        endTime: null
      }
    });

    if (!activeTimer) {
      return null;
    }

    return {
      id: activeTimer.id,
      projectId: activeTimer.projectId,
      milestoneId: activeTimer.milestoneId || undefined,
      taskId: activeTimer.taskId || undefined,
      startTime: activeTimer.startTime,
      endTime: activeTimer.endTime || undefined,
      duration: activeTimer.duration,
      description: activeTimer.description,
      billable: activeTimer.billable,
      hourlyRate: activeTimer.hourlyRate ? Number(activeTimer.hourlyRate) : undefined,
      userId: activeTimer.userId,
      createdAt: activeTimer.createdAt,
      updatedAt: activeTimer.updatedAt,
    };

  } catch (error) {
    console.error("Error getting active timer:", error);
    throw error;
  }
}

export async function getProjectTimeEntries(projectId: string): Promise<TimeEntry[]> {
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

    const timeEntries = await prisma.timeEntry.findMany({
      where: { projectId },
      orderBy: { startTime: "desc" }
    });

    return timeEntries.map(entry => ({
      id: entry.id,
      projectId: entry.projectId,
      milestoneId: entry.milestoneId || undefined,
      taskId: entry.taskId || undefined,
      startTime: entry.startTime,
      endTime: entry.endTime || undefined,
      duration: entry.duration,
      description: entry.description,
      billable: entry.billable,
      hourlyRate: entry.hourlyRate ? Number(entry.hourlyRate) : undefined,
      userId: entry.userId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

  } catch (error) {
    console.error("Error getting project time entries:", error);
    throw error;
  }
}

// Helper function to create timeline entries
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
      'low'
    );
  } catch (error) {
    console.error("Failed to create timeline entry:", error);
  }
} 