# Validation Plan: Vitals System

All unit tests use `vi.useFakeTimers()` to control `setInterval` and `clearInterval`. All E2E tests use `page.clock.install()` (Playwright's built-in fake clock). No test should rely on real wall-clock timing.

---

## Unit Tests (Vitest)

### UT-VITALS-001 — Initial stat defaults on empty localStorage
**Maps to**: REQ-VITALS-001, REQ-VITALS-002  
**Setup**: Call `localStorage.clear()`; import and initialize the Zustand store fresh.  
**Assert**:
- `store.getState().hunger === 50`
- `store.getState().happiness === 50`
- `store.getState().energy === 50`

---

### UT-VITALS-002 — Single tick applies correct decay to all three stats
**Maps to**: REQ-VITALS-006, REQ-VITALS-007, REQ-VITALS-008  
**Setup**: Set `hunger = 60, happiness = 50, energy = 40`; call `store.getState().tick()` once.  
**Assert**:
- `hunger === 57`
- `happiness === 48`
- `energy === 39`

---

### UT-VITALS-003 — Ten consecutive ticks produce correct cumulative decay
**Maps to**: REQ-VITALS-006, REQ-VITALS-007, REQ-VITALS-008  
**Setup**: Set `hunger = 100, happiness = 100, energy = 100`; call `tick()` ten times.  
**Assert**:
- `hunger === 70` (100 − 30)
- `happiness === 80` (100 − 20)
- `energy === 90` (100 − 10)

---

### UT-VITALS-004 — Clamp prevents Hunger below 0
**Maps to**: REQ-VITALS-009, REQ-VITALS-006  
**Setup**: Set `hunger = 2`; call `tick()` once.  
**Assert**: `hunger === 0` (not −1).

---

### UT-VITALS-005 — Clamp prevents Happiness below 0
**Maps to**: REQ-VITALS-009, REQ-VITALS-007  
**Setup**: Set `happiness = 1`; call `tick()` once.  
**Assert**: `happiness === 0`.

---

### UT-VITALS-006 — Clamp prevents Energy below 0
**Maps to**: REQ-VITALS-009, REQ-VITALS-008  
**Setup**: Set `energy = 0`; call `tick()` once.  
**Assert**: `energy === 0`.

---

### UT-VITALS-007 — All stats at 0 remain 0 across five ticks
**Maps to**: REQ-VITALS-009  
**Setup**: Set `hunger = 0, happiness = 0, energy = 0`; call `tick()` five times.  
**Assert**: After each tick, all three stats remain `0`.

---

### UT-VITALS-008 — Tick interval is cleared on visibility hidden
**Maps to**: REQ-VITALS-004  
**Setup**: `vi.useFakeTimers()`; call `startTickEngine()`; dispatch `visibilitychange` event with `document.visibilityState = 'hidden'`.  
**Assert**: Advance fake time by 60,000 ms. The `tick()` action is not called during this period (spy on `tick` or check stat values remain unchanged).

---

### UT-VITALS-009 — Tick interval resumes on visibility visible
**Maps to**: REQ-VITALS-005  
**Setup**: `vi.useFakeTimers()`; simulate `'hidden'`; then simulate `'visible'`; advance fake time by 10,000 ms.  
**Assert**: `tick()` is called exactly once.

---

### UT-VITALS-010 — No immediate tick fires on tab resume (no catch-up)
**Maps to**: REQ-VITALS-013  
**Setup**: `vi.useFakeTimers()`; record stat values; simulate `'hidden'`; advance 60,000 ms; simulate `'visible'`; advance 0 ms.  
**Assert**: Stats are unchanged from the recorded values immediately after visibility is restored (0 ms advance after resume fires 0 ticks).

---

### UT-VITALS-011 — Store rehydrates from existing localStorage state
**Maps to**: REQ-VITALS-012  
**Setup**: Write `{ state: { hunger: 75, happiness: 40, energy: 65 } }` to `localStorage['tamogotchi-store']` (matching Zustand persist shape); reinitialize store.  
**Assert**:
- `store.getState().hunger === 75`
- `store.getState().happiness === 40`
- `store.getState().energy === 65`

---

### UT-VITALS-012 — Store persists to localStorage after a tick
**Maps to**: REQ-VITALS-011  
**Setup**: Initialize store with defaults (50/50/50); call `tick()` once.  
**Assert**:
- `JSON.parse(localStorage.getItem('tamogotchi-store')).state.hunger === 47`
- `JSON.parse(localStorage.getItem('tamogotchi-store')).state.happiness === 48`
- `JSON.parse(localStorage.getItem('tamogotchi-store')).state.energy === 49`

---

### UT-VITALS-013 — clamp() function unit test — boundary values
**Maps to**: REQ-VITALS-009  
**Test cases** (call `clamp(value, 0, 100)` for each):
- `clamp(-1, 0, 100) === 0`
- `clamp(0, 0, 100) === 0`
- `clamp(50, 0, 100) === 50`
- `clamp(100, 0, 100) === 100`
- `clamp(101, 0, 100) === 100`

---

## E2E Tests (Playwright)

All E2E tests install a fake clock via `page.clock.install()` before navigating. Tests that require a pre-set store state use `page.evaluate()` to write directly to `localStorage` before navigation, bypassing the naming screen where needed.

---

### E2E-VITALS-001 — Stat display elements are visible after naming
**Maps to**: REQ-VITALS-010  
**Steps**:
1. Navigate to app.
2. Complete naming screen (enter name "Test", click submit).
3. Assert `data-testid="stat-hunger"` is visible.
4. Assert `data-testid="stat-happiness"` is visible.
5. Assert `data-testid="stat-energy"` is visible.

---

### E2E-VITALS-002 — Stats decay correctly after one simulated tick
**Maps to**: REQ-VITALS-006, REQ-VITALS-007, REQ-VITALS-008  
**Setup**: Seed `localStorage` with `hunger=50, happiness=50, energy=50, petName="Test"`.  
**Steps**:
1. Navigate to app (naming screen should be skipped due to saved name).
2. Advance clock by 10,000 ms.
3. Assert displayed `stat-hunger` value is `47`.
4. Assert displayed `stat-happiness` value is `48`.
5. Assert displayed `stat-energy` value is `49`.

---

### E2E-VITALS-003 — Stats decay correctly after three simulated ticks
**Maps to**: REQ-VITALS-006, REQ-VITALS-007, REQ-VITALS-008  
**Setup**: Seed with `hunger=50, happiness=50, energy=50, petName="Test"`.  
**Steps**:
1. Navigate; advance clock by 30,000 ms.
2. Assert `stat-hunger` === `41` (50 − 9).
3. Assert `stat-happiness` === `44` (50 − 6).
4. Assert `stat-energy` === `47` (50 − 3).

---

### E2E-VITALS-004 — Stats persist across a hard page reload
**Maps to**: REQ-VITALS-011, REQ-VITALS-012  
**Setup**: Seed with `hunger=50, happiness=50, energy=50, petName="Test"`.  
**Steps**:
1. Navigate; advance clock by 30,000 ms (3 ticks).
2. Expected values: `hunger=41, happiness=44, energy=47`.
3. Call `page.reload()`.
4. Assert `stat-hunger` === `41`.
5. Assert `stat-happiness` === `44`.
6. Assert `stat-energy` === `47`.

---

### E2E-VITALS-005 — Tick pauses when tab is hidden
**Maps to**: REQ-VITALS-004, REQ-VITALS-013  
**Setup**: Seed with `hunger=50, happiness=50, energy=50, petName="Test"`.  
**Steps**:
1. Navigate; record initial stat values.
2. Dispatch `visibilitychange` event with `document.visibilityState = 'hidden'` via `page.evaluate()`.
3. Advance clock by 60,000 ms.
4. Assert stat values are unchanged from initial values.
5. Dispatch `visibilitychange` with `document.visibilityState = 'visible'`.
6. Advance clock by 10,000 ms.
7. Assert exactly one tick's worth of decay has occurred (`hunger=47, happiness=48, energy=49`).

---

### E2E-VITALS-006 — Stats clamped at 0 (no negative values in UI)
**Maps to**: REQ-VITALS-009  
**Setup**: Seed with `hunger=2, happiness=1, energy=0, petName="Test"`.  
**Steps**:
1. Navigate; advance clock by 10,000 ms (one tick).
2. Assert `stat-hunger` displays `0` (not −1).
3. Assert `stat-happiness` displays `0`.
4. Assert `stat-energy` displays `0`.
