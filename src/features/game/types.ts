// src/features/game/types.ts
export type GameMode = 'single-visual' | 'single-audio' | 'dual';
export type GameState = 'setup' | 'playing' | 'paused' | 'results'; // 'paused' is handled by currentGameState, not a separate screen

export interface GameSession {
  trials: number;
  nLevel: number;
  accuracy: number;
  visualAccuracy: number;
  audioAccuracy: number;
  averageResponseTime: number;
  mode: GameMode;
  timestamp: string;

  actualVisualMatches?: number;
  visualHits?: number;
  visualMisses?: number;
  visualFalseAlarms?: number;
  visualCorrectRejections?: number;

  actualAudioMatches?: number;
  audioHits?: number;
  audioMisses?: number;
  audioFalseAlarms?: number;
  audioCorrectRejections?: number;
}

export type StimulusType = {
  id: string;
  value: string;
  type: 'audio' | 'visual' | 'word';
  played?: boolean;
  displayed?: boolean;
};
