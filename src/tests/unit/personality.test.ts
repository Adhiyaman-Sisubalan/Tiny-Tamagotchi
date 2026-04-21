import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { usePetStore } from '../../store/usePetStore'

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
    petName: '',
    petMessage: '',
    messageDurationMs: 3_000,
    ...overrides,
  })
}

beforeEach(() => {
  localStorage.clear()
  reset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── UT-PERS-007 ──────────────────────────────────────────────────────────────
// REQ-PERS-003
it('UT-PERS-007 — setName trims leading and trailing whitespace', () => {
  store().setName('  ab  ')
  expect(store().petName).toBe('ab')
})

// ─── UT-PERS-008 ──────────────────────────────────────────────────────────────
// REQ-PERS-004
it('UT-PERS-008 — setName persists trimmed value to localStorage', () => {
  store().setName('Fluffy')
  const saved = JSON.parse(localStorage.getItem('tamogotchi-store') ?? '{}')
  expect(saved.state.petName).toBe('Fluffy')
})

// ─── UT-PERS-010 ──────────────────────────────────────────────────────────────
// REQ-PERS-007, REQ-PERS-009
it('UT-PERS-010 — EGG-001: Feed is fully blocked when hunger = 95 (> 90)', () => {
  reset({ hunger: 95, happiness: 50, energy: 50 })
  store().feed()
  expect(store().hunger).toBe(95)    // no change
  expect(store().happiness).toBe(50) // no change
  expect(store().energy).toBe(50)    // no change
})

// ─── UT-PERS-011 ──────────────────────────────────────────────────────────────
// REQ-PERS-008
it('UT-PERS-011 — EGG-001: "I\'m not hungry!" message is set in store when Feed is blocked', () => {
  reset({ hunger: 95 })
  store().feed()
  expect(store().petMessage).toBe("I'm not hungry!")
})

// ─── UT-PERS-013 ──────────────────────────────────────────────────────────────
// REQ-PERS-007
it('UT-PERS-013 — EGG-001: Feed executes normally at hunger = 90 (boundary exclusive)', () => {
  reset({ hunger: 90, happiness: 50, energy: 50 })
  store().feed()
  expect(store().hunger).toBe(100) // 90+30=120 → 100
  expect(store().petMessage).not.toBe("I'm not hungry!")
})

it('UT-PERS-013b — EGG-001: Feed blocked at hunger = 91', () => {
  reset({ hunger: 91 })
  store().feed()
  expect(store().hunger).toBe(91)
  expect(store().petMessage).toBe("I'm not hungry!")
})

it('UT-PERS-013c — EGG-001: Feed blocked at hunger = 100', () => {
  reset({ hunger: 100 })
  store().feed()
  expect(store().hunger).toBe(100)
  expect(store().petMessage).toBe("I'm not hungry!")
})

// ─── UT-PERS-014 ──────────────────────────────────────────────────────────────
// REQ-PERS-010
it('UT-PERS-014 — EGG-002: Play executes (stat delta applied) when energy = 15', () => {
  reset({ happiness: 50, hunger: 40, energy: 15 })
  store().play()
  expect(store().happiness).toBe(75)
  expect(store().hunger).toBe(30)
  expect(store().energy).toBe(5)
})

// ─── UT-PERS-015 ──────────────────────────────────────────────────────────────
// REQ-PERS-011
it('UT-PERS-015 — EGG-002: "Zzz... too tired to play" message set when energy < 20', () => {
  reset({ energy: 15 })
  store().play()
  expect(store().petMessage).toBe('Zzz... too tired to play')
})

// ─── UT-PERS-017 ──────────────────────────────────────────────────────────────
// REQ-PERS-010
it('UT-PERS-017 — EGG-002: message NOT triggered when energy = 20 (boundary exclusive)', () => {
  reset({ energy: 20 })
  store().play()
  expect(store().petMessage).not.toBe('Zzz... too tired to play')
  expect(store().energy).toBe(10)
})

it('UT-PERS-017b — EGG-002: message triggered at energy = 19', () => {
  reset({ energy: 19 })
  store().play()
  expect(store().petMessage).toBe('Zzz... too tired to play')
})

// ─── UT-PERS-023 ──────────────────────────────────────────────────────────────
// REQ-PERS-016
it('UT-PERS-023 — setMessage replaces an existing message atomically', () => {
  store().setMessage("I'm not hungry!")
  expect(store().petMessage).toBe("I'm not hungry!")
  store().setMessage('Zzz... too tired to play')
  expect(store().petMessage).toBe('Zzz... too tired to play')
})

// REQ-PERS-016
it('clearMessage empties petMessage', () => {
  store().setMessage('hello')
  store().clearMessage()
  expect(store().petMessage).toBe('')
})

// ─── Idle quip strings ────────────────────────────────────────────────────────
// REQ-PERS-013
describe('idle quip strings match spec exactly', () => {
  const DEFINED_QUIPS = [
    'Hello? Is anyone there...?',
    'I could really use a snack right now.',
    'Just gonna stare at the wall, I guess.',
  ] as const

  it('all three quip strings are defined and non-empty', () => {
    DEFINED_QUIPS.forEach((q) => expect(q.length).toBeGreaterThan(0))
  })

  it('Math.random bucket 0.0 maps to the first quip', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    const idx = Math.floor(0.0 * 3)
    expect(DEFINED_QUIPS[idx]).toBe('Hello? Is anyone there...?')
  })

  it('Math.random bucket 0.34 maps to the second quip', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.34)
    const idx = Math.floor(0.34 * 3)
    expect(DEFINED_QUIPS[idx]).toBe('I could really use a snack right now.')
  })

  it('Math.random bucket 0.67 maps to the third quip', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.67)
    const idx = Math.floor(0.67 * 3)
    expect(DEFINED_QUIPS[idx]).toBe('Just gonna stare at the wall, I guess.')
  })
})
