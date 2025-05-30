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
        <div className="mb-6 p-4 glass border border-warning/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-warning rounded-full animate-glow"></div>
            <p className="text-sm text-warning-foreground font-medium">
              This client has been archived. Communications are read-only.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-headline">{client.name}</h1>
            {isArchived && (
              <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                Archived
              </span>
            )}
          </div>
          <p className="text-muted-foreground">{client.company}</p>
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
            <p className="text-muted-foreground">No communications found</p>
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
        "flex gap-4 p-4 rounded-lg card-elevated transition-shadow",
        !isArchived && "hover-lift shine"
      )}>
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              communication.type === "EMAIL" && "status-bg-primary text-chart-1",
              communication.type === "CALL" && "status-bg-success text-chart-2",
              communication.type === "MEETING" && "status-bg-info text-chart-5",
              communication.type === "NOTE" && "status-bg-warning text-chart-3",
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
              <h3 className="font-medium truncate text-headline">{communication.subject}</h3>
              {communication.projectTag && (
                <span className="inline-flex items-center rounded-full status-bg-info px-2.5 py-0.5 text-xs font-medium text-chart-5">
                  {communication.projectTag}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{formatDateTime(communication.sentAt.toISOString())}</span>
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
                    <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} variant="destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <p className="text-body text-sm line-clamp-2 mb-2">{communication.content}</p>

          {communication.attachments && communication.attachments.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {communication.attachments.map((attachment) => (
                  <TooltipProvider key={attachment.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:text-primary/80 underline underline-offset-2"
                        >
                          {attachment.name}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Communication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this communication? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditCommunicationDialog
        communication={communication}
        clientId={clientId}
        projects={projects}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  )
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}