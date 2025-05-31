import { useRef, useEffect, useCallback } from 'react';

interface UseSpeechSynthesisProps {
  audioEnabled: boolean;
}

export const useSpeechSynthesis = ({ audioEnabled }: UseSpeechSynthesisProps) => {
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      // console.log('Speech synthesis initialized via hook:', synthRef.current);
    }

    return () => {
      if (synthRef.current) {
        // console.log('Cancelling speech synthesis on hook cleanup.');
        synthRef.current.cancel();
      }
    };
  }, []); // Initialize only once, actual playing depends on audioEnabled prop passed to playLetter

  const playLetter = useCallback((letter: string) => {
    if (!audioEnabled || !synthRef.current) {
      // console.log('Audio disabled or synth not ready. Letter:', letter, 'Enabled:', audioEnabled);
      return;
    }

    // console.log('Hook: Playing audio for letter:', letter);

    synthRef.current.cancel(); // Cancel any ongoing speech before speaking anew

    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.rate = 1.0; // Consider making these configurable
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    synthRef.current.speak(utterance);
  }, [audioEnabled]); // Depends on audioEnabled to decide if it should play

  return { playLetter };
};
