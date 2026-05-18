'use client'

import Link from "next/link"
import { Home, Settings, HelpCircle, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { UserAvatar } from "@/components/ui/avatar"

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || data))
      .catch(err => console.error("Failed to fetch user:", err))
  }, [])

  useEffect(() => {
    const onUserUpdated = (event: Event) => {
      const detail = (event as CustomEvent<any>).detail
      if (detail && typeof detail === "object") {
        setUser(detail as Record<string, unknown>)
      }
    }
    window.addEventListener("qm-user-updated", onUserUpdated)
    return () => window.removeEventListener("qm-user-updated", onUserUpdated)
  }, [])

  const displayName = user?.name?.trim() || "Пользователь"

  const avatarUrl =
    typeof user?.avatarUrl === "string" && user.avatarUrl.length > 0
      ? user.avatarUrl
      : null

  const imageCacheKey =
    user?.updatedAt
      ? typeof user.updatedAt === "string"
        ? user.updatedAt
        : new Date(user.updatedAt).toISOString()
      : null

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="
        bg-white/60 dark:bg-black/20
        backdrop-blur-xl


        after:content-none
        before:content-none

        ring-0 outline-none
      "
    >
      <SidebarContent>

        {/* HEADER */}
        <div className="px-4 py-6 flex items-center justify-center">
          <div
            onClick={toggleSidebar}
            className="
              flex items-center justify-center
              w-full
              cursor-pointer
              select-none
              rounded-xl
              px-2 py-2
              transition-colors
              hover:bg-black/5 dark:hover:bg-white/5
            "
          >
            {state === "collapsed" ? (
              <div className="text-2xl font-bold text-violet-500">
                TF
              </div>
            ) : (
              <span className="text-3xl font-bold tracking-tight text-violet-500">
                TaskForce
              </span>
            )}
          </div>
        </div>

        {/* MENU */}
        <SidebarMenu className="px-3 space-y-1 mt-2">

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/dashboard"
                className="
                  flex items-center gap-3
                  rounded-xl px-3 py-2
                  text-sm
                  text-muted-foreground
                  hover:text-violet-500
                  hover:bg-violet-500/10
                  transition-colors
                "
              >
                <Home className="h-5 w-5" />
                <span>Мои проекты</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/settings"
                className="
                  flex items-center gap-3
                  rounded-xl px-3 py-2
                  text-sm
                  text-muted-foreground
                  hover:text-violet-500
                  hover:bg-violet-500/10
                  transition-colors
                "
              >
                <Settings className="h-5 w-5" />
                <span>Настройки</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/help"
                className="
                  flex items-center gap-3
                  rounded-xl px-3 py-2
                  text-sm
                  text-muted-foreground
                  hover:text-violet-500
                  hover:bg-violet-500/10
                  transition-colors
                "
              >
                <HelpCircle className="h-5 w-5" />
                <span>Помощь</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* THEME */}
      <div className="flex justify-center py-3">
        <ThemeToggle />
      </div>

      {/* FOOTER */}
      <SidebarFooter
        className="
          border-t border-black/5 dark:border-white/10
          p-4
        "
      >
        <div className="flex flex-col gap-2">

          {state !== "collapsed" && (
            <div
              className="
                flex items-center gap-3
                  rounded-xl px-3 py-2
                  text-sm
                  text-muted-foreground
                  hover:text-violet-500
                  hover:bg-violet-500/10
                  transition-colors
              "
              onClick={() => window.location.href = '/profile'}
            >
              <UserAvatar
                className="h-11 w-11 shrink-0"
                name={displayName}
                imageUrl={avatarUrl}
                imageCacheKey={imageCacheKey}
                fallbackClassName="bg-violet-600 text-base font-semibold"
              />

              <div className="flex flex-col min-w-0">
                <p className="font-medium text-sm truncate">
                  {displayName}
                </p>
              </div>
            </div>
          )}

          {/* LOGOUT */}
          <SidebarMenuButton
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', {
                  method: 'POST',
                  credentials: 'include'
                })
                window.location.href = '/'
              } catch (error) {
                console.error('Logout error:', error)
                window.location.href = '/'
              }
            }}
            className="
              w-full justify-center
              rounded-xl
              text-muted-foreground
              hover:text-violet-500
              hover:bg-violet-500/10
              transition-colors
            "
            size={state === "collapsed" ? "sm" : "default"}
          >
            <LogOut className="h-5 w-5" />
            {state !== "collapsed" && (
              <span className="ml-2">Выход</span>
            )}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}