import React from 'react'

interface VisualGridProps {
  currentPosition: number | null
  gridSize?: number
}

export const VisualGrid: React.FC<VisualGridProps> = ({ 
  currentPosition, 
  gridSize = 9 
}) => {
  return (
    <div className="text-center">
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {[...Array(gridSize)].map((_, index) => (
          <div
            key={index}
            className={`w-20 h-20 border-2 rounded-lg transition-all duration-200 ${
              currentPosition === index
                ? 'bg-blue-500 border-blue-400 shadow-lg'
                : 'bg-gray-100 border-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
