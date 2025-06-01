import type { GameMode, GameState, GameSession } from "@/hooks/game/useGameLogic";
import type { EndSessionResultsData as GameLogicEndSessionResultsData } from "@/hooks/game/useGameLogic"; // Renaming to avoid conflict
import type { EndSessionResultsData as TrialManagementEndSessionResultsData } from "@/hooks/game/useTrialManagement"; // Renaming to avoid conflict

export interface UseGameLogicReturn {
  gameMode: GameMode;
  setGameMode: React.Dispatch<React.SetStateAction<GameMode>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  nLevel: number;
  setNLevel: React.Dispatch<React.SetStateAction<number>>;
  numTrials: number;
  setNumTrials: React.Dispatch<React.SetStateAction<number>>;
  startGame: () => void;
  resetGame: () => void;
  endSession: (resultsData: GameLogicEndSessionResultsData) => void;
  PRACTICE_MODE: GameMode;
  PRACTICE_N_LEVEL: number;
  PRACTICE_NUM_TRIALS: number;
}

export interface UseStimulusGenerationReturn {
  visualSequence: number[];
  audioSequence: string[];
  visualMatches: boolean[];
  audioMatches: boolean[];
  generateStimulus: () => {
    newPosition: number;
    newLetter: string;
    visualMatch: boolean;
    audioMatch: boolean;
  };
  playAudioLetter: (letter: string) => void;
  resetStimulusSequences: () => void;
  cancelCurrentSpeech: () => void;
}

export interface UseTrialManagementReturn {
  currentTrial: number;
  stimulusDurationMs: number;
  setStimulusDurationMs: React.Dispatch<React.SetStateAction<number>>;
  currentPosition: number | null;
  currentLetter: string;
  isWaitingForResponse: boolean;
  userVisualResponses: boolean[];
  userAudioResponses: boolean[];
  responseTimes: number[];
  handleResponse: (responseType: "visual" | "audio") => void;
  initiateFirstTrial: () => void;
  resetTrialStates: () => void;
  visualResponseMadeThisTrial: boolean;
  audioResponseMadeThisTrial: boolean;
}

// It seems EndSessionResultsData is identical in both hooks that use it.
// If they diverge, we might need to handle that, but for now, one definition can serve.
// We've imported them separately and can use them as such if needed.
export type { GameLogicEndSessionResultsData, TrialManagementEndSessionResultsData };
export type { GameMode, GameState, GameSession };
