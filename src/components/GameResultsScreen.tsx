import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, BarChart3 } from 'lucide-react'
import type { GameSession } from '@/types/game' // GameMode might be needed if we show it

interface GameResultsScreenProps {
  getLastSession: () => GameSession | null
  resetGame: () => void // For "Train Again"
  onViewStats: () => void
  onBack: () => void // For "Back to Home"
  isPracticeMode: boolean // To conditionally render or alter text
}

const GameResultsScreen = ({
  getLastSession,
  resetGame,
  onViewStats,
  onBack,
  isPracticeMode, // If practice mode ever reached a results screen (currently it doesn't)
}: GameResultsScreenProps) => {
  const lastSession = getLastSession()

  // Note: The current logic in useNBackLogic's endSession and GameInterface's conditional rendering
  // means this screen is typically NOT shown for practice mode, as onPracticeComplete is called.
  // If isPracticeMode is true here, it implies a change in that flow.
  if (isPracticeMode) {
    // Or perhaps show a simplified "Practice Complete" message if that's desired
    // and onPracticeComplete didn't navigate away.
    return (
       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Practice Complete!</h1>
        <p  className="text-xl text-gray-600 mb-8">Well done. Ready for the real thing?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={onBack} className="gap-2">
            Back to Home / Next Step
          </Button>
        </div>
      </div>
    )
  }

  if (!lastSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">No Session Data</h1>
        <p className="text-xl text-gray-600 mb-8">Could not retrieve session results.</p>
        <Button size="lg" onClick={onBack}>
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Session Complete!</h1>
          <p className="text-xl text-gray-600">Great work on your training session</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">
                {lastSession.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {lastSession.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{lastSession.nLevel}</div>
              <div className="text-sm text-gray-600">N-Level Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Performance Counts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {(lastSession.mode === 'single-visual' || lastSession.mode === 'dual') && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-center">Detailed Visual Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-1 text-sm text-left">
                <p>Actual Visual Matches: <span className="font-semibold">{lastSession.actualVisualMatches ?? 'N/A'}</span></p>
                <p>Visual Hits: <span className="text-green-600 font-semibold">{lastSession.visualHits ?? 'N/A'}</span></p>
                <p>Visual Misses: <span className="text-red-600 font-semibold">{lastSession.visualMisses ?? 'N/A'}</span></p>
                <p>Visual False Alarms: <span className="text-orange-600 font-semibold">{lastSession.visualFalseAlarms ?? 'N/A'}</span></p>
                <p>Visual Correct Rejections: <span className="font-semibold">{lastSession.visualCorrectRejections ?? 'N/A'}</span></p>
              </CardContent>
            </Card>
          )}

          {(lastSession.mode === 'single-audio' || lastSession.mode === 'dual') && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-center">Detailed Audio Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-1 text-sm text-left">
                <p>Actual Audio Matches: <span className="font-semibold">{lastSession.actualAudioMatches ?? 'N/A'}</span></p>
                <p>Audio Hits: <span className="text-green-600 font-semibold">{lastSession.audioHits ?? 'N/A'}</span></p>
                <p>Audio Misses: <span className="text-red-600 font-semibold">{lastSession.audioMisses ?? 'N/A'}</span></p>
                <p>Audio False Alarms: <span className="text-orange-600 font-semibold">{lastSession.audioFalseAlarms ?? 'N/A'}</span></p>
                <p>Audio Correct Rejections: <span className="font-semibold">{lastSession.audioCorrectRejections ?? 'N/A'}</span></p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={resetGame} className="gap-2">
            <Play className="h-4 w-4" />
            Train Again
          </Button>
          <Button size="lg" variant="outline" onClick={onViewStats} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View All Stats
          </Button>
          <Button size="lg" variant="outline" onClick={onBack}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

export default GameResultsScreen
