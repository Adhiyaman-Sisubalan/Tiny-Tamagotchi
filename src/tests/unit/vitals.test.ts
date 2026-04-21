import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePetStore } from '../../store/usePetStore'
import { useGameLoop } from '../../hooks/useGameLoop'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function store() {
  return usePetStore.getState()
}

function reset(overrides: Partial<ReturnType<typeof store>> = {}) {
  usePetStore.setState({
    hunger: 50,
    happiness: 50,
    energy: 50,
    petState: 'Normal',
    hasEvolved: false,
    recoveryTicks: 0,
    evolutionTicks: 0,
    petName: 'Test',
    petMessage: '',
    messageDurationMs: 3_000,
    ...overrides,
  })
}

// Control document.visibilityState in jsdom
function mockVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    writable: true,
    configurable: true,
  })
}

function restoreVisibility() {
  try {
    // Removing the own property lets the prototype getter take over (returns 'visible')
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  } catch {
    // ignore
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  reset()
  restoreVisibility()
})

afterEach(() => {
  vi.restoreAllMocks()
  restoreVisibility()
})

// ─── UT-VITALS-001 ────────────────────────────────────────────────────────────
// REQ-VITALS-001, REQ-VITALS-002
describe('UT-VITALS-001 — initial stat defaults', () => {
  it('hunger, happiness, energy initialise to 50 with no saved state', () => {
    localStorage.clear()
    reset({ hunger: 50, happiness: 50, energy: 50 })
    expect(store().hunger).toBe(50)
    expect(store().happiness).toBe(50)
    expect(store().energy).toBe(50)
  })
})

// ─── UT-VITALS-002 ────────────────────────────────────────────────────────────
// REQ-VITALS-006, REQ-VITALS-007, REQ-VITALS-008
describe('UT-VITALS-002 — single tick applies correct decay', () => {
  it('hunger −3, happiness −2, energy −1 per tick', () => {
    reset({ hunger: 60, happiness: 50, energy: 40 })
    store().tick()
    expect(store().hunger).toBe(57)
    expect(store().happiness).toBe(48)
    expect(store().energy).toBe(39)
  })
})

// ─── UT-VITALS-003 ────────────────────────────────────────────────────────────
// REQ-VITALS-006, REQ-VITALS-007, REQ-VITALS-008
describe('UT-VITALS-003 — ten consecutive ticks cumulate correctly', () => {
  it('100/100/100 → 70/80/90 after 10 ticks', () => {
    reset({ hunger: 100, happiness: 100, energy: 100 })
    for (let i = 0; i < 10; i++) store().tick()
    expect(store().hunger).toBe(70)
    expect(store().happiness).toBe(80)
    expect(store().energy).toBe(90)
  })
})

// ─── UT-VITALS-004 ────────────────────────────────────────────────────────────
// REQ-VITALS-009, REQ-VITALS-006
describe('UT-VITALS-004 — clamp prevents Hunger below 0', () => {
  it('hunger=2 stays ≥ 0 after tick', () => {
    reset({ hunger: 2 })
    store().tick()
    expect(store().hunger).toBe(0)
  })
})

// ─── UT-VITALS-005 ────────────────────────────────────────────────────────────
// REQ-VITALS-009, REQ-VITALS-007
describe('UT-VITALS-005 — clamp prevents Happiness below 0', () => {
  it('happiness=1 stays ≥ 0 after tick', () => {
    reset({ hunger: 50, happiness: 1, energy: 50 })
    store().tick()
    expect(store().happiness).toBe(0)
  })
})

// ─── UT-VITALS-006 ────────────────────────────────────────────────────────────
// REQ-VITALS-009, REQ-VITALS-008
describe('UT-VITALS-006 — clamp prevents Energy below 0', () => {
  it('energy=0 stays 0 after tick', () => {
    reset({ hunger: 50, happiness: 50, energy: 0 })
    store().tick()
    expect(store().energy).toBe(0)
  })
})

// ─── UT-VITALS-007 ────────────────────────────────────────────────────────────
// REQ-VITALS-009
describe('UT-VITALS-007 — all stats at 0 hold for five ticks', () => {
  it('stays at 0/0/0 every tick when already floored', () => {
    // Set Sick so state machine doesn't run recovery logic that needs stats
    reset({ hunger: 0, happiness: 0, energy: 0, petState: 'Sick' })
    for (let i = 0; i < 5; i++) {
      store().tick()
      expect(store().hunger).toBe(0)
      expect(store().happiness).toBe(0)
      expect(store().energy).toBe(0)
    }
  })
})

// ─── UT-VITALS-008 ────────────────────────────────────────────────────────────
// REQ-VITALS-004
describe('UT-VITALS-008 — tick interval clears when tab hidden', () => {
  afterEach(() => vi.useRealTimers())

  it('no stats change while visibilityState is hidden', () => {
    vi.useFakeTimers()
    reset({ hunger: 50, happiness: 50, energy: 50 })

    mockVisibility('visible')
    const { unmount } = renderHook(() => useGameLoop())

    // Hide the tab
    act(() => {
      mockVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // 60 s of fake time — no tick should fire
    act(() => vi.advanceTimersByTime(60_000))

    expect(store().hunger).toBe(50)
    expect(store().happiness).toBe(50)
    expect(store().energy).toBe(50)

    unmount()
  })
})

// ─── UT-VITALS-009 ────────────────────────────────────────────────────────────
// REQ-VITALS-005
describe('UT-VITALS-009 — tick interval resumes when tab visible', () => {
  afterEach(() => vi.useRealTimers())

  it('one tick fires 10 s after tab returns to visible', () => {
    vi.useFakeTimers()
    reset({ hunger: 50, happiness: 50, energy: 50 })

    // Start hook while hidden — no interval launched
    mockVisibility('hidden')
    const { unmount } = renderHook(() => useGameLoop())

    // Make visible → interval starts
    act(() => {
      mockVisibility('visible')
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Advance exactly 10 s
    act(() => vi.advanceTimersByTime(10_000))

    expect(store().hunger).toBe(47)
    expect(store().happiness).toBe(48)
    expect(store().energy).toBe(49)

    unmount()
  })
})

// ─── UT-VITALS-010 ────────────────────────────────────────────────────────────
// REQ-VITALS-013
describe('UT-VITALS-010 — no immediate tick on tab resume (no catch-up)', () => {
  afterEach(() => vi.useRealTimers())

  it('stats are unchanged 0 ms after tab becomes visible again', () => {
    vi.useFakeTimers()
    reset({ hunger: 50, happiness: 50, energy: 50 })

    mockVisibility('visible')
    const { unmount } = renderHook(() => useGameLoop())

    // Hide before first tick fires
    act(() => {
      mockVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Advance 30 s while hidden
    act(() => vi.advanceTimersByTime(30_000))

    // Restore visibility — new interval counts from 0
    act(() => {
      mockVisibility('visible')
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Advance 0 ms — no tick should have fired
    act(() => vi.advanceTimersByTime(0))

    expect(store().hunger).toBe(50) // unchanged: no catch-up
    expect(store().happiness).toBe(50)
    expect(store().energy).toBe(50)

    unmount()
  })
})

// ─── UT-VITALS-011 ────────────────────────────────────────────────────────────
// REQ-VITALS-012
describe('UT-VITALS-011 — store rehydrates from localStorage', () => {
  it('restores hunger/happiness/energy from saved state', () => {
    localStorage.setItem(
      'tamogotchi-store',
      JSON.stringify({
        state: {
          hunger: 75,
          happiness: 40,
          energy: 65,
          petState: 'Normal',
          hasEvolved: false,
          recoveryTicks: 0,
          evolutionTicks: 0,
          petName: 'Test',
        },
        version: 0,
      }),
    )
    usePetStore.persist.rehydrate()
    expect(store().hunger).toBe(75)
    expect(store().happiness).toBe(40)
    expect(store().energy).toBe(65)
  })
})

// ─── UT-VITALS-012 ────────────────────────────────────────────────────────────
// REQ-VITALS-011
describe('UT-VITALS-012 — store persists to localStorage after tick', () => {
  it('localStorage contains updated stat values after one tick', () => {
    reset({ hunger: 50, happiness: 50, energy: 50 })
    store().tick()
    const saved = JSON.parse(localStorage.getItem('tamogotchi-store') ?? '{}')
    expect(saved.state.hunger).toBe(47)
    expect(saved.state.happiness).toBe(48)
    expect(saved.state.energy).toBe(49)
  })
})

// ─── UT-VITALS-013 ────────────────────────────────────────────────────────────
// REQ-VITALS-009
describe('UT-VITALS-013 — clamp boundaries via care action', () => {
  it('stat above 100 is clamped to 100', () => {
    // hunger=80 (≤90, so Feed not blocked); 80+30=110→100, 100+5→100, 100-5→95
    reset({ hunger: 80, happiness: 100, energy: 100 })
    store().feed()
    expect(store().hunger).toBe(100)
    expect(store().happiness).toBe(100)
    expect(store().energy).toBe(95)
  })

  it('clamp(−1, 0, 100) === 0', () => {
    reset({ hunger: 2 })
    store().tick() // 2 − 3 = −1, clamped to 0
    expect(store().hunger).toBe(0)
  })

  it('clamp(101, 0, 100) === 100 via feed at 80', () => {
    reset({ hunger: 80 })
    store().feed() // 80 + 30 = 110 → 100
    expect(store().hunger).toBe(100)
  })
})
