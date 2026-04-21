import type { CSSProperties } from 'react'
import { usePetStore } from '../store/usePetStore'
import type { PetState } from '../store/usePetStore'
import { PetSprite } from './PetSprite'
import type { ReactionType } from './PetSprite'

const STATE_LABEL: Record<PetState, string> = {
  Normal:  'Normal',
  Sick:    'Sick',
  Evolved: 'Evolved!',
}

const STATE_BADGE: Record<PetState, CSSProperties> = {
  Normal:  { background: 'rgba(74, 124, 89, 0.25)',  color: '#2d5a3d', border: '1px solid #4a7c59' },
  Sick:    { background: 'rgba(180, 40, 40, 0.2)',   color: '#7a1010', border: '1px solid #b02020' },
  Evolved: { background: 'rgba(180, 130, 0, 0.25)',  color: '#6b4a00', border: '1px solid #c8900a' },
}

const PARTICLE_SET: Record<'food' | 'sparkle' | 'zzz', string[]> = {
  food:    ['🍖', '🍖', '✨'],
  sparkle: ['✨', '⭐', '✨'],
  zzz:     ['z', 'Z', 'Z'],
}

interface PetDisplayProps {
  reaction: ReactionType
  particles: 'food' | 'sparkle' | 'zzz' | null
}

export function PetDisplay({ reaction, particles }: PetDisplayProps) {
  const petName  = usePetStore((s) => s.petName)
  const petState = usePetStore((s) => s.petState)

  return (
    <div className="flex flex-col items-center gap-2 py-2" style={{ position: 'relative' }}>
      {/* Pet name */}
      <p
        data-testid="pet-name"
        style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#3a5a20', letterSpacing: 1 }}
      >
        {petName}
      </p>

      {/* Sprite + particles */}
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100 }}
      >
        {/* Crossfade on state change via key */}
        <div
          key={petState}
          data-testid="pet-sprite"
          data-state={petState}
          role="img"
          aria-label={`Pet sprite: ${petState}`}
          style={{ animation: 'fadeIn 0.4s ease forwards' }}
        >
          <PetSprite state={petState} reaction={reaction} />
        </div>

        {/* Floating particles */}
        {particles && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {PARTICLE_SET[particles].map((p, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: `${28 + i * 20}%`,
                  bottom: '60%',
                  fontSize: particles === 'zzz' ? 14 : 16,
                  fontFamily: particles === 'zzz' ? "'Press Start 2P', monospace" : undefined,
                  color: particles === 'zzz' ? '#4a7c59' : undefined,
                  animation: `floatUp 0.85s ease-out ${i * 0.14}s forwards`,
                  opacity: 1,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* State badge */}
      <span
        data-testid="pet-state"
        style={{
          ...STATE_BADGE[petState],
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          padding: '3px 8px',
          borderRadius: 4,
        }}
      >
        {STATE_LABEL[petState]}
      </span>
    </div>
  )
}
