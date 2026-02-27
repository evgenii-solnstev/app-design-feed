"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { FrameCard } from "@/components/frame-card"
import { FrameLightbox } from "@/components/frame-lightbox"
import type { Frame, FramesResponse } from "@/lib/types"
import type { ViewMode } from "@/app/page"

/** Один слайд в режиме «Лента»: изображение + имя, дата, ссылка на файл (без fade). */
function StripSlide({
  frame,
  onImageClick,
  cardRef,
}: {
  frame: Frame
  onImageClick: () => void
  cardRef: (el: HTMLDivElement | null) => void
}) {
  const addedDate = frame.createdAt
    ? new Date(frame.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      })
    : null
  const aspectRatio = frame.aspectRatio ?? "16/10"
  return (
    <div
      ref={cardRef}
      className="flex min-h-[80vh] flex-col gap-3 py-6 sm:min-h-[90vh] sm:flex-row sm:items-center sm:gap-6"
    >
      <div
        role="button"
        tabIndex={0}
        className="relative w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-2/3"
        style={{ aspectRatio }}
        onClick={onImageClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
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
      <div className="flex min-w-0 flex-col gap-2 sm:w-1/3">
        <p className="font-medium text-foreground">{frame.author.name}</p>
        {addedDate && (
          <p className="text-muted-foreground text-sm">{addedDate}</p>
        )}
        {frame.figmaUrl ? (
          <Link
            href={frame.figmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open in Figma
          </Link>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Лента фреймов с infinite scroll. Режимы: grid (сетка) или strip (лента без fade).
 */
export function FrameFeed({ viewMode }: { viewMode: ViewMode }) {
  const [items, setItems] = useState<Frame[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const closedLightboxIndexRef = useRef<number | null>(null)

  const loadMore = useCallback(async (cursor: string | null = null) => {
    const url = cursor
      ? `/api/frames?cursor=${encodeURIComponent(cursor)}`
      : "/api/frames"
    const res = await fetch(url)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message = (body?.error as string) || `Failed to load frames: ${res.status}`
      throw new Error(message)
    }
    const data: FramesResponse = await res.json()
    return data
  }, [])

  // Первая загрузка
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadMore(null)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items)
          setNextCursor(data.nextCursor)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loadMore])

  // Infinite scroll: наблюдаем за sentinel, при появлении в viewport подгружаем следующую страницу
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || nextCursor === null || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting || loadingMoreRef.current) return
        loadingMoreRef.current = true
        setLoading(true)
        loadMore(nextCursor)
          .then((data) => {
            setItems((prev) => [...prev, ...data.items])
            setNextCursor(data.nextCursor)
          })
          .catch((e) => {
            setError(e instanceof Error ? e.message : "Failed to load more")
          })
          .finally(() => {
            setLoading(false)
            loadingMoreRef.current = false
          })
      },
      { rootMargin: "200px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [nextCursor, loading, loadMore])

  // После закрытия лайтбокса прокручиваем к карточке, которая была открыта
  useEffect(() => {
    if (lightboxIndex !== null) return
    const idx = closedLightboxIndexRef.current
    closedLightboxIndexRef.current = null
    if (idx == null) return
    const el = cardRefs.current[idx]
    if (el) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" })
    }
  }, [lightboxIndex])

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), [])
  const closeLightbox = useCallback(() => {
    closedLightboxIndexRef.current = lightboxIndex
    setLightboxIndex(null)
  }, [lightboxIndex])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    )
  }

  if (!loading && items.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        Пока нет фреймов. Добавьте первый через API.
      </p>
    )
  }

  if (viewMode === "strip") {
    return (
      <>
        <div className="flex flex-col gap-0">
          {items.map((frame, index) => (
            <StripSlide
              key={frame.id}
              frame={frame}
              onImageClick={() => openLightbox(index)}
              cardRef={(el) => {
                cardRefs.current[index] = el
              }}
            />
          ))}
        </div>
        {lightboxIndex !== null && (
          <FrameLightbox
            items={items}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onIndexChange={setLightboxIndex}
          />
        )}
        <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
        {loading && items.length > 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">Загрузка…</p>
        )}
      </>
    )
  }

  return (
    <>
      {/* Сетка по 2 карточки в ряд */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((frame, index) => (
          <div
            key={frame.id}
            ref={(el) => {
              cardRefs.current[index] = el
            }}
          >
            <FrameCard
              frame={frame}
              onImageClick={() => openLightbox(index)}
            />
          </div>
        ))}
      </div>

      {/* Полноэкранный просмотр: стрелки вверх/вниз и скролл — смена картинки */}
      {lightboxIndex !== null && (
        <FrameLightbox
          items={items}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onIndexChange={setLightboxIndex}
        />
      )}

      {/* Sentinel для infinite scroll: когда он попадает в viewport, запрашиваем следующую страницу */}
      <div ref={sentinelRef} className="h-4 w-full" aria-hidden />

      {loading && items.length > 0 && (
        <p className="text-muted-foreground text-center py-4 text-sm">
          Загрузка…
        </p>
      )}
    </>
  )
}
