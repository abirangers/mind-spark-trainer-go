import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { useSettingsStore } from '@/stores/settingsStore'
import type { GameMode, GameState, GameSession } from '@/types/game'

const PRACTICE_MODE_DEFAULT = 'single-visual' as GameMode
const PRACTICE_N_LEVEL_DEFAULT = 1 // 1-Back for practice
const PRACTICE_NUM_TRIALS_DEFAULT = 7 // Short session
const DEFAULT_NUM_TRIALS = 20
const DEFAULT_N_LEVEL = 2
const DEFAULT_STIMULUS_DURATION_MS = 3000

interface UseNBackLogicProps {
  isPracticeMode?: boolean
  onPracticeComplete?: () => void
  initialNLevel?: number
  initialNumTrials?: number
  initialGameMode?: GameMode
  initialStimulusDurationMs?: number
  initialAudioEnabled?: boolean
}

export const useNBackLogic = ({
  isPracticeMode = false,
  onPracticeComplete,
  initialNLevel,
  initialNumTrials,
  initialGameMode,
  initialStimulusDurationMs,
  initialAudioEnabled = true,
}: UseNBackLogicProps) => {
  const [gameMode, setGameMode] = useState<GameMode>(
    isPracticeMode ? PRACTICE_MODE_DEFAULT : initialGameMode || PRACTICE_MODE_DEFAULT
  )
  const [gameState, setGameState] = useState<GameState>('setup')
  const [nLevel, setNLevel] = useState<number>(
    isPracticeMode ? PRACTICE_N_LEVEL_DEFAULT : initialNLevel || DEFAULT_N_LEVEL
  )
  const [currentTrial, setCurrentTrial] = useState(0)
  const [numTrials, setNumTrials] = useState<number>(
    isPracticeMode ? PRACTICE_NUM_TRIALS_DEFAULT : initialNumTrials || DEFAULT_NUM_TRIALS
  )
  const [stimulusDurationMs, setStimulusDurationMs] = useState(
    initialStimulusDurationMs || DEFAULT_STIMULUS_DURATION_MS
  )
  const [audioEnabled, setAudioEnabled] = useState(initialAudioEnabled)

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

  // Refs
  const currentTrialVisualMatchRef = useRef(false)
  const currentTrialAudioMatchRef = useRef(false)
  const trialTimeoutRef = useRef<NodeJS.Timeout>()
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const startTrialRef = useRef<() => void>()
  const postDualResponseDelayRef = useRef<NodeJS.Timeout>()
  const sessionEndedRef = useRef(false)
  const isPracticeModeRef = useRef(isPracticeMode)

  const isAdaptiveDifficultyEnabled = useSettingsStore(
    state => state.isAdaptiveDifficultyEnabled
  )

  const letters = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], [])

  // Initialize Speech Synthesis
  useEffect(() => {
    if (audioEnabled) {
      synthRef.current = window.speechSynthesis
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [audioEnabled])

  const playAudioLetter = useCallback(
    (letter: string) => {
      if (!audioEnabled || !synthRef.current) {
        return
      }
      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(letter)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      synthRef.current.speak(utterance)
    },
    [audioEnabled]
  )

  const generateStimulus = useCallback(() => {
    const newPosition = Math.floor(Math.random() * 9)
    const newLetter = letters[Math.floor(Math.random() * letters.length)]

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
  }, [visualSequence, audioSequence, nLevel, letters])

  const endSession = useCallback(() => {
    if (sessionEndedRef.current) {
      return
    }

    if (isPracticeModeRef.current) {
      sessionEndedRef.current = true
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current)
      if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current)

      setIsWaitingForResponse(false)
      setCurrentPosition(null)
      setCurrentLetter('')
      // Do not change gameState here for practice, let startGame/resetGame handle it or specific logic in component
      // setGameState('setup') // This was causing issues when practice completes.

      toast.success('Practice Complete! Well done!', { duration: 3000 })

      // Call onPracticeComplete after a short delay to allow UI to update if needed
      // And reset the sessionEndedRef for the next practice session.
      setTimeout(() => {
        onPracticeComplete?.()
        // sessionEndedRef.current = false; // Reset for next practice, if component re-mounts or reset is called
      }, 100)
      return
    }

    sessionEndedRef.current = true
    setGameState('results')

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
        if (visualExpected) actualVisualMatches++
        if (visualExpected && visualResponse) visualHits++
        else if (visualExpected && !visualResponse) visualMisses++
        else if (!visualExpected && visualResponse) visualFalseAlarms++
        else if (!visualExpected && !visualResponse) visualCorrectRejections++
      }
      if (gameMode === 'single-audio' || gameMode === 'dual') {
        if (audioExpected) actualAudioMatches++
        if (audioExpected && audioResponse) audioHits++
        else if (audioExpected && !audioResponse) audioMisses++
        else if (!audioExpected && audioResponse) audioFalseAlarms++
        else if (!audioExpected && !audioResponse) audioCorrectRejections++
      }

      if (visualExpected === visualResponse) visualCorrect++
      if (audioExpected === audioResponse) audioCorrect++
    }

    const visualAccuracy = numTrials > 0 ? (visualCorrect / numTrials) * 100 : 0
    const audioAccuracy = numTrials > 0 ? (audioCorrect / numTrials) * 100 : 0
    const overallAccuracy =
      gameMode === 'dual'
        ? (visualAccuracy + audioAccuracy) / 2
        : gameMode === 'single-visual'
        ? visualAccuracy
        : audioAccuracy

    const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0


    const session: GameSession = {
      trials: numTrials,
      nLevel,
      accuracy: overallAccuracy,
      visualAccuracy,
      audioAccuracy,
      averageResponseTime: avgResponseTime,
      mode: gameMode,
      timestamp: new Date().toISOString(),
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

    const sessions = JSON.parse(localStorage.getItem('nback-sessions') || '[]')
    sessions.push(session)
    localStorage.setItem('nback-sessions', JSON.stringify(sessions))

    toast.success(`Session Complete! ${overallAccuracy.toFixed(1)}% accuracy`)

    if (isAdaptiveDifficultyEnabled) {
      const currentNLevel = nLevel
      let nextNLevel = currentNLevel
      let adaptiveMessage = ''

      if (overallAccuracy >= 80 && currentNLevel < 8) {
        nextNLevel = currentNLevel + 1
        adaptiveMessage = `Congratulations! N-Level increased to ${nextNLevel}!`
      } else if (overallAccuracy < 60 && currentNLevel > 1) {
        nextNLevel = currentNLevel - 1
        adaptiveMessage = `N-Level decreased to ${nextNLevel}. Keep practicing!`
      } else if (overallAccuracy >= 80 && currentNLevel === 8) {
        adaptiveMessage = `You're at the max N-Level (${currentNLevel}) and performing excellently!`
      } else if (overallAccuracy < 60 && currentNLevel === 1) {
        adaptiveMessage = `N-Level remains at ${currentNLevel}. Keep it up!`
      } else {
        adaptiveMessage = `N-Level maintained at ${currentNLevel}. Good effort!`
      }

      if (nextNLevel !== currentNLevel) {
        setNLevel(nextNLevel)
      }
      if (adaptiveMessage) {
        toast(adaptiveMessage, { duration: 4000 })
      }
    }
  }, [
    visualMatches, audioMatches, userVisualResponses, userAudioResponses, responseTimes,
    numTrials, nLevel, gameMode, isAdaptiveDifficultyEnabled, onPracticeComplete,
    // Removed isPracticeMode from here, using isPracticeModeRef.current instead
  ])

  const handleTrialTimeout = useCallback(() => {
    if (isPracticeModeRef.current) {
      const visualExpected = currentTrialVisualMatchRef.current
      if (visualExpected) { // Miss for visual
        toast.error('Missed Match!', { duration: 1500 })
      } else { // Correct rejection for visual
        toast.info('Correct: No match there.', { duration: 1500 })
      }
    }

    setIsWaitingForResponse(false)
    setCurrentPosition(null)
    setCurrentLetter('')
    setResponseTimes(prev => [...prev, stimulusDurationMs]) // Record max duration for timeout

    setCurrentTrial(prev => {
      const next = prev + 1
      if (next < numTrials) {
        setTimeout(() => startTrialRef.current?.(), 1000) // Inter-trial interval
      }
      return next
    })
  }, [numTrials, stimulusDurationMs]) // Removed isPracticeMode, using ref

  const startTrial = useCallback(() => {
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

    trialTimeoutRef.current = setTimeout(handleTrialTimeout, stimulusDurationMs)
  }, [generateStimulus, gameMode, audioEnabled, playAudioLetter, handleTrialTimeout, stimulusDurationMs])

  useEffect(() => {
    startTrialRef.current = startTrial
  }, [startTrial])

  const handleResponse = useCallback(
    (responseType: 'visual' | 'audio') => {
      if (!isWaitingForResponse) return

      const responseTime = Date.now() - trialStartTime
      setResponseTimes(prev => [...prev, responseTime])

      const trialIndexToUpdate = currentTrial // currentTrial is 0-indexed

      let currentVisualResponseMade = visualResponseMadeThisTrial
      let currentAudioResponseMade = audioResponseMadeThisTrial
      // Check if a response for this type was already made in this trial (relevant for practice feedback)
      let alreadyRespondedThisTypeForPractice = false;


      if (responseType === 'visual') {
        alreadyRespondedThisTypeForPractice = userVisualResponses[trialIndexToUpdate];
        setUserVisualResponses(prev => {
          const newR = [...prev]
          if (trialIndexToUpdate < newR.length) newR[trialIndexToUpdate] = true
          return newR
        })
        setVisualResponseMadeThisTrial(true)
        currentVisualResponseMade = true
      } else { // audio
        alreadyRespondedThisTypeForPractice = userAudioResponses[trialIndexToUpdate];
        setUserAudioResponses(prev => {
          const newR = [...prev]
          if (trialIndexToUpdate < newR.length) newR[trialIndexToUpdate] = true
          return newR
        })
        setAudioResponseMadeThisTrial(true)
        currentAudioResponseMade = true
      }

      if (isPracticeModeRef.current && responseType === 'visual' && !alreadyRespondedThisTypeForPractice) {
        const visualExpected = currentTrialVisualMatchRef.current
        const visualResponse = true // User just responded

        if (visualExpected && visualResponse) {
          toast.success('Correct Match!', { duration: 1500 })
        } else if (!visualExpected && visualResponse) {
          toast.warning("Oops! That wasn't a match (False Alarm).", { duration: 1500 })
        }
      }


      const performTrialAdvancement = () => {
        setCurrentPosition(null)
        setCurrentLetter('')
        setCurrentTrial(prev => {
          const next = prev + 1
          if (next < numTrials) {
            setTimeout(() => startTrialRef.current?.(), 1000) // Inter-trial interval
          }
          return next
        })
      }

      if (gameMode === 'dual') {
        if (currentVisualResponseMade && currentAudioResponseMade) {
          setIsWaitingForResponse(false)
          if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current)
          postDualResponseDelayRef.current = setTimeout(performTrialAdvancement, 750)
        }
      } else { // single modes
        setIsWaitingForResponse(false)
        if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current)
        performTrialAdvancement()
      }
    },
    [
      isWaitingForResponse, trialStartTime, numTrials, gameMode, currentTrial,
      visualResponseMadeThisTrial, audioResponseMadeThisTrial, userVisualResponses, userAudioResponses
      // Removed isPracticeMode, using ref
    ]
  )

  // Effect to end session when all trials are completed
  useEffect(() => {
    if (gameState === 'playing' && currentTrial === numTrials && numTrials > 0) { // Ensure numTrials > 0
      endSession()
    }
  }, [gameState, currentTrial, numTrials, endSession])


  const startGame = useCallback(() => {
    sessionEndedRef.current = false
    isPracticeModeRef.current = isPracticeMode // Update ref with current prop value

    // Reset initial states based on whether it's practice mode or configured mode
    setGameMode(isPracticeMode ? PRACTICE_MODE_DEFAULT : initialGameMode || PRACTICE_MODE_DEFAULT);
    setNLevel(isPracticeMode ? PRACTICE_N_LEVEL_DEFAULT : initialNLevel || DEFAULT_N_LEVEL);
    setNumTrials(isPracticeMode ? PRACTICE_NUM_TRIALS_DEFAULT : initialNumTrials || DEFAULT_NUM_TRIALS);

    setGameState('playing')
    setCurrentTrial(0)
    setVisualSequence([])
    setAudioSequence([])
    setVisualMatches([])
    setAudioMatches([])
    // Initialize with numTrials which might have just been updated
    setUserVisualResponses(Array(isPracticeMode ? PRACTICE_NUM_TRIALS_DEFAULT : initialNumTrials || DEFAULT_NUM_TRIALS).fill(false))
    setUserAudioResponses(Array(isPracticeMode ? PRACTICE_NUM_TRIALS_DEFAULT : initialNumTrials || DEFAULT_NUM_TRIALS).fill(false))
    setResponseTimes([])
    setCurrentPosition(null)
    setCurrentLetter('')
    setIsWaitingForResponse(false) // Ensure this is reset
    setVisualResponseMadeThisTrial(false)
    setAudioResponseMadeThisTrial(false)

    // Clear any lingering timeouts
    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current)
    if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current)

    setTimeout(() => startTrialRef.current?.(), 100)
  }, [isPracticeMode, initialGameMode, initialNLevel, initialNumTrials])


  // Auto-start game in practice mode, but only once if gameState is 'setup'
  useEffect(() => {
    if (isPracticeMode && gameState === 'setup' && !sessionEndedRef.current) {
      startGame()
    }
  }, [isPracticeMode, gameState, startGame])


  const resetGame = useCallback(() => {
    sessionEndedRef.current = false // Critical for allowing restart after practice/normal session
    setGameState('setup')
    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current)
    if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current)
    if (synthRef.current && audioEnabled) {
      synthRef.current.cancel()
    }
    setCurrentPosition(null)
    setCurrentLetter('')
    setIsWaitingForResponse(false)
    // Do not reset N-Level here if adaptive difficulty changed it, allow it to persist for next game
    // Or, if it should reset, then explicitly set it to initialNLevel or default.
    // For now, nLevel is preserved from adaptive changes unless specifically reset by UI.
  }, [audioEnabled])

  const getLastSession = useCallback((): GameSession | null => {
    const sessions = JSON.parse(localStorage.getItem('nback-sessions') || '[]') as GameSession[]
    if (sessions.length > 0) {
      return sessions[sessions.length - 1]
    }
    return null
  }, [])

  // Ensure isPracticeModeRef is updated if the prop changes
  useEffect(() => {
    isPracticeModeRef.current = isPracticeMode;
  }, [isPracticeMode]);


  return {
    // State values
    gameState,
    gameMode,
    nLevel,
    currentTrial,
    numTrials,
    currentPosition,
    currentLetter,
    isWaitingForResponse,
    visualResponseMadeThisTrial,
    audioResponseMadeThisTrial,
    stimulusDurationMs,
    audioEnabled,
    letters, // Exposed for UI if needed, e.g. key display

    // State setters / UI actions
    setGameMode, // For setup screen
    setNLevel,   // For setup screen
    setNumTrials, // For setup screen
    setStimulusDurationMs, // For setup screen
    setAudioEnabled, // For setup screen

    startGame,
    resetGame, // Pauses game and returns to setup
    handleResponse, // For game screen button clicks / key presses
    getLastSession, // For results screen

    // Potentially useful for UI, though maybe not directly
    // visualSequence,
    // audioSequence,
    // visualMatches,
    // audioMatches,
    // userVisualResponses,
    // userAudioResponses,
    // responseTimes,
  }
}
