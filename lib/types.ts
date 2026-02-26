/**
 * Типы для Design Feed — соответствуют данным из Prisma и ответам API.
 * Используются на главной странице и в компонентах ленты.
 */

/** Автор фрейма (из БД, приходит в include author) */
export interface Author {
  id: string
  name: string
  createdAt: string
}

/** Один фрейм с подтянутым автором (ответ GET /api/frames) */
export interface Frame {
  id: string
  mediaUrl: string
  mediaType: string
  aspectRatio: string | null
  width: number | null
  height: number | null
  figmaUrl: string | null
  authorId: string
  author: Author
  tags: string[]
  comment: string | null
  createdAt: string
}

/** Ответ GET /api/frames — cursor-based пагинация */
export interface FramesResponse {
  items: Frame[]
  nextCursor: string | null
}
