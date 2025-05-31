import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export type GameMode = "single-visual" | "single-audio" | "dual";

interface TrialManagementProps {
  nLevel: number;
  numTrials: number;
  gameMode: GameMode;
  stimulusDurationMsInitial: number;
  isPracticeMode: boolean;
  // audioEnabled: boolean; // Not directly used here if playAudioLetter is from stimulus hook
  visualMatches: ReadonlyArray<boolean>;
  generateStimulus: () => { newPosition: number; newLetter: string; visualMatch: boolean; audioMatch: boolean };
  playAudioLetter: (letter: string) => void;
  onAllTrialsComplete: () => void;
}

export const useTrialManagement = ({
  nLevel, // nLevel is used for context but not directly in most trial logic here
  numTrials,
  gameMode,
  stimulusDurationMsInitial,
  isPracticeMode,
  visualMatches,
  generateStimulus,
  playAudioLetter,
  onAllTrialsComplete,
}: TrialManagementProps) => {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [stimulusDurationMs, setStimulusDurationMs] = useState(stimulusDurationMsInitial);

  const [currentPosition, setCurrentPosition] = useState<number | null>(null);
  const [currentLetter, setCurrentLetter] = useState<string>("");

  const [userVisualResponses, setUserVisualResponses] = useState<boolean[]>([]);
  const [userAudioResponses, setUserAudioResponses] = useState<boolean[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [visualResponseMadeThisTrial, setVisualResponseMadeThisTrial] = useState(false);
  const [audioResponseMadeThisTrial, setAudioResponseMadeThisTrial] = useState(false);

  const trialTimeoutRef = useRef<NodeJS.Timeout>();
  const startTrialFnRef = useRef<() => void>(); // Changed name to avoid confusion
  const postDualResponseDelayRef = useRef<NodeJS.Timeout>();

  const advanceTrial = useCallback(() => {
    setCurrentTrial(prev => {
      const nextTrialIndex = prev + 1;
      if (nextTrialIndex < numTrials && startTrialFnRef.current) {
        setTimeout(() => startTrialFnRef.current?.(), 1000);
      }
      return nextTrialIndex;
    });
  }, [numTrials]);

  const handleTrialTimeout = useCallback(() => {
    if (isPracticeMode && currentTrial < visualMatches.length) { // Ensure visualMatches is populated
      const visualExpected = visualMatches[currentTrial];
      if (visualExpected) {
        toast.error("Missed Match!", { duration: 1500 });
      } else {
        toast.info("Correct: No match there.", { duration: 1500 });
      }
    }

    setIsWaitingForResponse(false);
    setCurrentPosition(null);
    setCurrentLetter("");

    setResponseTimes(prev => [...prev, stimulusDurationMs]);
    advanceTrial();
  }, [isPracticeMode, currentTrial, visualMatches, stimulusDurationMs, advanceTrial]);

  const startSingleTrialExecution = useCallback(() => {
    if (currentTrial >= numTrials) return;

    const { newPosition, newLetter } = generateStimulus();

    setCurrentPosition(newPosition);
    setCurrentLetter(newLetter);
    setVisualResponseMadeThisTrial(false);
    setAudioResponseMadeThisTrial(false);
    setIsWaitingForResponse(true);
    setTrialStartTime(Date.now());

    if ((gameMode === "single-audio" || gameMode === "dual")) {
      playAudioLetter(newLetter);
    }

    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
    trialTimeoutRef.current = setTimeout(handleTrialTimeout, stimulusDurationMs);

  }, [
    currentTrial, numTrials, generateStimulus, gameMode, playAudioLetter,
    handleTrialTimeout, stimulusDurationMs
  ]);

  useEffect(() => {
    startTrialFnRef.current = startSingleTrialExecution;
  }, [startSingleTrialExecution]);

  const handleResponse = useCallback((responseType: "visual" | "audio") => {
    if (!isWaitingForResponse || currentTrial >= numTrials) return;

    const responseTime = Date.now() - trialStartTime;
    setResponseTimes(prev => [...prev, responseTime]);

    const trialIndexToUpdate = currentTrial;

    let tempVisualResponseMade = visualResponseMadeThisTrial;
    let tempAudioResponseMade = audioResponseMadeThisTrial;

    if (responseType === "visual") {
      if (!tempVisualResponseMade) { // Only process if not already responded for this type
        setUserVisualResponses(prev => {
          const newResponses = [...prev];
          if (trialIndexToUpdate < newResponses.length) newResponses[trialIndexToUpdate] = true;
          return newResponses;
        });
        setVisualResponseMadeThisTrial(true);
        tempVisualResponseMade = true;
      }
    } else {
      if (!tempAudioResponseMade) { // Only process if not already responded for this type
        setUserAudioResponses(prev => {
          const newResponses = [...prev];
          if (trialIndexToUpdate < newResponses.length) newResponses[trialIndexToUpdate] = true;
          return newResponses;
        });
        setAudioResponseMadeThisTrial(true);
        tempAudioResponseMade = true;
      }
    }

    if (isPracticeMode && responseType === "visual" && visualResponseMadeThisTrial && trialIndexToUpdate < visualMatches.length) {
      // Feedback only on the first visual response for this trial in practice mode
      const visualExpected = visualMatches[trialIndexToUpdate];
      if (visualExpected) toast.success("Correct Match!", { duration: 1500 });
      else toast.warning("Oops! That wasn't a match (False Alarm).", { duration: 1500 });
    }

    const performTrialAdvancement = () => {
      setIsWaitingForResponse(false);
      setCurrentPosition(null);
      setCurrentLetter("");
      advanceTrial();
    };

    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);

    if (gameMode === "dual") {
      if (tempVisualResponseMade && tempAudioResponseMade) { // Check using temp local vars for this call
        if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current);
        postDualResponseDelayRef.current = setTimeout(performTrialAdvancement, 750);
      }
    } else {
      performTrialAdvancement();
    }
  }, [
    isWaitingForResponse, currentTrial, numTrials, trialStartTime, gameMode,
    visualResponseMadeThisTrial, audioResponseMadeThisTrial,
    isPracticeMode, visualMatches, advanceTrial
  ]);

  useEffect(() => {
    setUserVisualResponses(Array(numTrials).fill(false));
    setUserAudioResponses(Array(numTrials).fill(false));
    setResponseTimes([]);
    // setCurrentTrial(0); // Resetting currentTrial here could cause issues if numTrials changes mid-session
                         // Better to reset currentTrial when a new game explicitly starts.
  }, [numTrials]); // Only re-initialize if numTrials itself changes.

  useEffect(() => {
    if (currentTrial === numTrials && numTrials > 0) {
        if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
        if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current);
        setIsWaitingForResponse(false);
        onAllTrialsComplete();
    }
  }, [currentTrial, numTrials, onAllTrialsComplete]);

  useEffect(() => {
    return () => {
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
      if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current);
    };
  }, []);

  const initiateFirstTrial = useCallback(() => {
    setCurrentTrial(0);
    setUserVisualResponses(Array(numTrials).fill(false));
    setUserAudioResponses(Array(numTrials).fill(false));
    setResponseTimes([]);
    setCurrentPosition(null);
    setCurrentLetter("");
    setVisualResponseMadeThisTrial(false);
    setAudioResponseMadeThisTrial(false);
    setIsWaitingForResponse(false);

    if (startTrialFnRef.current) {
      setTimeout(() => startTrialFnRef.current?.(), 100);
    }
  }, [numTrials]); // startSingleTrialExecution (via ref) is not needed as dep if ref itself is stable

  const resetTrialStatesAndTimers = useCallback(() => { // Renamed for clarity
    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
    if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current);
    // Don't reset currentTrial to 0 here, that's for starting a new game.
    // This is more for pausing or stopping current trial processes.
    setCurrentPosition(null);
    setCurrentLetter("");
    setVisualResponseMadeThisTrial(false);
    setAudioResponseMadeThisTrial(false);
    setIsWaitingForResponse(false);
  }, []);

  return {
    currentTrial,
    stimulusDurationMs,
    setStimulusDurationMs,
    currentPosition,
    currentLetter,
    isWaitingForResponse,
    userVisualResponses,
    userAudioResponses,
    responseTimes,
    handleResponse,
    initiateFirstTrial,
    resetTrialStates: resetTrialStatesAndTimers, // Expose the renamed clearer function
    visualResponseMadeThisTrial,
    audioResponseMadeThisTrial
  };
};
