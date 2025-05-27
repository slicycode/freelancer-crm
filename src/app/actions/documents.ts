"use server";

import { Document } from "@/types";
import { auth } from "@clerk/nextjs/server";

// Mock documents data since we don't have a documents table yet
export async function getDocuments(): Promise<Document[]> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Return mock data for now
    // In a real implementation, this would fetch from the database
    const mockDocuments: Document[] = [
      {
        id: "1",
        name: "Website Redesign Proposal",
        type: "PROPOSAL",
        status: "SENT",
        content: null,
        url: "/documents/proposal-1.pdf",
        size: 2400000,
        clientId: "client-1",
        projectId: "project-1",
        clientName: "Sarah Johnson",
        projectName: "Website Redesign",
        userId: "user-1",
        createdAt: new Date("2023-05-15"),
        updatedAt: new Date("2023-05-15"),
      },
      {
        id: "2",
        name: "Service Agreement",
        type: "CONTRACT",
        status: "APPROVED",
        content: null,
        url: "/documents/contract-1.pdf",
        size: 1800000,
        clientId: "client-2",
        projectId: "project-2",
        clientName: "Michael Chen",
        projectName: "Mobile App Development",
        userId: "user-1",
        createdAt: new Date("2023-05-10"),
        updatedAt: new Date("2023-05-12"),
      },
      {
        id: "3",
        name: "Project Report - Q2",
        type: "REPORT",
        status: "DRAFT",
        content: "Quarterly project progress report...",
        url: null,
        size: null,
        clientId: "client-1",
        projectId: "project-1",
        clientName: "Sarah Johnson",
        projectName: "Website Redesign",
        userId: "user-1",
        createdAt: new Date("2023-05-20"),
        updatedAt: new Date("2023-05-20"),
      },
    ];

    return mockDocuments;

  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
} 