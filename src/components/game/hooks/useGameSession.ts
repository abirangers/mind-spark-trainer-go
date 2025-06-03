import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { GameMode, GameSession } from '../types'
import {
  calculatePerformanceStats,
  calculateAccuracies,
  saveGameSession
} from '../utils'

interface UseGameSessionProps {
  isPracticeMode: boolean
  onPracticeComplete?: () => void
}

export const useGameSession = ({
  isPracticeMode,
  onPracticeComplete
}: UseGameSessionProps) => {
  const sessionEndedRef = useRef(false)
  const isPracticeModeRef = useRef(isPracticeMode)

  const endSession = useCallback((
    gameMode: GameMode,
    nLevel: number,
    numTrials: number,
    visualMatches: boolean[],
    audioMatches: boolean[],
    userVisualResponses: boolean[],
    userAudioResponses: boolean[],
    responseTimes: number[],
    setNLevel: (level: number) => void,
    setGameState: (state: string) => void,
    setIsWaitingForResponse: (waiting: boolean) => void,
    setCurrentPosition: (position: number | null) => void,
    setCurrentLetter: (letter: string) => void,
    clearTimeouts: () => void
  ) => {
    // Prevent multiple calls to endSession
    if (sessionEndedRef.current) {
      return
    }

    // Handle practice mode completion separately
    if (isPracticeModeRef.current) {
      sessionEndedRef.current = true

      // Clear any ongoing timeouts
      clearTimeouts()

      // Reset game state
      setIsWaitingForResponse(false)
      setCurrentPosition(null)
      setCurrentLetter('')
      setGameState('setup')

      toast.success('Practice Complete! Well done!', { duration: 3000 })

      // Use setTimeout to ensure state changes are processed
      setTimeout(() => {
        if (onPracticeComplete) {
          onPracticeComplete()
        }
      }, 100)

      return
    }

    // Set flag for normal mode
    sessionEndedRef.current = true

    // Normal mode session completion logic
    setGameState('results')

    // Calculate performance statistics
    const stats = calculatePerformanceStats(
      gameMode,
      numTrials,
      visualMatches,
      audioMatches,
      userVisualResponses,
      userAudioResponses
    )

    const { visualAccuracy, audioAccuracy, overallAccuracy } = calculateAccuracies(
      gameMode,
      numTrials,
      stats
    )

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    const session: GameSession = {
      trials: numTrials,
      nLevel,
      accuracy: overallAccuracy,
      visualAccuracy,
      audioAccuracy,
      averageResponseTime: avgResponseTime,
      mode: gameMode,
      timestamp: new Date().toISOString(),
      actualVisualMatches: stats.actualVisualMatches,
      visualHits: stats.visualHits,
      visualMisses: stats.visualMisses,
      visualFalseAlarms: stats.visualFalseAlarms,
      visualCorrectRejections: stats.visualCorrectRejections,
      actualAudioMatches: stats.actualAudioMatches,
      audioHits: stats.audioHits,
      audioMisses: stats.audioMisses,
      audioFalseAlarms: stats.audioFalseAlarms,
      audioCorrectRejections: stats.audioCorrectRejections,
    }

    saveGameSession(session)
    toast.success(`Session Complete! ${overallAccuracy.toFixed(1)}% accuracy`)
  }, [
    onPracticeComplete,
  ])

  const resetSessionFlags = useCallback(() => {
    sessionEndedRef.current = false
    isPracticeModeRef.current = isPracticeMode
  }, [isPracticeMode])

  return {
    endSession,
    resetSessionFlags,
    sessionEndedRef,
  }
}
