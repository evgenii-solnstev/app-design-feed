import { FrameFeed } from "@/components/frame-feed"

/**
 * Главная страница Design Feed — лента фреймов из Figma.
 * Сетка карточек с infinite scroll (cursor-based пагинация через API).
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Шапка: заголовок и описание */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Design Feed
          </h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">
            Фреймы и скриншоты от дизайн-команды
          </p>
        </div>
      </header>

      {/* Лента: адаптивная сетка + infinite scroll */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <FrameFeed />
      </main>
    </div>
  )
}
