import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, TrendingUp, Target, Clock, Brain, Award, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PerformanceStatsProps {
  onBack: () => void;
  onStartTraining: () => void;
}

interface GameSession {
  trials: number;
  nLevel: number;
  accuracy: number;
  visualAccuracy: number;
  audioAccuracy: number;
  averageResponseTime: number;
  mode: string;
  timestamp: string;

  // New detailed counts (optional)
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

const PerformanceStats = ({ onBack, onStartTraining }: PerformanceStatsProps) => {
  // Get sessions from localStorage or generate demo data
  const sessions: GameSession[] = useMemo(() => {
    const stored = localStorage.getItem("nback-sessions");
    if (stored) {
      try {
        const parsedSessions: GameSession[] = JSON.parse(stored);
        // Ensure all sessions have a timestamp for robust sorting.
        // Filter out sessions without a valid timestamp before sorting if necessary.
        parsedSessions.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeA - timeB;
        });
        return parsedSessions;
      } catch (e) {
        console.error("Error parsing sessions from localStorage", e);
        // Fallback to demo data or empty array if parsing fails
      }
    }

    // Generate demo data for visualization
    const now = Date.now();
    const demoSessions: GameSession[] = [];

    for (let i = 0; i < 15; i++) {
      demoSessions.push({
        trials: 20,
        nLevel: Math.min(6, Math.max(1, 2 + Math.floor(i / 3) + (Math.random() > 0.7 ? 1 : 0))),
        accuracy: Math.max(40, 85 - Math.random() * 20 + i * 2),
        visualAccuracy: Math.max(35, 80 - Math.random() * 25 + i * 2.5),
        audioAccuracy: Math.max(35, 75 - Math.random() * 20 + i * 1.5),
        averageResponseTime: Math.max(800, 1500 - i * 30 - Math.random() * 200),
        mode: ["single-visual", "single-audio", "dual"][Math.floor(Math.random() * 3)],
        timestamp: new Date(now - (14 - i) * 24 * 60 * 60 * 1000).toISOString(), // Use ISOString for demo
      });
    }
    return demoSessions; // Return demo data if 'stored' is null or parsing failed
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageAccuracy: 0,
        bestNLevel: 0,
        averageResponseTime: 0,
        improvementRate: 0,
        currentStreak: 0,
        totalTrainingTime: 0,
      };
    }

    const totalSessions = sessions.length;
    const averageAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
    const bestNLevel = Math.max(...sessions.map((s) => s.nLevel));
    const averageResponseTime =
      sessions.reduce((sum, s) => sum + s.averageResponseTime, 0) / totalSessions;

    // Calculate improvement rate (last 5 vs first 5 sessions)
    const firstFive = sessions.slice(0, 5);
    const lastFive = sessions.slice(-5);
    const firstAvg = firstFive.reduce((sum, s) => sum + s.accuracy, 0) / firstFive.length;
    const lastAvg = lastFive.reduce((sum, s) => sum + s.accuracy, 0) / lastFive.length;
    const improvementRate = lastAvg - firstAvg;

    // Calculate total training time
    const totalTrialsCompleted = sessions.reduce((sum, s) => sum + s.trials, 0);
    const totalTrainingTime = (totalTrialsCompleted * 4) / 60; // minutes

    return {
      totalSessions,
      averageAccuracy,
      bestNLevel,
      averageResponseTime,
      improvementRate,
      currentStreak: 5, // Simplified
      totalTrainingTime,
    };
  }, [sessions]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return sessions.map((session, index) => ({
      session: index + 1,
      accuracy: Math.round(session.accuracy),
      nLevel: session.nLevel,
      responseTime: Math.round(session.averageResponseTime),
      date: session.timestamp
        ? new Date(session.timestamp).toLocaleDateString()
        : `Day ${index + 1}`,
    }));
  }, [sessions]);

  // Mode distribution
  const modeStats = useMemo(() => {
    const modes = sessions.reduce(
      (acc, session) => {
        acc[session.mode] = (acc[session.mode] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(modes).map(([mode, count]) => ({
      mode: mode.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
      percentage: Math.round((count / sessions.length) * 100),
    }));
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Performance Statistics</h1>
          </div>

          <Card className="shadow-xl">
            <CardContent className="p-12 text-center">
              <Brain className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Training Data Yet</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Complete your first training session to see detailed performance analytics and track
                your cognitive improvement over time.
              </p>
              <Button size="lg" onClick={onStartTraining} className="gap-2">
                <Play className="h-4 w-4" />
                Start Your First Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          </div>
          <Button onClick={onStartTraining} className="gap-2">
            <Play className="h-4 w-4" />
            Continue Training
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalSessions}</div>
                  <div className="text-sm text-gray-600">Sessions Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.averageAccuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Average Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.bestNLevel}</div>
                  <div className="text-sm text-gray-600">Best N-Level</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.averageResponseTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="progress">Progress Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Accuracy Trend */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Accuracy Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="session" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, "Accuracy"]}
                        labelFormatter={(label) => `Session ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* N-Level Progress */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    N-Level Progression
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="session" />
                      <YAxis domain={[1, 8]} />
                      <Tooltip
                        formatter={(value: number) => [`${value}-Back`, "N-Level"]}
                        labelFormatter={(label) => `Session ${label}`}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="nLevel"
                        stroke="#7C3AED"
                        strokeWidth={3}
                        dot={{ fill: "#7C3AED", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Response Time */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Response Time Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [`${value}ms`, "Response Time"]}
                      labelFormatter={(label) => `Session ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Training Mode Distribution */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Training Mode Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modeStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{stat.mode}</Badge>
                          <span className="text-sm text-gray-600">{stat.count} sessions</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{stat.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Performance */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessions
                      .slice(-5)
                      .reverse()
                      .map((session, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{session.nLevel}-Back</Badge>
                              <span className="text-sm text-gray-600 capitalize">
                                {session.mode.replace("-", " ")}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{session.accuracy.toFixed(1)}%</div>
                              <div className="text-xs text-gray-500">
                                {session.averageResponseTime.toFixed(0)}ms
                              </div>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                            {(session.mode === "single-visual" || session.mode === "dual") && (
                              <span>
                                V-Hits: {session.visualHits ?? 0}/{session.actualVisualMatches ?? 0}
                              </span>
                            )}
                            {(session.mode === "single-audio" || session.mode === "dual") && (
                              <span>
                                A-Hits: {session.audioHits ?? 0}/{session.actualAudioMatches ?? 0}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-6">
              {/* Performance Insights */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Strengths</h3>
                      <div className="space-y-3">
                        {stats.improvementRate > 5 && (
                          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <div className="font-medium text-green-800">
                                Consistent Improvement
                              </div>
                              <div className="text-sm text-green-700">
                                Your accuracy has improved by {stats.improvementRate.toFixed(1)}%
                                over recent sessions
                              </div>
                            </div>
                          </div>
                        )}
                        {stats.averageResponseTime < 1200 && (
                          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <div className="font-medium text-blue-800">Fast Response Time</div>
                              <div className="text-sm text-blue-700">
                                Your average response time is excellent at{" "}
                                {stats.averageResponseTime.toFixed(0)}ms
                              </div>
                            </div>
                          </div>
                        )}
                        {stats.averageAccuracy > 75 && (
                          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <div className="font-medium text-purple-800">High Accuracy</div>
                              <div className="text-sm text-purple-700">
                                Maintaining {stats.averageAccuracy.toFixed(1)}% accuracy shows
                                strong working memory
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Recommendations</h3>
                      <div className="space-y-3">
                        {stats.bestNLevel < 4 && (
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <div className="font-medium text-yellow-800">Try Higher N-Levels</div>
                            <div className="text-sm text-yellow-700">
                              Consider gradually increasing to {stats.bestNLevel + 1}-back for more
                              challenge
                            </div>
                          </div>
                        )}
                        {modeStats.find((m) => m.mode.includes("Dual")) === undefined && (
                          <div className="p-3 bg-indigo-50 rounded-lg">
                            <div className="font-medium text-indigo-800">Try Dual N-Back</div>
                            <div className="text-sm text-indigo-700">
                              Dual mode provides the most comprehensive working memory training
                            </div>
                          </div>
                        )}
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-gray-800">Training Consistency</div>
                          <div className="text-sm text-gray-700">
                            Aim for {Math.max(3, 7 - Math.floor(stats.totalSessions / 5))} sessions
                            per week for optimal improvement
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Training Summary */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Training Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {stats.totalTrainingTime.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600">Minutes Trained</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {(stats.totalSessions * 20).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Trials Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {stats.currentStreak}
                      </div>
                      <div className="text-sm text-gray-600">Day Streak</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PerformanceStats;
