import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Play, BarChart3 } from "lucide-react";
import { GameSession } from '../types'; // Corrected: GameMode as ResultsGameMode is not needed if GameSession includes mode
import storageService from '@/services/storage';

export interface GameResultsScreenProps {
  onPlayAgain: () => void;
  onViewStats: () => void;
  onBackToHome: () => void;
  lastSession: GameSession | null;
}

const GameResultsScreen = ({
  onPlayAgain,
  onViewStats,
  onBackToHome,
  lastSession,
}: GameResultsScreenProps) => {
  const sessionToDisplay = lastSession || (() => {
    const sessions = storageService.getObject<GameSession[]>('nback-sessions') || [];
    return sessions.length > 0 ? sessions[sessions.length - 1] : null;
  })();

  if (!sessionToDisplay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">No session data found.</h1>
        <Button onClick={onPlayAgain}>Start a New Game</Button>
      </div>
    );
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
              <div className="text-3xl font-bold text-blue-600">{sessionToDisplay.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">{sessionToDisplay.averageResponseTime.toFixed(0)}ms</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{sessionToDisplay.nLevel}</div>
              <div className="text-sm text-gray-600">N-Level Completed</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
            {(sessionToDisplay.mode === 'single-visual' || sessionToDisplay.mode === 'dual') && (
              <Card className="text-center shadow-lg">
                <CardHeader>
                  <CardTitle>Detailed Visual Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-1 text-sm text-left">
                  <p>Actual Visual Matches: <span className="font-semibold">{sessionToDisplay.actualVisualMatches ?? 'N/A'}</span></p>
                  <p>Visual Hits (Correctly Pressed): <span className="text-green-600 font-semibold">{sessionToDisplay.visualHits ?? 'N/A'}</span></p>
                  <p>Visual Misses (Not Pressed for Match): <span className="text-red-600 font-semibold">{sessionToDisplay.visualMisses ?? 'N/A'}</span></p>
                  <p>Visual False Alarms (Pressed for Non-Match): <span className="text-orange-600 font-semibold">{sessionToDisplay.visualFalseAlarms ?? 'N/A'}</span></p>
                  <p>Visual Correct Rejections (Not Pressed for Non-Match): <span className="font-semibold">{sessionToDisplay.visualCorrectRejections ?? 'N/A'}</span></p>
                </CardContent>
              </Card>
            )}

            {(sessionToDisplay.mode === 'single-audio' || sessionToDisplay.mode === 'dual') && (
              <Card className="text-center shadow-lg">
                <CardHeader>
                  <CardTitle>Detailed Audio Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-1 text-sm text-left">
                  <p>Actual Audio Matches: <span className="font-semibold">{sessionToDisplay.actualAudioMatches ?? 'N/A'}</span></p>
                  <p>Audio Hits (Correctly Pressed): <span className="text-green-600 font-semibold">{sessionToDisplay.audioHits ?? 'N/A'}</span></p>
                  <p>Audio Misses (Not Pressed for Match): <span className="text-red-600 font-semibold">{sessionToDisplay.audioMisses ?? 'N/A'}</span></p>
                  <p>Audio False Alarms (Pressed for Non-Match): <span className="text-orange-600 font-semibold">{sessionToDisplay.audioFalseAlarms ?? 'N/A'}</span></p>
                  <p>Audio Correct Rejections (Not Pressed for Non-Match): <span className="font-semibold">{sessionToDisplay.audioCorrectRejections ?? 'N/A'}</span></p>
                </CardContent>
              </Card>
            )}
          </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={onPlayAgain} className="gap-2">
            <Play className="h-4 w-4" />
            Train Again
          </Button>
          <Button size="lg" variant="outline" onClick={onViewStats} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View All Stats
          </Button>
          <Button size="lg" variant="outline" onClick={onBackToHome}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
export default GameResultsScreen;
