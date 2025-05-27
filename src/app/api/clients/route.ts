import { prisma } from "@/lib/prisma";
import { ApiResponse, Client } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET: Fetch all clients for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

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

    // Fetch all active clients for this user
    const clients = await prisma.client.findMany({
      where: { 
        userId: user.id,
        status: "ACTIVE" // Only fetch active clients
      },
      orderBy: { updatedAt: "desc" },
      include: {
        communications: {
          orderBy: { sentAt: "desc" },
          take: 1, // Get only the latest communication for lastContact
        },
        _count: {
          select: { projects: true } // Count projects for UI display
        },
      },
    });

    // Transform clients to match the UI expected format
    const transformedClients: Client[] = clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      notes: client.notes,
      tags: Array.isArray(client.tags) ? client.tags as string[] : (client.tags ? [] : []),
      lastContact: client.communications[0]?.sentAt.toISOString() || client.updatedAt.toISOString(),
      userId: client.userId,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    return NextResponse.json<ApiResponse<Client[]>>({
      success: true,
      data: transformedClients
    });

  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST: Create a new client
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

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

    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Name is required" }, 
        { status: 400 }
      );
    }

    // Process tags
    const tags = Array.isArray(body.tags) ? body.tags : [];

    // Create the new client
    const client = await prisma.client.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        notes: body.notes || null,
        tags: tags,
        user: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json<ApiResponse<Client>>({
      success: true,
      data: {
        ...client,
        tags: Array.isArray(client.tags) ? client.tags as string[] : [],
        lastContact: client.updatedAt.toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create client" },
      { status: 500 }
    );
  }
}