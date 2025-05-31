import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Pause } from "lucide-react";
import { GameMode } from '../types'; // Assuming GameMode will be moved to types

export interface GamePlayingScreenProps {
  onPause: () => void;
  nLevel: number;
  gameMode: GameMode;
  currentTrial: number;
  numTrials: number;
  currentPosition: number | null;
  currentLetter: string;
  isWaitingForResponse: boolean;
  visualResponseMadeThisTrial: boolean;
  audioResponseMadeThisTrial: boolean;
  onVisualResponse: () => void;
  onAudioResponse: () => void;
}

const GamePlayingScreen = ({
  onPause,
  nLevel,
  gameMode,
  currentTrial,
  numTrials,
  currentPosition,
  currentLetter,
  isWaitingForResponse,
  visualResponseMadeThisTrial,
  audioResponseMadeThisTrial,
  onVisualResponse,
  onAudioResponse,
}: GamePlayingScreenProps) => {
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
              {nLevel}-Back {gameMode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Trial</div>
            <div className="text-2xl font-bold">{currentTrial + 1} / {numTrials}</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={(numTrials > 0 ? (currentTrial / numTrials) * 100 : 0)} className="h-2" />
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-lg p-8 mb-8 shadow-lg">
          <div className="space-y-8">
            {/* Visual Grid */}
            {(gameMode === 'single-visual' || gameMode === 'dual') && (
              <div className="text-center">
                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                  {[...Array(9)].map((_, index) => (
                    <div
                      key={index}
                      className={`w-20 h-20 border-2 rounded-lg transition-all duration-200 ${
                        currentPosition === index
                          ? 'bg-blue-500 border-blue-400 shadow-lg'
                          : 'bg-gray-100 border-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Audio Display */}
            {(gameMode === 'single-audio' || gameMode === 'dual') && (
              <div className="text-center">
                <div className={`text-6xl font-bold transition-all duration-200 ${
                  currentLetter ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {currentLetter || '?'}
                </div>
              </div>
            )}

            {/* Response Buttons */}
            <div className="flex gap-4 justify-center pt-8">
              {(gameMode === 'single-visual' || gameMode === 'dual') && (
                <button
                  onClick={onVisualResponse}
                  disabled={!isWaitingForResponse}
                  className={`
                    ${(gameMode === 'dual' && visualResponseMadeThisTrial) ? 'bg-blue-800' : 'bg-blue-600'}
                    hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px]
                  `}
                >
                  <span className="w-5 h-5 bg-white/20 rounded flex items-center justify-center text-xs font-bold">A</span>
                  Position Match
                </button>
              )}
              {(gameMode === 'single-audio' || gameMode === 'dual') && (
                <button
                  onClick={onAudioResponse}
                  disabled={!isWaitingForResponse}
                  className={`
                    ${(gameMode === 'dual' && audioResponseMadeThisTrial) ? 'bg-blue-800' : 'bg-blue-600'}
                    hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-w-[140px]
                  `}
                >
                  <span className="w-5 h-5 bg-white/20 rounded flex items-center justify-center text-xs font-bold">L</span>
                  Sound Match
                </button>
              )}
            </div>

            {isWaitingForResponse && (
              <div className="text-center space-y-2">
                <p className="text-gray-600 text-sm">Press when current stimulus matches {nLevel} steps back</p>
                <p className="text-gray-500 text-xs">
                  Keyboard shortcuts:
                  {(gameMode === 'single-visual' || gameMode === 'dual') && ' A for Position Match'}
                  {gameMode === 'dual' && ' • '}
                  {(gameMode === 'single-audio' || gameMode === 'dual') && ' L for Sound Match'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default GamePlayingScreen;
