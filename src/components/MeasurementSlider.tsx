import React, { useMemo } from "react";

interface MeasurementSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  labels?: string[];
  label: string;
  // Smart slider props
  jsonIndicator?: number;
  showJsonIndicator?: boolean;
  isModifiedFromJson?: boolean;
  canIncrease?: boolean;
  canDecrease?: boolean;
}

export const MeasurementSlider: React.FC<MeasurementSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  labels,
  label,
  jsonIndicator,
  showJsonIndicator = false,
  isModifiedFromJson = false,
  canIncrease = true,
  canDecrease = true,
}) => {
  const internalLabels = labels ?? ['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide'];

  const currentLabel = useMemo(() => {
    const range = max - min;
    if (range <= 0) return internalLabels[Math.floor(internalLabels.length / 2)] || 'Normal';
    const percent = (value - min) / range;
    const index = Math.round(percent * (internalLabels.length - 1));
    return internalLabels[index] || 'Normal';
  }, [value, min, max, internalLabels]);

  // Calculate positions for indicators
  const getIndicatorPosition = (indicatorValue: number) => {
    const range = max - min;
    if (range <= 0) return 50;
    const percentage = ((indicatorValue - min) / range) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const jsonIndicatorPosition = jsonIndicator !== undefined ? getIndicatorPosition(jsonIndicator) : 0;
  const currentIndicatorPosition = getIndicatorPosition(value);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-blue-600">{currentLabel}</span>
          {!canIncrease && <span className="text-xs text-red-500">MAX</span>}
          {!canDecrease && <span className="text-xs text-red-500">MIN</span>}
        </div>
      </div>
      
      {/* Slider Container with Indicators */}
      <div className="relative mb-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 relative z-10"
        />
      </div>
      
      <div
        className="w-full flex justify-between text-xs text-gray-500 px-1 mt-1"
        aria-hidden="true"
      >
        {internalLabels.map((l, i) => (
          <span key={i} className="w-1/5 text-center">{l}</span>
        ))}
      </div>
    </div>
  );
}; 