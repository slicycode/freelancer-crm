import { prisma } from "@/lib/prisma";
import { ApiResponse, Attachment, Communication } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET: Fetch all communications for a specific client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { clientId } = await params;

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" }, 
        { status: 404 }
      );
    }

    // Verify client belongs to this user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id
      }
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found or access denied" }, 
        { status: 404 }
      );
    }

    // Fetch communications with attachments and project info
    const communications = await prisma.communication.findMany({
      where: { clientId },
      orderBy: { sentAt: "desc" },
      include: {
        attachments: true,
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        }
      }
    });

    // Transform communications to match the UI expected format
    const transformedCommunications: Communication[] = communications.map(comm => ({
      id: comm.id,
      type: comm.type,
      subject: comm.subject,
      content: comm.content,
      sentAt: comm.sentAt,
      clientId: comm.clientId,
      projectId: comm.projectId,
      projectTag: comm.project?.name, // Add project name as tag
      attachments: comm.attachments.map(att => ({
        id: att.id,
        name: att.name,
        url: att.url,
        size: att.size,
        type: att.type,
        communicationId: att.communicationId,
        createdAt: att.createdAt,
        updatedAt: att.updatedAt,
      })),
      createdAt: comm.createdAt,
      updatedAt: comm.updatedAt,
    }));

    return NextResponse.json<ApiResponse<Communication[]>>({
      success: true,
      data: transformedCommunications
    });

  } catch (error) {
    console.error("Error fetching communications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch communications" },
      { status: 500 }
    );
  }
}

// POST: Create a new communication for a client
export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { clientId } = await params;
    const body = await request.json();

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" }, 
        { status: 404 }
      );
    }

    // Verify client belongs to this user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id
      }
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found or access denied" }, 
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.type || !body.subject || !body.content) {
      return NextResponse.json(
        { success: false, error: "Type, subject and content are required" }, 
        { status: 400 }
      );
    }

    // Create the communication with a transaction to handle attachments
    const result = await prisma.$transaction(async (tx) => {
      // Create the communication
      const communication = await tx.communication.create({
        data: {
          type: body.type,
          subject: body.subject,
          content: body.content,
          sentAt: body.sentAt ? new Date(body.sentAt) : new Date(),
          client: {
            connect: { id: clientId }
          },
          project: body.projectId ? {
            connect: { id: body.projectId }
          } : undefined
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            }
          }
        }
      });

      // Create attachments if provided
      const attachments: Attachment[] = [];
      if (body.attachments && Array.isArray(body.attachments)) {
        for (const att of body.attachments) {
          const attachment = await tx.attachment.create({
            data: {
              name: att.name,
              url: att.url,
              size: att.size,
              type: att.type,
              communication: {
                connect: { id: communication.id }
              }
            }
          });
          attachments.push(attachment);
        }
      }

      return { communication, attachments };
    });

    // Return the created communication
    return NextResponse.json<ApiResponse<Communication>>({
      success: true,
      data: {
        ...result.communication,
        projectTag: result.communication.project?.name,
        attachments: result.attachments,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating communication:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create communication" },
      { status: 500 }
    );
  }
}