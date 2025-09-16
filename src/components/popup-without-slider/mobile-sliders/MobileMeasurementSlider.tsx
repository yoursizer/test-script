import React from "react";

interface MobileMeasurementSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  labels: string[];
  label: string;
}

export const MobileMeasurementSlider: React.FC<MobileMeasurementSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  labels,
  label,
}) => {
  const positions = labels.map((_, i) => i / (labels.length - 1));

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handleMinus = () => {
    onChange(Math.max(min, value - step));
  };

  const handlePlus = () => {
    onChange(Math.min(max, value + step));
  };

  return (
    <div className="w-full flex flex-col items-center pb-6 min-h-[120px]">
      <label className="mb-2 text-base font-semibold text-gray-800">{label}: {value.toFixed(1)} cm</label>
      <div className="flex items-center w-full gap-2">
        <button
          type="button"
          onClick={handleMinus}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-lg font-bold bg-white hover:bg-gray-100 disabled:opacity-50"
        >
          –
        </button>
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSlider}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-blue-600 focus:outline-none"
            style={{ zIndex: 2, position: "relative" }}
          />
          <div className="absolute left-0 right-0 top-7 w-full flex justify-between" style={{zIndex: 1, height: '2.2rem', gap: 0}}>
            {labels.map((labelText, i) => (
              <div
                key={labelText}
                className="flex flex-col items-center"
                style={{
                  position: "absolute",
                  left: `${positions[i] * 100}%`,
                  transform: "translateX(-50%)",
                  width: 'max-content',
                  minWidth: 30,
                  fontSize: 12,
                  margin: '0 2px',
                  padding: 0,
                }}
              >
                <div className="w-0.5 h-3 bg-gray-400 mb-1" />
                <span className="text-xs text-gray-700 whitespace-nowrap px-0.5 text-center" style={{lineHeight: '1.1'}}>{labelText}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handlePlus}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-lg font-bold bg-white hover:bg-gray-100 disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
}; 