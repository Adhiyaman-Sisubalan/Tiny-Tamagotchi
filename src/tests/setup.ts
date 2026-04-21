import '@testing-library/jest-dom'

// Zustand persist uses localStorage; jsdom provides it but we reset between tests
beforeEach(() => {
  localStorage.clear()
})
