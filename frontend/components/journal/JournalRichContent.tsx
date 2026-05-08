'use client'

import { useEffect, useRef } from 'react'

interface JournalRichContentProps {
  content: string
  className?: string
  fallbackAlt?: string
}

const JOURNAL_RESIZE_TOOLTIP_SEEN_KEY = 'journal_resize_tooltip_seen'

function getFrameWidth(frame: HTMLElement): number {
  const inlineWidth = Number.parseFloat(frame.style.width || '')
  if (Number.isFinite(inlineWidth) && inlineWidth > 0) {
    return inlineWidth
  }

  return frame.getBoundingClientRect().width
}

function updateSmallFrameState(container: HTMLElement, frame: HTMLElement) {
  const containerWidth = Math.max(container.clientWidth, 1)
  const frameWidth = getFrameWidth(frame)
  const isSmall = frameWidth <= containerWidth * 0.58
  frame.classList.toggle('journal-image-frame-small', isSmall)
}

function hasMeaningfulText(element: HTMLElement): boolean {
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.journal-image-frame').forEach((item) => item.remove())
  return (clone.textContent || '').trim().length > 0
}

function isSmallStandaloneImageBlock(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false
  const frames = Array.from(element.querySelectorAll(':scope .journal-image-frame')) as HTMLElement[]
  if (frames.length !== 1) return false

  const frame = frames[0] as HTMLElement
  if (!frame.classList.contains('journal-image-frame-small')) return false

  if (hasMeaningfulText(element)) return false
  return true
}

function unwrapSmallRows(container: HTMLElement) {
  const rows = Array.from(container.querySelectorAll('.journal-small-image-row')) as HTMLElement[]
  rows.forEach((row) => {
    const parent = row.parentElement
    if (!parent) return

    const children = Array.from(row.children)
    children.forEach((child) => {
      child.classList.remove('journal-small-image-cell')
      parent.insertBefore(child, row)
    })

    row.remove()
  })
}

function regroupSmallRows(container: HTMLElement) {
  unwrapSmallRows(container)

  const children = Array.from(container.children)
  let index = 0

  while (index < children.length) {
    if (!isSmallStandaloneImageBlock(children[index])) {
      index += 1
      continue
    }

    const start = index
    while (index < children.length && isSmallStandaloneImageBlock(children[index])) {
      index += 1
    }

    const run = children.slice(start, index) as HTMLElement[]
    if (run.length < 2) continue

    for (let i = 0; i + 1 < run.length; i += 2) {
      const first = run[i]
      const second = run[i + 1]
      const parent = first.parentElement
      if (!parent) continue

      const row = document.createElement('div')
      row.className = 'journal-small-image-row'
      parent.insertBefore(row, first)

      first.classList.add('journal-small-image-cell')
      second.classList.add('journal-small-image-cell')
      row.appendChild(first)
      row.appendChild(second)
    }
  }
}

function makeImageResizable(
  container: HTMLElement,
  image: HTMLImageElement,
  onFirstHover?: (frame: HTMLElement) => void,
) {
  let frame = image.parentElement

  if (!frame || !frame.classList.contains('journal-image-frame')) {
    frame = document.createElement('span')
    frame.className = 'journal-image-frame'
    image.parentNode?.insertBefore(frame, image)
    frame.appendChild(image)
  }

  image.classList.add('journal-resizable-image')
  image.setAttribute('draggable', 'false')

  if (!frame.style.width) {
    const containerWidth = Math.max(container.clientWidth, 320)
    const initial = image.getBoundingClientRect().width || Math.min(680, containerWidth)
    const clamped = Math.max(180, Math.min(initial, containerWidth))
    frame.style.width = `${clamped}px`
  }

  image.style.width = '100%'
  image.style.height = 'auto'

  let handle = frame.querySelector('.journal-image-handle') as HTMLButtonElement | null
  if (!handle) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'journal-image-handle'
    btn.setAttribute('aria-label', 'Resize image')
    frame.appendChild(btn)
    handle = btn
  }

  const startResize = (event: PointerEvent) => {
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidth = getFrameWidth(frame)
    const maxWidth = Math.max(container.clientWidth, 220)

    const onMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(180, Math.min(startWidth + (moveEvent.clientX - startX), maxWidth))
      frame.style.width = `${nextWidth}px`
      updateSmallFrameState(container, frame)
      regroupSmallRows(container)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  handle.onpointerdown = startResize
  image.onpointerdown = startResize

  const onImageLoaded = () => {
    updateSmallFrameState(container, frame)
    regroupSmallRows(container)
  }

  image.addEventListener('load', onImageLoaded)
  if (image.complete) {
    onImageLoaded()
  }

  if (onFirstHover) {
    frame.addEventListener(
      'pointerenter',
      () => {
        onFirstHover(frame)
      },
      { once: true },
    )
  }
}

export function JournalRichContent({
  content,
  className,
  fallbackAlt,
}: JournalRichContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hasShownTooltipRef = useRef(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (typeof window !== 'undefined') {
      hasShownTooltipRef.current =
        window.sessionStorage.getItem(JOURNAL_RESIZE_TOOLTIP_SEEN_KEY) === '1'
    }

    const showTooltipOnce = (frame: HTMLElement) => {
      if (hasShownTooltipRef.current) return

      hasShownTooltipRef.current = true
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(JOURNAL_RESIZE_TOOLTIP_SEEN_KEY, '1')
      }

      const tooltip = document.createElement('span')
      tooltip.className = 'journal-resize-tooltip'
      tooltip.textContent = 'Drag to resize'
      frame.appendChild(tooltip)

      window.setTimeout(() => {
        tooltip.classList.add('journal-resize-tooltip-hidden')
      }, 1400)

      window.setTimeout(() => {
        tooltip.remove()
      }, 1900)
    }

    const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
    images.forEach((node, index) => {
      if (node instanceof HTMLImageElement) {
        if (fallbackAlt && (!node.alt || node.alt.trim().length === 0)) {
          node.alt = `${fallbackAlt} - Image ${index + 1}`
        }
        makeImageResizable(container, node, showTooltipOnce)
      }
    })

    const onResize = () => {
      const frames = Array.from(container.querySelectorAll('.journal-image-frame')) as HTMLElement[]
      frames.forEach((frame) => updateSmallFrameState(container, frame))
      regroupSmallRows(container)
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [content, fallbackAlt])

  return (
    <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: content }} />
  )
}
