import React from 'react'

interface AudioDisplayProps {
  currentLetter: string
}

export const AudioDisplay: React.FC<AudioDisplayProps> = ({ currentLetter }) => {
  return (
    <div className="text-center">
      <div
        className={`text-6xl font-bold transition-all duration-200 ${
          currentLetter ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        {currentLetter || '?'}
      </div>
    </div>
  )
}
