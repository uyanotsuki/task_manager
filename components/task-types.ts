/** Общая форма задачи для доски, карточки и диалога (совпадает с ответом API). */
export interface BoardTask {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  order: number
  deadline?: string | null
  assigneeId?: string | null
  assignee?: {
    id: string
    user: {
      id: string
      name: string
      email: string
    }
  } | null
  user: {
    id: string
    name: string
    email: string
  }
}
