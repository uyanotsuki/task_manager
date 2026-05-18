"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { fetchWithTimeout } from "@/lib/fetch-with-timeout"
import { redirectToLoginPreservingReturn } from "@/lib/redirect-login"
import { cn } from "@/lib/utils"

type TeamDeleteButtonProps = {
  teamId: string
  teamName: string
  onDeleted?: () => void
  redirectToDashboard?: boolean
  className?: string
}

export function TeamDeleteButton({
  teamId,
  teamName,
  onDeleted,
  redirectToDashboard = false,
  className,
}: TeamDeleteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setError("")
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError("")
    try {
      const res = await fetchWithTimeout(`/api/teams/${teamId}`, { method: "DELETE" })
      const payload = (await res.json().catch(() => null)) as {
        success?: boolean
        error?: string
      } | null

      if (!res.ok) {
        if (res.status === 401) {
          redirectToLoginPreservingReturn()
          return
        }
        throw new Error(payload?.error || "Не удалось удалить проект")
      }

      if (!payload?.success) {
        throw new Error("Сервер вернул некорректный ответ")
      }

      setOpen(false)
      onDeleted?.()

      if (redirectToDashboard) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Не удалось удалить проект")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 text-violet-500 hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-950/50",
            className,
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label="Удалить проект"
        >
          <Trash2 className="h-3.5 w-3.5" />   {/* ← меньше размер */}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
          <AlertDialogDescription>
            Проект «{teamName}» и все связанные задачи и участники будут удалены без
            возможности восстановления.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? "Удаление..." : "Удалить проект"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}