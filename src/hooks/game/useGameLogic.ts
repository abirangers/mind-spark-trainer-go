import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/settingsStore";

export type GameMode = "single-visual" | "single-audio" | "dual";
export type GameState = "setup" | "playing" | "paused" | "results";

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

/**
 * Data required by endSession for calculating results.
 */
interface EndSessionResultsData {
  visualMatches: ReadonlyArray<boolean>;
  audioMatches: ReadonlyArray<boolean>;
  userVisualResponses: ReadonlyArray<boolean>;
  userAudioResponses: ReadonlyArray<boolean>;
  responseTimes: ReadonlyArray<number>;
}

/**
 * Props for the useGameLogic hook.
 */
interface GameLogicProps {
  initialGameMode?: GameMode;
  initialNLevel?: number;
  initialNumTrials?: number;
  isPracticeMode?: boolean;
  onPracticeComplete?: () => void;
  resetStimulusSequences: () => void; // Called by startGame
  // Removed: visualMatches, audioMatches, userVisualResponses, userAudioResponses, responseTimes, currentTrial
  // These are now passed directly to endSession or managed by other hooks.
}

const PRACTICE_MODE_CONST: GameMode = "single-visual";
const PRACTICE_N_LEVEL_CONST = 1;
const PRACTICE_NUM_TRIALS_CONST = 7;

/**
 * Custom hook to manage the core game logic, state transitions, and session outcomes.
 * It handles game setup parameters (N-level, mode, trials), starting/resetting the game,
 * ending a session, calculating results, and applying adaptive difficulty.
 *
 * @param {GameLogicProps} props - The properties to configure the game logic.
 * @returns An object containing game state, setters for game parameters, and control functions.
 */
export const useGameLogic = ({
  initialGameMode = "single-visual",
  initialNLevel = 2,
  initialNumTrials = 20,
  isPracticeMode = false,
  onPracticeComplete,
  resetStimulusSequences,
}: GameLogicProps) => {
  const [gameMode, setGameMode] = useState<GameMode>(
    isPracticeMode ? PRACTICE_MODE_CONST : initialGameMode
  );
  const [gameState, setGameState] = useState<GameState>("setup");
  const [nLevel, setNLevel] = useState<number>(
    isPracticeMode ? PRACTICE_N_LEVEL_CONST : initialNLevel
  );
  const [numTrials, setNumTrials] = useState<number>(
    isPracticeMode ? PRACTICE_NUM_TRIALS_CONST : initialNumTrials
  );

  const isAdaptiveDifficultyEnabled = useSettingsStore(
    (state) => state.isAdaptiveDifficultyEnabled
  );

  const endSession = useCallback(
    (resultsData: EndSessionResultsData) => {
      if (isPracticeMode) {
        toast.success("Practice Complete! Well done!", { duration: 3000 });
        if (onPracticeComplete) {
          onPracticeComplete();
        }
        setGameState("setup"); // Reset to setup after practice completion
        return;
      }

      setGameState("results");

      let visualCorrect = 0;
      let audioCorrect = 0;
      let actualVisualMatches = 0;
      let visualHits = 0;
      let visualMisses = 0;
      let visualFalseAlarms = 0;
      let visualCorrectRejections = 0;
      let actualAudioMatches = 0;
      let audioHits = 0;
      let audioMisses = 0;
      let audioFalseAlarms = 0;
      let audioCorrectRejections = 0;

      const currentNumTrials = numTrials;

      for (let i = 0; i < currentNumTrials; i++) {
        const visualExpected =
          resultsData.visualMatches[i] === undefined ? false : resultsData.visualMatches[i];
        const audioExpected =
          resultsData.audioMatches[i] === undefined ? false : resultsData.audioMatches[i];
        const visualResponse =
          resultsData.userVisualResponses[i] === undefined
            ? false
            : resultsData.userVisualResponses[i];
        const audioResponse =
          resultsData.userAudioResponses[i] === undefined
            ? false
            : resultsData.userAudioResponses[i];

        if (gameMode === "single-visual" || gameMode === "dual") {
          if (visualExpected) actualVisualMatches++;
          if (visualExpected && visualResponse) visualHits++;
          else if (visualExpected && !visualResponse) visualMisses++;
          else if (!visualExpected && visualResponse) visualFalseAlarms++;
          else if (!visualExpected && !visualResponse) visualCorrectRejections++;
        }
        if (gameMode === "single-audio" || gameMode === "dual") {
          if (audioExpected) actualAudioMatches++;
          if (audioExpected && audioResponse) audioHits++;
          else if (audioExpected && !audioResponse) audioMisses++;
          else if (!audioExpected && audioResponse) audioFalseAlarms++;
          else if (!audioExpected && !audioResponse) audioCorrectRejections++;
        }
        if (visualExpected === visualResponse) visualCorrect++;
        if (audioExpected === audioResponse) audioCorrect++;
      }

      const visualAccuracy = currentNumTrials > 0 ? (visualCorrect / currentNumTrials) * 100 : 0;
      const audioAccuracy = currentNumTrials > 0 ? (audioCorrect / currentNumTrials) * 100 : 0;

      let overallAccuracy = 0;
      if (gameMode === "dual") {
        overallAccuracy = (visualAccuracy + audioAccuracy) / 2;
      } else if (gameMode === "single-visual") {
        overallAccuracy = visualAccuracy;
      } else {
        overallAccuracy = audioAccuracy;
      }

      const avgResponseTime =
        resultsData.responseTimes.length > 0
          ? resultsData.responseTimes.reduce((a, b) => a + b, 0) / resultsData.responseTimes.length
          : 0;

      const session: GameSession = {
        trials: currentNumTrials,
        nLevel,
        accuracy: overallAccuracy,
        visualAccuracy,
        audioAccuracy,
        averageResponseTime: avgResponseTime || 0,
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
      };

      const sessions = JSON.parse(localStorage.getItem("nback-sessions") || "[]");
      sessions.push(session);
      localStorage.setItem("nback-sessions", JSON.stringify(sessions));
      toast.success(`Session Complete! ${overallAccuracy.toFixed(1)}% accuracy`);

      if (isAdaptiveDifficultyEnabled && !isPracticeMode) {
        let nextNLevel = nLevel;
        let adaptiveMessage = "";
        if (overallAccuracy >= 80 && nLevel < 8) {
          nextNLevel = nLevel + 1;
          adaptiveMessage = `Congratulations! N-Level increased to ${nextNLevel}!`;
        } else if (overallAccuracy < 60 && nLevel > 1) {
          nextNLevel = nLevel - 1;
          adaptiveMessage = `N-Level decreased to ${nextNLevel}. Keep practicing!`;
        } else if (overallAccuracy >= 80 && nLevel === 8) {
          adaptiveMessage = `You're at the max N-Level (${nLevel}) and performing excellently!`;
        } else if (overallAccuracy < 60 && nLevel === 1) {
          adaptiveMessage = `N-Level remains at ${nLevel}. Keep it up!`;
        } else {
          adaptiveMessage = `N-Level maintained at ${nLevel}. Good effort!`;
        }
        if (nextNLevel !== nLevel) setNLevel(nextNLevel);
        if (adaptiveMessage) toast(adaptiveMessage, { duration: 4000 });
      }
    },
    [
      isPracticeMode,
      onPracticeComplete,
      numTrials,
      nLevel,
      gameMode,
      isAdaptiveDifficultyEnabled,
      setNLevel,
      setGameState, // Removed resultsData arrays from deps
    ]
  );

  const startGame = useCallback(() => {
    setGameState("playing");
    resetStimulusSequences();
  }, [resetStimulusSequences, setGameState]);

  useEffect(() => {
    if (isPracticeMode && gameState === "setup") {
      startGame();
    }
  }, [isPracticeMode, gameState, startGame]);

  // Removed useEffect that auto-called endSession based on currentTrial prop.
  // endSession is now called by useTrialManagement via onAllTrialsComplete.

  const resetGame = useCallback(() => {
    setGameState("setup");
  }, [setGameState]);

  return {
    gameMode,
    setGameMode,
    gameState,
    setGameState,
    nLevel,
    setNLevel,
    numTrials,
    setNumTrials,
    startGame,
    resetGame,
    endSession, // Expose endSession
    PRACTICE_MODE: PRACTICE_MODE_CONST,
    PRACTICE_N_LEVEL: PRACTICE_N_LEVEL_CONST,
    PRACTICE_NUM_TRIALS: PRACTICE_NUM_TRIALS_CONST,
  };
};
