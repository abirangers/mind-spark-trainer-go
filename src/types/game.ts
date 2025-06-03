export type GameMode = 'single-visual' | 'single-audio' | 'dual';

export type GameState = 'setup' | 'playing' | 'paused' | 'results';

export interface GameSession {
  trials: number;
  nLevel: number;
  accuracy: number;
  visualAccuracy: number;
  audioAccuracy: number;
  averageResponseTime: number;
  mode: GameMode;
  timestamp: string;

  // New detailed counts (optional for backward compatibility with old data)
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
