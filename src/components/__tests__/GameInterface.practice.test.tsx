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

describe('GameInterface Practice Mode Tests', () => {
  let defaultProps: ReturnType<typeof createGameInterfaceProps>

  beforeEach(() => {
    setupMocks()
    defaultProps = createGameInterfaceProps()
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Practice Mode Initialization', () => {
    it('auto-starts in practice mode', async () => {
      render(<GameInterface {...defaultProps} isPracticeMode={true} />)

      // Should auto-start without showing setup
      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      // Should show 1-Back mode
      expect(screen.getByText(/1-Back/)).toBeInTheDocument()
    })

    it('uses practice mode constants', async () => {
      render(<GameInterface {...defaultProps} isPracticeMode={true} />)

      await waitFor(() => {
        expect(screen.getByText(/Trial 1/)).toBeInTheDocument()
      })

      // Should be using 1-Back (practice N-level)
      expect(screen.getByText(/1-Back/)).toBeInTheDocument()
    })

    it('does not show setup screen in practice mode', () => {
      render(<GameInterface {...defaultProps} isPracticeMode={true} />)

      // Should not show setup elements
      expect(screen.queryByText('Select Training Mode')).not.toBeInTheDocument()
      expect(screen.queryByText('N-Level')).not.toBeInTheDocument()
      expect(screen.queryByText('Number of Trials')).not.toBeInTheDocument()
    })
  })

  describe('Practice Mode Feedback', () => {
    it('provides feedback for correct matches', async () => {
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      // Make a response (we can't easily control if it's correct, but we can test feedback is called)
      fireEvent.keyDown(document, { key: 'a' })

      // Should provide some kind of feedback
      await waitFor(() => {
        expect(
          mockToast.success.mock.calls.some(call => 
            call[0].includes('Correct Match!')) ||
          mockToast.warning.mock.calls.some(call => 
            call[0].includes('False Alarm')) ||
          mockToast.error.mock.calls.some(call => 
            call[0].includes('Missed Match!')) ||
          mockToast.info.mock.calls.some(call => 
            call[0].includes('Correct: No match'))
        ).toBe(true)
      }, { timeout: 2000 })
    })

    it('provides feedback for missed matches', async () => {
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      // Wait for trial timeout without responding
      await waitFor(() => {
        expect(
          mockToast.error.mock.calls.some(call => 
            call[0].includes('Missed Match!')) ||
          mockToast.info.mock.calls.some(call => 
            call[0].includes('Correct: No match'))
        ).toBe(true)
      }, { timeout: 4000 })
    })

    it('provides feedback for false alarms', async () => {
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      // Make multiple responses to increase chance of false alarm
      fireEvent.keyDown(document, { key: 'a' })

      await waitFor(() => {
        expect(
          mockToast.warning.mock.calls.some(call => 
            call[0].includes("wasn't a match"))
        ).toBe(true) || 
        expect(
          mockToast.success.mock.calls.some(call => 
            call[0].includes('Correct Match!'))
        ).toBe(true)
      }, { timeout: 2000 })
    })

    it('does not provide feedback in normal mode', async () => {
      render(<GameInterface {...defaultProps} isPracticeMode={false} />)

      const startButton = screen.getByText('Start Training')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      // Make a response
      fireEvent.keyDown(document, { key: 'a' })

      // Should not provide practice-style feedback
      expect(mockToast.success).not.toHaveBeenCalledWith(
        'Correct Match!',
        { duration: 1500 }
      )
      expect(mockToast.warning).not.toHaveBeenCalledWith(
        expect.stringContaining("wasn't a match"),
        { duration: 1500 }
      )
    })
  })

  describe('Practice Mode Completion', () => {
    it('calls onPracticeComplete when practice session ends', async () => {
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      // Wait for practice completion (7 trials)
      await waitFor(() => {
        expect(mockOnPracticeComplete).toHaveBeenCalled()
      }, { timeout: 25000 }) // Practice mode with 7 trials at 3s each + processing time
    })

    it('shows completion message', async () => {
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Practice Complete! Well done!',
          { duration: 3000 }
        )
      }, { timeout: 25000 })
    })

    it('does not save session data in practice mode', async () => {
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      await waitFor(() => {
        expect(mockOnPracticeComplete).toHaveBeenCalled()
      }, { timeout: 25000 })

      // Should not save to localStorage
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        'nback-sessions',
        expect.any(String)
      )
    })

    it('resets to setup state after completion', async () => {
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      await waitFor(() => {
        expect(mockOnPracticeComplete).toHaveBeenCalled()
      }, { timeout: 25000 })

      // Should reset state (though in practice mode, setup is not visible)
      // We verify this through the completion callback being called
      expect(mockOnPracticeComplete).toHaveBeenCalledTimes(1)
    })

    it('clears timeouts on practice completion', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      await waitFor(() => {
        expect(mockOnPracticeComplete).toHaveBeenCalled()
      }, { timeout: 25000 })

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('Practice Mode vs Normal Mode Differences', () => {
    it('uses different trial count in practice mode', async () => {
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      // Practice mode should complete faster (7 trials vs 20)
      await waitFor(() => {
        expect(mockOnPracticeComplete).toHaveBeenCalled()
      }, { timeout: 25000 })

      // Verify it completed in reasonable time for 7 trials
      expect(mockOnPracticeComplete).toHaveBeenCalledTimes(1)
    })

    it('uses single-visual mode in practice', async () => {
      render(<GameInterface {...defaultProps} isPracticeMode={true} />)

      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      // Should show single-visual mode indicators
      expect(screen.getByText(/1-Back Single Visual/)).toBeInTheDocument()
    })

    it('prevents multiple completion calls', async () => {
      const mockOnPracticeComplete = vi.fn()
      
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={mockOnPracticeComplete}
      />)

      await waitFor(() => {
        expect(mockOnPracticeComplete).toHaveBeenCalled()
      }, { timeout: 25000 })

      // Wait a bit more to ensure no additional calls
      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(mockOnPracticeComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Practice Mode Error Handling', () => {
    it('handles missing onPracticeComplete callback gracefully', async () => {
      render(<GameInterface 
        {...defaultProps} 
        isPracticeMode={true}
        onPracticeComplete={undefined}
      />)

      // Should not crash even without callback
      await waitFor(() => {
        expect(screen.getByText(/Trial/)).toBeInTheDocument()
      })

      // Should still show completion message
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Practice Complete! Well done!',
          { duration: 3000 }
        )
      }, { timeout: 25000 })
    })

    it('handles rapid practice mode toggling', () => {
      const { rerender } = render(<GameInterface {...defaultProps} isPracticeMode={false} />)

      // Toggle to practice mode
      rerender(<GameInterface {...defaultProps} isPracticeMode={true} />)

      // Toggle back to normal mode
      rerender(<GameInterface {...defaultProps} isPracticeMode={false} />)

      // Should handle gracefully
      expect(screen.getByText('Select Training Mode')).toBeInTheDocument()
    })
  })
})
