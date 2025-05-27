import { ClientStatus as PrismaClientStatus, CommunicationType as PrismaCommunicationType, ProjectStatus as PrismaProjectStatus } from "@prisma/client";

// Re-export Prisma enums
export type CommunicationType = PrismaCommunicationType;
export type ProjectStatus = PrismaProjectStatus;
export type ClientStatus = PrismaClientStatus;

// Document types
export type DocumentType = "PROPOSAL" | "CONTRACT" | "INVOICE" | "REPORT" | "OTHER";
export type DocumentStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "ARCHIVED";

// Invoice types
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELED";

// Client model
export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  tags?: string[]; // Store as array in app, as JSON in DB
  status?: ClientStatus; // ACTIVE or ARCHIVED
  lastContact?: string; // For UI display
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Communication model
export interface Communication {
  id: string;
  type: CommunicationType;
  subject: string;
  content: string;
  sentAt: Date;
  clientId: string;
  projectId?: string | null;
  projectTag?: string; // For display in UI
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

// Attachment model
export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  communicationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project model
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  clientId: string;
  clientName?: string; // For UI display
  clientCompany?: string | null; // For UI display
  lastActivity?: Date; // For UI display
  communicationCount?: number; // For UI display
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document model
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  content?: string | null;
  url?: string | null;
  size?: number | null;
  clientId?: string | null;
  projectId?: string | null;
  clientName?: string; // For UI display
  projectName?: string; // For UI display
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice model
export interface Invoice {
  id: string;
  number: string;
  title: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  dueDate: Date;
  sentDate?: Date | null;
  paidDate?: Date | null;
  clientId: string;
  projectId?: string | null;
  clientName?: string; // For UI display
  projectName?: string; // For UI display
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Calendar Event model
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  clientId?: string | null;
  projectId?: string | null;
  clientName?: string; // For UI display
  projectName?: string; // For UI display
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// For API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}