import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Props for the useStimulusGeneration hook.
 */
export interface StimulusGenerationHookProps {
  nLevel: number;
  audioEnabled: boolean;
  letters?: string[];
}

/**
 * Custom hook for managing the generation and presentation of visual and audio stimuli.
 * It handles creating sequences, tracking N-back matches, and interfacing with speech synthesis.
 *
 * @param {StimulusGenerationHookProps} props - Properties to configure stimulus generation.
 * @returns An object containing stimulus sequences, match data, and functions to control stimuli.
 */
export const useStimulusGeneration = ({
  nLevel,
  audioEnabled,
  letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"],
}: StimulusGenerationHookProps) => {
  const [visualSequence, setVisualSequence] = useState<number[]>([]);
  const [audioSequence, setAudioSequence] = useState<string[]>([]);
  const [visualMatches, setVisualMatches] = useState<boolean[]>([]);
  const [audioMatches, setAudioMatches] = useState<boolean[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Refs to track current state for synchronous access
  const visualSeqRef = useRef<number[]>([]);
  const audioSeqRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current && audioEnabled) {
        // Check audioEnabled before cancelling
        synthRef.current.cancel();
      }
    };
  }, [audioEnabled]); // audioEnabled dependency ensures synthRef is managed if audio is toggled

  const generateStimulus = useCallback(() => {
    const newPosition = Math.floor(Math.random() * 9);
    const newLetter = letters[Math.floor(Math.random() * letters.length)];

    // Calculate matches using current ref values
    const currentVisualSeq = visualSeqRef.current;
    const currentAudioSeq = audioSeqRef.current;

    const newVisualSeq = [...currentVisualSeq, newPosition];
    const newAudioSeq = [...currentAudioSeq, newLetter];

    const vMatch = newVisualSeq.length > nLevel && nLevel >= 0
      ? newVisualSeq[newVisualSeq.length - 1 - nLevel] === newPosition
      : false;

    const aMatch = newAudioSeq.length > nLevel && nLevel >= 0
      ? newAudioSeq[newAudioSeq.length - 1 - nLevel] === newLetter
      : false;

    // Update refs
    visualSeqRef.current = newVisualSeq;
    audioSeqRef.current = newAudioSeq;

    // Update state
    setVisualSequence(newVisualSeq);
    setAudioSequence(newAudioSeq);
    setVisualMatches((prev) => [...prev, vMatch]);
    setAudioMatches((prev) => [...prev, aMatch]);

    return { newPosition, newLetter, visualMatch: vMatch, audioMatch: aMatch };
  }, [nLevel, letters]);

  const playAudioLetter = useCallback(
    (letter: string) => {
      if (!audioEnabled || !synthRef.current) return;
      synthRef.current.cancel(); // Cancel any previous speech
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      synthRef.current.speak(utterance);
    },
    [audioEnabled]
  ); // synthRef.current is a ref, not needed in dep array if its assignment is stable

  const resetStimulusSequences = useCallback(() => {
    visualSeqRef.current = [];
    audioSeqRef.current = [];
    setVisualSequence([]);
    setAudioSequence([]);
    setVisualMatches([]);
    setAudioMatches([]);
  }, []);

  const cancelCurrentSpeech = useCallback(() => {
    if (synthRef.current && audioEnabled) {
      // Check audioEnabled
      synthRef.current.cancel();
    }
  }, [audioEnabled]); // audioEnabled dependency

  return {
    visualSequence,
    audioSequence,
    visualMatches,
    audioMatches,
    generateStimulus,
    playAudioLetter,
    resetStimulusSequences,
    cancelCurrentSpeech,
  };
};
