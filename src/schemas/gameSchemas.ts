import { z } from 'zod'

// Game mode validation
export const GameModeSchema = z.enum(['single-visual', 'single-audio', 'dual'])

// Game state validation
export const GameStateSchema = z.enum(['setup', 'playing', 'paused', 'results'])

// Game session validation
export const GameSessionSchema = z.object({
  trials: z.number().min(1).max(100),
  nLevel: z.number().min(1).max(10),
  accuracy: z.number().min(0).max(100),
  visualAccuracy: z.number().min(0).max(100),
  audioAccuracy: z.number().min(0).max(100),
  averageResponseTime: z.number().min(0),
  mode: GameModeSchema,
  timestamp: z.string().datetime(),
  actualVisualMatches: z.number().min(0).optional(),
  visualHits: z.number().min(0).optional(),
  visualMisses: z.number().min(0).optional(),
  visualFalseAlarms: z.number().min(0).optional(),
  visualCorrectRejections: z.number().min(0).optional(),
  actualAudioMatches: z.number().min(0).optional(),
  audioHits: z.number().min(0).optional(),
  audioMisses: z.number().min(0).optional(),
  audioFalseAlarms: z.number().min(0).optional(),
  audioCorrectRejections: z.number().min(0).optional(),
})

// Game settings validation
export const GameSettingsSchema = z.object({
  nLevel: z.number().min(1).max(10),
  numTrials: z.number().min(5).max(100),
  gameMode: GameModeSchema,
  audioEnabled: z.boolean(),
  stimulusDurationMs: z.number().min(500).max(10000),
})

// User response validation
export const UserResponseSchema = z.object({
  trial: z.number().min(0),
  visualResponse: z.boolean(),
  audioResponse: z.boolean(),
  responseTime: z.number().min(0),
  timestamp: z.string().datetime(),
})

// Settings store validation
export const SettingsStoreSchema = z.object({
  isHighContrastMode: z.boolean(),
  fontSize: z.enum(['default', 'large', 'xlarge']),
})

// Local storage data validation
export const LocalStorageDataSchema = z.object({
  'nback-sessions': z.array(GameSessionSchema).optional(),
  'app-settings': z.object({
    state: SettingsStoreSchema,
    version: z.number().optional(),
  }).optional(),
  'tutorialCompleted': z.enum(['true', 'false']).optional(),
})

// Validation helper functions
export const validateGameSession = (data: unknown) => {
  try {
    return GameSessionSchema.parse(data)
  } catch (error) {
    console.error('Invalid game session data:', error)
    throw new Error('Invalid game session data')
  }
}

export const validateGameSettings = (data: unknown) => {
  try {
    return GameSettingsSchema.parse(data)
  } catch (error) {
    console.error('Invalid game settings:', error)
    throw new Error('Invalid game settings')
  }
}

export const validateLocalStorageData = (key: string, data: unknown) => {
  try {
    switch (key) {
      case 'nback-sessions':
        return z.array(GameSessionSchema).parse(data)
      case 'app-settings':
        return z.object({
          state: SettingsStoreSchema,
          version: z.number().optional(),
        }).parse(data)
      case 'tutorialCompleted':
        return z.enum(['true', 'false']).parse(data)
      default:
        return data
    }
  } catch (error) {
    console.error(`Invalid localStorage data for key ${key}:`, error)
    return null
  }
}

// Type exports
export type GameMode = z.infer<typeof GameModeSchema>
export type GameState = z.infer<typeof GameStateSchema>
export type GameSession = z.infer<typeof GameSessionSchema>
export type GameSettings = z.infer<typeof GameSettingsSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
export type SettingsStore = z.infer<typeof SettingsStoreSchema>
