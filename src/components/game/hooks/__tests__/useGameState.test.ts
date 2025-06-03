import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameState } from '../useGameState'
import { setupMocks, cleanupMocks } from '@/test-utils'

describe('useGameState Hook', () => {
  beforeEach(() => {
    setupMocks()
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Initialization', () => {
    it('initializes with default values for normal mode', () => {
      const { result } = renderHook(() => useGameState())

      expect(result.current.gameMode).toBe('single-visual')
      expect(result.current.gameState).toBe('setup')
      expect(result.current.nLevel).toBe(2)
      expect(result.current.numTrials).toBe(20)
      expect(result.current.stimulusDurationMs).toBe(3000)
      expect(result.current.audioEnabled).toBe(true)
      expect(result.current.currentTrial).toBe(0)
    })

    it('initializes with practice mode values when isPracticeMode is true', () => {
      const { result } = renderHook(() => useGameState({ isPracticeMode: true }))

      expect(result.current.gameMode).toBe('single-visual') // PRACTICE_MODE
      expect(result.current.gameState).toBe('setup')
      expect(result.current.nLevel).toBe(1) // PRACTICE_N_LEVEL
      expect(result.current.numTrials).toBe(7) // PRACTICE_NUM_TRIALS
      expect(result.current.stimulusDurationMs).toBe(3000)
      expect(result.current.audioEnabled).toBe(true)
      expect(result.current.currentTrial).toBe(0)
    })
  })

  describe('State Updates', () => {
    it('updates game mode correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setGameMode('dual')
      })

      expect(result.current.gameMode).toBe('dual')
    })

    it('updates game state correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setGameState('playing')
      })

      expect(result.current.gameState).toBe('playing')
    })

    it('updates nLevel correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setNLevel(5)
      })

      expect(result.current.nLevel).toBe(5)
    })

    it('updates numTrials correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setNumTrials(50)
      })

      expect(result.current.numTrials).toBe(50)
    })

    it('updates stimulusDurationMs correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setStimulusDurationMs(2000)
      })

      expect(result.current.stimulusDurationMs).toBe(2000)
    })

    it('updates audioEnabled correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setAudioEnabled(false)
      })

      expect(result.current.audioEnabled).toBe(false)
    })

    it('updates currentTrial correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setCurrentTrial(5)
      })

      expect(result.current.currentTrial).toBe(5)
    })

    it('updates currentTrial with function correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setCurrentTrial(prev => prev + 1)
      })

      expect(result.current.currentTrial).toBe(1)
    })
  })

  describe('Reset Functionality', () => {
    it('resets game state correctly', () => {
      const { result } = renderHook(() => useGameState())

      // Change some values
      act(() => {
        result.current.setGameState('playing')
        result.current.setCurrentTrial(5)
      })

      // Reset
      act(() => {
        result.current.resetGameState()
      })

      expect(result.current.gameState).toBe('setup')
      expect(result.current.currentTrial).toBe(0)
    })

    it('preserves other settings when resetting', () => {
      const { result } = renderHook(() => useGameState())

      // Change some values
      act(() => {
        result.current.setGameMode('dual')
        result.current.setNLevel(5)
        result.current.setNumTrials(50)
        result.current.setGameState('playing')
        result.current.setCurrentTrial(5)
      })

      // Reset
      act(() => {
        result.current.resetGameState()
      })

      // Should preserve user settings
      expect(result.current.gameMode).toBe('dual')
      expect(result.current.nLevel).toBe(5)
      expect(result.current.numTrials).toBe(50)
      
      // Should reset game state
      expect(result.current.gameState).toBe('setup')
      expect(result.current.currentTrial).toBe(0)
    })
  })

  describe('State Consistency', () => {
    it('maintains state consistency across multiple updates', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setGameMode('dual')
        result.current.setNLevel(3)
        result.current.setNumTrials(30)
        result.current.setGameState('playing')
        result.current.setCurrentTrial(10)
        result.current.setAudioEnabled(false)
        result.current.setStimulusDurationMs(2500)
      })

      expect(result.current.gameMode).toBe('dual')
      expect(result.current.nLevel).toBe(3)
      expect(result.current.numTrials).toBe(30)
      expect(result.current.gameState).toBe('playing')
      expect(result.current.currentTrial).toBe(10)
      expect(result.current.audioEnabled).toBe(false)
      expect(result.current.stimulusDurationMs).toBe(2500)
    })

    it('handles rapid state changes correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        // Rapid changes
        for (let i = 0; i < 10; i++) {
          result.current.setCurrentTrial(i)
          result.current.setNLevel(i % 5 + 1)
        }
      })

      expect(result.current.currentTrial).toBe(9)
      expect(result.current.nLevel).toBe(5) // (9 % 5) + 1
    })
  })

  describe('Edge Cases', () => {
    it('handles boundary values correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setNLevel(0)
        result.current.setNumTrials(0)
        result.current.setCurrentTrial(-1)
        result.current.setStimulusDurationMs(0)
      })

      // Should accept any values (validation should be done at component level)
      expect(result.current.nLevel).toBe(0)
      expect(result.current.numTrials).toBe(0)
      expect(result.current.currentTrial).toBe(-1)
      expect(result.current.stimulusDurationMs).toBe(0)
    })

    it('handles very large values correctly', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.setNLevel(1000)
        result.current.setNumTrials(10000)
        result.current.setCurrentTrial(5000)
        result.current.setStimulusDurationMs(100000)
      })

      expect(result.current.nLevel).toBe(1000)
      expect(result.current.numTrials).toBe(10000)
      expect(result.current.currentTrial).toBe(5000)
      expect(result.current.stimulusDurationMs).toBe(100000)
    })
  })

  describe('Hook Stability', () => {
    it('provides stable function references', () => {
      const { result, rerender } = renderHook(() => useGameState())

      const initialSetters = {
        setGameMode: result.current.setGameMode,
        setGameState: result.current.setGameState,
        setNLevel: result.current.setNLevel,
        setNumTrials: result.current.setNumTrials,
        setStimulusDurationMs: result.current.setStimulusDurationMs,
        setAudioEnabled: result.current.setAudioEnabled,
        setCurrentTrial: result.current.setCurrentTrial,
        resetGameState: result.current.resetGameState,
      }

      rerender()

      // Function references should be stable
      expect(result.current.setGameMode).toBe(initialSetters.setGameMode)
      expect(result.current.setGameState).toBe(initialSetters.setGameState)
      expect(result.current.setNLevel).toBe(initialSetters.setNLevel)
      expect(result.current.setNumTrials).toBe(initialSetters.setNumTrials)
      expect(result.current.setStimulusDurationMs).toBe(initialSetters.setStimulusDurationMs)
      expect(result.current.setAudioEnabled).toBe(initialSetters.setAudioEnabled)
      expect(result.current.setCurrentTrial).toBe(initialSetters.setCurrentTrial)
      expect(result.current.resetGameState).toBe(initialSetters.resetGameState)
    })
  })
})
