import { GameMode, GameSession, GameStats } from './types'
import { SESSIONS_STORAGE_KEY } from './constants'

/**
 * Calculate detailed performance statistics for a game session
 */
export const calculatePerformanceStats = (
  gameMode: GameMode,
  numTrials: number,
  visualMatches: boolean[],
  audioMatches: boolean[],
  userVisualResponses: boolean[],
  userAudioResponses: boolean[]
): GameStats => {
  let visualCorrect = 0
  let audioCorrect = 0

  // Initialize counters
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

    // Visual performance calculations
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

    // Audio performance calculations
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

    // Overall accuracy calculations
    if (visualExpected === visualResponse) {
      visualCorrect++
    }
    if (audioExpected === audioResponse) {
      audioCorrect++
    }
  }

  return {
    visualCorrect,
    audioCorrect,
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
}

/**
 * Calculate accuracy percentages from performance stats
 */
export const calculateAccuracies = (
  gameMode: GameMode,
  numTrials: number,
  stats: GameStats
) => {
  const visualAccuracy = numTrials > 0 ? (stats.visualCorrect / numTrials) * 100 : 0
  const audioAccuracy = numTrials > 0 ? (stats.audioCorrect / numTrials) * 100 : 0
  
  const overallAccuracy =
    gameMode === 'dual'
      ? (visualAccuracy + audioAccuracy) / 2
      : gameMode === 'single-visual'
        ? visualAccuracy
        : audioAccuracy

  return { visualAccuracy, audioAccuracy, overallAccuracy }
}

/**
 * Save a game session to localStorage
 */
export const saveGameSession = (session: GameSession): void => {
  try {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]')
    sessions.push(session)
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  } catch (error) {
    console.error('Failed to save game session:', error)
  }
}

/**
 * Get all game sessions from localStorage
 */
export const getGameSessions = (): GameSession[] => {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || '[]')
  } catch (error) {
    console.error('Failed to load game sessions:', error)
    return []
  }
}

/**
 * Generate a random position for the visual grid (0-8)
 */
export const generateRandomPosition = (): number => {
  return Math.floor(Math.random() * 9)
}

/**
 * Generate a random letter from the audio letters array
 */
export const generateRandomLetter = (letters: string[]): string => {
  return letters[Math.floor(Math.random() * letters.length)]
}

/**
 * Check if current stimulus matches N steps back
 */
export const checkMatch = <T>(sequence: T[], nLevel: number, currentValue: T): boolean => {
  return sequence.length >= nLevel && sequence[sequence.length - nLevel] === currentValue
}

/**
 * Format game mode for display
 */
export const formatGameMode = (mode: GameMode): string => {
  return mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Calculate estimated session duration in minutes
 */
export const calculateSessionDuration = (numTrials: number, stimulusDurationMs: number): number => {
  return Math.ceil((numTrials * (stimulusDurationMs / 1000 + 1)) / 60)
}
