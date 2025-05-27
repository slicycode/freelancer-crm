"use client"

import { archiveClient, unarchiveClient } from "@/app/actions/clients"
import { ClientSidebarSkeleton } from "@/components/client-sidebar-skeleton"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { NewClientButton } from "@/components/new-client-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useClients, useInvalidateClients } from "@/hooks/use-clients"
import { cn } from "@/lib/utils"
import type { Client } from "@/types"
import { Archive, ChevronDown, Edit, MoreHorizontal, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ClientSidebarListProps {
  selectedClientId: string
}

export function ClientSidebarList({ selectedClientId }: ClientSidebarListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortBy, setSortBy] = useState<"name" | "recent">("name")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ACTIVE")
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [archivingClient, setArchivingClient] = useState<Client | null>(null)
  const [isArchiving, setIsArchiving] = useState<boolean>(false)

  const { data: clients, isLoading, error } = useClients(statusFilter)
  const invalidateClients = useInvalidateClients()


  async function handleArchiveToggle() {
    if (!archivingClient) return

    setIsArchiving(true)
    try {
      if (archivingClient.status === "ACTIVE") {
        await archiveClient(archivingClient.id)
      } else {
        await unarchiveClient(archivingClient.id)
      }

      // Invalidate all client queries to refetch fresh data
      // This preserves the current filter state
      invalidateClients()

      // Check if we're currently viewing the client being archived
      if (selectedClientId === archivingClient.id && archivingClient.status === "ACTIVE") {
        // Get remaining active clients after archival
        const remainingClients = clients?.filter(client => client.id !== archivingClient.id && client.status === "ACTIVE")

        if (remainingClients && remainingClients.length > 0) {
          // Redirect to the first remaining active client
          router.push(`/clients/${remainingClients[0].id}`)
        } else {
          // No active clients left, redirect to main clients page
          router.push('/clients')
        }
      }

      setArchivingClient(null)
    } catch (err) {
      console.error("Failed to toggle client archive status:", err)
    } finally {
      setIsArchiving(false)
    }
  }

  // Handle loading and error states
  if (isLoading) {
    return <ClientSidebarSkeleton />
  }

  if (error) {
    return (
      <div className="w-full md:w-72 lg:w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto flex-shrink-0 hidden md:block">
        <div className="p-4 text-center">
          <p className="text-red-500">Failed to load clients</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!clients) {
    return <ClientSidebarSkeleton />
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    } else {
      return new Date(b.lastContact || "").getTime() - new Date(a.lastContact || "").getTime()
    }
  })

  return (
    <div className="w-full md:w-72 lg:w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Clients</h2>
          <NewClientButton />
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search clients..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">{filteredClients.length} client{filteredClients.length === 1 ? "" : "s"}</span>
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-gray-500 dark:text-gray-400">
                  <span>{statusFilter === "ALL" ? "All" : statusFilter === "ACTIVE" ? "Active" : "Archived"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>
                  <span className={cn(statusFilter === "ALL" && "font-medium")}>All</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("ACTIVE")}>
                  <span className={cn(statusFilter === "ACTIVE" && "font-medium")}>Active</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("ARCHIVED")}>
                  <span className={cn(statusFilter === "ARCHIVED" && "font-medium")}>Archived</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-gray-500 dark:text-gray-400">
                  <span>Sort by</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  <span className={cn(sortBy === "name" && "font-medium")}>Name</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("recent")}>
                  <span className={cn(sortBy === "recent" && "font-medium")}>Recent contact</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedClients.map((client) => (
          <div
            key={client.id}
            className={cn(
              "relative group transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
              selectedClientId === client.id && "bg-indigo-50 dark:bg-indigo-900/20",
              client.status === "ARCHIVED" && "opacity-50"
            )}
          >
            <button
              className="w-full text-left p-4"
              onClick={() => router.push(`/clients/${client.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{client.name}</h3>
                  {client.status === "ARCHIVED" && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                      Archived
                    </span>
                  )}
                </div>
                <div className="relative">
                  {/* Date - visible by default, hidden on hover */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:opacity-0 transition-opacity">
                    {formatDate(client.lastContact || "")}
                  </span>

                  {/* Three-dot menu - hidden by default, visible on hover */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingClient(client);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit client
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setArchivingClient(client);
                          }}
                          className={client.status === "ACTIVE" ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}
                        >
                          <Archive className={`h-4 w-4 ${client.status === "ACTIVE" ? "text-red-600" : "text-green-600"}`} />
                          {client.status === "ACTIVE" ? "Archive client" : "Unarchive client"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{client.company}</p>
              <div className="flex items-center gap-2 mt-2">
                {client.tags && client.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Client Dialog */}
      {editingClient && (
        <EditClientDialog
          client={editingClient}
          isOpen={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
        />
      )}

      {/* Archive/Unarchive Client Dialog */}
      <AlertDialog open={!!archivingClient} onOpenChange={(open) => !open && setArchivingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archivingClient?.status === "ACTIVE" ? "Archive Client" : "Unarchive Client"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archivingClient?.status === "ACTIVE" ? (
                <>
                  Are you sure you want to archive &ldquo;{archivingClient?.name}&rdquo;?
                  The client will be hidden from your active clients list but all data will be preserved.
                </>
              ) : (
                <>
                  Are you sure you want to unarchive &ldquo;{archivingClient?.name}&rdquo;?
                  The client will be restored to your active clients list.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveToggle}
              disabled={isArchiving}
              className={archivingClient?.status === "ACTIVE" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isArchiving ?
                (archivingClient?.status === "ACTIVE" ? "Archiving..." : "Unarchiving...") :
                (archivingClient?.status === "ACTIVE" ? "Archive Client" : "Unarchive Client")
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function formatDate(dateString: string): string {
  if (!dateString) return ""

  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return "Today"
  } else if (diffInDays === 1) {
    return "Yesterday"
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
} 