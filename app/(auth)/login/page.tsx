"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSafeReturnToFromCurrentUrl } from "@/lib/redirect-login"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка входа")
        return
      }

      router.push(getSafeReturnToFromCurrentUrl())
      router.refresh()
    } catch (err) {
      setError("Произошла ошибка. Попробуйте снова.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4">
      
      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(128,124,236,0.18),transparent_65%)]" />

      {/* glow strip */}
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

      {/* floating blur */}
      <div className="absolute top-[-120px] right-[-100px] h-[320px] w-[320px] rounded-full bg-[#807CEC]/20 blur-[120px]" />
      <div className="absolute bottom-[80px] left-[-120px] h-[280px] w-[280px] rounded-full bg-[#BAB8EA]/10 blur-[120px]" />

      {/* card */}
      <div
        className="
          relative z-10
          w-full max-w-md
          rounded-[32px]
          border border-white/10
          bg-white/[0.06]
          backdrop-blur-2xl
          shadow-[0_0_60px_rgba(128,124,236,0.12)]
          transition-all duration-300
          hover:border-[#807CEC]/40
          hover:shadow-[0_0_30px_rgba(128,124,236,0.45)]
        "
      >
        <div className="p-8 sm:p-10"> 
        <div className="mb-8">
          {/* TaskForce справа */}
          <div className="flex justify-start">
            <span className="text-sm text-white/40 tracking-wide">
              TaskForce
            </span>
          </div>

          {/* заголовок */}
          <h1 className="mt-4 text-left text-3xl font-semibold tracking-tight text-white">
            Добро пожаловать
          </h1>

          {/* описание слева */}
          <p className="mt-2 text-left text-sm leading-relaxed text-white/45">
            Введите данные вашего аккаунта, чтобы войти в систему
          </p>
        </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-white/70"
              >
                Электронная почта
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/25 outline-none transition focus:border-[#807CEC] focus:bg-white/[0.07]"
                // className="
                //   h-12 w-full rounded-2xl
                //   border border-white/10
                //   bg-white/[0.04]
                //   px-4
                //   text-white
                //   outline-none
                //   transition-all
                //   placeholder:text-white/25
                //   focus:border-[#807CEC]
                //   focus:bg-white/[0.06]
                //   focus:shadow-[0_0_25px_rgba(128,124,236,0.25)]
                // "
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-white/70"
              >
                Пароль
              </label>

              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/25 outline-none transition focus:border-[#807CEC] focus:bg-white/[0.07]"
                // className="
                //   h-12 w-full rounded-2xl
                //   border border-white/10
                //   bg-white/[0.04]
                //   px-4
                //   text-white
                //   outline-none
                //   transition-all
                //   placeholder:text-white/25
                //   focus:border-[#807CEC]
                //   focus:bg-white/[0.06]
                //   focus:shadow-[0_0_25px_rgba(128,124,236,0.25)]
                // "
              />
            </div>

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
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/80">
            Ещё нет аккаунта?{" "}
            <Link
              href="/register"
              className="text-white/80 transition hover:text-[#BAB8EA]"
            >
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}