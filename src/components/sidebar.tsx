"use client"

import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
} from "@/components/ui/sidebar"
import { Calendar, FileText, FolderKanban, LayoutDashboard, Receipt, Settings, Users } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: Receipt,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <SidebarPrimitive collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center space-x-3 py-2 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:mx-auto">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <div className="text-primary-foreground font-bold text-lg">F</div>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold text-sidebar-foreground">
              FreelancerCRM
            </span>
            <p className="text-xs text-sidebar-foreground/60">
              Freelance Management
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 font-medium mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <div className="text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} FreelancerCRM
        </div>
        <div className="group-data-[collapsible=icon]:block group-data-[collapsible=icon]:text-center hidden">
          <div className="w-6 h-6 rounded bg-sidebar-foreground/10 mx-auto"></div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  )
}
