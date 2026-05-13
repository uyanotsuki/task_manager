import { z } from "zod"

/** Prisma-идентификаторы (cuid и др.) без жёсткого формата, чтобы не ломать существующие БД. */
const entityId = z.string().trim().min(1).max(128)

export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export const registerBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Пароль: минимум 8 символов"),
  name: z.string().trim().min(1).max(120),
})

export const tasksQuerySchema = z.object({
  teamId: entityId,
})

export const taskCreateBodySchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(10_000).nullable().optional(),
  teamId: entityId,
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["todo", "inprogress", "complete"]).optional(),
  assigneeId: z.string().trim().max(128).optional().nullable(),
  deadline: z.union([z.string(), z.null()]).optional(),
})

export const taskReorderBodySchema = z.object({
  taskId: entityId,
  newStatus: z.enum(["todo", "inprogress", "complete"]),
  newOrder: z.coerce.number().int().min(0),
})

export const teamCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
})

export const teamPatchBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.union([z.string().trim().max(5000), z.null()]).optional(),
})

export const memberIdQuerySchema = z.object({
  memberId: entityId,
})

export const teamMemberPostBodySchema = z.object({
  email: z.string().trim().email(),
  role: z.string().trim().max(64).optional(),
})

export const teamIdParamsSchema = z.object({
  id: entityId,
})

export const teamIdParamSchema = z.object({
  teamId: entityId,
})

export const taskIdParamsSchema = z.object({
  id: entityId,
})

export const taskPatchBodySchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.union([z.string().max(10_000), z.null()]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["todo", "inprogress", "complete"]).optional(),
    assigneeId: z.union([z.string().trim().max(128), z.literal("")]).optional(),
    deadline: z.union([z.string(), z.null(), z.literal("")]).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Нет полей для обновления",
  })

export const mePatchBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
})

export function parseJson<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const r = schema.safeParse(data)
  if (!r.success) {
    const form = r.error.flatten()
    const field = Object.values(form.fieldErrors).flat()[0]
    const formErr = form.formErrors[0]
    const msg =
      (typeof field === "string" ? field : null) ||
      (typeof formErr === "string" ? formErr : null) ||
      "Некорректные данные"
    return { success: false, error: msg }
  }
  return { success: true, data: r.data }
}

export function parseSearchParams<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  searchParams: URLSearchParams,
): { success: true; data: z.infer<z.ZodObject<T>> } | { success: false; error: string } {
  const obj: Record<string, string> = {}
  searchParams.forEach((v, k) => {
    obj[k] = v
  })
  const r = schema.safeParse(obj)
  if (!r.success) {
    const first = r.error.flatten().fieldErrors
    const msg = Object.values(first).flat()[0]
    return { success: false, error: typeof msg === "string" ? msg : "Некорректные параметры" }
  }
  return { success: true, data: r.data }
}
