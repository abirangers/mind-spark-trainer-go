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


const GameInterface = ({
  onBack,
  onViewStats,
  isPracticeMode = false,
  onPracticeComplete,
}: GameInterfaceProps) => {
  const [gameMode, setGameMode] = useState<GameMode>(
    isPracticeMode ? PRACTICE_MODE : 'single-visual'
  )
  const [gameState, setGameState] = useState<GameState>('setup') // Keep setup initially to show parameters
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

  const generateStimulus = useCallback(() => {
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



  const endSession = useCallback(() => {
    // Prevent multiple calls to endSession
    if (sessionEndedRef.current) {
      return
    }

    // Handle practice mode completion separately - no session saving or adaptive difficulty
    // Use ref to get the original practice mode state, not the current prop which might have changed
    if (isPracticeModeRef.current) {
      sessionEndedRef.current = true // Set flag only after we know we're processing practice mode

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
      setGameState('setup') // Force back to setup state for practice mode

      toast.success('Practice Complete! Well done!', { duration: 3000 })

      // Use setTimeout to ensure state changes are processed before calling onPracticeComplete
      setTimeout(() => {
        if (onPracticeComplete) {
          onPracticeComplete()
        }
      }, 100)

      return // Early return - skip all session processing logic below
    }

    // Set flag for normal mode
    sessionEndedRef.current = true

    // Normal mode session completion logic
    setGameState('results')

    let visualCorrect = 0
    let audioCorrect = 0

    // Initialize New Counters
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

      // Inside the for loop:
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

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length

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
  }, [
    onPracticeComplete,
    visualMatches,
    audioMatches,
    userVisualResponses,
    userAudioResponses,
    responseTimes,
    numTrials,
    nLevel,
    gameMode,
  ])

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
      let visualUserRespondedLate = false // To track if this is a late response for visual

      if (responseType === 'visual') {
        visualUserRespondedLate = userVisualResponses[trialIndexToUpdate] // Check if already true
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
        // responseType === 'audio'
        // Similar logic for audio if practice mode expands
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

      if (isPracticeMode && responseType === 'visual' && !visualUserRespondedLate) {
        // Provide feedback only for the first response to this stimulus type in the trial
        const visualExpected = currentTrialVisualMatchRef.current // Use reliable ref
        const visualResponse = true // User just responded visually

        if (visualExpected && visualResponse) {
          toast.success('Correct Match!', { duration: 1500 })
        } else if (!visualExpected && visualResponse) {
          toast.warning("Oops! That wasn't a match (False Alarm).", { duration: 1500 })
        }
        // Misses and Correct Rejections (no key press) for practice are handled in handleTrialTimeout
      }

      const performTrialAdvancement = () => {
        // This function contains the logic to clear stimuli and schedule the next trial
        setCurrentPosition(null)
        setCurrentLetter('')
        setCurrentTrial(prev => {
          const next = prev + 1
          if (next < numTrials) {
            setTimeout(() => startTrialRef.current?.(), 1000) // Standard inter-trial interval
          }
          // No direct call to endSession() here
          return next
        })
      }

      if (gameMode === 'dual') {
        if (currentVisualResponseMade && currentAudioResponseMade) {
          setIsWaitingForResponse(false) // Stop waiting for inputs for this trial
          if (trialTimeoutRef.current) {
            clearTimeout(trialTimeoutRef.current) // Clear the main stimulus timeout
          }
          // Introduce a 750ms delay before clearing stimuli and advancing
          postDualResponseDelayRef.current = setTimeout(() => {
            performTrialAdvancement()
          }, 750)
        }
        // else, if only one response made in dual mode, do nothing yet.
        // Still waiting for the other response or for the main trialTimeout.
      } else {
        // single-visual or single-audio mode
        setIsWaitingForResponse(false)
        if (trialTimeoutRef.current) {
          clearTimeout(trialTimeoutRef.current)
        }
        // For single modes, advance immediately (clear stimuli and then start inter-trial interval)
        performTrialAdvancement()
      }
    },
    [
      isWaitingForResponse,
      trialStartTime,
      numTrials,
      gameMode,
      currentTrial,
      visualResponseMadeThisTrial,
      audioResponseMadeThisTrial,
      isPracticeMode,
      userVisualResponses,
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

  const startGame = useCallback(() => {
    sessionEndedRef.current = false // Reset session ended flag
    isPracticeModeRef.current = isPracticeMode // Update practice mode ref
    setGameState('playing')
    setCurrentTrial(0)
    setVisualSequence([])
    setAudioSequence([])
    setVisualMatches([])
    setAudioMatches([])
    setUserVisualResponses(Array(numTrials).fill(false))
    setUserAudioResponses(Array(numTrials).fill(false))
    setResponseTimes([])
    // The actual first trial is started by the useEffect that depends on gameState === 'playing'
    // or directly if not using such an effect. Here, startTrial is called after a delay.
    // If startTrial is the function that shows the first stimulus, this is fine.
    setTimeout(() => startTrialRef.current?.(), 100) // Using startTrialRef for stability
  }, [numTrials, isPracticeMode])

  // useEffect to auto-start game in practice mode (but not after completion)
  useEffect(() => {
    if (isPracticeMode && gameState === 'setup' && !sessionEndedRef.current) {
      startGame()
    }
  }, [isPracticeMode, gameState, startGame])

  const resetGame = () => {
    sessionEndedRef.current = false // Reset session ended flag
    setGameState('setup')
    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current)
    }
    if (postDualResponseDelayRef.current) {
      clearTimeout(postDualResponseDelayRef.current)
    }
    cancelAudio()
    setCurrentPosition(null)
    setCurrentLetter('')
    setIsWaitingForResponse(false)
  }

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
