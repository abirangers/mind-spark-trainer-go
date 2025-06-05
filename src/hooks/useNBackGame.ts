import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  GameMode,
  GameState,
  GameSession,
} from '../components/game/types'
import {
  AUDIO_LETTERS,
  PRACTICE_MODE,
  PRACTICE_N_LEVEL,
  PRACTICE_NUM_TRIALS,
  useAudioSynthesis,
} from '../components/game' // This should provide access to constants and hooks
import {
  calculatePerformanceStats,
  PerformanceStats,
  CalculateStatsArgs,
} from '../lib/gameUtils'

export interface UseNBackGameProps {
  initialGameMode?: GameMode
  initialNLevel?: number
  initialNumTrials?: number
  initialStimulusDurationMs?: number
  initialAudioEnabled?: boolean
  isPracticeMode: boolean
  onPracticeComplete?: () => void
}

/**
 * @typedef UseNBackGameReturn
 * @description The return type of the useNBackGame hook.
 * @property {GameState} gameState - Current state of the game (setup, playing, results).
 * @property {GameMode} gameMode - Current game mode (single-visual, single-audio, dual).
 * @property {number} nLevel - Current N-back level.
 * @property {number} numTrials - Total number of trials for the current session.
 * @property {number} stimulusDurationMs - Duration each stimulus is displayed, in milliseconds.
 * @property {boolean} audioEnabled - Whether audio stimuli are enabled.
 * @property {number} currentTrial - Index of the current trial (0-based).
 * @property {number | null} currentPosition - Current visual stimulus position (0-8 or null).
 * @property {string} currentLetter - Current audio stimulus letter.
 * @property {boolean} isWaitingForResponse - Whether the game is currently waiting for user input.
 * @property {boolean} visualResponseMadeThisTrial - Whether a visual response has been made for the current trial.
 * @property {boolean} audioResponseMadeThisTrial - Whether an audio response has been made for the current trial.
 * @property {PerformanceStats | null} performanceStats - Statistics of the completed game session.
 * @property {(mode: GameMode) => void} setGameMode - Function to set the game mode.
 * @property {(level: number) => void} setNLevel - Function to set the N-back level.
 * @property {(trials: number) => void} setNumTrials - Function to set the number of trials.
 * @property {(duration: number) => void} setStimulusDurationMs - Function to set the stimulus duration.
 * @property {(enabled: boolean) => void} setAudioEnabled - Function to toggle audio.
 * @property {() => void} startGame - Function to start the game.
 * @property {() => void} resetGame - Function to reset the game to the setup phase.
 * @property {(responseType: 'visual' | 'audio') => void} handleResponse - Function to process user responses.
 * @property {() => void} endSessionForResults - Function to manually end the session and move to results.
 */
export interface UseNBackGameReturn {
  // State
  gameState: GameState
  gameMode: GameMode
  nLevel: number
  numTrials: number
  stimulusDurationMs: number
  audioEnabled: boolean
  currentTrial: number
  currentPosition: number | null
  currentLetter: string
  isWaitingForResponse: boolean
  visualResponseMadeThisTrial: boolean
  audioResponseMadeThisTrial: boolean
  performanceStats: PerformanceStats | null // Calculated when game ends

  // Actions / Setters
  setGameMode: (mode: GameMode) => void
  setNLevel: (level: number) => void
  setNumTrials: (trials: number) => void
  setStimulusDurationMs: (duration: number) => void
  setAudioEnabled: (enabled: boolean) => void
  startGame: () => void
  resetGame: () => void // Resets to setup
  handleResponse: (responseType: 'visual' | 'audio') => void
  endSessionForResults: () => void // To manually move to results if needed, e.g. practice completion
}

/**
 * @hook useNBackGame
 * @description Manages the core logic, state, and lifecycle for the N-Back game.
 * It handles game setup, trial progression, stimulus generation, user responses,
 * performance calculation, and session management.
 *
 * @param {UseNBackGameProps} props - Initial properties for game setup, including
 * practice mode settings and callbacks.
 * @returns {UseNBackGameReturn} An object containing the current game state,
 * derived values, and action handlers to interact with the game.
 */
export const useNBackGame = ({
  initialGameMode,
  initialNLevel,
  initialNumTrials,
  initialStimulusDurationMs,
  initialAudioEnabled,
  isPracticeMode,
  onPracticeComplete,
}: UseNBackGameProps): UseNBackGameReturn => {
  const [gameMode, setGameMode] = useState<GameMode>(
    isPracticeMode ? PRACTICE_MODE : initialGameMode || 'single-visual'
  )
  const [gameState, setGameState] = useState<GameState>('setup')
  const [nLevel, setNLevel] = useState<number>(
    isPracticeMode ? PRACTICE_N_LEVEL : initialNLevel || 2
  )
  const [numTrials, setNumTrials] = useState<number>(
    isPracticeMode ? PRACTICE_NUM_TRIALS : initialNumTrials || 20
  )
  const [stimulusDurationMs, setStimulusDurationMs] = useState(
    initialStimulusDurationMs || 3000
  )
  const [audioEnabled, setAudioEnabled] = useState(initialAudioEnabled !== undefined ? initialAudioEnabled : true)

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
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null)

  const currentTrialVisualMatchRef = useRef(false)
  const currentTrialAudioMatchRef = useRef(false)
  const trialTimeoutRef = useRef<NodeJS.Timeout>()
  const startTrialRef = useRef<() => void>()
  const postDualResponseDelayRef = useRef<NodeJS.Timeout>()
  const sessionEndedRef = useRef(false)
  const isPracticeModeRef = useRef(isPracticeMode)

  const { playAudioLetter, cancelAudio } = useAudioSynthesis({ audioEnabled })

  const generateStimulus = useCallback((): {
    newPosition: number
    newLetter: string
    visualMatch: boolean
    audioMatch: boolean
  } => {
    const newPosition = Math.floor(Math.random() * 9)
    const newLetter = AUDIO_LETTERS[Math.floor(Math.random() * AUDIO_LETTERS.length)]

    const visualMatch =
      visualSequence.length >= nLevel &&
      visualSequence[visualSequence.length - nLevel] === newPosition
    const audioMatch =
      audioSequence.length >= nLevel && audioSequence[audioSequence.length - nLevel] === newLetter

    setVisualSequence(prev => [...prev, newPosition])
    setAudioSequence(prev => [...prev, newLetter])
    setVisualMatches(prev => [...prev, visualMatch])
    setAudioMatches(prev => [...prev, audioMatch])

    return { newPosition, newLetter, visualMatch, audioMatch }
  }, [visualSequence, audioSequence, nLevel])

  const handlePracticeCompletion = useCallback(() => {
    sessionEndedRef.current = true
    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current)
    if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current)

    setIsWaitingForResponse(false)
    setCurrentPosition(null)
    setCurrentLetter('')
    // Do not change gameState to 'setup' here, let GameInterface handle it or use onPracticeComplete

    toast.success('Practice Complete! Well done!', { duration: 3000 })

    if (onPracticeComplete) {
        onPracticeComplete()
    }
    // Reset internal game state for a potential new game start by parent
    // setGameState('setup'); // This should be controlled by the component using the hook
  }, [onPracticeComplete])

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

    try {
      const sessions = JSON.parse(localStorage.getItem('nback-sessions') || '[]')
      sessions.push(session)
      localStorage.setItem('nback-sessions', JSON.stringify(sessions))
    } catch (error) {
      console.error("Failed to save game session:", error)
      toast.error("Could not save session. Local storage might be full or disabled.")
    }
    return stats.overallAccuracy
  }, [numTrials, nLevel, gameMode])

  /**
   * @function endSession
   * @description Ends the current game session, calculates performance statistics,
   * saves the session, and transitions the game state to 'results'.
   * If in practice mode, it triggers practice completion handling.
   */
  const endSession = useCallback(() => {
    if (sessionEndedRef.current) return

    if (isPracticeModeRef.current) {
      handlePracticeCompletion()
      return
    }

    sessionEndedRef.current = true

    const statsArgs: CalculateStatsArgs = {
      numTrials,
      visualMatches,
      audioMatches,
      userVisualResponses,
      userAudioResponses,
      responseTimes,
      gameMode,
    }
    const stats = calculatePerformanceStats(statsArgs)
    setPerformanceStats(stats)
    saveGameSession(stats)
    setGameState('results') // This hook will now control the results state
    toast.success(`Session Complete! ${stats.overallAccuracy.toFixed(1)}% accuracy`)
  }, [
    numTrials,
    visualMatches,
    audioMatches,
    userVisualResponses,
    userAudioResponses,
    responseTimes,
    gameMode,
    handlePracticeCompletion,
    saveGameSession,
  ])

  // Specific function for GameInterface to call when it wants to navigate to results
  // For example, after practice is complete and GameInterface decides what to do next.
  /**
   * @function endSessionForResults
   * @description Manually transitions the game state to 'results'.
   * Useful for scenarios like after practice completion where results might be optionally shown.
   */
  const endSessionForResults = useCallback(() => {
      setGameState('results');
  }, []);


  const [currentTrial, setCurrentTrial] = useState(0) // Moved after endSession to satisfy ESLint

  /**
   * @function handleTrialTimeout
   * @description Handles the logic when a trial times out (user did not respond in time).
   * It records default responses, provides feedback in practice mode, and advances to the next trial.
   */
  const handleTrialTimeout = useCallback(() => {
    if (isPracticeModeRef.current) {
      const visualExpected = currentTrialVisualMatchRef.current
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
    setUserVisualResponses(prev => {
        const newResponses = [...prev];
        if (currentTrial < newResponses.length && newResponses[currentTrial] === undefined) newResponses[currentTrial] = false;
        return newResponses;
    });
    setUserAudioResponses(prev => {
        const newResponses = [...prev];
        if (currentTrial < newResponses.length && newResponses[currentTrial] === undefined) newResponses[currentTrial] = false;
        return newResponses;
    });


    setCurrentTrial(prev => {
      const next = prev + 1
      if (next < numTrials) {
        setTimeout(() => startTrialRef.current?.(), 1000) // Ensure startTrialRef is defined
      }
      return next
    })
  }, [numTrials, stimulusDurationMs, currentTrial])

  const startTrial = useCallback(() => {
    if (currentTrial >= numTrials) return; // Prevent starting trial if game is over

    const { newPosition, newLetter, visualMatch, audioMatch } = generateStimulus()

    setCurrentPosition(newPosition)
    setCurrentLetter(newLetter)
    setVisualResponseMadeThisTrial(false)
    setAudioResponseMadeThisTrial(false)
    setIsWaitingForResponse(true)
    setTrialStartTime(Date.now())

    currentTrialVisualMatchRef.current = visualMatch
    currentTrialAudioMatchRef.current = audioMatch

    if ((gameMode === 'single-audio' || gameMode === 'dual') && audioEnabled) {
      playAudioLetter(newLetter)
    }

    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current)
    trialTimeoutRef.current = setTimeout(handleTrialTimeout, stimulusDurationMs)
  }, [
    currentTrial,
    numTrials,
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

  const providePracticeFeedback = useCallback((responseType: 'visual' | 'audio', isFirstResponseThisType: boolean) => {
    if (!isPracticeModeRef.current || !isFirstResponseThisType) return

    if (responseType === 'visual') {
      const visualExpected = currentTrialVisualMatchRef.current
      toast.info(visualExpected ? 'Correct Match!' : "Oops! That wasn't a match.", { duration: 1500 })
    }
    // Audio feedback can be added here if practice mode supports it
  }, [])

  /**
   * @function handleResponse
   * @description Processes user responses for visual or audio stimuli.
   * It records the response, response time, updates trial status, provides feedback,
   * and advances the game.
   * @param {'visual' | 'audio'} responseType - The type of response made by the user.
   */
  const handleResponse = useCallback(
    (responseType: 'visual' | 'audio') => {
      if (!isWaitingForResponse || currentTrial >= numTrials) return

      const responseTime = Date.now() - trialStartTime
      setResponseTimes(prev => [...prev, responseTime])

      const trialIndexToUpdate = currentTrial
      let currentVisualResponseMade = visualResponseMadeThisTrial
      let currentAudioResponseMade = audioResponseMadeThisTrial
      let isFirstResponseThisType = false


      if (responseType === 'visual') {
        if (!userVisualResponses[trialIndexToUpdate]) { // Check if already responded for this type
            isFirstResponseThisType = true;
        }
        setUserVisualResponses(prevResponses => {
          const newResponses = [...prevResponses]
          newResponses[trialIndexToUpdate] = true
          return newResponses
        })
        setVisualResponseMadeThisTrial(true)
        currentVisualResponseMade = true
      } else if (responseType === 'audio') {
         if (!userAudioResponses[trialIndexToUpdate]) {
            isFirstResponseThisType = true;
        }
        setUserAudioResponses(prevResponses => {
          const newResponses = [...prevResponses]
          newResponses[trialIndexToUpdate] = true
          return newResponses
        })
        setAudioResponseMadeThisTrial(true)
        currentAudioResponseMade = true
      }

      providePracticeFeedback(responseType, isFirstResponseThisType)

      const bothResponsesNeeded = gameMode === 'dual'
      const bothResponsesMade = currentVisualResponseMade && currentAudioResponseMade

      if (!bothResponsesNeeded || bothResponsesMade) {
        setIsWaitingForResponse(false)
        if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current)

        const delay = gameMode === 'dual' && bothResponsesMade ? 750 : 0
        if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current)

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
      numTrials,
      visualResponseMadeThisTrial,
      audioResponseMadeThisTrial,
      gameMode,
      userVisualResponses, // Added to deps
      userAudioResponses, // Added to deps
      providePracticeFeedback,
      advanceToNextTrial,
    ]
  )

  const initializeGameStateArrays = useCallback((trials: number) => {
    setUserVisualResponses(Array(trials).fill(false))
    setUserAudioResponses(Array(trials).fill(false))
    setVisualMatches(Array(trials).fill(false)) // Also initialize match arrays
    setAudioMatches(Array(trials).fill(false))
  }, [])


  const initializeGameCoreState = useCallback(() => {
    setCurrentTrial(0)
    setVisualSequence([])
    setAudioSequence([])
    // visualMatches and audioMatches are now set by generateStimulus one by one
    // For userResponses, initialize them based on numTrials
    initializeGameStateArrays(numTrials);
    setResponseTimes([])
    setCurrentPosition(null)
    setCurrentLetter('')
    setIsWaitingForResponse(false)
    setVisualResponseMadeThisTrial(false)
    setAudioResponseMadeThisTrial(false)
    setPerformanceStats(null) // Clear previous stats
    sessionEndedRef.current = false
  }, [numTrials, initializeGameStateArrays])

  const clearAllTimeouts = useCallback(() => {
    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current)
    if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current)
  }, [])

  const startGameHook = useCallback(() => {
    isPracticeModeRef.current = isPracticeMode // Update ref in case isPracticeMode prop changes
    setGameState('playing')
    initializeGameCoreState()
    // Delay startTrial slightly to allow UI to update to 'playing' state
    setTimeout(() => startTrialRef.current?.(), 100)
  }, [isPracticeMode, initializeGameCoreState])

  /**
   * @function resetGame (exposed as resetGame)
   * @description Resets the game to its initial setup state.
   * It clears timeouts, cancels audio, and re-initializes core game state variables.
   */
  const resetGameHook = useCallback(() => {
    setGameState('setup')
    clearAllTimeouts()
    cancelAudio()
    initializeGameCoreState() // Resets sequences, responses, etc.
    // Settings like nLevel, numTrials, gameMode are preserved for next game
  }, [clearAllTimeouts, cancelAudio, initializeGameCoreState])

  useEffect(() => {
    if (gameState === 'playing' && currentTrial === numTrials && !sessionEndedRef.current) {
      endSession()
    }
  }, [gameState, currentTrial, numTrials, endSession])

  // Auto-start game in practice mode (but not after completion/explicit reset)
  useEffect(() => {
    // isPracticeModeRef.current ensures we use the initial practice mode status for this effect
    if (isPracticeModeRef.current && gameState === 'setup' && !sessionEndedRef.current) {
       // Check if onPracticeComplete is defined, if so, implies it's being handled by parent
      if (onPracticeComplete) {
        // If there's an onPracticeComplete callback, GameInterface might control start
        // For now, let's assume direct start is okay for practice
        startGameHook()
      } else {
        startGameHook()
      }
    }
  }, [isPracticeModeRef, gameState, startGameHook, onPracticeComplete])

  // Effect to update isPracticeModeRef if the prop changes
  useEffect(() => {
    isPracticeModeRef.current = isPracticeMode;
  }, [isPracticeMode]);

  // Effect to re-initialize arrays if numTrials changes in setup
  useEffect(() => {
    if (gameState === 'setup') {
      initializeGameStateArrays(numTrials);
    }
  }, [numTrials, gameState, initializeGameStateArrays]);


  return {
    gameState,
    gameMode,
    nLevel,
    numTrials,
    stimulusDurationMs,
    audioEnabled,
    currentTrial,
    currentPosition,
    currentLetter,
    isWaitingForResponse,
    visualResponseMadeThisTrial,
    audioResponseMadeThisTrial,
    performanceStats,
    setGameMode,
    setNLevel,
    setNumTrials,
    setStimulusDurationMs,
    setAudioEnabled,
    startGame: startGameHook,
    resetGame: resetGameHook,
    handleResponse,
    endSessionForResults,
  }
}
