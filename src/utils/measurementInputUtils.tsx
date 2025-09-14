/**
 * Measurement Input Renderer Utilities
 * Consolidated measurement input rendering logic
 */

import React from 'react';
import { Info } from 'lucide-react';
import { GenericRadialSlider } from '../components/GenericRadialSlider';
import { MeasurementSlider } from '../components/MeasurementSlider';
import { MEASUREMENT_LIMITS, WEIGHT_LIMITS } from '../constants/sizing-assistant';
import { 
  getDynamicMeasurementRange, 
  getDisplayRange, 
  formatValueForDisplay, 
  getCurrentMeasurementValue 
} from './sliderUtils';
import { handleSliderMeasurementChange } from './morphUtils';
import { cmToFeet } from './measurementUtils';

/**
 * Parameters for measurement input rendering
 */
export interface MeasurementInputParams {
  type: 'height' | 'weight' | 'chest' | 'waist' | 'hips';
  isMobile: boolean;
  measurements: any;
  setMeasurements: React.Dispatch<React.SetStateAction<any>>;
  useMetric: boolean;
  getLocalJSONBasedLimits?: (type: 'chest' | 'waist' | 'hips') => { min: number; max: number; default: number };
  setShowMeasurementGuide?: (type: "chest" | "waist" | "hips" | null) => void;
  handleMorphChange?: (morphName: string, value: number) => void;
  handleWeightMorphs?: (weightValue: number) => void;
  setUserEditedMeasurements?: React.Dispatch<React.SetStateAction<any>>;
  setMeasurementsChanged?: (changed: boolean) => void;
  debugData?: any;
}

/**
 * Render measurement input based on type and context
 */
export function renderMeasurementInput(params: MeasurementInputParams): React.ReactElement {
  const {
    type,
    isMobile,
    measurements,
    setMeasurements,
    useMetric,
    getLocalJSONBasedLimits,
    setShowMeasurementGuide,
    handleMorphChange,
    handleWeightMorphs,
    setUserEditedMeasurements,
    setMeasurementsChanged,
    debugData
  } = params;

  // Handle height and weight with GenericRadialSlider
  if (type === 'height' || type === 'weight') {
    const value = parseFloat(measurements[type]) || (type === 'height' ? 170 : 75);
    
    return (
      <GenericRadialSlider
        value={value}
        onChange={(val) => {
          setMeasurements((prev: any) => ({ ...prev, [type]: val.toString() }));
          if (type === 'weight' && handleWeightMorphs) {
            handleWeightMorphs(val);
          }
        }}
        useMetric={useMetric}
        measurementType={type}
        fetchedValue={debugData?.heightWeight?.fetchedData?.measurements?.[type]}
      />
    );
  }

  // Handle chest, waist, hips measurements
  if (!getLocalJSONBasedLimits || !handleMorphChange || !setUserEditedMeasurements) {
    return <div>Missing dependencies for {type} measurement</div>;
  }

  // Enhanced slider for chest/waist/hips on both desktop and mobile
  if ((type === 'chest' || type === 'waist' || type === 'hips')) {
    const range = getDynamicMeasurementRange(type, debugData, getLocalJSONBasedLimits);
    const currentValue = getCurrentMeasurementValue(type, measurements, debugData);
    
    // Get fetched value as default
    const fetchedData = debugData?.heightWeight?.fetchedData?.measurements;
    let jsonDefault = (range.min + range.max) / 2;
    if (fetchedData) {
      if (type === 'chest') jsonDefault = fetchedData.chest;
      else if (type === 'waist') jsonDefault = fetchedData.waist;
      else if (type === 'hips') jsonDefault = fetchedData.hip;
    }

    const handleSliderChange = (v: number) => {
      handleSliderMeasurementChange({
        measurementType: type,
        newValue: v,
        measurements,
        setMeasurements,
        setUserEditedMeasurements,
        getLocalJSONBasedLimits,
        handleMorphChange,
        setMeasurementsChanged,
        isMobile: false
      });
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-600">
              {formatValueForDisplay(currentValue, type, useMetric)}
            </span>
            {setShowMeasurementGuide && (
              <button
                onClick={() => setShowMeasurementGuide(type)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <MeasurementSlider
          value={currentValue}
          onChange={handleSliderChange}
          min={range.min}
          max={range.max}
          step={0.5}
          label=""
        />
        {/* JSON default indicator */}
        <div className="relative h-2">
          <div 
            className="absolute w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2"
            style={{ 
              left: `${((jsonDefault - range.min) / (range.max - range.min)) * 100}%`,
              top: '-4px'
            }}
            title={`JSON default: ${jsonDefault.toFixed(1)}cm`}
          />
        </div>
      </div>
    );
  }

  // Fallback for other cases
  return (
    <div className="text-gray-500">
      Measurement input for {type} not implemented for this context
    </div>
  );
}
