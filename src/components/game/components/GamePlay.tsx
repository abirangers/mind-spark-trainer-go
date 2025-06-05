import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Pause } from 'lucide-react'
import { GameMode } from '../types'
import { formatGameMode } from '../utils'
import { VisualGrid } from './VisualGrid'
import { AudioDisplay } from './AudioDisplay'
import { ResponseButtons } from './ResponseButtons'
import { GameInstructions } from './GameInstructions'

interface GamePlayProps {
  gameMode: GameMode
  nLevel: number
  currentTrial: number
  numTrials: number
  currentPosition: number | null
  currentLetter: string
  isWaitingForResponse: boolean
  visualResponseMadeThisTrial: boolean
  audioResponseMadeThisTrial: boolean
  onPause: () => void
  onResponse: (responseType: 'visual' | 'audio') => void
}

export const GamePlay: React.FC<GamePlayProps> = React.memo(({
  gameMode,
  nLevel,
  currentTrial,
  numTrials,
  currentPosition,
  currentLetter,
  isWaitingForResponse,
  visualResponseMadeThisTrial,
  audioResponseMadeThisTrial,
  onPause,
  onResponse,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onPause} className="gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Badge variant="secondary" className="px-3 py-1">
              {nLevel}-Back {formatGameMode(gameMode)}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Trial</div>
            <div className="text-2xl font-bold">
              {currentTrial + 1} / {numTrials}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress
            value={numTrials > 0 ? (currentTrial / numTrials) * 100 : 0}
            className="h-2"
          />
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-lg p-8 mb-8 shadow-lg">
          <div className="space-y-8">
            {/* Visual Grid */}
            {(gameMode === 'single-visual' || gameMode === 'dual') && (
              <VisualGrid currentPosition={currentPosition} />
            )}

            {/* Audio Display */}
            {(gameMode === 'single-audio' || gameMode === 'dual') && (
              <AudioDisplay currentLetter={currentLetter} />
            )}

            {/* Response Buttons */}
            <ResponseButtons
              gameMode={gameMode}
              isWaitingForResponse={isWaitingForResponse}
              visualResponseMadeThisTrial={visualResponseMadeThisTrial}
              audioResponseMadeThisTrial={audioResponseMadeThisTrial}
              onResponse={onResponse}
            />

            {/* Instructions */}
            <GameInstructions
              gameMode={gameMode}
              nLevel={nLevel}
              isWaitingForResponse={isWaitingForResponse}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
