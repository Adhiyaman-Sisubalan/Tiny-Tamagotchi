import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { usePetStore } from '../store/usePetStore'

export function MessageToast() {
  const petMessage       = usePetStore((s) => s.petMessage)
  const messageDurationMs = usePetStore((s) => s.messageDurationMs)
  const clearMessage     = usePetStore((s) => s.clearMessage)
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!petMessage || messageDurationMs === 0) return

    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => clearMessage(), messageDurationMs)

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [petMessage, messageDurationMs, clearMessage])

  if (!petMessage) return null

  const bubbleStyle: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: 16,
    color: '#2d4a10',
    background: 'rgba(200, 230, 150, 0.85)',
    border: '2px solid #7d8c4f',
    borderRadius: 6,
    padding: '5px 10px',
    textAlign: 'center',
    position: 'relative',
    lineHeight: 1.3,
    boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4)',
  }

  return (
    <div
      data-testid="pet-message"
      style={bubbleStyle}
      role="status"
      aria-live="polite"
    >
      {petMessage}
    </div>
  )
}
