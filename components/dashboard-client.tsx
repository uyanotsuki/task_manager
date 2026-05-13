"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamDialog } from "@/components/team-dialog"
import { TeamCard } from "@/components/team-card"
import { Plus } from "lucide-react"
import { fetchWithTimeout } from "@/lib/fetch-with-timeout"
import { redirectToLoginPreservingReturn } from "@/lib/redirect-login"

interface User {
  id: string
  name: string
  email: string
}

interface Team {
  id: string
  name: string
  description: string | null
  creator: { id: string; name: string }
  members: Array<{
    id: string
    role: string
    user: { id: string; name: string; email: string }
  }>
  _count: { tasks: number; members: number }
}

export function DashboardClient({ user }: { user: User }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    void fetchTeams()
  }, [])

  const fetchTeams = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetchWithTimeout("/api/teams", { method: "GET" })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 401) {
          redirectToLoginPreservingReturn()
          return
        }
        const msg = data?.error || "Не удалось загрузить проекты"
        setTeams([])
        setFetchError(msg)
        return
      }

      setTeams(Array.isArray(data?.teams) ? data.teams : [])
    } catch (error) {
      setTeams([])
      setFetchError("Не удалось загрузить проекты")
      console.error("[v0] Fetch teams error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (data: { name: string; description: string }) => {
    const res = await fetchWithTimeout("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    const payload = await res.json()
    if (!res.ok) throw new Error(payload?.error || "Не удалось создать проект")

    const team = payload?.team
    if (team) setTeams((prev) => [...prev, team])
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <main className="container mx-auto flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ваши проекты</h1>
            <p className="text-muted-foreground mt-1">
              Управляйте вашими проектами и работайте вместе с командой над задачами
            </p>
          </div>

          {/* Кнопка всегда справа сверху, когда проекты уже есть */}
          <Button onClick={() => setDialogOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Добавить проект
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Загрузка проектов...</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{fetchError}</p>
            <Button variant="outline" onClick={() => void fetchTeams()}>
              Попробовать снова
            </Button>
          </div>
        ) : teams.length === 0 ? (
          /* Пустое состояние — кнопка по центру */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-7xl mb-6">🎯</div>
            <h2 className="text-2xl font-semibold mb-3">У вас пока нет проектов</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Создайте свою первую доску, чтобы начать работу
            </p>
            <Button onClick={() => setDialogOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Добавить первый проект
            </Button>
          </div>
        ) : (
          /* Список проектов */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <TeamCard 
                key={team.id} 
                team={team} 
                currentUserId={user.id} 
                onUpdate={fetchTeams} 
              />
            ))}
          </div>
        )}
      </main>

      <TeamDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleCreateTeam} />
    </div>
  )
}