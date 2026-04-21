import { describe, it, expect, beforeEach } from 'vitest'
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
    petName: 'Test',
    petMessage: '',
    messageDurationMs: 3_000,
    ...overrides,
  })
}

beforeEach(() => {
  localStorage.clear()
  reset()
})

// ─── UT-STATE-001 ─────────────────────────────────────────────────────────────
// REQ-STATE-001, REQ-STATE-002
it('UT-STATE-001 — initial petState is Normal; hasEvolved and counters start at 0', () => {
  expect(store().petState).toBe('Normal')
  expect(store().hasEvolved).toBe(false)
  expect(store().recoveryTicks).toBe(0)
  expect(store().evolutionTicks).toBe(0)
})

// ─── UT-STATE-002 ─────────────────────────────────────────────────────────────
// REQ-STATE-003
it('UT-STATE-002 — Normal → Sick when Hunger decays below 20', () => {
  reset({ hunger: 22, happiness: 50, energy: 50 })
  store().tick() // hunger → 19 (< 20)
  expect(store().petState).toBe('Sick')
})

// ─── UT-STATE-003 ─────────────────────────────────────────────────────────────
// REQ-STATE-003
it('UT-STATE-003 — Normal stays Normal when Hunger decays to exactly 20 (boundary exclusive)', () => {
  reset({ hunger: 23, happiness: 50, energy: 50 })
  store().tick() // hunger → 20; 20 is NOT < 20
  expect(store().petState).toBe('Normal')
})

// ─── UT-STATE-004 ─────────────────────────────────────────────────────────────
// REQ-STATE-003
it('UT-STATE-004 — Normal → Sick triggered by Happiness dropping below 20', () => {
  reset({ hunger: 50, happiness: 21, energy: 50 })
  store().tick() // happiness → 19
  expect(store().petState).toBe('Sick')
})

// ─── UT-STATE-005 ─────────────────────────────────────────────────────────────
// REQ-STATE-003
it('UT-STATE-005 — Normal → Sick triggered by Energy dropping below 20', () => {
  reset({ hunger: 50, happiness: 50, energy: 20 })
  store().tick() // energy → 19
  expect(store().petState).toBe('Sick')
})

// ─── UT-STATE-006 ─────────────────────────────────────────────────────────────
// REQ-STATE-004, REQ-STATE-006
it('UT-STATE-006 — Sick → Normal after exactly 3 recovery ticks (hasEvolved false)', () => {
  reset({ petState: 'Sick', hasEvolved: false, hunger: 80, happiness: 80, energy: 80 })
  store().tick()
  expect(store().recoveryTicks).toBe(1)
  store().tick()
  expect(store().recoveryTicks).toBe(2)
  store().tick()
  expect(store().petState).toBe('Normal')
  expect(store().recoveryTicks).toBe(0) // reset on transition
})

// ─── UT-STATE-007 ─────────────────────────────────────────────────────────────
// REQ-STATE-004, REQ-STATE-006
it('UT-STATE-007 — Sick → Evolved after 3 recovery ticks when hasEvolved is true', () => {
  reset({ petState: 'Sick', hasEvolved: true, hunger: 80, happiness: 80, energy: 80 })
  for (let i = 0; i < 3; i++) store().tick()
  expect(store().petState).toBe('Evolved')
  expect(store().recoveryTicks).toBe(0)
})

// ─── UT-STATE-008 ─────────────────────────────────────────────────────────────
// REQ-STATE-004
it('UT-STATE-008 — recoveryTicks increments each qualifying tick while Sick', () => {
  reset({ petState: 'Sick', hunger: 60, happiness: 60, energy: 60 })
  store().tick()
  expect(store().recoveryTicks).toBe(1)
  store().tick()
  expect(store().recoveryTicks).toBe(2)
})

// ─── UT-STATE-009 ─────────────────────────────────────────────────────────────
// REQ-STATE-010
it('UT-STATE-009 — recoveryTicks resets to 0 when any stat drops below 50 while Sick', () => {
  reset({ petState: 'Sick', recoveryTicks: 2, hunger: 52, happiness: 60, energy: 60 })
  store().tick() // hunger → 49 (< 50 breaks recovery streak)
  expect(store().recoveryTicks).toBe(0)
  expect(store().petState).toBe('Sick')
})

// ─── UT-STATE-010 ─────────────────────────────────────────────────────────────
// REQ-STATE-005
// Direct hunger decay makes reaching 10 consecutive ≥80-stat ticks impossible from
// any starting value (hunger drops below 80 after ~7 ticks). We verify the transition
// boundary by setting evolutionTicks=9 with stats that stay ≥80 for one more tick
// (90−3=87, 90−2=88, 90−1=89).
it('UT-STATE-010 — Normal → Evolved when evolutionTicks reaches 10', () => {
  reset({
    petState: 'Normal',
    hasEvolved: false,
    evolutionTicks: 9,
    hunger: 90,
    happiness: 90,
    energy: 90,
  })
  store().tick() // stats remain ≥80; counter → 10 → Evolved
  expect(store().petState).toBe('Evolved')
  expect(store().hasEvolved).toBe(true)
})

// ─── UT-STATE-011 ─────────────────────────────────────────────────────────────
// REQ-STATE-005
it('UT-STATE-011 — evolutionTicks increments each qualifying tick while Normal', () => {
  reset({ petState: 'Normal', hunger: 100, happiness: 100, energy: 100 })
  store().tick()
  expect(store().evolutionTicks).toBe(1)
  store().tick()
  expect(store().evolutionTicks).toBe(2)
  store().tick()
  expect(store().evolutionTicks).toBe(3)
})

// ─── UT-STATE-012 ─────────────────────────────────────────────────────────────
// REQ-STATE-011
it('UT-STATE-012 — evolutionTicks resets to 0 when any stat drops below 80', () => {
  reset({ petState: 'Normal', evolutionTicks: 7, hunger: 82, happiness: 80, energy: 80 })
  store().tick() // hunger → 79 (< 80 breaks evolution streak)
  expect(store().evolutionTicks).toBe(0)
})

// ─── UT-STATE-013 ─────────────────────────────────────────────────────────────
// REQ-STATE-012
it('UT-STATE-013 — evolutionTicks resets to 0 when Normal → Sick transition fires', () => {
  reset({ petState: 'Normal', evolutionTicks: 8, hunger: 22, happiness: 50, energy: 50 })
  store().tick() // hunger → 19 → Sick
  expect(store().petState).toBe('Sick')
  expect(store().evolutionTicks).toBe(0)
})

// ─── UT-STATE-014 ─────────────────────────────────────────────────────────────
// REQ-STATE-007
it('UT-STATE-014 — Sick state blocks evolution check even when all stats ≥ 80', () => {
  reset({ petState: 'Sick', evolutionTicks: 0, hunger: 90, happiness: 90, energy: 90 })
  for (let i = 0; i < 11; i++) store().tick()
  expect(store().petState).not.toBe('Evolved')
  expect(store().evolutionTicks).toBe(0) // evolution check never ran
})

// ─── UT-STATE-015 ─────────────────────────────────────────────────────────────
// REQ-STATE-008
it('UT-STATE-015 — Evolved → Sick when any stat drops below 20', () => {
  reset({ petState: 'Evolved', hasEvolved: true, hunger: 22, happiness: 80, energy: 80 })
  store().tick() // hunger → 19
  expect(store().petState).toBe('Sick')
  expect(store().hasEvolved).toBe(true) // permanent flag unchanged
})

// ─── UT-STATE-016 ─────────────────────────────────────────────────────────────
// REQ-STATE-014
it('UT-STATE-016 — petState persists to localStorage after a transition', () => {
  reset({ petState: 'Normal', hunger: 22, happiness: 50, energy: 50 })
  store().tick()
  const saved = JSON.parse(localStorage.getItem('tamogotchi-store') ?? '{}')
  expect(saved.state.petState).toBe('Sick')
})

// ─── UT-STATE-017 ─────────────────────────────────────────────────────────────
// REQ-STATE-014
describe('UT-STATE-017 — state and counters rehydrate from localStorage', () => {
  it('restores petState, hasEvolved, recoveryTicks from saved state', () => {
    localStorage.setItem(
      'tamogotchi-store',
      JSON.stringify({
        state: {
          petState: 'Sick',
          hasEvolved: true,
          recoveryTicks: 2,
          evolutionTicks: 0,
          hunger: 60,
          happiness: 60,
          energy: 60,
          petName: 'Test',
          petMessage: '',
        },
        version: 0,
      }),
    )
    usePetStore.persist.rehydrate()
    expect(store().petState).toBe('Sick')
    expect(store().hasEvolved).toBe(true)
    expect(store().recoveryTicks).toBe(2)
  })
})
