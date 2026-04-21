# 🐾 LULU — Tiny Tamagotchi

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white&style=flat-square)
![Zustand](https://img.shields.io/badge/Zustand-state-FF6B35?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
![Vitest](https://img.shields.io/badge/Vitest-unit-6E9F18?logo=vitest&logoColor=white&style=flat-square)
![Playwright](https://img.shields.io/badge/Playwright-e2e-2EAD33?logo=playwright&logoColor=white&style=flat-square)

## Overview

A browser-based virtual pet that lives in a retro handheld device frame — no install, no account, just open and play. Built as a **Spec-Driven Development** project for the [DeepLearning.AI 7-Day Challenge](https://community.deeplearning.ai/t/7-day-learner-challenge-tiny-tamagotchi-mvp-with-spec-driven-development/891489): every requirement, acceptance criterion, and test was written in `/specs` and `/features` *before* a single line of implementation.

## Live Demo

🎥 [Watch the walkthrough on Loom](https://www.loom.com/share/88c7a090c0f944c29daab02e4a9921d1)

## Spec-Driven Development Structure

All specifications were authored before implementation and live alongside the code:

```
specs/
  mission.md        # Product mission, constraints, success criteria
  tech-stack.md     # Technology choices with justifications
  roadmap.md        # Phased delivery plan

features/
  vitals/
    requirements.md   # REQ-VITALS-001–016 — stat decay, persistence, visual thresholds
    feature-plan.md   # Implementation approach
    validation.md     # Test mapping (unit + E2E)
  state-machine/
    requirements.md   # REQ-STATE-001–018 — Normal/Sick/Evolved transitions + sprites
    feature-plan.md
    validation.md
  care-actions/
    requirements.md   # REQ-CARE-001–012 — Feed/Play/Rest deltas, guards, animations
    feature-plan.md
    validation.md
  personality/
    requirements.md   # REQ-PERS-001–018 — naming, easter eggs, idle quips, animations
    feature-plan.md
    validation.md
```

## Features

- 🍖 **Living vitals** — Hunger, Happiness, Energy decay every 10 s; bars turn orange (<40) then pulse red (<20)
- 🎮 **Care actions** — Feed, Play, Rest each with unique stat deltas, reaction animations, and particle effects
- 🔄 **Dynamic states** — Normal → Sick → Evolved with distinct CSS blob sprites and looping animations
- 🥚 **Easter eggs** — EGG-001 (overfed shake), EGG-002 (tired droop), EGG-003 (idle quip after 60 s)
- 📺 **Retro UI** — Egg-shaped device frame, green LCD screen with scanlines, pixel fonts, physical button press
- 💾 **Persistence** — Full state survives hard reloads via `localStorage`

## Running Locally

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm run test:unit    # 81 unit tests (Vitest)
npm run test:e2e     # 27 e2e tests (Playwright)
```

## Project Structure

```
specs/                        # Product & technical specifications
features/                     # Per-feature requirements, plans, validation
src/
  App.tsx                     # Root — DeviceFrame + Game / NamingScreen
  index.css                   # All @keyframes + device CSS classes
  components/
    DeviceFrame.tsx            # Egg-shaped shell, LCD screen, button slot
    PetSprite.tsx              # CSS-only blob sprites (Normal / Sick / Evolved)
    PetDisplay.tsx             # Sprite + particle effects + state badge
    VitalsDisplay.tsx          # Animated stat bars with color thresholds
    ActionButtons.tsx          # Physical button presenters (pure UI)
    MessageToast.tsx           # LCD-style in-screen message bubble
    NamingScreen.tsx           # First-run pet naming form
  hooks/
    useGameLoop.ts             # 10 s tick + Page Visibility API
    useIdleQuip.ts             # 60 s idle timer + 5 s quip dismiss
  store/
    usePetStore.ts             # Zustand store — all game state + actions
  tests/
    unit/                      # Vitest unit tests (81 tests)
    e2e/                       # Playwright e2e tests (27 tests)
```

## Challenge Submission

[DeepLearning.AI 7-Day Challenge — Tiny Tamagotchi MVP with Spec-Driven Development](https://community.deeplearning.ai/t/7-day-learner-challenge-tiny-tamagotchi-mvp-with-spec-driven-development/891489)
