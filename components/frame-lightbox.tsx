"use client"

import { useEffect, useCallback } from "react"
import { X } from "lucide-react"
import type { Frame } from "@/lib/types"

type Props = {
  items: Frame[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

/**
 * Полноэкранный просмотр одного фрейма.
 * Стрелки вверх/вниз и колёсико мыши — смена картинки, Escape или кнопка — закрытие.
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

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange(currentIndex - 1)
  }, [currentIndex, hasPrev, onIndexChange])

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(currentIndex + 1)
  }, [currentIndex, hasNext, onIndexChange])

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

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фрейма"
      onClick={onClose}
    >
      {/* Кнопка закрытия */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/90 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Закрыть"
      >
        <X className="size-6" />
      </button>

      {/* Область с картинкой: клик по картинке не закрывает; скролл вверх/вниз меняет картинку */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center p-4 pt-14"
        onWheel={handleWheel}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={frame.mediaUrl}
          alt={frame.comment ?? `Frame by ${frame.author.name}`}
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />
      </div>

      {/* Подпись: автор и счётчик */}
      <div className="shrink-0 border-t border-white/10 px-4 py-2 text-center text-sm text-white/80">
        <span>{frame.author.name}</span>
        <span className="ml-2 text-white/50">
          {currentIndex + 1} / {items.length}
        </span>
      </div>
    </div>
  )
}
