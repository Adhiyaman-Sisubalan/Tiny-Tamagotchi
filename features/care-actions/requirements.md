# Requirements: Care Actions

## Requirement Index

| ID | Description |
|---|---|
| REQ-CARE-001 | A Feed action exists that applies Hunger +30, Happiness +5, Energy −5 simultaneously |
| REQ-CARE-002 | A Play action exists that applies Happiness +25, Hunger −10, Energy −10 simultaneously |
| REQ-CARE-003 | A Rest action exists that applies Energy +40, Hunger −5, Happiness unchanged (delta = 0) |
| REQ-CARE-004 | All stat deltas for an action are computed from the pre-action values and applied atomically |
| REQ-CARE-005 | Stats are clamped to [0, 100] after care action delta application (per REQ-VITALS-009) |
| REQ-CARE-006 | Feed is fully blocked (no stat mutation) when `hunger > 90` at the time of the action |
| REQ-CARE-007 | Play executes normally but triggers the EGG-002 message when `energy < 20` at the time of the action |
| REQ-CARE-008 | All three care action buttons are rendered and enabled regardless of current pet state |
| REQ-CARE-009 | Feed action (when not blocked by EGG-001) triggers a jump animation on the pet sprite and emits floating food particle emojis |
| REQ-CARE-010 | Play action (when EGG-002 does not fire) triggers a 360° spin animation on the pet sprite with a sparkle particle burst |
| REQ-CARE-011 | Rest action triggers a droop animation on the pet sprite with rising Zzz bubble particles |
| REQ-CARE-012 | Care action buttons display a physical press effect (downward translate + shadow reduction) while held |

---

## Acceptance Criteria

### REQ-CARE-001
- **Given** `hunger = 40, happiness = 60, energy = 70`,  
  **When** Feed is triggered,  
  **Then** `hunger = 70, happiness = 65, energy = 65`.
- **Given** `hunger = 80, happiness = 60, energy = 10` (hunger ≤ 90, so not blocked),  
  **When** Feed is triggered,  
  **Then** `hunger = 100` (clamped from 110), `happiness = 65`, `energy = 5`.
- **Given** `hunger = 50, energy = 3`,  
  **When** Feed is triggered,  
  **Then** `energy = 0` (clamped from −2).

### REQ-CARE-002
- **Given** `happiness = 50, hunger = 60, energy = 50`,  
  **When** Play is triggered,  
  **Then** `happiness = 75, hunger = 50, energy = 40`.
- **Given** `happiness = 90, hunger = 5, energy = 25` (energy ≥ 20, no EGG-002),  
  **When** Play is triggered,  
  **Then** `happiness = 100` (clamped from 115), `hunger = 0` (clamped from −5), `energy = 15`.

### REQ-CARE-003
- **Given** `energy = 50, hunger = 60, happiness = 40`,  
  **When** Rest is triggered,  
  **Then** `energy = 90, hunger = 55, happiness = 40`.
- **Given** `energy = 80, hunger = 3`,  
  **When** Rest is triggered,  
  **Then** `energy = 100` (clamped from 120), `hunger = 0` (clamped from −2).
- `happiness` is not modified by Rest under any circumstances; its value must be identical before and after.

### REQ-CARE-004
- Deltas must be calculated from a snapshot of all three stats taken before the action fires.
- No delta calculation may use a stat value that was already modified by another delta within the same action call.
- **Verification**: In a test where `energy = 10` and Play fires (`energy delta = −10`), the result is `energy = 0`. If deltas were applied sequentially and `happiness` used the modified energy (which it doesn't), the result would differ — this requirement guards against that bug.

### REQ-CARE-005
- After any care action, every stat is clamped via `clamp(value, 0, 100)` before writing to the store.
- This requirement delegates to REQ-VITALS-009; the same `clamp()` function must be used.
- No stat value outside [0, 100] may exist in the store after a care action completes.

### REQ-CARE-006
- **Given** `hunger = 91`,  
  **When** Feed is triggered,  
  **Then** `hunger`, `happiness`, and `energy` are all unchanged. The store is not mutated.
- **Given** `hunger = 100`,  
  **When** Feed is triggered,  
  **Then** Feed is blocked. No stat changes. (100 > 90 is true.)
- **Given** `hunger = 90`,  
  **When** Feed is triggered,  
  **Then** Feed executes normally. (90 is not > 90; EGG-001 does not apply.)
- See REQ-PERS-005, REQ-PERS-006, REQ-PERS-007 for the associated UI message behavior.

### REQ-CARE-007
- **Given** `energy = 15`,  
  **When** Play is triggered,  
  **Then** Play's deltas are fully applied (stat mutation occurs as per REQ-CARE-002).
- **Given** `energy = 19`,  
  **When** Play is triggered,  
  **Then** Play's deltas are applied and EGG-002 message is shown.
- **Given** `energy = 20`,  
  **When** Play is triggered,  
  **Then** Play's deltas are applied and EGG-002 message is NOT shown. (20 is not < 20.)
- See REQ-PERS-008, REQ-PERS-009 for the message display behavior.

### REQ-CARE-008
- The Feed, Play, and Rest buttons are rendered in the UI with `data-testid` attributes: `"action-feed"`, `"action-play"`, `"action-rest"`.
- All three buttons are enabled (not `disabled`) when `petState === 'Normal'`.
- All three buttons are enabled when `petState === 'Sick'`.
- All three buttons are enabled when `petState === 'Evolved'`.
- No care action is permanently locked based on pet state in the MVP.

### REQ-CARE-009
- **Given** Feed is not blocked by EGG-001 (i.e. `hunger ≤ 90`),  
  **When** the Feed button is clicked,  
  **Then** the pet sprite plays a one-shot jump animation (`reactionJump`, approx. 0.65 s).
- Simultaneously, 3 food particle elements appear near the sprite and float upward while fading out (`floatUp`, approx. 0.85 s, staggered by ~0.14 s each).
- Both the animation and particles are purely visual and do not affect any game state.

### REQ-CARE-010
- **Given** EGG-002 does not fire (i.e. `energy ≥ 20`),  
  **When** the Play button is clicked,  
  **Then** the pet sprite plays a one-shot 360° spin animation (`reactionSpin`, approx. 0.6 s).
- Simultaneously, 3 sparkle particle elements float upward while fading out (`floatUp`, approx. 0.85 s, staggered).
- When EGG-002 fires (`energy < 20`), the reaction is a droop animation instead (see REQ-PERS-018).

### REQ-CARE-011
- **When** the Rest button is clicked,  
  **Then** the pet sprite plays a one-shot droop animation (`reactionDroop`, approx. 0.8 s).
- Simultaneously, 3 "Z" / "z" bubble elements rise and fade from near the sprite (`zzzFloat`/`floatUp`, approx. 0.85 s, staggered).
- This animation fires unconditionally on every Rest click regardless of pet state.

### REQ-CARE-012
- Each care action button (Feed, Play, Rest) is styled as a physical circular button.
- **When** a button is held down (`:active` state),  
  **Then** the button translates downward by approximately 4–5 px and its bottom box-shadow (which simulates a raised edge) is reduced to zero, creating the appearance of a physical press.
- **When** the button is released,  
  **Then** the button returns to its resting position with the shadow restored.
- The transition between pressed and released states takes ≤ 0.1 s.
- This requirement is purely visual and does not affect the underlying action logic.
