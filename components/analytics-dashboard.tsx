"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react"
import { fetchWithTimeout } from "@/lib/fetch-with-timeout"
import { redirectToLoginPreservingReturn } from "@/lib/redirect-login"

interface AnalyticsData {
  overview: {
    total: number
    todo: number
    inProgress: number
    complete: number
  }
  priority: {
    high: number
    medium: number
    low: number
  }
  tasksByUser: Array<{
    name: string
    total: number
    completed: number
  }>
  tasksCreated: Array<{
    date: string
    count: number
  }>
  tasksCompleted: Array<{
    date: string
    completed: number
  }>
}

interface AnalyticsDashboardProps {
  teamId: string
}

export function AnalyticsDashboard({ teamId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setFetchError(null)
      try {
        const res = await fetchWithTimeout(`/api/analytics/${teamId}`, { method: "GET" })
        const payload = await res.json().catch(() => null)
        if (cancelled) return
        if (!res.ok) {
          if (res.status === 401) {
            redirectToLoginPreservingReturn()
            return
          }
          const apiMsg =
            payload && typeof (payload as { error?: unknown }).error === "string"
              ? (payload as { error: string }).error
              : "Не удалось загрузить аналитику"
          setData(null)
          setFetchError(apiMsg)
          return
        }
        setData(payload as AnalyticsData)
      } catch (error: unknown) {
        const name = typeof error === "object" && error && "name" in error ? (error as Error).name : ""
        if (!cancelled) {
          setData(null)
          setFetchError(
            name === "AbortError"
              ? "Таймаут загрузки аналитики. Проверьте доступность базы данных."
              : error instanceof Error
                ? error.message
                : "Не удалось загрузить аналитику",
          )
          console.error("[v0] Fetch analytics error:", error)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [teamId, reloadTick])

  if (loading) {
    return <div className="flex items-center justify-center h-96">Загрузка аналитики...</div>
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[16rem] text-center px-4">
        <p className="text-sm text-muted-foreground">{fetchError ?? "Данные недоступны"}</p>
        <button
          type="button"
          className="text-sm underline underline-offset-4 text-primary"
          onClick={() => setReloadTick((k) => k + 1)}
        >
          Повторить
        </button>
      </div>
    )
  }

  const completionRate = data.overview.total > 0 ? Math.round((data.overview.complete / data.overview.total) * 100) : 0

  const statusData = [
    { name: "To Do", value: data.overview.todo, color: "#b1e7fc" },
    { name: "In Progress", value: data.overview.inProgress, color: "#faaad3" },
    { name: "Complete", value: data.overview.complete, color: "#fffba6" },
  ]

  const priorityData = [
    { name: "High", value: data.priority.high, fill: "#cd9dfa" },
    { name: "Medium", value: data.priority.medium, fill: "#f1ffbf" },
    { name: "Low", value: data.priority.low, fill: "#c3ff9e" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.total}</div>
            <p className="text-xs text-muted-foreground">По всем статусам</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В процессе</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.inProgress}</div>
            <p className="text-xs text-muted-foreground">Задач сейчас в работе</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполнено</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.complete}</div>
            <p className="text-xs text-muted-foreground">Успешно завершено</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Статус завершения</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Всех задач</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Статистика по задачам</CardTitle>
            <CardDescription>Статистика задач по текущему статусу</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                todo: { label: "To Do", color: "#b1e7fc" },      // голубой
                inprogress: { label: "In Progress", color: "#faaad3" }, // розовый
                complete: { label: "Complete", color: "#fffba6" },      // желтый
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Статистика приоритета</CardTitle>
            <CardDescription>Группировка задач по приоритету</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                high: { label: "High", color: "hsl(var(--chart-1))" },
                medium: { label: "Medium", color: "hsl(var(--chart-4))" },
                low: { label: "Low", color: "hsl(var(--chart-2))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card> */}

<Card>
  <CardHeader>
    <CardTitle>Статистика приоритета</CardTitle>
    <CardDescription>Группировка задач по приоритету</CardDescription>
  </CardHeader>
  <CardContent>
    <ChartContainer
      config={{
        high: { label: "High", color: "#cd9dfa" },
        medium: { label: "Medium", color: "#98b8d9" },
        low: { label: "Low", color: "#c3ff9e" },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={priorityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="#cd9dfa" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  </CardContent>
</Card>

        <Card>
          <CardHeader>
            <CardTitle>Добавлено задач за последние 7 дней</CardTitle>
            <CardDescription>Тенденция создания задач по дням</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Добавлено задач",
                  color: "hsl(270 70% 55%)"
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.tasksCreated}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--color-count)" }}
                    activeDot={{ r: 6, fill: "var(--color-count)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Выполнено задач за последние 7 дней</CardTitle>
            <CardDescription>Тенденция выполнения задач по дням</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: {
                  label: "Выполнено задач",
                  color: "hsl(270 70% 55%)",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.tasksCompleted}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="var(--color-completed)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--color-completed)" }}
                    activeDot={{ r: 6, fill: "var(--color-completed)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Эффективность работы членов команды</CardTitle>
          <CardDescription>Сравнение общего количества и выполненных задач по каждому участнику</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              total: { label: "Всего задач", color: "oklch(0.627 0.265 303.9)" },
              completed: { label: "Completed", color: "oklch(0.696 0.17 162.48)" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tasksByUser}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="total" fill="#b7a6f7" />
                <Bar dataKey="completed" fill="#a9fa7d" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
