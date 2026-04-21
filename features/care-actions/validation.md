# Validation Plan: Care Actions

All unit tests call store action functions directly (no React component tree). E2E tests may seed `localStorage` via `page.evaluate()` to set up arbitrary preconditions.

---

## Unit Tests (Vitest)

### UT-CARE-001 — Feed applies correct deltas from mid-range values
**Maps to**: REQ-CARE-001  
**Setup**: Set `hunger = 40, happiness = 60, energy = 70`; call `store.getState().feed()`.  
**Assert**:
- `hunger === 70`
- `happiness === 65`
- `energy === 65`

---

### UT-CARE-002 — Feed clamps Hunger at 100
**Maps to**: REQ-CARE-001, REQ-CARE-005  
**Setup**: Set `hunger = 80, happiness = 60, energy = 10`; call `feed()`.  
**Assert**:
- `hunger === 100` (clamped from 110)
- `happiness === 65`
- `energy === 5`

---

### UT-CARE-003 — Feed clamps Energy at 0
**Maps to**: REQ-CARE-001, REQ-CARE-005  
**Setup**: Set `hunger = 50, happiness = 50, energy = 3`; call `feed()`.  
**Assert**: `energy === 0` (clamped from −2).

---

### UT-CARE-004 — Play applies correct deltas from mid-range values
**Maps to**: REQ-CARE-002  
**Setup**: Set `happiness = 50, hunger = 60, energy = 50`; call `store.getState().play()`.  
**Assert**:
- `happiness === 75`
- `hunger === 50`
- `energy === 40`

---

### UT-CARE-005 — Play clamps Happiness at 100 and Hunger/Energy at 0
**Maps to**: REQ-CARE-002, REQ-CARE-005  
**Setup**: Set `happiness = 90, hunger = 5, energy = 25`; call `play()`.  
**Assert**:
- `happiness === 100` (clamped from 115)
- `hunger === 0` (clamped from −5)
- `energy === 15`

---

### UT-CARE-006 — Rest applies correct deltas from mid-range values
**Maps to**: REQ-CARE-003  
**Setup**: Set `energy = 50, hunger = 60, happiness = 40`; call `store.getState().rest()`.  
**Assert**:
- `energy === 90`
- `hunger === 55`
- `happiness === 40`

---

### UT-CARE-007 — Rest does not modify Happiness
**Maps to**: REQ-CARE-003  
**Setup**: Set `happiness = 77`; call `rest()`.  
**Assert**: `happiness === 77` (value is identical before and after).

---

### UT-CARE-008 — Rest clamps Energy at 100 and Hunger at 0
**Maps to**: REQ-CARE-003, REQ-CARE-005  
**Setup**: Set `energy = 80, hunger = 3, happiness = 50`; call `rest()`.  
**Assert**:
- `energy === 100` (clamped from 120)
- `hunger === 0` (clamped from −2)
- `happiness === 50`

---

### UT-CARE-009 — Deltas are computed simultaneously from pre-action snapshot
**Maps to**: REQ-CARE-004  
**Setup**: Set `energy = 10, happiness = 50, hunger = 60`; call `play()`.  
**Assert**: `energy === 0` (10 + (−10) = 0, then clamped). The fact that `happiness` gets +25 does not influence the energy calculation.  
**Note**: This test guards against sequential-delta bugs where later deltas in the same action might read a stat value already modified by an earlier delta.

---

### UT-CARE-010 — EGG-001: Feed blocked when hunger = 91
**Maps to**: REQ-CARE-006, REQ-PERS-005, REQ-PERS-007  
**Setup**: Set `hunger = 91, happiness = 50, energy = 50`; call `feed()`.  
**Assert**:
- `hunger === 91` (no change)
- `happiness === 50` (no change)
- `energy === 50` (no change)

---

### UT-CARE-011 — EGG-001: Feed blocked when hunger = 100
**Maps to**: REQ-CARE-006  
**Setup**: Set `hunger = 100`; call `feed()`.  
**Assert**: `hunger === 100` (blocked, no change).

---

### UT-CARE-012 — EGG-001: Feed NOT blocked when hunger = 90
**Maps to**: REQ-CARE-006  
**Setup**: Set `hunger = 90, happiness = 50, energy = 50`; call `feed()`.  
**Assert**: `hunger === 100` (clamped from 120). Action executed.

---

### UT-CARE-013 — EGG-002: Play executes fully when energy = 15
**Maps to**: REQ-CARE-007, REQ-PERS-008  
**Setup**: Set `happiness = 50, hunger = 40, energy = 15`; call `play()`.  
**Assert**:
- `happiness === 75` (stat change confirms action was not blocked)
- `hunger === 30`
- `energy === 5`

---

### UT-CARE-014 — EGG-002: Play does NOT trigger when energy = 20
**Maps to**: REQ-CARE-007  
**Setup**: Set `energy = 20, happiness = 50, hunger = 40`; call `play()`; read `store.getState().eggTwoActive` (or equivalent EGG-002 flag).  
**Assert**: EGG-002 flag is `false`. `energy === 10`.

---

### UT-CARE-015 — Care actions do not change pet state directly
**Maps to**: REQ-CARE-008 (state independence)  
**Setup**: Set `petState = 'Sick'`; call `feed()`, `play()`, `rest()` in sequence.  
**Assert**: `petState` remains `'Sick'` after all three actions (state transitions only occur on `tick()`).

---

## E2E Tests (Playwright)

---

### E2E-CARE-001 — Feed button is visible, enabled, and changes stats
**Maps to**: REQ-CARE-001, REQ-CARE-008  
**Setup**: Seed `localStorage` with `hunger=40, happiness=60, energy=70, petName="Pip"`.  
**Steps**:
1. Navigate to app.
2. Assert `data-testid="action-feed"` is visible and not disabled.
3. Click Feed button.
4. Assert `stat-hunger` displays `70`.
5. Assert `stat-happiness` displays `65`.
6. Assert `stat-energy` displays `65`.

---

### E2E-CARE-002 — Play button is visible, enabled, and changes stats
**Maps to**: REQ-CARE-002, REQ-CARE-008  
**Setup**: Seed `localStorage` with `happiness=50, hunger=60, energy=50, petName="Pip"`.  
**Steps**:
1. Navigate to app.
2. Assert `data-testid="action-play"` is visible and not disabled.
3. Click Play button.
4. Assert `stat-happiness` displays `75`.
5. Assert `stat-hunger` displays `50`.
6. Assert `stat-energy` displays `40`.

---

### E2E-CARE-003 — Rest button is visible, enabled, and changes stats
**Maps to**: REQ-CARE-003, REQ-CARE-008  
**Setup**: Seed `localStorage` with `energy=50, hunger=60, happiness=40, petName="Pip"`.  
**Steps**:
1. Navigate to app.
2. Assert `data-testid="action-rest"` is visible and not disabled.
3. Click Rest button.
4. Assert `stat-energy` displays `90`.
5. Assert `stat-hunger` displays `55`.
6. Assert `stat-happiness` displays `40` (unchanged).

---

### E2E-CARE-004 — EGG-001: Feed blocked and message shown when hunger > 90
**Maps to**: REQ-CARE-006, REQ-PERS-005, REQ-PERS-006  
**Setup**: Seed `localStorage` with `hunger=95, happiness=50, energy=50, petName="Pip"`.  
**Steps**:
1. Navigate to app.
2. Click `data-testid="action-feed"`.
3. Assert `data-testid="pet-message"` is visible and contains the text `"I'm not hungry!"`.
4. Assert `stat-hunger` still displays `95` (no change).
5. Assert `stat-happiness` still displays `50`.
6. Assert `stat-energy` still displays `50`.

---

### E2E-CARE-005 — EGG-002: Play executes and shows tired message when energy < 20
**Maps to**: REQ-CARE-007, REQ-PERS-008, REQ-PERS-009  
**Setup**: Seed `localStorage` with `energy=15, happiness=50, hunger=40, petName="Pip"`.  
**Steps**:
1. Navigate to app.
2. Click `data-testid="action-play"`.
3. Assert `data-testid="pet-message"` is visible and contains `"Zzz... too tired to play"` within 500 ms.
4. Assert `stat-happiness` has increased to `75` (action executed).
5. Assert `stat-energy` displays `5`.
6. Wait 3,500 ms (via fake clock advance).
7. Assert `data-testid="pet-message"` is no longer visible or is empty.

---

### E2E-CARE-006 — All care actions available when pet is Sick
**Maps to**: REQ-CARE-008  
**Setup**: Seed `localStorage` with `petState="Sick", petName="Pip"`.  
**Steps**:
1. Navigate to app.
2. Assert `action-feed` is visible and not disabled.
3. Assert `action-play` is visible and not disabled.
4. Assert `action-rest` is visible and not disabled.

---

### E2E-CARE-007 — All care actions available when pet is Evolved
**Maps to**: REQ-CARE-008  
**Setup**: Seed `localStorage` with `petState="Evolved", hasEvolved=true, petName="Pip"`.  
**Steps**:
1. Navigate to app.
2. Assert `action-feed` is visible and not disabled.
3. Assert `action-play` is visible and not disabled.
4. Assert `action-rest` is visible and not disabled.
