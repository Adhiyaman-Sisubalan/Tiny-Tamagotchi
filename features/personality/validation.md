# Validation Plan: Personality & Easter Eggs

All unit tests use `vi.useFakeTimers()` to control message auto-dismiss timers and the idle quip countdown. E2E tests use `page.clock.install()` and `page.evaluate()` for store seeding.

---

## Unit Tests (Vitest)

### UT-PERS-001 — Naming screen shown when petName absent in localStorage
**Maps to**: REQ-PERS-001  
**Setup**: Clear `localStorage`; render the App component.  
**Assert**: Element with `data-testid="name-input"` is present in the rendered output.  
**Assert**: Element with `data-testid="stat-hunger"` is NOT present (game UI hidden).

---

### UT-PERS-002 — Naming screen skipped when petName present in localStorage
**Maps to**: REQ-PERS-002  
**Setup**: Write `petName = "Pip"` to `localStorage`; render App.  
**Assert**: `data-testid="name-input"` is not present.  
**Assert**: `data-testid="stat-hunger"` is present.

---

### UT-PERS-003 — Name validation: rejects fewer than 2 characters
**Maps to**: REQ-PERS-003  
**Setup**: Render naming screen; type `"a"` in the input; click submit.  
**Assert**: Validation error element is visible. `petName` in store is still empty/undefined.

---

### UT-PERS-004 — Name validation: rejects more than 20 characters
**Maps to**: REQ-PERS-003  
**Setup**: Render naming screen; type a 21-character string; click submit.  
**Assert**: Validation error element is visible. `petName` not saved.

---

### UT-PERS-005 — Name validation: accepts exactly 2 characters
**Maps to**: REQ-PERS-003  
**Setup**: Render naming screen; type `"Pi"`; click submit.  
**Assert**: No validation error. Game UI renders. `store.getState().petName === 'Pi'`.

---

### UT-PERS-006 — Name validation: accepts exactly 20 characters
**Maps to**: REQ-PERS-003  
**Setup**: Render naming screen; type a 20-character string; click submit.  
**Assert**: No validation error. `petName` saved with 20-character value.

---

### UT-PERS-007 — Name validation: trims whitespace before length check
**Maps to**: REQ-PERS-003  
**Setup**: Render naming screen; type `"  ab  "` (leading/trailing spaces); click submit.  
**Assert**: No validation error. `store.getState().petName === 'ab'`.

---

### UT-PERS-008 — Name persisted to localStorage on valid submission
**Maps to**: REQ-PERS-004  
**Setup**: Render naming screen; type `"Fluffy"`; click submit.  
**Assert**: `JSON.parse(localStorage.getItem('tamogotchi-store')).state.petName === 'Fluffy'`.

---

### UT-PERS-009 — Pet name displayed in main UI
**Maps to**: REQ-PERS-006  
**Setup**: Set `petName = "Mochi"` in store; render main game UI.  
**Assert**: `data-testid="pet-name"` text content is `"Mochi"`.

---

### UT-PERS-010 — EGG-001: Feed blocked when hunger = 95
**Maps to**: REQ-PERS-007, REQ-PERS-009  
**Setup**: Set `hunger = 95, happiness = 50, energy = 50`; call `store.getState().feed()`.  
**Assert**: Store unchanged (`hunger === 95, happiness === 50, energy === 50`).

---

### UT-PERS-011 — EGG-001: "I'm not hungry!" message set in store when Feed blocked
**Maps to**: REQ-PERS-008  
**Setup**: Set `hunger = 95`; call `feed()`.  
**Assert**: `store.getState().petMessage === "I'm not hungry!"`.

---

### UT-PERS-012 — EGG-001: Message auto-dismisses after 3 seconds
**Maps to**: REQ-PERS-008  
**Setup**: `vi.useFakeTimers()`; set `hunger = 95`; call `feed()`.  
**Assert before advance**: `petMessage === "I'm not hungry!"`.  
**Advance 3,000 ms**.  
**Assert after advance**: `petMessage === ''` (empty or null).

---

### UT-PERS-013 — EGG-001: Feed NOT blocked when hunger = 90
**Maps to**: REQ-PERS-007  
**Setup**: Set `hunger = 90, happiness = 50, energy = 50`; call `feed()`.  
**Assert**: `hunger === 100` (clamped from 120). No EGG-001 message.

---

### UT-PERS-014 — EGG-002: Play executes normally when energy = 15
**Maps to**: REQ-PERS-010  
**Setup**: Set `happiness = 50, hunger = 40, energy = 15`; call `store.getState().play()`.  
**Assert**: `happiness === 75`, `hunger === 30`, `energy === 5`. (Action was not blocked.)

---

### UT-PERS-015 — EGG-002: "Zzz... too tired to play" message set when energy < 20
**Maps to**: REQ-PERS-011  
**Setup**: Set `energy = 15`; call `play()`.  
**Assert**: `store.getState().petMessage === "Zzz... too tired to play"`.

---

### UT-PERS-016 — EGG-002: Message auto-dismisses after 3 seconds
**Maps to**: REQ-PERS-011  
**Setup**: `vi.useFakeTimers()`; set `energy = 15`; call `play()`.  
**Advance 3,000 ms**.  
**Assert**: `petMessage === ''`.

---

### UT-PERS-017 — EGG-002: NOT triggered when energy = 20
**Maps to**: REQ-PERS-010  
**Setup**: Set `energy = 20`; call `play()`.  
**Assert**: `store.getState().petMessage` is not `"Zzz... too tired to play"`.

---

### UT-PERS-018 — EGG-003: Idle quip fires after 60 seconds of inactivity
**Maps to**: REQ-PERS-012, REQ-PERS-013  
**Setup**: `vi.useFakeTimers()`; initialize store (starts idle timer at 0).  
**Advance 60,000 ms**.  
**Assert**: `store.getState().petMessage` is one of the 3 predefined quip strings.

---

### UT-PERS-019 — EGG-003: Idle quip selected from exactly the 3 defined strings
**Maps to**: REQ-PERS-013  
**Setup**: `vi.spyOn(Math, 'random')` returning each of `0.0`, `0.34`, `0.67` in three separate test runs.  
**Assert** for each run that the resulting quip is one of:
- `"Hello? Is anyone there...?"`
- `"I could really use a snack right now."`
- `"Just gonna stare at the wall, I guess."`

---

### UT-PERS-020 — EGG-003: Idle quip auto-dismisses after 5 seconds
**Maps to**: REQ-PERS-014  
**Setup**: `vi.useFakeTimers()`; advance 60,000 ms to trigger quip.  
**Advance an additional 5,000 ms**.  
**Assert**: `petMessage === ''`.

---

### UT-PERS-021 — EGG-003: Idle timer resets on Feed action
**Maps to**: REQ-PERS-015  
**Setup**: `vi.useFakeTimers()`; advance 55,000 ms (5 seconds short of quip); call `feed()` with `hunger = 50`; advance 10,000 ms more.  
**Assert**: No quip fired (total elapsed since last action = 10 s, not 60 s).

---

### UT-PERS-022 — EGG-003: Idle timer resets even on blocked Feed (EGG-001)
**Maps to**: REQ-PERS-015  
**Setup**: `vi.useFakeTimers()`; set `hunger = 95`; advance 55,000 ms; call `feed()` (blocked by EGG-001); advance 10,000 ms more.  
**Assert**: No quip fired (timer was reset by the blocked Feed click).

---

### UT-PERS-023 — New message replaces existing message and restarts timer
**Maps to**: REQ-PERS-016  
**Setup**: `vi.useFakeTimers()`; trigger EGG-001 (sets 3-second message); advance 2,000 ms; trigger EGG-002 (new message).  
**Assert immediately**: `petMessage === "Zzz... too tired to play"`.  
**Advance 3,000 ms** (3 seconds after the replacement).  
**Assert**: `petMessage === ''` (new 3-second timer expired, not the original).

---

## E2E Tests (Playwright)

---

### E2E-PERS-001 — Naming screen shown on first load
**Maps to**: REQ-PERS-001  
**Setup**: Clear all `localStorage` for the origin.  
**Steps**:
1. Navigate to app.
2. Assert `data-testid="name-input"` is visible.
3. Assert `data-testid="action-feed"` is not visible (game UI hidden).

---

### E2E-PERS-002 — Valid name submission transitions to game UI
**Maps to**: REQ-PERS-001, REQ-PERS-004, REQ-PERS-006  
**Setup**: Clear `localStorage`.  
**Steps**:
1. Navigate; type `"Mochi"` in `name-input`.
2. Click `name-submit`.
3. Assert naming screen is gone.
4. Assert `data-testid="pet-name"` text is `"Mochi"`.
5. Assert `data-testid="action-feed"` is visible.

---

### E2E-PERS-003 — Short name rejected with inline error
**Maps to**: REQ-PERS-003  
**Setup**: Clear `localStorage`.  
**Steps**:
1. Navigate; type `"X"` in `name-input`; click submit.
2. Assert validation error element is visible.
3. Assert naming screen is still visible.

---

### E2E-PERS-004 — Naming screen skipped on return visit
**Maps to**: REQ-PERS-002, REQ-PERS-005  
**Setup**: Seed `localStorage` with `petName="Pip"`.  
**Steps**:
1. Navigate.
2. Assert `data-testid="name-input"` is not present.
3. Assert `data-testid="pet-name"` text is `"Pip"`.

---

### E2E-PERS-005 — EGG-001: Feed blocked and message shown at hunger 95
**Maps to**: REQ-PERS-007, REQ-PERS-008, REQ-PERS-009  
**Setup**: Seed `localStorage` with `hunger=95, happiness=50, energy=50, petName="Pip"`.  
**Steps**:
1. Navigate.
2. Click `data-testid="action-feed"`.
3. Assert `data-testid="pet-message"` text is exactly `"I'm not hungry!"`.
4. Assert `stat-hunger` value is still `95`.
5. Advance clock by 3,000 ms.
6. Assert `data-testid="pet-message"` is hidden or empty.

---

### E2E-PERS-006 — EGG-001: Feed NOT blocked at hunger 90
**Maps to**: REQ-PERS-007  
**Setup**: Seed `localStorage` with `hunger=90, petName="Pip"`.  
**Steps**:
1. Navigate; click Feed.
2. Assert `stat-hunger` is `100` (action executed).
3. Assert `pet-message` does NOT contain `"I'm not hungry!"`.

---

### E2E-PERS-007 — EGG-002: Play executes and shows tired message at energy 15
**Maps to**: REQ-PERS-010, REQ-PERS-011  
**Setup**: Seed `localStorage` with `energy=15, happiness=50, hunger=40, petName="Pip"`.  
**Steps**:
1. Navigate; click `data-testid="action-play"`.
2. Assert `data-testid="pet-message"` text is exactly `"Zzz... too tired to play"`.
3. Assert `stat-happiness` value is `75` (action executed).
4. Advance clock by 3,000 ms.
5. Assert `pet-message` is hidden or empty.

---

### E2E-PERS-008 — EGG-003: Idle quip fires after 60 seconds with no interaction
**Maps to**: REQ-PERS-012, REQ-PERS-013, REQ-PERS-014  
**Setup**: Seed `localStorage` with `petName="Pip"`.  
**Steps**:
1. Navigate (no care actions performed).
2. Advance clock by 60,000 ms.
3. Assert `data-testid="pet-message"` is visible and its text is one of the 3 defined quip strings.
4. Advance clock by 5,000 ms.
5. Assert `pet-message` is hidden or empty.

---

### E2E-PERS-009 — EGG-003: Idle timer resets on care action, quip does not fire at 60s from load
**Maps to**: REQ-PERS-015  
**Setup**: Seed `localStorage` with `hunger=50, petName="Pip"`.  
**Steps**:
1. Navigate; advance clock by 55,000 ms.
2. Click Feed (resets idle timer).
3. Advance clock by 10,000 ms (only 10 s since last action).
4. Assert `data-testid="pet-message"` is NOT showing a quip.

---

### E2E-PERS-010 — Pet name persists across reload
**Maps to**: REQ-PERS-004, REQ-PERS-005  
**Setup**: Clear `localStorage`.  
**Steps**:
1. Navigate; name the pet `"Bolt"`.
2. Reload page.
3. Assert naming screen does not appear.
4. Assert `data-testid="pet-name"` text is `"Bolt"`.
