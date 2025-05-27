"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client } from "@/types";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ClientListViewProps {
  clients: Client[];
}

export function ClientListView({ clients }: ClientListViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<string>("all");

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search clients..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All Clients</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <ClientGrid
              clients={filteredClients}
              emptyMessage={
                searchQuery
                  ? "No clients match your search"
                  : "No clients yet. Create your first client to get started."
              }
            />
          </TabsContent>
          <TabsContent value="recent" className="mt-4">
            <ClientGrid
              clients={filteredClients.slice().sort((a, b) => {
                return new Date(b.lastContact ?? "").getTime() - new Date(a.lastContact ?? "").getTime();
              }).slice(0, 6)}
              emptyMessage={
                searchQuery
                  ? "No recent clients match your search"
                  : "No recent clients."
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ClientGridProps {
  clients: Client[];
  emptyMessage: string;
}

function ClientGrid({ clients, emptyMessage }: ClientGridProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client) => (
        <Link
          key={client.id}
          href={`/clients/${client.id}`}
          className="block p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold truncate">{client.name}</h2>
          {client.company && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{client.company}</p>
          )}
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
              {client.tags && client.tags.length > 0 && client.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  {tag}
                </span>
              ))}
              {client.tags && client.tags.length > 2 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  +{client.tags.length - 2}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(client.lastContact ?? "")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}