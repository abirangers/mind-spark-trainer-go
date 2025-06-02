import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Volume2, VolumeX, Play, Pause, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { AdaptiveDifficultyToggle } from '@/components/ui/AdaptiveDifficultyToggle'
import { useSettingsStore } from '@/stores/settingsStore' // Added import

interface GameInterfaceProps {
  onBack: () => void
  onViewStats: () => void
  isPracticeMode?: boolean // New prop
  onPracticeComplete?: () => void // New prop
}

type GameMode = 'single-visual' | 'single-audio' | 'dual'
type GameState = 'setup' | 'playing' | 'paused' | 'results'

interface GameSession {
  trials: number
  nLevel: number
  accuracy: number
  visualAccuracy: number
  audioAccuracy: number
  averageResponseTime: number
  mode: GameMode
  timestamp: string

  // New detailed counts (optional for backward compatibility with old data)
  actualVisualMatches?: number
  visualHits?: number
  visualMisses?: number
  visualFalseAlarms?: number
  visualCorrectRejections?: number

  actualAudioMatches?: number
  audioHits?: number
  audioMisses?: number
  audioFalseAlarms?: number
  audioCorrectRejections?: number
}

const PRACTICE_MODE = 'single-visual' as GameMode
const PRACTICE_N_LEVEL = 1 // 1-Back for practice
const PRACTICE_NUM_TRIALS = 7 // Short session

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
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const startTrialRef = useRef<() => void>()
  const postDualResponseDelayRef = useRef<NodeJS.Timeout>()
  const sessionEndedRef = useRef(false) // Flag to prevent multiple endSession calls
  const isPracticeModeRef = useRef(isPracticeMode) // Store initial practice mode state

  const isAdaptiveDifficultyEnabled = useSettingsStore(
    // Access store state
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

  const generateStimulus = useCallback(() => {
    const newPosition = Math.floor(Math.random() * 9)
    const newLetter = letters[Math.floor(Math.random() * letters.length)]

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
  }, [visualSequence, audioSequence, nLevel, letters])

  const playAudioLetter = useCallback(
    (letter: string) => {
      if (!audioEnabled || !synthRef.current) {
        return
      }

      // Cancel any ongoing speech
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(letter)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      synthRef.current.speak(utterance)
    },
    [audioEnabled]
  )

  const endSession = useCallback(() => {
    console.log('🔥 endSession called - sessionEnded:', sessionEndedRef.current, 'isPracticeMode:', isPracticeMode, 'isPracticeModeRef:', isPracticeModeRef.current)

    // Prevent multiple calls to endSession
    if (sessionEndedRef.current) {
      console.log('🚫 endSession blocked - already ended')
      return
    }

    // Handle practice mode completion separately - no session saving or adaptive difficulty
    // Use ref to get the original practice mode state, not the current prop which might have changed
    if (isPracticeModeRef.current) {
      console.log('✅ Processing practice mode completion')
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

    // Adaptive Difficulty Logic
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
        // Maintained level (60-79%) or no change possible
        adaptiveMessage = `N-Level maintained at ${currentNLevel}. Good effort!`
      }

      if (nextNLevel !== currentNLevel) {
        setNLevel(nextNLevel)
      }

      if (adaptiveMessage) {
        toast(adaptiveMessage, {
          duration: 4000,
        })
      }
    }
  }, [
    isPracticeMode,
    onPracticeComplete,
    visualMatches,
    audioMatches,
    userVisualResponses,
    userAudioResponses,
    responseTimes,
    numTrials,
    nLevel,
    gameMode,
    setNLevel,
    isAdaptiveDifficultyEnabled, // Added dependency
    // toast // Technically toast is a dependency if used within this callback
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
      console.log('🎯 Ending session - currentTrial:', currentTrial, 'numTrials:', numTrials, 'isPracticeMode:', isPracticeMode)
      endSession()
    }
  }, [gameState, currentTrial, numTrials, endSession, isPracticeMode])

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
    if (synthRef.current && audioEnabled) {
      // Check audioEnabled
      synthRef.current.cancel()
    }
    setCurrentPosition(null)
    setCurrentLetter('')
    setIsWaitingForResponse(false)
  }

  if (gameState === 'setup') {
    if (isPracticeMode) {
      return null
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">N-Back Training Setup</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Game Mode Selection */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Select Training Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    {
                      mode: 'single-visual' as const,
                      title: 'Single N-Back (Visual)',
                      desc: 'Remember visual positions only',
                    },
                    {
                      mode: 'single-audio' as const,
                      title: 'Single N-Back (Audio)',
                      desc: 'Remember audio letters only',
                    },
                    {
                      mode: 'dual' as const,
                      title: 'Dual N-Back',
                      desc: 'Remember both visual and audio stimuli',
                    },
                  ].map(({ mode, title, desc }) => (
                    <div
                      key={mode}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        gameMode === mode ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      } ${isPracticeMode ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-gray-300'}`}
                      onClick={() => {
                        if (!isPracticeMode) {
                          setGameMode(mode)
                        }
                      }}
                    >
                      <div className="font-semibold">{title}</div>
                      <div className="text-sm text-gray-600">{desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Training Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">N-Level (Difficulty)</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNLevel(prev => Math.max(1, prev - 1))}
                      disabled={isPracticeMode || nLevel <= 1}
                    >
                      -
                    </Button>
                    <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">
                      {nLevel}-Back
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNLevel(prev => Math.min(8, prev + 1))}
                      disabled={isPracticeMode || nLevel >= 8}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Higher N-levels are more challenging</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Number of Trials</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNumTrials(prev => Math.max(10, prev - 5))}
                      disabled={isPracticeMode || numTrials <= 10}
                    >
                      -
                    </Button>
                    <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">
                      {numTrials}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNumTrials(prev => Math.min(50, prev + 5))}
                      disabled={isPracticeMode || numTrials >= 50}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Adjust the total trials per session (10-50).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stimulus Duration</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStimulusDurationMs(prev => Math.max(2000, prev - 500))}
                      disabled={isPracticeMode || stimulusDurationMs <= 2000}
                    >
                      -
                    </Button>
                    <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">
                      {(stimulusDurationMs / 1000).toFixed(1)}s
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStimulusDurationMs(prev => Math.min(4000, prev + 500))}
                      disabled={isPracticeMode || stimulusDurationMs >= 4000}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Time each stimulus is shown (2.0s - 4.0s).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Audio Settings</label>
                  <Button
                    variant="outline"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className="gap-2"
                  >
                    {audioEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                    {audioEnabled ? 'Audio On' : 'Audio Off'}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• Trials: {numTrials}</div>
                    <div>
                      • Duration: ~{Math.ceil((numTrials * (stimulusDurationMs / 1000 + 1)) / 60)}{' '}
                      minutes
                    </div>
                    <div>
                      • Mode: {gameMode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                </div>

                {!isPracticeMode && ( // Conditionally render AdaptiveDifficultyToggle
                  <div className="pt-4">
                    <AdaptiveDifficultyToggle />
                    <p className="text-xs text-gray-500 mt-1 pl-1">
                      N-Level adjusts based on your performance.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center mt-8">
            <Button
              size="lg"
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg gap-2"
            >
              <Play className="h-5 w-5" />
              Start Training Session
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={resetGame} className="gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                {nLevel}-Back {gameMode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Trial</div>
              <div className="text-2xl font-bold">
                {currentTrial + 1} / {numTrials}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <Progress
              value={numTrials > 0 ? (currentTrial / numTrials) * 100 : 0}
              className="h-2"
            />
          </div>

          {/* Game Area - keeping original white background */}
          <div className="bg-white rounded-lg p-8 mb-8 shadow-lg">
            <div className="space-y-8">
              {/* Visual Grid - keeping original blue design */}
              {(gameMode === 'single-visual' || gameMode === 'dual') && (
                <div className="text-center">
                  <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                    {[...Array(9)].map((_, index) => (
                      <div
                        key={index}
                        className={`w-20 h-20 border-2 rounded-lg transition-all duration-200 ${
                          currentPosition === index
                            ? 'bg-blue-500 border-blue-400 shadow-lg'
                            : 'bg-gray-100 border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Audio Display */}
              {(gameMode === 'single-audio' || gameMode === 'dual') && (
                <div className="text-center">
                  <div
                    className={`text-6xl font-bold transition-all duration-200 ${
                      currentLetter ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {currentLetter || '?'}
                  </div>
                </div>
              )}

              {/* Response Buttons - new design matching the reference image */}
              <div className="flex gap-4 justify-center pt-8">
                {(gameMode === 'single-visual' || gameMode === 'dual') && (
                  <button
                    onClick={() => handleResponse('visual')}
                    disabled={!isWaitingForResponse}
                    className={`
                      ${gameMode === 'dual' && visualResponseMadeThisTrial ? 'bg-blue-800' : 'bg-blue-600'} 
                      hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px]
                    `}
                  >
                    <span className="w-5 h-5 bg-white/20 rounded flex items-center justify-center text-xs font-bold">
                      A
                    </span>
                    Position Match
                  </button>
                )}
                {(gameMode === 'single-audio' || gameMode === 'dual') && (
                  <button
                    onClick={() => handleResponse('audio')}
                    disabled={!isWaitingForResponse}
                    className={`
                      ${gameMode === 'dual' && audioResponseMadeThisTrial ? 'bg-blue-800' : 'bg-blue-600'} 
                      hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px]
                    `}
                  >
                    <span className="w-5 h-5 bg-white/20 rounded flex items-center justify-center text-xs font-bold">
                      L
                    </span>
                    Sound Match
                  </button>
                )}
              </div>

              {isWaitingForResponse && (
                <div className="text-center space-y-2">
                  <p className="text-gray-600 text-sm">
                    Press when current stimulus matches {nLevel} steps back
                  </p>
                  <p className="text-gray-500 text-xs">
                    Keyboard shortcuts:
                    {(gameMode === 'single-visual' || gameMode === 'dual') &&
                      ' A for Position Match'}
                    {gameMode === 'dual' && ' • '}
                    {(gameMode === 'single-audio' || gameMode === 'dual') && ' L for Sound Match'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'results') {
    // Practice mode should never reach results state - it should have been handled by endSession early return
    if (isPracticeMode) {
      return null
    }

    const sessions = JSON.parse(localStorage.getItem('nback-sessions') || '[]')
    const lastSession = sessions[sessions.length - 1]

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Session Complete!</h1>
            <p className="text-xl text-gray-600">Great work on your training session</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center shadow-lg">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">
                  {lastSession?.accuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Overall Accuracy</div>
              </CardContent>
            </Card>
            <Card className="text-center shadow-lg">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">
                  {lastSession?.averageResponseTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </CardContent>
            </Card>
            <Card className="text-center shadow-lg">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600">{lastSession?.nLevel}</div>
                <div className="text-sm text-gray-600">N-Level Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Performance Counts */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {(lastSession?.mode === 'single-visual' || lastSession?.mode === 'dual') && (
              <Card className="text-center shadow-lg">
                <CardHeader>
                  <CardTitle>Detailed Visual Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-1 text-sm text-left">
                  <p>
                    Actual Visual Matches:{' '}
                    <span className="font-semibold">
                      {lastSession.actualVisualMatches ?? 'N/A'}
                    </span>
                  </p>
                  <p>
                    Visual Hits (Correctly Pressed):{' '}
                    <span className="text-green-600 font-semibold">
                      {lastSession.visualHits ?? 'N/A'}
                    </span>
                  </p>
                  <p>
                    Visual Misses (Not Pressed for Match):{' '}
                    <span className="text-red-600 font-semibold">
                      {lastSession.visualMisses ?? 'N/A'}
                    </span>
                  </p>
                  <p>
                    Visual False Alarms (Pressed for Non-Match):{' '}
                    <span className="text-orange-600 font-semibold">
                      {lastSession.visualFalseAlarms ?? 'N/A'}
                    </span>
                  </p>
                  <p>
                    Visual Correct Rejections (Not Pressed for Non-Match):{' '}
                    <span className="font-semibold">
                      {lastSession.visualCorrectRejections ?? 'N/A'}
                    </span>
                  </p>
                </CardContent>
              </Card>
            )}

            {(lastSession?.mode === 'single-audio' || lastSession?.mode === 'dual') && (
              <Card className="text-center shadow-lg">
                <CardHeader>
                  <CardTitle>Detailed Audio Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-1 text-sm text-left">
                  <p>
                    Actual Audio Matches:{' '}
                    <span className="font-semibold">{lastSession.actualAudioMatches ?? 'N/A'}</span>
                  </p>
                  <p>
                    Audio Hits (Correctly Pressed):{' '}
                    <span className="text-green-600 font-semibold">
                      {lastSession.audioHits ?? 'N/A'}
                    </span>
                  </p>
                  <p>
                    Audio Misses (Not Pressed for Match):{' '}
                    <span className="text-red-600 font-semibold">
                      {lastSession.audioMisses ?? 'N/A'}
                    </span>
                  </p>
                  <p>
                    Audio False Alarms (Pressed for Non-Match):{' '}
                    <span className="text-orange-600 font-semibold">
                      {lastSession.audioFalseAlarms ?? 'N/A'}
                    </span>
                  </p>
                  <p>
                    Audio Correct Rejections (Not Pressed for Non-Match):{' '}
                    <span className="font-semibold">
                      {lastSession.audioCorrectRejections ?? 'N/A'}
                    </span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={resetGame} className="gap-2">
              <Play className="h-4 w-4" />
              Train Again
            </Button>
            <Button size="lg" variant="outline" onClick={onViewStats} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              View All Stats
            </Button>
            <Button size="lg" variant="outline" onClick={onBack}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default GameInterface
