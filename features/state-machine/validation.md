# Validation Plan: State Machine

All unit tests call `store.getState().tick()` directly with `vi.useFakeTimers()` where needed. E2E tests seed `localStorage` to set up specific initial conditions and use `page.clock.install()` to advance time.

---

## Unit Tests (Vitest)

### UT-STATE-001 — Initial state is Normal with hasEvolved false
**Maps to**: REQ-STATE-001, REQ-STATE-002  
**Setup**: Clear `localStorage`; initialize store.  
**Assert**:
- `petState === 'Normal'`
- `hasEvolved === false`
- `recoveryTicks === 0`
- `evolutionTicks === 0`

---

### UT-STATE-002 — Normal → Sick when Hunger drops below 20
**Maps to**: REQ-STATE-003  
**Setup**: Set `petState = 'Normal'`, `hunger = 22, happiness = 50, energy = 50`; call `tick()`.  
**Assert**: `petState === 'Sick'` (hunger decayed to 19, which is < 20).

---

### UT-STATE-003 — Normal stays Normal when Hunger decays to exactly 20
**Maps to**: REQ-STATE-003  
**Setup**: Set `petState = 'Normal'`, `hunger = 23, happiness = 50, energy = 50`; call `tick()`.  
**Assert**: `petState === 'Normal'` (hunger decayed to 20; 20 is not < 20).

---

### UT-STATE-004 — Normal → Sick triggered by Happiness below 20
**Maps to**: REQ-STATE-003  
**Setup**: Set `petState = 'Normal'`, `hunger = 50, happiness = 21, energy = 50`; call `tick()`.  
**Assert**: `petState === 'Sick'` (happiness decayed to 19).

---

### UT-STATE-005 — Normal → Sick triggered by Energy below 20
**Maps to**: REQ-STATE-003  
**Setup**: Set `petState = 'Normal'`, `hunger = 50, happiness = 50, energy = 20`; call `tick()`.  
**Assert**: `petState === 'Sick'` (energy decayed to 19).

---

### UT-STATE-006 — Sick → Normal after 3 recovery ticks (hasEvolved false)
**Maps to**: REQ-STATE-004, REQ-STATE-006  
**Setup**: Set `petState = 'Sick'`, `hasEvolved = false`, `hunger = 80, happiness = 80, energy = 80`; call `tick()` three times.  
**Assert after 3rd tick**:
- `petState === 'Normal'`
- `recoveryTicks === 0`

---

### UT-STATE-007 — Sick → Evolved after 3 recovery ticks (hasEvolved true)
**Maps to**: REQ-STATE-004, REQ-STATE-006  
**Setup**: Set `petState = 'Sick'`, `hasEvolved = true`, `hunger = 80, happiness = 80, energy = 80`; call `tick()` three times.  
**Assert after 3rd tick**:
- `petState === 'Evolved'`
- `recoveryTicks === 0`

---

### UT-STATE-008 — recoveryTicks increments each qualifying tick while Sick
**Maps to**: REQ-STATE-004  
**Setup**: Set `petState = 'Sick'`, `hunger = 60, happiness = 60, energy = 60`; call `tick()` twice.  
**Assert after 1st tick**: `recoveryTicks === 1`.  
**Assert after 2nd tick**: `recoveryTicks === 2`.

---

### UT-STATE-009 — recoveryTicks resets when any stat drops below 50 while Sick
**Maps to**: REQ-STATE-010  
**Setup**: Set `petState = 'Sick'`, `recoveryTicks = 2`, `hunger = 52, happiness = 60, energy = 60`; call `tick()` (Hunger decays to 49).  
**Assert**: `recoveryTicks === 0`. `petState === 'Sick'`.

---

### UT-STATE-010 — Normal → Evolved after 10 consecutive qualifying ticks
**Maps to**: REQ-STATE-005  
**Setup**: Set `petState = 'Normal'`, `hasEvolved = false`, `hunger = 100, happiness = 100, energy = 100`; call `tick()` ten times (stats remain well above 80 across all ticks).  
**Assert after 10th tick**:
- `petState === 'Evolved'`
- `hasEvolved === true`
- `evolutionTicks >= 10`

---

### UT-STATE-011 — evolutionTicks increments each qualifying tick while Normal
**Maps to**: REQ-STATE-005  
**Setup**: Set `petState = 'Normal'`, `hunger = 100, happiness = 100, energy = 100`; call `tick()` three times.  
**Assert after 1st tick**: `evolutionTicks === 1`.  
**Assert after 3rd tick**: `evolutionTicks === 3`.

---

### UT-STATE-012 — evolutionTicks resets when any stat drops below 80
**Maps to**: REQ-STATE-011  
**Setup**: Set `petState = 'Normal'`, `evolutionTicks = 7`, `hunger = 82, happiness = 80, energy = 80`; call `tick()` (Hunger decays to 79).  
**Assert**: `evolutionTicks === 0`.

---

### UT-STATE-013 — evolutionTicks resets on Normal → Sick transition
**Maps to**: REQ-STATE-012  
**Setup**: Set `petState = 'Normal'`, `evolutionTicks = 8`, `hunger = 22, happiness = 50, energy = 50`; call `tick()` (Hunger decays to 19).  
**Assert**: `petState === 'Sick'` and `evolutionTicks === 0`.

---

### UT-STATE-014 — Sick blocks evolution check even with all stats ≥ 80
**Maps to**: REQ-STATE-007  
**Setup**: Set `petState = 'Sick'`, `evolutionTicks = 0`, `hunger = 90, happiness = 90, energy = 90`; call `tick()` eleven times.  
**Assert**: `petState` never becomes `'Evolved'`. `evolutionTicks === 0` throughout.

---

### UT-STATE-015 — Evolved → Sick when any stat drops below 20
**Maps to**: REQ-STATE-008  
**Setup**: Set `petState = 'Evolved'`, `hasEvolved = true`, `hunger = 22, happiness = 80, energy = 80`; call `tick()`.  
**Assert**:
- `petState === 'Sick'`
- `hasEvolved === true`

---

### UT-STATE-016 — State machine fields persist after transition
**Maps to**: REQ-STATE-014  
**Setup**: Set `petState = 'Normal'`, `hunger = 22`; call `tick()` to trigger Sick transition.  
**Assert**: `JSON.parse(localStorage.getItem('tamogotchi-store')).state.petState === 'Sick'`.

---

### UT-STATE-017 — State and counters rehydrate from localStorage
**Maps to**: REQ-STATE-014  
**Setup**: Write `{ petState: 'Sick', hasEvolved: true, recoveryTicks: 2, evolutionTicks: 0 }` to `localStorage`; reinitialize store.  
**Assert**:
- `petState === 'Sick'`
- `hasEvolved === true`
- `recoveryTicks === 2`

---

## E2E Tests (Playwright)

---

### E2E-STATE-001 — Pet state indicator is visible and shows Normal on fresh load
**Maps to**: REQ-STATE-002, REQ-STATE-009  
**Setup**: Clear `localStorage`.  
**Steps**:
1. Navigate to app; complete naming screen.
2. Assert `data-testid="pet-state"` (or equivalent) is visible.
3. Assert the UI reflects Normal state (e.g., text `"Normal"` or absence of Sick/Evolved classes).

---

### E2E-STATE-002 — Pet becomes Sick when a stat crosses below 20
**Maps to**: REQ-STATE-003, REQ-STATE-009  
**Setup**: Seed `localStorage` with `petState="Normal", hunger=22, happiness=80, energy=80, petName="Pip"`.  
**Steps**:
1. Navigate; advance clock by 10,000 ms (one tick; Hunger decays to 19).
2. Assert UI reflects Sick state.

---

### E2E-STATE-003 — Sick pet recovers to Normal after 3 recovery ticks
**Maps to**: REQ-STATE-004  
**Setup**: Seed `localStorage` with `petState="Sick", hasEvolved=false, hunger=80, happiness=80, energy=80, petName="Pip"`.  
**Steps**:
1. Navigate; advance clock by 30,000 ms (3 ticks; stats remain well above 50).
2. Assert UI reflects Normal state.

---

### E2E-STATE-004 — Sick pet with hasEvolved=true recovers to Evolved
**Maps to**: REQ-STATE-006  
**Setup**: Seed `localStorage` with `petState="Sick", hasEvolved=true, hunger=80, happiness=80, energy=80, petName="Pip"`.  
**Steps**:
1. Navigate; advance clock by 30,000 ms.
2. Assert UI reflects Evolved state (not Normal).

---

### E2E-STATE-005 — Pet evolves after 10 qualifying ticks
**Maps to**: REQ-STATE-005  
**Setup**: Seed `localStorage` with `petState="Normal", hunger=100, happiness=100, energy=100, petName="Pip"`.  
**Steps**:
1. Navigate; advance clock by 100,000 ms (10 ticks; stats remain above 80 throughout).
2. Assert UI reflects Evolved state.
3. Assert `data-testid="pet-state"` contains `"Evolved"` or equivalent.

---

### E2E-STATE-006 — Evolved state persists across page reload
**Maps to**: REQ-STATE-014, REQ-STATE-006  
**Setup**: Seed `localStorage` with `petState="Evolved", hasEvolved=true, petName="Pip"`.  
**Steps**:
1. Navigate.
2. Assert UI shows Evolved.
3. Reload page.
4. Assert UI still shows Evolved.

---

### E2E-STATE-007 — Evolved pet can become Sick and recovers to Evolved
**Maps to**: REQ-STATE-008, REQ-STATE-006  
**Setup**: Seed `localStorage` with `petState="Evolved", hasEvolved=true, hunger=22, happiness=80, energy=80, petName="Pip"`.  
**Steps**:
1. Navigate; advance clock by 10,000 ms.
2. Assert UI shows Sick.
3. Use `page.evaluate()` to set `hunger=80, happiness=80, energy=80` in the store directly.
4. Advance clock by 30,000 ms.
5. Assert UI returns to Evolved (not Normal).
