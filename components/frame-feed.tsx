"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { FrameCard } from "@/components/frame-card"
import { FrameLightbox } from "@/components/frame-lightbox"
import type { Frame, FramesResponse } from "@/lib/types"

/**
 * Лента фреймов с infinite scroll.
 * При первом рендере запрашивает первую порцию через GET /api/frames,
 * при достижении конца списка (IntersectionObserver на sentinel) подгружает следующую по nextCursor.
 */
export function FrameFeed() {
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
