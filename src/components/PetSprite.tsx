import type { CSSProperties } from 'react'

export type ReactionType = 'idle' | 'excited' | 'spin' | 'rest' | 'shake' | 'tired'

const REACTION_ANIM: Record<ReactionType, string> = {
  idle:    '',
  excited: 'reactionJump 0.65s ease forwards',
  spin:    'reactionSpin 0.6s ease forwards',
  rest:    'reactionDroop 0.8s ease forwards',
  shake:   'reactionShake 0.5s ease forwards',
  tired:   'reactionDroop 0.8s ease forwards',
}

interface PetSpriteProps {
  state: 'Normal' | 'Sick' | 'Evolved'
  reaction: ReactionType
}

export function PetSprite({ state, reaction }: PetSpriteProps) {
  const wrapStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: REACTION_ANIM[reaction] || undefined,
  }
  return (
    <div style={wrapStyle}>
      {state === 'Normal' && <NormalPet />}
      {state === 'Sick'   && <SickPet />}
      {state === 'Evolved' && <EvolvedPet />}
    </div>
  )
}

/* ── Normal ─────────────────────────────────────────────────────── */

function NormalPet() {
  const blob: CSSProperties = {
    width: 72,
    height: 65,
    background: 'linear-gradient(160deg, #FFE082 0%, #FFB300 100%)',
    borderRadius: '46% 46% 44% 44% / 52% 52% 42% 42%',
    position: 'relative',
    animation: 'petFloat 3s ease-in-out infinite',
    boxShadow: '0 5px 14px rgba(255, 179, 0, 0.42)',
  }
  const eye: CSSProperties = {
    width: 8,
    height: 11,
    background: '#3e2006',
    borderRadius: '50%',
    position: 'absolute',
    top: '30%',
    animation: 'eyeBlink 4s ease-in-out infinite',
    transformOrigin: 'center',
  }
  return (
    <div style={blob}>
      <div style={{ ...eye, left: '24%' }} />
      <div style={{ ...eye, right: '24%', animationDelay: '0.4s' }} />
    </div>
  )
}

/* ── Sick ───────────────────────────────────────────────────────── */

function XEye({ left, right }: { left?: string; right?: string }) {
  const container: CSSProperties = {
    width: 13,
    height: 13,
    position: 'absolute',
    top: '28%',
    ...(left !== undefined ? { left } : {}),
    ...(right !== undefined ? { right } : {}),
  }
  const bar: CSSProperties = {
    width: '100%',
    height: 2.5,
    background: '#3a0846',
    position: 'absolute',
    top: '50%',
    left: 0,
    borderRadius: 2,
    transformOrigin: 'center',
  }
  return (
    <div style={container}>
      <div style={{ ...bar, transform: 'translateY(-50%) rotate(45deg)' }} />
      <div style={{ ...bar, transform: 'translateY(-50%) rotate(-45deg)' }} />
    </div>
  )
}

function SickPet() {
  const blob: CSSProperties = {
    width: 72,
    height: 65,
    background: 'linear-gradient(160deg, #CE93D8 0%, #9C27B0 100%)',
    borderRadius: '46% 46% 44% 44% / 52% 52% 42% 42%',
    position: 'relative',
    animation: 'petWobble 1.6s ease-in-out infinite',
    boxShadow: '0 5px 14px rgba(156, 39, 176, 0.38)',
  }
  const sweat: CSSProperties = {
    width: 7,
    height: 10,
    background: 'linear-gradient(180deg, #90CAF9 0%, #1565C0 100%)',
    borderRadius: '50% 50% 40% 40% / 60% 60% 35% 35%',
    position: 'absolute',
    top: -10,
    right: '18%',
  }
  return (
    <div style={blob}>
      <XEye left="19%" />
      <XEye right="19%" />
      <div style={sweat} />
    </div>
  )
}

/* ── Evolved ────────────────────────────────────────────────────── */

function Sparkle({ delay }: { delay: string }) {
  const style: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 13,
    height: 13,
    marginTop: -6.5,
    marginLeft: -6.5,
    fontSize: 11,
    lineHeight: '13px',
    textAlign: 'center',
    animation: `orbit 2.6s linear infinite ${delay}`,
    transformOrigin: '50% 50%',
  }
  return <div style={style}>✦</div>
}

function EvolvedPet() {
  const container: CSSProperties = {
    position: 'relative',
    width: 88,
    height: 80,
    animation: 'goldGlow 2s ease-in-out infinite',
  }
  const blob: CSSProperties = {
    width: 88,
    height: 80,
    background: 'linear-gradient(160deg, #FFF176 0%, #FFD700 55%, #FF8F00 100%)',
    borderRadius: '46% 46% 44% 44% / 52% 52% 42% 42%',
    position: 'absolute',
    inset: 0,
    animation: 'petFloat 3s ease-in-out infinite',
    boxShadow: '0 5px 18px rgba(255, 215, 0, 0.55)',
  }
  const eye: CSSProperties = {
    width: 9,
    height: 12,
    background: '#4a2800',
    borderRadius: '50%',
    position: 'absolute',
    top: '30%',
    animation: 'eyeBlink 4s ease-in-out infinite',
    transformOrigin: 'center',
  }
  const crown: CSSProperties = {
    position: 'absolute',
    top: -18,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 22,
    filter: 'drop-shadow(0 0 5px #FFD700)',
    zIndex: 2,
  }
  return (
    <div style={container}>
      <div style={blob}>
        <div style={{ ...eye, left: '24%' }} />
        <div style={{ ...eye, right: '24%', animationDelay: '0.4s' }} />
      </div>
      <div style={crown}>👑</div>
      <Sparkle delay="0s" />
      <Sparkle delay="-1.3s" />
    </div>
  )
}
