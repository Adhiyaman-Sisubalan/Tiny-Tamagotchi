/**
 * Component and hook tests for the Personality feature.
 * Tests NamingScreen validation, MessageToast auto-dismiss, and useIdleQuip timing.
 * Uses @testing-library/react + vi.useFakeTimers().
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, render, screen, fireEvent, renderHook } from '@testing-library/react'
import { NamingScreen } from '../../components/NamingScreen'
import { MessageToast } from '../../components/MessageToast'
import { useIdleQuip } from '../../hooks/useIdleQuip'
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
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ─── NamingScreen component ───────────────────────────────────────────────────

// UT-PERS-001
// REQ-PERS-001
it('UT-PERS-001 — NamingScreen renders naming form (name-input + name-submit)', () => {
  render(<NamingScreen />)
  expect(screen.getByTestId('name-input')).toBeInTheDocument()
  expect(screen.getByTestId('name-submit')).toBeInTheDocument()
})

// UT-PERS-003
// REQ-PERS-003
it('UT-PERS-003 — NamingScreen rejects name shorter than 2 characters', () => {
  render(<NamingScreen />)
  fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'X' } })
  fireEvent.click(screen.getByTestId('name-submit'))
  expect(screen.getByRole('alert')).toBeInTheDocument()
  expect(store().petName).toBe('') // not saved
})

// UT-PERS-004
// REQ-PERS-003
it('UT-PERS-004 — NamingScreen rejects name longer than 20 characters', () => {
  render(<NamingScreen />)
  fireEvent.change(screen.getByTestId('name-input'), {
    target: { value: 'A'.repeat(21) },
  })
  fireEvent.click(screen.getByTestId('name-submit'))
  expect(screen.getByRole('alert')).toBeInTheDocument()
  expect(store().petName).toBe('')
})

// UT-PERS-005
// REQ-PERS-003
it('UT-PERS-005 — NamingScreen accepts name of exactly 2 characters', () => {
  render(<NamingScreen />)
  fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Pi' } })
  fireEvent.click(screen.getByTestId('name-submit'))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(store().petName).toBe('Pi')
})

// UT-PERS-006
// REQ-PERS-003
it('UT-PERS-006 — NamingScreen accepts name of exactly 20 characters', () => {
  const name = 'A'.repeat(20)
  render(<NamingScreen />)
  fireEvent.change(screen.getByTestId('name-input'), { target: { value: name } })
  fireEvent.click(screen.getByTestId('name-submit'))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(store().petName).toBe(name)
})

// UT-PERS-007 (component-level trim + validation)
// REQ-PERS-003
it('UT-PERS-007 — NamingScreen trims whitespace before validating and saving', () => {
  render(<NamingScreen />)
  fireEvent.change(screen.getByTestId('name-input'), { target: { value: '  ab  ' } })
  fireEvent.click(screen.getByTestId('name-submit'))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(store().petName).toBe('ab')
})

it('UT-PERS-007b — single character after trim is rejected', () => {
  render(<NamingScreen />)
  fireEvent.change(screen.getByTestId('name-input'), { target: { value: ' a ' } })
  fireEvent.click(screen.getByTestId('name-submit'))
  expect(screen.getByRole('alert')).toBeInTheDocument()
})

// ─── MessageToast auto-dismiss ────────────────────────────────────────────────

// UT-PERS-012
// REQ-PERS-008
it('UT-PERS-012 — EGG-001 message auto-dismisses after 3 seconds', () => {
  vi.useFakeTimers()
  usePetStore.setState({ petMessage: "I'm not hungry!" })

  render(<MessageToast />)
  expect(screen.getByTestId('pet-message')).toBeInTheDocument()
  expect(screen.getByTestId('pet-message')).toHaveTextContent("I'm not hungry!")

  act(() => vi.advanceTimersByTime(3_000))

  expect(screen.queryByTestId('pet-message')).not.toBeInTheDocument()
})

// UT-PERS-016
// REQ-PERS-011
it('UT-PERS-016 — EGG-002 message auto-dismisses after 3 seconds', () => {
  vi.useFakeTimers()
  usePetStore.setState({ petMessage: 'Zzz... too tired to play' })

  render(<MessageToast />)
  expect(screen.getByTestId('pet-message')).toHaveTextContent('Zzz... too tired to play')

  act(() => vi.advanceTimersByTime(3_000))

  expect(screen.queryByTestId('pet-message')).not.toBeInTheDocument()
})

// REQ-PERS-016 — replacement restarts the dismiss timer
it('new message replaces existing message and restarts the 3-second timer', () => {
  vi.useFakeTimers()
  usePetStore.setState({ petMessage: "I'm not hungry!" })
  const { rerender } = render(<MessageToast />)

  // 2 seconds into the first message's timer
  act(() => vi.advanceTimersByTime(2_000))
  expect(screen.getByTestId('pet-message')).toBeInTheDocument()

  // Replace with a new message — timer should restart
  act(() => {
    usePetStore.setState({ petMessage: 'Zzz... too tired to play' })
    rerender(<MessageToast />)
  })
  expect(screen.getByTestId('pet-message')).toHaveTextContent('Zzz... too tired to play')

  // Advance 2 more seconds (4 s total since first msg, 2 s since replacement)
  act(() => vi.advanceTimersByTime(2_000))
  expect(screen.getByTestId('pet-message')).toBeInTheDocument() // still visible

  // Advance 1 more second (3 s since replacement)
  act(() => vi.advanceTimersByTime(1_000))
  expect(screen.queryByTestId('pet-message')).not.toBeInTheDocument()
})

// ─── useIdleQuip hook ─────────────────────────────────────────────────────────

// UT-PERS-018
// REQ-PERS-012, REQ-PERS-013
it('UT-PERS-018 — idle quip fires and contains one of the 3 defined strings after 60 s', () => {
  vi.useFakeTimers()
  const t0 = Date.now()
  renderHook(() => useIdleQuip(t0))

  act(() => vi.advanceTimersByTime(60_000))

  const message = store().petMessage
  const QUIPS = [
    'Hello? Is anyone there...?',
    'I could really use a snack right now.',
    'Just gonna stare at the wall, I guess.',
  ]
  expect(QUIPS).toContain(message)
})

// UT-PERS-019
// REQ-PERS-013
describe('UT-PERS-019 — idle quip is selected from exactly the 3 defined strings', () => {
  const QUIPS = [
    'Hello? Is anyone there...?',
    'I could really use a snack right now.',
    'Just gonna stare at the wall, I guess.',
  ] as const

  it('Math.random() = 0.0 → first quip', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    const t0 = Date.now()
    renderHook(() => useIdleQuip(t0))
    act(() => vi.advanceTimersByTime(60_000))
    expect(store().petMessage).toBe(QUIPS[0])
  })

  it('Math.random() = 0.34 → second quip', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.34)
    const t0 = Date.now()
    renderHook(() => useIdleQuip(t0))
    act(() => vi.advanceTimersByTime(60_000))
    expect(store().petMessage).toBe(QUIPS[1])
  })

  it('Math.random() = 0.67 → third quip', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.67)
    const t0 = Date.now()
    renderHook(() => useIdleQuip(t0))
    act(() => vi.advanceTimersByTime(60_000))
    expect(store().petMessage).toBe(QUIPS[2])
  })
})

// UT-PERS-020
// REQ-PERS-014
it('UT-PERS-020 — idle quip auto-dismisses after 5 seconds', () => {
  vi.useFakeTimers()
  const t0 = Date.now()
  renderHook(() => useIdleQuip(t0))

  act(() => vi.advanceTimersByTime(60_000)) // quip fires
  expect(store().petMessage).not.toBe('')

  act(() => vi.advanceTimersByTime(5_000)) // dismiss timer
  expect(store().petMessage).toBe('')
})

// UT-PERS-021
// REQ-PERS-015
it('UT-PERS-021 — idle timer resets when lastActionTime changes (simulating a care action)', () => {
  vi.useFakeTimers()
  let lastAction = Date.now() // t = 0

  const { rerender } = renderHook(({ t }: { t: number }) => useIdleQuip(t), {
    initialProps: { t: lastAction },
  })

  // 55 s pass — almost at the quip threshold
  act(() => vi.advanceTimersByTime(55_000))

  // Simulate a care action: update lastActionTime
  act(() => {
    lastAction = Date.now() // t = 55 000
    rerender({ t: lastAction })
  })

  // Only 10 s since the action — quip should NOT fire
  act(() => vi.advanceTimersByTime(10_000))

  const QUIPS = [
    'Hello? Is anyone there...?',
    'I could really use a snack right now.',
    'Just gonna stare at the wall, I guess.',
  ]
  expect(QUIPS).not.toContain(store().petMessage)
})

// UT-PERS-022
// REQ-PERS-015
it('UT-PERS-022 — idle timer resets even when a care action is blocked (EGG-001)', () => {
  vi.useFakeTimers()
  // hunger > 90 → Feed will be blocked, but ActionButtons still calls onAction
  reset({ hunger: 95 })
  let lastAction = Date.now()

  const { rerender } = renderHook(({ t }: { t: number }) => useIdleQuip(t), {
    initialProps: { t: lastAction },
  })

  act(() => vi.advanceTimersByTime(55_000))

  // EGG-001 fires (Feed blocked) but onAction() still updates lastActionTime in App
  act(() => {
    store().feed() // blocked — no stat change
    lastAction = Date.now() // App.handleAction() would do this
    rerender({ t: lastAction })
  })

  act(() => vi.advanceTimersByTime(10_000))

  const QUIPS = [
    'Hello? Is anyone there...?',
    'I could really use a snack right now.',
    'Just gonna stare at the wall, I guess.',
  ]
  // Only 10 s since the action — quip should not have fired yet
  expect(QUIPS).not.toContain(store().petMessage)
})
