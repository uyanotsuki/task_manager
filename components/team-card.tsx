"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, CheckSquare, Settings } from "lucide-react"
import { TeamDeleteButton } from "@/components/team-delete-button"

interface Team {
  id: string
  name: string
  description: string | null
  creator: {
    id: string
    name: string
  }
  _count: {
    tasks: number
    members: number
  }
}

interface TeamCardProps {
  team: Team
  currentUserId: string
  onUpdate: () => void
}

export function TeamCard({ team, currentUserId, onUpdate }: TeamCardProps) {
  const router = useRouter()
  const isCreator = team.creator.id === currentUserId

  const openTeam = () => router.push(`/teams/${team.id}`)

  return (
    <Card
      className="
        relative cursor-pointer
        rounded-3xl

        /* LIGHT MODE */
        bg-white/80
        border border-black/5
        shadow-sm

        /* GLASS */
        backdrop-blur-xl

        /* ANIMATION */
        transition-all duration-300

        /* HOVER */
        hover:-translate-y-1
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]
        hover:border-violet-500/20

        /* DARK MODE */
        dark:bg-white/5
        dark:border-white/10
        dark:hover:bg-white/10
      "
      onClick={openTeam}
    >
      {isCreator ? (
        <div className="absolute top-3 right-3 z-10">
          <TeamDeleteButton teamId={team.id} teamName={team.name} onDeleted={onUpdate} />
        </div>
      ) : null}

      <CardHeader className={isCreator ? "pr-12" : undefined}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="mb-1 text-xl font-semibold tracking-tight">
              {team.name}
            </CardTitle>

            <CardDescription className="line-clamp-2 text-muted-foreground/80">
              {team.description || "Описание отсутствует"}
            </CardDescription>
          </div>

          {isCreator ? (
            <Badge
              variant="secondary"
              className="
                shrink-0
                bg-violet-500/10
                text-violet-600
                border border-violet-500/20
                backdrop-blur-md
                rounded-full
              "
            >
              Owner
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-violet-500" />
            <span>{team._count.members} участников</span>
          </div>

          <div className="flex items-center gap-1">
            <CheckSquare className="h-4 w-4 text-blue-500" />
            <span>{team._count.tasks} задач</span>
          </div>
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation()
            openTeam()
          }}
          className="
            group
            mt-4 w-full
            relative overflow-hidden
            rounded-xl

            border border-white/10
            bg-white/40
            text-foreground
            backdrop-blur-md

            transition-all duration-300

            hover:bg-white/60
            hover:scale-[1.02]
            hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]

            dark:bg-white/5
            dark:hover:bg-white/10
            dark:border-white/10

            active:scale-[0.98]
          "
        >
          <Settings className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-6" />
          Открыть проект
        </Button>
      </CardContent>
    </Card>
  )
}