import { useEffect, useRef } from 'react'
import { usePetStore } from '../store/usePetStore'

export function useGameLoop() {
  const tick = usePetStore((s) => s.tick)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function start() {
    if (intervalRef.current !== null) return
    intervalRef.current = setInterval(() => tick(), 10_000)
  }

  function stop() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stop()
      } else {
        start()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (document.visibilityState === 'visible') {
      start()
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — tick is stable (zustand action)
}
