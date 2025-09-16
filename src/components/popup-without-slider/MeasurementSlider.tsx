import React, { useMemo } from "react";

interface MeasurementSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  labels?: string[];
  label: string;
}

export const MeasurementSlider: React.FC<MeasurementSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  labels,
  label,
}) => {
  const internalLabels = labels ?? ['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide'];

  const currentLabel = useMemo(() => {
    const range = max - min;
    if (range <= 0) return internalLabels[Math.floor(internalLabels.length / 2)] || 'Normal';
    const percent = (value - min) / range;
    const index = Math.round(percent * (internalLabels.length - 1));
    return internalLabels[index] || 'Normal';
  }, [value, min, max, internalLabels]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-blue-600">{currentLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
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