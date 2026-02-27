"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import Link from "next/link"
import { X, ChevronUp, ChevronDown } from "lucide-react"
import { ExternalLink } from "lucide-react"
import type { Frame } from "@/lib/types"

type Props = {
  items: Frame[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

// Миниатюры: ещё -30% от 105×78 → ~73×55
const THUMB_WIDTH = 74
const THUMB_HEIGHT = 55

const PULL_THRESHOLD = 60
const PULL_RESISTANCE = 0.4
const ARROW_SIZE = 16
const EDGE_THRESHOLD = 8

/**
 * Полноэкранный просмотр: одна картинка fit по ширине, скролл по высоте.
 * Миниатюры слева всегда. Pull-to-switch на границах скролла (вверху — prev, внизу — next).
 */
export function FrameLightbox({
  items,
  currentIndex,
  onClose,
  onIndexChange,
}: Props) {
  const frame = items[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < items.length - 1
  const thumbsContainerRef = useRef<HTMLDivElement>(null)
  const imageAreaRef = useRef<HTMLDivElement>(null)

  const [pullOffset, setPullOffset] = useState(0)
  const [arrowExit, setArrowExit] = useState<"up" | "down" | null>(null)
  const [imageVisible, setImageVisible] = useState(true)

  const touchStartY = useRef(0)
  const pullOffsetRef = useRef(0)
  const isPullGestureRef = useRef(false)
  pullOffsetRef.current = pullOffset

  const currentIndexRef = useRef(currentIndex)
  const onIndexChangeRef = useRef(onIndexChange)
  currentIndexRef.current = currentIndex
  onIndexChangeRef.current = onIndexChange

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1)
  }, [currentIndex, onIndexChange])

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) onIndexChange(currentIndex + 1)
  }, [currentIndex, items.length, onIndexChange])

  // Прокрутить контейнер миниатюр к текущей
  useEffect(() => {
    const container = thumbsContainerRef.current
    if (!container) return
    const el = container.querySelector(`[data-thumb-index="${currentIndex}"]`)
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [currentIndex])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        goPrev()
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose, goPrev, goNext])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    setPullOffset(0)
    const el = imageAreaRef.current
    if (el) el.scrollTop = 0
  }, [currentIndex])

  // Мягкое появление картинки при смене кадра
  useEffect(() => {
    setImageVisible(false)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setImageVisible(true))
    })
    return () => cancelAnimationFrame(id)
  }, [currentIndex])

  // preventDefault только когда на границе и тянем (pull) — иначе скролл контента
  useEffect(() => {
    const el = imageAreaRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      const atTop = el.scrollTop <= EDGE_THRESHOLD
      const atBottom =
        el.scrollHeight - el.clientHeight - el.scrollTop <= EDGE_THRESHOLD
      const deltaY = e.touches[0].clientY - touchStartY.current
      const pullingDown = atTop && deltaY > 5
      const pullingUp = atBottom && deltaY < -5
      if (pullingDown || pullingUp) {
        e.preventDefault()
        isPullGestureRef.current = true
      }
    }
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => el.removeEventListener("touchmove", onTouchMove)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    isPullGestureRef.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const el = imageAreaRef.current
    if (!el) return
    const atTop = el.scrollTop <= EDGE_THRESHOLD
    const atBottom =
      el.scrollHeight - el.clientHeight - el.scrollTop <= EDGE_THRESHOLD
    const deltaY = e.touches[0].clientY - touchStartY.current

    if (atTop && deltaY > 0) {
      const v = Math.min(deltaY * PULL_RESISTANCE, 120)
      setPullOffset(v)
    } else if (atBottom && deltaY < 0) {
      const v = Math.max(deltaY * PULL_RESISTANCE, -120)
      setPullOffset(v)
    } else {
      setPullOffset(0)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    const o = pullOffsetRef.current
    setPullOffset(0)
    const idx = currentIndexRef.current
    const change = onIndexChangeRef.current
    if (o >= PULL_THRESHOLD && idx > 0) {
      change(idx - 1)
      setArrowExit("up")
      setTimeout(() => setArrowExit(null), 300)
    } else if (o <= -PULL_THRESHOLD && idx < items.length - 1) {
      change(idx + 1)
      setArrowExit("down")
      setTimeout(() => setArrowExit(null), 300)
    }
  }, [items.length])

  if (!frame) return null

  const addedDate = frame.createdAt
    ? new Date(frame.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      })
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фрейма"
      onClick={onClose}
      style={{ overflow: "hidden" }}
    >
      {/* Миниатюры слева: 24px от края, opacity 0.3 / выбранная 0.7, всегда видны */}
      <div
        ref={thumbsContainerRef}
        className="absolute bottom-8 left-6 top-8 z-10 flex w-[74px] flex-col overflow-y-auto overflow-x-hidden"
        style={{ left: 24, gap: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            data-thumb-index={index}
            onClick={() => onIndexChange(index)}
            className={`relative shrink-0 overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              index === currentIndex ? "opacity-70" : "opacity-30"
            }`}
            style={{
              width: THUMB_WIDTH,
              height: THUMB_HEIGHT,
              borderRadius: 6,
            }}
          >
            <img
              src={item.mediaUrl}
              alt=""
              className="size-full object-cover"
              draggable={false}
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute right-4 top-4 z-30 flex size-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Закрыть"
      >
        <X className="size-6" />
      </button>

      <div className="z-10 flex shrink-0 flex-col items-center gap-1 pt-4 text-center text-white/90">
        <p className="font-medium">{frame.author.name}</p>
        {addedDate && <p className="text-sm text-white/70">{addedDate}</p>}
        {frame.figmaUrl ? (
          <Link
            href={frame.figmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-white/90 underline hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open in Figma
          </Link>
        ) : null}
      </div>

      {/* Картинка: всегда fit по ширине, высота по контенту, скролл. Pull на границах сдвигает контент. */}
      <div
        ref={imageAreaRef}
        className="min-h-0 flex-1 overflow-auto p-4 pt-4 flex items-start justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="flex shrink-0 flex-col items-center transition-all duration-75 ease-out"
          style={{
            transform: `translateY(${pullOffset}px)`,
            minWidth: "min-content",
            opacity: imageVisible ? 1 : 0,
            transition: "transform 75ms ease-out, opacity 200ms ease-out",
          }}
        >
          <img
            key={frame.id}
            src={frame.mediaUrl}
            alt={frame.comment ?? `Frame by ${frame.author.name}`}
            className="h-auto w-full max-w-full object-contain object-left-top rounded-xl block"
            draggable={false}
          />
        </div>
      </div>

      {/* Стрелка при pull */}
      {pullOffset >= PULL_THRESHOLD && hasPrev && (
        <div
          className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 text-white/90"
          style={{ top: 32 }}
          aria-hidden
        >
          <ChevronUp size={ARROW_SIZE} />
        </div>
      )}
      {pullOffset <= -PULL_THRESHOLD && hasNext && (
        <div
          className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-white/90"
          style={{ bottom: 32 }}
          aria-hidden
        >
          <ChevronDown size={ARROW_SIZE} />
        </div>
      )}

      {arrowExit && (
        <div
          className={`pointer-events-none absolute left-1/2 z-20 text-white/90 ${
            arrowExit === "up"
              ? "animate-arrow-exit-up"
              : "animate-arrow-exit-down"
          }`}
          style={
            arrowExit === "up"
              ? { top: 32, left: "50%" }
              : { bottom: 32, left: "50%" }
          }
          aria-hidden
        >
          {arrowExit === "up" ? (
            <ChevronUp size={ARROW_SIZE} />
          ) : (
            <ChevronDown size={ARROW_SIZE} />
          )}
        </div>
      )}
    </div>
  )
}
