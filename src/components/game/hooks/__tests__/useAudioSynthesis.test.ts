import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioSynthesis } from '../useAudioSynthesis'
import { setupMocks, cleanupMocks, mockSpeechSynthesis } from '@/test-utils'

describe('useAudioSynthesis Hook', () => {
  beforeEach(() => {
    setupMocks()
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Initialization', () => {
    it('initializes with audio enabled', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      expect(result.current.playAudioLetter).toBeDefined()
      expect(result.current.cancelAudio).toBeDefined()
      expect(result.current.synthRef).toBeDefined()
    })

    it('initializes with audio disabled', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: false }))

      expect(result.current.playAudioLetter).toBeDefined()
      expect(result.current.cancelAudio).toBeDefined()
      expect(result.current.synthRef).toBeDefined()
    })

    it('sets up speech synthesis when audio is enabled', () => {
      renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      // Should have access to speech synthesis
      expect(window.speechSynthesis).toBeDefined()
    })
  })

  describe('Audio Playback', () => {
    it('plays audio when enabled', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      act(() => {
        result.current.playAudioLetter('A')
      })

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled()
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled() // Called before speak
    })

    it('does not play audio when disabled', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: false }))

      act(() => {
        result.current.playAudioLetter('A')
      })

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled()
    })

    it('cancels previous audio before playing new audio', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      act(() => {
        result.current.playAudioLetter('A')
      })

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled()
    })

    it('plays different letters correctly', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      const letters = ['A', 'B', 'C', 'D', 'E']
      
      letters.forEach(letter => {
        act(() => {
          result.current.playAudioLetter(letter)
        })
      })

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(letters.length)
    })

    it('handles empty string gracefully', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      expect(() => {
        act(() => {
          result.current.playAudioLetter('')
        })
      }).not.toThrow()
    })

    it('handles special characters gracefully', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      const specialChars = ['!', '@', '#', '1', '2']
      
      specialChars.forEach(char => {
        expect(() => {
          act(() => {
            result.current.playAudioLetter(char)
          })
        }).not.toThrow()
      })
    })
  })

  describe('Audio Cancellation', () => {
    it('cancels audio when enabled', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      act(() => {
        result.current.cancelAudio()
      })

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
    })

    it('does not cancel audio when disabled', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: false }))

      act(() => {
        result.current.cancelAudio()
      })

      expect(mockSpeechSynthesis.cancel).not.toHaveBeenCalled()
    })

    it('can be called multiple times safely', () => {
      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      act(() => {
        result.current.cancelAudio()
        result.current.cancelAudio()
        result.current.cancelAudio()
      })

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(3)
    })
  })

  describe('Dynamic Audio Enable/Disable', () => {
    it('handles audio enable state changes', () => {
      const { result, rerender } = renderHook(
        ({ audioEnabled }) => useAudioSynthesis({ audioEnabled }),
        { initialProps: { audioEnabled: false } }
      )

      // Initially disabled
      act(() => {
        result.current.playAudioLetter('A')
      })
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled()

      // Enable audio
      rerender({ audioEnabled: true })

      act(() => {
        result.current.playAudioLetter('B')
      })
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled()
    })

    it('cancels audio when disabled', () => {
      const { result, rerender } = renderHook(
        ({ audioEnabled }) => useAudioSynthesis({ audioEnabled }),
        { initialProps: { audioEnabled: true } }
      )

      // Start playing audio
      act(() => {
        result.current.playAudioLetter('A')
      })

      // Disable audio - should cancel
      rerender({ audioEnabled: false })

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles speech synthesis errors gracefully', () => {
      mockSpeechSynthesis.speak.mockImplementation(() => {
        throw new Error('Speech synthesis error')
      })

      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      expect(() => {
        act(() => {
          result.current.playAudioLetter('A')
        })
      }).not.toThrow()
    })

    it('handles missing speech synthesis API', () => {
      // Remove speech synthesis
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true,
      })

      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      expect(() => {
        act(() => {
          result.current.playAudioLetter('A')
        })
      }).not.toThrow()
    })

    it('handles cancel errors gracefully', () => {
      mockSpeechSynthesis.cancel.mockImplementation(() => {
        throw new Error('Cancel error')
      })

      const { result } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      // The hook should handle the error internally and not throw
      act(() => {
        result.current.cancelAudio()
      })

      // If we get here, the error was handled gracefully
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('cancels audio on unmount when enabled', () => {
      const { unmount } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      unmount()

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
    })

    it('does not cancel audio on unmount when disabled', () => {
      const { unmount } = renderHook(() => useAudioSynthesis({ audioEnabled: false }))

      unmount()

      expect(mockSpeechSynthesis.cancel).not.toHaveBeenCalled()
    })

    it('handles cleanup errors gracefully', () => {
      mockSpeechSynthesis.cancel.mockImplementation(() => {
        throw new Error('Cleanup error')
      })

      const { unmount } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      // The hook should handle cleanup errors internally
      unmount()

      // If we get here, the cleanup error was handled gracefully
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
    })
  })

  describe('Function Stability', () => {
    it('provides stable function references', () => {
      const { result, rerender } = renderHook(() => useAudioSynthesis({ audioEnabled: true }))

      const initialFunctions = {
        playAudioLetter: result.current.playAudioLetter,
        cancelAudio: result.current.cancelAudio,
      }

      rerender()

      expect(result.current.playAudioLetter).toBe(initialFunctions.playAudioLetter)
      expect(result.current.cancelAudio).toBe(initialFunctions.cancelAudio)
    })

    it('updates function behavior when audioEnabled changes', () => {
      const { result, rerender } = renderHook(
        ({ audioEnabled }) => useAudioSynthesis({ audioEnabled }),
        { initialProps: { audioEnabled: false } }
      )

      // Functions should be stable but behavior should change
      const playFunction = result.current.playAudioLetter

      rerender({ audioEnabled: true })

      expect(result.current.playAudioLetter).toBe(playFunction)
      
      // But behavior should be different
      act(() => {
        result.current.playAudioLetter('A')
      })
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled()
    })
  })
})
