"use client";

import { ClientSidebarList } from "@/components/client-sidebar-list";
import { ClientSidebarSkeleton } from "@/components/client-sidebar-skeleton";
import { CommunicationTimeline } from "@/components/communication-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { useClient, useClientCommunications, useClientProjects } from "@/hooks/use-clients";
import { notFound } from "next/navigation";

interface ClientPageContentProps {
  clientId: string;
}

export function ClientPageContent({ clientId }: ClientPageContentProps) {
  // Use React Query to fetch client data
  const { data: client, isLoading: clientLoading, error: clientError } = useClient(clientId);

  // Fetch communications for this client
  const { data: communications = [] } = useClientCommunications(clientId);

  // Fetch projects for this client
  const { data: projects = [] } = useClientProjects(clientId);

  // Handle client not found
  if (clientError || (client === null && !clientLoading)) {
    notFound();
  }

  // Show loading state
  if (clientLoading || !client) {
    return (
      <div className="flex h-full overflow-hidden">
        <ClientSidebarSkeleton />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-40" />
              </div>
            </div>

            {/* Communication timeline skeleton */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <ClientSidebarList selectedClientId={clientId} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        <CommunicationTimeline
          client={client}
          communications={communications}
          projects={projects}
        />
      </main>
    </div>
  );
} 