"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import Link from "next/link"
import { X, ZoomIn, ZoomOut } from "lucide-react"
import { ExternalLink } from "lucide-react"
import type { Frame } from "@/lib/types"

type Props = {
  items: Frame[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

type ZoomMode = "original" | "fit-width"

const THUMB_WIDTH = 150
const THUMB_HEIGHT = 112

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

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) goNext()
    else if (e.deltaY < 0) goPrev()
  }

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
    >
      {/* Миниатюры слева: 32px от краёв, 150×112, radius 6px, между ними 20px */}
      <div
        ref={thumbsContainerRef}
        className="absolute bottom-8 left-8 top-8 z-10 flex w-[150px] flex-col gap-5 overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            data-thumb-index={index}
            onClick={() => onIndexChange(index)}
            className={`relative shrink-0 overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              index === currentIndex ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""
            }`}
            style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, borderRadius: 6 }}
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

      {/* Кнопка закрытия: right 16px */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
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

      {/* Область с картинкой: клик переключает zoom */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center p-4 pt-4"
        onWheel={handleWheel}
        onClick={(e) => {
          e.stopPropagation()
          toggleZoom()
        }}
      >
        <img
          src={frame.mediaUrl}
          alt={frame.comment ?? `Frame by ${frame.author.name}`}
          className={
            zoom === "fit-width"
              ? "h-auto w-full object-contain"
              : "max-h-full max-w-full object-contain"
          }
          draggable={false}
        />
      </div>

      {/* Zoom in/out внизу справа: bottom 32px, right 16px (как у кнопки закрытия), одинаковый размер кнопок */}
      <div
        className="absolute bottom-8 right-4 z-10 flex gap-1"
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
