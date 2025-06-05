import { useEffect, useCallback } from 'react'
// No toast import here, handled by the hook
import {
  GameInterfaceProps,
  // GameMode, // Handled by hook type
  // GameState, // Handled by hook type
  // GameSession, // Handled by hook type
  // PRACTICE_MODE, // Used by hook
  // PRACTICE_N_LEVEL, // Used by hook
  // PRACTICE_NUM_TRIALS, // Used by hook
  // AUDIO_LETTERS, // Used by hook
  // useAudioSynthesis, // Used by hook
  GameSetup,
  GamePlay,
  GameResults,
} from './game'
import { useNBackGame, UseNBackGameProps } from '../hooks/useNBackGame' // Adjusted path

// Internal interfaces like PerformanceStats and StimulusData are no longer needed here
// Their concerns are handled by gameUtils.ts and the hook itself.

/**
 * @component GameInterface
 * @description This component serves as the main interface for the N-Back game.
 * It orchestrates the game flow by utilizing the `useNBackGame` hook for game logic
 * and state management. It's responsible for rendering the correct sub-component
 * (`GameSetup`, `GamePlay`, or `GameResults`) based on the current game state.
 *
 * @param {GameInterfaceProps} props - Properties passed to the GameInterface component.
 * @param {() => void} props.onBack - Callback function to navigate back from the game interface.
 * @param {() => void} props.onViewStats - Callback function to navigate to the statistics view.
 * @param {boolean} [props.isPracticeMode=false] - Flag indicating if the game is in practice mode.
 * @param {() => void} [props.onPracticeComplete] - Callback function triggered when practice mode is completed.
 * @returns {JSX.Element | null} The rendered game interface or null.
 */
const GameInterface = ({
  onBack,
  onViewStats,
  isPracticeMode = false,
  onPracticeComplete,
}: GameInterfaceProps) => {
  const hookProps: UseNBackGameProps = {
    isPracticeMode,
    // Pass onPracticeComplete from GameInterfaceProps to the hook
    // The hook will call this, and GameInterface can decide what to do.
    onPracticeComplete: () => {
      if (onPracticeComplete) {
        onPracticeComplete() // Call the original callback if provided
      }
      // After practice, GameInterface might want to reset or navigate.
      // For now, we assume onPracticeComplete handles navigation or
      // the parent component does. If we want to go to 'setup' or 'results':
      // game.resetGame(); // or game.endSessionForResults();
    },
    // initial settings can be passed here if needed, otherwise hook uses defaults
    // initialGameMode: 'single-visual',
    // initialNLevel: 2,
    // initialNumTrials: 20,
    // initialStimulusDurationMs: 3000,
    // initialAudioEnabled: true,
  }
  const game = useNBackGame(hookProps)

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (game.gameState === 'playing' && game.isWaitingForResponse) {
        if (
          event.key.toLowerCase() === 'a' &&
          (game.gameMode === 'single-visual' || game.gameMode === 'dual')
        ) {
          game.handleResponse('visual')
        } else if (
          event.key.toLowerCase() === 'l' &&
          (game.gameMode === 'single-audio' || game.gameMode === 'dual')
        ) {
          game.handleResponse('audio')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [game.gameState, game.isWaitingForResponse, game.gameMode, game.handleResponse])


  // This callback is passed to the hook.
  // When the hook calls it, this function in GameInterface runs.
  // GameInterface can then decide further actions, like navigating away or resetting.
  const handlePracticeHasCompleted = useCallback(() => {
    if (onPracticeComplete) {
      onPracticeComplete();
    }
    // Example: Automatically reset to setup screen after practice.
    // Or, you could navigate to a different screen or show a summary.
    // game.resetGame(); // This would take user back to setup screen.
    // Or if there's a specific "practice results" or next step:
    // game.endSessionForResults(); // if practice should show a results screen
  }, [onPracticeComplete /*, game.resetGame, game.endSessionForResults */]);

  // Update hook props if isPracticeMode or onPracticeComplete changes
  // This is tricky because the hook takes initial props.
  // For a prop like `isPracticeMode` that dictates initial setup,
  // changing it after the hook is initialized might require resetting the hook or
  // specific logic within the hook to handle it. The current hook's useEffect for
  // isPracticeModeRef.current = isPracticeMode; helps.
  // The onPracticeComplete callback is wrapped when passed to the hook.

  if (game.gameState === 'setup') {
    // In practice mode, the hook auto-starts. GameInterface shouldn't render GameSetup.
    // The hook's `useEffect` for practice mode handles `startGameHook`.
    // So, if it's practice mode and setup, it implies it's about to auto-start or has just been reset.
    if (isPracticeMode) {
      // Potentially show a loading indicator or null while practice auto-starts
      return null // Or a <PracticeStartingScreen />
    }
    return (
      <GameSetup
        gameMode={game.gameMode}
        setGameMode={game.setGameMode}
        nLevel={game.nLevel}
        setNLevel={game.setNLevel}
        numTrials={game.numTrials}
        setNumTrials={game.setNumTrials}
        stimulusDurationMs={game.stimulusDurationMs}
        setStimulusDurationMs={game.setStimulusDurationMs}
        audioEnabled={game.audioEnabled}
        setAudioEnabled={game.setAudioEnabled}
        isPracticeMode={isPracticeMode} // Pass the original prop
        onBack={onBack} // Prop from parent
        onStartGame={game.startGame} // Action from hook
      />
    )
  }

  if (game.gameState === 'playing') {
    return (
      <GamePlay
        gameMode={game.gameMode}
        nLevel={game.nLevel}
        currentTrial={game.currentTrial}
        numTrials={game.numTrials}
        currentPosition={game.currentPosition}
        currentLetter={game.currentLetter}
        isWaitingForResponse={game.isWaitingForResponse}
        visualResponseMadeThisTrial={game.visualResponseMadeThisTrial}
        audioResponseMadeThisTrial={game.audioResponseMadeThisTrial}
        onPause={game.resetGame} // Or a specific pause handler if developed in hook
        onResponse={game.handleResponse}
      />
    )
  }

  if (game.gameState === 'results') {
    // The hook handles practice mode completion before reaching 'results'.
    // So, no need for an `isPracticeMode` check here for rendering GameResults.
    // if (isPracticeMode) return null; // This should not be hit if hook logic is correct

    return (
      <GameResults
        onPlayAgain={game.resetGame} // Action from hook
        onViewStats={onViewStats} // Prop from parent
        onBack={onBack} // Prop from parent
        performanceStats={game.performanceStats} // Pass stats to GameResults
      />
    )
  }

  return null // Should not be reached if gameState is always one of the above
}

export default GameInterface
