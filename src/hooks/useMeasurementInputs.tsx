import React, { useCallback, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { GenericRadialSlider } from '../components/GenericRadialSlider';
import { MeasurementSlider } from '../components/MeasurementSlider';
import { 
  MEASUREMENT_LIMITS,
  WEIGHT_LIMITS 
} from '../constants/sizing-assistant';
import { 
  getDynamicMeasurementRange, 
  getDisplayRange, 
  formatValueForDisplay, 
  getCurrentMeasurementValue 
} from '../utils/sliderUtils';
import { handleSliderMeasurementChange, MeasurementChangeParams } from '../utils/morphUtils';

interface DebugData {
  heightWeight?: {
    fetchedData?: {
      measurements?: {
        chest: number;
        waist: number;
        hips: number;
      };
    };
  };
}
import { getShapeKeyValues, cmToFeet } from '../utils/measurementUtils';
import { getEnhancedSliderConfig } from '../utils/sliderIntegration';
import { calculateShapeKeys, calculateBodyMeasurements } from '../utils/bodyMeasurements';
import { Measurements } from '../types';

interface UseMeasurementInputsParams {
  isMobile: boolean;
  measurements: Measurements;
  setMeasurements: React.Dispatch<React.SetStateAction<Measurements>>;
  useMetric: boolean;
  gender: 'male' | 'female' | null;
  getLocalJSONBasedLimits: (measurementType: 'chest' | 'waist' | 'hips') => {
    min: number;
    max: number;
    default: number;
  };
  setShowMeasurementGuide: (type: "chest" | "waist" | "hips" | null) => void;
  handleMorphChange: (morphName: string, value: number) => void;
  handleMorphChangeFromSlider: (morphName: string, sliderValue: number, jsonValue: number, sliderMin: number, sliderMax: number, updatedMeasurements: Measurements) => void;
  handleWeightMorphs: (weightValue: number) => void;
  debugData?: DebugData; // Contains fetched measurements
  setIsFastTrackMode?: (value: boolean) => void;
  isFastTrackMode?: boolean;
  updateModelDimensions?: (model: any, measurements: Measurements) => void;
  modelRef?: React.RefObject<any>;
  setUserEditedHeightWeight?: React.Dispatch<React.SetStateAction<{ height: boolean; weight: boolean }>>;
  setUserEditedMeasurements?: React.Dispatch<React.SetStateAction<{ chest: boolean; waist: boolean; hips: boolean }>>;
  setMeasurementsChanged?: (changed: boolean) => void;
}

interface UseMeasurementInputsReturn {
  renderMeasurementInputs: (type: 'height' | 'weight' | 'chest' | 'waist' | 'hips') => React.ReactElement;
}

export function useMeasurementInputs({
  isMobile,
  measurements,
  setMeasurements,
  useMetric,
  gender,
  getLocalJSONBasedLimits,
  setShowMeasurementGuide,
  handleMorphChange,
  handleMorphChangeFromSlider,
  handleWeightMorphs,
  debugData,
  setIsFastTrackMode,
  isFastTrackMode,
  updateModelDimensions,
  modelRef,
  setUserEditedHeightWeight,
  setUserEditedMeasurements,
  setMeasurementsChanged
}: UseMeasurementInputsParams): UseMeasurementInputsReturn {

  // Debounce timeout ref for local storage updates
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced local storage update function
  const updateLocalStorageDebounced = useCallback((updatedMeasurements: Measurements) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem('userMeasurements', JSON.stringify(updatedMeasurements));
    
      } catch (error) {
        console.error('Failed to update local storage:', error);
      }
    }, 500); // 500ms debounce
  }, []);

  // Set default breast size when gender changes - DISABLED: conflicts with new handleMorphChange signature
  // useEffect(() => {
  //   if (gender) {
  //     const defaultBreastSize = gender === 'female' ? 0.5 : 0;
  //     handleMorphChange('Breast Size', defaultBreastSize);
  //   }
  // }, [gender]);

  const renderMeasurementInputs = useCallback((type: 'height' | 'weight' | 'chest' | 'waist' | 'hips') => {
    const CM_PER_INCH = 2.54;
    const LBS_PER_KG = 2.20462;

    // Use fetched data for chest, waist, hips ranges
    const getMetricRange = (measurementType: typeof type) => {
      if (measurementType === 'height') {
        return { min: MEASUREMENT_LIMITS.height.min, max: MEASUREMENT_LIMITS.height.max };
      } else if (measurementType === 'weight') {
        return { min: WEIGHT_LIMITS.min, max: WEIGHT_LIMITS.max };
      } else {
        // For chest, waist, hips - use calculateBodyMeasurements data ±6 range with boundary checking
        let fetchedValue = 0;
        if (measurements.height && measurements.weight && gender) {
          const calculatedMeasurements = calculateBodyMeasurements(
            parseFloat(measurements.height), 
            parseFloat(measurements.weight), 
            gender
          );
          if (calculatedMeasurements) {
            if (measurementType === 'chest') fetchedValue = calculatedMeasurements.chest;
            else if (measurementType === 'waist') fetchedValue = calculatedMeasurements.waist;
            else if (measurementType === 'hips') fetchedValue = calculatedMeasurements.hips;
        
          }
        }
        
        if (fetchedValue > 0) {
          
          // Get absolute limits for this measurement type
          const absoluteLimits = getLocalJSONBasedLimits(measurementType as 'chest' | 'waist' | 'hips');
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
        // Fallback to old method if no fetched data
        return getLocalJSONBasedLimits(measurementType as 'chest' | 'waist' | 'hips');
      }
    };

    const metricRanges = {
      height: getMetricRange('height'),
      weight: getMetricRange('weight'),
      chest: getMetricRange('chest'),
      waist: getMetricRange('waist'),
      hips: getMetricRange('hips')
    };

    const displayRanges = {
      height: useMetric
        ? { min: MEASUREMENT_LIMITS.height.min, max: MEASUREMENT_LIMITS.height.max, step: 1 }
        : { min: Math.round(MEASUREMENT_LIMITS.height.min / CM_PER_INCH), max: Math.round(MEASUREMENT_LIMITS.height.max / CM_PER_INCH), step: 1 },
      weight: useMetric
        ? { min: WEIGHT_LIMITS.min, max: WEIGHT_LIMITS.max, step: 1 }
        : { min: Math.round(WEIGHT_LIMITS.min * LBS_PER_KG), max: Math.round(WEIGHT_LIMITS.max * LBS_PER_KG), step: 1 },
      chest: useMetric
        ? { min: metricRanges.chest.min, max: metricRanges.chest.max, step: 1 }
        : { min: parseFloat((metricRanges.chest.min / CM_PER_INCH).toFixed(1)), max: parseFloat((metricRanges.chest.max / CM_PER_INCH).toFixed(1)), step: 0.1 },
      waist: useMetric
        ? { min: metricRanges.waist.min, max: metricRanges.waist.max, step: 1 }
        : { min: parseFloat((metricRanges.waist.min / CM_PER_INCH).toFixed(1)), max: parseFloat((metricRanges.waist.max / CM_PER_INCH).toFixed(1)), step: 0.1 },
      hips: useMetric
        ? { min: metricRanges.hips.min, max: metricRanges.hips.max, step: 1 }
        : { min: parseFloat((metricRanges.hips.min / CM_PER_INCH).toFixed(1)), max: parseFloat((metricRanges.hips.max / CM_PER_INCH).toFixed(1)), step: 0.1 }
    };
    const displayRange = displayRanges[type];

    const getCurrentDisplayValue = () => {
      const metricString = measurements[type];
      if (metricString === '' || isNaN(parseFloat(metricString))) {
        return '';
      }
      const metricValue = parseFloat(metricString);
      if (!useMetric) {
        if (type === 'weight') return (metricValue * LBS_PER_KG).toFixed(0);
        else return (metricValue / CM_PER_INCH).toFixed(1);
      }
      return metricValue.toFixed(0);
    };

    const getSliderValue = () => {
      const metricString = measurements[type];
      if (metricString === '' || isNaN(parseFloat(metricString))) {
        return 0;
      }
      const metricValue = parseFloat(metricString);
      let displayValue: number;
      if (!useMetric) {
        if (type === 'weight') displayValue = metricValue * LBS_PER_KG;
        else displayValue = metricValue / CM_PER_INCH;
      } else {
        displayValue = metricValue;
      }

      const normalizedValue = (displayValue - displayRange.min) / (displayRange.max - displayRange.min);
      return Math.max(0, Math.min(1, normalizedValue));
    };

    const formatDisplayLabel = (metricString: string): string => {
      if (metricString === '' || isNaN(parseFloat(metricString))) {
        return '';
      }
      const metricValue = parseFloat(metricString);
      if (!useMetric) {
        if (type === 'height') return cmToFeet(metricValue);
        if (type === 'weight') return `${(metricValue * LBS_PER_KG).toFixed(0)} lbs`;
        else return `${(metricValue / CM_PER_INCH).toFixed(1)}"`;
      }
      return `${metricValue.toFixed(0)} ${type === 'weight' ? 'kg' : 'cm'}`;
    };

    // Override for chest/waist/hips on both desktop and mobile

    if ((type === 'chest' || type === 'waist' || type === 'hips') && gender) {
      let mainLabel = '';
      if (type === 'chest') {
        mainLabel = 'Chest';
      } else if (type === 'hips') {
        mainLabel = 'Hips';
      } else if (type === 'waist') {
        mainLabel = 'Waist';
      }
      
      // Get JSON value from calculateBodyMeasurements function
      let jsonValue = 0;
      if (measurements.height && measurements.weight && gender) {
        const calculatedMeasurements = calculateBodyMeasurements(
          parseFloat(measurements.height), 
          parseFloat(measurements.weight), 
          gender
        );
        if (calculatedMeasurements) {
          if (type === 'chest') jsonValue = calculatedMeasurements.chest;
          else if (type === 'waist') jsonValue = calculatedMeasurements.waist;
          else if (type === 'hips') jsonValue = calculatedMeasurements.hips;
    
        }
      }

      // If no fetched data, skip this section entirely
      if (!jsonValue || jsonValue === 0) {
        return (
          <div className="text-gray-500 p-4">
            Loading {type} data from JSON...
          </div>
        );
      }

      // Get current value from measurements - should be original profile value, NOT JSON value
      const currentValue = measurements[type] === '' || isNaN(parseFloat(measurements[type])) 
        ? jsonValue  // Only fallback to JSON if no profile value exists
        : parseFloat(measurements[type]);
      
      // Get enhanced slider configuration using our smart logic
      let sliderConfig;
      
      try {
        sliderConfig = getEnhancedSliderConfig(type, jsonValue, currentValue, gender);
        // Using sliderConfig from getEnhancedSliderConfig
      } catch (error: unknown) {
        // Using fallback config
        // Fallback to simple range that includes both JSON and current values
        const minValue = Math.min(jsonValue, currentValue);
        const maxValue = Math.max(jsonValue, currentValue);
        const rangeSize = Math.max(12, maxValue - minValue + 2); // At least 12 units or enough to fit both values
        const center = (minValue + maxValue) / 2;
        
        sliderConfig = {
          min: center - rangeSize / 2,
          max: center + rangeSize / 2,
          indicatorPosition: jsonValue,
          canIncrease: true,
          canDecrease: true
        };
      }
      
      // Calculate JSON position percentage in slider range FIRST
      const sliderRange = sliderConfig.max - sliderConfig.min;
      const jsonPositionPercent = (jsonValue - sliderConfig.min) / sliderRange;
      
      // Get baseline values for morph calculation
      const baselineValues = {
        chest: gender === 'male' ? 100 : 95,
        waist: gender === 'male' ? 85 : 80,
        hips: gender === 'male' ? 95 : 100
      };
      const baselineValue = baselineValues[type];
      
      // Calculate JSON morph value (what JSON measurement should map to)
      const jsonDiff = (jsonValue - baselineValue) / 6;
      const jsonMorphValue = Math.min(Math.max(jsonDiff, -1.0), 1.0);
      
      // Morph calculation moved to useMorphSync - no manual calculation here!

      // When slider changes, update measurement and model
      const handleSliderChange = async (v: number) => {
        // Track chest/waist/hips changes for user editing detection
        if (setUserEditedMeasurements && (type === 'chest' || type === 'waist' || type === 'hips')) {
          setUserEditedMeasurements(prev => ({ ...prev, [type]: true }));
        }
        
        // Set measurementsChanged flag for analytics
        if (setMeasurementsChanged) {
          console.log('📊 Height/Weight slider changed - setting measurementsChanged to true for', type);
          setMeasurementsChanged(true);
        }

        const prevValue = parseFloat(measurements[type]) || jsonValue;
        
        // Clamp value to slider range
        const clampedValue = Math.min(Math.max(v, sliderConfig.min), sliderConfig.max);
        
        // Use decimals for body measurements
        const valueToSave = clampedValue.toFixed(1);
        const updatedMeasurements = { ...measurements, [type]: valueToSave };
        setMeasurements(updatedMeasurements);
        
        
        
        // Use handleMorphChangeFromSlider with 3.0 logic
        

        
        if (type === 'chest') {
          handleMorphChangeFromSlider('Chest Width', clampedValue, jsonValue, sliderConfig.min, sliderConfig.max, updatedMeasurements);
        } else if (type === 'waist') {
          handleMorphChangeFromSlider('Waist Thickness', clampedValue, jsonValue, sliderConfig.min, sliderConfig.max, updatedMeasurements);
        } else if (type === 'hips') {
          handleMorphChangeFromSlider('Hips Size', clampedValue, jsonValue, sliderConfig.min, sliderConfig.max, updatedMeasurements);
        }
      };
      
      return (
        <div className="pb-8">
          
          <MeasurementSlider
            value={currentValue}
            onChange={handleSliderChange}
            min={sliderConfig.min}
            max={sliderConfig.max}
            step={0.1}
            label={`${mainLabel}: ${currentValue.toFixed(1)} cm`}
            labels={['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide']}
            jsonIndicator={currentValue}
            showJsonIndicator={true}
            isModifiedFromJson={currentValue !== jsonValue}
            canIncrease={sliderConfig.canIncrease}
            canDecrease={sliderConfig.canDecrease}
          />
        </div>
      );
    }

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('🎚️ Desktop slider changed:', { type, value: e.target.value });
      
      // Disable fast track mode for all slider changes to preserve user edits
      if (setIsFastTrackMode) {
        setIsFastTrackMode(false);
      }

      // Track height/weight changes for user editing detection
      if ((type === 'height' || type === 'weight') && setUserEditedHeightWeight) {
        setUserEditedHeightWeight(prev => ({ ...prev, [type]: true }));
      }
      
      // Set measurementsChanged flag for analytics
      if (setMeasurementsChanged) {
        console.log('📊 Desktop Height/Weight slider changed - setting measurementsChanged to true for', type);
        setMeasurementsChanged(true);
      }

      const sliderValue = parseFloat(e.target.value);
      const displayValue = displayRange.min + (sliderValue * (displayRange.max - displayRange.min));

      let metricValue: number;
      if (!useMetric) {
        if (type === 'weight') metricValue = displayValue / LBS_PER_KG;
        else metricValue = displayValue * CM_PER_INCH;
      } else {
        metricValue = displayValue;
      }

      // Update chest/waist/hips when height or weight changes
      if ((type === 'height' || type === 'weight') && gender) {
        const currentHeight = type === 'height' ? metricValue : parseFloat(measurements.height) || 175;
        const currentWeight = type === 'weight' ? metricValue : parseFloat(measurements.weight) || 70;
        
        const calculatedMeasurements = calculateBodyMeasurements(currentHeight, currentWeight, gender);
        if (calculatedMeasurements) {
          const allUpdatedMeasurements = {
            ...measurements,
            [type]: metricValue.toFixed(1),
            chest: calculatedMeasurements.chest.toFixed(1),
            waist: calculatedMeasurements.waist.toFixed(1),
            hips: calculatedMeasurements.hips.toFixed(1)
          };
          setMeasurements(allUpdatedMeasurements);
          updateLocalStorageDebounced(allUpdatedMeasurements);
        } else {
          const updatedMeasurements = { ...measurements, [type]: metricValue.toFixed(1) };
          setMeasurements(updatedMeasurements);
          updateLocalStorageDebounced(updatedMeasurements);
        }
      } else {
        const updatedMeasurements = { ...measurements, [type]: metricValue.toFixed(1) };
        setMeasurements(updatedMeasurements);
        if (type === 'height' || type === 'weight') {
          updateLocalStorageDebounced(updatedMeasurements);
        }
      }

      // Let updateModelDimensions handle height/weight morphs to avoid conflicts
      if (type === 'weight' && gender) {
        handleWeightMorphs(metricValue);
      }

      // Fast track mode: Update measurement and apply morphs immediately
      if (isFastTrackMode && (type === 'height' || type === 'weight') && updateModelDimensions && modelRef?.current) {
        // Update the measurement
        setMeasurements(prev => ({ ...prev, [type]: metricValue.toFixed(1) }));
        
        // Apply morphs immediately for immediate visual feedback
        const updatedMeasurements = { ...measurements, [type]: metricValue.toFixed(1) };
        updateModelDimensions(modelRef.current, updatedMeasurements);
      }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Disable fast track mode for all number input changes to preserve user edits
      if (setIsFastTrackMode) {
        setIsFastTrackMode(false);
      }

      // Track height/weight changes for user editing detection
      if ((type === 'height' || type === 'weight') && setUserEditedHeightWeight) {
        setUserEditedHeightWeight(prev => ({ ...prev, [type]: true }));
      }

      const displayValue = e.target.value;

      if (displayValue === '') {
        setMeasurements(prev => ({ ...prev, [type]: '' }));
        return;
      }

      const displayValueNum = parseFloat(displayValue);
      if (isNaN(displayValueNum)) {
        return;
      }

      let metricValue: number;
      if (!useMetric) {
        if (type === 'weight') metricValue = displayValueNum / LBS_PER_KG;
        else metricValue = displayValueNum * CM_PER_INCH;
      } else {
        metricValue = displayValueNum;
      }

      // Update chest/waist/hips when height or weight changes
      if ((type === 'height' || type === 'weight') && gender) {
        const currentHeight = type === 'height' ? metricValue : parseFloat(measurements.height) || 175;
        const currentWeight = type === 'weight' ? metricValue : parseFloat(measurements.weight) || 70;
        
        const calculatedMeasurements = calculateBodyMeasurements(currentHeight, currentWeight, gender);
        if (calculatedMeasurements) {
          const allUpdatedMeasurements = {
            ...measurements,
            [type]: metricValue.toFixed(1),
            chest: calculatedMeasurements.chest.toFixed(1),
            waist: calculatedMeasurements.waist.toFixed(1),
            hips: calculatedMeasurements.hips.toFixed(1)
          };
          setMeasurements(allUpdatedMeasurements);
          updateLocalStorageDebounced(allUpdatedMeasurements);
          
          // Fast track mode: Apply morphs immediately for immediate visual feedback
          if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
            updateModelDimensions(modelRef.current, allUpdatedMeasurements);
          }
        } else {
          const updatedMeasurements = { ...measurements, [type]: metricValue.toFixed(1) };
          setMeasurements(updatedMeasurements);
          updateLocalStorageDebounced(updatedMeasurements);
          
          if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
            updateModelDimensions(modelRef.current, updatedMeasurements);
          }
        }
      } else {
        const updatedMeasurements = { ...measurements, [type]: metricValue.toFixed(1) };
        setMeasurements(updatedMeasurements);
        if (type === 'height' || type === 'weight') {
          updateLocalStorageDebounced(updatedMeasurements);
        }
        
        if (isFastTrackMode && (type === 'height' || type === 'weight') && updateModelDimensions && modelRef?.current) {
          updateModelDimensions(modelRef.current, updatedMeasurements);
        }
      }
    };

    // Special handling for height on mobile
    if (type === 'height' && isMobile) {
      return (
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {type}: {formatDisplayLabel(measurements[type])}
            </label>
          </div>
          <GenericRadialSlider
            value={parseFloat(measurements[type])}
            onChange={(newValue) => {
              // Disable fast track mode for mobile height slider changes to preserve user edits
              if (setIsFastTrackMode) {
                setIsFastTrackMode(false);
              }
              
              // Set measurementsChanged flag for analytics
              if (setMeasurementsChanged) {
                console.log('📊 Mobile Height slider changed - setting measurementsChanged to true');
                setMeasurementsChanged(true);
              }

              // Update chest/waist/hips when height changes
              if (gender) {
                const currentHeight = newValue;
                const currentWeight = parseFloat(measurements.weight) || 70;
                
                const calculatedMeasurements = calculateBodyMeasurements(currentHeight, currentWeight, gender);
                if (calculatedMeasurements) {
                  const allUpdatedMeasurements = {
                    ...measurements,
                    height: newValue.toFixed(1),
                    chest: calculatedMeasurements.chest.toFixed(1),
                    waist: calculatedMeasurements.waist.toFixed(1),
                    hips: calculatedMeasurements.hips.toFixed(1)
                  };
                  setMeasurements(allUpdatedMeasurements);
                  updateLocalStorageDebounced(allUpdatedMeasurements);
                  
                  // Fast track mode: Apply morphs immediately for immediate visual feedback
                  if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
                    updateModelDimensions(modelRef.current, allUpdatedMeasurements);
                  }
                } else {
                  const updatedMeasurements = { ...measurements, height: newValue.toFixed(1) };
                  setMeasurements(updatedMeasurements);
                  updateLocalStorageDebounced(updatedMeasurements);
                  
                  if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
                    updateModelDimensions(modelRef.current, updatedMeasurements);
                  }
                }
              } else {
                const updatedMeasurements = { ...measurements, height: newValue.toFixed(1) };
                setMeasurements(updatedMeasurements);
                updateLocalStorageDebounced(updatedMeasurements);
                
                if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
                  updateModelDimensions(modelRef.current, updatedMeasurements);
                }
              }
            }}
            useMetric={useMetric}
            measurementType="height"
          />
        </div>
      );
    }

    // Special handling for weight on mobile
    if (type === 'weight' && isMobile) {
      return (
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {type}: {formatDisplayLabel(measurements[type])}
            </label>
          </div>
          <GenericRadialSlider
            value={parseFloat(measurements[type])}
            onChange={(newValue) => {
              // Disable fast track mode for mobile weight slider changes to preserve user edits
              if (setIsFastTrackMode) {
                setIsFastTrackMode(false);
              }
              
              // Set measurementsChanged flag for analytics
              if (setMeasurementsChanged) {
                console.log('📊 Mobile Weight slider changed - setting measurementsChanged to true');
                setMeasurementsChanged(true);
              }

              // Update chest/waist/hips when weight changes
              if (gender) {
                const currentHeight = parseFloat(measurements.height) || 175;
                const currentWeight = newValue;
                
                const calculatedMeasurements = calculateBodyMeasurements(currentHeight, currentWeight, gender);
                if (calculatedMeasurements) {
                  const allUpdatedMeasurements = {
                    ...measurements,
                    weight: newValue.toFixed(1),
                    chest: calculatedMeasurements.chest.toFixed(1),
                    waist: calculatedMeasurements.waist.toFixed(1),
                    hips: calculatedMeasurements.hips.toFixed(1)
                  };
                  setMeasurements(allUpdatedMeasurements);
                  updateLocalStorageDebounced(allUpdatedMeasurements);
                  
                  // Fast track mode: Apply morphs immediately for immediate visual feedback
                  if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
                    updateModelDimensions(modelRef.current, allUpdatedMeasurements);
                  }
                } else {
                  const updatedMeasurements = { ...measurements, weight: newValue.toFixed(1) };
                  setMeasurements(updatedMeasurements);
                  updateLocalStorageDebounced(updatedMeasurements);
                  
                  if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
                    updateModelDimensions(modelRef.current, updatedMeasurements);
                  }
                }
              } else {
                const updatedMeasurements = { ...measurements, weight: newValue.toFixed(1) };
                setMeasurements(updatedMeasurements);
                updateLocalStorageDebounced(updatedMeasurements);
                
                if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
                  updateModelDimensions(modelRef.current, updatedMeasurements);
                }
              }
            }}
            useMetric={useMetric}
            measurementType="weight"
          />
        </div>
      );
    }

    return (
      <div className="space-y-2 md:space-y-3">
        {!isMobile && (
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {type}: {formatDisplayLabel(measurements[type])}
            </label>
            {(type === 'chest' || type === 'waist' || type === 'hips') && (
              <button
                onClick={() => setShowMeasurementGuide(type as "chest" | "waist" | "hips")}
                className="text-blue-600 hover:text-blue-700"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex gap-2 md:gap-4">
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={getSliderValue()}
              onChange={handleSliderChange}
              className="w-full h-3 md:h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-0.5 md:mt-1">
              <span>{displayRange.min}</span>
              <span>{displayRange.max}</span>
            </div>
          </div>
          <input
            type="number"
            value={getCurrentDisplayValue()}
            onChange={handleNumberChange}
            className="w-16 md:w-20 px-1 md:px-2 py-0.5 md:py-1 border rounded-lg text-center text-base"
            step={displayRange.step}
            min={displayRange.min}
            max={displayRange.max}
          />
        </div>
      </div>
    );
  }, [isMobile, measurements, useMetric, getLocalJSONBasedLimits, setMeasurements, setShowMeasurementGuide, handleMorphChange, handleWeightMorphs, debugData]);

  return {
    renderMeasurementInputs
  };
}
