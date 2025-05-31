import {
  ClientStatus as PrismaClientStatus,
  CommunicationType as PrismaCommunicationType,
  DocumentStatus as PrismaDocumentStatus,
  DocumentType as PrismaDocumentType,
  ProjectStatus as PrismaProjectStatus,
  BudgetType as PrismaBudgetType,
  MilestoneStatus as PrismaMilestoneStatus,
  TaskStatus as PrismaTaskStatus,
  TaskPriority as PrismaTaskPriority,
  ProjectHealth as PrismaProjectHealth,
  ProjectPhaseStatus as PrismaProjectPhaseStatus
} from "@prisma/client";

// Re-export Prisma enums
export type CommunicationType = PrismaCommunicationType;
export type ProjectStatus = PrismaProjectStatus;
export type ClientStatus = PrismaClientStatus;
export type DocumentType = PrismaDocumentType;
export type DocumentStatus = PrismaDocumentStatus;

// Enhanced project management types
export type BudgetType = PrismaBudgetType;
export type MilestoneStatus = PrismaMilestoneStatus;
export type TaskStatus = PrismaTaskStatus;
export type TaskPriority = PrismaTaskPriority;
export type ProjectHealth = PrismaProjectHealth;
export type ProjectPhaseStatus = PrismaProjectPhaseStatus;

// Invoice types
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELED";

// Document Template types
export type VariableType = 
  | "text"
  | "textarea" 
  | "number"
  | "currency"
  | "date"
  | "select"
  | "email"
  | "phone"
  | "url"
  | "calculated";
export type VariableSource = "manual" | "client" | "project" | "user" | "system";

export interface DocumentVariable {
  key: string;
  label: string;
  type: VariableType;
  source: VariableSource;
  required?: boolean;
  defaultValue?: string;
  description?: string;
  options?: string[];
  format?: string; // For currency/number formatting
  formula?: string; // For calculated variables
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  content: string; // Rich text content with variable placeholders
  variables: DocumentVariable[];
  isDefault: boolean;
  isGlobal?: boolean; // Global templates visible to all users
  userId?: string; // Optional for global templates
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedDocument {
  templateId: string;
  templateName: string;
  variableValues: Record<string, string | number | boolean>;
}

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

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: Date;
  status: MilestoneStatus;
  deliverables: string[];
  paymentAmount?: number;
  clientApprovalRequired: boolean;
  projectId: string;
  order: number;
  completedAt?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours: number;
  actualHours: number;
  dueDate?: Date;
  milestoneId?: string;
  projectId: string;
  dependencies: string[]; // Task IDs
  completedAt?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  milestoneId?: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  description: string;
  billable: boolean;
  hourlyRate?: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: ProjectPhaseStatus;
  projectId: string;
  order: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Project model - matching the Prisma schema
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  
  // Enhanced project management fields (matching Prisma schema types)
  estimatedHours?: number | null;
  actualHours?: number | null;
  budgetType?: BudgetType | null;
  totalBudget?: number | null;
  hourlyRate?: number | null;
  invoicedAmount?: number | null;
  progress?: number | null; // 0-100 percentage
  health?: ProjectHealth | null;
  
  // Existing fields
  clientId: string;
  clientName?: string; // For UI display
  clientCompany?: string | null; // For UI display
  lastActivity?: Date; // For UI display
  communicationCount?: number; // For UI display
  
  // Enhanced relationship counts for UI
  milestoneCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
  timeEntryCount?: number;
  documentCount?: number;
  
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Document model - now supports both templates and generated documents
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
  templateId?: string | null; // Reference to template if generated from one
  templateName?: string; // For UI display
  variableValues?: Record<string, string | number | boolean>; // Values used when generating from template
  isTemplate?: boolean; // Flag to distinguish templates from documents
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document Version model for tracking changes
export interface DocumentVersion {
  id: string;
  versionNumber: number;
  content: string;
  variableValues?: Record<string, string | number | boolean> | null;
  contentHash: string;
  changeNotes?: string | null;
  metrics?: {
    wordCount: number;
    characterCount: number;
    estimatedReadTime: number;
    pageCount: number;
  } | null;
  createdBy: string;
  documentId: string;
  createdAt: Date;
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