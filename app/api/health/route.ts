import { NextResponse } from "next/server"

/**
 * GET /api/health — проверка, что деплой жив.
 * Если этот URL отвечает 200, приложение задеплоено; если 404 — проблема с деплоем или Root Directory.
 */
export async function GET() {
  return NextResponse.json({ ok: true })
}
