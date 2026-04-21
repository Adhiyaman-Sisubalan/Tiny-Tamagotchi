# Requirements: State Machine

## Requirement Index

| ID | Description |
|---|---|
| REQ-STATE-001 | The pet has exactly three states: Normal, Sick, Evolved |
| REQ-STATE-002 | Initial `petState` is `'Normal'` when no saved state exists |
| REQ-STATE-003 | Normal → Sick: fires when any single stat is strictly below 20 after tick decay |
| REQ-STATE-004 | Sick → Normal/Evolved (recovery): fires when all stats ≥ 50 for 3 consecutive ticks while Sick |
| REQ-STATE-005 | Normal → Evolved: fires when all stats ≥ 80 for 10 consecutive ticks while Normal |
| REQ-STATE-006 | Evolved state is permanent: a pet that was Evolved returns to Evolved after recovering from Sick |
| REQ-STATE-007 | Sick state blocks the evolution check entirely |
| REQ-STATE-008 | An Evolved pet can transition to Sick if any stat drops below 20 |
| REQ-STATE-009 | Current pet state is displayed with a visually distinct treatment per state in the UI |
| REQ-STATE-010 | `recoveryTicks` resets to 0 on any tick where any stat drops below 50 while Sick |
| REQ-STATE-011 | `evolutionTicks` resets to 0 on any tick where any stat drops below 80 while Normal |
| REQ-STATE-012 | `evolutionTicks` resets to 0 when the pet transitions from Normal to Sick |
| REQ-STATE-013 | State machine evaluation runs on every tick, after decay and clamping |
| REQ-STATE-014 | `petState`, `hasEvolved`, `recoveryTicks`, and `evolutionTicks` are all persisted to localStorage |
| REQ-STATE-015 | State changes trigger a 0.4 s CSS fade-in animation on the pet sprite |
| REQ-STATE-016 | Normal state renders an animated floating blob sprite (continuous vertical float, blinking eyes) |
| REQ-STATE-017 | Sick state renders a desaturated/recolored wobbling blob sprite (continuous rotation wobble, X-shaped eyes, sweat drop) |
| REQ-STATE-018 | Evolved state renders a larger crowned blob sprite with a continuous golden glow pulse aura and two orbiting sparkle particles |

---

## Acceptance Criteria

### REQ-STATE-001
- The `petState` field in the store is typed as `'Normal' | 'Sick' | 'Evolved'`.
- No other string value is assignable to this field.
- `hasEvolved` is a `boolean` field that becomes permanently `true` when the pet first reaches Evolved.

### REQ-STATE-002
- **Given** `localStorage` has no saved state,  
  **When** the app initializes,  
  **Then** `petState === 'Normal'` and `hasEvolved === false`.

### REQ-STATE-003
- **Given** `petState === 'Normal'` and `hunger = 22, happiness = 50, energy = 50`,  
  **When** a tick fires (Hunger decays to 19),  
  **Then** `petState === 'Sick'`.
- **Given** `petState === 'Normal'` and `hunger = 23, happiness = 50, energy = 50`,  
  **When** a tick fires (Hunger decays to 20),  
  **Then** `petState === 'Normal'` (20 is not < 20).
- The condition applies to any single stat: if Happiness or Energy drops below 20, the transition fires equally.

### REQ-STATE-004
- **Given** `petState === 'Sick'` and all stats are ≥ 50,  
  **When** 3 consecutive ticks fire without any stat dropping below 50,  
  **Then** `petState` becomes `'Normal'` (if `hasEvolved === false`) or `'Evolved'` (if `hasEvolved === true`), and `recoveryTicks === 0`.
- **Given** `petState === 'Sick'`, `recoveryTicks === 2`, and one stat drops to 49 on the next tick,  
  **Then** `recoveryTicks === 0` and `petState` remains `'Sick'`.
- The ≥ 50 threshold is inclusive: stats at exactly 50 count toward recovery.

### REQ-STATE-005
- **Given** `petState === 'Normal'` and all stats are ≥ 80,  
  **When** 10 consecutive ticks fire without any stat dropping below 80,  
  **Then** `petState === 'Evolved'`, `hasEvolved === true`, `evolutionTicks` is at least 10.
- **Given** `petState === 'Normal'`, `evolutionTicks === 9`, and one stat drops to 79 on the next tick,  
  **Then** `evolutionTicks === 0` and `petState` remains `'Normal'`.
- The ≥ 80 threshold is inclusive: stats at exactly 80 count toward evolution.

### REQ-STATE-006
- `hasEvolved` is set to `true` the first time `petState` becomes `'Evolved'` and never set back to `false`.
- **Given** `petState === 'Evolved'` and any stat drops below 20,  
  **When** recovery conditions are met (all stats ≥ 50 for 3 consecutive ticks),  
  **Then** `petState === 'Evolved'` (not `'Normal'`).

### REQ-STATE-007
- **Given** `petState === 'Sick'` and all stats ≥ 80,  
  **When** a tick fires,  
  **Then** the evolution check (10-tick counter) does not run. `evolutionTicks` is not incremented.
- The evolution check runs only when `petState === 'Normal'`.

### REQ-STATE-008
- **Given** `petState === 'Evolved'` and `hunger = 22, happiness = 80, energy = 80`,  
  **When** a tick fires (Hunger decays to 19),  
  **Then** `petState === 'Sick'` and `hasEvolved === true`.

### REQ-STATE-009
- The UI renders a `data-testid="pet-state"` element whose content (text or CSS class) reflects the current state.
- Alternatively, the pet display container receives a CSS class or `data-state` attribute that changes with each state, enabling visual differentiation.
- Distinct visual treatment is required for all three states.

### REQ-STATE-010
- **Given** `petState === 'Sick'`, `recoveryTicks === 2`, and any stat is below 50 on the next tick,  
  **Then** `recoveryTicks === 0`.

### REQ-STATE-011
- **Given** `petState === 'Normal'`, `evolutionTicks === 7`, and any stat drops to 79 on the next tick,  
  **Then** `evolutionTicks === 0`.

### REQ-STATE-012
- **Given** `petState === 'Normal'` and `evolutionTicks === 8`,  
  **When** a tick fires and any stat drops below 20,  
  **Then** `petState === 'Sick'` and `evolutionTicks === 0`.

### REQ-STATE-013
- State machine evaluation runs as the final step of every `tick()` call, after stat decay and clamping.
- Care actions (Feed, Play, Rest) do not trigger state machine evaluation directly.

### REQ-STATE-014
- After any tick that modifies `petState`, `recoveryTicks`, `evolutionTicks`, or `hasEvolved`, `localStorage` reflects the updated values.
- On page reload, all four fields are restored from `localStorage` to their persisted values.

### REQ-STATE-015
- **When** `petState` changes (any transition: Normal → Sick, Sick → Normal, Normal → Evolved, Sick → Evolved, Evolved → Sick),  
  **Then** the pet sprite container triggers a `fadeIn` CSS keyframe animation (scale 0.82 → 1, opacity 0 → 1, duration 0.4 s).
- The animation is triggered by React remounting the sprite element (e.g. via a `key={petState}` prop) so that it plays fresh on every transition.
- This requirement is purely visual; it does not affect state machine logic or timing.

### REQ-STATE-016
- **Given** `petState === 'Normal'`,  
  **Then** the pet sprite is a CSS blob shape (rounded `border-radius`, warm yellow gradient) with:
  - A continuous vertical floating animation (`petFloat`, 3 s period).
  - Two oval eyes that periodically blink via a `scaleY` keyframe animation (`eyeBlink`, 4 s period).
- No external image assets are used. The sprite is built entirely from CSS-styled `<div>` elements.

### REQ-STATE-017
- **Given** `petState === 'Sick'`,  
  **Then** the pet sprite is a CSS blob shape (purple/desaturated gradient) with:
  - A continuous rotation-wobble animation (`petWobble`, 1.6 s period).
  - Two X-shaped eyes (two crossed `<div>` bars per eye, rotated ±45°).
  - A teardrop sweat shape positioned above the blob.
- No external image assets are used.

### REQ-STATE-018
- **Given** `petState === 'Evolved'`,  
  **Then** the pet sprite is a larger CSS blob shape (golden gradient, ~22% wider and taller than Normal) with:
  - A continuous vertical floating animation (`petFloat`, 3 s period).
  - Two oval eyes that periodically blink (`eyeBlink`, 4 s period).
  - A crown glyph (👑) positioned above the blob.
  - A continuous golden drop-shadow glow pulse (`goldGlow`, 2 s period).
  - Two sparkle glyphs that orbit the sprite center using a CSS rotation + translateX pattern (`orbit`, 2.6 s period, offset by half-period so they appear opposite each other).
- No external image assets are used.
