# Requirements: Vitals System

## Requirement Index

| ID | Description |
|---|---|
| REQ-VITALS-001 | Three stats exist: Hunger, Happiness, Energy, each an integer in [0, 100] |
| REQ-VITALS-002 | Stats initialize to 50 when no saved state exists in localStorage |
| REQ-VITALS-003 | Tick fires every 10 seconds (10,000 ms interval) |
| REQ-VITALS-004 | Tick interval is cleared when `document.visibilityState` becomes `'hidden'` |
| REQ-VITALS-005 | Tick interval is restarted when `document.visibilityState` returns to `'visible'` |
| REQ-VITALS-006 | Per-tick decay: Hunger decreases by 3 |
| REQ-VITALS-007 | Per-tick decay: Happiness decreases by 2 |
| REQ-VITALS-008 | Per-tick decay: Energy decreases by 1 |
| REQ-VITALS-009 | Stats are clamped to [0, 100] after every mutation from any source |
| REQ-VITALS-010 | Current values of all three stats are visible in the UI at all times during gameplay |
| REQ-VITALS-011 | All stat values are persisted to `localStorage` after every state change |
| REQ-VITALS-012 | Stats are restored from `localStorage` on page load when saved state exists |
| REQ-VITALS-013 | No catch-up ticks fire when the tab returns from a hidden state |
| REQ-VITALS-014 | When a stat value is < 40, the stat bar fill color transitions to orange |
| REQ-VITALS-015 | When a stat value is < 20, the stat bar fill color transitions to red and pulses continuously |
| REQ-VITALS-016 | Stat bar width changes animate with a 0.5 s CSS transition |

---

## Acceptance Criteria

### REQ-VITALS-001
- The Zustand store contains exactly three numeric fields: `hunger`, `happiness`, `energy`.
- Each field holds a value of type `number` constrained at runtime to integer values in [0, 100].
- TypeScript types must represent these fields as `number`; clamping logic enforces the range at runtime.
- No observable store state contains a value for any of these fields outside [0, 100].

### REQ-VITALS-002
- **Given** the `localStorage` key `"tamogotchi-store"` does not exist,  
  **When** the application initializes,  
  **Then** `store.hunger === 50`, `store.happiness === 50`, `store.energy === 50`.

### REQ-VITALS-003
- A `setInterval` with delay `10_000` ms is active while the tab is visible.
- Each interval callback invokes the store's `tick()` action exactly once.
- The interval ID is stored in a ref or module-level variable so it can be cleared.

### REQ-VITALS-004
- **Given** the tick engine is running,  
  **When** `document.visibilityState` changes to `'hidden'`,  
  **Then** `clearInterval` is called with the active interval ID before the next potential tick fires.
- No stat changes occur during a hidden period.

### REQ-VITALS-005
- **Given** the tick interval has been cleared due to the tab being hidden,  
  **When** `document.visibilityState` changes to `'visible'`,  
  **Then** a new `setInterval` with delay `10_000` ms is established.
- The interval begins counting from 0 — no immediate tick fires on resume.

### REQ-VITALS-006
- **Given** `hunger = 60` and a tick fires,  
  **Then** `hunger === 57`.
- **Given** `hunger = 2` and a tick fires,  
  **Then** `hunger === 0` (clamped; not −1).
- **Given** `hunger = 0` and a tick fires,  
  **Then** `hunger === 0`.

### REQ-VITALS-007
- **Given** `happiness = 30` and a tick fires,  
  **Then** `happiness === 28`.
- **Given** `happiness = 1` and a tick fires,  
  **Then** `happiness === 0`.
- **Given** `happiness = 0` and a tick fires,  
  **Then** `happiness === 0`.

### REQ-VITALS-008
- **Given** `energy = 10` and a tick fires,  
  **Then** `energy === 9`.
- **Given** `energy = 0` and a tick fires,  
  **Then** `energy === 0`.

### REQ-VITALS-009
- `clamp(value, 0, 100)` is applied to every stat after every `tick()` call and every care action call.
- The `clamp` function is the single authoritative range-enforcement mechanism.
- No code path may write a value outside [0, 100] to any stat field and have it persist.

### REQ-VITALS-010
- The rendered UI includes labeled elements displaying current values for Hunger, Happiness, and Energy.
- These elements use `data-testid` attributes: `"stat-hunger"`, `"stat-happiness"`, `"stat-energy"` for test targeting.
- Values update in the DOM within one React render cycle after a tick fires.

### REQ-VITALS-011
- **After** any stat mutation (tick or care action),  
  **Then** `JSON.parse(localStorage.getItem('tamogotchi-store'))` contains the updated stat values.

### REQ-VITALS-012
- **Given** `localStorage` contains `{ hunger: 75, happiness: 40, energy: 65 }` under the key `"tamogotchi-store"`,  
  **When** the application loads,  
  **Then** the store initializes with `hunger === 75`, `happiness === 40`, `energy === 65`.

### REQ-VITALS-013
- **Given** the tab was hidden for 60 seconds (which would have been 6 tick intervals),  
  **When** the tab returns to visible,  
  **Then** no immediate tick fires; stat values are identical to their values at the moment the tab was hidden.
- The next tick fires 10 seconds after the tab became visible.

### REQ-VITALS-014
- **Given** a stat value is ≥ 40, the stat bar fill is rendered in green.
- **Given** a stat value is < 40 and ≥ 20, the stat bar fill transitions to orange.
- The color transition is continuous: a bar already at orange resets to green if the stat rises back to ≥ 40.
- The `0.5 s` color transition (REQ-VITALS-016) applies to color changes as well as width changes.

### REQ-VITALS-015
- **Given** a stat value is < 20, the stat bar fill color is red.
- While the value remains < 20, the bar pulses continuously using a CSS keyframe animation (`pulseFast`, approx. 0.6 s period).
- Simultaneously, the stat label text shakes horizontally using a CSS keyframe animation (`labelShake`, approx. 0.4 s period).
- Both animations cease when the value rises to ≥ 20.
- This requirement is purely visual: it does not affect the underlying stat value or any state machine evaluation.

### REQ-VITALS-016
- The rendered width of each stat bar fill is driven by `width: <value>%` (or equivalent).
- Any change in width applies a `transition: width 0.5s ease` (or equivalent) so the bar animates smoothly rather than snapping.
- This requirement is purely visual and applies regardless of the source of the stat change (tick decay or care action).
