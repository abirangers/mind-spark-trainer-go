import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import GameInterface from '../GameInterface'
import {
  setupMocks,
  cleanupMocks,
  mockToast,
  mockLocalStorage,
  mockSpeechSynthesis,
  createGameInterfaceProps,
  createMockGameSession,
} from '@/test-utils'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: mockToast,
}))

vi.mock('@/stores/settingsStore', () => ({}))

describe('GameInterface Edge Cases and Error Handling', () => {
  let defaultProps: ReturnType<typeof createGameInterfaceProps>

  beforeEach(() => {
    setupMocks()
    defaultProps = createGameInterfaceProps()
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('localStorage Error Handling', () => {
    it('handles localStorage.getItem errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      expect(() => render(<GameInterface {...defaultProps} />)).not.toThrow()
    })

    it('handles localStorage.setItem errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      render(<GameInterface {...defaultProps} />)

      // Set to 1 trial for quick completion
      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '1' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      // Should not crash even if localStorage fails
      await waitFor(() => {
        expect(screen.getByText('Session Complete!')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('handles corrupted localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json data')

      expect(() => render(<GameInterface {...defaultProps} />)).not.toThrow()
    })

    it('handles missing localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      expect(() => render(<GameInterface {...defaultProps} />)).not.toThrow()
    })
  })

  describe('Speech Synthesis Error Handling', () => {
    it('handles speech synthesis errors gracefully', async () => {
      mockSpeechSynthesis.speak.mockImplementation(() => {
        throw new Error('Speech synthesis not available')
      })

      render(<GameInterface {...defaultProps} />)

      // Switch to audio mode
      const audioModeButton = screen.getByText('Single N-Back (Audio)')
      fireEvent.click(audioModeButton)

      const startButton = screen.getByText('Start Training')
      
      // Should not crash even if speech synthesis fails
      expect(() => fireEvent.click(startButton)).not.toThrow()
    })

    it('handles missing speech synthesis API', async () => {
      // Remove speech synthesis from window
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true,
      })

      render(<GameInterface {...defaultProps} />)

      const audioModeButton = screen.getByText('Single N-Back (Audio)')
      fireEvent.click(audioModeButton)

      const startButton = screen.getByText('Start Training')
      expect(() => fireEvent.click(startButton)).not.toThrow()
    })
  })

  describe('Rapid User Interactions', () => {
    it('handles rapid key presses during trials', async () => {
      render(<GameInterface {...defaultProps} />)

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      // Rapid key presses
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(document, { key: 'a' })
        fireEvent.keyDown(document, { key: 'l' })
      }

      // Should handle gracefully without errors
      expect(screen.getByText(/Trial/)).toBeInTheDocument()
    })

    it('handles rapid game state changes', async () => {
      render(<GameInterface {...defaultProps} />)

      const startButton = screen.getByText('Start Training')
      
      // Rapid start/pause cycles
      fireEvent.click(startButton)
      
      await waitFor(() => {
        expect(screen.getByText('Pause')).toBeInTheDocument()
      })

      const pauseButton = screen.getByText('Pause')
      fireEvent.click(pauseButton)
      
      await waitFor(() => {
        expect(screen.getByText('Start Training')).toBeInTheDocument()
      })

      // Should handle gracefully
      expect(screen.getByText('Select Training Mode')).toBeInTheDocument()
    })

    it('handles rapid mode switching', () => {
      render(<GameInterface {...defaultProps} />)

      const visualMode = screen.getByText('Single N-Back (Visual)')
      const audioMode = screen.getByText('Single N-Back (Audio)')
      const dualMode = screen.getByText('Dual N-Back')

      // Rapid mode switching
      for (let i = 0; i < 5; i++) {
        fireEvent.click(visualMode)
        fireEvent.click(audioMode)
        fireEvent.click(dualMode)
      }

      // Should handle gracefully
      expect(screen.getByText('Select Training Mode')).toBeInTheDocument()
    })
  })

  describe('Memory and Performance', () => {
    it('cleans up timeouts on unmount', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      
      const { unmount } = render(<GameInterface {...defaultProps} />)

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('handles large trial counts efficiently', () => {
      render(<GameInterface {...defaultProps} />)

      // Set very high trial count
      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '1000' } })

      const startButton = screen.getByText('Start Training')
      
      // Should not crash with large numbers
      expect(() => fireEvent.click(startButton)).not.toThrow()
    })

    it('handles high N-level values', () => {
      render(<GameInterface {...defaultProps} />)

      // Set very high N-level
      const nLevelInput = screen.getByDisplayValue('2')
      fireEvent.change(nLevelInput, { target: { value: '10' } })

      const startButton = screen.getByText('Start Training')
      
      // Should not crash with high N-levels
      expect(() => fireEvent.click(startButton)).not.toThrow()
    })
  })

  describe('Boundary Value Testing', () => {
    it('handles minimum valid values', () => {
      render(<GameInterface {...defaultProps} />)

      // Set minimum values
      const nLevelInput = screen.getByDisplayValue('2')
      fireEvent.change(nLevelInput, { target: { value: '1' } })

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '1' } })

      const durationInput = screen.getByDisplayValue('3000')
      fireEvent.change(durationInput, { target: { value: '500' } })

      const startButton = screen.getByText('Start Training')
      expect(() => fireEvent.click(startButton)).not.toThrow()
    })

    it('handles maximum valid values', () => {
      render(<GameInterface {...defaultProps} />)

      // Set maximum values
      const nLevelInput = screen.getByDisplayValue('2')
      fireEvent.change(nLevelInput, { target: { value: '8' } })

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '100' } })

      const durationInput = screen.getByDisplayValue('3000')
      fireEvent.change(durationInput, { target: { value: '5000' } })

      const startButton = screen.getByText('Start Training')
      expect(() => fireEvent.click(startButton)).not.toThrow()
    })

    it('handles zero and negative values gracefully', () => {
      render(<GameInterface {...defaultProps} />)

      // Try invalid values
      const nLevelInput = screen.getByDisplayValue('2')
      fireEvent.change(nLevelInput, { target: { value: '0' } })

      const trialsInput = screen.getByDisplayValue('20')
      fireEvent.change(trialsInput, { target: { value: '-5' } })

      // Should not crash
      expect(screen.getByText('Select Training Mode')).toBeInTheDocument()
    })
  })

  describe('Concurrent Operations', () => {
    it('handles multiple simultaneous key events', async () => {
      render(<GameInterface {...defaultProps} />)

      // Switch to dual mode for both key types
      const dualModeButton = screen.getByText('Dual N-Back')
      fireEvent.click(dualModeButton)

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      // Simultaneous key events
      const eventA = new KeyboardEvent('keydown', { key: 'a' })
      const eventL = new KeyboardEvent('keydown', { key: 'l' })
      
      document.dispatchEvent(eventA)
      document.dispatchEvent(eventL)

      // Should handle gracefully
      expect(screen.getByText(/Trial/)).toBeInTheDocument()
    })

    it('handles overlapping timeout operations', async () => {
      render(<GameInterface {...defaultProps} />)

      // Set very short duration for rapid timeouts
      const durationInput = screen.getByDisplayValue('3000')
      fireEvent.change(durationInput, { target: { value: '100' } })

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      // Should handle rapid timeout cycles
      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })
    })
  })
})
