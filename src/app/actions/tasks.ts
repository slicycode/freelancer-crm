"use server";

import { prisma } from "@/lib/prisma";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createTimelineEntry, TimelineEntry } from "./timeline";

export async function getTasks(projectId: string, milestoneId?: string): Promise<Task[]> {
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

    const whereCondition: any = { projectId };
    if (milestoneId) {
      whereCondition.milestoneId = milestoneId;
    }

    const tasks = await prisma.task.findMany({
      where: whereCondition,
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueDate: "asc" }
      ]
    });

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      dueDate: task.dueDate || undefined,
      milestoneId: task.milestoneId || undefined,
      projectId: task.projectId,
      dependencies: task.dependencies as string[],
      completedAt: task.completedAt || undefined,
      userId: task.userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}

export async function createTask(formData: FormData): Promise<Task> {
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
    const milestoneId = formData.get("milestoneId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const estimatedHours = formData.get("estimatedHours") as string;
    const dueDate = formData.get("dueDate") as string;
    const dependencies = formData.get("dependencies") as string;

    // Validate required fields
    if (!projectId || !title) {
      throw new Error("Project ID and title are required");
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

    // Verify milestone belongs to this project if provided
    if (milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          projectId: projectId,
          userId: user.id
        }
      });

      if (!milestone) {
        throw new Error("Milestone not found or access denied");
      }
    }

    // Parse dependencies
    const dependenciesArray = dependencies 
      ? dependencies.split(',').filter(d => d.trim()).map(d => d.trim())
      : [];

    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority as TaskPriority || "MEDIUM",
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        milestoneId: milestoneId || null,
        projectId,
        dependencies: dependenciesArray,
        userId: user.id
      }
    });

    // Update project task count
    await updateProjectTaskCount(projectId);

    // Create timeline entry
    await createTimelineEntryHelper(projectId, user.id, "task", "Task Created", 
      `Created task: ${title}`, task.id);

    // Revalidate project pages
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");

    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      dueDate: task.dueDate || undefined,
      milestoneId: task.milestoneId || undefined,
      projectId: task.projectId,
      dependencies: task.dependencies as string[],
      completedAt: task.completedAt || undefined,
      userId: task.userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

export async function updateTask(taskId: string, formData: FormData): Promise<Task> {
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

    // Verify task belongs to this user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: user.id
      }
    });

    if (!existingTask) {
      throw new Error("Task not found or access denied");
    }

    // Extract form data
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const priority = formData.get("priority") as string;
    const estimatedHours = formData.get("estimatedHours") as string;
    const dueDate = formData.get("dueDate") as string;
    const dependencies = formData.get("dependencies") as string;

    // Validate required fields
    if (!title) {
      throw new Error("Title is required");
    }

    // Parse dependencies
    const dependenciesArray = dependencies 
      ? dependencies.split(',').filter(d => d.trim()).map(d => d.trim())
      : [];

    // Update the task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description: description || null,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        dependencies: dependenciesArray,
        completedAt: status === "COMPLETED" ? new Date() : null
      }
    });

    // Update task count if status changed
    if (status !== existingTask.status) {
      await updateProjectTaskCount(existingTask.projectId);

      // If completed, unlock dependent tasks and update milestone progress
      if (status === "COMPLETED") {
        await unlockDependentTasks(taskId);
        if (existingTask.milestoneId) {
          await updateMilestoneProgress(existingTask.milestoneId);
        }
      }
    }

    // Create timeline entry for status changes
    if (status !== existingTask.status) {
      await createTimelineEntryHelper(existingTask.projectId, user.id, "task", 
        "Task Status Updated", 
        `${title} status changed to ${status.toLowerCase().replace('_', ' ')}`, task.id);
    }

    // Revalidate project pages
    revalidatePath(`/projects/${existingTask.projectId}`);
    revalidatePath("/projects");

    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      dueDate: task.dueDate || undefined,
      milestoneId: task.milestoneId || undefined,
      projectId: task.projectId,
      dependencies: task.dependencies as string[],
      completedAt: task.completedAt || undefined,
      userId: task.userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

export async function completeTask(taskId: string): Promise<{
  task: Task,
  unlockedTasks: Task[],
  milestoneUpdated?: boolean
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

    // Get task with project info
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: user.id
      }
    });

    if (!task) {
      throw new Error("Task not found or access denied");
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt: new Date()
      }
    });

    // Update project task count
    await updateProjectTaskCount(task.projectId);

    // Unlock dependent tasks
    const unlockedTasks = await unlockDependentTasks(taskId);

    // Update milestone progress if task belongs to one
    let milestoneUpdated = false;
    if (task.milestoneId) {
      await updateMilestoneProgress(task.milestoneId);
      milestoneUpdated = true;
    }

    // Create timeline entry
    await createTimelineEntryHelper(task.projectId, user.id, "task", 
      "Task Completed", 
      `${task.title} has been completed`, taskId);

    // Revalidate project pages
    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath("/projects");

    return {
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description || undefined,
        status: updatedTask.status,
        priority: updatedTask.priority,
        estimatedHours: updatedTask.estimatedHours,
        actualHours: updatedTask.actualHours,
        dueDate: updatedTask.dueDate || undefined,
        milestoneId: updatedTask.milestoneId || undefined,
        projectId: updatedTask.projectId,
        dependencies: updatedTask.dependencies as string[],
        completedAt: updatedTask.completedAt || undefined,
        userId: updatedTask.userId,
        createdAt: updatedTask.createdAt,
        updatedAt: updatedTask.updatedAt,
      },
      unlockedTasks,
      milestoneUpdated
    };

  } catch (error) {
    console.error("Error completing task:", error);
    throw error;
  }
}

export async function deleteTask(taskId: string): Promise<void> {
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

    // Verify task belongs to this user
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: user.id
      }
    });

    if (!task) {
      throw new Error("Task not found or access denied");
    }

    // Remove this task from any dependencies
    const tasksWithDependencies = await prisma.task.findMany({
      where: {
        dependencies: {
          not: []
        }
      }
    });

    // Update tasks that have this task as a dependency
    for (const dependentTask of tasksWithDependencies) {
      const dependencies = dependentTask.dependencies as string[];
      if (dependencies.includes(taskId)) {
        const newDependencies = dependencies.filter(id => id !== taskId);
        await prisma.task.update({
          where: { id: dependentTask.id },
          data: { dependencies: newDependencies }
        });
      }
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId }
    });

    // Update project task count
    await updateProjectTaskCount(task.projectId);

    // Create timeline entry
    await createTimelineEntryHelper(task.projectId, user.id, "task", 
      "Task Deleted", 
      `Deleted task: ${task.title}`, taskId);

    // Revalidate project pages
    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath("/projects");

  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
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

    // Verify task belongs to this user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: user.id
      }
    });

    if (!existingTask) {
      throw new Error("Task not found or access denied");
    }

    // Update the task status
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null
      }
    });

    // Update task count and handle completion effects
    if (status !== existingTask.status) {
      await updateProjectTaskCount(existingTask.projectId);

      if (status === "COMPLETED") {
        await unlockDependentTasks(taskId);
        if (existingTask.milestoneId) {
          await updateMilestoneProgress(existingTask.milestoneId);
        }
      }
    }

    // Create timeline entry
    await createTimelineEntryHelper(existingTask.projectId, user.id, "task", 
      "Task Status Updated", 
      `${task.title} status changed to ${status.toLowerCase().replace('_', ' ')}`, taskId);

    // Revalidate project pages
    revalidatePath(`/projects/${existingTask.projectId}`);
    revalidatePath("/projects");

    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      dueDate: task.dueDate || undefined,
      milestoneId: task.milestoneId || undefined,
      projectId: task.projectId,
      dependencies: task.dependencies as string[],
      completedAt: task.completedAt || undefined,
      userId: task.userId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

// Helper functions
async function updateProjectTaskCount(projectId: string) {
  const totalTasks = await prisma.task.count({
    where: { projectId }
  });

  const completedTasks = await prisma.task.count({
    where: { 
      projectId,
      status: "COMPLETED"
    }
  });

  // Note: We'll need to ensure these fields exist in the project model
  await prisma.project.update({
    where: { id: projectId },
    data: { 
      // taskCount: totalTasks,
      // completedTaskCount: completedTasks
      // For now, this is a placeholder
    }
  });
}

async function unlockDependentTasks(completedTaskId: string): Promise<Task[]> {
  // Find tasks that depend on this completed task
  const allTasks = await prisma.task.findMany({
    where: {
      dependencies: {
        not: []
      },
      status: "TODO"
    }
  });

  // Filter tasks that have this task as a dependency
  const dependentTasks = allTasks.filter(task => {
    const dependencies = task.dependencies as string[];
    return dependencies.includes(completedTaskId);
  });

  // Check if all dependencies are now completed for each dependent task
  const unlockedTasks: Task[] = [];

  for (const task of dependentTasks) {
    const dependencies = task.dependencies as string[];
    const completedDependencies = await prisma.task.count({
      where: {
        id: { in: dependencies },
        status: "COMPLETED"
      }
    });

    // If all dependencies are completed, task can be started
    if (completedDependencies === dependencies.length) {
      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: { status: "TODO" } // Ready to start
      });

      unlockedTasks.push({
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description || undefined,
        status: updatedTask.status,
        priority: updatedTask.priority,
        estimatedHours: updatedTask.estimatedHours,
        actualHours: updatedTask.actualHours,
        dueDate: updatedTask.dueDate || undefined,
        milestoneId: updatedTask.milestoneId || undefined,
        projectId: updatedTask.projectId,
        dependencies: updatedTask.dependencies as string[],
        completedAt: updatedTask.completedAt || undefined,
        userId: updatedTask.userId,
        createdAt: updatedTask.createdAt,
        updatedAt: updatedTask.updatedAt,
      });
    }
  }

  return unlockedTasks;
}

async function updateMilestoneProgress(milestoneId: string) {
  // Calculate milestone progress based on completed tasks
  const totalTasks = await prisma.task.count({
    where: { milestoneId }
  });

  const completedTasks = await prisma.task.count({
    where: { 
      milestoneId,
      status: "COMPLETED"
    }
  });

  // Check if milestone should be automatically completed
  if (totalTasks > 0 && completedTasks === totalTasks) {
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { 
        status: "REVIEW" // Ready for review/approval
      }
    });
  }
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
      'low'
    );
  } catch (error) {
    console.error("Failed to create timeline entry:", error);
  }
} 