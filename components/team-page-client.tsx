"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskBoard } from "@/components/task-board"
import { TeamMembersPanel } from "@/components/team-members-panel"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { TeamDeleteButton } from "@/components/team-delete-button"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Team {
  id: string
  name: string
  description: string | null
  creatorId: string
  creator: {
    id: string
    name: string
    email: string
  }
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

interface TeamPageClientProps {
  team: Team
  currentUserId: string
}

export function TeamPageClient({ team, currentUserId }: TeamPageClientProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("board")
  const [teamState, setTeamState] = useState<Team>(team)
  const [editOpen, setEditOpen] = useState(false)
  const [draftName, setDraftName] = useState(team.name)
  const [draftDescription, setDraftDescription] = useState(team.description ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const isAdmin = teamState.members.find((m) => m.user.id === currentUserId)?.role === "admin"
  const isCreator = teamState.creatorId === currentUserId

  // Загружаем сохраненную вкладку только на клиенте
  useEffect(() => {
    setMounted(true)
    
    // Проверяем URL параметр
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    if (tabParam && ['board', 'members', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam)
      sessionStorage.setItem(`team_${team.id}_active_tab`, tabParam)
    } else {
      // Проверяем sessionStorage
      const savedTab = sessionStorage.getItem(`team_${team.id}_active_tab`)
      if (savedTab && ['board', 'members', 'analytics'].includes(savedTab)) {
        setActiveTab(savedTab)
      }
    }
  }, [team.id])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    sessionStorage.setItem(`team_${team.id}_active_tab`, value)
    // Обновляем URL параметр
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.pushState({}, '', url.toString())
  }

  const openEdit = () => {
    setError("")
    setDraftName(teamState.name)
    setDraftDescription(teamState.description ?? "")
    setEditOpen(true)
  }

  const saveTeam = async () => {
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/teams/${teamState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName,
          description: draftDescription || null,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || "Не удалось сохранить изменения")
      }

      if (!payload?.team) {
        throw new Error("Сервер вернул некорректный ответ")
      }

      setTeamState(payload.team)
      setEditOpen(false)
    } catch (e: any) {
      setError(e?.message || "Не удалось сохранить изменения")
    } finally {
      setSaving(false)
    }
  }

  // Пока не смонтирован клиент, показываем заглушку
  if (!mounted) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-white/70 backdrop-blur-xl dark:bg-black/20 dark:border-white/10">
          <div className="flex h-16 shrink-0 items-center gap-2 px-4">
            <div className="container flex flex-1 items-center gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight truncate">{teamState.name}</h1>
                <p className="text-sm text-muted-foreground/80 truncate">{teamState.description}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto flex-1 py-4">
          <div className="flex h-96 items-center justify-center">
            Загрузка...
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      
      {/* HEADER */}
      <header
        className="
          sticky top-0 z-20
          border-b border-black/5
          bg-white/70
          backdrop-blur-xl
          dark:bg-black/20
          dark:border-white/10
        "
      >
        <div className="flex h-16 shrink-0 items-center gap-2 px-4">
          <div className="container flex flex-1 items-center gap-4">
            
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="
                  rounded-xl
                  transition-all duration-300
                  hover:bg-black/5
                  dark:hover:bg-white/10
                "
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </Link>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight truncate">
                {teamState.name}
              </h1>

              <p className="text-sm text-muted-foreground/80 truncate">
                {teamState.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Button
                  onClick={openEdit}
                  className="
                    rounded-xl
                    border border-violet-500/10
                    bg-white/40
                    backdrop-blur-md
                    text-foreground
                    transition-all duration-300
                    hover:bg-white/60
                    hover:scale-[1.02]
                    dark:bg-white/5
                    dark:hover:bg-white/10
                    dark:border-white/10
                    hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]
                  "
                >
                  Редактировать проект
                </Button>
              ) : null}

              {isCreator ? (
                <TeamDeleteButton
                  teamId={teamState.id}
                  teamName={teamState.name}
                  redirectToDashboard
                />
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto flex-1 py-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>

          {/* TABS */}
          <TabsList
            className="
              mb-8
              h-auto
              rounded-2xl
              border border-black/5
              bg-white/70
              p-1
              backdrop-blur-xl
              dark:bg-white/5
              dark:border-white/10
            "
          >
            <TabsTrigger
              value="board"
              className="
                rounded-xl
                px-5 py-2.5
                transition-all duration-300
                data-[state=active]:bg-white
                data-[state=active]:shadow-sm
                dark:data-[state=active]:bg-white/10
                dark:data-[state=active]:border
                dark:data-[state=active]:border-white/10
              "
            >
              Доска задач
            </TabsTrigger>

            <TabsTrigger
              value="members"
              className="
                rounded-xl
                px-5 py-2.5
                transition-all duration-300
                data-[state=active]:bg-white
                data-[state=active]:shadow-sm
                dark:data-[state=active]:bg-white/10
                dark:data-[state=active]:border
                dark:data-[state=active]:border-white/10
              "
            >
              Участники
            </TabsTrigger>

            <TabsTrigger
              value="analytics"
              className="
                rounded-xl
                px-5 py-2.5
                transition-all duration-300
                data-[state=active]:bg-white
                data-[state=active]:shadow-sm
                dark:data-[state=active]:bg-white/10
                dark:data-[state=active]:border
                dark:data-[state=active]:border-white/10
              "
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <TaskBoard
              teamId={teamState.id}
              teamMembers={teamState.members}
            />
          </TabsContent>

          <TabsContent value="members">
            <TeamMembersPanel
              team={teamState}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard teamId={teamState.id} />
          </TabsContent>
        </Tabs>
      </main>

      {/* DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="
            sm:max-w-[520px]
            rounded-3xl
            border border-black/5
            bg-white/80
            backdrop-blur-2xl
            shadow-2xl
            dark:bg-zinc-900/80
            dark:border-white/10
          "
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Редактировать проект
            </DialogTitle>

            <DialogDescription className="text-muted-foreground/80">
              Измените название и описание проекта.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="team-name">Название</Label>

              <Input
                id="team-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                disabled={saving}
                className="
                  rounded-xl
                  border-black/5
                  bg-white/70
                  dark:bg-white/5
                  dark:border-white/10
                "
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-description">Описание</Label>

              <Textarea
                id="team-description"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                disabled={saving}
                rows={4}
                className="
                  rounded-xl
                  border-black/5
                  bg-white/70
                  dark:bg-white/5
                  dark:border-white/10
                "
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
              className="rounded-xl"
            >
              Отмена
            </Button>

            <Button
              onClick={saveTeam}
              disabled={saving}
              className="
                rounded-xl
                border border-violet-500/10
                bg-white/40
                backdrop-blur-md
                text-foreground
                transition-all duration-300
                hover:bg-white/60
                hover:scale-[1.02]
                dark:bg-white/5
                dark:hover:bg-white/10
                dark:border-white/10
                hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]
              "
            >
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}