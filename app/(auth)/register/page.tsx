"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка регистрации")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Произошла ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(128,124,236,0.18),transparent_75%)]" />

      {/* GLOW */}
      <div className="absolute bottom-[-180px] left-1/2 -translate-x-1/2 w-[1700px] h-[500px]">
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.95)_0%,rgba(186,184,234,0.85)_20%,rgba(128,124,236,0.8)_45%,transparent_75%)]
            blur-[120px]
            opacity-100
            rounded-[100%]
            scale-y-[0.38]
          "
        />
      </div>


      {/* CONTENT */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        {/* <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl"> */}
        <div
          className="
            relative
            w-full
            max-w-md
            rounded-[32px]
            border border-white/10
            bg-white/[0.06]
            backdrop-blur-2xl
            p-8
            shadow-[0_0_60px_rgba(128,124,236,0.12)]
            transition-all duration-300
            hover:border-[#807CEC]/40
            hover:shadow-[0_0_30px_rgba(128,124,236,0.45)]
          "
        >
          {/* LOGO */}
          <div className="mb-8">
            <p className="text-sm text-white/40 tracking-wide">
              TaskForce
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Регистрация
            </h1>

            <p className="mt-2 text-sm text-white/50 leading-relaxed">
              Заполните информацию, чтобы добавить учетную запись
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/60">
                Имя
              </label>

              <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/25 outline-none transition focus:border-[#807CEC] focus:bg-white/[0.07]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Электронная почта
              </label>

              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/25 outline-none transition focus:border-[#807CEC] focus:bg-white/[0.07]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Пароль
              </label>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/25 outline-none transition focus:border-[#807CEC] focus:bg-white/[0.07]"
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="
                mt-3
                h-12
                w-full
                rounded-2xl
                bg-[#807CEC]
                text-sm
                font-medium
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
              {loading ? "Создание аккаунта..." : "Продолжить"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-6 text-center text-sm text-white/80">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="text-white/80 transition hover:text-[#BAB8EA]"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}