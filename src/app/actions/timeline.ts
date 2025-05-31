"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export interface TimelineEntry {
  id: string;
  projectId: string;
  type: 'milestone' | 'task' | 'communication' | 'document' | 'time' | 'project';
  title: string;
  description: string;
  timestamp: Date;
  relatedId?: string;
  relatedType?: string;
  metadata?: Record<string, any>;
  importance: 'low' | 'medium' | 'high';
}

export async function getProjectTimeline(projectId: string): Promise<TimelineEntry[]> {
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

    // Fetch all related data
    const [milestones, tasks, communications, documents, timeEntries] = await Promise.all([
      prisma.milestone.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.task.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.communication.findMany({
        where: { projectId },
        orderBy: { sentAt: 'desc' }
      }),
      prisma.document.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.timeEntry.findMany({
        where: { projectId },
        orderBy: { startTime: 'desc' }
      })
    ]);

    const timelineEntries: TimelineEntry[] = [];

    // Add milestone events
    for (const milestone of milestones) {
      timelineEntries.push({
        id: `milestone-created-${milestone.id}`,
        projectId,
        type: 'milestone',
        title: 'Milestone Created',
        description: `Created milestone: ${milestone.name}`,
        timestamp: milestone.createdAt,
        relatedId: milestone.id,
        relatedType: 'milestone',
        metadata: { 
          milestoneStatus: milestone.status,
          dueDate: milestone.dueDate,
          paymentAmount: milestone.paymentAmount 
        },
        importance: 'medium'
      });

      if (milestone.completedAt) {
        timelineEntries.push({
          id: `milestone-completed-${milestone.id}`,
          projectId,
          type: 'milestone',
          title: 'Milestone Completed',
          description: `Completed milestone: ${milestone.name}`,
          timestamp: milestone.completedAt,
          relatedId: milestone.id,
          relatedType: 'milestone',
          metadata: { 
            milestoneStatus: milestone.status,
            paymentAmount: milestone.paymentAmount 
          },
          importance: 'high'
        });
      }
    }

    // Add task events
    for (const task of tasks) {
      timelineEntries.push({
        id: `task-created-${task.id}`,
        projectId,
        type: 'task',
        title: 'Task Created',
        description: `Created task: ${task.title}`,
        timestamp: task.createdAt,
        relatedId: task.id,
        relatedType: 'task',
        metadata: { 
          taskStatus: task.status,
          priority: task.priority,
          estimatedHours: task.estimatedHours 
        },
        importance: 'low'
      });

      if (task.completedAt) {
        timelineEntries.push({
          id: `task-completed-${task.id}`,
          projectId,
          type: 'task',
          title: 'Task Completed',
          description: `Completed task: ${task.title}`,
          timestamp: task.completedAt,
          relatedId: task.id,
          relatedType: 'task',
          metadata: { 
            taskStatus: task.status,
            actualHours: task.actualHours 
          },
          importance: 'medium'
        });
      }
    }

    // Add communication events
    for (const communication of communications) {
      timelineEntries.push({
        id: `communication-${communication.id}`,
        projectId,
        type: 'communication',
        title: `${communication.type} Communication`,
        description: communication.subject,
        timestamp: communication.sentAt,
        relatedId: communication.id,
        relatedType: 'communication',
        metadata: { 
          communicationType: communication.type,
          clientId: communication.clientId 
        },
        importance: 'medium'
      });
    }

    // Add document events
    for (const document of documents) {
      timelineEntries.push({
        id: `document-${document.id}`,
        projectId,
        type: 'document',
        title: 'Document Created',
        description: `Created document: ${document.name}`,
        timestamp: document.createdAt,
        relatedId: document.id,
        relatedType: 'document',
        metadata: { 
          documentType: document.type,
          documentStatus: document.status 
        },
        importance: 'medium'
      });
    }

    // Add time tracking events (only completed sessions)
    for (const timeEntry of timeEntries) {
      if (timeEntry.endTime) {
        const hours = Math.round((timeEntry.duration / 60) * 10) / 10;
        timelineEntries.push({
          id: `time-${timeEntry.id}`,
          projectId,
          type: 'time',
          title: 'Time Logged',
          description: `Logged ${hours} hours: ${timeEntry.description}`,
          timestamp: timeEntry.endTime,
          relatedId: timeEntry.id,
          relatedType: 'time',
          metadata: { 
            duration: timeEntry.duration,
            billable: timeEntry.billable,
            taskId: timeEntry.taskId 
          },
          importance: 'low'
        });
      }
    }

    // Add project events
    timelineEntries.push({
      id: `project-created-${project.id}`,
      projectId,
      type: 'project',
      title: 'Project Created',
      description: `Created project: ${project.name}`,
      timestamp: project.createdAt,
      relatedId: project.id,
      relatedType: 'project',
      metadata: { 
        projectStatus: project.status,
        budgetType: project.budgetType 
      },
      importance: 'high'
    });

    // Sort by timestamp descending (most recent first)
    timelineEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return timelineEntries;

  } catch (error) {
    console.error("Error fetching project timeline:", error);
    throw error;
  }
}

export async function createTimelineEntry(
  projectId: string,
  type: TimelineEntry['type'],
  title: string,
  description: string,
  relatedId?: string,
  importance: TimelineEntry['importance'] = 'medium',
  metadata?: Record<string, any>
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

    // For now, we'll just log the timeline entry
    // In a full implementation, you might want to store these in a dedicated timeline table
    console.log("Timeline entry created:", {
      projectId,
      type,
      title,
      description,
      relatedId,
      importance,
      metadata,
      timestamp: new Date(),
      userId: user.id
    });

    // Future: Store in timeline_entries table
    // await prisma.timelineEntry.create({
    //   data: {
    //     projectId,
    //     type,
    //     title,
    //     description,
    //     relatedId,
    //     importance,
    //     metadata: metadata || {},
    //     userId: user.id
    //   }
    // });

  } catch (error) {
    console.error("Error creating timeline entry:", error);
    // Don't throw here - timeline entries are supplementary
  }
} 