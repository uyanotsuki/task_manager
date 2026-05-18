"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { TaskCard } from "./task-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BoardTask } from "./task-types"

interface TaskColumnProps {
  status: string
  title: string
  tasks: BoardTask[]
  onEdit: (task: BoardTask) => void
  onDelete: (taskId: string) => void
}

export function TaskColumn({
  status,
  title,
  tasks,
  onEdit,
  onDelete,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  })

  const taskIds = tasks.map((t) => t.id)

  const statusColors = {
    todo: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    inprogress: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    complete: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  }

  return (
    <div className="flex h-full min-h-[520px] flex-col">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground/90">
          {title}
        </h2>

        <Badge
          variant="outline"
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs backdrop-blur-md",
            "bg-white/60 dark:bg-white/5",
            statusColors[status as keyof typeof statusColors],
          )}
        >
          {tasks.length}
        </Badge>
      </div>

      {/* COLUMN */}
      <Card
        ref={setNodeRef}
        className={cn(
          `
            relative flex flex-1 flex-col
            rounded-3xl

            border border-black/5
            bg-white/70
            backdrop-blur-xl

            p-4
            transition-all duration-300

            shadow-sm

            hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]

            dark:border-white/10
            dark:bg-white/5
            dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]
          `,
          isOver &&
            `
              border-violet-400/40
              bg-gradient-to-b from-violet-500/10 via-transparent to-transparent
              shadow-[0_0_45px_rgba(139,92,246,0.20)]
              scale-[1.015]
            `,
        )}
      >
        {/* subtle violet glow layer */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-violet-500/5 via-transparent to-transparent opacity-60" />

        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="relative flex min-h-full flex-1 flex-col gap-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}

            {/* EMPTY STATE / DROP AREA */}
            {tasks.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white/40 text-xs text-muted-foreground backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                Перетащите задачу сюда
              </div>
            ) : (
              <div className="min-h-[90px] flex-1 shrink-0" aria-hidden />
            )}
          </div>
        </SortableContext>
      </Card>
    </div>
  )
}