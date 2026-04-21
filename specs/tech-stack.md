# Technology Stack

## Runtime & Build

### React 18 + TypeScript (strict)

**Choice**: React 18 as the UI framework; TypeScript with `"strict": true` throughout.

**Justification**: React's component model maps directly to the pet UI's concerns — a stat-bar component, a state-conditional pet display, action buttons, and a message overlay are all naturally isolated components. Strict TypeScript eliminates an entire class of state management bugs that would otherwise be difficult to trace: a stat accidentally stored as a string would silently break clamping math; a typo in a state name would create an impossible transition. The discipline pays dividends in a project where precise integer ranges and transition counters are core correctness requirements.

**Alternative considered**: Vanilla JS + Web Components — rejected because the boilerplate for reactive stat displays without a framework would consume disproportionate MVP time without any runtime benefit. Svelte — smaller bundle but a narrower ecosystem and less universal team familiarity.

---

### Vite

**Choice**: Vite as the development server and production bundler.

**Justification**: Sub-100 ms HMR means the inner development loop is nearly instant when iterating on stat bar styles or state-conditional rendering. Vite's native ESM server requires zero configuration for React + TypeScript. The production build uses Rollup for tree-shaking, producing a minimal static bundle suitable for deployment on any CDN or static host — which is required since the app has no backend.

**Alternative considered**: Create React App — officially deprecated since 2023. Next.js — adds SSR, routing, and server component complexity that is entirely unnecessary for a client-only SPA.

---

## Styling

### Tailwind CSS (JIT mode)

**Choice**: Tailwind CSS utility-first styling.

**Justification**: The app has extensive state-conditional visual requirements: stat bars must change color as values drop (green → yellow → red), the pet's appearance must differ between Normal, Sick, and Evolved states, and message overlays must appear and auto-dismiss. All of these are expressed concisely with Tailwind's conditional class utilities (`bg-red-500`, `animate-pulse`, `opacity-0 transition-opacity`) without requiring class naming decisions. Tailwind's JIT compiler scans used classes at build time, so the production CSS bundle remains small regardless of how many utility classes are defined in the framework.

**Alternative considered**: CSS Modules — more verbose for conditional class composition; requires naming decisions for each class. Plain CSS — maintenance burden grows quickly as states multiply. Styled-components — adds a runtime CSS-in-JS cost and complicates SSR (irrelevant here but still unnecessary complexity).

---

### Google Fonts — "Press Start 2P" and "VT323"

**Choice**: Two Google Fonts loaded via `<link>` in `index.html`: "Press Start 2P" (pixel-art bitmap style) for device chrome labels and button text, and "VT323" (LCD dot-matrix style) for all in-screen content — stat labels, pet messages, and the naming form.

**Justification**: The retro handheld aesthetic requires typography that reads as physical hardware rather than a generic web app. "Press Start 2P" is the canonical pixel-art font and renders crisply at 7–10 px; "VT323" approximates the dot-matrix LCD character sets found on actual Tamagotchi devices and remains legible at 14–22 px on a small simulated screen. Both are served by Google Fonts CDN with `display=swap` to avoid layout shift. No font fallback is used for game labels — if fonts are unavailable the visual polish degrades gracefully but the layout is unaffected.

**Alternative considered**: System monospace stack (`font-family: monospace`) — universally available but lacks the period-accurate bitmap appearance required by the retro aesthetic. Self-hosted font files — eliminates the CDN dependency but adds build complexity without benefit for an MVP.

---

### CSS Keyframe Animations

**Choice**: All pet and UI animations are implemented as named `@keyframes` rules in `src/index.css`, applied via inline `animation` properties or utility classes. No external animation library is used.

**Justification**: The retro pet aesthetic requires looping animations (continuous float, eye-blink, wobble, golden glow), one-shot reaction animations (jump, spin, shake, droop), and particle effects (floatUp, zzzFloat) — none of which are expressible as single CSS transitions. Native `@keyframes` are zero-dependency, compile to zero JS, and run on the GPU compositor thread, keeping the main thread free for game logic. Defining all keyframes in a single CSS file makes the full animation vocabulary visible in one place.

**Animation inventory**:
| Keyframe | Purpose |
|---|---|
| `petFloat` | Normal / Evolved pet hover loop (3 s infinite) |
| `eyeBlink` | Eye-scale blink loop (4 s infinite) |
| `petWobble` | Sick pet rotation loop (1.6 s infinite) |
| `goldGlow` | Evolved drop-shadow pulse (2 s infinite) |
| `reactionJump` | Feed success — one-shot jump + squash (0.65 s) |
| `reactionSpin` | Play success — one-shot 360° spin (0.6 s) |
| `reactionShake` | EGG-001 rejection — one-shot lateral shake (0.5 s) |
| `reactionDroop` | Rest / EGG-002 — one-shot droop (0.8 s) |
| `floatUp` | Food / sparkle particle rise + fade (0.85 s) |
| `zzzFloat` | Rest Zzz bubble rise + fade (0.85 s) |
| `orbit` | Evolved sparkle — continuous circular orbit (2.6 s infinite) |
| `fadeIn` | Pet sprite crossfade on state change (0.4 s) |
| `pulseSlow` | Stat bar opacity pulse when value < 40 (1.4 s infinite) |
| `pulseFast` | Stat bar opacity pulse when value < 20 (0.6 s infinite) |
| `labelShake` | Stat label horizontal shake when value < 20 (0.4 s infinite) |
| `bgDrift` | Application background gradient drift (20 s infinite) |

**Alternative considered**: Framer Motion — expressive API but adds ~40 KB to the bundle for animations that are entirely achievable in plain CSS. CSS Transitions alone — insufficient; transitions require a start and end value but looping and multi-keyframe animations require `@keyframes`.

---

## State Management

### Zustand

**Choice**: Zustand for global application state, with the built-in `persist` middleware.

**Justification**: The pet's vitals, state-machine status (`Normal | Sick | Evolved`), tick counters (`recoveryTicks`, `evolutionTicks`), the `hasEvolved` permanence flag, personality timer state, and pet name form a single coherent store. Zustand provides a flat, subscription-based store in under 1 KB with no Provider boilerplate. Its `persist` middleware serializes the store to `localStorage` on every state write and rehydrates on load — eliminating the need for any custom serialization code. Pure action functions on the store (e.g., `tick()`, `feed()`, `play()`, `rest()`) are easily imported and called in unit tests without a React component tree.

**Alternative considered**: Redux Toolkit — architecturally correct but generates significant boilerplate (slices, selectors, thunks) that is disproportionate to a single-store app of this size. React Context + `useReducer` — no built-in persistence middleware; testing reducers requires more ceremony; fine-grained subscription optimization is manual.

---

## Persistence

### localStorage (via Zustand `persist` middleware)

**Choice**: Browser `localStorage` accessed exclusively through Zustand's `persist` middleware, keyed at `"tamogotchi-store"`.

**Justification**: Directly satisfies the zero-backend constraint stated in `mission.md`. The `persist` middleware handles serialization, rehydration, and partial-state merging automatically. localStorage is synchronous, universally available, and more than sufficient for < 5 KB of pet state. The Zustand middleware layer means no component or action function ever calls `localStorage` directly — all persistence is an implementation detail of the store.

**Acknowledged limitation**: localStorage is per-origin and per-browser; cross-device sync is impossible. This is an accepted MVP constraint explicitly listed as out-of-scope in `mission.md`. Multiple open tabs will race on writes; the last write wins. This is also an accepted MVP limitation.

---

## Testing

### Vitest

**Choice**: Vitest for unit and integration testing.

**Justification**: Vitest shares Vite's transform pipeline, meaning tests run in the same module environment as the application — no separate Babel config, no `moduleNameMapper` hacks for CSS or assets. It is API-compatible with Jest, so patterns (`describe`, `it`, `expect`, `vi.useFakeTimers`) are immediately familiar. Watch mode is significantly faster than Jest for iterative test-driven development on the state logic modules. The `@vitest/coverage-v8` reporter produces the ≥ 90% coverage report required by the success criteria in `mission.md`.

**Scope**: All pure state logic — tick engine, care action deltas, state machine transitions, easter egg guard conditions, and clamping — must have Vitest coverage ≥ 90%.

---

### Playwright

**Choice**: Playwright for end-to-end testing.

**Justification**: Playwright supports Chromium, Firefox, and WebKit (Safari engine) in a single test run with a unified API — directly satisfying the cross-browser success criterion from `mission.md` without maintaining separate test configurations. Its `page.clock.install()` API replaces `Date`, `setTimeout`, and `setInterval` with controllable fakes, making tick-based tests deterministic without real 10-second waits. `page.evaluate()` allows direct `localStorage` seeding, enabling tests to start from any pet state without clicking through the full game loop.

**Scope**: E2E tests cover full user journeys: first-load naming screen, performing all care actions, observing state transitions, verifying localStorage persistence across reloads, and easter egg display behaviors.

---

## Summary Table

| Concern | Technology | Key Reason |
|---|---|---|
| UI framework | React 18 | Reactive component model, broad ecosystem |
| Language | TypeScript (strict) | Type-safe state management, range enforcement |
| Build tool | Vite | Fast HMR, minimal config, static output |
| Styling | Tailwind CSS | Rapid state-conditional UI, minimal bundle |
| Typography | Google Fonts (Press Start 2P + VT323) | Period-accurate pixel/LCD retro aesthetic |
| Animations | CSS `@keyframes` (native) | Zero-dependency, GPU-composited, full animation vocabulary |
| Global state | Zustand | Minimal boilerplate, built-in `persist` middleware |
| Persistence | localStorage | Zero-backend constraint, automatic via middleware |
| Unit tests | Vitest | Vite-native, fast watch mode, fake timer API |
| E2E tests | Playwright | Multi-browser (Chromium/Firefox/WebKit), clock control |
