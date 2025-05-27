"use server";

import { CalendarEvent } from "@/types";
import { auth } from "@clerk/nextjs/server";

// Mock calendar events data since we don't have a calendar events table yet
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Return mock data for now
    // In a real implementation, this would fetch from the database
    const mockEvents: CalendarEvent[] = [
      {
        id: "1",
        title: "Client Meeting - Website Review",
        description: "Review the initial website designs with Sarah",
        startTime: new Date("2023-05-25T10:00:00"),
        endTime: new Date("2023-05-25T11:00:00"),
        allDay: false,
        clientId: "client-1",
        projectId: "project-1",
        clientName: "Sarah Johnson",
        projectName: "Website Redesign",
        userId: "user-1",
        createdAt: new Date("2023-05-20"),
        updatedAt: new Date("2023-05-20"),
      },
      {
        id: "2",
        title: "Project Kickoff - Mobile App",
        description: "Initial project kickoff meeting with Michael and his team",
        startTime: new Date("2023-05-26T14:00:00"),
        endTime: new Date("2023-05-26T15:30:00"),
        allDay: false,
        clientId: "client-2",
        projectId: "project-2",
        clientName: "Michael Chen",
        projectName: "Mobile App Development",
        userId: "user-1",
        createdAt: new Date("2023-05-22"),
        updatedAt: new Date("2023-05-22"),
      },
      {
        id: "3",
        title: "Deadline - Proposal Submission",
        description: "Submit the marketing strategy proposal to Emily",
        startTime: new Date("2023-05-27T00:00:00"),
        endTime: new Date("2023-05-27T23:59:59"),
        allDay: true,
        clientId: "client-3",
        projectId: "project-3",
        clientName: "Emily Rodriguez",
        projectName: "Marketing Strategy",
        userId: "user-1",
        createdAt: new Date("2023-05-15"),
        updatedAt: new Date("2023-05-15"),
      },
      {
        id: "4",
        title: "Follow-up Call",
        description: "Follow up on the brand strategy proposal with David",
        startTime: new Date("2023-05-28T16:00:00"),
        endTime: new Date("2023-05-28T16:30:00"),
        allDay: false,
        clientId: "client-4",
        projectId: "project-4",
        clientName: "David Kim",
        projectName: "Brand Strategy",
        userId: "user-1",
        createdAt: new Date("2023-05-23"),
        updatedAt: new Date("2023-05-23"),
      },
      {
        id: "5",
        title: "Team Planning Session",
        description: "Internal planning session for upcoming projects",
        startTime: new Date("2023-05-29T09:00:00"),
        endTime: new Date("2023-05-29T10:30:00"),
        allDay: false,
        clientId: undefined,
        projectId: undefined,
        clientName: undefined,
        projectName: undefined,
        userId: "user-1",
        createdAt: new Date("2023-05-24"),
        updatedAt: new Date("2023-05-24"),
      },
    ];

    return mockEvents;

  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
} 