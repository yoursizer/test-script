import React, { useState, useEffect } from 'react';
import { calculateSliderConfig, getSliderConfigForMeasurement } from '../utils/sliderLogicTest';

interface SmartSliderProps {
  measurementType: 'chest' | 'waist' | 'hips';
  jsonValue: number;
  gender: 'male' | 'female';
  onValueChange: (value: number) => void;
  className?: string;
}

export const SmartSlider: React.FC<SmartSliderProps> = ({
  measurementType,
  jsonValue,
  gender,
  onValueChange,
  className = ''
}) => {
  const [currentValue, setCurrentValue] = useState(jsonValue);
  const [sliderConfig, setSliderConfig] = useState(() => 
    getSliderConfigForMeasurement(measurementType, jsonValue, gender)
  );

  // Update slider config when props change
  useEffect(() => {
    const newConfig = getSliderConfigForMeasurement(measurementType, jsonValue, gender);
    setSliderConfig(newConfig);
    setCurrentValue(jsonValue);
  }, [measurementType, jsonValue, gender]);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value);
    setCurrentValue(newValue);
    onValueChange(newValue);
  };

  const getTickPosition = (value: number) => {
    const percentage = ((value - sliderConfig.min) / (sliderConfig.max - sliderConfig.min)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const jsonIndicatorPosition = getTickPosition(sliderConfig.indicatorPosition);
  const currentIndicatorPosition = getTickPosition(currentValue);

  return (
    <div className={`smart-slider ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700 capitalize">
          {measurementType}
        </label>
        <span className="text-sm text-gray-600">
          {currentValue} cm
        </span>
      </div>

      {/* Slider Container */}
      <div className="relative">
        {/* Slider Track */}
        <div className="relative h-6 bg-gray-200 rounded-full">
          {/* JSON Indicator (Blue) */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md z-20"
            style={{ left: `calc(${jsonIndicatorPosition}% - 6px)` }}
            title={`JSON Value: ${sliderConfig.indicatorPosition}`}
          />
          
          {/* Current Value Indicator (Red) */}
          {currentValue !== sliderConfig.indicatorPosition && (
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md z-20"
              style={{ left: `calc(${currentIndicatorPosition}% - 6px)` }}
              title={`Current Value: ${currentValue}`}
            />
          )}
          
          {/* Slider Input */}
          <input
            type="range"
            min={sliderConfig.min}
            max={sliderConfig.max}
            value={currentValue}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-6 opacity-0 cursor-pointer z-30"
          />
          
          {/* Step Markers */}
          <div className="absolute inset-0 flex items-center justify-between px-1">
            {sliderConfig.steps.map((step, index) => (
              <div
                key={index}
                className="w-1 h-1 bg-gray-400 rounded-full"
                title={`${step} cm`}
              />
            ))}
          </div>
        </div>

        {/* Range Labels */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{sliderConfig.min}</span>
          <span>{sliderConfig.max}</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
            <span className="text-gray-600">JSON ({sliderConfig.indicatorPosition})</span>
          </div>
          {currentValue !== sliderConfig.indicatorPosition && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
              <span className="text-gray-600">Current ({currentValue})</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-1">
          {!sliderConfig.canDecrease && (
            <span className="text-red-400 text-xs">Min</span>
          )}
          {!sliderConfig.canIncrease && (
            <span className="text-red-400 text-xs">Max</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Demo component to test the slider
export const SmartSliderDemo: React.FC = () => {
  const [measurements, setMeasurements] = useState({
    chest: 95,
    waist: 80,
    hips: 137 // Edge case test
  });
  const [gender] = useState<'male' | 'female'>('female');

  const handleMeasurementChange = (type: 'chest' | 'waist' | 'hips', value: number) => {
    console.log('[setMeasurements] SmartSlider.tsx: slider override', type, value);
    setMeasurements(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Smart Slider Demo</h2>
      <p className="text-sm text-gray-600 mb-6">
        Blue indicator shows JSON value, red shows current value (if different)
      </p>
      
      <div className="space-y-6">
        <SmartSlider
          measurementType="chest"
          jsonValue={measurements.chest}
          gender={gender}
          onValueChange={(value) => handleMeasurementChange('chest', value)}
        />
        
        <SmartSlider
          measurementType="waist"
          jsonValue={measurements.waist}
          gender={gender}
          onValueChange={(value) => handleMeasurementChange('waist', value)}
        />
        
        <SmartSlider
          measurementType="hips"
          jsonValue={measurements.hips}
          gender={gender}
          onValueChange={(value) => handleMeasurementChange('hips', value)}
        />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="text-sm font-medium mb-2">Current Values:</h3>
        <div className="text-sm space-y-1">
          <div>Chest: {measurements.chest} cm</div>
          <div>Waist: {measurements.waist} cm</div>
          <div>Hips: {measurements.hips} cm (Edge case!)</div>
        </div>
      </div>
    </div>
  );
};
