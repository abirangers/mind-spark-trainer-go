import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  GameInterfaceProps,
  GameMode,
  GameState,
  GameSession,
  PRACTICE_MODE,
  PRACTICE_N_LEVEL,
  PRACTICE_NUM_TRIALS,
  AUDIO_LETTERS,
  useAudioSynthesis,
  GameSetup,
  GamePlay,
  GameResults,
} from './game'

// Internal interfaces for better type safety
interface PerformanceStats {
  visualAccuracy: number
  audioAccuracy: number
  overallAccuracy: number
  avgResponseTime: number
  actualVisualMatches: number
  visualHits: number
  visualMisses: number
  visualFalseAlarms: number
  visualCorrectRejections: number
  actualAudioMatches: number
  audioHits: number
  audioMisses: number
  audioFalseAlarms: number
  audioCorrectRejections: number
}

interface StimulusData {
  newPosition: number
  newLetter: string
  visualMatch: boolean
  audioMatch: boolean
}


/**
 * GameInterface Component - Manages the N-back game flow and state
 *
 * This component has been refactored to improve maintainability by:
 * - Extracting complex logic into focused helper functions
 * - Adding proper TypeScript interfaces for type safety
 * - Separating concerns (session management, trial logic, performance calculation)
 * - Improving code readability and reducing cognitive complexity
 */
const GameInterface = ({
  onBack,
  onViewStats,
  isPracticeMode = false,
  onPracticeComplete,
}: GameInterfaceProps) => {
  const [gameMode, setGameMode] = useState<GameMode>(
    isPracticeMode ? PRACTICE_MODE : 'single-visual'
  )
  const [gameState, setGameState] = useState<GameState>('setup')
  const [nLevel, setNLevel] = useState<number>(isPracticeMode ? PRACTICE_N_LEVEL : 2)
  const [currentTrial, setCurrentTrial] = useState(0)
  const [numTrials, setNumTrials] = useState<number>(isPracticeMode ? PRACTICE_NUM_TRIALS : 20)
  const [stimulusDurationMs, setStimulusDurationMs] = useState(3000)
  const [audioEnabled, setAudioEnabled] = useState(true)

  // Game state
  const [visualSequence, setVisualSequence] = useState<number[]>([])
  const [audioSequence, setAudioSequence] = useState<string[]>([])
  const [currentPosition, setCurrentPosition] = useState<number | null>(null)
  const [currentLetter, setCurrentLetter] = useState<string>('')
  const [visualMatches, setVisualMatches] = useState<boolean[]>([])
  const [audioMatches, setAudioMatches] = useState<boolean[]>([])
  const [userVisualResponses, setUserVisualResponses] = useState<boolean[]>([])
  const [userAudioResponses, setUserAudioResponses] = useState<boolean[]>([])
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [trialStartTime, setTrialStartTime] = useState<number>(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [visualResponseMadeThisTrial, setVisualResponseMadeThisTrial] = useState(false)
  const [audioResponseMadeThisTrial, setAudioResponseMadeThisTrial] = useState(false)

  // Store current trial's match status for reliable access in timeout
  const currentTrialVisualMatchRef = useRef(false)
  const currentTrialAudioMatchRef = useRef(false)

  const trialTimeoutRef = useRef<NodeJS.Timeout>()
  const startTrialRef = useRef<() => void>()
  const postDualResponseDelayRef = useRef<NodeJS.Timeout>()
  const sessionEndedRef = useRef(false) // Flag to prevent multiple endSession calls
  const isPracticeModeRef = useRef(isPracticeMode) // Store initial practice mode state



  // Use audio synthesis hook
  const { playAudioLetter, cancelAudio } = useAudioSynthesis({ audioEnabled })

  const generateStimulus = useCallback((): StimulusData => {
    const newPosition = Math.floor(Math.random() * 9)
    const newLetter = AUDIO_LETTERS[Math.floor(Math.random() * AUDIO_LETTERS.length)]

    // Calculate matches BEFORE updating sequences
    const visualMatch =
      visualSequence.length >= nLevel &&
      visualSequence[visualSequence.length - nLevel] === newPosition
    const audioMatch =
      audioSequence.length >= nLevel && audioSequence[audioSequence.length - nLevel] === newLetter

    // Update sequences AFTER calculating matches
    setVisualSequence(prev => [...prev, newPosition])
    setAudioSequence(prev => [...prev, newLetter])
    setVisualMatches(prev => [...prev, visualMatch])
    setAudioMatches(prev => [...prev, audioMatch])

    return { newPosition, newLetter, visualMatch, audioMatch }
  }, [visualSequence, audioSequence, nLevel])



  /**
   * Calculates comprehensive performance statistics for the current session
   * @returns PerformanceStats object with accuracy metrics and detailed counts
   */
  const calculatePerformanceStats = useCallback((): PerformanceStats => {
    let visualCorrect = 0
    let audioCorrect = 0
    let actualVisualMatches = 0
    let visualHits = 0
    let visualMisses = 0
    let visualFalseAlarms = 0
    let visualCorrectRejections = 0
    let actualAudioMatches = 0
    let audioHits = 0
    let audioMisses = 0
    let audioFalseAlarms = 0
    let audioCorrectRejections = 0

    for (let i = 0; i < numTrials; i++) {
      const visualExpected = visualMatches[i] || false
      const audioExpected = audioMatches[i] || false
      const visualResponse = userVisualResponses[i] || false
      const audioResponse = userAudioResponses[i] || false

      if (gameMode === 'single-visual' || gameMode === 'dual') {
        if (visualExpected) {
          actualVisualMatches++
        }
        if (visualExpected && visualResponse) {
          visualHits++
        } else if (visualExpected && !visualResponse) {
          visualMisses++
        } else if (!visualExpected && visualResponse) {
          visualFalseAlarms++
        } else if (!visualExpected && !visualResponse) {
          visualCorrectRejections++
        }
      }

      if (gameMode === 'single-audio' || gameMode === 'dual') {
        if (audioExpected) {
          actualAudioMatches++
        }
        if (audioExpected && audioResponse) {
          audioHits++
        } else if (audioExpected && !audioResponse) {
          audioMisses++
        } else if (!audioExpected && audioResponse) {
          audioFalseAlarms++
        } else if (!audioExpected && !audioResponse) {
          audioCorrectRejections++
        }
      }

      if (visualExpected === visualResponse) {
        visualCorrect++
      }
      if (audioExpected === audioResponse) {
        audioCorrect++
      }
    }

    const visualAccuracy = numTrials > 0 ? (visualCorrect / numTrials) * 100 : 0
    const audioAccuracy = numTrials > 0 ? (audioCorrect / numTrials) * 100 : 0
    const overallAccuracy =
      gameMode === 'dual'
        ? (visualAccuracy + audioAccuracy) / 2
        : gameMode === 'single-visual'
          ? visualAccuracy
          : audioAccuracy

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    return {
      visualAccuracy,
      audioAccuracy,
      overallAccuracy,
      avgResponseTime,
      actualVisualMatches,
      visualHits,
      visualMisses,
      visualFalseAlarms,
      visualCorrectRejections,
      actualAudioMatches,
      audioHits,
      audioMisses,
      audioFalseAlarms,
      audioCorrectRejections,
    }
  }, [
    numTrials,
    visualMatches,
    audioMatches,
    userVisualResponses,
    userAudioResponses,
    responseTimes,
    gameMode,
  ])

  /**
   * Handles the completion of practice mode sessions
   * Cleans up state and triggers the completion callback
   */
  const handlePracticeCompletion = useCallback(() => {
    sessionEndedRef.current = true

    // Clear any ongoing timeouts
    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current)
    }
    if (postDualResponseDelayRef.current) {
      clearTimeout(postDualResponseDelayRef.current)
    }

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
  }, [onPracticeComplete])

  // Helper function to save game session
  const saveGameSession = useCallback((stats: PerformanceStats): number => {
    const session: GameSession = {
      trials: numTrials,
      nLevel,
      accuracy: stats.overallAccuracy,
      visualAccuracy: stats.visualAccuracy,
      audioAccuracy: stats.audioAccuracy,
      averageResponseTime: stats.avgResponseTime,
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

    const sessions = JSON.parse(localStorage.getItem('nback-sessions') || '[]')
    sessions.push(session)
    localStorage.setItem('nback-sessions', JSON.stringify(sessions))

    return stats.overallAccuracy
  }, [numTrials, nLevel, gameMode])

  const endSession = useCallback(() => {
    // Prevent multiple calls to endSession
    if (sessionEndedRef.current) {
      return
    }

    // Handle practice mode completion separately
    if (isPracticeModeRef.current) {
      handlePracticeCompletion()
      return
    }

    // Set flag for normal mode
    sessionEndedRef.current = true
    setGameState('results')

    // Calculate and save session
    const stats = calculatePerformanceStats()
    const accuracy = saveGameSession(stats)
    toast.success(`Session Complete! ${accuracy.toFixed(1)}% accuracy`)
  }, [handlePracticeCompletion, calculatePerformanceStats, saveGameSession])

  const handleTrialTimeout = useCallback(() => {
    if (isPracticeMode) {
      // Use the reliable current trial match status instead of array lookup
      const visualExpected = currentTrialVisualMatchRef.current



      // Since practice mode is 'single-visual'
      if (visualExpected) {
        toast.error('Missed Match!', { duration: 1500 })
      } else {
        toast.info('Correct: No match there.', { duration: 1500 })
      }
    }

    setIsWaitingForResponse(false)
    setCurrentPosition(null)
    setCurrentLetter('')

    setResponseTimes(prev => [...prev, stimulusDurationMs])

    setCurrentTrial(prev => {
      const next = prev + 1
      if (next < numTrials) {
        setTimeout(() => startTrialRef.current?.(), 1000)
      }
      // No direct call to endSession() here
      return next
    })
  }, [numTrials, stimulusDurationMs, isPracticeMode])

  const startTrial = useCallback(() => {
    const { newPosition, newLetter, visualMatch, audioMatch } = generateStimulus()

    setCurrentPosition(newPosition)
    setCurrentLetter(newLetter)
    setVisualResponseMadeThisTrial(false)
    setAudioResponseMadeThisTrial(false)
    setIsWaitingForResponse(true)
    setTrialStartTime(Date.now())

    // Store match status for this trial
    currentTrialVisualMatchRef.current = visualMatch
    currentTrialAudioMatchRef.current = audioMatch



    if ((gameMode === 'single-audio' || gameMode === 'dual') && audioEnabled) {
      playAudioLetter(newLetter)
    }

    trialTimeoutRef.current = setTimeout(() => {
      handleTrialTimeout()
    }, stimulusDurationMs)
  }, [
    generateStimulus,
    gameMode,
    audioEnabled,
    playAudioLetter,
    handleTrialTimeout,
    stimulusDurationMs,
  ])

  useEffect(() => {
    startTrialRef.current = startTrial
  }, [startTrial])

  // Helper function to advance to next trial
  const advanceToNextTrial = useCallback(() => {
    setCurrentPosition(null)
    setCurrentLetter('')
    setCurrentTrial(prev => {
      const next = prev + 1
      if (next < numTrials) {
        setTimeout(() => startTrialRef.current?.(), 1000)
      }
      return next
    })
  }, [numTrials])

  // Helper function to provide practice feedback
  const providePracticeFeedback = useCallback((responseType: 'visual' | 'audio', isFirstResponse: boolean) => {
    if (!isPracticeMode || !isFirstResponse) {
      return
    }

    if (responseType === 'visual') {
      const visualExpected = currentTrialVisualMatchRef.current
      if (visualExpected) {
        toast.success('Correct Match!', { duration: 1500 })
      } else {
        toast.warning("Oops! That wasn't a match.", { duration: 1500 })
      }
    }
  }, [isPracticeMode])

  const handleResponse = useCallback(
    (responseType: 'visual' | 'audio') => {
      if (!isWaitingForResponse) {
        return
      }

      const responseTime = Date.now() - trialStartTime
      setResponseTimes(prev => [...prev, responseTime])

      const trialIndexToUpdate = currentTrial
      let currentVisualResponseMade = visualResponseMadeThisTrial
      let currentAudioResponseMade = audioResponseMadeThisTrial
      let isFirstResponse = false

      if (responseType === 'visual') {
        isFirstResponse = !userVisualResponses[trialIndexToUpdate]
        setUserVisualResponses(prevResponses => {
          const newResponses = [...prevResponses]
          if (trialIndexToUpdate < newResponses.length) {
            newResponses[trialIndexToUpdate] = true
          }
          return newResponses
        })
        setVisualResponseMadeThisTrial(true)
        currentVisualResponseMade = true
      } else {
        isFirstResponse = !userAudioResponses[trialIndexToUpdate]
        setUserAudioResponses(prevResponses => {
          const newResponses = [...prevResponses]
          if (trialIndexToUpdate < newResponses.length) {
            newResponses[trialIndexToUpdate] = true
          }
          return newResponses
        })
        setAudioResponseMadeThisTrial(true)
        currentAudioResponseMade = true
      }

      // Provide feedback for practice mode
      providePracticeFeedback(responseType, isFirstResponse)

      // Handle trial advancement based on game mode
      const shouldAdvanceImmediately = gameMode !== 'dual' ||
        (currentVisualResponseMade && currentAudioResponseMade)

      if (shouldAdvanceImmediately) {
        setIsWaitingForResponse(false)
        if (trialTimeoutRef.current) {
          clearTimeout(trialTimeoutRef.current)
        }

        const delay = gameMode === 'dual' ? 750 : 0
        if (delay > 0) {
          postDualResponseDelayRef.current = setTimeout(advanceToNextTrial, delay)
        } else {
          advanceToNextTrial()
        }
      }
    },
    [
      isWaitingForResponse,
      trialStartTime,
      currentTrial,
      visualResponseMadeThisTrial,
      audioResponseMadeThisTrial,
      gameMode,
      userVisualResponses,
      userAudioResponses,
      providePracticeFeedback,
      advanceToNextTrial,
    ]
  )

  // Effect to end session when all trials are completed
  useEffect(() => {
    if (gameState === 'playing' && currentTrial === numTrials) {
      endSession()
    }
  }, [gameState, currentTrial, numTrials, endSession])

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState === 'playing' && isWaitingForResponse) {
        if (
          event.key.toLowerCase() === 'a' &&
          (gameMode === 'single-visual' || gameMode === 'dual')
        ) {
          handleResponse('visual')
        } else if (
          event.key.toLowerCase() === 'l' &&
          (gameMode === 'single-audio' || gameMode === 'dual')
        ) {
          handleResponse('audio')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, isWaitingForResponse, gameMode, handleResponse])

  // Helper function to initialize game state
  const initializeGameState = useCallback(() => {
    setCurrentTrial(0)
    setVisualSequence([])
    setAudioSequence([])
    setVisualMatches([])
    setAudioMatches([])
    setUserVisualResponses(Array(numTrials).fill(false))
    setUserAudioResponses(Array(numTrials).fill(false))
    setResponseTimes([])
    setCurrentPosition(null)
    setCurrentLetter('')
    setIsWaitingForResponse(false)
    setVisualResponseMadeThisTrial(false)
    setAudioResponseMadeThisTrial(false)
  }, [numTrials])

  // Helper function to clear timeouts
  const clearAllTimeouts = useCallback(() => {
    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current)
    }
    if (postDualResponseDelayRef.current) {
      clearTimeout(postDualResponseDelayRef.current)
    }
  }, [])

  const startGame = useCallback(() => {
    sessionEndedRef.current = false
    isPracticeModeRef.current = isPracticeMode
    setGameState('playing')
    initializeGameState()
    setTimeout(() => startTrialRef.current?.(), 100)
  }, [isPracticeMode, initializeGameState])

  const resetGame = useCallback(() => {
    sessionEndedRef.current = false
    setGameState('setup')
    clearAllTimeouts()
    cancelAudio()
    initializeGameState()
  }, [clearAllTimeouts, cancelAudio, initializeGameState])

  // useEffect to auto-start game in practice mode (but not after completion)
  useEffect(() => {
    if (isPracticeMode && gameState === 'setup' && !sessionEndedRef.current) {
      startGame()
    }
  }, [isPracticeMode, gameState, startGame])

  if (gameState === 'setup') {
    if (isPracticeMode) {
      return null
    }
    return (
      <GameSetup
        gameMode={gameMode}
        setGameMode={setGameMode}
        nLevel={nLevel}
        setNLevel={setNLevel}
        numTrials={numTrials}
        setNumTrials={setNumTrials}
        stimulusDurationMs={stimulusDurationMs}
        setStimulusDurationMs={setStimulusDurationMs}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        isPracticeMode={isPracticeMode}
        onBack={onBack}
        onStartGame={startGame}
      />
    )
  }

  if (gameState === 'playing') {
    return (
      <GamePlay
        gameMode={gameMode}
        nLevel={nLevel}
        currentTrial={currentTrial}
        numTrials={numTrials}
        currentPosition={currentPosition}
        currentLetter={currentLetter}
        isWaitingForResponse={isWaitingForResponse}
        visualResponseMadeThisTrial={visualResponseMadeThisTrial}
        audioResponseMadeThisTrial={audioResponseMadeThisTrial}
        onPause={resetGame}
        onResponse={handleResponse}
      />
    )
  }

  if (gameState === 'results') {
    // Practice mode should never reach results state - it should have been handled by endSession early return
    if (isPracticeMode) {
      return null
    }

    return (
      <GameResults
        onPlayAgain={resetGame}
        onViewStats={onViewStats}
        onBack={onBack}
      />
    )
  }

  return null
}

export default GameInterface
