/** Синхронизация данных пользователя между профилем и сайдбаром */
export type UserUpdatedPayload = {
  id?: string
  name: string
  email?: string
  avatarUrl?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export function notifyUserUpdated(user: UserUpdatedPayload) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("qm-user-updated", { detail: user }))
}
