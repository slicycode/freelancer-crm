import { getClients } from "@/app/actions/clients";
import { ClientSidebarList } from "@/components/client-sidebar-list";
import { NewClientButton } from "@/components/new-client-button";
import { prisma } from "@/lib/prisma";
import { ensureUserInDatabase } from "@/lib/user-utils";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Clients - FreelancerCRM",
  description: "Manage your clients and their communications",
};

export default async function ClientsPage() {
  const activeClients = await getClients("ACTIVE");

  // Check if there are any clients at all (including archived)
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await ensureUserInDatabase(userId);
  const totalClientsCount = await prisma.client.count({
    where: { userId: user.id }
  });

  // If there are active clients, redirect to the first one immediately
  if (activeClients.length > 0) {
    redirect(`/clients/${activeClients[0].id}`);
  }

  // If no clients exist at all, show empty state with option to create first client
  if (totalClientsCount === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No clients yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first client to get started with managing communications.
            </p>
            <NewClientButton />
          </div>
        </div>
      </div>
    );
  }

  // If there are clients but none are active (all archived), show sidebar with empty state
  return (
    <div className="flex h-full overflow-hidden">
      <ClientSidebarList selectedClientId="" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No active clients
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              All your clients are archived. Use the filter in the sidebar to view archived clients or create a new one.
            </p>
            <NewClientButton />
          </div>
        </div>
      </main>
    </div>
  );
}