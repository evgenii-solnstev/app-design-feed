import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { put } from "@vercel/blob"

// CORS: запросы с Figma plugin iframe (figma.com, static.figma.com)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// GET /api/frames — возвращает список фреймов для ленты
// Используем cursor-based пагинацию: вместо ?page=2 передаём
// ID последнего загруженного фрейма, и берём следующие N после него.
// Это важно для инфинити-скролла — страницы не съезжают при новых постах.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor") // ID последнего фрейма
    const limit = 12 // количество фреймов за один запрос

    const frames = await db.frame.findMany({
      take: limit + 1, // берём на 1 больше чтобы понять есть ли ещё
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: "desc" }, // новые сверху
      include: { author: true }, // подтягиваем данные автора
    })

    // Если получили limit+1 — значит есть ещё страницы
    const hasMore = frames.length > limit
    const items = hasMore ? frames.slice(0, limit) : frames
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({ items, nextCursor }, { headers: CORS_HEADERS })
  } catch (err) {
    // Ошибка БД (нет DATABASE_URL на Vercel, Neon недоступен и т.д.)
    console.error("[GET /api/frames]", err)
    return NextResponse.json(
      { error: "Database unavailable. Set DATABASE_URL in Vercel." },
      { status: 503, headers: CORS_HEADERS }
    )
  }
}

// POST /api/frames — принимает файл и метаданные, сохраняет в БД
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Достаём файл и метаданные из запроса
    const file = formData.get("file") as File
    const authorName = formData.get("authorName") as string
    const figmaUrl = formData.get("figmaUrl") as string | null

    if (!file || !authorName) {
      return NextResponse.json(
        { error: "file and authorName are required" },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Загружаем файл в Vercel Blob
    const { url } = await put(
      `frames/${Date.now()}-${file.name}`,
      file,
      { access: "public" }
    )

    // Находим или создаём автора по имени
    // В MVP нет авторизации — просто ищем по имени
    const author = await db.author.upsert({
      where: { name: authorName },
      update: {},
      create: { name: authorName },
    })

    // Сохраняем фрейм в БД
    const frame = await db.frame.create({
      data: {
        mediaUrl: url,
        mediaType: file.type,
        figmaUrl: figmaUrl || null,
        authorId: author.id,
      },
      include: { author: true },
    })

    return NextResponse.json(frame, { status: 201, headers: CORS_HEADERS })
  } catch (err) {
    console.error("[POST /api/frames]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}