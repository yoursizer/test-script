// Integration test - how to adapt existing MeasurementSlider to use smart logic

import { calculateSliderConfig } from './sliderLogicTest';

/**
 * Enhanced slider configuration that integrates with existing MeasurementSlider
 */
export interface EnhancedSliderConfig {
  min: number;
  max: number;
  jsonValue: number;
  currentValue: number;
  step: number;
  indicatorPosition: number;
  canIncrease: boolean;
  canDecrease: boolean;
  steps: number[];
}

/**
 * Calculate enhanced slider configuration for integration with existing components
 */
export function getEnhancedSliderConfig(
  measurementType: 'chest' | 'waist' | 'hips',
  jsonValue: number,
  currentValue: number,
  gender: 'male' | 'female'
): EnhancedSliderConfig {
  
  // Define measurement ranges - these should match your actual data ranges
  const ranges = {
    male: {
      chest: { min: 61.1, max: 170.9 },
      waist: { min: 44.3, max: 161.2 },
      hips: { min: 81.3, max: 159.8 }
    },
    female: {
      chest: { min: 61.1, max: 170.9 },
      waist: { min: 44.3, max: 161.2 },
      hips: { min: 81.3, max: 159.8 }
    }
  };
  
  const range = ranges[gender][measurementType];
  
  const config = calculateSliderConfig({
    jsonValue,
    minPossible: range.min,
    maxPossible: range.max,
    stepCount: 12
  });
  
  return {
    min: config.min,
    max: config.max,
    jsonValue,
    currentValue,
    step: 1, // Step size for slider
    indicatorPosition: config.indicatorPosition,
    canIncrease: config.canIncrease,
    canDecrease: config.canDecrease,
    steps: config.steps
  };
}

/**
 * Example of how to modify existing MeasurementSlider props
 */
export function getAdaptedSliderProps(
  measurementType: 'chest' | 'waist' | 'hips',
  jsonValue: number,
  currentValue: number,
  gender: 'male' | 'female'
) {
  const config = getEnhancedSliderConfig(measurementType, jsonValue, currentValue, gender);
  
  return {
    // Standard slider props
    min: config.min,
    max: config.max,
    value: config.currentValue,
    step: config.step,
    
    // Additional props for enhanced functionality
    jsonIndicator: config.indicatorPosition,
    showJsonIndicator: true,
    canIncrease: config.canIncrease,
    canDecrease: config.canDecrease,
    stepMarkers: config.steps,
    
    // Visual state
    isAtMin: !config.canDecrease,
    isAtMax: !config.canIncrease,
    isModifiedFromJson: config.currentValue !== config.jsonValue
  };
}

/**
 * Hook for managing enhanced slider state
 */
export function useEnhancedSlider(
  measurementType: 'chest' | 'waist' | 'hips',
  jsonValue: number,
  initialValue: number,
  gender: 'male' | 'female',
  onValueChange: (value: number) => void
) {
  const config = getEnhancedSliderConfig(measurementType, jsonValue, initialValue, gender);
  
  const handleSliderChange = (newValue: number) => {
    // Ensure value is within allowed range
    const clampedValue = Math.min(Math.max(newValue, config.min), config.max);
    onValueChange(clampedValue);
  };
  
  const resetToJson = () => {
    onValueChange(jsonValue);
  };
  
  const canReset = initialValue !== jsonValue;
  
  return {
    config,
    handleSliderChange,
    resetToJson,
    canReset,
    isModified: initialValue !== jsonValue,
    isAtLimit: !config.canIncrease || !config.canDecrease
  };
}

// Test the integration
export function testIntegration() {
  console.log('🔧 Testing Integration Logic...\n');
  
  // Test case: Female with hips at max
  const femaleHipsMax = getAdaptedSliderProps('hips', 137, 137, 'female');
  console.log('Female hips at max (137):', femaleHipsMax);
  
  // Test case: Female with hips modified
  const femaleHipsModified = getAdaptedSliderProps('hips', 100, 95, 'female');
  console.log('\nFemale hips modified (JSON: 100, Current: 95):', femaleHipsModified);
  
  // Test case: Male chest normal
  const maleChestNormal = getAdaptedSliderProps('chest', 95, 95, 'male');
  console.log('\nMale chest normal (95):', maleChestNormal);
  
  return {
    femaleHipsMax,
    femaleHipsModified,
    maleChestNormal
  };
}

// Instructions for integrating with existing MeasurementSlider
export const INTEGRATION_INSTRUCTIONS = `
🎯 Integration Steps:

1. Import the enhanced functions:
   import { getEnhancedSliderConfig, useEnhancedSlider } from './utils/sliderIntegration';

2. In your MeasurementSlider component, replace fixed min/max with dynamic values:
   
   Before:
   const min = 60;
   const max = 120;
   
   After:
   const config = getEnhancedSliderConfig(measurementType, jsonValue, currentValue, gender);

3. Add JSON indicator to your slider UI:
   - Show blue indicator at config.indicatorPosition
   - Show current value indicator (red) if different from JSON
   - Use config.min and config.max for slider range

4. Update your slider event handlers:
   const { handleSliderChange, resetToJson, canReset } = useEnhancedSlider(
     measurementType, jsonValue, currentValue, gender, onValueChange
   );

5. Add step markers (optional):
   config.steps.map(step => <div key={step} className="step-marker" />)

6. Add reset button (optional):
   {canReset && <button onClick={resetToJson}>Reset to JSON</button>}
`;

// Run integration test
if (typeof globalThis !== 'undefined' && typeof require !== 'undefined') {
  testIntegration();
  console.log('\n' + INTEGRATION_INSTRUCTIONS);
}
