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
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 rounded-full"
            >
              <Link href="/clients">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back to clients</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
                className="text-red-600 dark:text-red-400"
              >
                <Archive className="mr-2 h-4 w-4" />
                <span>Archive Client</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
          {client.company && (
            <div className="text-gray-500 dark:text-gray-400">
              {client.company}
            </div>
          )}
          {client.email && (
            <div className="flex items-center">
              <Mail className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <a
                href={`mailto:${client.email}`}
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center">
              <Phone className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <a
                href={`tel:${client.phone}`}
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {client.phone}
              </a>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Link href={`/clients/${client.id}/projects`}>
            <Button variant="outline" size="sm">
              Projects
            </Button>
          </Link>
          <Link href={`/clients/${client.id}/documents`}>
            <Button variant="outline" size="sm">
              Documents
            </Button>
          </Link>
          <Link href={`/clients/${client.id}/invoices`}>
            <Button variant="outline" size="sm">
              Invoices
            </Button>
          </Link>
        </div>
      </div>

      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the client and hide them from your active clients list. All data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isArchiving}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}