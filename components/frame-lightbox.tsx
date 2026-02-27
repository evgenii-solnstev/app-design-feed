"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import Link from "next/link"
import { X, ZoomIn, ZoomOut, ChevronUp, ChevronDown } from "lucide-react"
import { ExternalLink } from "lucide-react"
import type { Frame } from "@/lib/types"

type Props = {
  items: Frame[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

type ZoomMode = "original" | "fit-width"

// Размеры в 0.7x от исходных 150×112, чтобы gap 16px был между видимыми миниатюрами
const THUMB_WIDTH = 105
const THUMB_HEIGHT = 78

const PULL_THRESHOLD = 60
const PULL_RESISTANCE = 0.4
const ARROW_SIZE = 16

/**
 * Полноэкранный просмотр: данные вверху по центру, zoom по клику на картинку,
 * кнопки zoom внизу справа, миниатюры слева.
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
  const [zoom, setZoom] = useState<ZoomMode>("original")
  const thumbsContainerRef = useRef<HTMLDivElement>(null)
  const imageAreaRef = useRef<HTMLDivElement>(null)

  // Pull-to-switch: смещение при «длинном» скролле (положительное = тянем вниз → prev, отрицательное = тянем вверх → next)
  const [pullOffset, setPullOffset] = useState(0)
  const [arrowExit, setArrowExit] = useState<"up" | "down" | null>(null)
  const touchStartY = useRef(0)
  const pullOffsetRef = useRef(0)
  pullOffsetRef.current = pullOffset

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange(currentIndex - 1)
  }, [currentIndex, hasPrev, onIndexChange])

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(currentIndex + 1)
  }, [currentIndex, hasNext, onIndexChange])

  const toggleZoom = useCallback(() => {
    setZoom((z) => (z === "original" ? "fit-width" : "original"))
  }, [])

  useEffect(() => {
    setZoom("original")
  }, [currentIndex])

  // Прокрутить контейнер миниатюр так, чтобы текущая была видна
  useEffect(() => {
    const container = thumbsContainerRef.current
    if (!container) return
    const el = container.querySelector(`[data-thumb-index="${currentIndex}"]`)
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  // Сброс pull при смене кадра
  useEffect(() => {
    setPullOffset(0)
  }, [currentIndex])

  // Нативный touchmove с passive: false, чтобы preventDefault блокировал скролл страницы (в original)
  useEffect(() => {
    const el = imageAreaRef.current
    if (!el || zoom !== "original") return
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => el.removeEventListener("touchmove", onTouchMove)
  }, [zoom])

  // Pull-to-switch: только при zoom original. При original нет скролла — только тяга и смена кадра.
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (zoom !== "original") return
      touchStartY.current = e.touches[0].clientY
    },
    [zoom]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (zoom !== "original") return
      // Всегда блокируем стандартный скролл в original, чтобы не конфликтовать со страницей
      e.preventDefault()
      const deltaY = e.touches[0].clientY - touchStartY.current
      const v = Math.max(-120, Math.min(120, deltaY * PULL_RESISTANCE))
      setPullOffset(v)
    },
    [zoom]
  )

  const handleTouchEnd = useCallback(() => {
    if (zoom !== "original") return
    const o = pullOffsetRef.current
    setPullOffset(0)
    if (o >= PULL_THRESHOLD && hasPrev) {
      onIndexChange(currentIndex - 1)
      setArrowExit("up")
      setTimeout(() => setArrowExit(null), 300)
    } else if (o <= -PULL_THRESHOLD && hasNext) {
      onIndexChange(currentIndex + 1)
      setArrowExit("down")
      setTimeout(() => setArrowExit(null), 300)
    }
  }, [zoom, hasPrev, hasNext, currentIndex, onIndexChange])

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
      {/* Миниатюры слева: скрыты при zoom in; при zoom out анимация появления 300ms; по умолчанию opacity 0.5, scale 0.7 */}
      <div
        ref={thumbsContainerRef}
        className={`absolute bottom-8 left-8 top-8 z-10 flex w-[105px] flex-col overflow-y-auto overflow-x-hidden transition-opacity duration-300 ${
          zoom === "fit-width" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={{ gap: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            data-thumb-index={index}
            onClick={() => onIndexChange(index)}
            className={`relative shrink-0 overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              index === currentIndex ? "opacity-90" : "opacity-50"
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

      {/* Кнопка закрытия: всегда видна поверх контента */}
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

      {/* Вверху по центру: Автор, дата, ссылка на Figma */}
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

      {/* Область с картинкой. Original: вся картинка в экране, без скролла; только pull сдвигает контент. Fit-width: скролл по картинке. */}
      <div
        ref={imageAreaRef}
        className={`min-h-0 flex-1 p-4 pt-4 flex ${
          zoom === "fit-width"
            ? "overflow-auto items-start justify-center"
            : "overflow-hidden items-center justify-center"
        }`}
        onClick={(e) => {
          e.stopPropagation()
          toggleZoom()
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ touchAction: zoom === "original" ? "none" : "pan-y" }}
      >
        <div
          className="flex shrink-0 items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: zoom === "original" ? `translateY(${pullOffset}px)` : undefined,
            minHeight: zoom === "fit-width" ? "min-content" : undefined,
            minWidth: zoom === "fit-width" ? "min-content" : undefined,
          }}
        >
          <img
            src={frame.mediaUrl}
            alt={frame.comment ?? `Frame by ${frame.author.name}`}
            className={
              zoom === "fit-width"
                ? "h-auto w-full max-w-full object-contain object-left-top rounded-xl block"
                : "max-h-full max-w-full object-contain rounded-xl"
            }
            draggable={false}
          />
        </div>
      </div>

      {/* Стрелка при pull: 16px, по центру сверху (prev) или снизу (next) */}
      {zoom === "original" && (
        <>
          {pullOffset >= PULL_THRESHOLD && hasPrev && (
            <div
              className="pointer-events-none absolute left-1/2 top-8 z-20 -translate-x-1/2 text-white/90"
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
        </>
      )}

      {/* Анимация выхода стрелки после смены кадра: 300ms снизу вверх или сверху вниз */}
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

      {/* Zoom in/out внизу справа: всегда видны поверх */}
      <div
        className="absolute bottom-8 right-4 z-30 flex gap-1"
        style={{ bottom: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setZoom("fit-width")}
          className="flex size-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Увеличить (по ширине)"
        >
          <ZoomIn className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom("original")}
          className="flex size-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Уменьшить (исходный размер)"
        >
          <ZoomOut className="size-5" />
        </button>
      </div>
    </div>
  )
}
