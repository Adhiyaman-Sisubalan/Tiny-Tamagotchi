import { test, expect, Page } from '@playwright/test'

// ─── Helper: seed localStorage before navigation ──────────────────────────────

async function seedStore(page: Page, overrides: Record<string, unknown> = {}) {
  const defaults = {
    hunger: 50,
    happiness: 50,
    energy: 50,
    petState: 'Normal',
    hasEvolved: false,
    recoveryTicks: 0,
    evolutionTicks: 0,
    petName: 'Pip',
    petMessage: '',
  }
  const state = { ...defaults, ...overrides }
  await page.addInitScript((s) => {
    localStorage.setItem('tamogotchi-store', JSON.stringify({ state: s, version: 0 }))
  }, state)
}

// ─── Naming Screen ────────────────────────────────────────────────────────────

test.describe('Naming Screen', () => {
  // REQ-PERS-001
  test('E2E-PERS-001 — naming screen shown on first load with no saved name', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('action-feed')).not.toBeVisible()
  })

  // REQ-PERS-001, REQ-PERS-004, REQ-PERS-006
  test('E2E-PERS-002 — valid name submission transitions to game UI and displays name', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByTestId('name-input').fill('Mochi')
    await page.getByTestId('name-submit').click()
    await expect(page.getByTestId('name-input')).not.toBeVisible()
    await expect(page.getByTestId('pet-name')).toHaveText('Mochi')
    await expect(page.getByTestId('action-feed')).toBeVisible()
  })

  // REQ-PERS-003
  test('E2E-PERS-003 — one-character name is rejected with an inline error', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('name-input').fill('X')
    await page.getByTestId('name-submit').click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByTestId('name-input')).toBeVisible()
  })

  // REQ-PERS-002, REQ-PERS-005
  test('E2E-PERS-004 — naming screen is skipped on return visit (saved name exists)', async ({
    page,
  }) => {
    await seedStore(page, { petName: 'Pip' })
    await page.goto('/')
    await expect(page.getByTestId('name-input')).not.toBeVisible()
    await expect(page.getByTestId('pet-name')).toHaveText('Pip')
  })

  // REQ-PERS-004, REQ-PERS-005
  test('E2E-PERS-010 — pet name persists across a hard page reload', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('name-input').fill('Bolt')
    await page.getByTestId('name-submit').click()
    await page.reload()
    await expect(page.getByTestId('name-input')).not.toBeVisible()
    await expect(page.getByTestId('pet-name')).toHaveText('Bolt')
  })
})

// ─── Vitals ───────────────────────────────────────────────────────────────────

test.describe('Vitals', () => {
  // REQ-VITALS-010
  test('E2E-VITALS-001 — stat display elements are visible after naming', async ({ page }) => {
    await seedStore(page)
    await page.goto('/')
    await expect(page.getByTestId('stat-hunger')).toBeVisible()
    await expect(page.getByTestId('stat-happiness')).toBeVisible()
    await expect(page.getByTestId('stat-energy')).toBeVisible()
  })

  // REQ-VITALS-006, REQ-VITALS-007, REQ-VITALS-008
  test('E2E-VITALS-002 — stats decay by correct amounts after one simulated tick', async ({
    page,
  }) => {
    await seedStore(page, { hunger: 50, happiness: 50, energy: 50 })
    await page.clock.install()
    await page.goto('/')
    await page.clock.fastForward(10_000)
    await expect(page.getByTestId('stat-hunger')).toHaveText('47')
    await expect(page.getByTestId('stat-happiness')).toHaveText('48')
    await expect(page.getByTestId('stat-energy')).toHaveText('49')
  })

  // REQ-VITALS-006, REQ-VITALS-007, REQ-VITALS-008
  test('E2E-VITALS-003 — stats decay correctly after three consecutive ticks', async ({
    page,
  }) => {
    await seedStore(page, { hunger: 50, happiness: 50, energy: 50 })
    await page.clock.install()
    await page.goto('/')
    await page.clock.runFor(30_000)
    await expect(page.getByTestId('stat-hunger')).toHaveText('41')
    await expect(page.getByTestId('stat-happiness')).toHaveText('44')
    await expect(page.getByTestId('stat-energy')).toHaveText('47')
  })

  // REQ-VITALS-011, REQ-VITALS-012
  test('E2E-VITALS-004 — decayed stats are persisted to localStorage after ticks', async ({
    page,
  }) => {
    await seedStore(page, { hunger: 50, happiness: 50, energy: 50 })
    await page.clock.install()
    await page.goto('/')
    await page.clock.runFor(30_000)
    // Verify Zustand persist saved decayed values to localStorage
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('tamogotchi-store')
      return raw ? (JSON.parse(raw) as { state: Record<string, unknown> }).state : {}
    })
    expect(saved['hunger']).toBe(41)
    expect(saved['happiness']).toBe(44)
    expect(saved['energy']).toBe(47)
  })

  // REQ-VITALS-004, REQ-VITALS-013
  test('E2E-VITALS-005 — tick pauses when tab is hidden; resumes with no catch-up on return', async ({
    page,
  }) => {
    await seedStore(page, { hunger: 50, happiness: 50, energy: 50 })
    await page.clock.install()
    await page.goto('/')

    // Hide the tab
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // 60 s while hidden — would have been 6 ticks; none should fire
    await page.clock.fastForward(60_000)

    // Stats must be unchanged (no catch-up)
    await expect(page.getByTestId('stat-hunger')).toHaveText('50')
    await expect(page.getByTestId('stat-happiness')).toHaveText('50')
    await expect(page.getByTestId('stat-energy')).toHaveText('50')

    // Restore visibility — new interval counts from 0
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Advance exactly 10 s → exactly one tick
    await page.clock.fastForward(10_000)
    await expect(page.getByTestId('stat-hunger')).toHaveText('47')
    await expect(page.getByTestId('stat-happiness')).toHaveText('48')
    await expect(page.getByTestId('stat-energy')).toHaveText('49')
  })

  // REQ-VITALS-009
  test('E2E-VITALS-006 — stats are clamped at 0 and never go negative', async ({ page }) => {
    await seedStore(page, { hunger: 2, happiness: 1, energy: 0 })
    await page.clock.install()
    await page.goto('/')
    await page.clock.fastForward(10_000)
    await expect(page.getByTestId('stat-hunger')).toHaveText('0')
    await expect(page.getByTestId('stat-happiness')).toHaveText('0')
    await expect(page.getByTestId('stat-energy')).toHaveText('0')
  })
})

// ─── Care Actions ─────────────────────────────────────────────────────────────

test.describe('Care Actions', () => {
  // REQ-CARE-001, REQ-CARE-008
  test('E2E-CARE-001 — Feed button is visible, enabled, and applies correct deltas', async ({
    page,
  }) => {
    await seedStore(page, { hunger: 40, happiness: 60, energy: 70 })
    await page.goto('/')
    await expect(page.getByTestId('action-feed')).toBeVisible()
    await expect(page.getByTestId('action-feed')).toBeEnabled()
    await page.getByTestId('action-feed').click()
    await expect(page.getByTestId('stat-hunger')).toHaveText('70')
    await expect(page.getByTestId('stat-happiness')).toHaveText('65')
    await expect(page.getByTestId('stat-energy')).toHaveText('65')
  })

  // REQ-CARE-002, REQ-CARE-008
  test('E2E-CARE-002 — Play button is visible, enabled, and applies correct deltas', async ({
    page,
  }) => {
    await seedStore(page, { happiness: 50, hunger: 60, energy: 50 })
    await page.goto('/')
    await expect(page.getByTestId('action-play')).toBeEnabled()
    await page.getByTestId('action-play').click()
    await expect(page.getByTestId('stat-happiness')).toHaveText('75')
    await expect(page.getByTestId('stat-hunger')).toHaveText('50')
    await expect(page.getByTestId('stat-energy')).toHaveText('40')
  })

  // REQ-CARE-003, REQ-CARE-008
  test('E2E-CARE-003 — Rest button is visible, enabled, and applies correct deltas', async ({
    page,
  }) => {
    await seedStore(page, { energy: 50, hunger: 60, happiness: 40 })
    await page.goto('/')
    await expect(page.getByTestId('action-rest')).toBeEnabled()
    await page.getByTestId('action-rest').click()
    await expect(page.getByTestId('stat-energy')).toHaveText('90')
    await expect(page.getByTestId('stat-hunger')).toHaveText('55')
    await expect(page.getByTestId('stat-happiness')).toHaveText('40')
  })

  // REQ-CARE-008
  test('E2E-CARE-006 — all three action buttons are enabled when petState is Sick', async ({
    page,
  }) => {
    await seedStore(page, { petState: 'Sick' })
    await page.goto('/')
    await expect(page.getByTestId('action-feed')).toBeEnabled()
    await expect(page.getByTestId('action-play')).toBeEnabled()
    await expect(page.getByTestId('action-rest')).toBeEnabled()
  })

  // REQ-CARE-008
  test('E2E-CARE-007 — all three action buttons are enabled when petState is Evolved', async ({
    page,
  }) => {
    await seedStore(page, { petState: 'Evolved', hasEvolved: true })
    await page.goto('/')
    await expect(page.getByTestId('action-feed')).toBeEnabled()
    await expect(page.getByTestId('action-play')).toBeEnabled()
    await expect(page.getByTestId('action-rest')).toBeEnabled()
  })
})

// ─── State Machine ────────────────────────────────────────────────────────────

test.describe('State Machine', () => {
  // REQ-STATE-002, REQ-STATE-009
  test('E2E-STATE-001 — pet state indicator is visible and shows Normal on fresh load', async ({
    page,
  }) => {
    await seedStore(page)
    await page.goto('/')
    await expect(page.getByTestId('pet-state')).toBeVisible()
    await expect(page.getByTestId('pet-state')).toHaveText('Normal')
  })

  // REQ-STATE-003, REQ-STATE-009
  test('E2E-STATE-002 — pet transitions to Sick when a stat decays below 20', async ({ page }) => {
    await seedStore(page, { petState: 'Normal', hunger: 22, happiness: 80, energy: 80 })
    await page.clock.install()
    await page.goto('/')
    await page.clock.fastForward(10_000) // hunger → 19
    await expect(page.getByTestId('pet-state')).toHaveText('Sick')
  })

  // REQ-STATE-004
  test('E2E-STATE-003 — Sick pet recovers to Normal after 3 qualifying ticks (hasEvolved false)', async ({
    page,
  }) => {
    await seedStore(page, {
      petState: 'Sick',
      hasEvolved: false,
      hunger: 80,
      happiness: 80,
      energy: 80,
    })
    await page.clock.install()
    await page.goto('/')
    await page.clock.runFor(30_000) // 3 ticks; stats remain ≥50 throughout
    await expect(page.getByTestId('pet-state')).toHaveText('Normal')
  })

  // REQ-STATE-006
  test('E2E-STATE-004 — Sick pet with hasEvolved=true recovers to Evolved, not Normal', async ({
    page,
  }) => {
    await seedStore(page, {
      petState: 'Sick',
      hasEvolved: true,
      hunger: 80,
      happiness: 80,
      energy: 80,
    })
    await page.clock.install()
    await page.goto('/')
    await page.clock.runFor(30_000)
    await expect(page.getByTestId('pet-state')).toHaveText('Evolved!')
  })

  // REQ-STATE-005
  test('E2E-STATE-005 — pet evolves after evolutionTicks reaches 10', async ({ page }) => {
    // Set evolutionTicks=9 with stats that stay ≥80 for one more tick (100−3=97, etc.)
    await seedStore(page, {
      petState: 'Normal',
      evolutionTicks: 9,
      hunger: 100,
      happiness: 100,
      energy: 100,
    })
    await page.clock.install()
    await page.goto('/')
    await page.clock.fastForward(10_000) // one tick → evolutionTicks=10 → Evolved
    await expect(page.getByTestId('pet-state')).toHaveText('Evolved!')
  })

  // REQ-STATE-006, REQ-STATE-014
  test('E2E-STATE-006 — Evolved state persists across a hard page reload', async ({ page }) => {
    await seedStore(page, { petState: 'Evolved', hasEvolved: true })
    await page.goto('/')
    await expect(page.getByTestId('pet-state')).toHaveText('Evolved!')
    await page.reload()
    await expect(page.getByTestId('pet-state')).toHaveText('Evolved!')
  })
})

// ─── Easter Eggs ──────────────────────────────────────────────────────────────

test.describe('Easter Eggs', () => {
  // REQ-PERS-007, REQ-PERS-008, REQ-PERS-009
  test('E2E-PERS-005 — EGG-001: Feed blocked at hunger=95; "I\'m not hungry!" shown; stats unchanged', async ({
    page,
  }) => {
    await seedStore(page, { hunger: 95, happiness: 50, energy: 50 })
    await page.goto('/')
    await page.getByTestId('action-feed').click()
    await expect(page.getByTestId('pet-message')).toHaveText("I'm not hungry!")
    await expect(page.getByTestId('stat-hunger')).toHaveText('95')
    await expect(page.getByTestId('stat-happiness')).toHaveText('50')
    await expect(page.getByTestId('stat-energy')).toHaveText('50')
  })

  // REQ-PERS-007
  test('E2E-PERS-006 — EGG-001: Feed is NOT blocked at hunger=90 (boundary exclusive)', async ({
    page,
  }) => {
    await seedStore(page, { hunger: 90 })
    await page.goto('/')
    await page.getByTestId('action-feed').click()
    await expect(page.getByTestId('stat-hunger')).toHaveText('100')
    const msgText = await page.locator('[data-testid="pet-message"]').textContent({ timeout: 500 }).catch(() => '')
    expect(msgText).not.toBe("I'm not hungry!")
  })

  // REQ-PERS-010, REQ-PERS-011
  test('E2E-PERS-007 — EGG-002: Play executes and shows tired message at energy=15; dismisses after 3 s', async ({
    page,
  }) => {
    await seedStore(page, { energy: 15, happiness: 50, hunger: 40 })
    await page.clock.install()
    await page.goto('/')
    await page.getByTestId('action-play').click()
    await expect(page.getByTestId('pet-message')).toHaveText('Zzz... too tired to play')
    await expect(page.getByTestId('stat-happiness')).toHaveText('75') // action executed
    await page.clock.fastForward(3_000)
    await expect(page.getByTestId('pet-message')).not.toBeVisible()
  })

  // REQ-PERS-012, REQ-PERS-013, REQ-PERS-014
  test('E2E-PERS-008 — EGG-003: idle quip fires after 60 s of no interaction; dismisses after 5 s', async ({
    page,
  }) => {
    await seedStore(page)
    await page.clock.install()
    await page.goto('/')
    await page.clock.fastForward(60_000)
    const msg = page.getByTestId('pet-message')
    await expect(msg).toBeVisible()
    const text = await msg.textContent()
    const QUIPS = [
      'Hello? Is anyone there...?',
      'I could really use a snack right now.',
      'Just gonna stare at the wall, I guess.',
    ]
    expect(QUIPS).toContain(text)
    await page.clock.fastForward(5_000)
    await expect(msg).not.toBeVisible()
  })

  // REQ-PERS-015
  test('E2E-PERS-009 — EGG-003: idle timer resets on a care action; quip does not fire', async ({
    page,
  }) => {
    await seedStore(page, { hunger: 50 })
    await page.clock.install()
    await page.goto('/')
    await page.clock.fastForward(55_000)
    // Care action resets the idle timer
    await page.getByTestId('action-feed').click()
    await page.clock.fastForward(10_000) // only 10 s since action; 60 s threshold not reached
    const QUIPS = [
      'Hello? Is anyone there...?',
      'I could really use a snack right now.',
      'Just gonna stare at the wall, I guess.',
    ]
    const text = (await page.locator('[data-testid="pet-message"]').textContent({ timeout: 500 }).catch(() => '')) ?? ''
    expect(QUIPS).not.toContain(text)
  })
})
