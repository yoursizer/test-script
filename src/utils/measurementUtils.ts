import { UNIT_CONVERSION, MEASUREMENT_LIMITS } from '../constants/sizing-assistant';
import { calculateBodyMeasurements, calculateShapeKeys } from './bodyMeasurements';

// Unit conversion utilities
export function cmToFeet(cm: number): string {
  const feet = cm / UNIT_CONVERSION.cmToFeet;
  const wholeFeet = Math.floor(feet);
  const inches = Math.round((feet - wholeFeet) * 12);
  return `${wholeFeet}'${inches}"`;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * UNIT_CONVERSION.kgToLbs);
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs / UNIT_CONVERSION.kgToLbs);
}

export function feetToCm(feet: string): number {
  const [ft, inches] = feet.split("'");
  const totalInches = parseInt(ft) * 12 + parseInt(inches);
  return Math.round(totalInches * UNIT_CONVERSION.inchesToCm);
}

// JSON-based limits calculation
interface JSONLimitsCache {
  [key: string]: {
    height: number;
    weight: number;
    gender: string;
    limits: { min: number; max: number; default: number };
  };
}

export function getJSONBasedLimits(
  measurementType: 'chest' | 'waist' | 'hips',
  height: string | number,
  weight: string | number,
  gender: 'male' | 'female' | null,
  cache?: React.MutableRefObject<JSONLimitsCache>
): { min: number; max: number; default: number } {
  // Return default limits if required parameters are missing
  if (!gender || !height || !weight) {
    return MEASUREMENT_LIMITS[measurementType] as { min: number; max: number; default: number };
  }

  const heightNum = typeof height === 'string' ? parseFloat(height) : height;
  const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
  
  if (isNaN(heightNum) || isNaN(weightNum)) {
    return MEASUREMENT_LIMITS[measurementType] as { min: number; max: number; default: number };
  }

  // Check cache if provided
  if (cache) {
    const cacheKey = `${measurementType}_${heightNum}_${weightNum}_${gender}`;
    const cached = cache.current[cacheKey];
    
    if (cached && 
        cached.height === heightNum && 
        cached.weight === weightNum && 
        cached.gender === gender) {
      return cached.limits;
    }
  }

  // Calculate measurements with fallback to defaults
  const jsonMeasurements = calculateBodyMeasurements(heightNum, weightNum, gender);
  if (jsonMeasurements && cache) {
    const baseValue = jsonMeasurements[measurementType];
    
    const clampedBaseValue = Math.min(
      Math.max(baseValue, MEASUREMENT_LIMITS[measurementType].min),
      MEASUREMENT_LIMITS[measurementType].max
    );
    
    // Calculate smart dynamic range with ±6 while respecting absolute limits
    const absoluteMin = MEASUREMENT_LIMITS[measurementType].min;
    const absoluteMax = MEASUREMENT_LIMITS[measurementType].max;
    
    const limits = calculateSmartSliderRange(clampedBaseValue, absoluteMin, absoluteMax);

    const cacheKey = `${measurementType}_${heightNum}_${weightNum}_${gender}`;
    cache.current[cacheKey] = {
      height: heightNum,
      weight: weightNum,
      gender,
      limits
    };

    console.log(`🔧 JSON-based limits for ${measurementType} (NEW):`, {
      baseValue: clampedBaseValue,
      originalRange: { min: clampedBaseValue - 6, max: clampedBaseValue + 6 },
      adjustedRange: { min: limits.min, max: limits.max },
      absoluteLimits: { min: absoluteMin, max: absoluteMax },
      rangeSpan: limits.max - limits.min,
      limits,
      jsonMeasurements: { height: heightNum, weight: weightNum, gender }
    });
  }

  // Return default limits immediately (async update will happen in background)
  return MEASUREMENT_LIMITS[measurementType] as { min: number; max: number; default: number };
}

// Simplified version without caching for one-off calculations
export function calculateJSONBasedLimits(
  measurementType: 'chest' | 'waist' | 'hips',
  height: number,
  weight: number,
  gender: 'male' | 'female'
): { min: number; max: number; default: number } {
  return getJSONBasedLimits(measurementType, height, weight, gender);
}

// Smart slider range calculation function
function calculateSmartSliderRange(
  fetchedValue: number,
  absoluteMin: number,
  absoluteMax: number
): { min: number; max: number; default: number } {
  // Always try to maintain ±6 around fetchedValue first
  let idealMin = fetchedValue - 6;
  let idealMax = fetchedValue + 6;
  
  let rangeMin, rangeMax;
  
  // If ideal range fits within absolute limits, use it
  if (idealMin >= absoluteMin && idealMax <= absoluteMax) {
    rangeMin = idealMin;
    rangeMax = idealMax;
  }
  // If we hit the upper limit, anchor to max and go back 12
  else if (idealMax > absoluteMax) {
    rangeMax = absoluteMax;
    rangeMin = Math.max(absoluteMin, rangeMax - 12);
  }
  // If we hit the lower limit, anchor to min and go forward 12
  else if (idealMin < absoluteMin) {
    rangeMin = absoluteMin;
    rangeMax = Math.min(absoluteMax, rangeMin + 12);
  }
  // Fallback (shouldn't reach here)
  else {
    rangeMin = idealMin;
    rangeMax = idealMax;
  }
  
  return {
    min: rangeMin,
    max: rangeMax,
    default: fetchedValue // Always use the fetched value as default
  };
}

// Synchronous version of getJSONBasedLimits (returns smart slider limits)
interface MeasurementRange {
  min: number;
  max: number;
  default: number;
}

export const getJSONBasedLimitsSync = (
  measurementType: 'chest' | 'waist' | 'hips',
  height: string | number,
  weight: string | number,
  gender: 'male' | 'female' | null = 'male' as 'male' | 'female' | null
): MeasurementRange => {
  // Use fetched JSON data if available, otherwise fallback to sync calculation
  const genderSpecificLimits = MEASUREMENT_LIMITS[measurementType] as { min: number; max: number; default: number };
  const absoluteMin = genderSpecificLimits.min;
  const absoluteMax = genderSpecificLimits.max;

  // Default values for calculation if not provided
  const defaultHeight = typeof height === 'string' ? parseFloat(height) : height;
  const defaultWeight = typeof weight === 'string' ? parseFloat(weight) : weight;

  const jsonMeasurements = calculateBodyMeasurements(defaultHeight, defaultWeight, gender as 'male' | 'female');

  let fetchedValue = 0;
  if (jsonMeasurements) {
    if (measurementType === 'chest') fetchedValue = jsonMeasurements.chest;
    else if (measurementType === 'waist') fetchedValue = jsonMeasurements.waist;
    else if (measurementType === 'hips') fetchedValue = jsonMeasurements.hips;
  }

  // Calculate ±6 range around fetched value
  let idealMin = fetchedValue - 6;
  let idealMax = fetchedValue + 6;

  let rangeMin, rangeMax;

  // If ideal range fits within absolute limits, use it
  if (idealMin >= absoluteMin && idealMax <= absoluteMax) {
    rangeMin = idealMin;
    rangeMax = idealMax;
  }
  // If we hit the upper limit, anchor to max and go back 12
  else if (idealMax > absoluteMax) {
    rangeMax = absoluteMax;
    rangeMin = Math.max(absoluteMin, rangeMax - 12);
  }
  // If we hit the lower limit, anchor to min and go forward 12
  else if (idealMin < absoluteMin) {
    rangeMin = absoluteMin;
    rangeMax = Math.min(absoluteMax, rangeMin + 12);
  }
  // Fallback
  else {
    rangeMin = idealMin;
    rangeMax = idealMax;
  }

  return {
    min: rangeMin,
    max: rangeMax,
    default: fetchedValue
  };
};

// Get shape key values from JSON data
export function getShapeKeyValues(
  height: number,
  weight: number,
  chest: number,
  waist: number,
  hips: number,
  gender: 'male' | 'female' = 'male'
): { height?: number; weight?: number; chest?: number; waist?: number; hips?: number; boy?: number; kilo?: number } | null {
  try {
    const shapeKeys = calculateShapeKeys(height, weight, chest, waist, hips, gender);
    return shapeKeys;
  } catch (error) {
    console.error('Error calculating shape keys:', error);
    return null;
  }
}  