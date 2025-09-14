/**
 * Consolidated utility functions for hooks to eliminate code duplication
 */

// Constants - defined once instead of being redefined in every render
export const UNIT_CONSTANTS = {
  CM_PER_INCH: 2.54,
  LBS_PER_KG: 2.20462,
  DEBOUNCE_DELAY: 700,
} as const;

// Measurement interface
export interface MeasurementSet {
  height: string;
  weight: string;
  chest: string;
  waist: string;
  hips: string;
}

// Gender-specific defaults - consolidated from multiple files
export const GENDER_DEFAULTS = {
  male: {
    height: 175,
    weight: 75,
    chest: 100,
    waist: 85,
    hips: 95,
  },
  female: {
    height: 160,
    weight: 60,
    chest: 90,
    waist: 75,
    hips: 100,
  },
} as const;

/**
 * Parse measurement value with gender-specific fallback
 * Eliminates the duplicate pattern: parseFloat(measurements[type]) || defaultValue
 */
export function parseMeasurement(
  measurements: MeasurementSet,
  type: keyof MeasurementSet,
  gender: 'male' | 'female' | null
): number {
  if (measurements[type] && !isNaN(parseFloat(measurements[type]))) {
    return parseFloat(measurements[type]);
  }
  
  if (gender) {
    return GENDER_DEFAULTS[gender][type];
  }
  
  // Final fallback
  return GENDER_DEFAULTS.male[type];
}

/**
 * Parse all measurements at once with gender-specific fallbacks
 * Eliminates the 5-line duplicate pattern found in multiple files
 */
export function parseAllMeasurements(
  measurements: MeasurementSet,
  gender: 'male' | 'female' | null
) {
  return {
    height: parseMeasurement(measurements, 'height', gender),
    weight: parseMeasurement(measurements, 'weight', gender),
    chest: parseMeasurement(measurements, 'chest', gender),
    waist: parseMeasurement(measurements, 'waist', gender),
    hips: parseMeasurement(measurements, 'hips', gender),
  };
}

/**
 * Format measurement value for storage
 * Eliminates the duplicate pattern: Math.round(value).toString() vs value.toFixed(1)
 */
export function formatMeasurementForStorage(
  value: number,
  type: keyof MeasurementSet
): string {
  return (type === 'height' || type === 'weight') 
    ? Math.round(value).toString() 
    : value.toFixed(1);
}

/**
 * Clamp value within range
 * Eliminates the duplicate pattern: Math.max(min, Math.min(max, value))
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert metric to imperial
 */
export function convertMetricToImperial(
  value: number,
  type: keyof MeasurementSet
): number {
  if (type === 'weight') {
    return value * UNIT_CONSTANTS.LBS_PER_KG;
  } else {
    return value / UNIT_CONSTANTS.CM_PER_INCH;
  }
}

/**
 * Convert imperial to metric
 */
export function convertImperialToMetric(
  value: number,
  type: keyof MeasurementSet
): number {
  if (type === 'weight') {
    return value / UNIT_CONSTANTS.LBS_PER_KG;
  } else {
    return value * UNIT_CONSTANTS.CM_PER_INCH;
  }
}

/**
 * Debounce utility class to manage multiple debounced functions
 * Eliminates the duplicate pattern: clearTimeout(debounceRefs.current[type])
 */
export class DebounceManager {
  private timers: { [key: string]: NodeJS.Timeout } = {};

  /**
   * Execute a function with debounce
   */
  debounce<T extends any[]>(
    key: string,
    fn: (...args: T) => void,
    delay: number = UNIT_CONSTANTS.DEBOUNCE_DELAY
  ): (...args: T) => void {
    return (...args: T) => {
      if (this.timers[key]) {
        clearTimeout(this.timers[key]);
      }
      
      this.timers[key] = setTimeout(() => {
        fn(...args);
        delete this.timers[key];
      }, delay);
    };
  }

  /**
   * Clear specific debounce timer
   */
  clear(key: string): void {
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
      delete this.timers[key];
    }
  }

  /**
   * Clear all debounce timers
   */
  clearAll(): void {
    Object.values(this.timers).forEach(timer => clearTimeout(timer));
    this.timers = {};
  }
}

/**
 * Create JSON cache key for measurements
 * Eliminates duplicate cache key generation patterns
 */
export function createCacheKey(height: number, weight: number): string {
  return `${Math.round(height)}_${Math.round(weight)}`;
}

/**
 * Apply shape keys to model with standard conditional logic
 * Eliminates the duplicate conditional pattern for shape key application
 */
export function applyShapeKeys(
  shapeKeys: { chest?: number; waist?: number; hips?: number },
  handleMorphChange: (morphName: string, value: number) => void
): void {
  if (shapeKeys.chest !== undefined) {
    handleMorphChange('Chest Width', shapeKeys.chest);
  }
  if (shapeKeys.waist !== undefined) {
    handleMorphChange('Waist Thickness', shapeKeys.waist);
  }
  if (shapeKeys.hips !== undefined) {
    handleMorphChange('Hips Size', shapeKeys.hips);
  }
}

/**
 * Calculate dynamic range for body measurements (chest, waist, hips)
 * Eliminates duplicate ±6 range calculation logic
 */
export function calculateDynamicRange(
  fetchedValue: number,
  absoluteMin: number,
  absoluteMax: number,
  rangeSize: number = 12
): { min: number; max: number } {
  const halfRange = rangeSize / 2;
  let min = fetchedValue - halfRange;
  let max = fetchedValue + halfRange;
  
  // Adjust for boundaries
  if (max > absoluteMax) {
    max = absoluteMax;
    min = Math.max(absoluteMin, max - rangeSize);
  } else if (min < absoluteMin) {
    min = absoluteMin;
    max = Math.min(absoluteMax, min + rangeSize);
  }
  
  return { min, max };
}

/**
 * Normalize slider value to 0-1 range
 * Eliminates duplicate normalization calculations
 */
export function normalizeSliderValue(
  value: number,
  min: number,
  max: number
): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Denormalize slider value from 0-1 range
 * Eliminates duplicate denormalization calculations
 */
export function denormalizeSliderValue(
  normalizedValue: number,
  min: number,
  max: number
): number {
  return min + (normalizedValue * (max - min));
}