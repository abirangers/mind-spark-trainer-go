import { useState, useEffect, useCallback } from "react"; // Added useCallback
// Imports for Button, toast, useSettingsStore are fine from user's provided code
// Assuming lucide-react icons are still needed by the direct JSX in this file (e.g. for setup screen buttons if not fully passed to subcomp)
// UI components used directly in GameInterface's JSX for screens
// These will be removed if the sub-components fully encapsulate them.
// For now, assuming they might be used by GameInterface if the render logic isn't fully replaced by subcomponents yet.
// However, the goal is to use subcomponents, so these direct UI imports should ideally be gone from GameInterface.
// The provided content will determine if they are still needed.
// Based on the new render logic using subcomponents, these direct imports for Card, Badge, Progress, AdaptiveDifficultyToggle
// are likely NO LONGER NEEDED here. I will remove them based on the new JSX structure.

import { useStimulusGeneration } from "@/hooks/game/useStimulusGeneration";
import { useGameLogic, GameMode, GameSession } from "@/hooks/game/useGameLogic"; // Assuming types are exported
import { useTrialManagement } from "@/hooks/game/useTrialManagement";

// Screen sub-components
import { GameSetupScreen } from "./game/GameSetupScreen";
import { PlayingScreen } from "./game/PlayingScreen";
import { ResultsScreen } from "./game/ResultsScreen";

/**
 * Props for the GameInterface component.
 */
export interface GameInterfaceProps {
  // Exporting for potential external use or testing
  onBack: () => void;
  onViewStats: () => void;
  isPracticeMode?: boolean;
  onPracticeComplete?: () => void;
}

const PRACTICE_MODE_CONST = "single-visual" as GameMode;
const PRACTICE_N_LEVEL_CONST = 1;
const PRACTICE_NUM_TRIALS_CONST = 7;

/**
 * Main component orchestrating the N-Back game.
 * It manages game state transitions and renders different screens (Setup, Playing, Results)
 * based on the current state, utilizing custom hooks for logic and state management.
 *
 * @param {GameInterfaceProps} props - Properties to configure the game interface.
 * @returns {JSX.Element | null} The rendered game screen or null.
 */
const GameInterface: React.FC<GameInterfaceProps> = ({
  onBack,
  onViewStats,
  isPracticeMode = false,
  onPracticeComplete,
}) => {
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Hook Instantiation Order:
  const gameLogic = useGameLogic({
    initialGameMode: isPracticeMode ? PRACTICE_MODE_CONST : "single-visual",
    initialNLevel: isPracticeMode ? PRACTICE_N_LEVEL_CONST : 2,
    initialNumTrials: isPracticeMode ? PRACTICE_NUM_TRIALS_CONST : 20,
    isPracticeMode,
    onPracticeComplete,
  });

  const stimulusG = useStimulusGeneration({
    nLevel: gameLogic.nLevel,
    audioEnabled,
  });

  const trialM = useTrialManagement({
    nLevel: gameLogic.nLevel,
    numTrials: gameLogic.numTrials,
    gameMode: gameLogic.gameMode,
    stimulusDurationMsInitial: 3000,
    isPracticeMode,
    visualMatches: stimulusG.visualMatches,
    audioMatches: stimulusG.audioMatches,
    generateStimulus: stimulusG.generateStimulus,
    playAudioLetter: stimulusG.playAudioLetter,
    onAllTrialsComplete: (resultsData) => {
      gameLogic.endSession(resultsData);
    },
  });

  // Destructure for easier use AFTER all hooks are initialized
  const {
    gameMode,
    setGameMode,
    gameState,
    nLevel,
    setNLevel,
    numTrials,
    setNumTrials,
    startGame,
    resetGame,
  } = gameLogic;

  const { resetStimulusSequences, cancelCurrentSpeech } = stimulusG;

  const {
    currentTrial,
    stimulusDurationMs,
    setStimulusDurationMs,
    currentPosition,
    currentLetter,
    isWaitingForResponse,
    handleResponse,
    initiateFirstTrial,
    resetTrialStates,
    visualResponseMadeThisTrial,
    audioResponseMadeThisTrial,
  } = trialM;

  // Effect to bridge startGame from useGameLogic to actual trial initiation
  useEffect(() => {
    if (gameState === "playing") {
      resetStimulusSequences();
      initiateFirstTrial();
    }
  }, [gameState, initiateFirstTrial, resetStimulusSequences]); // Dependencies on functions from hooks

  const handleResetGame = useCallback(() => {
    resetGame();
    resetTrialStates(); // from trialM
    if (audioEnabled) {
      cancelCurrentSpeech();
    }
  }, [resetGame, resetTrialStates, audioEnabled, cancelCurrentSpeech]);

  // Keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState === "playing" && isWaitingForResponse) {
        if (
          event.key.toLowerCase() === "a" &&
          (gameMode === "single-visual" || gameMode === "dual")
        ) {
          handleResponse("visual");
        } else if (
          event.key.toLowerCase() === "l" &&
          (gameMode === "single-audio" || gameMode === "dual")
        ) {
          handleResponse("audio");
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, isWaitingForResponse, gameMode, handleResponse]);

  // ---- Render Logic using Sub-components ----
  const setupScreenProps = {
    onBack,
    gameMode,
    setGameMode,
    nLevel,
    setNLevel,
    numTrials,
    setNumTrials,
    stimulusDurationMs,
    setStimulusDurationMs,
    audioEnabled,
    setAudioEnabled,
    onStartGame: startGame,
    isPracticeMode,
  };

  const playingScreenProps = {
    onPauseGame: handleResetGame,
    nLevel,
    gameMode,
    currentTrial,
    numTrials,
    currentPosition,
    currentLetter,
    isWaitingForResponse,
    onRespond: handleResponse,
    visualResponseMadeThisTrial,
    audioResponseMadeThisTrial,
  };

  let lastSessionData: GameSession | null = null;
  if (gameState === "results") {
    const sessionsString =
      typeof window !== "undefined" ? localStorage.getItem("nback-sessions") : "[]";
    try {
      const sessions = JSON.parse(sessionsString || "[]") as GameSession[];
      if (sessions.length > 0) {
        lastSessionData = sessions[sessions.length - 1];
      }
    } catch (e) {
      console.error("Error reading/parsing sessions from localStorage for ResultsScreen:", e);
    }
  }

  const resultsScreenProps = {
    lastSession: lastSessionData,
    onBackToHome: onBack,
    onViewStats,
    onTrainAgain: handleResetGame,
  };

  if (gameState === "setup") {
    if (isPracticeMode) {
      return null;
    }
    return <GameSetupScreen {...setupScreenProps} />;
  }

  if (gameState === "playing") {
    return <PlayingScreen {...playingScreenProps} />;
  }

  if (gameState === "results") {
    return <ResultsScreen {...resultsScreenProps} />;
  }

  return null;
};

export default GameInterface;
