/// <reference types="react" />
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GenericRadialSlider } from '../components/GenericRadialSlider';
import { MobileMeasurementSlider } from '../components/MobileMeasurementSlider';
import { SizeButton } from '../components/SizeButton';
import { SLIDER_LABELS } from '../utils/sliderUtils';
import { getEnhancedSliderConfig } from '../utils/sliderIntegration';
import { calculateBodyMeasurements, calculateShapeKeys } from '../utils/bodyMeasurements';
import { Info } from 'lucide-react';
import { Measurements } from '../types';
import { analytics } from '../components/analytics';

// Define the interface for step parameters
interface UseStepManagerParams {
  isMobile: boolean;
  isModelLoading: boolean;
  measurements: Measurements;
  setMeasurements: React.Dispatch<React.SetStateAction<Measurements>>;
  useMetric: boolean;
  setUseMetric: React.Dispatch<React.SetStateAction<boolean>>;
  renderMeasurementInputs: (type: 'height' | 'weight' | 'chest' | 'waist' | 'hips') => React.ReactElement;
  handleWeightMorphs: (weightValue: number) => void;
  gender: "male" | "female" | null;
  setGender: React.Dispatch<React.SetStateAction<"male" | "female" | null>>;
  // Analytics tracking
  licenseKey?: string;
  productId?: string; // Add productId for analytics
  activeProfile?: any; // Add activeProfile for correct measurements in analytics
  // Step 5 dependencies (optional)
  apiSizeResult?: { 
    size?: string; 
    confidence?: number; 
    method?: string; 
    error?: string;
    explanation?: string;
    smaller_size?: string | null;
    larger_size?: string | null;
    smaller_reason?: string | null;
    larger_reason?: string | null;
    range_type?: string;
  } | null;
  isApiLoading?: boolean;
  apiError?: Error | null;
  calculateSize?: () => { size: string; confidence: number };
  addToBagWithSize?: (size: string) => Promise<void>; // Changed from handleAddToBag
  // Mobile step dependencies
  getLocalJSONBasedLimits?: (type: 'chest' | 'waist' | 'hips') => { min: number; max: number; default: number };
  setUserEditedMeasurements?: React.Dispatch<React.SetStateAction<{ chest: boolean; waist: boolean; hips: boolean }>>;
  handleMorphChange?: (paramName: string, value: number) => void;
  setShowMeasurementGuide?: (type: 'chest' | 'waist' | 'hips') => void;
  measurementsChanged?: boolean;
  setMeasurementsChanged?: (changed: boolean) => void;
  debugData?: {
    heightWeight?: {
      fetchedData?: {
        measurements?: {
          chest: number;
          waist: number;
          hips: number;
        };
      };
    };
    setDebugData?: React.Dispatch<React.SetStateAction<any>>;
  };
  setIsFastTrackMode?: (value: boolean) => void;
  isFastTrackMode?: boolean;
  updateModelDimensions?: (model: any, measurements: Measurements) => void;
  modelRef?: React.RefObject<any>;
  setHasUserMadeChanges?: React.Dispatch<React.SetStateAction<boolean>>;
  calculateMorphRange?: (jsonPositionPercent: number, measurementType?: 'chest' | 'waist' | 'hips', jsonMorphValue?: number) => any;
  calculateMorphFromSliderPosition?: (sliderPositionPercent: number, jsonPositionPercent: number, measurementType?: 'chest' | 'waist' | 'hips', jsonMorphValue?: number) => any;
  hasCalculatedForCurrentMeasurements?: boolean;
}

// Define the interface for step manager return
interface UseStepManagerReturn {
  renderStep1: () => React.ReactElement;
  renderStep2: () => React.ReactElement;
  renderStep3: () => React.ReactElement;
  renderStep5: () => React.ReactElement;
  renderMobileStep4: () => React.ReactElement;
  renderMobileStep5: () => React.ReactElement;
  renderMobileStep6: () => React.ReactElement;
  renderMobileStep8: () => React.ReactElement;
  renderMobileSizeButtons: () => React.ReactElement | null;
  handleGenderSelect: (newGender: "male" | "female") => void;
  selectedSize: string;
  handleAddToBag: () => Promise<void>;
}

type ScenarioType = "ideal" | "upper_range" | "lower_range";

export function useStepManager(params: UseStepManagerParams): UseStepManagerReturn {
  // API-based scenario and size data
  const [scenario, setScenario] = useState<ScenarioType>("ideal");
  const [selectedSize, setSelectedSize] = useState<string>("---");
  const [sizeMessage, setSizeMessage] = useState<string>("Getting your perfect size...");
  const [smallerSize, setSmallerSize] = useState<string | null>(null);
  const [largerSize, setLargerSize] = useState<string | null>(null);
  const [smallerReason, setSmallerReason] = useState<string | null>(null);
  const [largerReason, setLargerReason] = useState<string | null>(null);
  const [apiData, setApiData] = useState<any>(null);

  
  const { 
    isMobile, 
    isModelLoading, 
    measurements, 
    setMeasurements, 
    useMetric, 
    setUseMetric, 
    renderMeasurementInputs,
    handleWeightMorphs,
    gender,
    setGender,
    licenseKey,
    productId,
    activeProfile,
    apiSizeResult,
    isApiLoading,
    apiError,
    calculateSize,
    addToBagWithSize,
    getLocalJSONBasedLimits,
    setUserEditedMeasurements,
    handleMorphChange,
    setShowMeasurementGuide,
    measurementsChanged,
    setMeasurementsChanged,
    debugData,
    setIsFastTrackMode,
    isFastTrackMode,
    updateModelDimensions,
    modelRef,
    setHasUserMadeChanges,
    calculateMorphRange,
    calculateMorphFromSliderPosition,
    hasCalculatedForCurrentMeasurements
  } = params;

  // Update API data when apiSizeResult changes
  useEffect(() => {
    if (apiSizeResult && apiSizeResult.size) {
      const api = apiSizeResult as any;
      
      setScenario(api.range_type || "ideal");
      setSelectedSize(apiSizeResult.size);
      setSizeMessage(api.explanation || "Your recommended size");
      
      // Set individual size variables
      setSmallerSize(api.smaller_size || null);
      setLargerSize(api.larger_size || null);
      setSmallerReason(api.smaller_reason || null);
      setLargerReason(api.larger_reason || null);
      
      console.log('🔥 Sizes set:', {
        smaller: api.smaller_size,
        larger: api.larger_size,
        smaller_reason: api.smaller_reason,
        larger_reason: api.larger_reason
      });
      
      // Set API data for other uses
      setApiData({
        recommended_size: apiSizeResult.size,
        smaller_size: api.smaller_size || null,
        larger_size: api.larger_size || null,
        range_type: api.range_type || "ideal",
        comments: {
          main: api.explanation || "Your recommended size",
          smaller: api.smaller_reason || null,
          larger: api.larger_reason || null
        }
      });
    }
  }, [apiSizeResult]);

  // Clear old data when API loading starts
  useEffect(() => {
    if (isApiLoading) {
      setApiData(null);
      setSmallerSize(null);
      setLargerSize(null);
      setSmallerReason(null);
      setLargerReason(null);
      setScenario("ideal");
      setSizeMessage("Getting your perfect size...");
      setSelectedSize("---"); // Clear selected size during loading
    }
  }, [isApiLoading]);

  // Handle size button clicks with API data
  const handleSizeClick = (size: string) => {
    setSelectedSize(size);
    
    // Track size selection
    if (licenseKey && gender) {
      analytics.trackSizeRecommended(licenseKey, gender, size, {
        primary: apiData?.recommended_size,
        smaller: smallerSize || undefined,
        larger: largerSize || undefined
      }).catch(error => {
        console.warn('Failed to track size recommendation:', error);
      });
    }
    
    if (!apiData) return;
    
    const recommendedSize = apiData.recommended_size;
    
    if (size === recommendedSize) {
      // Selected the recommended size
      setSizeMessage(apiData.comments.main);
    } else if (size === smallerSize) {
      // Selected the smaller alternative size
      setSizeMessage(smallerReason || "Smaller size option");
    } else if (size === largerSize) {
      // Selected the larger alternative size
      setSizeMessage(largerReason || "Larger size option");
    } else {
      // Fallback message
      setSizeMessage("This size may not be the best fit for your measurements.");
    }
  };

  // Handle Add to Bag with selected size
  const handleAddToBag = useCallback(async () => {
    if (!addToBagWithSize) return;
    
    // Use selected size if available and not default
    let size: string;
    if (selectedSize && selectedSize !== "---") {
      size = selectedSize;
    } else if (apiSizeResult && apiSizeResult.size && !apiSizeResult.error) {
      // Fallback to API result if available and not an error
      size = apiSizeResult.size;
    } else if (calculateSize) {
      // Final fallback to local calculation
      const localResult = calculateSize();
      size = localResult.size;
    } else {
      // Last resort fallback
      size = "M";
    }
    
    // Track add to cart event with user inputs and selected size
    if (licenseKey && gender) {
      const finalStepId = isMobile ? 'step_7' : 'step_4';
      const timeSpentMs = analytics.getTimeSpent(finalStepId);
      
      // Prepare user inputs data
      const userInputs = {
        gender,
        measurements: {
          height: measurements.height ? parseFloat(measurements.height) : undefined,
          weight: measurements.weight ? parseFloat(measurements.weight) : undefined,
          chest: measurements.chest ? parseFloat(measurements.chest) : undefined,
          waist: measurements.waist ? parseFloat(measurements.waist) : undefined,
          hips: measurements.hips ? parseFloat(measurements.hips) : undefined
        },
        step_progression: isMobile ? {
          step_1_completed: true, // Gender selection
          step_2_completed: true, // Height measurement
          step_3_completed: true, // Weight measurement
          step_4_completed: true, // Chest measurement
          step_5_completed: true, // Waist measurement
          step_6_completed: true, // Hips measurement
          step_7_completed: true  // Size recommendation
        } : {
          step_1_completed: true, // Gender selection
          step_2_completed: true, // Basic measurements
          step_3_completed: true, // Detailed measurements
          step_4_completed: true  // Size recommendation
        }
      };
      
      // Use actual API response data for recommended sizes instead of local state
      const recommendedSizes = apiSizeResult ? {
        primary: apiSizeResult.size,
        smaller: apiSizeResult.smaller_size || undefined,
        larger: apiSizeResult.larger_size || undefined
      } : {
        primary: size,
        smaller: smallerSize || undefined,
        larger: largerSize || undefined
      };
      
      analytics.trackAddToCart(
        licenseKey, 
        productId || 'tshirt-classic-001', // Use provided productId or fallback
        size, 
        gender, 
        timeSpentMs, 
        userInputs.step_progression,
        userInputs.measurements,
        recommendedSizes
      ).catch(error => {
        console.warn('Failed to track add to cart:', error);
      });
    }
    
    await addToBagWithSize(size);
  }, [selectedSize, apiSizeResult, calculateSize, addToBagWithSize, licenseKey, isMobile, gender, measurements, productId]);

  // Track final step when API data is available (desktop step 4, mobile step 7)
  const hasTrackedFinalStep = useRef(false);
  useEffect(() => {
    if (apiData && licenseKey && !hasTrackedFinalStep.current) {
      hasTrackedFinalStep.current = true;
      
      // Create user inputs object for analytics
      // For existing users, use activeProfile measurements (same as API call)
      // For new users, use current component state measurements
      const measurementsForAnalytics = activeProfile?.measurements || measurements;
      
      console.log('📊 Step started analytics - using measurements:', {
        hasActiveProfile: !!activeProfile,
        usingProfileMeasurements: !!activeProfile?.measurements,
        profileMeasurements: activeProfile?.measurements,
        componentMeasurements: measurements,
        finalMeasurements: measurementsForAnalytics
      });
      
      const userInputs = {
        gender: gender || undefined,
        measurements: {
          height: measurementsForAnalytics.height ? parseFloat(measurementsForAnalytics.height) : undefined,
          weight: measurementsForAnalytics.weight ? parseFloat(measurementsForAnalytics.weight) : undefined,
          chest: measurementsForAnalytics.chest ? parseFloat(measurementsForAnalytics.chest) : undefined,
          waist: measurementsForAnalytics.waist ? parseFloat(measurementsForAnalytics.waist) : undefined,
          hips: measurementsForAnalytics.hips ? parseFloat(measurementsForAnalytics.hips) : undefined
        },
        step_progression: isMobile ? {
          step_1_completed: true, // Gender selection
          step_2_completed: true, // Height measurement
          step_3_completed: true, // Weight measurement
          step_4_completed: true, // Chest measurement
          step_5_completed: true, // Waist measurement
          step_6_completed: true, // Hips measurement
          step_7_completed: true  // Size recommendation
        } : {
          step_1_completed: true, // Gender selection
          step_2_completed: true, // Basic measurements
          step_3_completed: true, // Detailed measurements
          step_4_completed: true  // Size recommendation
        }
      };

      // Create recommended sizes object for analytics
      const recommendedSizes = apiSizeResult ? {
        primary: apiSizeResult.size,
        smaller: apiSizeResult.smaller_size || undefined,
        larger: apiSizeResult.larger_size || undefined
      } : {
        primary: selectedSize,
        smaller: smallerSize || undefined,
        larger: largerSize || undefined
      };
      
      if (!isMobile) {
        // Start tracking for desktop final step (step 4)
        analytics.startStepTracking('step_4');
        analytics.trackStepStarted(licenseKey, 'step_4', 'size_recommendation', gender || undefined, false, userInputs, recommendedSizes, measurementsChanged).catch(error => {
          console.warn('Failed to track final step started:', error);
        });
      } else {
        // Start tracking for mobile final step (step 7)
        analytics.startStepTracking('step_7');
        analytics.trackStepStarted(licenseKey, 'step_7', 'size_recommendation', gender || undefined, true, userInputs, recommendedSizes, measurementsChanged).catch(error => {
          console.warn('Failed to track final step started:', error);
        });
      }
    }
  }, [apiData, licenseKey, isMobile, gender, measurements, apiSizeResult, selectedSize, smallerSize, largerSize, activeProfile]);

  // Gender selection handler
  const handleGenderSelect = useCallback((newGender: "male" | "female") => {
    setGender(newGender);
    
    // Track gender selection
    if (licenseKey) {
      analytics.trackGenderSelected(licenseKey, newGender).catch(error => {
        console.warn('Failed to track gender selection:', error);
      });
    }
  }, [licenseKey, isMobile]);

  // Step 1: Gender Selection Renderer
  const renderStep1 = useCallback((): React.ReactElement => {
    const headerText = "Select Your Gender";
    const gridClass = isMobile ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-3 md:gap-4";
    const containerClass = isMobile ? "space-y-3" : "space-y-4 md:space-y-6 flex-1";
    const headerClass = isMobile ? "text-base font-bold text-gray-900" : "text-lg md:text-xl font-bold text-gray-900";
    const buttonPadding = isMobile ? "p-3" : "p-4 md:p-6";
    const textClass = isMobile ? "text-sm font-medium capitalize text-gray-900" : "text-base md:text-lg font-medium capitalize text-gray-900";

    return (
      <div className="flex flex-col flex-1">
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <h2 className={headerClass}>{headerText}</h2>
          </div>
          <div className={gridClass}>
            {["male", "female"].map((option) => {
              const isSelected = gender === option;

              return (
                <button
                  key={option}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const newGender = option as "male" | "female";
                    handleGenderSelect(newGender);
                  }}
                  disabled={isModelLoading}
                  className={`${buttonPadding} rounded-xl border-2 transition-all relative ${
                    gender === option
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  } ${isModelLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <p className={textClass}>
                    {option}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [isMobile, isModelLoading, gender, handleGenderSelect]);

  // Step 2: Height and Weight (Basic Measurements) Renderer
  const renderStep2 = useCallback((): React.ReactElement => {
    if (!isMobile) {
      // Desktop version - shows both height and weight
      return (
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Basic Measurement</h2>
              <button
                onClick={() => setUseMetric(!useMetric)}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700"
              >
                Switch to {useMetric ? 'Imperial' : 'Metric'}
              </button>
            </div>
            <div className="space-y-4 md:space-y-6">
              {renderMeasurementInputs('height')}
              {renderMeasurementInputs('weight')}
            </div>
          </div>
        </div>
      );
    } else {
      // Mobile version - only height in step 2
      return (
        <div className="">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Your Height</h2>
            <button
              onClick={() => setUseMetric(!useMetric)}
              className="text-xs text-blue-600"
            >
              Switch to {useMetric ? 'Imperial' : 'Metric'}
            </button>
          </div>
          <GenericRadialSlider
            value={parseFloat(measurements.height) || 170}
            onChange={val => {

              
              // Track that user made changes
              if (setHasUserMadeChanges) {

                setHasUserMadeChanges(true);
              }
              
              // Set measurementsChanged flag for analytics
              if (setMeasurementsChanged) {
                setMeasurementsChanged(true);
              }
              
              // Skip disabling fast-track mode to preserve profile values during mobile height slider changes
              // if (setIsFastTrackMode) {
              //   setIsFastTrackMode(false);
              // }
              
              // Update measurements with new height
              const updatedMeasurements = { ...measurements, height: val.toString() };
              setMeasurements(updatedMeasurements);
              
              // Update JSON baseline data for chest/waist/hips sliders when height changes on mobile
              // Skip in fast track mode to preserve profile values
              if (gender && measurements.weight && debugData && debugData.setDebugData && !isFastTrackMode) {
                const heightNum = val;
                const weightNum = parseFloat(measurements.weight);
                if (!isNaN(heightNum) && !isNaN(weightNum)) {
                  // Import calculateBodyMeasurements dynamically
                  import('../utils/bodyMeasurements').then(({ calculateBodyMeasurements }) => {
                    const jsonMeasurements = calculateBodyMeasurements(heightNum, weightNum, gender);
                    if (jsonMeasurements && debugData.setDebugData) {
                      console.log('🔄 Mobile height change: Updating JSON measurements:', jsonMeasurements);
                      debugData.setDebugData((prev: any) => ({
                        ...prev,
                        heightWeight: {
                          ...prev?.heightWeight,
                          fetchedData: {
                            measurements: jsonMeasurements
                          }
                        }
                      }));
                    }
                  }).catch(error => {
                    console.error('Failed to calculate body measurements:', error);
                  });
                }
              }
              
              // Fast track mode: Apply morphs immediately for immediate visual feedback
              if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
                updateModelDimensions(modelRef.current, updatedMeasurements);
                
                // Also reset chest/waist/hips measurements to JSON values like desktop
                if (gender && !isNaN(val) && !isNaN(parseFloat(measurements.weight))) {
                  const jsonMeasurements = calculateBodyMeasurements(val, parseFloat(measurements.weight), gender);
                  if (jsonMeasurements) {
                    setMeasurements(prev => ({
                      ...prev,
                      chest: jsonMeasurements.chest.toFixed(1),
                      waist: jsonMeasurements.waist.toFixed(1),
                      hips: jsonMeasurements.hips.toFixed(1)
                    }));
                  }
                }
              }
            }}
            useMetric={useMetric}
            measurementType="height"
          />
        </div>
      );
    }
  }, [isMobile, measurements, setMeasurements, useMetric, setUseMetric, renderMeasurementInputs, getLocalJSONBasedLimits]);

  // Step 3: Body Measurements (Chest, Waist, Hips) Renderer
  const renderStep3 = useCallback((): React.ReactElement => {
    if (!isMobile) {
      // Desktop version - shows chest, waist, hips
      return (
        <div className={hasCalculatedForCurrentMeasurements ? "space-y-2 md:space-y-3" : "space-y-5 md:space-y-7"}>
          {/* Calculation completion message for desktop */}
          {hasCalculatedForCurrentMeasurements && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 -mt-2 mb-2">
              <p className="text-sm text-blue-800 text-center">
                Your approximate measurements have been calculated. You can adjust them according to your body shape.
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Body Measurements</h2>
            <button
              onClick={() => setUseMetric(!useMetric)}
              className="text-xs md:text-sm text-blue-600 hover:text-blue-700"
            >
              Switch to {useMetric ? 'Imperial' : 'Metric'}
            </button>
          </div>
          <div className={hasCalculatedForCurrentMeasurements ? "space-y-1 md:space-y-2" : "space-y-4 md:space-y-5"}>
            {renderMeasurementInputs('chest')}
            {renderMeasurementInputs('waist')}
            {renderMeasurementInputs('hips')}
          </div>
        </div>
      );
    } else {
      // Mobile version - only weight in step 3
      return (
        <div className="">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Your Weight</h2>
            <button
              onClick={() => setUseMetric(!useMetric)}
              className="text-xs text-blue-600"
            >
              Switch to {useMetric ? 'Imperial' : 'Metric'}
            </button>
          </div>
          <GenericRadialSlider
            value={parseFloat(measurements.weight) || 75}
            onChange={val => {

              
              // Track that user made changes
              if (setHasUserMadeChanges) {

                setHasUserMadeChanges(true);
              }
              
              // Set measurementsChanged flag for analytics
              if (setMeasurementsChanged) {
                setMeasurementsChanged(true);
              }
              
              // Skip disabling fast-track mode to preserve profile values during mobile weight slider changes
              // if (setIsFastTrackMode) {
              //   setIsFastTrackMode(false);
              // }
              
              // Update measurements with new weight
              const updatedMeasurements = { ...measurements, weight: val.toString() };
              setMeasurements(updatedMeasurements);
              handleWeightMorphs(val);
              
              // Update JSON baseline data for chest/waist/hips sliders when weight changes on mobile
              if (gender && measurements.height && debugData && debugData.setDebugData) {
                const heightNum = parseFloat(measurements.height);
                const weightNum = val;
                if (!isNaN(heightNum) && !isNaN(weightNum)) {
                  // Import calculateBodyMeasurements dynamically
                  import('../utils/bodyMeasurements').then(({ calculateBodyMeasurements }) => {
                    const jsonMeasurements = calculateBodyMeasurements(heightNum, weightNum, gender);
                    if (jsonMeasurements && debugData.setDebugData) {
                      console.log('🔄 Mobile weight change: Updating JSON measurements:', jsonMeasurements);
                      debugData.setDebugData((prev: any) => ({
                        ...prev,
                        heightWeight: {
                          ...prev?.heightWeight,
                          fetchedData: {
                            measurements: jsonMeasurements
                          }
                        }
                      }));
                    }
                  }).catch(error => {
                    console.error('Failed to calculate body measurements:', error);
                  });
                }
              }
              
              // Fast track mode: Apply morphs immediately for immediate visual feedback
              if (isFastTrackMode && updateModelDimensions && modelRef?.current) {
                updateModelDimensions(modelRef.current, updatedMeasurements);
                
                // Also reset chest/waist/hips measurements to JSON values like desktop
                if (gender && !isNaN(val) && !isNaN(parseFloat(measurements.height))) {
                  const jsonMeasurements = calculateBodyMeasurements(parseFloat(measurements.height), val, gender);
                  if (jsonMeasurements) {
                    setMeasurements(prev => ({
                      ...prev,
                      chest: jsonMeasurements.chest.toFixed(1),
                      waist: jsonMeasurements.waist.toFixed(1),
                      hips: jsonMeasurements.hips.toFixed(1)
                    }));
                  }
                }
              }
            }}
            useMetric={useMetric}
            measurementType="weight"
          />
        </div>
      );
    }
  }, [isMobile, measurements, setMeasurements, useMetric, setUseMetric, renderMeasurementInputs, handleWeightMorphs]);


  // Step 5: Size Results Renderer (Desktop only - mobile has different flow)
  const renderStep5 = useCallback((): React.ReactElement => {
    // Show loading state if API is loading
    // Show API result if available
    // Show error if API failed
    const desktopSizeResult = apiSizeResult;
    const { size, confidence } = desktopSizeResult || { size: "---", confidence: 0 };
    
    return (
      <div className="space-y-4 md:space-y-6 overflow-y-auto">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Your Recommended Size</h2>
        
        {/* Loading State */}
        {(isApiLoading || !apiData) && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Getting your perfect size...</p>
          </div>
        )}
        
        {/* Results */}
        {apiData && !isApiLoading && (
          <>
            {/* Size Display */}
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-3 md:mb-4">{selectedSize}</div>
              
              {/* Dynamic Message */}
              <div className={`p-4 rounded-xl mb-4 ${
                // Check if selected size is the recommended size (ideal)
                selectedSize === (apiData?.recommended_size)
                  ? 'bg-green-50 text-green-700' 
                  // Check if it's lower_range and smaller size is selected
                  : (scenario === "lower_range" && selectedSize === smallerSize)
                  ? 'bg-lime-50 text-lime-700'
                  // Check if it's upper_range and larger size is selected
                  : (scenario === "upper_range" && selectedSize === largerSize)
                  ? 'bg-lime-50 text-lime-700'
                  // Alternative sizes - no background, just text
                  : 'text-gray-700'
              }`}>
                <p className="text-sm leading-relaxed">
                  {sizeMessage}
                </p>
              </div>
            </div>
          </>
        )}
        
        <div className="pb-3 md:pb-4">
          <button
            onClick={handleAddToBag}
            disabled={isApiLoading || !apiData}
            className="w-full py-3 md:py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApiLoading || !apiData ? "Finding your size..." : `Add to Bag with Size ${selectedSize}`}
          </button>
        </div>

        {/* Try Other Sizes - Fixed Position */}
        <div className="absolute inset-x-0 space-y-2 text-center" style={{top: 'calc(100% - 165px)'}}>
          <h3 className="text-lg font-semibold text-gray-900">Try Other Sizes</h3>
          <div className="flex justify-center gap-3">
            {apiData && (
              <>
                {/* First alternative size (smaller size) */}
                {smallerSize && (
                  <SizeButton 
                    size={smallerSize} 
                    isSelected={selectedSize === smallerSize} 
                    isNearBoundary={scenario === "lower_range"}
                    onClick={() => handleSizeClick(smallerSize)} 
                  />
                )}
                
                {/* Recommended size (middle, always ideal) */}
                <SizeButton 
                  size={apiData.recommended_size} 
                  isSelected={selectedSize === apiData.recommended_size} 
                  isIdeal={true}
                  onClick={() => handleSizeClick(apiData.recommended_size)} 
                />
                
                {/* Second alternative size (larger size) */}
                {largerSize && (
                  <SizeButton 
                    size={largerSize} 
                    isSelected={selectedSize === largerSize} 
                    isNearBoundary={scenario === "upper_range"}
                    onClick={() => handleSizeClick(largerSize)} 
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }, [apiSizeResult, isApiLoading, apiError, calculateSize, addToBagWithSize, measurementsChanged, selectedSize, sizeMessage, handleSizeClick, handleAddToBag]);

  // Mobile Step 4: Chest Measurement Renderer
  const renderMobileStep4 = useCallback((): React.ReactElement => {
    if (!getLocalJSONBasedLimits || !setUserEditedMeasurements || !handleMorphChange || !setShowMeasurementGuide) {
      return <div>Missing dependencies for mobile step 4</div>;
    }

    // Get JSON value from calculateBodyMeasurements function like desktop does
    let jsonValue = 0;
    if (measurements.height && measurements.weight && gender) {
      const calculatedMeasurements = calculateBodyMeasurements(
        parseFloat(measurements.height), 
        parseFloat(measurements.weight), 
        gender
      );
      if (calculatedMeasurements) {
        jsonValue = calculatedMeasurements.chest;

      }
    }

    // If no JSON data, show loading like desktop
    if (!jsonValue || jsonValue === 0) {
      return (
        <div className="text-gray-500 p-4 text-center">
          Loading chest data from JSON...
        </div>
      );
    }

    // Get current value - use JSON value if no measurement set (like desktop)
    const chestValue = measurements.chest === '' || isNaN(parseFloat(measurements.chest)) 
      ? jsonValue 
      : parseFloat(measurements.chest);

    // Use EXACT same enhanced config as desktop with currentValue
    let sliderConfig;
    try {
      sliderConfig = getEnhancedSliderConfig('chest', jsonValue, chestValue, gender || 'male');
    } catch (error: unknown) {
      // Fallback to simple range that includes both JSON and current values 
      const minValue = Math.min(jsonValue, chestValue);
      const maxValue = Math.max(jsonValue, chestValue);
      const rangeSize = Math.max(12, maxValue - minValue + 2);
      const center = (minValue + maxValue) / 2;
      
      sliderConfig = {
        min: center - rangeSize / 2,
        max: center + rangeSize / 2,
        indicatorPosition: jsonValue,
        canIncrease: true,
        canDecrease: true
      };
    }

    return (
      <div className="">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Chest Size</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseMetric(!useMetric)}
              className="text-xs text-blue-600"
            >
              Switch to {useMetric ? 'Imperial' : 'Metric'}
            </button>
            <button
              onClick={() => {
                setShowMeasurementGuide('chest');
                // Track measurement guide opened
                if (licenseKey) {
                  analytics.trackMeasurementGuideOpened(licenseKey, 'chest').catch(error => {
                    console.warn('Failed to track measurement guide opened:', error);
                  });
                }
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
        <MobileMeasurementSlider
          value={chestValue}
          onChange={val => {
            if (!getLocalJSONBasedLimits || !setUserEditedMeasurements || !handleMorphChange || !gender) return;
            
            // Apply EXACT same logic as desktop
            const prevValue = parseFloat(measurements.chest) || jsonValue;
            const clampedValue = Math.min(Math.max(val, sliderConfig.min), sliderConfig.max);
            const valueToSave = clampedValue.toFixed(1);
            setMeasurements(prev => ({ ...prev, chest: valueToSave }));
            setUserEditedMeasurements(prev => ({ ...prev, chest: true }));
            // Set measurementsChanged flag for analytics
            if (setMeasurementsChanged) {
              setMeasurementsChanged(true);
            }
            
            // Use proper morph calculation functions
            if (calculateMorphFromSliderPosition) {
              const sliderRange = sliderConfig.max - sliderConfig.min;
              const sliderPositionPercent = (clampedValue - sliderConfig.min) / sliderRange;
              const jsonPositionPercent = (jsonValue - sliderConfig.min) / sliderRange;
              

              
              // Calculate jsonMorphValue properly using same logic as desktop
              const height = parseFloat(measurements.height) || 175;
              const weight = parseFloat(measurements.weight) || 70;
              
              // Calculate JSON morph value from measurement using JSON data (same as desktop)
              const chest = jsonValue; // Use JSON value for this measurement
              const waist = measurements.waist ? parseFloat(measurements.waist) : (gender === 'male' ? 85 : 80);
              const hips = measurements.hips ? parseFloat(measurements.hips) : (gender === 'male' ? 95 : 100);
              
              let jsonMorphValue = 0;
              try {
                const shapeKeys = calculateShapeKeys(height, weight, chest, waist, hips, gender || 'male');
                if (shapeKeys) {
                  jsonMorphValue = shapeKeys.chest;
                }
              } catch (error) {

              }
              

              
              const result = calculateMorphFromSliderPosition(sliderPositionPercent, jsonPositionPercent, 'chest', jsonMorphValue);
              
              if (handleMorphChange) {
                handleMorphChange('Chest Width', result.morphValue);
              }
            } else {
              // Fallback to direct morph
              handleMorphChange('Chest Width', 0);
            }

          }}
          measurementType="chest"
          jsonValue={jsonValue}
          gender={gender || 'male'}
          labels={SLIDER_LABELS.chest}
          label="Chest"
          sliderConfig={sliderConfig}
        />
      </div>
    );
  }, [measurements, setMeasurements, useMetric, setUseMetric, getLocalJSONBasedLimits, setUserEditedMeasurements, handleMorphChange, setShowMeasurementGuide, debugData, gender, calculateMorphFromSliderPosition]);

  // Mobile Step 5: Waist Measurement Renderer
  const renderMobileStep5 = useCallback((): React.ReactElement => {
    if (!getLocalJSONBasedLimits || !setUserEditedMeasurements || !handleMorphChange || !setShowMeasurementGuide) {
      return <div>Missing dependencies for mobile step 5</div>;
    }

    // Get JSON value from calculateBodyMeasurements function like desktop does
    let jsonValue = 0;
    if (measurements.height && measurements.weight && gender) {
      const calculatedMeasurements = calculateBodyMeasurements(
        parseFloat(measurements.height), 
        parseFloat(measurements.weight), 
        gender
      );
      if (calculatedMeasurements) {
        jsonValue = calculatedMeasurements.waist;

      }
    }

    // If no JSON data, show loading like desktop
    if (!jsonValue || jsonValue === 0) {
      return (
        <div className="text-gray-500 p-4 text-center">
          Loading waist data from JSON...
        </div>
      );
    }

    // Get current value - use JSON value if no measurement set (like desktop)
    const waistValue = measurements.waist === '' || isNaN(parseFloat(measurements.waist)) 
      ? jsonValue 
      : parseFloat(measurements.waist);

    // Use EXACT same enhanced config as desktop with currentValue
    let sliderConfig;
    try {
      sliderConfig = getEnhancedSliderConfig('waist', jsonValue, waistValue, gender || 'male');
    } catch (error: unknown) {
      // Fallback to simple range that includes both JSON and current values
      const minValue = Math.min(jsonValue, waistValue);
      const maxValue = Math.max(jsonValue, waistValue);
      const rangeSize = Math.max(12, maxValue - minValue + 2);
      const center = (minValue + maxValue) / 2;
      
      sliderConfig = {
        min: center - rangeSize / 2,
        max: center + rangeSize / 2,
        indicatorPosition: jsonValue,
        canIncrease: true,
        canDecrease: true
      };
    }

    return (
      <div className="">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Waist Size</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseMetric(!useMetric)}
              className="text-xs text-blue-600"
            >
              Switch to {useMetric ? 'Imperial' : 'Metric'}
            </button>
            <button
              onClick={() => {
                setShowMeasurementGuide('waist');
                // Track measurement guide opened
                if (licenseKey) {
                  analytics.trackMeasurementGuideOpened(licenseKey, 'waist').catch(error => {
                    console.warn('Failed to track measurement guide opened:', error);
                  });
                }
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
        <MobileMeasurementSlider
          value={waistValue}
          onChange={val => {
            if (!getLocalJSONBasedLimits || !setUserEditedMeasurements || !handleMorphChange || !gender) return;
            
            // Apply EXACT same logic as desktop
            const prevValue = parseFloat(measurements.waist) || jsonValue;
            const clampedValue = Math.min(Math.max(val, sliderConfig.min), sliderConfig.max);
            const valueToSave = clampedValue.toFixed(1);
            setMeasurements(prev => ({ ...prev, waist: valueToSave }));
            setUserEditedMeasurements(prev => ({ ...prev, waist: true }));
            // Set measurementsChanged flag for analytics
            if (setMeasurementsChanged) {
              setMeasurementsChanged(true);
            }
            
            // Use proper morph calculation functions
            if (calculateMorphFromSliderPosition) {
              const sliderRange = sliderConfig.max - sliderConfig.min;
              const sliderPositionPercent = (clampedValue - sliderConfig.min) / sliderRange;
              const jsonPositionPercent = (jsonValue - sliderConfig.min) / sliderRange;
              

              
              // Calculate jsonMorphValue properly
              const height = parseFloat(measurements.height) || 175;
              const weight = parseFloat(measurements.weight) || 70;
              // For now use 0 as jsonMorphValue (should get proper calculation later)
              const jsonMorphValue = 0;
              
              const result = calculateMorphFromSliderPosition(sliderPositionPercent, jsonPositionPercent, 'waist', jsonMorphValue);
              
              if (handleMorphChange) {
                handleMorphChange('Waist Thickness', result.morphValue);
              }
            } else {
              // Fallback to direct morph
              handleMorphChange('Waist Thickness', 0);
            }

          }}
          measurementType="waist"
          jsonValue={jsonValue}
          gender={gender || 'male'}
          labels={SLIDER_LABELS.waist}
          label="Waist"
          sliderConfig={sliderConfig}
        />
      </div>
    );
  }, [measurements, setMeasurements, useMetric, setUseMetric, getLocalJSONBasedLimits, setUserEditedMeasurements, handleMorphChange, setShowMeasurementGuide, debugData, gender, calculateMorphFromSliderPosition]);

  // Mobile Step 6: Hips Measurement Renderer
  const renderMobileStep6 = useCallback((): React.ReactElement => {
    if (!getLocalJSONBasedLimits || !setUserEditedMeasurements || !handleMorphChange || !setShowMeasurementGuide) {
      return <div>Missing dependencies for mobile step 6</div>;
    }

    // Get JSON value from calculateBodyMeasurements function like desktop does
    let jsonValue = 0;
    if (measurements.height && measurements.weight && gender) {
      const calculatedMeasurements = calculateBodyMeasurements(
        parseFloat(measurements.height), 
        parseFloat(measurements.weight), 
        gender
      );
      if (calculatedMeasurements) {
        jsonValue = calculatedMeasurements.hips;

      }
    }

    // If no JSON data, show loading like desktop
    if (!jsonValue || jsonValue === 0) {
      return (
        <div className="text-gray-500 p-4 text-center">
          Loading hips data from JSON...
        </div>
      );
    }

    // Get current value - use JSON value if no measurement set (like desktop)
    const hipsValue = measurements.hips === '' || isNaN(parseFloat(measurements.hips)) 
      ? jsonValue 
      : parseFloat(measurements.hips);

    // Use EXACT same enhanced config as desktop with currentValue
    let sliderConfig;
    try {
      sliderConfig = getEnhancedSliderConfig('hips', jsonValue, hipsValue, gender || 'male');
    } catch (error: unknown) {
      // Fallback to simple range that includes both JSON and current values
      const minValue = Math.min(jsonValue, hipsValue);
      const maxValue = Math.max(jsonValue, hipsValue);
      const rangeSize = Math.max(12, maxValue - minValue + 2);
      const center = (minValue + maxValue) / 2;
      
      sliderConfig = {
        min: center - rangeSize / 2,
        max: center + rangeSize / 2,
        indicatorPosition: jsonValue,
        canIncrease: true,
        canDecrease: true
      };
    }

    return (
      <div className="">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Hips Size</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseMetric(!useMetric)}
              className="text-xs text-blue-600"
            >
              Switch to {useMetric ? 'Imperial' : 'Metric'}
            </button>
            <button
              onClick={() => {
                setShowMeasurementGuide('hips');
                // Track measurement guide opened
                if (licenseKey) {
                  analytics.trackMeasurementGuideOpened(licenseKey, 'hips').catch(error => {
                    console.warn('Failed to track measurement guide opened:', error);
                  });
                }
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
        <MobileMeasurementSlider
          value={hipsValue}
          onChange={val => {
            if (!getLocalJSONBasedLimits || !setUserEditedMeasurements || !handleMorphChange || !gender) return;
            
            // Apply EXACT same logic as desktop
            const prevValue = parseFloat(measurements.hips) || jsonValue;
            const clampedValue = Math.min(Math.max(val, sliderConfig.min), sliderConfig.max);
            const valueToSave = clampedValue.toFixed(1);
            setMeasurements(prev => ({ ...prev, hips: valueToSave }));
            setUserEditedMeasurements(prev => ({ ...prev, hips: true }));
            // Set measurementsChanged flag for analytics
            if (setMeasurementsChanged) {
              setMeasurementsChanged(true);
            }
            
            // Use proper morph calculation functions
            if (calculateMorphFromSliderPosition) {
              const sliderRange = sliderConfig.max - sliderConfig.min;
              const sliderPositionPercent = (clampedValue - sliderConfig.min) / sliderRange;
              const jsonPositionPercent = (jsonValue - sliderConfig.min) / sliderRange;
              

              
              // Calculate jsonMorphValue properly
              const height = parseFloat(measurements.height) || 175;
              const weight = parseFloat(measurements.weight) || 70;
              // For now use 0 as jsonMorphValue (should get proper calculation later)
              const jsonMorphValue = 0;
              
              const result = calculateMorphFromSliderPosition(sliderPositionPercent, jsonPositionPercent, 'hips', jsonMorphValue);
              
              if (handleMorphChange) {
                handleMorphChange('Hips Size', result.morphValue);
              }
            } else {
              // Fallback to direct morph
              handleMorphChange('Hips Size', 0);
            }

          }}
          measurementType="hips"
          jsonValue={jsonValue}
          gender={gender || 'male'}
          labels={SLIDER_LABELS.hips}
          label="Hips"
          sliderConfig={sliderConfig}
        />
      </div>
    );
  }, [measurements, setMeasurements, useMetric, setUseMetric, getLocalJSONBasedLimits, setUserEditedMeasurements, handleMorphChange, setShowMeasurementGuide, debugData, gender, calculateMorphFromSliderPosition]);



  // Expose SizeButton group as a separate function for mobile step 8
  const renderMobileSizeButtons = useCallback((): React.ReactElement | null => {
    if (!apiData) return null;
    return (
      <div className="space-y-1 text-center mt-2">
        <div className="flex justify-center gap-2">
          {/* First alternative size (smaller size) */}
          {smallerSize && (
            <SizeButton
              size={smallerSize}
              isSelected={selectedSize === smallerSize}
              isNearBoundary={scenario === "lower_range"}
              onClick={() => handleSizeClick(smallerSize)}
            />
          )}
          {/* Recommended size (middle, always ideal) */}
          <SizeButton
            size={apiData.recommended_size}
            isSelected={selectedSize === apiData.recommended_size}
            isIdeal={true}
            onClick={() => handleSizeClick(apiData.recommended_size)}
          />
          {/* Second alternative size (larger size) */}
          {largerSize && (
            <SizeButton
              size={largerSize}
              isSelected={selectedSize === largerSize}
              isNearBoundary={scenario === "upper_range"}
              onClick={() => handleSizeClick(largerSize)}
            />
          )}
        </div>
      </div>
    );
  }, [apiData, smallerSize, largerSize, selectedSize, scenario, handleSizeClick]);

  // Mobile Step 8: Size Results Renderer (without SizeButton group)
  const renderMobileStep8 = useCallback((): React.ReactElement => {
    const mobileSizeResult = apiSizeResult;
    const { size: mobileSize, confidence: mobileConfidence } = mobileSizeResult || { size: "---", confidence: 0 };

    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900">Your Perfect Size</h2>
        {(isApiLoading || !apiData || (measurementsChanged && !apiSizeResult)) && (
          <div className="bg-blue-50 p-3 rounded-xl text-center">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-blue-600">Getting your perfect size...</p>
          </div>
        )}
        {apiError && !isApiLoading && (!measurementsChanged || apiSizeResult) && (
          <div className="bg-yellow-50 p-3 rounded-xl text-center">
            <p className="text-sm text-yellow-700">Size service temporarily unavailable</p>
          </div>
        )}
        {mobileSizeResult?.error && !isApiLoading && (!measurementsChanged || apiSizeResult) && (
          <div className="bg-red-50 p-3 rounded-xl text-center">
            <p className="text-sm text-red-700">Error: {mobileSizeResult.error}</p>
          </div>
        )}
        {apiData && sizeMessage && (
          <div className={`p-3 rounded-xl mt-3 mb-4 text-center ${
            selectedSize === (apiData?.recommended_size)
              ? 'bg-green-50 text-green-700'
              // Check if it's lower_range and smaller size is selected
              : (scenario === "lower_range" && selectedSize === smallerSize)
              ? 'bg-lime-50 text-lime-700'
              // Check if it's upper_range and larger size is selected
              : (scenario === "upper_range" && selectedSize === largerSize)
              ? 'bg-lime-50 text-lime-700'
              : 'text-gray-700'
          }`}>
            <p className="text-xs leading-relaxed">{sizeMessage}</p>
          </div>
        )}
      </div>
    );
  }, [apiSizeResult, isApiLoading, apiError, selectedSize, sizeMessage, apiData, smallerSize, largerSize, scenario]);

  return {
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep5,
    renderMobileStep4,
    renderMobileStep5,
    renderMobileStep6,
    renderMobileStep8,
    renderMobileSizeButtons,
    handleGenderSelect,
    selectedSize,
    handleAddToBag
  };
}
