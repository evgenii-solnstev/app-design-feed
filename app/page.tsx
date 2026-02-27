"use client"

import { useState, useEffect } from "react"
import { FrameFeed } from "@/components/frame-feed"
import { LayoutGrid, List } from "lucide-react"
import { ArrowUp } from "lucide-react"

export type ViewMode = "grid" | "strip"

/**
 * Главная страница Design Feed.
 * Один общий скролл: header и контент скроллятся вместе.
 * Переключатель Сетка/Лента — справа на уровне заголовка.
 */
export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const check = () => setShowScrollTop(typeof window !== "undefined" && window.scrollY > window.innerHeight)
    check()
    window.addEventListener("scroll", check, { passive: true })
    return () => window.removeEventListener("scroll", check)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Шапка: отступ сверху 64px, снизу 40px, без border. Переключатель по центру вертикали */}
      <header className="bg-[#F5F5F5] pt-16 pb-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-foreground">
              Design Feed
            </h1>
            <p className="mt-1 text-muted-foreground text-sm sm:text-base">
              Фреймы и скриншоты от дизайн-команды
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="size-4" aria-hidden />
              Сетка
            </button>
            <button
              type="button"
              onClick={() => setViewMode("strip")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "strip"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={viewMode === "strip"}
            >
              <List className="size-4" aria-hidden />
              Лента
            </button>
          </div>
        </div>
      </header>

      {/* Контент: один общий скролл с header */}
      <main className="mx-auto max-w-6xl px-4 pb-6 pt-0 sm:px-6 lg:px-8">
        <FrameFeed viewMode={viewMode} />
      </main>

      {/* Кнопка «вверх»: при скролле больше 1 viewport, слева внизу 32px от края */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 left-8 z-40 flex size-10 items-center justify-center rounded-full bg-black/20 text-white/90 backdrop-blur-sm transition-opacity hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          style={{ left: "32px" }}
          aria-label="Прокрутить вверх"
        >
          <ArrowUp className="size-5" />
        </button>
      )}
    </div>
  )
}
