import { useState, useCallback } from 'react'
import { GameMode, GameState } from '../types'
import { PRACTICE_MODE, PRACTICE_N_LEVEL, PRACTICE_NUM_TRIALS } from '../constants'

interface UseGameStateProps {
  isPracticeMode?: boolean
}

interface GameStateData {
  gameMode: GameMode
  gameState: GameState
  nLevel: number
  numTrials: number
  stimulusDurationMs: number
  audioEnabled: boolean
  currentTrial: number
}

interface GameStateActions {
  setGameMode: (mode: GameMode) => void
  setGameState: (state: GameState) => void
  setNLevel: (level: number) => void
  setNumTrials: (trials: number) => void
  setStimulusDurationMs: (duration: number) => void
  setAudioEnabled: (enabled: boolean) => void
  setCurrentTrial: (trial: number | ((prev: number) => number)) => void
  resetGameState: () => void
}

export const useGameState = ({ isPracticeMode = false }: UseGameStateProps = {}) => {
  // Initialize state based on practice mode
  const [gameMode, setGameMode] = useState<GameMode>(
    isPracticeMode ? PRACTICE_MODE : 'single-visual'
  )
  const [gameState, setGameState] = useState<GameState>('setup')
  const [nLevel, setNLevel] = useState<number>(isPracticeMode ? PRACTICE_N_LEVEL : 2)
  const [numTrials, setNumTrials] = useState<number>(isPracticeMode ? PRACTICE_NUM_TRIALS : 20)
  const [stimulusDurationMs, setStimulusDurationMs] = useState(3000)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [currentTrial, setCurrentTrial] = useState(0)

  const resetGameState = useCallback(() => {
    setGameState('setup')
    setCurrentTrial(0)
  }, [])

  const gameStateData: GameStateData = {
    gameMode,
    gameState,
    nLevel,
    numTrials,
    stimulusDurationMs,
    audioEnabled,
    currentTrial,
  }

  const gameStateActions: GameStateActions = {
    setGameMode,
    setGameState,
    setNLevel,
    setNumTrials,
    setStimulusDurationMs,
    setAudioEnabled,
    setCurrentTrial,
    resetGameState,
  }

  return {
    ...gameStateData,
    ...gameStateActions,
  }
}
