"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, KeyRound, Mail, Shield, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

type SettingsUser = {
  id: string
  email: string
  name: string
}

export function SettingsPageClient({ user }: { user: SettingsUser }) {
  const [email, setEmail] = useState(user.email)
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [info, setInfo] = useState<string>("")
  const [error, setError] = useState<string>("")

  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const passwordValidation = useMemo(() => {
    const errors = []
    if (newPassword.length > 0 && newPassword.length < 8) errors.push("Пароль должен содержать минимум 8 символов")
    if (newPassword.length > 0 && !/[A-Z]/.test(newPassword)) errors.push("Пароль должен содержать хотя бы одна заглавную букву")
    if (newPassword.length > 0 && !/[a-z]/.test(newPassword)) errors.push("Пароль должен содержать хотя бы одну строчную букву")
    if (newPassword.length > 0 && !/[0-9]/.test(newPassword)) errors.push("Пароль должен содержать хотя бы одну цифру")
    if (newPassword.length > 0 && !/[!@#$%^&*]/.test(newPassword)) errors.push("Пароль должен содержать хотя бы один спецсимвол (!@#$%^&*)")
    return errors
  }, [newPassword])

  const isPasswordValid = newPassword.length >= 8 && 
    /[A-Z]/.test(newPassword) && 
    /[a-z]/.test(newPassword) && 
    /[0-9]/.test(newPassword) && 
    /[!@#$%^&*]/.test(newPassword)

  const hint = useMemo(() => {
    if (!requested) return ""
    return "Мок-режим: код для смены пароля — 55555."
  }, [requested])

  const requestReset = async () => {
    setError("")
    setInfo("")
    setRequesting(true)
    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || "Не удалось отправить код")
      }
      setRequested(true)
      // setInfo(payload?.message || "Код отправлен (мок).")
    } catch (e: any) {
      setError(e?.message || "Не удалось отправить код")
    } finally {
      setRequesting(false)
    }
  }

  const confirmReset = async () => {
    setError("")
    setInfo("")
    setSaving(true)
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, newPassword }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || "Не удалось сменить пароль")
      }
      setInfo("Пароль изменён.")
      setCode("")
      setNewPassword("")
      setRequested(false)
    } catch (e: any) {
      setError(e?.message || "Не удалось сменить пароль")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      
      {/* Фоновый градиент как на дашборде */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(128,124,236,0.18),transparent_75%)]" /> */}
      
      {/* <div className="absolute bottom-[-180px] left-1/2 -translate-x-1/2 w-[1700px] h-[500px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.95)_0%,rgba(186,184,234,0.85)_20%,rgba(128,124,236,0.8)_45%,transparent_75%)] blur-[120px] opacity-100 rounded-[100%] scale-y-[0.38]" />
      </div> */}

      {/* <div className="absolute top-[-120px] right-[-100px] h-[320px] w-[320px] rounded-full bg-[#807CEC]/20 blur-[120px]" />
      <div className="absolute bottom-[80px] left-[-120px] h-[280px] w-[280px] rounded-full bg-[#BAB8EA]/10 blur-[120px]" /> */}

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/70 backdrop-blur-xl dark:bg-black/20 dark:border-white/10">
        <div className="flex h-12 shrink-0 items-center gap-2 px-4">
          <div className="container flex flex-1 items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-xl transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="relative z-10 rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-[0_0_60px_rgba(128,124,236,0.12)] transition-all duration-300 hover:border-[#807CEC]/40 hover:shadow-[0_0_30px_rgba(128,124,236,0.45)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-500/20 p-2.5">
                  <KeyRound className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-semibold tracking-tight light:text-black dark:text-white">Смена пароля</CardTitle>
                  <p className="text-sm light:text-black dark:text-white/45 mt-1">Вы можете изменить пароль для вашего аккаунта</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="light:text-black dark:text-white/70 text-base font-medium">Почта аккаунта</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 light:text-black dark:text-white/40" />
                  <Input 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-2xl border-violet-500 bg-white/15 px-4 pl-10 text-black dark:text-white placeholder:text-black dark:placeholder:text-white/25 outline-none transition focus:border-[#807CEC] focus:bg-white/[0.07]"
                  />
                </div>
                <p className="text-xs light:text-black dark:text-white/40 pt-1">
                  В текущей реализации отправка письма на почту реализована через мок-заглушку.
                </p>
              </div>

              <Button
                onClick={requestReset}
                disabled={requesting || !email}
                className="
                  h-12 w-full rounded-2xl
                  bg-[#807CEC]
                  text-white
                  transition-all duration-300
                  hover:scale-[1.01]
                  hover:bg-[#918df5]
                  hover:shadow-[0_0_35px_rgba(128,124,236,0.55)]
                  active:scale-[0.99]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {requesting ? "Отправляем..." : "Отправить код на почту"}
              </Button>

              {requested && (
                <div className="rounded-2xl border border-violet-500/20 bg-white/[0.06] p-5 space-y-4 backdrop-blur-sm">
                  {hint && (
                    <div>
                      <p className="text-base text-violet-500 font-medium">{hint}</p>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="code" className="light:text-black dark:text-white text-sm font-medium">Код подтверждения</Label>
                    <Input 
                      id="code" 
                      value={code} 
                      onChange={(e) => setCode(e.target.value)} 
                      placeholder="Введите код 55555"
                      className="h-12 w-full rounded-2xl border border-violet-500 bg-white/15 px-4 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none transition focus:border-[#807CEC] focus:bg-white/[0.07]"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword" className="light:text-black dark:text-white/70 text-sm font-medium">Новый пароль</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Введите новый пароль"
                      className="h-12 w-full rounded-2xl border border-violet-500 bg-white/15 px-4 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none transition focus:border-[#807CEC] focus:bg-white/[0.07]"
                    />
                    {newPassword && !isPasswordValid && (
                      <div className="space-y-1 mt-2">
                        <p className="text-xs light:text-black dark:text-white/50">Требования к паролю:</p>
                        {passwordValidation.map((err, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs light:text-black dark:text-red-400">
                            <XCircle className="h-3 w-3" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {newPassword && isPasswordValid && (
                      <div className="flex items-center gap-2 mt-2 text-xs light:text-black dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        <span>Пароль соответствует требованиям</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={confirmReset} 
                      disabled={saving || !code || !isPasswordValid}
                      className="
                        flex-1 h-12 rounded-2xl
                        bg-[#807CEC]
                        text-white
                        transition-all duration-300
                        hover:scale-[1.01]
                        hover:bg-[#918df5]
                        hover:shadow-[0_0_35px_rgba(128,124,236,0.55)]
                        active:scale-[0.99]
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      {saving ? "Сохраняем..." : "Сменить пароль"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRequested(false)
                        setCode("")
                        setNewPassword("")
                        setInfo("")
                        setError("")
                      }}
                      disabled={saving}
                      className="
                        flex-1 h-12 rounded-2xl
                        border border-white/10
                        bg-white/5
                        light:text-black dark:text-white/70
                        transition-all duration-300
                        hover:bg-white/10
                        hover:scale-[1.01]
                        active:scale-[0.99]
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
                  {error}
                </div>
              )}
              
              {info && (
                <div className="rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-200 backdrop-blur-sm">
                  {info}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}