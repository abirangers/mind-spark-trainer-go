import { useState, useEffect } from 'react';

const DEMO_SEQUENCE = [1, 5, 5, 2, 3, 3, 7, 0, 7]; // Example sequence
const DEMO_INTERVAL_MS = 1500; // Interval between steps
const MAX_LOOPS = 2; // Number of times to loop the demo

const VisualDemo1Back = () => {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [highlightedSquare, setHighlightedSquare] = useState<number | null>(null);
  const [isMatch, setIsMatch] = useState(false);
  const [loopCount, setLoopCount] = useState(0);

  useEffect(() => {
    if (loopCount >= MAX_LOOPS) {
      // Stop demo after MAX_LOOPS
      setHighlightedSquare(null); // Clear highlight at the end
      setIsMatch(false);
      return;
    }

    const timer = setTimeout(() => {
      const currentIndex = currentDemoIndex % DEMO_SEQUENCE.length;
      const currentSquare = DEMO_SEQUENCE[currentIndex];
      setHighlightedSquare(currentSquare);

      if (currentIndex > 0) {
        setIsMatch(currentSquare === DEMO_SEQUENCE[currentIndex - 1]);
      } else {
        setIsMatch(false); // No match on the very first item
      }

      if (currentIndex === DEMO_SEQUENCE.length - 1) {
        setLoopCount(prevLoopCount => prevLoopCount + 1);
      }
      setCurrentDemoIndex(prevIndex => prevIndex + 1);

    }, DEMO_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [currentDemoIndex, loopCount]);

  // Reset animation if component is re-rendered (e.g. navigating away and back to tutorial step)
  useEffect(() => {
    setCurrentDemoIndex(0);
    setHighlightedSquare(null);
    setIsMatch(false);
    setLoopCount(0);
  }, []);


  return (
    <div className="flex flex-col items-center my-4">
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[...Array(9)].map((_, index) => (
          <div
            key={index}
            className={`
              w-16 h-16 border-2 rounded-lg flex items-center justify-center
              transition-all duration-300 ease-in-out
              ${highlightedSquare === index
                ? (isMatch ? 'bg-green-400 border-green-600 shadow-lg' : 'bg-blue-500 border-blue-600 shadow-lg')
                : 'bg-gray-100 border-gray-300'}
            `}
          >
            {/* Optionally display index or other info: {index} */}
          </div>
        ))}
      </div>
      {isMatch && highlightedSquare !== null && (
        <p className="text-green-600 font-bold text-lg animate-pulse">
          Match!
        </p>
      )}
      {loopCount >= MAX_LOOPS && currentDemoIndex > 0 && (
         <p className="text-gray-500 font-bold text-md mt-2">Demo complete.</p>
      )}
    </div>
  );
};

export default VisualDemo1Back;
