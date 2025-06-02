import { useState, useCallback, useRef, useMemo } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export type GameMode = 'single-visual' | 'single-audio' | 'dual'
export type GameState = 'setup' | 'playing' | 'paused' | 'results'

export interface GameSession {
  trials: number
  nLevel: number
  accuracy: number
  visualAccuracy: number
  audioAccuracy: number
  averageResponseTime: number
  mode: GameMode
  timestamp: string
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

interface UseGameLogicProps {
  isPracticeMode?: boolean
  onPracticeComplete?: () => void
}

export const useGameLogic = ({
  isPracticeMode = false,
  onPracticeComplete: _onPracticeComplete,
}: UseGameLogicProps = {}) => {
  // Game state
  const [gameMode, setGameMode] = useState<GameMode>(
    isPracticeMode ? 'single-visual' : 'single-visual'
  )
  const [gameState, setGameState] = useState<GameState>('setup')
  const [nLevel, setNLevel] = useState<number>(isPracticeMode ? 1 : 2)
  const [currentTrial, setCurrentTrial] = useState(0)
  const [numTrials, setNumTrials] = useState<number>(isPracticeMode ? 7 : 20)

  // Game data
  const [visualSequence, setVisualSequence] = useState<number[]>([])
  const [audioSequence, setAudioSequence] = useState<string[]>([])
  const [visualMatches, setVisualMatches] = useState<boolean[]>([])
  const [audioMatches, setAudioMatches] = useState<boolean[]>([])
  const [userVisualResponses, setUserVisualResponses] = useState<boolean[]>([])
  const [userAudioResponses, setUserAudioResponses] = useState<boolean[]>([])
  const [responseTimes, setResponseTimes] = useState<number[]>([])

  // Current trial state
  const [currentPosition, setCurrentPosition] = useState<number | null>(null)
  const [currentLetter, setCurrentLetter] = useState('')
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [trialStartTime, setTrialStartTime] = useState(0)
  const [visualResponseMadeThisTrial, setVisualResponseMadeThisTrial] = useState(false)
  const [audioResponseMadeThisTrial, setAudioResponseMadeThisTrial] = useState(false)

  // Settings
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [stimulusDurationMs, setStimulusDurationMs] = useState(3000)

  // Refs
  const trialTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTrialRef = useRef<(() => void) | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Store
  const isAdaptiveDifficultyEnabled = useSettingsStore(
    (state: { isAdaptiveDifficultyEnabled: boolean }) => state.isAdaptiveDifficultyEnabled
  )

  // Constants
  const letters = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], [])

  const generateStimulus = useCallback(() => {
    const newPosition = Math.floor(Math.random() * 9)
    const newLetter = letters[Math.floor(Math.random() * letters.length)]

    setVisualSequence(prev => [...prev, newPosition])
    setAudioSequence(prev => [...prev, newLetter])

    const visualMatch =
      visualSequence.length >= nLevel &&
      visualSequence[visualSequence.length - nLevel] === newPosition
    const audioMatch =
      audioSequence.length >= nLevel && audioSequence[audioSequence.length - nLevel] === newLetter

    setVisualMatches(prev => [...prev, visualMatch])
    setAudioMatches(prev => [...prev, audioMatch])

    return { newPosition, newLetter, visualMatch, audioMatch }
  }, [visualSequence, audioSequence, nLevel, letters])

  const resetGame = useCallback(() => {
    setGameState('setup')
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

    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current)
      trialTimeoutRef.current = null
    }
  }, [numTrials])

  return {
    // State
    gameMode,
    setGameMode,
    gameState,
    setGameState,
    nLevel,
    setNLevel,
    currentTrial,
    setCurrentTrial,
    numTrials,
    setNumTrials,
    visualSequence,
    audioSequence,
    visualMatches,
    audioMatches,
    userVisualResponses,
    setUserVisualResponses,
    userAudioResponses,
    setUserAudioResponses,
    responseTimes,
    setResponseTimes,
    currentPosition,
    setCurrentPosition,
    currentLetter,
    setCurrentLetter,
    isWaitingForResponse,
    setIsWaitingForResponse,
    trialStartTime,
    setTrialStartTime,
    visualResponseMadeThisTrial,
    setVisualResponseMadeThisTrial,
    audioResponseMadeThisTrial,
    setAudioResponseMadeThisTrial,
    audioEnabled,
    setAudioEnabled,
    stimulusDurationMs,
    setStimulusDurationMs,

    // Refs
    trialTimeoutRef,
    startTrialRef,
    synthRef,

    // Computed
    isAdaptiveDifficultyEnabled,
    letters,

    // Actions
    generateStimulus,
    resetGame,
  }
}
