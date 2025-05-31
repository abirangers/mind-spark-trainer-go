import { useState, useCallback, useEffect, useRef } from "react";

export interface StimulusGenerationHookProps {
  nLevel: number;
  audioEnabled: boolean;
  letters?: string[];
}

export const useStimulusGeneration = ({ nLevel, audioEnabled, letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] }: StimulusGenerationHookProps) => {
  const [visualSequence, setVisualSequence] = useState<number[]>([]);
  const [audioSequence, setAudioSequence] = useState<string[]>([]);
  const [visualMatches, setVisualMatches] = useState<boolean[]>([]);
  const [audioMatches, setAudioMatches] = useState<boolean[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current && audioEnabled) { // Check audioEnabled before cancelling
        synthRef.current.cancel();
      }
    };
  }, [audioEnabled]); // audioEnabled dependency ensures synthRef is managed if audio is toggled

  const generateStimulus = useCallback(() => {
    const newPosition = Math.floor(Math.random() * 9);
    const newLetter = letters[Math.floor(Math.random() * letters.length)];
    let vMatch = false;
    setVisualSequence(currentSeq => {
      const updatedSeq = [...currentSeq, newPosition];
      // Ensure nLevel is at least 0 for array indexing, though nLevel is usually 1+
      // Match calculation should be based on the *newly updated* sequence state.
      if (updatedSeq.length > nLevel && nLevel >= 0) { // Check nLevel >=0 for safety, though practically it's 1+
        vMatch = updatedSeq[updatedSeq.length - 1 - nLevel] === newPosition;
      } else {
        vMatch = false;
      }
      return updatedSeq;
    });
    setVisualMatches(prev => [...prev, vMatch]); // vMatch is set correctly before this state update

    let aMatch = false;
    setAudioSequence(currentSeq => {
      const updatedSeq = [...currentSeq, newLetter];
      if (updatedSeq.length > nLevel && nLevel >= 0) {
        aMatch = updatedSeq[updatedSeq.length - 1 - nLevel] === newLetter;
      } else {
        aMatch = false;
      }
      return updatedSeq;
    });
    setAudioMatches(prev => [...prev, aMatch]); // aMatch is set correctly
    return { newPosition, newLetter, visualMatch: vMatch, audioMatch: aMatch };
  }, [nLevel, letters]);

  const playAudioLetter = useCallback((letter: string) => {
    if (!audioEnabled || !synthRef.current) return;
    synthRef.current.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.rate = 1.0; utterance.pitch = 1.0; utterance.volume = 1.0;
    synthRef.current.speak(utterance);
  }, [audioEnabled]); // synthRef.current is a ref, not needed in dep array if its assignment is stable

  const resetStimulusSequences = useCallback(() => {
    setVisualSequence([]); setAudioSequence([]); setVisualMatches([]); setAudioMatches([]);
  }, []);

  const cancelCurrentSpeech = useCallback(() => {
    if (synthRef.current && audioEnabled) { // Check audioEnabled
      synthRef.current.cancel();
    }
  }, [audioEnabled]); // audioEnabled dependency

  return {
    visualSequence, audioSequence, visualMatches, audioMatches,
    generateStimulus, playAudioLetter, resetStimulusSequences, cancelCurrentSpeech,
  };
};
