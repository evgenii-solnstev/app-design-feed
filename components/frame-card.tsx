"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import type { Frame } from "@/lib/types"

/**
 * Карточка одного фрейма в ленте.
 * Показывает: изображение, имя автора (с аватаром по инициалам), ссылку на Figma, при наличии — теги.
 * Клик по картинке вызывает onImageClick (открытие полноэкранного просмотра).
 */
export function FrameCard({
  frame,
  onImageClick,
}: {
  frame: Frame
  onImageClick?: () => void
}) {
  // Инициалы автора для AvatarFallback (первые буквы слов или первые 2 символа имени)
  const initials = frame.author.name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  // Пропорции для области изображения (из API или дефолт 16/10)
  const aspectRatio = frame.aspectRatio ?? "16/10"

  // Дата добавления: короткий формат (например «26 фев»)
  const addedDate = frame.createdAt
    ? new Date(frame.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      })
    : null

  return (
    <Card className="overflow-hidden shadow-none">
      {/* Область изображения: клик открывает полноэкранный просмотр */}
      <CardContent className="p-0">
        <div
          role={onImageClick ? "button" : undefined}
          tabIndex={onImageClick ? 0 : undefined}
          className={`relative w-full overflow-hidden bg-muted ${onImageClick ? "cursor-pointer" : ""}`}
          style={{ aspectRatio }}
          onClick={(e) => {
            e.preventDefault()
            onImageClick?.()
          }}
          onKeyDown={(e) => {
            if (onImageClick && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault()
              onImageClick()
            }
          }}
        >
          <img
            src={frame.mediaUrl}
            alt={frame.comment ?? `Frame by ${frame.author.name}`}
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 pt-3">
        {/* Автор и дата добавления */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-foreground">
              {frame.author.name}
            </span>
          </div>
          {addedDate && (
            <span className="shrink-0 text-muted-foreground text-xs">
              {addedDate}
            </span>
          )}
        </div>

        {/* Ссылка на Figma — только если есть */}
        {frame.figmaUrl ? (
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link
              href={frame.figmaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Open in Figma
            </Link>
          </Button>
        ) : null}

        {/* Теги — бейджи, если есть */}
        {frame.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {frame.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardFooter>
    </Card>
  )
}
