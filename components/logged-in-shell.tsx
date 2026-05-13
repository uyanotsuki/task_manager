"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"

export function LoggedInShell({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="pt-0">   
        <main className="flex-1 min-h-screen p-6 bg-background text-foreground">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
