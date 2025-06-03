import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock implementations for testing
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}

export const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
}

export const mockSpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  voice: null,
  lang: 'en-US',
}))

// Test data factories
export const createMockGameSession = (overrides = {}) => ({
  trials: 20,
  nLevel: 2,
  accuracy: 75.5,
  visualAccuracy: 80.0,
  audioAccuracy: 71.0,
  averageResponseTime: 1200,
  mode: 'single-visual' as const,
  timestamp: '2024-01-01T12:00:00.000Z',
  actualVisualMatches: 8,
  visualHits: 6,
  visualMisses: 2,
  visualFalseAlarms: 3,
  visualCorrectRejections: 9,
  actualAudioMatches: 7,
  audioHits: 5,
  audioMisses: 2,
  audioFalseAlarms: 4,
  audioCorrectRejections: 9,
  ...overrides,
})

export const createMockPerformanceStats = (overrides = {}) => ({
  visualAccuracy: 80.0,
  audioAccuracy: 70.0,
  overallAccuracy: 75.0,
  avgResponseTime: 1200,
  actualVisualMatches: 8,
  visualHits: 6,
  visualMisses: 2,
  visualFalseAlarms: 3,
  visualCorrectRejections: 9,
  actualAudioMatches: 7,
  audioHits: 5,
  audioMisses: 2,
  audioFalseAlarms: 4,
  audioCorrectRejections: 9,
  ...overrides,
})

export const createMockTrialData = (overrides = {}) => ({
  visualMatches: [true, false, true, false, true],
  audioMatches: [false, true, false, true, false],
  userVisualResponses: [true, false, true, true, false],
  userAudioResponses: [false, true, false, false, true],
  responseTimes: [1100, 1200, 1050, 1300, 1150],
  ...overrides,
})

// Helper to create game interface props
export const createGameInterfaceProps = (overrides = {}) => ({
  onBack: vi.fn(),
  onViewStats: vi.fn(),
  isPracticeMode: false,
  onPracticeComplete: vi.fn(),
  ...overrides,
})

// Helper to simulate user responses
export const simulateUserResponse = (responseType: 'visual' | 'audio') => {
  const key = responseType === 'visual' ? 'a' : 'l'
  return new KeyboardEvent('keydown', { key })
}

// Helper to wait for async operations
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

// Custom render function with providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock setup helpers
export const setupMocks = () => {
  // Reset all mocks
  vi.clearAllMocks()

  // Setup localStorage mock
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  })

  // Setup speechSynthesis mock
  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSpeechSynthesis,
    writable: true,
  })

  // Setup SpeechSynthesisUtterance mock
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: mockSpeechSynthesisUtterance,
    writable: true,
  })

  // Mock Date.now for consistent timestamps
  vi.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01 00:00:00

  // Mock setTimeout and clearTimeout
  vi.spyOn(global, 'setTimeout')
  vi.spyOn(global, 'clearTimeout')
}

export const cleanupMocks = () => {
  vi.restoreAllMocks()
  mockLocalStorage.clear()
}

// Test constants
export const TEST_CONSTANTS = {
  PRACTICE_N_LEVEL: 1,
  PRACTICE_NUM_TRIALS: 7,
  DEFAULT_N_LEVEL: 2,
  DEFAULT_NUM_TRIALS: 20,
  DEFAULT_STIMULUS_DURATION: 3000,
  AUDIO_LETTERS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
}
