import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export type GameMode = "single-visual" | "single-audio" | "dual";

// Placeholder for the data structure expected by onAllTrialsComplete (i.e., gameLogic.endSession)
interface EndSessionResultsData {
  visualMatches: ReadonlyArray<boolean>;
  audioMatches: ReadonlyArray<boolean>;
  userVisualResponses: ReadonlyArray<boolean>;
  userAudioResponses: ReadonlyArray<boolean>;
  responseTimes: ReadonlyArray<number>;
}

/**
 * Props for the useTrialManagement hook.
 */
interface TrialManagementProps {
  nLevel: number;
  numTrials: number;
  gameMode: GameMode;
  stimulusDurationMsInitial: number;
  isPracticeMode: boolean;
  visualMatches: ReadonlyArray<boolean>;
  audioMatches: ReadonlyArray<boolean>; // Added for endSession data
  generateStimulus: () => {
    newPosition: number;
    newLetter: string;
    visualMatch: boolean;
    audioMatch: boolean;
  };
  playAudioLetter: (letter: string) => void;
  onAllTrialsComplete: (resultsData: EndSessionResultsData) => void; // Updated signature
}

/**
 * Custom hook to manage the lifecycle and state of individual trials within a game session.
 * It handles trial timing, user responses, stimulus presentation calls, practice mode feedback,
 * and advancing through trials until completion.
 *
 * @param {TrialManagementProps} props - Properties to configure trial management.
 * @returns An object containing trial state, response data, and functions to manage trials.
 */
export const useTrialManagement = ({
  numTrials,
  gameMode,
  stimulusDurationMsInitial,
  isPracticeMode,
  visualMatches,
  audioMatches, // Destructure new prop
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
  const startTrialFnRef = useRef<() => void>();
  const postDualResponseDelayRef = useRef<NodeJS.Timeout>();

  // Store the current trial's visual match status for timeout handling
  const currentTrialVisualMatchRef = useRef<boolean>(false);

  const advanceTrial = useCallback(() => {
    setCurrentTrial((prev) => {
      const nextTrialIndex = prev + 1;
      if (nextTrialIndex < numTrials && startTrialFnRef.current) {
        setTimeout(() => startTrialFnRef.current?.(), 1000);
      }
      return nextTrialIndex;
    });
  }, [numTrials]);

  const handleTrialTimeout = useCallback(() => {
    console.log("handleTrialTimeout called:", {
      isPracticeMode,
      currentTrial,
      visualMatchesLength: visualMatches.length,
      visualExpectedFromRef: currentTrialVisualMatchRef.current,
      visualExpectedFromArray: visualMatches[currentTrial],
    });

    if (isPracticeMode) {
      const visualExpected = currentTrialVisualMatchRef.current;
      console.log("Showing toast for trial", currentTrial, "visualExpected:", visualExpected);
      if (visualExpected) {
        toast.error("Missed Match!", { duration: 1500 });
      } else {
        toast.info("Correct: No match there.", { duration: 1500 });
      }
    }

    setIsWaitingForResponse(false);
    setCurrentPosition(null);
    setCurrentLetter("");

    setResponseTimes((prev) => [...prev, stimulusDurationMs]);
    advanceTrial();
  }, [isPracticeMode, currentTrial, visualMatches, stimulusDurationMs, advanceTrial]);

  const startSingleTrialExecution = useCallback(() => {
    if (currentTrial >= numTrials) return;

    const { newPosition, newLetter, visualMatch } = generateStimulus();

    // Store the visual match result for this trial in the ref
    currentTrialVisualMatchRef.current = visualMatch;

    setCurrentPosition(newPosition);
    setCurrentLetter(newLetter);
    setVisualResponseMadeThisTrial(false);
    setAudioResponseMadeThisTrial(false);
    setIsWaitingForResponse(true);
    setTrialStartTime(Date.now());

    if (gameMode === "single-audio" || gameMode === "dual") {
      playAudioLetter(newLetter);
    }

    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
    trialTimeoutRef.current = setTimeout(handleTrialTimeout, stimulusDurationMs);
  }, [
    currentTrial,
    numTrials,
    generateStimulus,
    gameMode,
    playAudioLetter,
    handleTrialTimeout,
    stimulusDurationMs,
  ]);

  useEffect(() => {
    startTrialFnRef.current = startSingleTrialExecution;
  }, [startSingleTrialExecution]);

  const handleResponse = useCallback(
    (responseType: "visual" | "audio") => {
      if (!isWaitingForResponse || currentTrial >= numTrials) return;

      const responseTime = Date.now() - trialStartTime;
      setResponseTimes((prev) => [...prev, responseTime]);

      const trialIndexToUpdate = currentTrial;

      let tempVisualResponseMade = visualResponseMadeThisTrial;
      let tempAudioResponseMade = audioResponseMadeThisTrial;

      if (responseType === "visual") {
        if (!tempVisualResponseMade) {
          setUserVisualResponses((prev) => {
            const newResponses = [...prev];
            if (trialIndexToUpdate < newResponses.length) newResponses[trialIndexToUpdate] = true;
            return newResponses;
          });
          setVisualResponseMadeThisTrial(true);
          tempVisualResponseMade = true;
        }
      } else {
        if (!tempAudioResponseMade) {
          setUserAudioResponses((prev) => {
            const newResponses = [...prev];
            if (trialIndexToUpdate < newResponses.length) newResponses[trialIndexToUpdate] = true;
            return newResponses;
          });
          setAudioResponseMadeThisTrial(true);
          tempAudioResponseMade = true;
        }
      }

      if (isPracticeMode && responseType === "visual" && visualResponseMadeThisTrial) {
        const visualExpected = currentTrialVisualMatchRef.current;
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
        if (tempVisualResponseMade && tempAudioResponseMade) {
          if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current);
          postDualResponseDelayRef.current = setTimeout(performTrialAdvancement, 750);
        }
      } else {
        performTrialAdvancement();
      }
    },
    [
      isWaitingForResponse,
      currentTrial,
      numTrials,
      trialStartTime,
      gameMode,
      visualResponseMadeThisTrial,
      audioResponseMadeThisTrial,
      isPracticeMode,
      advanceTrial,
    ]
  );

  useEffect(() => {
    setUserVisualResponses(Array(numTrials).fill(false));
    setUserAudioResponses(Array(numTrials).fill(false));
    setResponseTimes([]);
    setCurrentTrial(0); // Reset current trial when numTrials changes
  }, [numTrials]);

  useEffect(() => {
    if (currentTrial === numTrials && numTrials > 0) {
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
      if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current);
      setIsWaitingForResponse(false);
      onAllTrialsComplete({
        visualMatches, // Prop
        audioMatches, // Prop
        userVisualResponses, // Local state
        userAudioResponses, // Local state
        responseTimes, // Local state
      });
    }
  }, [
    currentTrial,
    numTrials,
    onAllTrialsComplete,
    visualMatches,
    audioMatches,
    userVisualResponses,
    userAudioResponses,
    responseTimes,
  ]);

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

    // Test toast to verify Sonner is working
    if (isPracticeMode) {
      console.log("Practice mode starting - testing toast");
      toast.info("Practice mode started! Let timeouts happen to see feedback.", { duration: 2000 });
    }

    if (startTrialFnRef.current) {
      setTimeout(() => startTrialFnRef.current?.(), 100);
    }
  }, [numTrials, isPracticeMode]);

  const resetTrialStatesAndTimers = useCallback(() => {
    if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
    if (postDualResponseDelayRef.current) clearTimeout(postDualResponseDelayRef.current);
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
    resetTrialStates: resetTrialStatesAndTimers,
    visualResponseMadeThisTrial,
    audioResponseMadeThisTrial,
  };
};
