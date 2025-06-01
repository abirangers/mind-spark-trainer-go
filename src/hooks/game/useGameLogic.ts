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
 * Props for the useGameLogic hook.
 */
interface GameLogicProps {
  initialGameMode?: GameMode;
  initialNLevel?: number;
  initialNumTrials?: number;
  isPracticeMode?: boolean;
  onPracticeComplete?: () => void;
  visualMatches: ReadonlyArray<boolean>;
  audioMatches: ReadonlyArray<boolean>;
  userVisualResponses: ReadonlyArray<boolean>;
  userAudioResponses: ReadonlyArray<boolean>;
  responseTimes: ReadonlyArray<number>;
  resetStimulusSequences: () => void;
  // executeTrial: () => void; // This will be called by GameInterface after hook signals readiness or via useEffect
  currentTrial: number;
  // setCurrentTrial: (updater: number | ((prev: number) => number)) => void; // Not needed if currentTrial is just for monitoring
}

const PRACTICE_MODE_CONST: GameMode = "single-visual"; // Renamed to avoid conflict if exported
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
  visualMatches,
  audioMatches,
  userVisualResponses,
  userAudioResponses,
  responseTimes,
  resetStimulusSequences,
  currentTrial,
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

  const endSession = useCallback(() => {
    if (isPracticeMode) {
      toast.success("Practice Complete! Well done!", { duration: 3000 });
      if (onPracticeComplete) {
        onPracticeComplete();
      }
      // setGameState("setup"); // Or some other terminal state for practice
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

    // Ensure arrays have the expected length (numTrials)
    const currentNumTrials = numTrials; // Use a snapshot of numTrials for this calculation

    for (let i = 0; i < currentNumTrials; i++) {
      const visualExpected = visualMatches[i] === undefined ? false : visualMatches[i];
      const audioExpected = audioMatches[i] === undefined ? false : audioMatches[i];
      const visualResponse = userVisualResponses[i] === undefined ? false : userVisualResponses[i];
      const audioResponse = userAudioResponses[i] === undefined ? false : userAudioResponses[i];

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
      // This calculation of visualCorrect/audioCorrect might be slightly different from detailed hits.
      // The original GameInterface used this:
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
      // single-audio
      overallAccuracy = audioAccuracy;
    }

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const session: GameSession = {
      trials: currentNumTrials,
      nLevel,
      accuracy: overallAccuracy,
      visualAccuracy,
      audioAccuracy,
      averageResponseTime: avgResponseTime || 0, // Ensure not NaN
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
  }, [
    isPracticeMode,
    onPracticeComplete,
    numTrials,
    nLevel,
    gameMode,
    visualMatches,
    audioMatches,
    userVisualResponses,
    userAudioResponses,
    responseTimes,
    isAdaptiveDifficultyEnabled,
    setNLevel, // toast is problematic as a dep
  ]);

  const startGame = useCallback(() => {
    setGameState("playing");
    resetStimulusSequences();
    // The actual first trial is triggered by GameInterface's useEffect watching gameState === 'playing'
    // and then calling the startTrial function (which will become part of useTrialManagement)
  }, [resetStimulusSequences, setGameState]);

  useEffect(() => {
    if (isPracticeMode && gameState === "setup") {
      startGame();
    }
  }, [isPracticeMode, gameState, startGame]);

  useEffect(() => {
    if (gameState === "playing" && currentTrial === numTrials && numTrials > 0) {
      // ensure numTrials > 0
      endSession();
    }
  }, [gameState, currentTrial, numTrials, endSession]);

  const resetGame = useCallback(() => {
    setGameState("setup");
    // Other resets (trial timeouts, audio cancellation) are handled by their respective hooks/GameInterface.
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
    // endSession, // Not typically exposed directly, triggered by trial completion.
    PRACTICE_MODE: PRACTICE_MODE_CONST,
    PRACTICE_N_LEVEL: PRACTICE_N_LEVEL_CONST,
    PRACTICE_NUM_TRIALS: PRACTICE_NUM_TRIALS_CONST,
  };
};
