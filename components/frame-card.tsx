"use client"

import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import type { Frame } from "@/lib/types"

/**
 * Блок одного фрейма в ленте (сетка).
 * Картинка в контейнере с radius 12px, внизу отступ 20px — имя и дата, затем ссылка на Figma и теги.
 */
export function FrameCard({
  frame,
  onImageClick,
}: {
  frame: Frame
  onImageClick?: () => void
}) {
  const initials = frame.author.name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  const aspectRatio = frame.aspectRatio ?? "16/10"

  const addedDate = frame.createdAt
    ? new Date(frame.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      })
    : null

  return (
    <div className="flex flex-col">
      {/* Картинка: контейнер с radius 12px */}
      <div
        role={onImageClick ? "button" : undefined}
        tabIndex={onImageClick ? 0 : undefined}
        className={`relative w-full overflow-hidden rounded-xl bg-muted ${onImageClick ? "cursor-pointer" : ""}`}
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
          className="h-full w-full object-cover object-left-top"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>

      {/* Имя и дата — отступ 16px от контейнера с картинкой */}
      <div className="mt-4 flex flex-col items-start gap-3">
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

        {frame.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {frame.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
