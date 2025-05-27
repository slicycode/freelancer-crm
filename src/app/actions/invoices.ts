"use server";

import { Invoice } from "@/types";
import { auth } from "@clerk/nextjs/server";

// Mock invoices data since we don't have an invoices table yet
export async function getInvoices(): Promise<Invoice[]> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Return mock data for now
    // In a real implementation, this would fetch from the database
    const mockInvoices: Invoice[] = [
      {
        id: "1",
        number: "INV-2023-001",
        title: "Website Redesign - Phase 1",
        status: "SENT",
        amount: 5000,
        currency: "USD",
        dueDate: new Date("2023-06-15"),
        sentDate: new Date("2023-05-15"),
        paidDate: null,
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
        number: "INV-2023-002",
        title: "Mobile App Development - Milestone 1",
        status: "PAID",
        amount: 7500,
        currency: "USD",
        dueDate: new Date("2023-05-30"),
        sentDate: new Date("2023-05-01"),
        paidDate: new Date("2023-05-25"),
        clientId: "client-2",
        projectId: "project-2",
        clientName: "Michael Chen",
        projectName: "Mobile App Development",
        userId: "user-1",
        createdAt: new Date("2023-05-01"),
        updatedAt: new Date("2023-05-25"),
      },
      {
        id: "3",
        number: "INV-2023-003",
        title: "Consulting Services - April",
        status: "OVERDUE",
        amount: 3000,
        currency: "USD",
        dueDate: new Date("2023-05-01"),
        sentDate: new Date("2023-04-15"),
        paidDate: null,
        clientId: "client-3",
        projectId: null,
        clientName: "Emily Rodriguez",
        projectName: undefined,
        userId: "user-1",
        createdAt: new Date("2023-04-15"),
        updatedAt: new Date("2023-04-15"),
      },
      {
        id: "4",
        number: "INV-2023-004",
        title: "Brand Strategy - Initial Phase",
        status: "DRAFT",
        amount: 4200,
        currency: "USD",
        dueDate: new Date("2023-06-30"),
        sentDate: null,
        paidDate: null,
        clientId: "client-4",
        projectId: "project-4",
        clientName: "David Kim",
        projectName: "Brand Strategy",
        userId: "user-1",
        createdAt: new Date("2023-05-20"),
        updatedAt: new Date("2023-05-20"),
      },
    ];

    return mockInvoices;

  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
} 