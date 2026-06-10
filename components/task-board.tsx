"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  DndContext,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { TaskColumn } from "./task-column"
import { TaskCard } from "./task-card"
import { TaskDialog } from "./task-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { fetchWithTimeout } from "@/lib/fetch-with-timeout"
import { redirectToLoginPreservingReturn } from "@/lib/redirect-login"
import type { BoardTask } from "./task-types"

type Task = BoardTask

const COLUMN_IDS = ["todo", "inprogress", "complete"] as const
type ColumnId = (typeof COLUMN_IDS)[number]

function isColumnId(id: string): id is ColumnId {
  return COLUMN_IDS.includes(id as ColumnId)
}

function sortByOrder(a: Task, b: Task) {
  return a.order - b.order
}

/** Глубокая копия массива задач для надёжного snapshot до drag. */
function cloneTasks(tasks: Task[]): Task[] {
  return tasks.map((t) => ({ ...t }))
}

function resolveColumnId(overId: string, tasks: Task[]): ColumnId | null {
  if (isColumnId(overId)) return overId
  const task = tasks.find((t) => t.id === overId)
  return task && isColumnId(task.status) ? task.status : null
}

function groupTasksByColumn(tasks: Task[]): Record<ColumnId, Task[]> {
  return {
    todo: tasks.filter((t) => t.status === "todo").sort(sortByOrder),
    inprogress: tasks.filter((t) => t.status === "inprogress").sort(sortByOrder),
    complete: tasks.filter((t) => t.status === "complete").sort(sortByOrder),
  }
}

function flattenColumns(columns: Record<ColumnId, Task[]>): Task[] {
  return COLUMN_IDS.flatMap((status) =>
    columns[status].map((task, index) => ({ ...task, status, order: index })),
  )
}

/** Пересчитывает порядок задач при drop (внутри колонки и между колонками). */
function moveTaskInKanban(tasks: Task[], activeId: string, overId: string): Task[] | null {
  const activeTask = tasks.find((t) => t.id === activeId)
  if (!activeTask) return null

  const overColumnId = resolveColumnId(overId, tasks)
  if (!overColumnId) return null

  const columns = groupTasksByColumn(tasks)
  const sourceStatus = activeTask.status as ColumnId

  if (sourceStatus === overColumnId) {
    const columnTasks = columns[overColumnId]
    const activeIndex = columnTasks.findIndex((t) => t.id === activeId)
    if (activeIndex === -1) return null

    let overIndex = columnTasks.length - 1
    if (!isColumnId(overId)) {
      const idx = columnTasks.findIndex((t) => t.id === overId)
      if (idx !== -1) overIndex = idx
    }

    if (activeIndex === overIndex) return null
    columns[overColumnId] = arrayMove(columnTasks, activeIndex, overIndex)
  } else {
    const sourceItems = columns[sourceStatus].filter((t) => t.id !== activeId)
    const targetItems = columns[overColumnId].filter((t) => t.id !== activeId)

    let overIndex = targetItems.length
    if (!isColumnId(overId)) {
      const idx = columns[overColumnId].findIndex((t) => t.id === overId)
      if (idx !== -1) overIndex = idx
    }

    const movingTask: Task = { ...activeTask, status: overColumnId }
    const nextTarget = [...targetItems]
    nextTarget.splice(overIndex, 0, movingTask)

    columns[sourceStatus] = sourceItems
    columns[overColumnId] = nextTarget
  }

  return flattenColumns(columns)
}

interface TaskBoardProps {
  teamId: string
  teamMembers: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

export function TaskBoard({ teamId, teamMembers }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ИСПРАВЛЕНИЕ: синхронный ref вместо side-effect внутри setState (React 19 не гарантирует синхронность)
  const tasksRef = useRef<Task[]>([])
  const tasksBeforeDragRef = useRef<Task[] | null>(null)
  const reorderLockRef = useRef(false)

  /** Обновляет и React-state, и синхронный ref одновременно. */
  const commitTasks = useCallback((next: Task[]) => {
    tasksRef.current = next
    setTasks(next)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setFetchError(null)

      try {
        const res = await fetchWithTimeout(`/api/tasks?teamId=${teamId}`, {
          method: "GET",
        })

        const data = await res.json().catch(() => null)

        if (cancelled) return

        if (!res.ok) {
          if (res.status === 401) {
            redirectToLoginPreservingReturn()
            return
          }

          const msg =
            data && typeof (data as { error?: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Не удалось загрузить задачи"

          setFetchError(msg)
          commitTasks([])
          return
        }

        const loaded = Array.isArray((data as { tasks?: unknown })?.tasks)
          ? (data as { tasks: Task[] }).tasks
          : []

        commitTasks(loaded)
      } catch (error: unknown) {
        const name =
          typeof error === "object" && error && "name" in error
            ? (error as Error).name
            : ""

        const message =
          name === "AbortError"
            ? "Сервер не ответил за отведённое время. Проверьте БД или перезапустите dev-сервер."
            : error instanceof Error
              ? error.message
              : "Не удалось загрузить задачи"

        if (!cancelled) {
          setFetchError(message)
          commitTasks([])
          console.error("[v0] Fetch tasks error:", error)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [teamId, commitTasks])

  const fetchTasks = useCallback(async () => {
    setFetchError(null)

    try {
      const res = await fetchWithTimeout(`/api/tasks?teamId=${teamId}`, {
        method: "GET",
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 401) {
          redirectToLoginPreservingReturn()
          return
        }

        const msg =
          data && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Не удалось обновить задачи"

        setFetchError(msg)
        return
      }

      const loaded = Array.isArray((data as { tasks?: unknown })?.tasks)
        ? (data as { tasks: Task[] }).tasks
        : []

      commitTasks(loaded)
    } catch (error: unknown) {
      const name =
        typeof error === "object" && error && "name" in error
          ? (error as Error).name
          : ""

      setFetchError(
        name === "AbortError"
          ? "Таймаут при обновлении списка задач."
          : error instanceof Error
            ? error.message
            : "Не удалось обновить задачи",
      )

      console.error("[v0] Fetch tasks refresh error:", error)
    }
  }, [teamId, commitTasks])

  const todoTasks = useMemo(
    () => tasks.filter((t) => t.status === "todo").sort(sortByOrder),
    [tasks],
  )
  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === "inprogress").sort(sortByOrder),
    [tasks],
  )
  const completeTasks = useMemo(
    () => tasks.filter((t) => t.status === "complete").sort(sortByOrder),
    [tasks],
  )

  const handleDragStart = (event: DragStartEvent) => {
    // ИСПРАВЛЕНИЕ: глубокая копия из tasksRef, а не ссылка на массив из замыкания
    tasksBeforeDragRef.current = cloneTasks(tasksRef.current)
    const task = tasksRef.current.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveTask(null)
    if (tasksBeforeDragRef.current) {
      commitTasks(tasksBeforeDragRef.current)
      tasksBeforeDragRef.current = null
    }
  }

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = String(active.id)
      const overId = String(over.id)
      if (activeId === overId) return

      const current = tasksRef.current
      const activeTaskItem = current.find((t) => t.id === activeId)
      if (!activeTaskItem) return

      const overColumnId = resolveColumnId(overId, current)
      if (!overColumnId) return

      // Внутри колонки — финальная позиция на dragEnd; между колонками — live preview
      if (activeTaskItem.status === overColumnId) return

      const next = moveTaskInKanban(current, activeId, overId)
      if (next) commitTasks(next)
    },
    [commitTasks],
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    const dragStartSnapshot = tasksBeforeDragRef.current ?? cloneTasks(tasksRef.current)
    tasksBeforeDragRef.current = null

    if (!over) {
      commitTasks(dragStartSnapshot)
      return
    }

    if (reorderLockRef.current) {
      commitTasks(dragStartSnapshot)
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    // ИСПРАВЛЕНИЕ: вычисляем финальное состояние синхронно из tasksRef, без side-effect setState
    const finalTasks = moveTaskInKanban(tasksRef.current, activeId, overId) ?? tasksRef.current
    commitTasks(finalTasks)

    const moved = finalTasks.find((t) => t.id === activeId)
    const original = dragStartSnapshot.find((t) => t.id === activeId)

    if (!moved || !original) return

    // Сравниваем с snapshot ДО drag (не с prev из handleDragOver)
    if (moved.status === original.status && moved.order === original.order) return

    const reorderPayload = {
      taskId: activeId,
      newStatus: moved.status,
      newOrder: moved.order,
    }

    reorderLockRef.current = true

    try {
      const res = await fetchWithTimeout("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reorderPayload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const msg =
          data && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Не удалось сохранить порядок задачи"
        throw new Error(msg)
      }

      // ИСПРАВЛЕНИЕ: синхронизация с сервером после успешного сохранения
      await fetchTasks()
    } catch (error) {
      console.error("[v0] Reorder task error:", error)
      commitTasks(dragStartSnapshot)
      await fetchTasks()
    } finally {
      reorderLockRef.current = false
    }
  }

  const handleCreateTask = () => {
    setEditingTask(null)
    setDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setDialogOpen(true)
  }

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskId(taskId)
  }

  const confirmDeleteTask = async () => {
    if (!deleteTaskId) return

    setDeleteLoading(true)
    try {
      await fetchWithTimeout(`/api/tasks/${deleteTaskId}`, {
        method: "DELETE",
      })

      commitTasks(tasksRef.current.filter((t) => t.id !== deleteTaskId))
      setDeleteTaskId(null)
    } catch (error) {
      console.error("[v0] Delete task error:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSaveTask = async (data: Partial<Task>) => {
    try {
      if (editingTask) {
        const res = await fetchWithTimeout(`/api/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
  
        const payload = await res.json()
  
        if (!res.ok) {
          throw new Error(payload?.error || "Не удалось обновить задачу")
        }
  
        const task = payload?.task
  
        if (!task) {
          throw new Error("Сервер вернул некорректный ответ при обновлении задачи")
        }
  
        // Обновляем задачу в локальном состоянии
        commitTasks(tasksRef.current.map((t) => (t.id === task.id ? task : t)))
        
      } else {
        const res = await fetchWithTimeout("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, teamId }),
        })
  
        const payload = await res.json()
  
        if (!res.ok) {
          throw new Error(payload?.error || "Не удалось создать задачу")
        }
  
        const task = payload?.task
  
        if (!task) {
          throw new Error("Сервер вернул некорректный ответ при создании задачи")
        }
  
        commitTasks([...tasksRef.current, task])
      }
    } catch (error) {
      console.error("[v0] Save task error:", error)
      throw error  
    }
  }
  // const handleSaveTask = async (data: Partial<Task>) => {
  //   if (editingTask) {
  //     const res = await fetchWithTimeout(`/api/tasks/${editingTask.id}`, {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(data),
  //     })

  //     const payload = await res.json()

  //     if (!res.ok) {
  //       throw new Error(payload?.error || "Не удалось обновить задачу")
  //     }

  //     const task = payload?.task

  //     if (!task) {
  //       throw new Error("Сервер вернул некорректный ответ при обновлении задачи")
  //     }

  //     commitTasks(tasksRef.current.map((t) => (t.id === task.id ? task : t)))
  //     await fetchTasks()
  //   } else {
  //     const res = await fetchWithTimeout("/api/tasks", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ ...data, teamId }),
  //     })

  //     const payload = await res.json()

  //     if (!res.ok) {
  //       throw new Error(payload?.error || "Не удалось создать задачу")
  //     }

  //     const task = payload?.task

  //     if (!task) {
  //       throw new Error("Сервер вернул некорректный ответ при создании задачи")
  //     }

  //     commitTasks([...tasksRef.current, task])
  //     await fetchTasks()
  //   }
  // }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        Загрузка задач...
      </div>
    )
  }

  return (
    <>
      <div className="-mt-2 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Доска задач</h1>
          <p className="mt-1 text-sm text-muted-foreground/80">
            Управляйте задачами команды и отслеживайте прогресс
          </p>
        </div>

        <Button
          onClick={handleCreateTask}
          className="
            rounded-xl
            border border-violet-500/10
            bg-white/40
            text-foreground
            backdrop-blur-md
            transition-all duration-300
            hover:scale-[1.02]
            hover:bg-white/60
            hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]
            active:scale-[0.98]
            dark:border-white/10
            dark:bg-white/5
            dark:hover:bg-white/10
          "
        >
          <Plus className="mr-2 h-4 w-4" />
          Новая задача
        </Button>
      </div>

      {fetchError ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          <span>{fetchError}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchTasks()}
            className="rounded-xl"
          >
            Повторить
          </Button>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid min-h-[calc(100vh-14rem)] grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          <TaskColumn
            status="todo"
            title="To Do"
            tasks={todoTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />

          <TaskColumn
            status="inprogress"
            title="In Progress"
            tasks={inProgressTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />

          <TaskColumn
            status="complete"
            title="Complete"
            tasks={completeTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-1 cursor-grabbing opacity-95 shadow-lg">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                dragOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
        teamMembers={teamMembers.map((m) => ({
          teamMemberId: m.id,  
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
        }))}
      />

      {deleteTaskId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Удалить задачу?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Вы действительно хотите удалить эту задачу? Это действие нельзя отменить.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTaskId(null)}
                disabled={deleteLoading}
                className="rounded-xl"
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void confirmDeleteTask()}
                disabled={deleteLoading}
                className="rounded-xl"
              >
                {deleteLoading ? "Удаление..." : "Удалить"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
