import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, BarChart3 } from "lucide-react";

export interface GameSession {
  trials: number;
  nLevel: number;
  accuracy: number;
  visualAccuracy: number;
  audioAccuracy: number;
  averageResponseTime: number;
  mode: string;
  timestamp: string;
  actualVisualMatches?: number;
  visualHits?: number;
  visualMisses?: number;
  visualFalseAlarms?: number;
  visualCorrectRejections?: number;
  actualAudioMatches?: number;
  audioHits?: number;
  audioMisses?: number;
  audioFalseAlarms?: number;
  audioCorrectRejections?: number;
}

/**
 * Props for the ResultsScreen component.
 */
interface ResultsScreenProps {
  lastSession: GameSession | null;
  onBackToHome: () => void;
  onViewStats: () => void;
  onTrainAgain: () => void;
}

/**
 * Component for displaying the results of a completed game session.
 * Shows overall accuracy, average response time, N-level, and detailed performance stats.
 * Provides options to train again, view all stats, or go back home.
 *
 * @param {ResultsScreenProps} props - Props containing the last session data and navigation callbacks.
 * @returns JSX.Element - The results screen UI.
 */
const ResultsScreenComponent: React.FC<ResultsScreenProps> = ({
  lastSession: initialLastSession,
  onBackToHome,
  onViewStats,
  onTrainAgain,
}) => {
  const [sessionData, setSessionData] = React.useState<GameSession | null>(initialLastSession);

  React.useEffect(() => {
    if (!initialLastSession && typeof window !== "undefined") {
      // check window for localStorage
      const sessionsString = localStorage.getItem("nback-sessions");
      try {
        const sessions = JSON.parse(sessionsString || "[]");
        if (sessions.length > 0) {
          setSessionData(sessions[sessions.length - 1]);
        }
      } catch (e) {
        console.error("Failed to parse sessions from localStorage", e);
      }
    } else if (initialLastSession) {
      // Ensure initialLastSession is used if provided
      setSessionData(initialLastSession);
    }
  }, [initialLastSession]);

  if (!sessionData)
    return (
      <div className="p-4">
        Loading session results or no data found... If you just finished a session, data might still
        be saving. Try refreshing or checking Stats page.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Session Complete!</h1>
          <p className="text-xl text-gray-600">Great work on your training session!</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">
                {sessionData.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {sessionData.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{sessionData.nLevel}</div>
              <div className="text-sm text-gray-600">N-Level Completed</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {(sessionData.mode === "single-visual" || sessionData.mode === "dual") && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Detailed Visual Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-1 text-sm text-left">
                <p>
                  Actual Visual Matches:{" "}
                  <span className="font-semibold">{sessionData.actualVisualMatches ?? "N/A"}</span>
                </p>
                <p>
                  Visual Hits:{" "}
                  <span className="text-green-600 font-semibold">
                    {sessionData.visualHits ?? "N/A"}
                  </span>
                </p>
                <p>
                  Visual Misses:{" "}
                  <span className="text-red-600 font-semibold">
                    {sessionData.visualMisses ?? "N/A"}
                  </span>
                </p>
                <p>
                  Visual False Alarms:{" "}
                  <span className="text-orange-600 font-semibold">
                    {sessionData.visualFalseAlarms ?? "N/A"}
                  </span>
                </p>
                <p>
                  Visual Correct Rejections:{" "}
                  <span className="font-semibold">
                    {sessionData.visualCorrectRejections ?? "N/A"}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
          {(sessionData.mode === "single-audio" || sessionData.mode === "dual") && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Detailed Audio Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-1 text-sm text-left">
                <p>
                  Actual Audio Matches:{" "}
                  <span className="font-semibold">{sessionData.actualAudioMatches ?? "N/A"}</span>
                </p>
                <p>
                  Audio Hits:{" "}
                  <span className="text-green-600 font-semibold">
                    {sessionData.audioHits ?? "N/A"}
                  </span>
                </p>
                <p>
                  Audio Misses:{" "}
                  <span className="text-red-600 font-semibold">
                    {sessionData.audioMisses ?? "N/A"}
                  </span>
                </p>
                <p>
                  Audio False Alarms:{" "}
                  <span className="text-orange-600 font-semibold">
                    {sessionData.audioFalseAlarms ?? "N/A"}
                  </span>
                </p>
                <p>
                  Audio Correct Rejections:{" "}
                  <span className="font-semibold">
                    {sessionData.audioCorrectRejections ?? "N/A"}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={onTrainAgain} className="gap-2">
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

export const ResultsScreen = React.memo(ResultsScreenComponent);
