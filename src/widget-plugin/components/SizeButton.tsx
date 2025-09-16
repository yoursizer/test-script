import React from 'react';

interface SizeButtonProps {
  size: string;
  isSelected: boolean;
  isIdeal?: boolean;
  isNearBoundary?: boolean;
  onClick: () => void;
}

export const SizeButton: React.FC<SizeButtonProps> = ({
  size,
  isSelected,
  isIdeal = false,
  isNearBoundary = false,
  onClick
}) => {
  const getButtonStyles = () => {
    if (isSelected) {
      if (isIdeal) {
        return "bg-green-100 border-2 border-green-500 text-green-700";
      } else if (isNearBoundary) {
        return "bg-yellow-100 border-2 border-yellow-500 text-yellow-700";
      } else {
        return "bg-gray-100 border-2 border-gray-500 text-gray-700";
      }
    } else {
      // When not selected, show permanent styling for special buttons
      if (isIdeal) {
        return "bg-gray-100 border-2 border-green-500 text-green-700 hover:bg-gray-200";
      } else if (isNearBoundary) {
        return "bg-gray-100 border-2 border-yellow-500 text-yellow-700 hover:bg-gray-200";
      }
    }
    return "bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200";
  };

  const showTick = isIdeal || isNearBoundary; // Always show tick for special buttons
  const tickColor = isIdeal ? "bg-green-500" : "bg-yellow-500";

  return (
    <button 
      onClick={onClick}
      className={`relative w-24 h-12 rounded-lg font-medium text-lg transition-all ${getButtonStyles()}`}
    >
      {size}
      {showTick && (
        <div className={`absolute -top-2 -right-2 w-6 h-6 ${tickColor} rounded-full flex items-center justify-center`}>
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
};