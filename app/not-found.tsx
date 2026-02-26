import Link from "next/link"

/**
 * Глобальная страница 404 для App Router.
 * Если видишь эту страницу по / — значит приложение работает, но корень отдаёт 404 (проверь Root Directory в Vercel).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-muted-foreground text-center">
        Страница не найдена.
      </p>
      <Link
        href="/"
        className="text-primary underline-offset-4 hover:underline"
      >
        На главную
      </Link>
    </div>
  )
}
