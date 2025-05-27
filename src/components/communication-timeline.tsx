"use client"

import { deleteCommunication } from "@/app/actions/communications"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useInvalidateCommunications } from "@/hooks/use-clients"
import { cn } from "@/lib/utils"
import { Client, Communication, CommunicationType } from "@/types"
import { Edit, FileText, Filter, Mail, MoreHorizontal, Paperclip, Phone, Trash2, Video } from "lucide-react"
import { useState } from "react"
import { EditCommunicationDialog } from "./edit-communication-dialog"
import { NewCommunicationForm } from "./new-communication-form"

interface CommunicationTimelineProps {
  client: Client
  communications: Communication[]
  projects?: { id: string; name: string }[]
}

export function CommunicationTimeline({ client, communications, projects = [] }: CommunicationTimelineProps) {
  const [filter, setFilter] = useState<CommunicationType | "all">("all")
  const isArchived = client.status === "ARCHIVED"

  const filteredCommunications =
    filter === "all" ? communications : communications.filter((comm) => comm.type === filter)

  return (
    <div className={cn(isArchived && "opacity-50 pointer-events-none")}>
      {/* Archived Client Notice */}
      {isArchived && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              This client has been archived. Communications are read-only.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            {isArchived && (
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                Archived
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400">{client.company}</p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={isArchived}>
                <Filter className="h-4 w-4" />
                <span>
                  {filter === "all"
                    ? "All communications"
                    : filter === "EMAIL"
                      ? "Emails"
                      : filter === "CALL"
                        ? "Calls"
                        : filter === "MEETING"
                          ? "Meetings"
                          : "Notes"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter("all")}>All communications</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("EMAIL")}>Emails</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("CALL")}>Calls</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("MEETING")}>Meetings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("NOTE")}>Notes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isArchived && <NewCommunicationForm clientId={client.id} projects={projects} />}
        </div>
      </div>

      <div className="space-y-4">
        {filteredCommunications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No communications found</p>
          </div>
        ) : (
          filteredCommunications.map((communication) => (
            <CommunicationItem
              key={communication.id}
              communication={communication}
              clientId={client.id}
              projects={projects}
              isArchived={isArchived}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CommunicationItemProps {
  communication: Communication
  clientId: string
  projects?: { id: string; name: string }[]
  isArchived?: boolean
}

function CommunicationItem({ communication, clientId, projects = [], isArchived = false }: CommunicationItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const invalidateCommunications = useInvalidateCommunications()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCommunication(clientId, communication.id)
      await invalidateCommunications(clientId)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Failed to delete communication:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className={cn(
        "flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-shadow",
        !isArchived && "hover:shadow-sm"
      )}>
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              communication.type === "EMAIL" &&
              "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
              communication.type === "CALL" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
              communication.type === "MEETING" &&
              "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
              communication.type === "NOTE" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
            )}
          >
            {communication.type === "EMAIL" && <Mail className="h-5 w-5" />}
            {communication.type === "CALL" && <Phone className="h-5 w-5" />}
            {communication.type === "MEETING" && <Video className="h-5 w-5" />}
            {communication.type === "NOTE" && <FileText className="h-5 w-5" />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{communication.subject}</h3>
              {communication.projectTag && (
                <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                  {communication.projectTag}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(communication.sentAt)}</span>
              {!isArchived && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600 focus:text-red-600">
                      <Trash2 className="h-4 w-4 text-red-600" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">{communication.content}</p>

          {communication.attachments && communication.attachments.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Paperclip className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {communication.attachments.map((attachment) => (
                  <TooltipProvider key={attachment.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2"
                        >
                          {attachment.name.length > 20 ? `${attachment.name.substring(0, 20)}...` : attachment.name}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{attachment.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Communication Dialog - Only for non-archived clients */}
      {!isArchived && (
        <EditCommunicationDialog
          communication={communication}
          clientId={clientId}
          projects={projects}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      {/* Delete Communication Dialog - Only for non-archived clients */}
      {!isArchived && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this communication. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

function formatDateTime(dateString: string | Date): string {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}