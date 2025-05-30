"use client";

import { archiveClient } from "@/app/actions/clients";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClients, useRemoveClientFromCache } from "@/hooks/use-clients";
import { Archive, ChevronLeft, Edit, Mail, MoreHorizontal, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ClientHeaderProps {
  client: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
  };
}

export function ClientHeader({ client }: ClientHeaderProps) {
  const router = useRouter();
  const { data: clients } = useClients();
  const removeClientFromCache = useRemoveClientFromCache();
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveClient(client.id);
      removeClientFromCache(client.id);

      // Get remaining clients after archival
      const remainingClients = clients?.filter(c => c.id !== client.id);

      if (remainingClients && remainingClients.length > 0) {
        // Redirect to the first remaining client
        router.push(`/clients/${remainingClients[0].id}`);
      } else {
        // No clients left, redirect to main clients page
        router.push('/clients');
      }
    } catch (error) {
      console.error("Failed to archive client:", error);
      setIsArchiving(false);
      setIsArchiveDialogOpen(false);
    }
  };

  return (
    <div className="border-b border-border bg-card glass">
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 rounded-full shine"
            >
              <Link href="/clients">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back to clients</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-headline">{client.name}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shine">
                <MoreHorizontal className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/clients/${client.id}/edit`} className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Client</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsArchiveDialogOpen(true)}
                variant="destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                <span>Archive Client</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
          {client.company && (
            <div className="text-muted-foreground">
              {client.company}
            </div>
          )}
          {client.email && (
            <div className="flex items-center">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${client.email}`}
                className="text-primary hover:text-primary/80"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${client.phone}`}
                className="text-primary hover:text-primary/80"
              >
                {client.phone}
              </a>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Link href={`/clients/${client.id}/projects`}>
            <Button variant="outline" size="sm" className="shine">
              Projects
            </Button>
          </Link>
          <Link href={`/clients/${client.id}/documents`}>
            <Button variant="outline" size="sm" className="shine">
              Documents
            </Button>
          </Link>
          <Link href={`/clients/${client.id}/invoices`}>
            <Button variant="outline" size="sm" className="shine">
              Invoices
            </Button>
          </Link>
        </div>
      </div>

      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Client</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the client and hide them from your active clients list. All data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isArchiving}
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}