// Test file for new slider logic
// 12-step slider with JSON value centered (when possible)

interface SliderConfig {
  jsonValue: number;
  minPossible: number;
  maxPossible: number;
  stepCount: number;
}

interface SliderResult {
  min: number;
  max: number;
  currentValue: number;
  indicatorPosition: number; // JSON value position
  steps: number[];
  canIncrease: boolean;
  canDecrease: boolean;
}

export function calculateSliderConfig(config: SliderConfig): SliderResult {
  const { jsonValue, minPossible, maxPossible, stepCount = 12 } = config;
  
  // Calculate the ideal range (JSON value centered)
  const halfSteps = Math.floor(stepCount / 2);
  const idealMin = jsonValue - halfSteps;
  const idealMax = jsonValue + halfSteps;
  
  let sliderMin: number;
  let sliderMax: number;
  
  // Handle edge cases
  if (idealMin < minPossible) {
    // JSON value is too close to minimum
    sliderMin = minPossible;
    sliderMax = Math.min(minPossible + stepCount, maxPossible);
  } else if (idealMax > maxPossible) {
    // JSON value is too close to maximum
    sliderMax = maxPossible;
    sliderMin = Math.max(maxPossible - stepCount, minPossible);
  } else {
    // JSON value can be centered
    sliderMin = idealMin;
    sliderMax = idealMax;
  }
  
  // Generate steps - ALWAYS use 12 steps for consistent UX
  const steps: number[] = [];
  const rangeSize = sliderMax - sliderMin;
  
  for (let i = 0; i <= stepCount; i++) {
    const step = sliderMin + (i * rangeSize / stepCount);
    steps.push(Number(step.toFixed(2))); // Round to avoid floating point issues
  }
  
  // Find current value position on slider
  const currentValue = jsonValue;
  
  return {
    min: sliderMin,
    max: sliderMax,
    currentValue,
    indicatorPosition: jsonValue,
    steps,
    canIncrease: jsonValue < maxPossible,
    canDecrease: jsonValue > minPossible
  };
}

// Test cases
export function runTests() {
  console.log('🧪 Running Slider Logic Tests...\n');
  
  // Test Case 1: Normal case - JSON value can be centered
  console.log('Test 1: Normal case (hips: 80, range: 60-120)');
  const test1 = calculateSliderConfig({
    jsonValue: 80,
    minPossible: 60,
    maxPossible: 120,
    stepCount: 12
  });
  console.log('Result:', test1);
  console.log('Expected: min=74, max=86, indicator=80\n');
  
  // Test Case 2: Edge case - JSON value at maximum
  console.log('Test 2: Edge case - at maximum (hips: 137, max: 137)');
  const test2 = calculateSliderConfig({
    jsonValue: 137,
    minPossible: 60,
    maxPossible: 137,
    stepCount: 12
  });
  console.log('Result:', test2);
  console.log('Expected: min=125, max=137, indicator=137\n');
  
  // Test Case 3: Edge case - JSON value at minimum
  console.log('Test 3: Edge case - at minimum (chest: 60, min: 60)');
  const test3 = calculateSliderConfig({
    jsonValue: 60,
    minPossible: 60,
    maxPossible: 120,
    stepCount: 12
  });
  console.log('Result:', test3);
  console.log('Expected: min=60, max=72, indicator=60\n');
  
  // Test Case 4: Near edge case
  console.log('Test 4: Near edge case (waist: 65, min: 60)');
  const test4 = calculateSliderConfig({
    jsonValue: 65,
    minPossible: 60,
    maxPossible: 120,
    stepCount: 12
  });
  console.log('Result:', test4);
  console.log('Expected: min=60, max=72, indicator=65\n');
  
  // Test Case 5: Very narrow range
  console.log('Test 5: Narrow range (value: 100, range: 95-105)');
  const test5 = calculateSliderConfig({
    jsonValue: 100,
    minPossible: 95,
    maxPossible: 105,
    stepCount: 12
  });
  console.log('Result:', test5);
  console.log('Expected: min=95, max=105, indicator=100\n');
  
  return {
    test1, test2, test3, test4, test5
  };
}

// Helper function to validate slider behavior
export function validateSliderBehavior(result: SliderResult, expectedIndicator: number) {
  const issues: string[] = [];
  
  // Check if steps are exactly 12
  if (result.steps.length !== 13) { // 13 positions for 12 steps
    issues.push(`Wrong step count: ${result.steps.length - 1}, expected: 12`);
  }
  
  // Check if indicator is at correct position
  if (result.indicatorPosition !== expectedIndicator) {
    issues.push(`Wrong indicator position: ${result.indicatorPosition}, expected: ${expectedIndicator}`);
  }
  
  // Check if range is reasonable
  const range = result.max - result.min;
  if (range < 10 || range > 15) {
    issues.push(`Range might be wrong: ${range}, expected: around 12`);
  }
  
  // Check if steps are monotonic
  for (let i = 1; i < result.steps.length; i++) {
    if (result.steps[i] <= result.steps[i-1]) {
      issues.push(`Steps are not increasing at position ${i}`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// Usage example for measurements
export function getSliderConfigForMeasurement(
  measurementType: 'chest' | 'waist' | 'hips',
  jsonValue: number,
  gender: 'male' | 'female'
): SliderResult {
  
  // Define measurement ranges (you'll need to adjust these based on your data)
  const ranges = {
    male: {
      chest: { min: 80, max: 140 },
      waist: { min: 60, max: 120 },
      hips: { min: 80, max: 120 }
    },
    female: {
      chest: { min: 70, max: 120 },
      waist: { min: 55, max: 100 },
      hips: { min: 80, max: 137 }
    }
  };
  
  const range = ranges[gender][measurementType];
  
  return calculateSliderConfig({
    jsonValue,
    minPossible: range.min,
    maxPossible: range.max,
    stepCount: 12
  });
}

// Run tests if this file is executed directly
if (typeof globalThis !== 'undefined' && typeof require !== 'undefined') {
  runTests();
}
