import { useState, useCallback } from 'react';
import { GameMode } from '../types'; // Assuming types are available

// Props for the hook
export interface UseNBackEngineProps {
  nLevel: number;
  gameMode: GameMode;
  letters: string[];
}

export const useNBackEngine = ({
  nLevel,
  gameMode, // Included for future use, e.g. if stimulus generation differs by mode
  letters,
}: UseNBackEngineProps) => {
  const [visualSequence, setVisualSequence] = useState<number[]>([]);
  const [audioSequence, setAudioSequence] = useState<string[]>([]);

  // These will store whether the stimulus AT THE TIME OF ITS PRESENTATION was a match
  const [visualMatches, setVisualMatches] = useState<boolean[]>([]);
  const [audioMatches, setAudioMatches] = useState<boolean[]>([]);

  const [currentPosition, setCurrentPosition] = useState<number | null>(null);
  const [currentLetter, setCurrentLetter] = useState<string>('');

  // This is the core logic for generating a new stimulus and determining if it's a match
  const generateStimulus = useCallback(() => {
    const newPosition = Math.floor(Math.random() * 9);
    const newLetterValue = letters[Math.floor(Math.random() * letters.length)];

    // Determine matches based on the sequences *before* this new stimulus is added
    const isVisualMatch = visualSequence.length >= nLevel &&
                           visualSequence[visualSequence.length - nLevel] === newPosition;
    const isAudioMatch = audioSequence.length >= nLevel &&
                          audioSequence[audioSequence.length - nLevel] === newLetterValue;

    // Now update sequences and match arrays
    setVisualSequence(prev => [...prev, newPosition]);
    setAudioSequence(prev => [...prev, newLetterValue]);
    setVisualMatches(prev => [...prev, isVisualMatch]); // Store if this stimulus *was* a match
    setAudioMatches(prev => [...prev, isAudioMatch]);   // Store if this stimulus *was* a match

    setCurrentPosition(newPosition);
    setCurrentLetter(newLetterValue);

    return { newPosition, newLetter: newLetterValue, isVisualMatch, isAudioMatch };
  }, [nLevel, letters, visualSequence, audioSequence]); // visualSequence & audioSequence needed to calculate match

  // prepareNextTrial now directly calls generateStimulus and returns its results
  const prepareNextTrial = useCallback(() => {
    const { newLetter, isVisualMatch, isAudioMatch } = generateStimulus();
    // currentPosition and currentLetter are already set by generateStimulus's call to setStates
    return { newLetter, isVisualMatch, isAudioMatch }; // Return what's needed immediately by the caller
  }, [generateStimulus]);

  const resetEngine = useCallback(() => {
    setVisualSequence([]);
    setAudioSequence([]);
    setVisualMatches([]);
    setAudioMatches([]);
    setCurrentPosition(null);
    setCurrentLetter('');
  }, []);

  return {
    // Current stimuli
    currentPosition,
    currentLetter,

    // Sequences & Match history (primarily for scoring, might not be directly needed by UI)
    visualSequence,
    audioSequence,
    visualMatches,  // This now represents the actual N-back status of each stimulus in the sequence
    audioMatches,   // This now represents the actual N-back status of each stimulus in the sequence

    // Actions
    prepareNextTrial,
    resetEngine,
  };
};
