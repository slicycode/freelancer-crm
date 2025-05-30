"use server";

import { prisma } from "@/lib/prisma";
import { DocumentTemplate, DocumentType, DocumentVariable } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getDocumentTemplates(): Promise<DocumentTemplate[]> {
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

    // Fetch global templates (visible to all users) and user-specific templates
    const [globalTemplates, userTemplates] = await Promise.all([
      prisma.documentTemplate.findMany({
        where: { 
          isGlobal: true
        },
        orderBy: { createdAt: "asc" }
      }),
      prisma.documentTemplate.findMany({
        where: { 
          userId: user.id,
          isGlobal: false
        },
        orderBy: { updatedAt: "desc" }
      })
    ]);

    // Combine global and user templates
    const allTemplates = [...globalTemplates, ...userTemplates];

    // Transform templates to match the UI expected format
    return allTemplates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      type: template.type,
      content: template.content,
      variables: (template.variables as unknown as DocumentVariable[]) || [],
      isDefault: template.isDefault,
      isGlobal: template.isGlobal || false,
      userId: template.userId ?? undefined,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));

  } catch (error) {
    console.error("Error fetching document templates:", error);
    throw error;
  }
}

export async function createDocumentTemplate(templateData: {
  name: string;
  description?: string;
  type: DocumentType;
  content: string;
  variables: DocumentVariable[];
  isDefault?: boolean;
}): Promise<DocumentTemplate> {
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

    // Validate required fields
    if (!templateData.name) {
      throw new Error("Template name is required");
    }

    if (!templateData.type) {
      throw new Error("Template type is required");
    }

    if (!templateData.content) {
      throw new Error("Template content is required");
    }

    // Create the new template
    const template = await prisma.documentTemplate.create({
      data: {
        name: templateData.name,
        description: templateData.description,
        type: templateData.type,
        content: templateData.content,
        variables: templateData.variables as unknown as any,
        isDefault: templateData.isDefault || false,
        user: {
          connect: { id: user.id }
        }
      }
    });

    // Revalidate the templates page to reflect the new template
    revalidatePath("/documents");
    revalidatePath("/documents/templates");

    return {
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      type: template.type,
      content: template.content,
      variables: (template.variables as unknown as DocumentVariable[]) || [],
      isDefault: template.isDefault,
      userId: template.userId ?? undefined,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

  } catch (error) {
    console.error("Error creating document template:", error);
    throw error;
  }
}

export async function updateDocumentTemplate(
  templateId: string,
  templateData: Partial<{
    name: string;
    description: string;
    type: DocumentType;
    content: string;
    variables: DocumentVariable[];
    isDefault: boolean;
  }>
): Promise<DocumentTemplate> {
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

    // Verify the template exists and belongs to the user
    const existingTemplate = await prisma.documentTemplate.findFirst({
      where: {
        id: templateId,
        userId: user.id
      }
    });

    if (!existingTemplate) {
      throw new Error("Template not found or access denied");
    }

    // Build update data object
    const updateData: any = {};
    
    if (templateData.name !== undefined) updateData.name = templateData.name;
    if (templateData.description !== undefined) updateData.description = templateData.description;
    if (templateData.type !== undefined) updateData.type = templateData.type;
    if (templateData.content !== undefined) updateData.content = templateData.content;
    if (templateData.variables !== undefined) updateData.variables = templateData.variables as unknown as any;
    if (templateData.isDefault !== undefined) updateData.isDefault = templateData.isDefault;

    // Update the template
    const template = await prisma.documentTemplate.update({
      where: { id: templateId },
      data: updateData
    });

    // Revalidate the templates page to reflect the changes
    revalidatePath("/documents");
    revalidatePath("/documents/templates");
    revalidatePath(`/documents/templates/${templateId}`);

    return {
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      type: template.type,
      content: template.content,
      variables: (template.variables as unknown as DocumentVariable[]) || [],
      isDefault: template.isDefault,
      userId: template.userId ?? undefined,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

  } catch (error) {
    console.error("Error updating document template:", error);
    throw error;
  }
}

export async function deleteDocumentTemplate(templateId: string): Promise<void> {
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

    // Verify the template exists and belongs to the user
    const existingTemplate = await prisma.documentTemplate.findFirst({
      where: {
        id: templateId,
        userId: user.id
      }
    });

    if (!existingTemplate) {
      throw new Error("Template not found or access denied");
    }

    // Delete the template
    await prisma.documentTemplate.delete({
      where: { id: templateId }
    });

    // Revalidate the templates page to reflect the deletion
    revalidatePath("/documents");
    revalidatePath("/documents/templates");

  } catch (error) {
    console.error("Error deleting document template:", error);
    throw error;
  }
}

export async function getDocumentTemplate(templateId: string): Promise<DocumentTemplate> {
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

    // Fetch the template (either user-specific or global)
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId: user.id }, // User's own template
          { isGlobal: true }    // Global template
        ]
      }
    });

    if (!template) {
      throw new Error("Template not found or access denied");
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      type: template.type,
      content: template.content,
      variables: (template.variables as unknown as DocumentVariable[]) || [],
      isDefault: template.isDefault,
      isGlobal: template.isGlobal || false,
      userId: template.userId ?? undefined,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

  } catch (error) {
    console.error("Error fetching document template:", error);
    throw error;
  }
}

// Generate a document from a template
export async function generateDocumentFromTemplate(data: {
  templateId: string;
  name: string;
  variableValues: Record<string, any>;
  clientId?: string;
  projectId?: string;
  status?: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "ARCHIVED";
}): Promise<{ id: string; name: string }> {
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

    // Get the template
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: data.templateId,
        OR: [
          { userId: user.id }, // User's own template
          { isGlobal: true }    // Global template
        ]
      }
    });

    if (!template) {
      throw new Error("Template not found or access denied");
    }

    // Replace variables in content
    let processedContent = template.content;
    const variables = (template.variables as unknown as DocumentVariable[]) || [];
    
    variables.forEach(variable => {
      const value = data.variableValues[variable.key] || variable.defaultValue || '';
      const placeholder = `{{${variable.key}}}`;
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // Create the document
    const document = await prisma.document.create({
      data: {
        name: data.name,
        type: template.type,
        status: data.status || "DRAFT",
        content: processedContent,
        variableValues: data.variableValues as unknown as any,
        isTemplate: false,
        user: {
          connect: { id: user.id }
        },
        template: {
          connect: { id: template.id }
        },
        ...(data.clientId && {
          client: {
            connect: { id: data.clientId }
          }
        }),
        ...(data.projectId && {
          project: {
            connect: { id: data.projectId }
          }
        })
      }
    });

    // Revalidate the documents page
    revalidatePath("/documents");

    return {
      id: document.id,
      name: document.name
    };

  } catch (error) {
    console.error("Error generating document from template:", error);
    throw error;
  }
}

// Get variable values from client/project data for auto-population
export async function getVariableValues(
  clientId?: string, 
  projectId?: string
): Promise<Record<string, any>> {
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

    const values: Record<string, any> = {};

    // Add user data
    values.my_name = user.name || '';
    values.my_email = user.email || '';
    values.your_name = user.name || '';
    values.your_email = user.email || '';

    // Add current date and calculated dates
    const today = new Date();
    values.current_date = today.toLocaleDateString();
    values.today = today.toLocaleDateString();
    values.current_year = today.getFullYear().toString();
    values.current_month = today.toLocaleDateString('en-US', { month: 'long' });
    
    // Add calculated future dates
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    values.next_week = nextWeek.toLocaleDateString();
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    values.next_month = nextMonth.toLocaleDateString();
    
    const in_30_days = new Date(today);
    in_30_days.setDate(today.getDate() + 30);
    values.in_30_days = in_30_days.toLocaleDateString();
    values.due_date_30 = in_30_days.toLocaleDateString();

    // Add client data if provided
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId: user.id
        }
      });

      if (client) {
        values.client_name = client.name;
        values.client_email = client.email || '';
        values.client_phone = client.phone || '';
        values.client_company = client.company || '';
        values.company_name = client.company || client.name;
        values.client_notes = client.notes || '';
        
        // Client greeting variations
        values.client_first_name = client.name.split(' ')[0];
        values.dear_client = `Dear ${client.name}`;
        values.dear_firstname = `Dear ${client.name.split(' ')[0]}`;
      }
    }

    // Add project data if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: user.id
        },
        include: {
          client: true
        }
      });

      if (project) {
        values.project_name = project.name;
        values.project_description = project.description || '';
        values.project_start_date = project.startDate?.toLocaleDateString() || '';
        values.project_end_date = project.endDate?.toLocaleDateString() || '';
        values.project_status = project.status;
        
        // If client wasn't already populated, add from project
        if (!clientId && project.client) {
          values.client_name = project.client.name;
          values.client_email = project.client.email || '';
          values.client_phone = project.client.phone || '';
          values.client_company = project.client.company || '';
          values.company_name = project.client.company || project.client.name;
        }
        
        // Calculate project duration
        if (project.startDate && project.endDate) {
          const duration = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24));
          values.project_duration = `${duration} days`;
          values.project_duration_weeks = `${Math.ceil(duration / 7)} weeks`;
        }
      }
    }

    // Add common business values
    values.business_name = user.name || 'Your Business';
    values.payment_terms = '30 days';
    values.late_fee = '1.5% per month';
    values.currency = '$';
    values.tax_rate = '0%';

    // Add greeting variations
    const hour = today.getHours();
    if (hour < 12) {
      values.time_greeting = 'Good morning';
    } else if (hour < 18) {
      values.time_greeting = 'Good afternoon';
    } else {
      values.time_greeting = 'Good evening';
    }

    return values;

  } catch (error) {
    console.error("Error getting variable values:", error);
    throw error;
  }
}

// Generate template preview with sample data
export async function generateTemplatePreview(templateId: string): Promise<{ content: string; variables: Record<string, any> }> {
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

    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId: user.id }, // User's own template
          { isGlobal: true }    // Global template
        ]
      }
    });

    if (!template) {
      throw new Error("Template not found");
    }

    // Generate sample data for all variables
    const sampleData: Record<string, any> = {};
    
    // Add sample user data
    sampleData.my_name = user.name || 'John Smith';
    sampleData.your_name = user.name || 'John Smith';
    sampleData.my_email = user.email || 'john@example.com';
    sampleData.your_email = user.email || 'john@example.com';
    sampleData.business_name = user.name || 'Smith Consulting';

    // Add sample client data
    sampleData.client_name = 'Jane Doe';
    sampleData.client_first_name = 'Jane';
    sampleData.client_email = 'jane@example.com';
    sampleData.client_phone = '(555) 123-4567';
    sampleData.client_company = 'Acme Corporation';
    sampleData.company_name = 'Acme Corporation';
    sampleData.dear_client = 'Dear Jane Doe';
    sampleData.dear_firstname = 'Dear Jane';

    // Add sample project data
    sampleData.project_name = 'E-commerce Website Redesign';
    sampleData.project_description = 'Complete redesign of the company website with modern UI/UX, mobile responsiveness, and enhanced e-commerce functionality.';
    sampleData.project_start_date = new Date().toLocaleDateString();
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    sampleData.project_end_date = endDate.toLocaleDateString();
    sampleData.project_duration = '30 days';
    sampleData.project_duration_weeks = '4-5 weeks';
    sampleData.project_status = 'IN_PROGRESS';

    // Add sample dates
    const today = new Date();
    sampleData.current_date = today.toLocaleDateString();
    sampleData.today = today.toLocaleDateString();
    sampleData.current_year = today.getFullYear().toString();
    sampleData.current_month = today.toLocaleDateString('en-US', { month: 'long' });
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    sampleData.next_week = nextWeek.toLocaleDateString();
    
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);
    sampleData.in_30_days = in30Days.toLocaleDateString();
    sampleData.due_date_30 = in30Days.toLocaleDateString();

    // Add sample financial data
    sampleData.project_cost = '$5,000';
    sampleData.total_cost = '$5,000';
    sampleData.hourly_rate = '$75';
    sampleData.estimated_hours = '67 hours';
    sampleData.payment_terms = '50% upfront, 50% on completion';
    sampleData.currency = '$';
    sampleData.tax_rate = '8.5%';
    sampleData.subtotal = '$4,500';
    sampleData.tax_amount = '$382.50';
    sampleData.total_amount = '$5,000';

    // Add greeting based on time
    const hour = today.getHours();
    if (hour < 12) {
      sampleData.time_greeting = 'Good morning';
    } else if (hour < 18) {
      sampleData.time_greeting = 'Good afternoon';
    } else {
      sampleData.time_greeting = 'Good evening';
    }

    // Add sample data for any template-specific variables
    const templateVariables = template.variables as unknown as DocumentVariable[];
    templateVariables.forEach(variable => {
      if (!sampleData[variable.key]) {
        switch (variable.type) {
          case 'currency':
            sampleData[variable.key] = '$2,500';
            break;
          case 'number':
            sampleData[variable.key] = '42';
            break;
          case 'date':
            sampleData[variable.key] = today.toLocaleDateString();
            break;
          case 'select':
            sampleData[variable.key] = variable.options?.[0] || 'Option 1';
            break;
          case 'textarea':
            sampleData[variable.key] = 'This is sample text for the textarea field. It demonstrates how longer content will appear in your final document.';
            break;
          default:
            sampleData[variable.key] = variable.defaultValue || `Sample ${variable.label}`;
        }
      }
    });

    // Replace variables in template content
    let previewContent = template.content;
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewContent = previewContent.replace(regex, value.toString());
    });

    return {
      content: previewContent,
      variables: sampleData
    };

  } catch (error) {
    console.error("Error generating template preview:", error);
    throw error;
  }
}

// Copy a global template to create a user-specific editable version
export async function copyGlobalTemplate(templateId: string): Promise<DocumentTemplate> {
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

    // Get the global template
    const globalTemplate = await prisma.documentTemplate.findFirst({
      where: {
        id: templateId,
        isGlobal: true
      }
    });

    if (!globalTemplate) {
      throw new Error("Global template not found");
    }

    // Create a user-specific copy
    const userTemplate = await prisma.documentTemplate.create({
      data: {
        name: `${globalTemplate.name} (Custom)`,
        description: globalTemplate.description,
        type: globalTemplate.type,
        content: globalTemplate.content,
        variables: globalTemplate.variables as unknown as any,
        isDefault: false, // User copies are not default
        isGlobal: false, // User copies are not global
        userId: user.id
      }
    });

    // Revalidate the templates page
    revalidatePath("/documents");
    revalidatePath("/documents/templates");

    return {
      id: userTemplate.id,
      name: userTemplate.name,
      description: userTemplate.description || undefined,
      type: userTemplate.type,
      content: userTemplate.content,
      variables: (userTemplate.variables as unknown as DocumentVariable[]) || [],
      isDefault: userTemplate.isDefault,
      isGlobal: userTemplate.isGlobal,
      userId: userTemplate.userId ?? undefined,
      createdAt: userTemplate.createdAt,
      updatedAt: userTemplate.updatedAt,
    };

  } catch (error) {
    console.error("Error copying global template:", error);
    throw error;
  }
}