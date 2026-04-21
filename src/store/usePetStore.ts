import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PetState = 'Normal' | 'Sick' | 'Evolved'

export interface GameState {
  // vitals
  hunger: number
  happiness: number
  energy: number
  // state machine
  petState: PetState
  hasEvolved: boolean
  recoveryTicks: number
  evolutionTicks: number
  // personality
  petName: string
  petMessage: string
  // transient: how long MessageToast should display the current message (0 = managed externally)
  messageDurationMs: number
}

interface PetStore extends GameState {
  // naming
  setName: (name: string) => void
  // care actions
  feed: () => void
  play: () => void
  rest: () => void
  // tick
  tick: () => void
  // messaging
  setMessage: (msg: string, durationMs?: number) => void
  clearMessage: () => void
  // for testing / e2e seeding
  setState: (partial: Partial<GameState>) => void
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const DEFAULT_GAME_STATE: GameState = {
  hunger: 50,
  happiness: 50,
  energy: 50,
  petState: 'Normal',
  hasEvolved: false,
  recoveryTicks: 0,
  evolutionTicks: 0,
  petName: '',
  petMessage: '',
  messageDurationMs: 3_000,
}

function evaluateStateMachine(s: GameState): Partial<GameState> {
  const anySickThreshold = s.hunger < 20 || s.happiness < 20 || s.energy < 20
  const allRecovery = s.hunger >= 50 && s.happiness >= 50 && s.energy >= 50
  const allEvolution = s.hunger >= 80 && s.happiness >= 80 && s.energy >= 80

  if (s.petState === 'Sick') {
    if (allRecovery) {
      const nextRecoveryTicks = s.recoveryTicks + 1
      if (nextRecoveryTicks >= 3) {
        const nextState: PetState = s.hasEvolved ? 'Evolved' : 'Normal'
        return { petState: nextState, recoveryTicks: 0 }
      }
      return { recoveryTicks: nextRecoveryTicks }
    }
    return { recoveryTicks: 0 }
  }

  if (s.petState === 'Normal') {
    if (anySickThreshold) {
      return { petState: 'Sick', evolutionTicks: 0 }
    }
    if (allEvolution) {
      const nextEvolutionTicks = s.evolutionTicks + 1
      if (nextEvolutionTicks >= 10) {
        return { petState: 'Evolved', hasEvolved: true, evolutionTicks: nextEvolutionTicks }
      }
      return { evolutionTicks: nextEvolutionTicks }
    }
    return { evolutionTicks: 0 }
  }

  if (s.petState === 'Evolved') {
    if (anySickThreshold) {
      return { petState: 'Sick', recoveryTicks: 0 }
    }
  }

  return {}
}

export const usePetStore = create<PetStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_GAME_STATE,

      setName: (name: string) => set({ petName: name.trim() }),

      feed: () => {
        const s = get()
        if (s.hunger > 90) {
          set({ petMessage: "I'm not hungry!", messageDurationMs: 3_000 })
          return
        }
        set({
          hunger: clamp(s.hunger + 30, 0, 100),
          happiness: clamp(s.happiness + 5, 0, 100),
          energy: clamp(s.energy - 5, 0, 100),
        })
      },

      play: () => {
        const s = get()
        const showEgg = s.energy < 20
        set({
          happiness: clamp(s.happiness + 25, 0, 100),
          hunger: clamp(s.hunger - 10, 0, 100),
          energy: clamp(s.energy - 10, 0, 100),
          ...(showEgg ? { petMessage: 'Zzz... too tired to play', messageDurationMs: 3_000 } : {}),
        })
      },

      rest: () => {
        const s = get()
        set({
          energy: clamp(s.energy + 40, 0, 100),
          hunger: clamp(s.hunger - 5, 0, 100),
        })
      },

      tick: () => {
        const s = get()
        const hunger = clamp(s.hunger - 3, 0, 100)
        const happiness = clamp(s.happiness - 2, 0, 100)
        const energy = clamp(s.energy - 1, 0, 100)
        const afterDecay: GameState = { ...s, hunger, happiness, energy }
        const smUpdate = evaluateStateMachine(afterDecay)
        set({ hunger, happiness, energy, ...smUpdate })
      },

      setMessage: (msg: string, durationMs = 0) => set({ petMessage: msg, messageDurationMs: durationMs }),
      clearMessage: () => set({ petMessage: '' }),

      setState: (partial: Partial<GameState>) => set(partial),
    }),
    {
      name: 'tamogotchi-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hunger: state.hunger,
        happiness: state.happiness,
        energy: state.energy,
        petState: state.petState,
        hasEvolved: state.hasEvolved,
        recoveryTicks: state.recoveryTicks,
        evolutionTicks: state.evolutionTicks,
        petName: state.petName,
        // petMessage and messageDurationMs excluded (transient UI state)
      }),
    },
  ),
)
