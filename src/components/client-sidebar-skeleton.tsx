"use client"

import { NewClientButton } from "@/components/new-client-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, Search } from "lucide-react"

interface ClientSidebarSkeletonProps {
  count?: number
}

export function ClientSidebarSkeleton({ count = 5 }: ClientSidebarSkeletonProps) {
  return (
    <div className="w-full md:w-72 lg:w-80 border-r border-border bg-sidebar overflow-y-auto flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Clients</h2>
          <NewClientButton />
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            className="pl-8"
            disabled
          />
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" disabled>
            <span>Sort by</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="divide-y divide-sidebar-border">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="p-4 animate-pulse"
          >
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 