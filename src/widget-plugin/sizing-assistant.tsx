import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"
import { X, Info, ArrowRight, ArrowLeft, Upload, Brush } from "lucide-react"
import { MeasurementGuide } from "./measurement-guide"
import { ProfileIndicator } from "./ui/profile-indicator"
import { UserProfileSheet } from "./ui/user-profile-sheet"
import { UserProfile } from "./lib/userProfileStorage"
import { profileService } from "./services/profileService"
import { analytics } from "./components/analytics"
import { useThreeScene } from "./hooks/useThreeScene"
import { useBodyModel } from "./hooks/useBodyModel"
import { useStepManager } from "./hooks/useStepManager"
import { SizeButton } from "./components/SizeButton"
import { CalculatingPage } from "./components/CalculatingPage"
import { useCartIntegration } from "./hooks/useCartIntegration"
import { useMeasurementInputs } from "./hooks/useMeasurementInputs"
import { useSizeRecommendation } from "./hooks/useSizeRecommendation"
import { useEffectManagement } from "./hooks/useEffectManagement" 
import { useSizeCalculation } from "./hooks/useSizeCalculation"
import { useUIState } from "./hooks/useUIState"
import { useNavigation } from "./hooks/useNavigation"
import { useParameterManagement } from "./hooks/useParameterManagement"
import { useProfileInitializer } from "./hooks/useProfileInitializer"
import { useProfileFastTrack } from "./hooks/useProfileFastTrack"
import {
  MODEL_URLS,
  ALLOWED_MORPH_TARGETS,
  ALLOWED_HAIR_MORPH_TARGETS,
  PARAMETER_CONTROLS,
  MODEL_POSITIONING,
  MEASUREMENT_LIMITS,
  WEIGHT_LIMITS,
  SCENE_CONFIG,
  UI_CONFIG,
  UNIT_CONVERSION,
  SKIN_COLOR_OPTIONS
} from "./constants/sizing-assistant"
import { 
  getJSONBasedLimitsSync
} from "./utils/measurementUtils"

interface SizingAssistantProps {
  onClose: () => void
  onSizeRecommended: (size: string) => void
  productId?: string;
  brandId?: string;
  clothingType?: string;
  licenseStatus: { isValid: boolean; message?: string } | null;
  licenseKey: string;
}

export function SizingAssistant({ onClose, onSizeRecommended, productId,brandId, clothingType, licenseStatus, licenseKey }: SizingAssistantProps) {
  // ...existing code...
  // Use UI State hook
  const { isMobile, setIsMobile, isSafari, getModalHeight } = useUIState()
  
  const [useMetric, setUseMetric] = useState(true)
  
  // Basic state for API functionality
  const [apiSizeResult, setApiSizeResult] = useState<{ size?: string; confidence?: number; method?: string; error?: string } | null>(null);
  const [useApiRecommendation, setUseApiRecommendation] = useState(true);
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [measurementsChanged, setMeasurementsChanged] = useState(false)
  const [isApiLoadingLocal, setIsApiLoadingLocal] = useState(false)
  
  // Create wrapper for setApiSizeResult to match expected signature
  const handleSetApiSizeResult = (result: { size?: string; confidence?: number; method?: string; error?: string } | null) => {
    setApiSizeResult(result);
  };


  const [showMeasurementGuide, setShowMeasurementGuide] = useState<"chest" | "waist" | "hips" | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [showSkinColorTag, setShowSkinColorTag] = useState(true)
  const [showSkinColorPanel, setShowSkinColorPanel] = useState(false)
  const [selectedSkinColor, setSelectedSkinColor] = useState<string | null>(null)
  const [hasTrackedRecommendation, setHasTrackedRecommendation] = useState(false);
  const [userEditedMeasurements, setUserEditedMeasurements] = useState({ chest: false, waist: false, hips: false });
  const [userEditedHeightWeight, setUserEditedHeightWeight] = useState({ height: false, weight: false });
  const [debugData, setDebugData] = useState<any>({});
  const [showCalculating, setShowCalculating] = useState(false);
  const [hasCalculatedForCurrentMeasurements, setHasCalculatedForCurrentMeasurements] = useState(false);
  const [showInfoMessage, setShowInfoMessage] = useState(false);


  // Track popup opened event (only once when component mounts)
  const hasTrackedPopupOpened = useRef(false);
  const sessionIsMobile = useRef<boolean>(false);
  const hasSetSessionMobile = useRef(false);
  
  // Set session mobile value immediately when component mounts
  useEffect(() => {
    if (!hasSetSessionMobile.current) {
      sessionIsMobile.current = isMobile;
      hasSetSessionMobile.current = true;
    }
  }, [isMobile]);
  
  useEffect(() => {
    if (hasTrackedPopupOpened.current) return;
    
    const trackPopupOpened = async () => {
      try {
        hasTrackedPopupOpened.current = true;
        // Use the session mobile value that was set immediately
        // Reset analytics session for new popup session
        analytics.resetSession();
        await analytics.trackPopupOpened(licenseKey, productId);
        // Start tracking for first step
        analytics.startStepTracking('step_1');
        // Track step 1 started
        await analytics.trackStepStarted(licenseKey, 'step_1', 'gender_selection', undefined, false, undefined, undefined, measurementsChanged);
      } catch (error) {
        console.warn('Failed to track popup opened:', error);
      }
    };
    
    trackPopupOpened();
  }, []); // Empty dependency array to run only once


  // Fast-track profile initialization
  const { activeProfile, allProfiles, initialStep, isFastTrackMode, isProfileReady, setIsFastTrackMode } = useProfileInitializer(isMobile)
  
  // Profile management state
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(activeProfile);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [showProfileSavedAnimation, setShowProfileSavedAnimation] = useState(false);
  const [isProfileSwitching, setIsProfileSwitching] = useState(false);

  // Measurements state - now declared after currentProfile
  const [measurements, setMeasurements] = useState<{
    height: string;
    weight: string;
    chest: string;
    waist: string;
    hips: string;
  }>({
    height: currentProfile?.measurements?.height || '',
    weight: currentProfile?.measurements?.weight || '',
    chest: currentProfile?.measurements?.chest || '',
    waist: currentProfile?.measurements?.waist || '',
    hips: currentProfile?.measurements?.hips || '',
  })

  // Use Size Calculation hook - now using the measurements state
  const { calculateSize } = useSizeCalculation({ measurements })

  // Reset calculation flag when measurements change
  useEffect(() => {
    setHasCalculatedForCurrentMeasurements(false);
    setShowInfoMessage(false);
  }, [measurements.height, measurements.weight]);

  // Track initial step for fast-track mode
  useEffect(() => {
    if (hasTrackedPopupOpened.current && initialStep > 1 && licenseKey) {
      // If we're in fast-track mode and starting at a later step, track that step as started
      const stepNames = sessionIsMobile.current ? {
        0: 'new_profile_creation',
        1: 'gender_selection',
        2: 'height_measurement',
        3: 'weight_measurement', 
        4: 'chest_measurement',
        5: 'waist_measurement',
        6: 'hips_measurement',
        7: 'size_recommendation'
      } : {
        0: 'new_profile_creation',
        1: 'gender_selection',
        2: 'basic_measurements',
        3: 'detailed_measurements',
        4: 'size_recommendation'
      };
      
      // Clear any existing tracking for the initial step and start fresh
      analytics.clearStepEvents(`step_${initialStep}`);
      analytics.startStepTracking(`step_${initialStep}`);
      
      // For steps 2-4 (desktop) or 2-7 (mobile), include user inputs and recommended sizes
      const shouldIncludeUserInputs = 
        (!(sessionIsMobile.current || isMobile) && initialStep >= 2 && initialStep <= 4) ||
        ((sessionIsMobile.current || isMobile) && initialStep >= 2 && initialStep <= 7);
        
      if (shouldIncludeUserInputs) {
        const userInputs = {
          gender: activeProfile?.gender || undefined,
          measurements: measurements ? {
            height: measurements.height ? parseFloat(measurements.height) : undefined,
            weight: measurements.weight ? parseFloat(measurements.weight) : undefined,
            chest: measurements.chest ? parseFloat(measurements.chest) : undefined,
            waist: measurements.waist ? parseFloat(measurements.waist) : undefined,
            hips: measurements.hips ? parseFloat(measurements.hips) : undefined
          } : undefined,
          step_progression: {
            step_1_completed: true, // Gender selection completed
            step_2_completed: initialStep > 2,
            step_3_completed: initialStep > 3,
            step_4_completed: initialStep > 4,
            step_5_completed: initialStep > 5,
            step_6_completed: initialStep > 6,
            step_7_completed: initialStep > 7
          }
        };
        
        // For initial steps before final step, we don't have recommended sizes yet, so pass undefined
        analytics.trackStepStarted(
          licenseKey, 
          `step_${initialStep}`, 
          stepNames[initialStep as keyof typeof stepNames] || `step_${initialStep}`,
          activeProfile?.gender || undefined,
          sessionIsMobile.current || isMobile,
          userInputs,
          undefined,
          measurementsChanged
        ).catch(error => {
          console.warn('Failed to track initial step started (fast-track):', error);
        });
      } else {
        // For other initial steps, use the original call
        analytics.trackStepStarted(
          licenseKey, 
          `step_${initialStep}`, 
          stepNames[initialStep as keyof typeof stepNames] || `step_${initialStep}`,
          undefined,
          sessionIsMobile.current || isMobile,
          undefined,
          undefined,
          measurementsChanged
        ).catch(error => {
          console.warn('Failed to track initial step started (fast-track):', error);
        });
      }
    }
  }, [initialStep, licenseKey, sessionIsMobile, activeProfile, measurements, isMobile]);


  // Use Navigation hook (after profile initialization)
  const { step, setStep, gender, setGender, totalSteps, handleNext: originalHandleNext, handlePrevious, handleNavigateToStep0, setApiSizeRecommendation } = useNavigation({
    isMobile: sessionIsMobile.current || isMobile, // Use session mobile value if available, fallback to current
    useApiRecommendation,
    setApiSizeResult: handleSetApiSizeResult,
    setConfidenceScore,
    measurements,
    setMeasurementsChanged,
    measurementsChanged,
    setIsApiLoadingLocal,
    initialStep,
    initialGender: activeProfile?.gender || null,
    activeProfile,
    isFastTrackMode,
    licenseKey,
    onStartNewProfile: () => {
      // Same logic as in profile sheet - complete reset
      setCurrentProfile(null);
      profileService.clearActiveProfile();
      setStep(1);
      setGender(null);
      setMeasurements({
        height: "175",
        weight: "70", 
        chest: "", 
        waist: "", 
        hips: ""   
      });
      setSelectedSkinColor(null);
      setSelectedHair(null);
      setIsModelLoading(false);
      setModelError(null);
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current = null;
      }
      setUserEditedMeasurements({ chest: false, waist: false, hips: false });
    },
    onProfileCached: () => {
      // Get the newly created active profile
      const newActiveProfile = profileService.getActiveProfile()
      if (newActiveProfile) {
        setCurrentProfile(newActiveProfile)
      }
      
      setShowProfileSavedAnimation(true)
      // Reset animation after 3 seconds
      setTimeout(() => setShowProfileSavedAnimation(false), 3000)
    }
  });


  // Debug: Log navigation state and step changes
  useEffect(() => {
  }, [step, totalSteps, gender, initialStep, isFastTrackMode, measurements])


  // API-based size recommendation
  const { getSizeRecommendation, isLoading: isApiLoading, error: apiError } = useSizeRecommendation();

  const prevStepRef = useRef<number>(0);

  // Sync currentProfile with activeProfile from hook
  useEffect(() => {
    setCurrentProfile(activeProfile)
  }, [activeProfile])

  // Sync measurements when currentProfile changes
  useEffect(() => {
    if (currentProfile?.measurements) {
      setMeasurements({
        height: currentProfile.measurements.height || '',
        weight: currentProfile.measurements.weight || '',
        chest: currentProfile.measurements.chest || '',
        waist: currentProfile.measurements.waist || '',
        hips: currentProfile.measurements.hips || '',
      })
    }
  }, [currentProfile])


  const getLocalJSONBasedLimits = (measurementType: 'chest' | 'waist' | 'hips') => {
    // Use fetched JSON data if available, otherwise fallback to sync calculation
    const fetchedData = debugData?.fetchedData;
    if (fetchedData && gender) {
      let fetchedValue = 0;
      if (measurementType === 'chest') fetchedValue = fetchedData.chest;
      else if (measurementType === 'waist') fetchedValue = fetchedData.waist;
      else if (measurementType === 'hips') fetchedValue = fetchedData.hip;
      
      // Use gender-specific limits from config
      const genderLimits = MEASUREMENT_LIMITS;
      const absoluteMin = genderLimits[measurementType].min;
      const absoluteMax = genderLimits[measurementType].max;
      
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
    }
    
    // Fallback to sync calculation if no fetched data
    return getJSONBasedLimitsSync(
      measurementType,
      measurements.height,
      measurements.weight,
      gender
    );
  };

  // Step state (temporary - will be moved to useStepManager) - REMOVED: Now handled by useNavigation hook
  const modelContainerRef = useRef<HTMLDivElement>(null as any)
  
  // Use the Three.js scene hook
  const { sceneRef, cameraRef, rendererRef } = useThreeScene(modelContainerRef)

  // Hair feature state
  const [showHairTag, setShowHairTag] = useState(true);
  const [showHairPanel, setShowHairPanel] = useState(false);
  const [selectedHair, setSelectedHair] = useState<'hair1' | 'hair2' | null>(null);

  // Use the Body Model hook
  const {
    modelRef,
    morphTargets,
    setMorphTargets,
    morphValues,
    setMorphValues,
    hairMorphTargets,
    setHairMorphTargets,
    hairMorphValues,
    setHairMorphValues,
    hairMeshMap,
    handleSkinColorSelect,
    switchSkin,
    handleHairMorphChange,
    toggleHairSet,
    handleMorphChange,
    handleMorphChangeFromSlider,
    calculateMorphRange,
    calculateMorphFromSliderPosition,
    resetAllMorphs,
    applyMorphValues,
    updateModelDimensions
    } = useBodyModel({
    sceneRef,
    cameraRef,
    modelContainerRef,
    gender,
    measurements,
    step,
    isMobile,
    setIsModelLoading,
    setModelError,
    selectedSkinColor,
    showSkinColorPanel,
    setSelectedSkinColor,
    setShowSkinColorPanel,
    setShowSkinColorTag,
    showHairPanel,
    selectedHair,
    setSelectedHair,
    setShowHairTag,
    setDebugData,
    isProfileSwitching,
    currentProfile,
    isFastTrackMode
  });

  // Debug panel: shape key'ler
  const allShapeKeys = useMemo(() => {
    if (!morphValues) return [];
    return Array.from(morphValues.keys());
  }, [morphValues]);
  const appliedShapeKeys = useMemo(() => {
    if (!morphValues) return [];
    return Array.from(morphValues.entries()).filter(([key, value]) => value !== 0);
  }, [morphValues]);

  // Use Parameter Management hook
  const { parameterValues, setParameterValues, handleParameterChange } = useParameterManagement({ modelRef: modelRef as any })

  // Wrapper to pass skin color and morph values to navigation
  const handleNext = useCallback(() => {
    console.log('🔄 handleNext called with step:', step, 'isMobile:', isMobile);
    
    // Check if we should show calculating page
    const shouldShowCalculating = (!isMobile && step === 2) || (isMobile && step === 3);
    
    console.log('💭 shouldShowCalculating:', shouldShowCalculating, 'hasCalculated:', hasCalculatedForCurrentMeasurements);
    
    if (shouldShowCalculating && !hasCalculatedForCurrentMeasurements) {
      console.log('🎬 Starting calculating animation');
      setShowCalculating(true);
      setHasCalculatedForCurrentMeasurements(true);
      return;
    }
    
    // Disable fast track mode when moving from desktop step 2 to step 3
    // OR if user has manually changed height/weight values
    // if (!isMobile && step === 2 && setIsFastTrackMode) {
    //   setIsFastTrackMode(false);
    // } else 
    if ((userEditedHeightWeight.height || userEditedHeightWeight.weight) && setIsFastTrackMode) {
      setIsFastTrackMode(false);
    }
    
    originalHandleNext(selectedSkinColor, morphValues)
  }, [originalHandleNext, selectedSkinColor, morphValues, isMobile, step, setIsFastTrackMode, userEditedHeightWeight, hasCalculatedForCurrentMeasurements])

  // Store refs for stable callback
  const calculatingCompleteRef = useRef<() => void>(() => {});
  
  useEffect(() => {
    calculatingCompleteRef.current = () => {
      console.log('🎯 Calculating complete, current step:', step, 'proceeding to next step');
      
      // First call originalHandleNext to change the step
      // Disable fast track mode when moving from desktop step 2 to step 3
      if ((userEditedHeightWeight.height || userEditedHeightWeight.weight) && setIsFastTrackMode) {
        setIsFastTrackMode(false);
      }
      
      console.log('🚀 Calling originalHandleNext with step:', step, { selectedSkinColor, morphValues });
      originalHandleNext(selectedSkinColor, morphValues);
      
      // Then hide calculating page with a small delay to ensure step is updated
      setTimeout(() => {
        console.log('⏳ Hiding calculating page after step change');
        setShowCalculating(false);
        
        // Show info message on mobile after animation completes
        if (isMobile) {
          setShowInfoMessage(true);
          // Auto-hide after 3 seconds
          setTimeout(() => {
            setShowInfoMessage(false);
          }, 3000);
        }
      }, 50);
    };
  });

  // Handle calculating page completion - stable callback
  const handleCalculatingComplete = useCallback(() => {
    calculatingCompleteRef.current?.();
  }, [])

  // Weight morphs are now handled by updateModelDimensions only

  // Track if user has made manual changes to measurements
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);

  // Use the Measurement Inputs hook (after useBodyModel)
  const { renderMeasurementInputs } = useMeasurementInputs({
    isMobile,
    measurements,
    setMeasurements,
    useMetric,
    gender,
    getLocalJSONBasedLimits,
    setShowMeasurementGuide,
    handleMorphChange,
    handleMorphChangeFromSlider,
    handleWeightMorphs: () => {}, // Disabled - handled by updateModelDimensions
    debugData,
    setIsFastTrackMode,
    isFastTrackMode,
    updateModelDimensions,
    modelRef,
    setUserEditedHeightWeight,
    setUserEditedMeasurements,
    setMeasurementsChanged
  });

  // Connect the API function to the navigation hook
  useEffect(() => {
    const getApiSizeRecommendation = async () => {
      if (!gender) return null;
      
      // Get current measurement values
      const chest = parseFloat(measurements.chest) || 100;
      const waist = parseFloat(measurements.waist) || 85;
      const hip = parseFloat(measurements.hips) || 95;
      const height = parseFloat(measurements.height) || 175;
      const weight = parseFloat(measurements.weight) || 70;
      
      const requestData = {
        gender: gender as 'male' | 'female',
        measurements: { chest, waist, hip, height, weight },
        clothing_type: clothingType || "upperwear",
        brand_id: brandId || "default",
        product_id: productId || "default_product"
      };
      
      return await getSizeRecommendation(requestData);
    };
    
    setApiSizeRecommendation(getApiSizeRecommendation);
  }, [getSizeRecommendation, setApiSizeRecommendation, gender, measurements]);

  // Use fast-track hook for immediate profile application (only when profile exists)
  const { isFastTrackActive, hasAppliedData, isApiCallTriggered } = useProfileFastTrack({
    activeProfile,
    isFastTrackMode: isFastTrackMode && !!activeProfile, // Only enable if profile exists
    step,
    totalSteps,
    setMeasurements,
    setGender,
    setSelectedSkinColor,
    setSelectedHair: (hair: string | null) => setSelectedHair(hair as 'hair1' | 'hair2' | null),
    setDebugData,
    modelRef,
    updateModelDimensions,
    handleSkinColorSelect,
    applyMorphValues,
    getWrappedApiCall: () => {
      // Fast track API call - use profile data directly to avoid state timing issues
      const getApiSizeRecommendation = async () => {
        // Use activeProfile data directly instead of component state
        if (!activeProfile || !activeProfile.gender) {
          return null;
        }
        
        const chest = parseFloat(activeProfile.measurements.chest) || 100;
        const waist = parseFloat(activeProfile.measurements.waist) || 85;
        const hip = parseFloat(activeProfile.measurements.hips) || 95;
        const height = parseFloat(activeProfile.measurements.height) || 175;
        const weight = parseFloat(activeProfile.measurements.weight) || 70;
        
        const requestData = {
          gender: activeProfile.gender as 'male' | 'female',
          measurements: { chest, waist, hip, height, weight },
          clothing_type: clothingType || "upperwear",
          brand_id: brandId || "default",
          product_id: productId || "default_product"
        };
        
        return await getSizeRecommendation(requestData);
      };
      return getApiSizeRecommendation();
    },
    setApiSizeResult,
    setConfidenceScore,
    setMeasurementsChanged,
    setIsApiLoadingLocal,
    licenseKey,
    gender,
    measurements,
    isMobile: sessionIsMobile.current || isMobile
  });

  const isInitialLoad = useRef(true);

  // Set default measurements when gender changes (for non-fast-track mode)
  useEffect(() => {
    console.log('🔍 Gender effect triggered:', { gender, isFastTrackMode, hasUserMadeChanges, isInitialLoad: isInitialLoad.current });
    if (gender && !isFastTrackMode) {
      // Only set default measurements if this is initial load or user hasn't made changes
      // Also check if user has edited any measurements manually
      const hasEditedMeasurements = userEditedMeasurements.chest || userEditedMeasurements.waist || userEditedMeasurements.hips;
      const hasEditedHeightWeight = userEditedHeightWeight.height || userEditedHeightWeight.weight;
      if ((isInitialLoad.current || !hasUserMadeChanges) && !hasEditedMeasurements && !hasEditedHeightWeight) {
        console.log('⚠️  SETTING DEFAULT MEASUREMENTS 175/70!');
        const startingMeasurements = {
          height: gender === 'male' ? "175" : "165",
          weight: gender === 'male' ? "70" : "60", 
          chest: "", 
          waist: "", 
          hips: ""   
        };
        setMeasurements(startingMeasurements);
        // Reset measurementsChanged flag when setting default measurements
        setMeasurementsChanged(false); 
      }
    }
    
    // Mark that initial load is complete after first effect run
    isInitialLoad.current = false;
  }, [gender, isFastTrackMode, hasUserMadeChanges, userEditedMeasurements, userEditedHeightWeight]);

  // Debug: Log gender state changes
  useEffect(() => {
  }, [gender])

  // Profile switching: Apply profile data when switching profiles
  const applyProfileData = useCallback((profile: UserProfile) => {
    if (!profile) return;
    
    // Apply basic data - set flag to prevent measurement override during profile loading
    (window as any).profileLoading = true;
    setMeasurements(profile.measurements);
    setGender(profile.gender);
    // Reset measurementsChanged flag when loading profile data
    setMeasurementsChanged(false);
    
    // Clear flag after a short delay to allow all effects to process
    setTimeout(() => {
      delete (window as any).profileLoading;
    }, 100);

    // Apply skin color
    if (profile.skinColor) {
      setSelectedSkinColor(profile.skinColor);
      if (handleSkinColorSelect) {
        handleSkinColorSelect(profile.skinColor);
      }
    }

    // Apply hair (if applicable)
    if (profile.hairType && setSelectedHair) {
      setSelectedHair(profile.hairType);
    }

    // Note: Morphs will be applied by useBodyModel when isProfileSwitching is true
  }, [setMeasurements, setGender, setSelectedSkinColor, setSelectedHair, handleSkinColorSelect]);

  // Debug: Show fast-track status
  useEffect(() => {
    if (isFastTrackActive) {
    }
  }, [isFastTrackActive, activeProfile?.name, step, totalSteps, hasAppliedData, isApiCallTriggered])

  // Use the Effect Management hook
  useEffectManagement({
    gender,
    measurements,
    userEditedMeasurements,
    setMeasurements,
    setUserEditedMeasurements,
    modelRef: modelRef as any,
    updateModelDimensions,
    step,
    isMobile,
    isFastTrackMode,
    selectedSkinColor,
    showSkinColorPanel,
    setShowSkinColorTag,
    showHairPanel,
    selectedHair,
    setShowHairTag,
    hairMeshMap: hairMeshMap as any,
    setSelectedHair,
    toggleHairSet,
    useApiRecommendation,
    apiSizeResult,
    isApiLoading,
    setApiSizeResult,
    setConfidenceScore,
    prevStepRef,
    hasTrackedRecommendation,
    productId,
    setDebugData
  });

  // Cart integration hook
  const { handleAddToBag: addToBagWithSize } = useCartIntegration({
    productId,
    onClose,
    onSizeRecommended,
    gender,
    licenseKey,
    isMobile: sessionIsMobile.current || isMobile, // Use session mobile value if available, fallback to current
    measurements: {
      height: measurements.height ? parseFloat(measurements.height) : undefined,
      weight: measurements.weight ? parseFloat(measurements.weight) : undefined,
      chest: measurements.chest ? parseFloat(measurements.chest) : undefined,
      waist: measurements.waist ? parseFloat(measurements.waist) : undefined,
      hips: measurements.hips ? parseFloat(measurements.hips) : undefined
    }
  });

  // Use the Step Manager hook
  const {
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
  } = useStepManager({
    isMobile: sessionIsMobile.current || isMobile, // Use session mobile value if available, fallback to current
    isModelLoading,
    measurements,
    setMeasurements,
    useMetric,
    setUseMetric,
    renderMeasurementInputs,
    handleWeightMorphs: () => {}, // Disabled - handled by updateModelDimensions
    gender,
    setGender,
    licenseKey,
    productId,
    activeProfile,
    getLocalJSONBasedLimits,
    setUserEditedMeasurements,
    handleMorphChange,
    setShowMeasurementGuide,
    measurementsChanged,
    setMeasurementsChanged,
    debugData: useMemo(() => ({ ...debugData, setDebugData }), [debugData, setDebugData]),
    setIsFastTrackMode,
    isFastTrackMode,
    updateModelDimensions,
    modelRef,
    setHasUserMadeChanges,
    apiSizeResult,
    isApiLoading: isApiLoadingLocal,
    apiError: apiError as Error | null,
    calculateSize,
    addToBagWithSize,
    calculateMorphRange,
    calculateMorphFromSliderPosition,
    hasCalculatedForCurrentMeasurements
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }


  const inputValuesRef = useRef<Record<string, string>>({})

  const renderStepContent = () => {
    console.log('🖼️ renderStepContent called, showCalculating:', showCalculating, 'step:', step, 'isMobile:', isMobile);
    
    // Show calculating page if active
    if (showCalculating) {
      console.log('📱 Rendering CalculatingPage component');
      return (
        <CalculatingPage 
          onComplete={handleCalculatingComplete}
          duration={3000}
        />
      )
    }

    if (!isMobile) {
      switch (step) {
        case 0:
          return renderStep1() // Step 0 renders same as step 1 (gender selection)

        case 1:
          return renderStep1()

        case 2:
          return renderStep2();

        case 3:
          return renderStep3()

        case 4:
          return renderStep5()

        default:
          return null
      }
    }

    switch (step) {
      case 0:
        return renderStep1() // Step 0 renders same as step 1 (gender selection)

      case 1:
        return renderStep1()

      case 2:
        return renderStep2()

      case 3:
        return renderStep3()

      case 4:
        return renderMobileStep4()

      case 5:
        return renderMobileStep5()

      case 6:
        return renderMobileStep6()

      case 7:
        return renderMobileStep8()

      default:
        return null
    }
  }

  const handleActualClose = () => {
    setHasTrackedRecommendation(false);
    
    // Track popup closed event
    if (licenseKey) {
      const stepNames = {
        1: 'gender_selection',
        2: 'basic_measurements', 
        3: 'detailed_measurements',
        4: 'size_recommendation'
      };
      
      // Calculate time spent on current step
      const currentStepId = `step_${step}`;
      const timeSpentMs = analytics.getTimeSpent(currentStepId);
      
      analytics.trackPopupClosed(
        licenseKey,
        step,
        stepNames[step as keyof typeof stepNames] || `step_${step}`,
        gender || undefined,
        selectedSize,
        hasTrackedRecommendation,
        timeSpentMs // Pass calculated time spent
      ).catch(error => {
        console.warn('Failed to track popup closed:', error);
      });
    }
    
    onClose();
  };

  // Add this effect to handle hair visibility based on gender
  useEffect(() => {
    if (gender === 'male' && !selectedHair) {
      // Show default hair for male models if none selected
      toggleHairSet('hair1');
    } else if (gender === 'female') {
      // For females, always set H1 as default hair and hide hair panel
      toggleHairSet('hair1');
      setShowHairPanel(false);
    }
  }, [gender, selectedHair, toggleHairSet]);

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-end bg-black/50 p-0"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onTouchMove={(e) => {
        // Allow touch events to pass through when profile sheet is open
        if (!showProfileSheet) {
          e.preventDefault();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleActualClose();
        }
      }}
    >
     
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white w-full md:w-[900px] md:h-[600px] overflow-hidden relative rounded-t-[32px] md:rounded-2xl flex flex-col font-normal leading-normal"
        style={{
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          height: getModalHeight(),
          maxHeight: getModalHeight(),
        }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 flex-shrink-0" />

        <div className="flex-1 flex flex-col min-h-0">
          <div className="md:hidden border-b border-gray-100 p-1.5 bg-white flex-shrink-0 flex items-center justify-between">
            {/* Profile Icon - Left */}
            <div className="flex-shrink-0">
              <ProfileIndicator 
                currentProfile={currentProfile}
                onOpenProfile={() => setShowProfileSheet(true)}
                className="scale-75"
                showSavedAnimation={showProfileSavedAnimation}
              />
            </div>
            
            {/* Center Logo */}
            <div className="text-center flex-1">
              <p className="text-gray-600 text-xs">
                Powered by <span className="font-semibold text-blue-600">YourSizer</span>
              </p>
            </div>
            
            {/* Close Button - Right */}
            <button
              onClick={handleActualClose}
              className="text-gray-500 hover:text-gray-700 p-1 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex md:flex-row flex-col flex-1 overflow-hidden min-h-0">
            <div className="md:w-1/2 w-full h-[65vh] md:h-auto bg-gray-50 relative overflow-hidden">
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                <div className="md:hidden">
                  <button disabled className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center opacity-60">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>

                {/* Icons Container */}
                <div className="flex flex-col items-end gap-2">
                  {/* Hair Button */}
                  <div className="relative">
                    <AnimatePresence>
                      {showHairTag && !selectedHair && !showHairPanel && gender === 'male' && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-white px-2 py-0.5 rounded shadow-sm text-xs whitespace-nowrap"
                        >
                          Hair
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {gender === 'male' && (
                      <button
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
                        onClick={() => setShowHairPanel(!showHairPanel)}
                      >
                        <Brush className="w-4 h-4 md:w-5 md:h-5 text-black" />
                      </button>
                    )}
                    <AnimatePresence>
                      {showHairPanel && gender === 'male' && (
                        <motion.div
                          initial={{ opacity: 0, x: "100%" }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: "100%" }}
                          className="absolute right-full top-0 mr-2 flex items-center gap-2"
                        >
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            onClick={() => toggleHairSet('hair1')}
                            className={`w-8 h-8 rounded-full shadow-md hover:scale-110 transition-transform text-xs font-medium ${selectedHair === 'hair1'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            H1
                          </motion.button>
                          {/* Only show H2 button if hair2 meshes are available */}
                          {hairMeshMap.current.hair2.length > 0 && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              onClick={() => toggleHairSet('hair2')}
                              className={`w-8 h-8 rounded-full shadow-md hover:scale-110 transition-transform text-xs font-medium ${selectedHair === 'hair2'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              H2
                            </motion.button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Skin Color Button */}
                  <div className="relative">
                    <div className="flex flex-col gap-2">
                      {SKIN_COLOR_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleSkinColorSelect(option.color)}
                          className={`w-8 h-8 rounded-full shadow-md hover:scale-110 transition-transform ${selectedSkinColor === option.color
                              ? 'ring-2 ring-blue-600 ring-offset-2'
                              : ''
                            }`}
                          style={{ backgroundColor: option.color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div
                ref={modelContainerRef}
                className="w-full h-full relative"
                style={{
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
              >
                {/* Size buttons for mobile step 8 */}
                {isMobile && step === totalSteps && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                    {renderMobileSizeButtons()}
                  </div>
                )}
              </div>
              {isModelLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 md:w-8 md:h-8 border-3 md:border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs md:text-sm text-gray-600">Loading 3D Model...</p>
                  </div>
                </div>
              )}
              {modelError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                  <div className="text-center p-3 md:p-4">
                    <p className="text-red-600 font-medium mb-2 text-sm">{modelError}</p>
                    <button
                      onClick={() => {
                        setModelError(null)
                        setGender(gender)
                      }}
                      className="text-blue-600 hover:text-blue-700 text-xs md:text-sm"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              
              {/* Calculation completion message - Mobile only */}
              <AnimatePresence>
                {isMobile && showInfoMessage && (step === 4 || step === 5 || step === 6) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute bottom-4 left-4 right-4 z-20"
                  >
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-blue-800 text-center leading-relaxed">
                        Your approximate measurements have been calculated. You can adjust them according to your body shape.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="md:w-1/2 w-full flex flex-col overflow-hidden bg-white relative min-h-0">
                             <div className="hidden md:flex items-center border-b border-gray-100 flex-shrink-0">
                 <div className="flex gap-3 px-6 py-6 flex-1">
                   {Array.from({ length: totalSteps }).map((_, i) => (
                     <div
                       key={i}
                       className={`h-1.5 flex-1 rounded-full ${(i + 1) <= step && step > 0 ? "bg-blue-600" : "bg-gray-200"
                         }`}
                     />
                   ))}
                 </div>
                 <ProfileIndicator 
                   currentProfile={currentProfile}
                   onOpenProfile={() => setShowProfileSheet(true)}
                   className="mr-2"
                   showSavedAnimation={showProfileSavedAnimation}
                 />
                 <button
                   onClick={handleActualClose}
                   className="text-gray-500 hover:text-gray-700 p-3 rounded-full hover:bg-gray-100 mr-4"
                 >
                   <X className="w-7 h-7" />
                 </button>
               </div>

              <div className={`flex-1 px-4 pt-1 pb-20 md:py-4 md:pb-2 min-h-0 ${isMobile ? 'overflow-hidden' : (hasCalculatedForCurrentMeasurements ? 'overflow-hidden' : 'overflow-y-auto')}`}>
                {renderStepContent()}
              </div>

              <div className="md:relative absolute bottom-0 left-0 right-0 md:left-auto md:right-auto border-t border-gray-100 bg-white flex-shrink-0">
                <div className="flex justify-between items-center p-2">
                  <div className="flex-shrink-0 w-16">
                    {step > 1 && (
                      <button
                        onClick={handlePrevious}
                        className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg text-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                    )}
                  </div>

                  <div className="md:hidden flex gap-1 flex-1 max-w-32 mx-4">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${i < step && step > 0 ? "bg-blue-600" : "bg-gray-200"
                          }`}
                      />
                    ))}
                  </div>

                  <div className="flex-shrink-0 w-1/4 flex justify-center">
                    {(step < totalSteps || step === 0) && (
                      <button
                        onClick={handleNext}
                        disabled={
                          (step === 0 && !gender) ||
                          (step === 1 && !gender) ||
                          (isMobile && step === 2 && (!measurements.height || measurements.height === '')) ||
                          (isMobile && step === 3 && (!measurements.weight || measurements.weight === '')) ||
                          (isMobile && step === 4 && (!measurements.chest || measurements.chest === '')) ||
                          (isMobile && step === 5 && (!measurements.waist || measurements.waist === '')) ||
                          (isMobile && step === 6 && (!measurements.hips || measurements.hips === '')) ||
                          (!isMobile && step === 2 && ((!measurements.height || measurements.height === '') || (!measurements.weight || measurements.weight === ''))) ||
                          (!isMobile && step === 3 && ((!measurements.chest || measurements.chest === '') || (!measurements.waist || measurements.waist === '') || (!measurements.hips || measurements.hips === '')))
                        }
                        className="w-full flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {(isMobile && step === 6) || (!isMobile && step === 3) ? "See Result" : "Next"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    {isMobile && step === totalSteps && (
                      <button
                        onClick={handleAddToBag}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Add to Bag
                      </button>
                    )}
                    {/*
                    {step === totalSteps && (
                      <button
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Advanced
                      </button>
                    )}
                    */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block border-t border-gray-100 p-3 text-center bg-white flex-shrink-0">
            <p className="text-gray-600 text-sm">
              Powered by <span className="font-semibold text-blue-600">YourSizer</span>
            </p>
          </div>
        </div>
      </motion.div>

             <AnimatePresence>
         {showMeasurementGuide && (
           <MeasurementGuide
             measurementType={showMeasurementGuide}
             onClose={() => setShowMeasurementGuide(null)}
           />
         )}
       </AnimatePresence>

     </div>
     {/* Render profile sheet outside main container using portal */}
     {showProfileSheet && createPortal(
       <UserProfileSheet
         isVisible={showProfileSheet}
         onClose={() => setShowProfileSheet(false)}
                 onProfileSelect={(profile) => {
          console.log('🔄 Selecting profile:', profile.name, profile.measurements);
          profileService.setActiveProfile(profile.id);
          
          // Apply profile data first
          applyProfileData(profile);
          setCurrentProfile(profile);
          setShowProfileSheet(false);
          
          // Set profile switching state AFTER the profile is set
          // This ensures useBodyModel effect runs with the correct profile
          setTimeout(() => {
            console.log('🔄 Setting isProfileSwitching = true');
            setIsProfileSwitching(true);
            // Clear switching state after morphs are applied
            setTimeout(() => {
              console.log('🔄 Setting isProfileSwitching = false');
              setIsProfileSwitching(false);
            }, 100);
          }, 0);
        }}
         onRestart={() => {
           // Reset to no profile
           setCurrentProfile(null);
           setShowProfileSheet(false);
         }}
         onStartNewProfile={() => {
           // Start new profile creation - COMPLETE FRESH START
           
           // FORCE CLEAR EVERYTHING - NO FAST TRACK
           setCurrentProfile(null);
           profileService.clearActiveProfile(); // Clear active profile service
           
           // NAVIGATE TO STEP 0 FOR NEW PROFILE CREATION
           handleNavigateToStep0();
           setGender(null);
           
           // SET DEFAULT MEASUREMENTS FOR NEW PROFILE
           setMeasurements({
             height: "175",
             weight: "70", 
             chest: "", 
             waist: "", 
             hips: ""   
           });
           
           // RESET ALL UI STATES
           setSelectedSkinColor(null);
           setSelectedHair(null);
           setIsModelLoading(false);
           setModelError(null);
           
           // CLEAR MODEL - FORCE FRESH START
           if (modelRef.current && sceneRef.current) {
             sceneRef.current.remove(modelRef.current);
             modelRef.current = null;
           }
           
           // RESET USER EDITED FLAGS
           setUserEditedMeasurements({ chest: false, waist: false, hips: false });
           
           // CLOSE PROFILE SHEET
           setShowProfileSheet(false);
           
         }}
         currentProfile={currentProfile}
         allProfiles={allProfiles}
         activeProfileId={currentProfile?.id || null}
                 onProfileSwitch={(profile) => {
          console.log('🔄 Switching to profile:', profile.name, profile.measurements);
          profileService.setActiveProfile(profile.id);
          
          // Apply profile data first
          applyProfileData(profile);
          setCurrentProfile(profile);
          setShowProfileSheet(false);
          
          // Set profile switching state AFTER the profile is set
          // This ensures useBodyModel effect runs with the correct profile
          setTimeout(() => {
            console.log('🔄 Setting isProfileSwitching = true');
            setIsProfileSwitching(true);
            // Clear switching state after morphs are applied
            setTimeout(() => {
              console.log('🔄 Setting isProfileSwitching = false');
              setIsProfileSwitching(false);
            }, 100);
          }, 0);
        }}
         onProfileRemove={(profileId) => {
           profileService.deleteProfile(profileId);
         }}
         onProfileNameUpdate={(profileId, newName) => {
           profileService.updateProfileName(profileId, newName);
         }}
         debugData={debugData}
       />,
       document.body
     )}
   </>  
 )
}   