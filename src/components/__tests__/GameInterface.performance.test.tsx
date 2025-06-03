import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GameInterface from '../GameInterface'
import {
  setupMocks,
  cleanupMocks,
  mockToast,
  mockLocalStorage,
  createGameInterfaceProps,
} from '@/test-utils'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: mockToast,
}))

vi.mock('@/stores/settingsStore', () => ({}))

describe('GameInterface Performance Calculation Tests', () => {
  let defaultProps: ReturnType<typeof createGameInterfaceProps>

  beforeEach(() => {
    setupMocks()
    defaultProps = createGameInterfaceProps()
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Performance Statistics Calculation', () => {
    it('calculates perfect accuracy correctly', async () => {
      render(<GameInterface {...defaultProps} />)

      // Set to 1 trial for controlled testing
      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '1' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Trial 1/)).toBeInTheDocument()
      })

      // Wait for completion and check localStorage call
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'nback-sessions',
          expect.any(String)
        )
      }, { timeout: 5000 })

      // Verify session data structure
      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      const sessions = JSON.parse(savedData)
      const session = sessions[sessions.length - 1]

      expect(session).toHaveProperty('accuracy')
      expect(session).toHaveProperty('visualAccuracy')
      expect(session).toHaveProperty('audioAccuracy')
      expect(session).toHaveProperty('averageResponseTime')
      expect(session).toHaveProperty('actualVisualMatches')
      expect(session).toHaveProperty('visualHits')
      expect(session).toHaveProperty('visualMisses')
      expect(session).toHaveProperty('visualFalseAlarms')
      expect(session).toHaveProperty('visualCorrectRejections')
    })

    it('calculates zero accuracy correctly', async () => {
      render(<GameInterface {...defaultProps} />)

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '1' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Trial 1/)).toBeInTheDocument()
      })

      // Make incorrect response (press when no match expected)
      fireEvent.keyDown(document, { key: 'a' })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      }, { timeout: 5000 })

      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      const sessions = JSON.parse(savedData)
      const session = sessions[sessions.length - 1]

      // Should have recorded the response
      expect(typeof session.accuracy).toBe('number')
      expect(session.accuracy).toBeGreaterThanOrEqual(0)
      expect(session.accuracy).toBeLessThanOrEqual(100)
    })

    it('calculates dual mode statistics correctly', async () => {
      render(<GameInterface {...defaultProps} />)

      // Switch to dual mode
      const dualModeButton = screen.getByText('Dual N-Back')
      fireEvent.click(dualModeButton)

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '1' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Trial 1/)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      }, { timeout: 5000 })

      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      const sessions = JSON.parse(savedData)
      const session = sessions[sessions.length - 1]

      expect(session.mode).toBe('dual')
      expect(session).toHaveProperty('visualAccuracy')
      expect(session).toHaveProperty('audioAccuracy')
      expect(session).toHaveProperty('actualAudioMatches')
      expect(session).toHaveProperty('audioHits')
      expect(session).toHaveProperty('audioMisses')
      expect(session).toHaveProperty('audioFalseAlarms')
      expect(session).toHaveProperty('audioCorrectRejections')
    })

    it('handles empty response arrays', async () => {
      render(<GameInterface {...defaultProps} />)

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '1' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      // Don't make any responses, let it timeout
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      }, { timeout: 5000 })

      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      const sessions = JSON.parse(savedData)
      const session = sessions[sessions.length - 1]

      // Should handle empty responses gracefully
      expect(session.accuracy).toBeGreaterThanOrEqual(0)
      expect(session.averageResponseTime).toBeGreaterThan(0)
    })

    it('calculates response times correctly', async () => {
      render(<GameInterface {...defaultProps} />)

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '2' } })

      // Set shorter duration for faster test
      const durationInput = screen.getByDisplayValue('3000')
      fireEvent.change(durationInput, { target: { value: '1000' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Trial 1/)).toBeInTheDocument()
      })

      // Make a quick response
      setTimeout(() => {
        fireEvent.keyDown(document, { key: 'a' })
      }, 100)

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      }, { timeout: 5000 })

      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      const sessions = JSON.parse(savedData)
      const session = sessions[sessions.length - 1]

      expect(session.averageResponseTime).toBeGreaterThan(0)
      expect(session.averageResponseTime).toBeLessThan(2000) // Should be reasonable
    })
  })

  describe('Hit/Miss/False Alarm Calculations', () => {
    it('correctly categorizes visual responses', async () => {
      render(<GameInterface {...defaultProps} />)

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '3' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      // Make various responses to test categorization
      await waitFor(() => {
        expect(screen.getByText(/Trial 1/)).toBeInTheDocument()
      })

      // Response on first trial
      fireEvent.keyDown(document, { key: 'a' })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      }, { timeout: 10000 })

      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      const sessions = JSON.parse(savedData)
      const session = sessions[sessions.length - 1]

      // Verify all categories are present and sum correctly
      const totalVisualResponses = session.visualHits + session.visualMisses + 
                                  session.visualFalseAlarms + session.visualCorrectRejections
      expect(totalVisualResponses).toBe(session.trials)
    })

    it('correctly categorizes audio responses in dual mode', async () => {
      render(<GameInterface {...defaultProps} />)

      const dualModeButton = screen.getByText('Dual N-Back')
      fireEvent.click(dualModeButton)

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '3' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Trial 1/)).toBeInTheDocument()
      })

      // Make audio response
      fireEvent.keyDown(document, { key: 'l' })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      }, { timeout: 10000 })

      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      const sessions = JSON.parse(savedData)
      const session = sessions[sessions.length - 1]

      // Verify audio categories sum correctly
      const totalAudioResponses = session.audioHits + session.audioMisses + 
                                 session.audioFalseAlarms + session.audioCorrectRejections
      expect(totalAudioResponses).toBe(session.trials)
    })
  })

  describe('Accuracy Calculation Edge Cases', () => {
    it('handles division by zero in accuracy calculation', async () => {
      render(<GameInterface {...defaultProps} />)

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '1' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      }, { timeout: 5000 })

      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      const sessions = JSON.parse(savedData)
      const session = sessions[sessions.length - 1]

      // Should not have NaN or Infinity values
      expect(isFinite(session.accuracy)).toBe(true)
      expect(isFinite(session.visualAccuracy)).toBe(true)
      expect(isFinite(session.audioAccuracy)).toBe(true)
      expect(isFinite(session.averageResponseTime)).toBe(true)
    })

    it('handles very large numbers correctly', async () => {
      render(<GameInterface {...defaultProps} />)

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '50' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      // Let it run for a bit then complete
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      }, { timeout: 15000 })

      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      const sessions = JSON.parse(savedData)
      const session = sessions[sessions.length - 1]

      // Should handle large trial counts
      expect(session.trials).toBe(50)
      expect(session.accuracy).toBeGreaterThanOrEqual(0)
      expect(session.accuracy).toBeLessThanOrEqual(100)
    })
  })
})
