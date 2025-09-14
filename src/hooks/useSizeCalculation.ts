import { useCallback } from 'react'
import { MEASUREMENT_LIMITS, WEIGHT_LIMITS } from '../constants/sizing-assistant'
import { Measurements } from '../types';

interface UseSizeCalculationProps {
  measurements: Measurements
}

export function useSizeCalculation({ measurements }: UseSizeCalculationProps) {
  const calculateSize = useCallback(() => {
    const height = measurements.height && !isNaN(parseFloat(measurements.height))
      ? parseFloat(measurements.height)
      : (MEASUREMENT_LIMITS.height.min + MEASUREMENT_LIMITS.height.max) / 2
    const weight = measurements.weight && !isNaN(parseFloat(measurements.weight))
      ? parseFloat(measurements.weight)
      : (WEIGHT_LIMITS.min + WEIGHT_LIMITS.max) / 2
    const chest = measurements.chest && !isNaN(parseFloat(measurements.chest))
      ? parseFloat(measurements.chest)
      : (MEASUREMENT_LIMITS.chest.min + MEASUREMENT_LIMITS.chest.max) / 2
    const waist = measurements.waist && !isNaN(parseFloat(measurements.waist))
      ? parseFloat(measurements.waist)
      : (MEASUREMENT_LIMITS.waist.min + MEASUREMENT_LIMITS.waist.max) / 2

    const clampedHeight = Math.min(Math.max(height, MEASUREMENT_LIMITS.height.min), MEASUREMENT_LIMITS.height.max)
    const clampedWeight = Math.min(Math.max(weight, WEIGHT_LIMITS.min), WEIGHT_LIMITS.max)
    const clampedChest = Math.min(Math.max(chest, MEASUREMENT_LIMITS.chest.min), MEASUREMENT_LIMITS.chest.max)
    const clampedWaist = Math.min(Math.max(waist, MEASUREMENT_LIMITS.waist.min), MEASUREMENT_LIMITS.waist.max)

    let baseSize = "M"
    let confidence = 85

    if (clampedChest < 90) baseSize = "XS"
    else if (clampedChest < 95) baseSize = "S"
    else if (clampedChest < 100) baseSize = "M"
    else if (clampedChest < 105) baseSize = "L"
    else baseSize = "XL"

    // Always use regular fit preference (removed fit preference selection)

    return { size: baseSize, confidence }
  }, [measurements])

  return {
    calculateSize
  }
}
