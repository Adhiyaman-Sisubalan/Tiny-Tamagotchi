# Feature Plan: Personality & Easter Eggs

## Overview

The Personality feature adds character to the pet through three easter eggs and a first-run naming experience. Two easter eggs conditionally modify care action behavior (EGG-001 blocks Feed; EGG-002 messages on Play). One easter egg fires on prolonged player inactivity (EGG-003). The naming screen provides the pet's identity and is shown exactly once.

All personality messages are displayed in a dedicated UI region (`data-testid="pet-message"`) and auto-dismiss after their defined duration. The naming screen is a full-screen interstitial shown before the main game UI on first load.

## User Stories

- **US-PERS-1**: As a player, I give my pet a name on first launch so it feels like mine.
- **US-PERS-2**: As a player, my pet pushes back when I overfeed it — it says "I'm not hungry!" and nothing happens — so interactions feel alive.
- **US-PERS-3**: As a player, my pet complains when I make it play while exhausted — it mumbles "Zzz..." — adding personality without blocking my choice.
- **US-PERS-4**: As a player, my pet says something amusing when I leave it alone for a while, making me feel like it has an inner life.

## Pet Naming

### Flow
1. On app load, check `localStorage` for a saved `petName` value.
2. If `petName` is absent or empty: show the **naming screen** (full-screen or modal interstitial). The main game UI is not rendered until a valid name is submitted.
3. If `petName` is present: skip the naming screen; show the main game UI immediately.

### Naming Screen Specification
- Displays a prompt (e.g., "Name your pet")
- Contains a text input with `data-testid="name-input"`
- Submit button with `data-testid="name-submit"`
- Validation: name must be 2–20 characters (inclusive), non-empty after trimming whitespace
- On valid submission: `petName` is saved to the store (and thus `localStorage`); naming screen unmounts; main UI renders
- On invalid submission: an inline validation error is shown; the user may retry
- No rename mechanic exists after initial submission

### Name Display
- The pet's name appears in the main game UI with `data-testid="pet-name"`.

## EGG-001 — Overfeeding Block

**Trigger**: Player clicks Feed when `hunger > 90`.  
**Condition is checked before** any stat mutation. The check is exclusive (strictly greater than 90); `hunger === 90` does not trigger.

**Behavior**:
- Feed action is fully suppressed: no stat changes occur.
- The pet displays the message: **"I'm not hungry!"**
- Message auto-dismisses after **3 seconds**.
- The Feed button remains available for future clicks.

**Interaction with stats**: None. The store is not mutated by a blocked Feed.

**Example scenarios**:

| `hunger` before click | EGG-001 fires? | Result |
|---|---|---|
| 100 | Yes | Blocked. "I'm not hungry!" shown. |
| 95 | Yes | Blocked. |
| 91 | Yes | Blocked. |
| 90 | No | Feed executes normally. |
| 89 | No | Feed executes normally. |

## EGG-002 — Tired Play Message

**Trigger**: Player clicks Play when `energy < 20`.  
**Condition is checked before** the action, but the action is NOT blocked. The check is exclusive (strictly less than 20); `energy === 20` does not trigger.

**Behavior**:
- Play action executes **fully** (all deltas applied: Happiness +25, Hunger −10, Energy −10, then clamp).
- The pet displays the message: **"Zzz... too tired to play"**
- Message auto-dismisses after **3 seconds**.

**Interaction with stats**: Normal; stats change as per REQ-CARE-002.

**Example scenarios**:

| `energy` before click | EGG-002 message? | Play executes? |
|---|---|---|
| 19 | Yes | Yes |
| 0 | Yes | Yes (energy clamped to 0 after −10) |
| 20 | No | Yes |
| 50 | No | Yes |

## EGG-003 — Idle Quips

**Trigger**: No user interaction (no Feed, Play, or Rest click) for **60 consecutive seconds**.  
**Timer**: A module-level or store-level countdown that resets to 0 on any care action.

**Behavior**:
- When the 60-second timer expires, the pet displays one of 3 randomly selected quips.
- The quip is shown in the `pet-message` element.
- Message auto-dismisses after **5 seconds**.
- After dismissal, the timer resets and counts another 60 seconds before potentially showing another quip.
- The quip selection uses `Math.random()` to pick uniformly from the 3 strings.

**The 3 idle quips** (exact strings, case-sensitive):
1. `"Hello? Is anyone there...?"`
2. `"I could really use a snack right now."`
3. `"Just gonna stare at the wall, I guess."`

**Interaction with Page Visibility**: The idle timer continues counting even when the tab is hidden. The quip fires the next time the tab is visible and the timer has elapsed.

## Message Display System

All three easter eggs use the same `pet-message` UI region. Rules:
- Only one message is shown at a time.
- If a new message is triggered while one is already visible, the new message **replaces** the current one and restarts the auto-dismiss timer.
- Messages are displayed in the `data-testid="pet-message"` element.
- When no message is active, the element is empty or hidden (no phantom whitespace).

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Player feeds rapidly when hunger = 95 | Every click is blocked by EGG-001; "I'm not hungry!" shown; message resets to 3-second timer on each click |
| Player clicks Play when energy = 0 | EGG-002 fires; Play executes; energy clamped to 0 (no change from −10) |
| EGG-001 and EGG-003 messages overlap | EGG-001 message replaces the idle quip; 3-second timer restarts |
| Idle timer reaches 60s while a different message is visible | Quip replaces the current message |
| Player opens app after not visiting for 10 minutes | Stats are at last-saved values (no tick catch-up). Idle timer was reset to 0 on page load (or stored in localStorage — see REQ-PERS-012 for definition) |
| Pet name is "  ab  " (leading/trailing spaces) | Trimmed to "ab"; length 2 is valid; saved as "ab" |
| Pet name is " a " (1 char after trim) | Invalid; validation error shown |
| Pet name is 20 characters exactly | Valid |
| Pet name is 21 characters | Invalid; validation error shown |
