/**
 * Slider Utilities
 * Consolidated slider configuration and helper functions
 */

import { MEASUREMENT_LIMITS, WEIGHT_LIMITS, UNIT_CONVERSION } from '../constants/sizing-assistant';

/**
 * Common slider labels for different measurement types
 */
export const SLIDER_LABELS = {
  chest: ["Very Narrow", "Narrow", "Normal", "Wide", "Very Wide"],
  waist: ["Very Slim", "Slim", "Normal", "Broad", "Very Broad"],
  hips: ["Very Narrow", "Narrow", "Normal", "Wide", "Very Wide"],
  general: ['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide']
};

/**
 * Get dynamic range for measurement types based on fetched data
 */
export function getDynamicMeasurementRange(
  measurementType: 'chest' | 'waist' | 'hips',
  debugData: any,
  getLocalJSONBasedLimits: (type: 'chest' | 'waist' | 'hips') => { min: number; max: number; default: number }
): { min: number; max: number } {
  const fetchedData = debugData?.heightWeight?.fetchedData?.measurements;
  
  if (fetchedData) {
    let fetchedValue = 0;
    if (measurementType === 'chest') fetchedValue = fetchedData.chest;
    else if (measurementType === 'waist') fetchedValue = fetchedData.waist;
    else if (measurementType === 'hips') fetchedValue = fetchedData.hip; // Note: 'hip' not 'hips'
    
    // Get absolute limits
    const absoluteLimits = getLocalJSONBasedLimits(measurementType);
    const absoluteMin = absoluteLimits.min;
    const absoluteMax = absoluteLimits.max;
    
    let min = fetchedValue - 6;
    let max = fetchedValue + 6;
    
    // Adjust boundaries if they exceed absolute limits (always keep 12 unit range)
    if (max > absoluteMax) {
      max = absoluteMax;
      min = absoluteMax - 12;
    } else if (min < absoluteMin) {
      min = absoluteMin;
      max = absoluteMin + 12;
    }
    
    return { min, max };
  }
  
  // Fallback to default limits
  return getLocalJSONBasedLimits(measurementType);
}

/**
 * Get measurement range for display (metric/imperial)
 */
export function getDisplayRange(
  measurementType: 'height' | 'weight' | 'chest' | 'waist' | 'hips',
  useMetric: boolean,
  debugData?: any,
  getLocalJSONBasedLimits?: (type: 'chest' | 'waist' | 'hips') => { min: number; max: number; default: number }
) {
  const CM_PER_INCH = UNIT_CONVERSION.inchesToCm;
  const LBS_PER_KG = UNIT_CONVERSION.kgToLbs;

  if (measurementType === 'height') {
    return useMetric
      ? { min: MEASUREMENT_LIMITS.height.min, max: MEASUREMENT_LIMITS.height.max, step: 1 }
      : { min: Math.round(MEASUREMENT_LIMITS.height.min / CM_PER_INCH), max: Math.round(MEASUREMENT_LIMITS.height.max / CM_PER_INCH), step: 1 };
  }

  if (measurementType === 'weight') {
    return useMetric
      ? { min: WEIGHT_LIMITS.min, max: WEIGHT_LIMITS.max, step: 1 }
      : { min: Math.round(WEIGHT_LIMITS.min / LBS_PER_KG), max: Math.round(WEIGHT_LIMITS.max / LBS_PER_KG), step: 1 };
  }

  // For chest, waist, hips
  if (debugData && getLocalJSONBasedLimits) {
    const range = getDynamicMeasurementRange(measurementType as 'chest' | 'waist' | 'hips', debugData, getLocalJSONBasedLimits);
    return useMetric
      ? { min: range.min, max: range.max, step: 0.5 }
      : { min: Math.round(range.min / CM_PER_INCH), max: Math.round(range.max / CM_PER_INCH), step: 0.5 };
  }

  // Fallback to measurement limits
  const limits = MEASUREMENT_LIMITS[measurementType as keyof typeof MEASUREMENT_LIMITS];
  return useMetric
    ? { min: limits.min, max: limits.max, step: 0.5 }
    : { min: Math.round(limits.min / CM_PER_INCH), max: Math.round(limits.max / CM_PER_INCH), step: 0.5 };
}

/**
 * Format value for display
 */
export function formatValueForDisplay(
  value: number,
  measurementType: 'height' | 'weight' | 'chest' | 'waist' | 'hips',
  useMetric: boolean
): string {
  const LBS_PER_KG = UNIT_CONVERSION.kgToLbs;
  const CM_PER_INCH = UNIT_CONVERSION.inchesToCm;

  if (!useMetric) {
    if (measurementType === 'height') {
      const feet = value / UNIT_CONVERSION.cmToFeet;
      const wholeFeet = Math.floor(feet);
      const inches = Math.round((feet - wholeFeet) * 12);
      return `${wholeFeet}'${inches}"`;
    }
    if (measurementType === 'weight') return `${(value * LBS_PER_KG).toFixed(0)} lbs`;
    return `${(value / CM_PER_INCH).toFixed(1)}"`;
  }
  
  return `${value.toFixed(0)} ${measurementType === 'weight' ? 'kg' : 'cm'}`;
}

/**
 * Get current value for measurement
 */
export function getCurrentMeasurementValue(
  measurementType: 'chest' | 'waist' | 'hips',
  measurements: any,
  debugData: any
): number {
  const fetchedData = debugData?.heightWeight?.fetchedData?.measurements;
  let jsonDefault = 0;
  
  if (fetchedData) {
    if (measurementType === 'chest') jsonDefault = fetchedData.chest;
    else if (measurementType === 'waist') jsonDefault = fetchedData.waist;
    else if (measurementType === 'hips') jsonDefault = fetchedData.hip;
  }
  
  return measurements[measurementType] === '' || isNaN(parseFloat(measurements[measurementType])) 
    ? jsonDefault 
    : parseFloat(measurements[measurementType]);
}
