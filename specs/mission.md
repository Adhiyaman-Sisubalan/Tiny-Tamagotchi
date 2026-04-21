# Product Mission

## Mission Statement

Tiny Tamagotchi is a browser-based virtual pet companion that brings the nostalgic joy of caregiving into a frictionless web experience — no app install, no account required, open and play. The pet persists across sessions through localStorage, rewards consistent care with visible progression, and punishes neglect with a Sick state — creating a lightweight but emotionally resonant feedback loop.

## Target Audience

| Segment | Description |
|---|---|
| Primary | Adults 18–35 with nostalgia for 1990s Tamagotchi handheld devices |
| Secondary | Casual web users seeking a low-commitment, playful distraction during work or study breaks |
| Tertiary | Developers and hobbyists using the project as a reference implementation for spec-driven React development |

## Constraints

- **Zero backend**: All state is client-only via `localStorage`. No server, no API, no authentication.
- **Single pet per browser**: The MVP supports exactly one pet per browser origin. Multi-pet support is out of scope.
- **Real-time but forgiving**: The tick system runs only while the browser tab is visible (Page Visibility API). Closing or backgrounding the tab does not punish the player.
- **Mobile-friendly, not mobile-first**: Layout must be usable at 375 px viewport width, but visual fidelity is optimized for desktop.
- **No audio**: Sound effects and music are explicitly excluded from the MVP scope.
- **Accessibility baseline**: WCAG 2.1 AA color contrast must be met. Full keyboard navigation is a stretch goal, not a hard MVP requirement.
- **No pet death**: Pets can become Sick but cannot die in the MVP. The Sick state is the maximum negative consequence.
- **CSS-only visuals**: All animations and visual effects are implemented with native CSS (`@keyframes`, transitions, `border-radius` shapes). No HTML `<canvas>`, SVG animation libraries, WebGL, or external animation runtimes (e.g. Framer Motion, GSAP) are used.

## Out-of-Scope Items

The following items are explicitly excluded from MVP scope and must not be designed for or partially implemented:

- User accounts or cloud sync
- Multiple simultaneous pets
- Pet trading or social/multiplayer features
- Paid features or monetization of any kind
- Native mobile application
- Sound effects or background music
- Third-party animation libraries (e.g. Framer Motion, GSAP, Lottie); physics-based or WebGL animations
- A pet death mechanic
- Item inventory, shop, or economy systems
- Achievements, badges, or a leaderboard beyond the Evolved visual state
- Rename mechanic after initial pet naming

## Success Criteria

The MVP is considered complete when all of the following are true:

1. A user can load the app, name a pet, and perform all three care actions (Feed, Play, Rest) within 60 seconds of first visit.
2. Vitals (Hunger, Happiness, Energy) visibly decay on a 10-second tick without any page refresh.
3. A pet that satisfies the Evolved condition displays a visually distinct appearance from Normal.
4. A pet that satisfies the Sick condition displays a visually distinct appearance from Normal.
5. All pet state (stats, current state, name, tick counters) survives a hard browser refresh.
6. The app renders and functions correctly on Chrome, Firefox, and Safari (latest stable releases).
7. Unit test suite achieves ≥ 90% coverage on all state logic modules (tick engine, care actions, state machine, personality checks).
8. The full E2E suite completes in under 60 seconds.
9. The app presents a retro handheld device aesthetic: an egg/pill-shaped device frame, a green-tinted LCD screen with scanline overlay, pixel-art typography ("Press Start 2P" / "VT323"), CSS-only pet blob sprites with per-state animations (float / wobble / glow), and physical press-down effects on action buttons. No external image assets are used.
