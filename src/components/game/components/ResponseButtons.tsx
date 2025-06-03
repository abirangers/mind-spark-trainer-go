import React from 'react'
import { GameMode } from '../types'

interface ResponseButtonsProps {
  gameMode: GameMode
  isWaitingForResponse: boolean
  visualResponseMadeThisTrial: boolean
  audioResponseMadeThisTrial: boolean
  onResponse: (responseType: 'visual' | 'audio') => void
}

export const ResponseButtons: React.FC<ResponseButtonsProps> = ({
  gameMode,
  isWaitingForResponse,
  visualResponseMadeThisTrial,
  audioResponseMadeThisTrial,
  onResponse,
}) => {
  return (
    <div className="flex gap-4 justify-center pt-8">
      {(gameMode === 'single-visual' || gameMode === 'dual') && (
        <button
          onClick={() => onResponse('visual')}
          disabled={!isWaitingForResponse}
          className={`
            ${gameMode === 'dual' && visualResponseMadeThisTrial ? 'bg-blue-800' : 'bg-blue-600'} 
            hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px]
          `}
        >
          <span className="w-5 h-5 bg-white/20 rounded flex items-center justify-center text-xs font-bold">
            A
          </span>
          Position Match
        </button>
      )}
      {(gameMode === 'single-audio' || gameMode === 'dual') && (
        <button
          onClick={() => onResponse('audio')}
          disabled={!isWaitingForResponse}
          className={`
            ${gameMode === 'dual' && audioResponseMadeThisTrial ? 'bg-blue-800' : 'bg-blue-600'} 
            hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px]
          `}
        >
          <span className="w-5 h-5 bg-white/20 rounded flex items-center justify-center text-xs font-bold">
            L
          </span>
          Sound Match
        </button>
      )}
    </div>
  )
}
