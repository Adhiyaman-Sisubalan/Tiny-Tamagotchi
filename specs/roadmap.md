# Product Roadmap

## Phase 0 — Project Bootstrap
**Milestone**: Repo Ready — a developer can clone and run `npm run dev` to see a blank React page, and `npm run test` + `npm run e2e` each produce at least one passing smoke test.

### Deliverables
- Vite + React 18 + TypeScript scaffold initialized
- Tailwind CSS integrated and verified with a visible styled element in the browser
- Zustand installed with a minimal counter store wired to a component
- Vitest installed; one unit test asserting `1 + 1 === 2` passes
- Playwright installed; one E2E test that navigates to `localhost:5173` and asserts the page title passes
- ESLint and Prettier configured with no errors on the initial scaffold
- `package.json` scripts: `dev`, `build`, `test`, `test:coverage`, `e2e`

---

## Phase 1 — Vitals Engine
**Milestone**: Stats Tick — a named pet's Hunger, Happiness, and Energy are visible on screen and decrease every 10 seconds.

### Deliverables
- Zustand store with `hunger`, `happiness`, `energy` fields initialized to 50
- `tick()` action applying decay (Hunger −3, Happiness −2, Energy −1) with clamping
- `setInterval`-based tick engine using Page Visibility API to pause/resume
- Stats displayed in the UI (numeric values and/or progress bars)
- Full `localStorage` persistence via Zustand `persist` middleware
- Store rehydration verified on page reload
- Vitest unit tests for: initial defaults, single-tick decay, multi-tick decay, clamping at 0 and 100, visibility-pause behavior, localStorage read/write (covers REQ-VITALS-001 through REQ-VITALS-013)

---

## Phase 2 — Care Actions
**Milestone**: Interactive Pet — the user can Feed, Play, and Rest their pet and observe immediate stat changes.

### Deliverables
- `feed()`, `play()`, `rest()` actions in the Zustand store with correct simultaneous deltas
- Feed, Play, Rest buttons in the UI, each wired to their respective store action
- Pet naming screen shown on first load (no saved name); text input with 2–20 char validation
- Pet name persisted to `localStorage`; naming screen never shown again after name is set
- Pet name displayed in the main UI
- Vitest unit tests for all care action deltas and edge cases (boundary clamping, simultaneous delta application) covering REQ-CARE-001 through REQ-CARE-008

---

## Phase 3 — State Machine
**Milestone**: Pet Evolves — the pet visually changes appearance when it transitions between Normal, Sick, and Evolved states.

### Deliverables
- `petState` field (`'Normal' | 'Sick' | 'Evolved'`) and `hasEvolved` boolean in store
- `recoveryTicks` and `evolutionTicks` counters in store, persisted
- State transition logic running after every tick (see state-machine feature plan for exact algorithm)
- Visually distinct UI treatment for each state (e.g., color, icon, or label change)
- Evolved state confirmed permanent: Evolved → Sick → recovers back to Evolved
- Vitest unit tests for all transition conditions, counter increment/reset logic, and the `hasEvolved` permanence (covers REQ-STATE-001 through REQ-STATE-014)

---

## Phase 4 — Personality & Polish
**Milestone**: Feature Complete — all easter eggs are active, idle quips fire, and the UI is visually polished at 375 px and 1280 px.

### Deliverables
- EGG-001: Feed blocked when `hunger > 90`; "I'm not hungry!" message displayed
- EGG-002: Play executes but "Zzz... too tired to play" shown for 3 seconds when `energy < 20`
- EGG-003: Idle quip displayed after 60 consecutive seconds of no user action; chosen randomly from 3 strings
- Interaction timer resets on Feed, Play, or Rest
- All personality messages rendered in a consistent `pet-message` UI region with auto-dismiss
- Responsive layout verified at 375 px and 1280 px breakpoints
- Vitest unit tests for all personality conditions (covers REQ-PERS-001 through REQ-PERS-012)

---

## Phase 5 — QA & Launch
**Milestone**: MVP Shipped — all tests pass, the app is deployed, and the README documents setup.

### Deliverables
- Unit test coverage report shows ≥ 90% on state logic modules
- Full Playwright E2E suite green across Chromium, Firefox, and WebKit
- Cross-browser manual verification: Chrome, Firefox, Safari (latest stable)
- Static deployment to Vercel, Netlify, or GitHub Pages
- `README.md` with: prerequisites, `npm install` + `npm run dev` instructions, test commands, and a brief feature overview
- All known P0 and P1 bugs resolved
