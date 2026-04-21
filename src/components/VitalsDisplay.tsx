import type { CSSProperties } from 'react'
import { usePetStore } from '../store/usePetStore'

interface StatBarProps {
  label: string
  value: number
  testId: string
}

function barColor(value: number): string {
  if (value < 20) return '#d32f2f'
  if (value < 40) return '#e65100'
  return '#4a7c59'
}

function barAnimation(value: number): string {
  if (value < 20) return 'pulseFast 0.6s ease-in-out infinite'
  if (value < 40) return 'pulseSlow 1.4s ease-in-out infinite'
  return 'none'
}

function labelAnimation(value: number): string {
  if (value < 20) return 'labelShake 0.4s ease-in-out infinite'
  return 'none'
}

function StatBar({ label, value, testId }: StatBarProps) {
  const critical = value < 20
  const labelStyle: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: 15,
    color: critical ? '#d32f2f' : '#3a5a20',
    animation: labelAnimation(value),
    display: 'inline-block',
  }
  const fillStyle: CSSProperties = {
    height: '100%',
    width: `${value}%`,
    background: barColor(value),
    borderRadius: 4,
    transition: 'width 0.5s ease, background 0.5s ease',
    animation: barAnimation(value),
  }

  return (
    <div className="flex flex-col gap-1">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={labelStyle}>{label}</span>
        <span
          data-testid={testId}
          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#3a5a20' }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 8,
          background: 'rgba(74, 124, 89, 0.2)',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid rgba(74, 124, 89, 0.3)',
        }}
      >
        <div style={fillStyle} />
      </div>
    </div>
  )
}

export function VitalsDisplay() {
  const hunger    = usePetStore((s) => s.hunger)
  const happiness = usePetStore((s) => s.happiness)
  const energy    = usePetStore((s) => s.energy)

  return (
    <div className="w-full flex flex-col gap-2 px-1 pb-1">
      <StatBar label="Hunger"    value={hunger}    testId="stat-hunger" />
      <StatBar label="Happiness" value={happiness} testId="stat-happiness" />
      <StatBar label="Energy"    value={energy}    testId="stat-energy" />
    </div>
  )
}
