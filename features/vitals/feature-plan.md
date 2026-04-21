# Feature Plan: Vitals System

## Overview

The Vitals System is the heartbeat of the pet simulation. It maintains three numeric stats — **Hunger**, **Happiness**, and **Energy** — each an integer in the range [0, 100] inclusive. A background tick fires every 10 real-world seconds while the browser tab is visible, decaying each stat by a fixed amount. Stats are clamped after every mutation regardless of source. Vitals and their associated counters are persisted to `localStorage` via the Zustand `persist` middleware so they survive page reloads.

The Vitals System provides the raw data that the State Machine (see `features/state-machine/feature-plan.md`) evaluates after every tick. The Care Actions feature (see `features/care-actions/feature-plan.md`) is the primary mechanism by which the user modifies stats.

## User Stories

- **US-VITALS-1**: As a player, I can see my pet's current Hunger, Happiness, and Energy values at all times so I know when to take action.
- **US-VITALS-2**: As a player, my pet's stats gradually decrease over time so there is ongoing incentive to return and care for my pet.
- **US-VITALS-3**: As a player, my pet's stats are saved when I close the tab so I don't lose progress on reload.
- **US-VITALS-4**: As a player, stats do not continue to decay while my tab is hidden so I am not penalized for multitasking.

## Stats Definition

| Stat | Initial Value | Min | Max | Meaning |
|---|---|---|---|---|
| Hunger | 50 | 0 | 100 | How fed the pet is; 100 = full, 0 = starving |
| Happiness | 50 | 0 | 100 | How content the pet is; 100 = elated, 0 = miserable |
| Energy | 50 | 0 | 100 | How rested the pet is; 100 = fully rested, 0 = exhausted |

Initial value of 50 provides a balanced starting point — neither perfectly healthy nor immediately in crisis — giving the player time to orient before the first Sick risk.

## Tick Algorithm

The tick is the atomic unit of game time. One tick = 10 seconds of real wall-clock time (tab visible).

```
every 10_000 ms, while document.visibilityState === 'visible':
  hunger    = clamp(hunger    − 3, 0, 100)
  happiness = clamp(happiness − 2, 0, 100)
  energy    = clamp(energy    − 1, 0, 100)
  evaluateStateMachine()          // see state-machine feature
  persistStoreTolocalStorage()    // automatic via Zustand persist middleware
```

Decay values per tick:

| Stat | Decay |
|---|---|
| Hunger | −3 |
| Happiness | −2 |
| Energy | −1 |

At these decay rates from a starting point of 50/50/50:
- Hunger reaches the Sick threshold (< 20) after approximately 10 ticks (100 seconds) with no care.
- Happiness reaches the Sick threshold after approximately 15 ticks (150 seconds) with no care.
- Energy reaches the Sick threshold after approximately 30 ticks (300 seconds) with no care.

## Tick Timer Implementation

The tick interval is managed by the Zustand store's tick engine, initialized in a React effect:

```typescript
// start tick engine
let tickIntervalId: ReturnType<typeof setInterval> | null = null

function startTick() {
  tickIntervalId = setInterval(() => store.getState().tick(), 10_000)
}

function stopTick() {
  if (tickIntervalId !== null) {
    clearInterval(tickIntervalId)
    tickIntervalId = null
  }
}

// Page Visibility API integration
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    stopTick()
  } else {
    startTick()
  }
})

// Initialize on mount (if tab is already visible)
if (document.visibilityState === 'visible') {
  startTick()
}
```

Key properties:
- The interval is cleared (not paused) when the tab hides. No catch-up ticks fire when the tab returns.
- When the tab becomes visible, a fresh interval starts from 0 — the next tick fires 10 seconds after visibility is restored.
- On initial page load, if `document.visibilityState === 'visible'`, the tick engine starts immediately.

## Clamping Rule

After every mutation from any source (tick decay, care action, or direct store initialization), each stat is independently clamped:

```typescript
const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)
```

This function is the single source of truth for range enforcement. It must be called on every stat after every write. No stat value outside [0, 100] may exist in the store at any observable moment.

## Persistence

The Zustand store uses the `persist` middleware with the following configuration:
- **Storage key**: `"tamogotchi-store"`
- **Storage target**: `localStorage`
- **Serialization**: Default JSON (all store values are JSON-serializable primitives)
- **Scope**: The entire store is persisted (vitals, state machine fields, counters, pet name)

On initial mount, the middleware checks for the key in `localStorage`:
- **Key found**: Store rehydrates from the saved JSON. Saved stats, state, and counters are restored.
- **Key not found**: Store initializes from defaults (50/50/50, `'Normal'`, all counters at 0).
- **Key found but malformed JSON**: The middleware treats this as missing; defaults are used and the key is overwritten on the next write.

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Stat already at 0, tick fires | Stat remains 0; clamp prevents negative values |
| Stat at 100, care action adds to it | Stat is clamped to 100 |
| Tab hidden for 30 minutes, returns to visible | No catch-up ticks. Stats are identical to their value at the moment the tab was hidden. Tick restarts from 0. |
| localStorage corrupted / unreadable JSON | Store initializes from defaults (50/50/50). Corrupted key is overwritten on the next write. |
| Multiple tabs open simultaneously | Each tab maintains its own tick loop and writes independently. Last write wins in localStorage. This is an accepted MVP limitation (see `tech-stack.md`). |
| Page hidden immediately on load | Tick engine never starts. Stats remain at rehydrated or default values until the tab is made visible. |
