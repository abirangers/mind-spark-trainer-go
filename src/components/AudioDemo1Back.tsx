import { useState, useEffect } from "react";

const DEMO_SEQUENCE = ["C", "H", "H", "K", "S", "S", "P", "D", "D"]; // Example sequence
const DEMO_INTERVAL_MS = 1500; // Interval between steps
const MAX_LOOPS = 2; // Number of times to loop the demo

const AudioDemo1Back = () => {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [isMatch, setIsMatch] = useState(false);
  const [loopCount, setLoopCount] = useState(0);

  useEffect(() => {
    if (loopCount >= MAX_LOOPS) {
      setCurrentLetter(null); // Clear letter at the end
      setIsMatch(false);
      return;
    }

    const timer = setTimeout(() => {
      const currentIndexInSequence = currentDemoIndex % DEMO_SEQUENCE.length;
      const letter = DEMO_SEQUENCE[currentIndexInSequence];
      setCurrentLetter(letter);

      if (currentIndexInSequence > 0) {
        setIsMatch(letter === DEMO_SEQUENCE[currentIndexInSequence - 1]);
      } else {
        setIsMatch(false); // No match on the very first item
      }

      if (currentIndexInSequence === DEMO_SEQUENCE.length - 1) {
        setLoopCount((prevLoopCount) => prevLoopCount + 1);
      }
      setCurrentDemoIndex((prevIndex) => prevIndex + 1);
    }, DEMO_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [currentDemoIndex, loopCount]);

  // Reset animation if component is re-rendered
  useEffect(() => {
    setCurrentDemoIndex(0);
    setCurrentLetter(null);
    setIsMatch(false);
    setLoopCount(0);
  }, []);

  return (
    <div className="flex flex-col items-center my-4 p-4 border rounded-lg bg-gray-50">
      <div
        className={`
          w-24 h-24 border-2 rounded-lg flex items-center justify-center mb-4
          transition-all duration-300 ease-in-out
          ${isMatch && currentLetter ? "bg-green-100 border-green-500" : "bg-white border-gray-300"}
        `}
      >
        {currentLetter && (
          <span
            className={`
              text-6xl font-bold
              ${isMatch ? "text-green-600" : "text-orange-600"}
            `}
          >
            {currentLetter}
          </span>
        )}
        {!currentLetter && loopCount >= MAX_LOOPS && (
          <span className="text-xl text-gray-400">Done</span>
        )}
        {!currentLetter && loopCount < MAX_LOOPS && (
          <span className="text-xl text-gray-400">...</span>
        )}
      </div>
      {isMatch && currentLetter && (
        <p className="text-green-600 font-bold text-lg animate-pulse">Match!</p>
      )}
      {loopCount >= MAX_LOOPS && currentDemoIndex > 0 && (
        <p className="text-gray-500 font-bold text-md mt-2">Demo complete.</p>
      )}
    </div>
  );
};

export default AudioDemo1Back;
