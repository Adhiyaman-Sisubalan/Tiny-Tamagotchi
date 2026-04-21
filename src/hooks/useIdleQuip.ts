import { useEffect, useRef } from 'react'
import { usePetStore } from '../store/usePetStore'

const IDLE_QUIPS = [
  'Hello? Is anyone there...?',
  'I could really use a snack right now.',
  'Just gonna stare at the wall, I guess.',
] as const

const IDLE_TIMEOUT_MS = 60_000
const QUIP_DISPLAY_MS = 5_000

export function useIdleQuip(lastActionTime: number) {
  const setMessage = usePetStore((s) => s.setMessage)
  const clearMessage = usePetStore((s) => s.clearMessage)
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Cancel any pending idle or dismiss timers when lastActionTime changes
    if (idleRef.current !== null) clearTimeout(idleRef.current)
    if (dismissRef.current !== null) clearTimeout(dismissRef.current)

    // REQ-PERS-012/013: fire a random quip after 60 s of inactivity
    // REQ-PERS-014: quip shown for 5 s (messageDurationMs=0 keeps MessageToast out of it),
    //               then dismissed; after dismissal the 60 s idle timer restarts
    function scheduleQuip() {
      idleRef.current = setTimeout(() => {
        const quip = IDLE_QUIPS[Math.floor(Math.random() * IDLE_QUIPS.length)]!
        setMessage(quip, 0) // durationMs=0: MessageToast will not auto-dismiss this message

        if (dismissRef.current !== null) clearTimeout(dismissRef.current)
        dismissRef.current = setTimeout(() => {
          clearMessage()
          scheduleQuip() // REQ-PERS-014: restart idle timer after dismissal
        }, QUIP_DISPLAY_MS)
      }, IDLE_TIMEOUT_MS)
    }

    scheduleQuip()

    return () => {
      if (idleRef.current !== null) clearTimeout(idleRef.current)
      if (dismissRef.current !== null) clearTimeout(dismissRef.current)
    }
  }, [lastActionTime, setMessage, clearMessage])
}
