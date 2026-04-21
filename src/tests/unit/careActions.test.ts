import { it, expect, beforeEach, afterEach, vi } from 'vitest'
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

afterEach(() => vi.restoreAllMocks())

// ─── UT-CARE-001 ──────────────────────────────────────────────────────────────
// REQ-CARE-001
it('UT-CARE-001 — Feed applies correct deltas from mid-range values', () => {
  reset({ hunger: 40, happiness: 60, energy: 70 })
  store().feed()
  expect(store().hunger).toBe(70)    // 40 + 30
  expect(store().happiness).toBe(65) // 60 + 5
  expect(store().energy).toBe(65)    // 70 − 5
})

// ─── UT-CARE-002 ──────────────────────────────────────────────────────────────
// REQ-CARE-001, REQ-CARE-005
it('UT-CARE-002 — Feed clamps Hunger at 100', () => {
  reset({ hunger: 80, happiness: 60, energy: 10 })
  store().feed()
  expect(store().hunger).toBe(100)  // 80+30=110 → clamped
  expect(store().happiness).toBe(65)
  expect(store().energy).toBe(5)
})

// ─── UT-CARE-003 ──────────────────────────────────────────────────────────────
// REQ-CARE-001, REQ-CARE-005
it('UT-CARE-003 — Feed clamps Energy at 0', () => {
  reset({ hunger: 50, happiness: 50, energy: 3 })
  store().feed()
  expect(store().energy).toBe(0) // 3 − 5 = −2 → clamped
})

// ─── UT-CARE-004 ──────────────────────────────────────────────────────────────
// REQ-CARE-002
it('UT-CARE-004 — Play applies correct deltas from mid-range values', () => {
  reset({ happiness: 50, hunger: 60, energy: 50 })
  store().play()
  expect(store().happiness).toBe(75) // 50 + 25
  expect(store().hunger).toBe(50)    // 60 − 10
  expect(store().energy).toBe(40)    // 50 − 10
})

// ─── UT-CARE-005 ──────────────────────────────────────────────────────────────
// REQ-CARE-002, REQ-CARE-005
it('UT-CARE-005 — Play clamps Happiness at 100 and Hunger/Energy at 0', () => {
  reset({ happiness: 90, hunger: 5, energy: 25 })
  store().play()
  expect(store().happiness).toBe(100) // 90+25=115 → clamped
  expect(store().hunger).toBe(0)      // 5−10=−5 → clamped
  expect(store().energy).toBe(15)
})

// ─── UT-CARE-006 ──────────────────────────────────────────────────────────────
// REQ-CARE-003
it('UT-CARE-006 — Rest applies correct deltas from mid-range values', () => {
  reset({ energy: 50, hunger: 60, happiness: 40 })
  store().rest()
  expect(store().energy).toBe(90)    // 50 + 40
  expect(store().hunger).toBe(55)    // 60 − 5
  expect(store().happiness).toBe(40) // unchanged
})

// ─── UT-CARE-007 ──────────────────────────────────────────────────────────────
// REQ-CARE-003
it('UT-CARE-007 — Rest does not modify Happiness under any value', () => {
  reset({ happiness: 77 })
  store().rest()
  expect(store().happiness).toBe(77) // exactly unchanged
})

// ─── UT-CARE-008 ──────────────────────────────────────────────────────────────
// REQ-CARE-003, REQ-CARE-005
it('UT-CARE-008 — Rest clamps Energy at 100 and Hunger at 0', () => {
  reset({ energy: 80, hunger: 3, happiness: 50 })
  store().rest()
  expect(store().energy).toBe(100)  // 80+40=120 → clamped
  expect(store().hunger).toBe(0)    // 3−5=−2 → clamped
  expect(store().happiness).toBe(50)
})

// ─── UT-CARE-009 ──────────────────────────────────────────────────────────────
// REQ-CARE-004
it('UT-CARE-009 — deltas are applied simultaneously from pre-action snapshot', () => {
  // energy=10: if sequential, the energy delta would read the modified energy,
  // but correct simultaneous application gives 10 + (−10) = 0.
  reset({ energy: 10, happiness: 50, hunger: 60 })
  store().play()
  expect(store().energy).toBe(0) // 10 − 10 = 0, clamped; not based on intermediate
})

// ─── UT-CARE-010 ──────────────────────────────────────────────────────────────
// REQ-CARE-006, REQ-PERS-007, REQ-PERS-009
it('UT-CARE-010 — EGG-001: Feed fully blocked when hunger = 91', () => {
  reset({ hunger: 91, happiness: 50, energy: 50 })
  store().feed()
  expect(store().hunger).toBe(91)    // no change
  expect(store().happiness).toBe(50) // no change
  expect(store().energy).toBe(50)    // no change
})

// ─── UT-CARE-011 ──────────────────────────────────────────────────────────────
// REQ-CARE-006
it('UT-CARE-011 — EGG-001: Feed blocked when hunger = 100', () => {
  reset({ hunger: 100 })
  store().feed()
  expect(store().hunger).toBe(100) // blocked, no change
})

// ─── UT-CARE-012 ──────────────────────────────────────────────────────────────
// REQ-CARE-006
it('UT-CARE-012 — EGG-001: Feed NOT blocked at hunger = 90 (boundary exclusive)', () => {
  reset({ hunger: 90, happiness: 50, energy: 50 })
  store().feed()
  expect(store().hunger).toBe(100) // 90+30=120 → 100; action executed
})

// ─── UT-CARE-013 ──────────────────────────────────────────────────────────────
// REQ-CARE-007, REQ-PERS-010
it('UT-CARE-013 — EGG-002: Play fully executes when energy = 15 (< 20)', () => {
  reset({ happiness: 50, hunger: 40, energy: 15 })
  store().play()
  expect(store().happiness).toBe(75) // action not blocked
  expect(store().hunger).toBe(30)
  expect(store().energy).toBe(5)
})

// ─── UT-CARE-014 ──────────────────────────────────────────────────────────────
// REQ-CARE-007
it('UT-CARE-014 — EGG-002: Play does NOT trigger EGG message when energy = 20 (boundary exclusive)', () => {
  reset({ energy: 20, happiness: 50, hunger: 40 })
  store().play()
  expect(store().petMessage).not.toBe('Zzz... too tired to play')
  expect(store().energy).toBe(10) // action executed normally
})

// ─── UT-CARE-015 ──────────────────────────────────────────────────────────────
// REQ-CARE-008
it('UT-CARE-015 — care actions do not directly trigger state machine transitions', () => {
  reset({ petState: 'Sick', hunger: 50, happiness: 50, energy: 50 })
  store().feed()
  store().play()
  store().rest()
  expect(store().petState).toBe('Sick') // only tick() evaluates the state machine
})
