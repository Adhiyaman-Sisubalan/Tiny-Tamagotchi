# Feature Plan: Care Actions

## Overview

Care Actions are the three player-driven interactions available at all times during gameplay: **Feed**, **Play**, and **Rest**. Each action applies a set of stat deltas simultaneously to the pet's vitals, followed by clamping. The actions represent the primary agency the player has over their pet's wellbeing.

Two of the three actions have associated Personality easter eggs that conditionally modify their execution: EGG-001 can block Feed entirely; EGG-002 allows Play to execute but attaches a timed message. These behaviors are defined in full in `features/personality/feature-plan.md` and referenced here by their REQ IDs.

State machine transitions are not triggered immediately by care actions — they evaluate only on the next tick. See `features/state-machine/feature-plan.md`.

## User Stories

- **US-CARE-1**: As a player, I can feed my pet to restore its Hunger so it doesn't get sick from starvation.
- **US-CARE-2**: As a player, I can play with my pet to boost its Happiness so it stays content — at the cost of energy and hunger.
- **US-CARE-3**: As a player, I can put my pet to rest to restore its Energy so it can keep playing.
- **US-CARE-4**: As a player, the tradeoffs between care actions feel realistic: feeding tires the pet slightly; playing is taxing on both hunger and energy.

## Actions and Deltas

All deltas are applied simultaneously. "Simultaneously" means each delta is calculated from the pre-action value of its stat, not from the value after another delta in the same action has been applied.

### Feed

| Stat | Delta |
|---|---|
| Hunger | +30 |
| Happiness | +5 |
| Energy | −5 |

**Narrative**: Eating fills the pet up and provides a small mood boost, but the digestive work costs a little energy.

**Easter egg guard** (EGG-001, REQ-PERS-005): If `hunger > 90` at the moment Feed is triggered, the action is **blocked entirely** — no deltas are applied, no state changes occur. The pet displays "I'm not hungry!" (REQ-PERS-006). The condition is strictly greater than 90; `hunger === 90` does not block.

### Play

| Stat | Delta |
|---|---|
| Happiness | +25 |
| Hunger | −10 |
| Energy | −10 |

**Narrative**: Playing is joyful but physically demanding — it burns both calories and energy.

**Easter egg message** (EGG-002, REQ-PERS-008): If `energy < 20` at the moment Play is triggered, the action **executes normally** (all deltas are applied) but the pet displays "Zzz... too tired to play" for 3 seconds (REQ-PERS-009). The condition is strictly less than 20; `energy === 20` does not trigger.

### Rest

| Stat | Delta |
|---|---|
| Energy | +40 |
| Hunger | −5 |
| Happiness | +0 |

**Narrative**: Sleeping restores energy and burns a small amount of calories. It has no direct effect on mood.

**Note**: Happiness delta is exactly 0. The `happiness` field must not be modified by Rest in any code path.

## Application Algorithm

```typescript
const ACTION_DELTAS: Record<Action, StatDeltas> = {
  feed:  { hunger: +30, happiness: +5,  energy: -5  },
  play:  { hunger: -10, happiness: +25, energy: -10 },
  rest:  { hunger: -5,  happiness: 0,   energy: +40 },
}

function applyAction(action: Action, currentStats: Stats): Stats {
  // EGG-001: block feed if hunger > 90
  if (action === 'feed' && currentStats.hunger > 90) {
    return currentStats  // no mutation
  }

  const deltas = ACTION_DELTAS[action]
  return {
    hunger:    clamp(currentStats.hunger    + deltas.hunger,    0, 100),
    happiness: clamp(currentStats.happiness + deltas.happiness, 0, 100),
    energy:    clamp(currentStats.energy    + deltas.energy,    0, 100),
  }
}
```

The EGG-002 message is a side effect at the UI/store level and does not affect the stat calculation path.

## Delta Table Summary

| Action | Hunger | Happiness | Energy |
|---|---|---|---|
| Feed | +30 | +5 | −5 |
| Play | −10 | +25 | −10 |
| Rest | −5 | 0 | +40 |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Feed when `hunger = 100` | EGG-001 triggers (100 > 90). Feed blocked. No stat change. |
| Feed when `hunger = 91` | EGG-001 triggers. Feed blocked. |
| Feed when `hunger = 90` | EGG-001 does NOT trigger (90 is not > 90). Feed executes: `hunger = 100` (clamped from 120). |
| Feed when `hunger = 80, energy = 3` | No EGG-001. Executes: `hunger = 100` (clamped), `happiness += 5`, `energy = 0` (clamped from −2). |
| Play when `energy = 0` | EGG-002 triggers (0 < 20). Play executes: `happiness += 25`, `hunger −= 10`, `energy = 0` (clamped from −10). |
| Play when `energy = 20` | EGG-002 does NOT trigger (20 is not < 20). Play executes normally. |
| Rest when `energy = 100` | `energy = 100` (clamped from 140). `hunger −= 5`. `happiness` unchanged. |
| Rest when `hunger = 3` | `hunger = 0` (clamped from −2). Rest otherwise executes normally. |
| Care action while `petState === 'Sick'` | All three actions available and execute normally. State machine re-evaluates on next tick, not immediately after action. |
| Care action while `petState === 'Evolved'` | All three actions available and execute normally. Evolved vitals remain active. |
| Rapid repeated button clicks | Each click is processed independently. EGG-001 guard re-evaluates `hunger` on each click; if still > 90, each click is blocked. |
