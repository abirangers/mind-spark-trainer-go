
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Volume2, VolumeX, Play, Pause, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface GameInterfaceProps {
  onBack: () => void;
  onViewStats: () => void;
}

type GameMode = 'single-visual' | 'single-audio' | 'dual';
type GameState = 'setup' | 'playing' | 'paused' | 'results';

interface GameSession {
  trials: number;
  nLevel: number;
  accuracy: number;
  visualAccuracy: number;
  audioAccuracy: number;
  averageResponseTime: number;
  mode: GameMode;
}

const GameInterface = ({ onBack, onViewStats }: GameInterfaceProps) => {
  const [gameMode, setGameMode] = useState<GameMode>('single-visual');
  const [gameState, setGameState] = useState<GameState>('setup');
  const [nLevel, setNLevel] = useState(2);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials] = useState(20);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Game state
  const [visualSequence, setVisualSequence] = useState<number[]>([]);
  const [audioSequence, setAudioSequence] = useState<string[]>([]);
  const [currentPosition, setCurrentPosition] = useState<number | null>(null);
  const [currentLetter, setCurrentLetter] = useState<string>('');
  const [visualMatches, setVisualMatches] = useState<boolean[]>([]);
  const [audioMatches, setAudioMatches] = useState<boolean[]>([]);
  const [userVisualResponses, setUserVisualResponses] = useState<boolean[]>([]);
  const [userAudioResponses, setUserAudioResponses] = useState<boolean[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  
  const trialTimeoutRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext>();
  
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Initialize audio context
  useEffect(() => {
    if (audioEnabled) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioEnabled]);

  // Play audio letter
  const playAudioLetter = useCallback((letter: string) => {
    if (!audioEnabled || !audioContextRef.current) return;
    
    // Simple tone generation for letters (in real implementation, use pre-recorded audio)
    const frequency = 200 + (letter.charCodeAt(0) - 65) * 50; // Different frequency per letter
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.5);
  }, [audioEnabled]);

  // Generate new trial stimulus
  const generateStimulus = useCallback(() => {
    const newPosition = Math.floor(Math.random() * 9);
    const newLetter = letters[Math.floor(Math.random() * letters.length)];
    
    setVisualSequence(prev => [...prev, newPosition]);
    setAudioSequence(prev => [...prev, newLetter]);
    
    // Check for matches
    const visualMatch = visualSequence.length >= nLevel && 
                       visualSequence[visualSequence.length - nLevel] === newPosition;
    const audioMatch = audioSequence.length >= nLevel && 
                      audioSequence[audioSequence.length - nLevel] === newLetter;
    
    setVisualMatches(prev => [...prev, visualMatch]);
    setAudioMatches(prev => [...prev, audioMatch]);
    
    return { newPosition, newLetter, visualMatch, audioMatch };
  }, [visualSequence, audioSequence, nLevel]);

  // Start new trial
  const startTrial = useCallback(() => {
    const { newPosition, newLetter } = generateStimulus();
    
    setCurrentPosition(newPosition);
    setCurrentLetter(newLetter);
    setIsWaitingForResponse(true);
    setTrialStartTime(Date.now());
    
    // Play audio if enabled and in audio mode
    if ((gameMode === 'single-audio' || gameMode === 'dual') && audioEnabled) {
      playAudioLetter(newLetter);
    }
    
    // Auto-advance after 3 seconds
    trialTimeoutRef.current = setTimeout(() => {
      handleTrialTimeout();
    }, 3000);
    
  }, [generateStimulus, gameMode, audioEnabled, playAudioLetter]);

  // Handle trial timeout
  const handleTrialTimeout = useCallback(() => {
    setIsWaitingForResponse(false);
    setCurrentPosition(null);
    setCurrentLetter('');
    
    // Record no response
    setUserVisualResponses(prev => [...prev, false]);
    setUserAudioResponses(prev => [...prev, false]);
    setResponseTimes(prev => [...prev, 3000]);
    
    setCurrentTrial(prev => {
      const next = prev + 1;
      if (next < totalTrials) {
        setTimeout(startTrial, 1000);
      } else {
        endSession();
      }
      return next;
    });
  }, [totalTrials]);

  // Handle user response
  const handleResponse = useCallback((responseType: 'visual' | 'audio') => {
    if (!isWaitingForResponse) return;
    
    const responseTime = Date.now() - trialStartTime;
    setResponseTimes(prev => [...prev, responseTime]);
    
    if (responseType === 'visual') {
      setUserVisualResponses(prev => [...prev, true]);
      setUserAudioResponses(prev => [...prev, false]);
    } else {
      setUserVisualResponses(prev => [...prev, false]);
      setUserAudioResponses(prev => [...prev, true]);
    }
    
    setIsWaitingForResponse(false);
    setCurrentPosition(null);
    setCurrentLetter('');
    
    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current);
    }
    
    setCurrentTrial(prev => {
      const next = prev + 1;
      if (next < totalTrials) {
        setTimeout(startTrial, 1000);
      } else {
        endSession();
      }
      return next;
    });
  }, [isWaitingForResponse, trialStartTime, totalTrials]);

  // End session and calculate results
  const endSession = useCallback(() => {
    setGameState('results');
    
    // Calculate accuracy
    let visualCorrect = 0;
    let audioCorrect = 0;
    
    for (let i = 0; i < totalTrials; i++) {
      const visualExpected = visualMatches[i] || false;
      const audioExpected = audioMatches[i] || false;
      const visualResponse = userVisualResponses[i] || false;
      const audioResponse = userAudioResponses[i] || false;
      
      if (visualExpected === visualResponse) visualCorrect++;
      if (audioExpected === audioResponse) audioCorrect++;
    }
    
    const visualAccuracy = (visualCorrect / totalTrials) * 100;
    const audioAccuracy = (audioCorrect / totalTrials) * 100;
    const overallAccuracy = gameMode === 'dual' ? 
      (visualAccuracy + audioAccuracy) / 2 : 
      (gameMode === 'single-visual' ? visualAccuracy : audioAccuracy);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    // Store session results
    const session: GameSession = {
      trials: totalTrials,
      nLevel,
      accuracy: overallAccuracy,
      visualAccuracy,
      audioAccuracy,
      averageResponseTime: avgResponseTime,
      mode: gameMode
    };
    
    // Save to localStorage
    const sessions = JSON.parse(localStorage.getItem('nback-sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('nback-sessions', JSON.stringify(sessions));
    
    // Show results toast
    toast.success(`Session Complete! ${overallAccuracy.toFixed(1)}% accuracy`);
  }, [visualMatches, audioMatches, userVisualResponses, userAudioResponses, responseTimes, totalTrials, nLevel, gameMode]);

  // Start game session
  const startGame = () => {
    setGameState('playing');
    setCurrentTrial(0);
    setVisualSequence([]);
    setAudioSequence([]);
    setVisualMatches([]);
    setAudioMatches([]);
    setUserVisualResponses([]);
    setUserAudioResponses([]);
    setResponseTimes([]);
    setTimeout(startTrial, 1000);
  };

  // Reset game
  const resetGame = () => {
    setGameState('setup');
    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current);
    }
  };

  // Game setup view
  if (gameState === 'setup') {
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
                  {[
                    { mode: 'single-visual' as const, title: 'Single N-Back (Visual)', desc: 'Remember visual positions only' },
                    { mode: 'single-audio' as const, title: 'Single N-Back (Audio)', desc: 'Remember audio letters only' },
                    { mode: 'dual' as const, title: 'Dual N-Back', desc: 'Remember both visual and audio stimuli' }
                  ].map(({ mode, title, desc }) => (
                    <div 
                      key={mode}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        gameMode === mode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setGameMode(mode)}
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
                      onClick={() => setNLevel(Math.max(1, nLevel - 1))}
                      disabled={nLevel <= 1}
                    >
                      -
                    </Button>
                    <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">
                      {nLevel}-Back
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setNLevel(Math.min(8, nLevel + 1))}
                      disabled={nLevel >= 8}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Higher N-levels are more challenging
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Audio Settings</label>
                  <Button 
                    variant="outline" 
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className="gap-2"
                  >
                    {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    {audioEnabled ? 'Audio On' : 'Audio Off'}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• Trials: {totalTrials}</div>
                    <div>• Duration: ~{Math.ceil(totalTrials * 4 / 60)} minutes</div>
                    <div>• Mode: {gameMode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center mt-8">
            <Button 
              size="lg" 
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg gap-2"
            >
              <Play className="h-5 w-5" />
              Start Training Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game playing view
  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={resetGame} className="gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                {nLevel}-Back {gameMode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Trial</div>
              <div className="text-2xl font-bold">{currentTrial + 1} / {totalTrials}</div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <Progress value={(currentTrial / totalTrials) * 100} className="h-2" />
          </div>

          {/* Game Area */}
          <Card className="shadow-xl mb-8">
            <CardContent className="p-8">
              <div className="text-center space-y-8">
                {/* Visual Grid */}
                {(gameMode === 'single-visual' || gameMode === 'dual') && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Visual Stimulus</h3>
                    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                      {[...Array(9)].map((_, index) => (
                        <div
                          key={index}
                          className={`w-20 h-20 border-2 rounded-lg transition-all duration-200 ${
                            currentPosition === index
                              ? 'bg-blue-500 border-blue-600 shadow-lg scale-110'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio Display */}
                {(gameMode === 'single-audio' || gameMode === 'dual') && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Audio Stimulus</h3>
                    <div className={`text-6xl font-bold transition-all duration-200 ${
                      currentLetter ? 'text-blue-600 scale-110' : 'text-gray-300'
                    }`}>
                      {currentLetter || '?'}
                    </div>
                  </div>
                )}

                {/* Response Buttons */}
                {isWaitingForResponse && (
                  <div className="space-y-4">
                    <p className="text-gray-600">Press when current stimulus matches {nLevel} steps back</p>
                    <div className="flex gap-4 justify-center">
                      {(gameMode === 'single-visual' || gameMode === 'dual') && (
                        <Button 
                          size="lg"
                          onClick={() => handleResponse('visual')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Visual Match
                        </Button>
                      )}
                      {(gameMode === 'single-audio' || gameMode === 'dual') && (
                        <Button 
                          size="lg"
                          onClick={() => handleResponse('audio')}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Audio Match
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results view
  if (gameState === 'results') {
    const sessions = JSON.parse(localStorage.getItem('nback-sessions') || '[]');
    const lastSession = sessions[sessions.length - 1];

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
                <div className="text-3xl font-bold text-blue-600">{lastSession?.accuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Overall Accuracy</div>
              </CardContent>
            </Card>
            <Card className="text-center shadow-lg">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{lastSession?.averageResponseTime.toFixed(0)}ms</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </CardContent>
            </Card>
            <Card className="text-center shadow-lg">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600">{lastSession?.nLevel}</div>
                <div className="text-sm text-gray-600">N-Level Completed</div>
              </CardContent>
            </Card>
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
    );
  }

  return null;
};

export default GameInterface;
