import React from 'react'
import { GameMode } from '../types'

interface GameInstructionsProps {
  gameMode: GameMode
  nLevel: number
  isWaitingForResponse: boolean
}

export const GameInstructions: React.FC<GameInstructionsProps> = ({
  gameMode,
  nLevel,
  isWaitingForResponse,
}) => {
  if (!isWaitingForResponse) {
    return null
  }

  return (
    <div className="text-center space-y-2">
      <p className="text-gray-600 text-sm">
        Press when current stimulus matches {nLevel} steps back
      </p>
      <p className="text-gray-500 text-xs">
        Keyboard shortcuts:
        {(gameMode === 'single-visual' || gameMode === 'dual') &&
          ' A for Position Match'}
        {gameMode === 'dual' && ' • '}
        {(gameMode === 'single-audio' || gameMode === 'dual') && ' L for Sound Match'}
      </p>
    </div>
  )
}
