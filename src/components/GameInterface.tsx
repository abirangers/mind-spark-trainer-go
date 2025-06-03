import { useEffect } from 'react'
// Removed direct UI imports, they are now in sub-components
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Progress } from '@/components/ui/progress'
// import { ArrowLeft, Volume2, VolumeX, Play, Pause, BarChart3 } from 'lucide-react'
// import { AdaptiveDifficultyToggle } from '@/components/ui/AdaptiveDifficultyToggle'
import type { GameMode } from '@/types/game' // Only GameMode might be needed for keyboard listener
import { useNBackLogic } from '@/hooks/useNBackLogic'
import GameSetupScreen from './GameSetupScreen'
import GamePlayScreen from './GamePlayScreen'
import GameResultsScreen from './GameResultsScreen'

interface GameInterfaceProps {
  onBack: () => void
  onViewStats: () => void
  isPracticeMode?: boolean
  onPracticeComplete?: () => void
}

const GameInterface = ({
  onBack,
  onViewStats,
  isPracticeMode = false,
  onPracticeComplete,
}: GameInterfaceProps) => {
  const {
    gameState,
    gameMode,
    nLevel,
    currentTrial,
    numTrials,
    currentPosition,
    currentLetter,
    isWaitingForResponse,
    visualResponseMadeThisTrial,
    audioResponseMadeThisTrial,
    stimulusDurationMs,
    audioEnabled,

    setGameMode,
    setNLevel,
    setNumTrials,
    setStimulusDurationMs,
    setAudioEnabled,

    startGame,
    resetGame,
    handleResponse,
    getLastSession,
  } = useNBackLogic({
    isPracticeMode,
    onPracticeComplete,
    // Set initial values from props if they existed, e.g.
    // initialNLevel: props.initialNLevel (if GameInterfaceProps had it)
  })

  // Keyboard event listener remains here as it's global during the game's activity
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState === 'playing' && isWaitingForResponse) {
        if (
          event.key.toLowerCase() === 'a' &&
          (gameMode === 'single-visual' || gameMode === 'dual')
        ) {
          handleResponse('visual')
        } else if (
          event.key.toLowerCase() === 'l' &&
          (gameMode === 'single-audio' || gameMode === 'dual')
        ) {
          handleResponse('audio')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, isWaitingForResponse, gameMode, handleResponse])

  if (gameState === 'setup') {
    // The useNBackLogic hook handles auto-starting for practice mode.
    // If isPracticeMode is true, GameSetupScreen might not be shown, or shown briefly.
    // The hook will transition gameState to 'playing'.
    // If onPracticeComplete has run and gameState is reset to 'setup',
    // we should not show the setup screen for practice mode again.
    if (isPracticeMode) {
      return null // Or a loading indicator if preferred
    }
    return (
      <GameSetupScreen
        gameMode={gameMode}
        setGameMode={setGameMode}
        nLevel={nLevel}
        setNLevel={setNLevel}
        numTrials={numTrials}
        setNumTrials={setNumTrials}
        stimulusDurationMs={stimulusDurationMs}
        setStimulusDurationMs={setStimulusDurationMs}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        startGame={startGame}
        onBack={onBack}
        isPracticeMode={isPracticeMode} // Technically false here due to the outer if
      />
    )
  }

  if (gameState === 'playing') {
    return (
      <GamePlayScreen
        nLevel={nLevel}
        gameMode={gameMode}
        currentTrial={currentTrial}
        numTrials={numTrials}
        currentPosition={currentPosition}
        currentLetter={currentLetter}
        isWaitingForResponse={isWaitingForResponse}
        visualResponseMadeThisTrial={visualResponseMadeThisTrial}
        audioResponseMadeThisTrial={audioResponseMadeThisTrial}
        resetGame={resetGame}
        handleResponse={handleResponse}
      />
    )
  }

  if (gameState === 'results') {
     // The GameResultsScreen component handles the case for isPracticeMode internally,
     // although current logic in useNBackLogic means this screen is not typically shown for practice.
    return (
      <GameResultsScreen
        getLastSession={getLastSession}
        resetGame={resetGame}
        onViewStats={onViewStats}
        onBack={onBack}
        isPracticeMode={isPracticeMode} // Pass the original isPracticeMode
      />
    )
  }

  return null
}

export default GameInterface
