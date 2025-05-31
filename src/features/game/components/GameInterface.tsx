import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from "sonner";
import { useSettingsStore } from '@/features/settings/store';
import storageService from "@/services/storage";
import { GameMode, GameState, GameSession } from '../types';

// These imports were from the successful "Extract Screen Components" subtask
import GameSetupScreen from './GameSetupScreen';
import GamePlayingScreen from './GamePlayingScreen';
import GameResultsScreen from './GameResultsScreen';
// This import was added in the current subtask for the speech hook
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useNBackEngine } from '../hooks/useNBackEngine';


const PRACTICE_MODE_CONST: GameMode = 'single-visual';
const PRACTICE_N_LEVEL_CONST = 1;
const PRACTICE_NUM_TRIALS_CONST = 7;

interface GameInterfaceProps {
  onBack: () => void;
  onViewStats: () => void;
  isPracticeMode?: boolean;
  onPracticeComplete?: () => void;
}

const GameInterface = ({
  onBack,
  onViewStats,
  isPracticeMode = false,
  onPracticeComplete
}: GameInterfaceProps) => {
  const [gameMode, setGameMode] = useState<GameMode>(
    isPracticeMode ? PRACTICE_MODE_CONST : 'single-visual'
  );
  const [currentGameState, setCurrentGameState] = useState<GameState>('setup');
  const [nLevel, setNLevel] = useState<number>(
    isPracticeMode ? PRACTICE_N_LEVEL_CONST : 2
  );
  const [currentTrial, setCurrentTrial] = useState(0);
  const [numTrials, setNumTrials] = useState<number>(
    isPracticeMode ? PRACTICE_NUM_TRIALS_CONST : 20
  );
  const [stimulusDurationMs, setStimulusDurationMs] = useState(3000);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // State managed by useNBackEngine:
  // visualSequence, audioSequence, currentPosition, currentLetter, visualMatches, audioMatches

  // User interaction state (remains in GameInterface)
  const [userVisualResponses, setUserVisualResponses] = useState<boolean[]>([]);
  const [userAudioResponses, setUserAudioResponses] = useState<boolean[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [visualResponseMadeThisTrial, setVisualResponseMadeThisTrial] = useState(false);
  const [audioResponseMadeThisTrial, setAudioResponseMadeThisTrial] = useState(false);

  const trialTimeoutRef = useRef<NodeJS.Timeout>();
  const startTrialRef = useRef<() => void>();
  const postDualResponseDelayRef = useRef<NodeJS.Timeout>();

  const isAdaptiveDifficultyEnabled = useSettingsStore(
    (state) => state.isAdaptiveDifficultyEnabled
  );
  const { playLetter: playAudioLetter } = useSpeechSynthesis({ audioEnabled });
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const {
    currentPosition,
    currentLetter,
    prepareNextTrial,
    resetEngine: resetNBackEngine,
    visualMatches: engineVisualMatches,
    audioMatches: engineAudioMatches
  } = useNBackEngine({ nLevel, gameMode, letters });

  // Old generateStimulus function is now removed. Logic is in useNBackEngine.

  const endSession = useCallback(() => {
    if (isPracticeMode) {
      toast.success("Practice Complete! Well done!", { duration: 3000 });
      if (onPracticeComplete) onPracticeComplete();
      return;
    }
    setCurrentGameState('results');
    let visualCorrect = 0, audioCorrect = 0;
    let actualVisualMatches = 0, visualHits = 0, visualMisses = 0, visualFalseAlarms = 0, visualCorrectRejections = 0;
    let actualAudioMatches = 0, audioHits = 0, audioMisses = 0, audioFalseAlarms = 0, audioCorrectRejections = 0;

    for (let i = 0; i < numTrials; i++) {
      const visualExpected = engineVisualMatches[i] || false;
      const audioExpected = engineAudioMatches[i] || false;
      const visualResponse = userVisualResponses[i] || false;
      const audioResponse = userAudioResponses[i] || false;

      if (gameMode === 'single-visual' || gameMode === 'dual') {
        if (visualExpected) actualVisualMatches++;
        if (visualExpected && visualResponse) visualHits++;
        else if (visualExpected && !visualResponse) visualMisses++;
        else if (!visualExpected && visualResponse) visualFalseAlarms++;
        else if (!visualExpected && !visualResponse) visualCorrectRejections++;
      }
      if (gameMode === 'single-audio' || gameMode === 'dual') {
        if (audioExpected) actualAudioMatches++;
        if (audioExpected && audioResponse) audioHits++;
        else if (audioExpected && !audioResponse) audioMisses++;
        else if (!audioExpected && audioResponse) audioFalseAlarms++;
        else if (!audioExpected && !audioResponse) audioCorrectRejections++;
      }
      if (visualExpected === visualResponse) visualCorrect++;
      if (audioExpected === audioResponse) audioCorrect++;
    }
    const visualAccuracy = (numTrials > 0 ? (visualCorrect / numTrials) * 100 : 0);
    const audioAccuracy = (numTrials > 0 ? (audioCorrect / numTrials) * 100 : 0);
    const overallAccuracy = gameMode === 'dual' ? (visualAccuracy + audioAccuracy) / 2 : (gameMode === 'single-visual' ? visualAccuracy : audioAccuracy);
    const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    const session: GameSession = {
      trials: numTrials, nLevel, accuracy: overallAccuracy, visualAccuracy, audioAccuracy,
      averageResponseTime: avgResponseTime, mode: gameMode, timestamp: new Date().toISOString(),
      actualVisualMatches, visualHits, visualMisses, visualFalseAlarms, visualCorrectRejections,
      actualAudioMatches, audioHits, audioMisses, audioFalseAlarms, audioCorrectRejections
    };
    const existingSessions = storageService.getObject<GameSession[]>('nback-sessions') || [];
    existingSessions.push(session);
    storageService.setObject('nback-sessions', existingSessions);
    toast.success(`Session Complete! ${overallAccuracy.toFixed(1)}% accuracy`);

    if (isAdaptiveDifficultyEnabled) {
      let nextNLevel = nLevel, adaptiveMessage = "";
      if (overallAccuracy >= 80 && nLevel < 8) { nextNLevel++; adaptiveMessage = `N-Level increased to ${nextNLevel}!`; }
      else if (overallAccuracy < 60 && nLevel > 1) { nextNLevel--; adaptiveMessage = `N-Level decreased to ${nextNLevel}. Keep practicing!`; }
      else if (overallAccuracy >= 80 && nLevel === 8) adaptiveMessage = `Max N-Level (${nLevel}) and performing excellently!`;
      else if (overallAccuracy < 60 && nLevel === 1) adaptiveMessage = `N-Level remains at ${nLevel}. Keep it up!`;
      else adaptiveMessage = `N-Level maintained at ${nLevel}. Good effort!`;
      if (nextNLevel !== nLevel) setNLevel(nextNLevel);
      if (adaptiveMessage) toast(adaptiveMessage, { duration: 4000 });
    }
  }, [isPracticeMode, onPracticeComplete, engineVisualMatches, engineAudioMatches, userVisualResponses, userAudioResponses, responseTimes, numTrials, nLevel, gameMode, isAdaptiveDifficultyEnabled, toast, setCurrentGameState, setNLevel]);

  const handleTrialTimeout = useCallback(() => {
    if (isPracticeMode) {
      const visualExpected = engineVisualMatches[currentTrial];
      if (visualExpected) toast.error("Missed Match!", { duration: 1500 });
      else toast.info("Correct: No match there.", { duration: 1500 });
    }
    setIsWaitingForResponse(false);
    // currentPosition and currentLetter are managed by the hook.
    setResponseTimes(prev => [...prev, stimulusDurationMs]);
    setCurrentTrial(prev => {
      const next = prev + 1;
      if (next < numTrials) setTimeout(() => startTrialRef.current?.(), 1000);
      return next;
    });
  }, [currentTrial, numTrials, stimulusDurationMs, isPracticeMode, engineVisualMatches, toast, setIsWaitingForResponse, setResponseTimes, setCurrentTrial ]);

  const startTrial = useCallback(() => {
    const { newLetter: letterForAudio } = prepareNextTrial(); // This updates currentPosition and currentLetter in the hook
    setVisualResponseMadeThisTrial(false); setAudioResponseMadeThisTrial(false);
    setIsWaitingForResponse(true); setTrialStartTime(Date.now());
    if ((gameMode === 'single-audio' || gameMode === 'dual') && audioEnabled && letterForAudio) {
      playAudioLetter(letterForAudio);
    }
    trialTimeoutRef.current = setTimeout(handleTrialTimeout, stimulusDurationMs);
  }, [prepareNextTrial, gameMode, audioEnabled, playAudioLetter, handleTrialTimeout, stimulusDurationMs, setIsWaitingForResponse, setTrialStartTime, setVisualResponseMadeThisTrial, setAudioResponseMadeThisTrial]);

  useEffect(() => { startTrialRef.current = startTrial; }, [startTrial]);

  const handleResponse = useCallback((responseType: 'visual' | 'audio') => {
    if (!isWaitingForResponse) return;
    const responseTime = Date.now() - trialStartTime;
    setResponseTimes(prev => [...prev, responseTime]);
    const trialIndexToUpdate = currentTrial;
    let currentVisualResponseMade = visualResponseMadeThisTrial;
    let currentAudioResponseMade = audioResponseMadeThisTrial;

    if (responseType === 'visual') {
      setUserVisualResponses(prev => { const u = [...prev]; if (trialIndexToUpdate < u.length) u[trialIndexToUpdate] = true; return u; });
      setVisualResponseMadeThisTrial(true); currentVisualResponseMade = true;
      if (isPracticeMode && !userVisualResponses[trialIndexToUpdate]) {
        if (engineVisualMatches[trialIndexToUpdate]) toast.success("Correct Match!", { duration: 1500 });
        else toast.warning("Oops! That wasn't a match (False Alarm).", { duration: 1500 });
      }
    } else {
      setUserAudioResponses(prev => { const u = [...prev]; if (trialIndexToUpdate < u.length) u[trialIndexToUpdate] = true; return u; });
      setAudioResponseMadeThisTrial(true); currentAudioResponseMade = true;
    }

    const performTrialAdvancement = () => {
      // currentPosition and currentLetter are managed by the hook.
      setCurrentTrial(prev => {
        const next = prev + 1;
        if (next < numTrials) setTimeout(() => startTrialRef.current?.(), 1000);
        return next;
      });
    };

    if (gameMode === 'dual') {
      if (currentVisualResponseMade && currentAudioResponseMade) {
        setIsWaitingForResponse(false);
        if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
        postDualResponseDelayRef.current = setTimeout(performTrialAdvancement, 750);
      }
    } else {
      setIsWaitingForResponse(false);
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
      performTrialAdvancement();
    }
  }, [isWaitingForResponse, trialStartTime, numTrials, gameMode, currentTrial, visualResponseMadeThisTrial, audioResponseMadeThisTrial, isPracticeMode, engineVisualMatches, userVisualResponses, toast, setIsWaitingForResponse, setResponseTimes, setCurrentTrial, setUserVisualResponses, setUserAudioResponses, setVisualResponseMadeThisTrial, setAudioResponseMadeThisTrial]);

  useEffect(() => {
    if (currentGameState === 'playing' && currentTrial === numTrials) endSession();
  }, [currentGameState, currentTrial, numTrials, endSession]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (currentGameState === 'playing' && isWaitingForResponse) {
        if (event.key.toLowerCase() === 'a' && (gameMode === 'single-visual' || gameMode === 'dual')) handleResponse('visual');
        else if (event.key.toLowerCase() === 'l' && (gameMode === 'single-audio' || gameMode === 'dual')) handleResponse('audio');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentGameState, isWaitingForResponse, gameMode, handleResponse]);

  const startGameCallback = useCallback(() => {
    resetNBackEngine(); // Reset sequences and matches in the hook
    setCurrentGameState('playing'); setCurrentTrial(0);
    // Local states for sequences, matches, currentPosition, currentLetter are removed.
    setUserVisualResponses(Array(numTrials).fill(false)); setUserAudioResponses(Array(numTrials).fill(false));
    setResponseTimes([]);
    setTimeout(() => startTrialRef.current?.(), 100);
  }, [numTrials, resetNBackEngine, setCurrentGameState, setCurrentTrial, setUserVisualResponses, setUserAudioResponses, setResponseTimes]);

  useEffect(() => {
    if (isPracticeMode && currentGameState === 'setup') startGameCallback();
  }, [isPracticeMode, currentGameState, startGameCallback]);

  const resetGameAndGoToSetup = useCallback(() => {
    setCurrentGameState('setup');
    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
    if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current);
    setCurrentPosition(null); setCurrentLetter(''); setIsWaitingForResponse(false);
  }, [setCurrentGameState, setCurrentPosition, setCurrentLetter, setIsWaitingForResponse]);

  if (currentGameState === 'setup') {
    return (
      <GameSetupScreen
        onBack={onBack}
        gameMode={gameMode}
        setGameMode={setGameMode}
        nLevel={nLevel}
        setNLevel={setNLevel}
        numTrials={numTrials}
        setNumTrials={setNumTrials}
        stimulusDurationMs={stimulusDurationMs}
        setStimulusDurationMs={setStimulusDurationMs}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        startGame={startGameCallback}
        isPracticeMode={isPracticeMode}
      />
    );
  }

  if (currentGameState === 'playing') {
    return (
      <GamePlayingScreen
        onPause={resetGameAndGoToSetup}
        nLevel={nLevel}
        gameMode={gameMode}
        currentTrial={currentTrial}
        numTrials={numTrials}
        currentPosition={currentPosition}
        currentLetter={currentLetter}
        isWaitingForResponse={isWaitingForResponse}
        visualResponseMadeThisTrial={visualResponseMadeThisTrial}
        audioResponseMadeThisTrial={audioResponseMadeThisTrial}
        onVisualResponse={() => handleResponse('visual')}
        onAudioResponse={() => handleResponse('audio')}
      />
    );
  }

  if (currentGameState === 'results') {
    const sessions = storageService.getObject<GameSession[]>('nback-sessions') || [];
    const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
    return (
      <GameResultsScreen
        lastSession={lastSession}
        onPlayAgain={resetGameAndGoToSetup}
        onViewStats={onViewStats}
        onBackToHome={onBack}
      />
    );
  }
  return null;
};
export default GameInterface;
