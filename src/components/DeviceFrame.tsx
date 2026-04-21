import type { ReactNode } from 'react'

interface DeviceFrameProps {
  children: ReactNode
  buttons?: ReactNode
}

export function DeviceFrame({ children, buttons }: DeviceFrameProps) {
  return (
    <div className="device-shell">
      <div className="speaker-grid" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="speaker-dot" />
        ))}
      </div>

      <div className="device-screen">
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </div>

      {buttons && (
        <div className="flex justify-around items-center px-4 mt-1">{buttons}</div>
      )}

      <div className="device-brand">TAMAGOTCHI</div>
    </div>
  )
}
