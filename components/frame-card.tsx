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
 * Изображение через <img> с aspect-ratio, чтобы не было layout shift и не настраивать домены для next/image.
 */
export function FrameCard({ frame }: { frame: Frame }) {
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

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Область изображения: сохраняем пропорции, без сдвига верстки */}
      <CardContent className="p-0">
        <div
          className="relative w-full overflow-hidden bg-muted"
          style={{ aspectRatio }}
        >
          <img
            src={frame.mediaUrl}
            alt={frame.comment ?? `Frame by ${frame.author.name}`}
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 pt-3">
        {/* Автор: аватар по инициалам + имя */}
        <div className="flex w-full items-center gap-2">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium text-foreground">
            {frame.author.name}
          </span>
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
