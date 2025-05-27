import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET: Fetch all projects for a specific client
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

    // Fetch projects for this client
    const projects = await prisma.project.findMany({
      where: {
        clientId,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json<ApiResponse<{ id: string; name: string }[]>>({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error("Error fetching client projects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch client projects" },
      { status: 500 }
    );
  }
} 