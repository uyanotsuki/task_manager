import Link from "next/link"

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-violet-950/40" />
      <div className="absolute bottom-[-280px] left-1/2 -translate-x-1/2 w-[1600px] h-[600px] rounded-[100%] opacity-100 blur-[140px] bg-[radial-gradient(ellipse_at_center,#ffffff_0%,#BAB8EA_25%,#807CEC_55%,transparent_75%)]" />
      
      
      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between px-10 py-6">
        <nav className="flex gap-8 text-base text-white/80 ml-auto">
          <Link href="/login" className="hover:text-white transition">
            Войти
          </Link>
          <Link href="/register" className="hover:text-white transition">
            Регистрация
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <main className="relative z-10 flex flex-col justify-center px-20 pt-50 ">
        <h1 className="text-6xl md:text-8xl font-semibold tracking-tight">
          TaskForce
        </h1>

        <p className="mt-6 text-white/70 text-lg leading-relaxed">
          Забудьте о хаосе в работе. 
        </p>
        <p className="-mt-1 text-white/70 text-lg leading-relaxed">
          Создавайте проекты, ставьте задачи и добивайтесь целей в одной системе.
        </p>
      </main>

      {/* CTA LINE */}
      <div className="absolute bottom-12 left-10 right-10 z-10">
        <Link
          href="/register"
          className="group relative block pt-6 text-white/80 hover:text-white transition">
          <span className="absolute right-0 bottom-4 text-base font-medium">
            продолжить
          </span>

          <div className="h-[2px] w-full bg-white/50 relative overflow-visible">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 border-t-2 border-r-2 border-white/70 rotate-45" />
          </div>
        </Link>
      </div>
    </div>
  )
}