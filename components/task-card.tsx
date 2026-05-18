"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BoardTask } from "./task-types"
import { IOSCard } from "@/components/ui/ios-card"

interface TaskCardProps {
  task: BoardTask
  onEdit: (task: BoardTask) => void
  onDelete: (taskId: string) => void
  /** Для DragOverlay — без sortable-хуков */
  dragOverlay?: boolean
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
} as const

export function TaskCard({
  task,
  onEdit,
  onDelete,
  dragOverlay = false,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status },
    disabled: dragOverlay,
  })

  const style = dragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      }

  const formattedDeadline = (() => {
    if (!task.deadline) return "не установлена"
    const d = new Date(task.deadline)
    if (Number.isNaN(d.getTime())) return "не установлена"
    return d.toLocaleDateString("ru-RU")
  })()

  return (
    <IOSCard
      ref={dragOverlay ? undefined : setNodeRef}
      style={style}
      className={cn(
        "p-4 transition",
        !dragOverlay && isDragging && "pointer-events-none opacity-40",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className={cn(
            "mt-1 shrink-0 cursor-grab touch-none text-muted-foreground",
            "rounded-md hover:bg-accent/50 hover:text-foreground",
            "active:cursor-grabbing",
          )}
          aria-label="Перетащить задачу"
          {...(dragOverlay ? {} : { ...attributes, ...listeners })}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold">{task.title}</h3>

          {task.description ? (
            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
              {task.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                priorityColors[task.priority as keyof typeof priorityColors] ??
                  priorityColors.medium,
              )}
            >
              {task.priority}
            </Badge>

            <span className="text-xs text-muted-foreground">
              {task.assignee
                ? `Исполнитель: ${task.assignee.user.name || task.assignee.user.email}`
                : "Исполнитель: не назначен"}
            </span>

            <span className="text-xs text-muted-foreground">
              Дата завершения: {formattedDeadline}
            </span>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg transition hover:bg-accent/50"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg transition hover:bg-red-500/10"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </IOSCard>
  )
}
