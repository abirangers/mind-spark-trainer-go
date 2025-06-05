import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Volume2, VolumeX, Play } from 'lucide-react'
import { GameMode } from '../types'
import { 
  MIN_N_LEVEL, 
  MAX_N_LEVEL, 
  MIN_TRIALS, 
  MAX_TRIALS, 
  MIN_STIMULUS_DURATION, 
  MAX_STIMULUS_DURATION, 
  STIMULUS_DURATION_STEP 
} from '../constants'
import { formatGameMode, calculateSessionDuration } from '../utils'

interface GameSetupProps {
  gameMode: GameMode
  setGameMode: (mode: GameMode) => void
  nLevel: number
  setNLevel: (level: number) => void
  numTrials: number
  setNumTrials: (trials: number) => void
  stimulusDurationMs: number
  setStimulusDurationMs: (duration: number) => void
  audioEnabled: boolean
  setAudioEnabled: (enabled: boolean) => void
  isPracticeMode: boolean
  onBack: () => void
  onStartGame: () => void
}

export const GameSetup: React.FC<GameSetupProps> = React.memo(({
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
  isPracticeMode,
  onBack,
  onStartGame,
}) => {
  const gameModes = [
    {
      mode: 'single-visual' as const,
      title: 'Single N-Back (Visual)',
      desc: 'Remember visual positions only',
    },
    {
      mode: 'single-audio' as const,
      title: 'Single N-Back (Audio)',
      desc: 'Remember audio letters only',
    },
    {
      mode: 'dual' as const,
      title: 'Dual N-Back',
      desc: 'Remember both visual and audio stimuli',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">N-Back Training Setup</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Game Mode Selection */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Select Training Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {gameModes.map(({ mode, title, desc }) => (
                  <div
                    key={mode}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      gameMode === mode ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    } ${isPracticeMode ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-gray-300'}`}
                    onClick={() => {
                      if (!isPracticeMode) {
                        setGameMode(mode)
                      }
                    }}
                  >
                    <div className="font-semibold">{title}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Training Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">N-Level (Difficulty)</label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNLevel(Math.max(MIN_N_LEVEL, nLevel - 1))}
                    disabled={isPracticeMode || nLevel <= MIN_N_LEVEL}
                  >
                    -
                  </Button>
                  <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">
                    {nLevel}-Back
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNLevel(Math.min(MAX_N_LEVEL, nLevel + 1))}
                    disabled={isPracticeMode || nLevel >= MAX_N_LEVEL}
                  >
                    +
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">Higher N-levels are more challenging</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Number of Trials</label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNumTrials(Math.max(MIN_TRIALS, numTrials - 5))}
                    disabled={isPracticeMode || numTrials <= MIN_TRIALS}
                  >
                    -
                  </Button>
                  <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">
                    {numTrials}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNumTrials(Math.min(MAX_TRIALS, numTrials + 5))}
                    disabled={isPracticeMode || numTrials >= MAX_TRIALS}
                  >
                    +
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Adjust the total trials per session ({MIN_TRIALS}-{MAX_TRIALS}).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stimulus Duration</label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStimulusDurationMs(Math.max(MIN_STIMULUS_DURATION, stimulusDurationMs - STIMULUS_DURATION_STEP))}
                    disabled={isPracticeMode || stimulusDurationMs <= MIN_STIMULUS_DURATION}
                  >
                    -
                  </Button>
                  <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">
                    {(stimulusDurationMs / 1000).toFixed(1)}s
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStimulusDurationMs(Math.min(MAX_STIMULUS_DURATION, stimulusDurationMs + STIMULUS_DURATION_STEP))}
                    disabled={isPracticeMode || stimulusDurationMs >= MAX_STIMULUS_DURATION}
                  >
                    +
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Time each stimulus is shown ({MIN_STIMULUS_DURATION / 1000}s - {MAX_STIMULUS_DURATION / 1000}s).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Audio Settings</label>
                <Button
                  variant="outline"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="gap-2"
                >
                  {audioEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  {audioEnabled ? 'Audio On' : 'Audio Off'}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• Trials: {numTrials}</div>
                  <div>
                    • Duration: ~{calculateSessionDuration(numTrials, stimulusDurationMs)} minutes
                  </div>
                  <div>
                    • Mode: {formatGameMode(gameMode)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            size="lg"
            onClick={onStartGame}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg gap-2"
          >
            <Play className="h-5 w-5" />
            Start Training Session
          </Button>
        </div>
      </div>
    </div>
  )
}
