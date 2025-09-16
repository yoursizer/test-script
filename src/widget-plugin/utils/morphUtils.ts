/**
 * Morph Target Utilities
 * Consolidated morph calculation and handling logic
 */

/**
 * Calculate morph value from measurement difference
 * @param currentValue - Current measurement value
 * @param jsonBaseValue - Base value from JSON data
 * @param normalizationFactor - Factor to normalize the difference (default: 6)
 * @returns Normalized morph value between -1 and 1
 */
export function calculateMorphValue(
  currentValue: number,
  jsonBaseValue: number,
  normalizationFactor: number = 6
): number {
  const diff = (currentValue - jsonBaseValue) / normalizationFactor;
  return Math.min(Math.max(diff, -1.0), 1.0);
}

/**
 * Handle morph change for a specific measurement type
 * @param measurementType - Type of measurement (chest, waist, hips)
 * @param currentValue - Current measurement value
 * @param getLocalJSONBasedLimits - Function to get JSON-based limits
 * @param handleMorphChange - Function to apply morph changes
 */
export function handleMeasurementMorphChange(
  measurementType: 'chest' | 'waist' | 'hips',
  currentValue: number,
  getLocalJSONBasedLimits: (type: 'chest' | 'waist' | 'hips') => { min: number; max: number; default: number },
  handleMorphChange: (morphName: string, value: number) => void
): void {
  const jsonLimits = getLocalJSONBasedLimits(measurementType);
  const jsonBase = jsonLimits.default;
  const morphValue = calculateMorphValue(currentValue, jsonBase);
  
  // Map measurement types to morph names
  const morphNameMap = {
    chest: 'Chest Width',
    waist: 'Waist Thickness',
    hips: 'Hips Size'
  };
  
  handleMorphChange(morphNameMap[measurementType], morphValue);
}

/**
 * Log measurement change for debugging
 * @param measurementType - Type of measurement
 * @param fromValue - Previous value
 * @param toValue - New value
 * @param jsonBase - Base value from JSON
 * @param isMobile - Whether this is a mobile context
 */
export function logMeasurementChange(
  measurementType: string,
  fromValue: number,
  toValue: number,
  jsonBase: number,
  isMobile: boolean = false
): void {
  const platform = isMobile ? '📱 Mobile' : '🖥️ Desktop';
  const change = toValue - jsonBase;
  const changeFromPrev = toValue - fromValue;
  
  // Debug logging removed
}

/**
 * Common measurement change handler for sliders
 * @param params - Parameters for handling measurement changes
 */
export interface MeasurementChangeParams {
  measurementType: 'chest' | 'waist' | 'hips';
  newValue: number;
  measurements: any;
  setMeasurements: React.Dispatch<React.SetStateAction<any>>;
  setUserEditedMeasurements: React.Dispatch<React.SetStateAction<any>>;
  getLocalJSONBasedLimits: (type: 'chest' | 'waist' | 'hips') => { min: number; max: number; default: number };
  handleMorphChange: (morphName: string, value: number) => void;
  setMeasurementsChanged?: (changed: boolean) => void;
  isMobile?: boolean;
}

export function handleSliderMeasurementChange(params: MeasurementChangeParams): void {
  const {
    measurementType,
    newValue,
    measurements,
    setMeasurements,
    setUserEditedMeasurements,
    getLocalJSONBasedLimits,
    handleMorphChange,
    setMeasurementsChanged,
    isMobile = false
  } = params;

  const prevValue = parseFloat(measurements[measurementType]) || getLocalJSONBasedLimits(measurementType).default;
  
  // Update measurements
  setMeasurements((prev: any) => ({ ...prev, [measurementType]: newValue.toString() }));
  setUserEditedMeasurements((prev: any) => ({ ...prev, [measurementType]: true }));
  
  // Set measurementsChanged flag for analytics
  if (setMeasurementsChanged) {
    console.log('📊 Slider changed - setting measurementsChanged to true for', measurementType);
    setMeasurementsChanged(true);
  }
  
  // Log the change
  const jsonLimits = getLocalJSONBasedLimits(measurementType);
  logMeasurementChange(measurementType, prevValue, newValue, jsonLimits.default, isMobile);
  
  // Apply morph changes
  handleMeasurementMorphChange(measurementType, newValue, getLocalJSONBasedLimits, handleMorphChange);
}
