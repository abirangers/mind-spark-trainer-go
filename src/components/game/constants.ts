import { GameMode } from './types'

// Practice mode constants
export const PRACTICE_MODE: GameMode = 'single-visual'
export const PRACTICE_N_LEVEL = 1 // 1-Back for practice
export const PRACTICE_NUM_TRIALS = 7 // Short session

// Game configuration constants
export const MIN_N_LEVEL = 1
export const MAX_N_LEVEL = 8
export const MIN_TRIALS = 10
export const MAX_TRIALS = 50
export const MIN_STIMULUS_DURATION = 2000
export const MAX_STIMULUS_DURATION = 4000
export const STIMULUS_DURATION_STEP = 500

// Audio letters for the game
export const AUDIO_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// Visual grid configuration
export const VISUAL_GRID_SIZE = 9 // 3x3 grid

// Timing constants
export const INTER_TRIAL_INTERVAL = 1000 // 1 second between trials
export const DUAL_RESPONSE_DELAY = 750 // Delay before advancing in dual mode after both responses

// Local storage keys
export const SESSIONS_STORAGE_KEY = 'nback-sessions'
