import { useState } from 'react'
import { usePetStore } from './store/usePetStore'
import { useGameLoop } from './hooks/useGameLoop'
import { useIdleQuip } from './hooks/useIdleQuip'
import { DeviceFrame } from './components/DeviceFrame'
import { PetDisplay } from './components/PetDisplay'
import { VitalsDisplay } from './components/VitalsDisplay'
import { ActionButtons } from './components/ActionButtons'
import { MessageToast } from './components/MessageToast'
import { NamingScreen } from './components/NamingScreen'
import type { ReactionType } from './components/PetSprite'

function Game() {
  const [lastActionTime, setLastActionTime] = useState(() => Date.now())
  const [reaction, setReaction]             = useState<ReactionType>('idle')
  const [particles, setParticles]           = useState<'food' | 'sparkle' | 'zzz' | null>(null)

  const feed = usePetStore((s) => s.feed)
  const play = usePetStore((s) => s.play)
  const rest = usePetStore((s) => s.rest)

  useGameLoop()
  useIdleQuip(lastActionTime)

  function triggerReaction(type: ReactionType, pType?: 'food' | 'sparkle' | 'zzz') {
    setReaction(type)
    if (pType) setParticles(pType)
    setTimeout(() => {
      setReaction('idle')
      setParticles(null)
    }, 900)
  }

  function handleFeed() {
    const hunger = usePetStore.getState().hunger
    if (hunger > 90) {
      triggerReaction('shake')
    } else {
      triggerReaction('excited', 'food')
    }
    feed()
    setLastActionTime(Date.now())
  }

  function handlePlay() {
    const energy = usePetStore.getState().energy
    if (energy < 20) {
      triggerReaction('tired')
    } else {
      triggerReaction('spin', 'sparkle')
    }
    play()
    setLastActionTime(Date.now())
  }

  function handleRest() {
    triggerReaction('rest', 'zzz')
    rest()
    setLastActionTime(Date.now())
  }

  return (
    <DeviceFrame
      buttons={
        <ActionButtons
          onFeed={handleFeed}
          onPlay={handlePlay}
          onRest={handleRest}
        />
      }
    >
      <PetDisplay reaction={reaction} particles={particles} />
      <MessageToast />
      <VitalsDisplay />
    </DeviceFrame>
  )
}

export default function App() {
  const petName = usePetStore((s) => s.petName)

  return (
    <div className="app-bg">
      {petName ? (
        <Game />
      ) : (
        <DeviceFrame>
          <NamingScreen />
        </DeviceFrame>
      )}
    </div>
  )
}
