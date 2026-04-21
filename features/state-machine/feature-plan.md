# Feature Plan: State Machine

## Overview

The State Machine governs the pet's overall condition and appearance. The pet is always in exactly one of three states: **Normal**, **Sick**, or **Evolved**. State is evaluated after every tick, following stat decay. Transitions are driven by stat threshold conditions and consecutive-tick counters. Evolved is a permanent state with respect to Normal/Evolved regression — a pet that was Evolved before getting Sick returns to Evolved upon recovery, not Normal. The current state is displayed visually with a distinct appearance per state.

State machine evaluation is tightly coupled to the tick engine (see `features/vitals/feature-plan.md`). Care actions do not directly trigger state transitions.

## User Stories

- **US-STATE-1**: As a player, I can see my pet's current condition (Normal, Sick, or Evolved) at a glance so I know if immediate action is needed.
- **US-STATE-2**: As a player, if I neglect my pet and any stat drops very low, it becomes Sick — a clear negative signal that motivates action.
- **US-STATE-3**: As a player, if I nurse a Sick pet back to sustained health, it recovers to its prior healthy state.
- **US-STATE-4**: As a player, if I maintain excellent care across all stats for an extended period, my pet permanently Evolves — a reward for dedication.

## States

| State | Description | Visual Treatment |
|---|---|---|
| Normal | Default healthy state. All transitions possible. | Neutral appearance |
| Sick | Triggered by neglect (any stat < 20). Blocks evolution. | Distinct "unwell" appearance (e.g., pale color, drooping) |
| Evolved | Permanent reward state. Achieved via sustained excellence. | Distinct "glowing" or enhanced appearance |

## Store Fields

| Field | Type | Description |
|---|---|---|
| `petState` | `'Normal' \| 'Sick' \| 'Evolved'` | Current state |
| `hasEvolved` | `boolean` | Permanently `true` once Evolved is first reached. Used so an Evolved pet that goes Sick recovers back to Evolved, not Normal. |
| `recoveryTicks` | `number` | Consecutive ticks where all stats ≥ 50 while in `Sick` state. Must reach 3 for recovery. |
| `evolutionTicks` | `number` | Consecutive ticks where all stats ≥ 80 while in `Normal` state. Must reach 10 for evolution. |

All four fields are persisted to `localStorage`.

## Transition Rules

### Normal → Sick
- **Condition**: Any single stat (`hunger`, `happiness`, or `energy`) is strictly below 20.
- **Evaluated on**: Every tick, after decay is applied and stats are clamped.
- **Effect**: `petState = 'Sick'`. `evolutionTicks = 0`.
- **Applies from**: `Normal` state only (Evolved → Sick has the same condition but is a separate case).

### Evolved → Sick
- **Condition**: Any single stat is strictly below 20.
- **Effect**: `petState = 'Sick'`. `hasEvolved` remains `true`.
- **Note**: `Evolved` is permanent on the Normal/Evolved axis. Getting Sick from an Evolved state is a temporary setback.

### Sick → Normal or Sick → Evolved (Recovery)
- **Condition**: All three stats are ≥ 50 for exactly 3 consecutive ticks while in `Sick` state.
- **Counter behavior**:
  - Each tick where all stats ≥ 50: `recoveryTicks++`
  - Any tick where any stat < 50: `recoveryTicks = 0`
- **Effect when `recoveryTicks >= 3`**: `petState = hasEvolved ? 'Evolved' : 'Normal'`. `recoveryTicks = 0`.
- **The `hasEvolved` flag**: Ensures an Evolved pet that recovers from Sick returns to Evolved, honoring the "Evolved is permanent" invariant.

### Normal → Evolved
- **Condition**: All three stats are ≥ 80 for exactly 10 consecutive ticks while in `Normal` state.
- **Counter behavior**:
  - Each tick where all stats ≥ 80: `evolutionTicks++`
  - Any tick where any stat < 80: `evolutionTicks = 0`
- **Blocked by**: `Sick` state. The evolution check does not run if `petState !== 'Normal'`.
- **Effect when `evolutionTicks >= 10`**: `petState = 'Evolved'`. `hasEvolved = true`. `evolutionTicks = 10` (no further writes; already Evolved).

## Tick Evaluation Order

Each call to `tick()` executes these steps sequentially:

```
1. Apply decay to all stats (Hunger −3, Happiness −2, Energy −1)
2. Clamp all stats to [0, 100]
3. Evaluate state machine:

   if petState === 'Sick':
     if hunger >= 50 AND happiness >= 50 AND energy >= 50:
       recoveryTicks++
     else:
       recoveryTicks = 0
     if recoveryTicks >= 3:
       petState = hasEvolved ? 'Evolved' : 'Normal'
       recoveryTicks = 0
     // note: no Sick→Sick re-evaluation needed; already Sick

   else if petState === 'Normal':
     if hunger < 20 OR happiness < 20 OR energy < 20:
       petState = 'Sick'
       evolutionTicks = 0
     else if hunger >= 80 AND happiness >= 80 AND energy >= 80:
       evolutionTicks++
       if evolutionTicks >= 10:
         petState = 'Evolved'
         hasEvolved = true
     else:
       evolutionTicks = 0

   else if petState === 'Evolved':
     if hunger < 20 OR happiness < 20 OR energy < 20:
       petState = 'Sick'
       recoveryTicks = 0
     // evolution check skipped: already Evolved

4. Persist updated store to localStorage
```

## Counter Semantics

- `recoveryTicks` counts consecutive qualifying ticks while `Sick`. A break in the streak resets it to 0.
- `evolutionTicks` counts consecutive qualifying ticks while `Normal`. A break resets it to 0.
- A transition to `Sick` always resets `evolutionTicks`. A recovery from `Sick` always resets `recoveryTicks`.
- Both counters initialize to 0 and are stored in `localStorage`.

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Any stat exactly 20 while Normal | No Sick transition; 20 is not < 20 |
| Any stat exactly 19 while Normal | Sick transition fires |
| All stats exactly 80 while Normal | `evolutionTicks++` (80 ≥ 80 is true) |
| All stats exactly 79 while Normal | `evolutionTicks = 0` |
| Sick pet, 2 recovery ticks, one stat drops to 49 on tick 3 | `recoveryTicks = 0`; remains Sick |
| Sick pet, 3 recovery ticks met exactly | Recovery fires; `recoveryTicks = 0` |
| Normal pet, evolution at tick 9, stat drops to 79 on tick 10 | `evolutionTicks = 0`; must restart from 0 |
| Sick pet, all stats ≥ 80 | Recovery check uses ≥ 50 threshold, not 80. Recovery proceeds normally. |
| Evolved pet gets Sick; all stats ≥ 50 for 3 ticks | Returns to `'Evolved'` (not `'Normal'`) because `hasEvolved === true` |
| Evolved pet, can it re-evolve? | Already Evolved; evolution check is skipped entirely |
| `petState` transitions to `Sick` while `evolutionTicks = 9` | `evolutionTicks = 0`; must restart from 0 after recovery |
