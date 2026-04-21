# Requirements: Personality & Easter Eggs

## Requirement Index

| ID | Description |
|---|---|
| REQ-PERS-001 | Naming screen is shown on first load when no `petName` is saved |
| REQ-PERS-002 | Naming screen is skipped when `petName` exists in localStorage |
| REQ-PERS-003 | Pet name input accepts 2–20 characters (after trimming); submission blocked outside this range |
| REQ-PERS-004 | Pet name is persisted to `localStorage` on valid submission |
| REQ-PERS-005 | No rename mechanic exists; naming screen never appears again after initial submission |
| REQ-PERS-006 | Pet name is displayed in the main UI |
| REQ-PERS-007 | EGG-001: Feed is blocked when `hunger > 90` (strictly greater than 90) |
| REQ-PERS-008 | EGG-001: "I'm not hungry!" message is shown for 3 seconds when Feed is blocked |
| REQ-PERS-009 | EGG-001: No stat changes occur when Feed is blocked (store not mutated) |
| REQ-PERS-010 | EGG-002: Play executes normally when `energy < 20` (strictly less than 20) |
| REQ-PERS-011 | EGG-002: "Zzz... too tired to play" message is shown for 3 seconds when EGG-002 fires |
| REQ-PERS-012 | EGG-003: No-interaction timer triggers a random idle quip after 60 consecutive seconds without a care action |
| REQ-PERS-013 | EGG-003: Quip is selected uniformly at random from exactly 3 predefined strings |
| REQ-PERS-014 | EGG-003: Idle quip is shown for 5 seconds then auto-dismissed |
| REQ-PERS-015 | EGG-003: Interaction timer resets to 0 on any Feed, Play, or Rest action (blocked or not) |
| REQ-PERS-016 | A new message replaces any currently visible pet-message and restarts the auto-dismiss timer |
| REQ-PERS-017 | EGG-001 triggers a left-right rejection shake animation on the pet sprite |
| REQ-PERS-018 | EGG-002 triggers a droop animation on the pet sprite simultaneous with the play action and message |

---

## Acceptance Criteria

### REQ-PERS-001
- **Given** `localStorage` does not contain a `petName` field (or the value is empty after trimming),  
  **When** the app loads,  
  **Then** a naming screen is rendered with `data-testid="name-input"` and `data-testid="name-submit"`.
- The main game UI (stat bars, care buttons) is not rendered until a valid name is submitted.

### REQ-PERS-002
- **Given** `localStorage` contains `petName = "Pip"`,  
  **When** the app loads,  
  **Then** the naming screen is not rendered; the main game UI is shown immediately.

### REQ-PERS-003
- **Given** the naming screen is shown,  
  **When** the user enters a name of fewer than 2 characters (after trimming) and clicks submit,  
  **Then** an inline validation error is displayed and `petName` is not saved.
- **Given** the user enters a name of exactly 2 characters, **Then** submission succeeds.
- **Given** the user enters a name of exactly 20 characters, **Then** submission succeeds.
- **Given** the user enters a name of 21 characters, **Then** an inline validation error is displayed and submission is blocked.
- Whitespace trimming is applied before length validation: `"  ab  "` is treated as `"ab"` (length 2, valid).

### REQ-PERS-004
- **When** a valid name is submitted,  
  **Then** `JSON.parse(localStorage.getItem('tamogotchi-store')).state.petName` equals the submitted name (trimmed).

### REQ-PERS-005
- No button, link, or UI element exists in the main game UI that allows the user to change their pet's name.
- The naming screen does not appear after `petName` is set.

### REQ-PERS-006
- A `data-testid="pet-name"` element is present in the main game UI.
- Its text content matches the stored `petName` exactly.

### REQ-PERS-007
- **Given** `hunger = 91`,  
  **When** the Feed button is clicked,  
  **Then** the action is blocked (store not mutated). (91 > 90 is true.)
- **Given** `hunger = 90`,  
  **When** the Feed button is clicked,  
  **Then** the action executes normally. (90 is not > 90.)
- Cross-reference: REQ-CARE-006.

### REQ-PERS-008
- **Given** EGG-001 fires,  
  **Then** `data-testid="pet-message"` is visible and its text content is exactly `"I'm not hungry!"`.
- The message is visible for 3 seconds, then auto-dismissed (element hidden or text cleared).

### REQ-PERS-009
- **Given** EGG-001 fires (`hunger > 90`),  
  **Then** `hunger`, `happiness`, and `energy` in the store are identical before and after the Feed click.
- Cross-reference: REQ-CARE-006.

### REQ-PERS-010
- **Given** `energy = 15`,  
  **When** Play is triggered,  
  **Then** all Play deltas are applied (Happiness +25, Hunger −10, Energy −10, then clamp). The action is not suppressed.
- **Given** `energy = 20`,  
  **When** Play is triggered,  
  **Then** EGG-002 is not triggered. (20 is not < 20.)
- Cross-reference: REQ-CARE-007.

### REQ-PERS-011
- **Given** EGG-002 fires,  
  **Then** `data-testid="pet-message"` is visible and its text content is exactly `"Zzz... too tired to play"`.
- The message is visible for 3 seconds, then auto-dismissed.

### REQ-PERS-012
- A timer tracks elapsed time since the last care action (Feed, Play, or Rest — blocked Feed counts too, see REQ-PERS-015).
- **When** 60 consecutive seconds pass without a care action,  
  **Then** a random idle quip fires.
- The timer begins counting from 0 on app load and on every care action.

### REQ-PERS-013
- The idle quip is selected from exactly these 3 strings using `Math.random()`:
  1. `"Hello? Is anyone there...?"`
  2. `"I could really use a snack right now."`
  3. `"Just gonna stare at the wall, I guess."`
- No other strings are used. The selection is uniformly random (each has equal probability).

### REQ-PERS-014
- The idle quip is displayed in `data-testid="pet-message"` for **5 seconds**, then auto-dismissed.
- After dismissal, the idle timer resets to 0 and begins counting again toward the next potential quip.

### REQ-PERS-015
- **When** the player clicks Feed (whether EGG-001 fires or not), the idle timer resets to 0.
- **When** the player clicks Play, the idle timer resets to 0.
- **When** the player clicks Rest, the idle timer resets to 0.
- The idle timer is not reset by tab visibility changes, page scroll, or mouse movement — only care actions.

### REQ-PERS-016
- **Given** a pet-message is currently visible,  
  **When** a new message is triggered (any easter egg),  
  **Then** the new message immediately replaces the current one and the auto-dismiss timer restarts from 0 for the new message's duration.
- The element `data-testid="pet-message"` shows at most one message at any time.

### REQ-PERS-017
- **Given** EGG-001 fires (`hunger > 90` and the Feed button is clicked),  
  **Then** the pet sprite plays a one-shot left-right rejection shake animation (`reactionShake`, approx. 0.5 s).
- The shake animation fires simultaneously with the EGG-001 message appearing (REQ-PERS-008).
- This animation replaces the normal Feed jump animation (REQ-CARE-009) for this blocked case; the two animations do not occur together.
- This requirement is purely visual and does not affect the EGG-001 stat guard logic (REQ-PERS-007, REQ-PERS-009).

### REQ-PERS-018
- **Given** EGG-002 fires (`energy < 20` and the Play button is clicked),  
  **Then** the pet sprite plays a one-shot droop animation (`reactionDroop`, approx. 0.8 s).
- The droop animation fires simultaneously with the EGG-002 message appearing (REQ-PERS-011) and the play action stat deltas being applied.
- This animation replaces the normal Play spin animation (REQ-CARE-010) for this tired case.
- This requirement is purely visual and does not affect the EGG-002 logic (REQ-PERS-010, REQ-PERS-011).
