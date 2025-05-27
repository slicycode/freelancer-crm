import { DashboardOverview } from "@/components/dashboard-overview";
import { prisma } from "@/lib/prisma";
import { ensureUserInDatabase } from "@/lib/user-utils";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard - FreelancerCRM",
  description: "Overview of your freelance business",
};

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in our database (create if first-time OAuth user)
  let user;
  try {
    user = await ensureUserInDatabase(userId);
  } catch (error) {
    console.error("Error ensuring user in database:", error);
    redirect("/error?message=Failed to create user account");
  }

  // Count clients
  const totalClients = await prisma.client.count({
    where: { userId: user.id },
  });

  // Count active projects
  const activeProjects = await prisma.project.count({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  // Get recent clients
  const recentClients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      communications: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
  });

  // Get recent communications
  const recentCommunications = await prisma.communication.findMany({
    where: {
      client: {
        userId: user.id,
      },
    },
    orderBy: { sentAt: "desc" },
    take: 5,
    include: {
      client: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // For now, pending invoices is a placeholder - will implement in a future feature
  const pendingInvoices = 0;

  // Transform the data to match the component props
  const transformedClients = recentClients.map(client => ({
    id: client.id,
    name: client.name,
    company: client.company,
    email: client.email,
    lastContact: client.communications[0]?.sentAt.toISOString() || client.updatedAt.toISOString(),
  }));

  const transformedCommunications = recentCommunications.map(comm => ({
    id: comm.id,
    type: comm.type,
    subject: comm.subject,
    content: comm.content,
    sentAt: comm.sentAt.toISOString(),
    clientId: comm.clientId,
    clientName: comm.client.name,
    projectName: comm.project?.name,
  }));

  return (
    <DashboardOverview
      stats={{
        totalClients,
        activeProjects,
        pendingInvoices,
        recentCommunications: recentCommunications.length,
      }}
      recentClients={transformedClients}
      recentCommunications={transformedCommunications}
    />
  );
}