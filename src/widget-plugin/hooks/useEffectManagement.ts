import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { calculateBodyMeasurements, calculateShapeKeys } from '../utils/bodyMeasurements';
import { applyShapeKeys } from '../utils/hookUtils';
import { Measurements } from '../types';

interface UseEffectManagementParams {
  // Body scroll prevention dependenciess
  
  // JSON measurement dependencies
  gender: "male" | "female" | null;
  measurements: {
    height: string;
    weight: string;
    chest: string;
    waist: string;
    hips: string;
  };
  userEditedMeasurements: { chest: boolean; waist: boolean; hips: boolean };
  setMeasurements: React.Dispatch<React.SetStateAction<{
    height: string;
    weight: string;
    chest: string;
    waist: string;
    hips: string;
  }>>;
  setUserEditedMeasurements: React.Dispatch<React.SetStateAction<{ chest: boolean; waist: boolean; hips: boolean }>>;
  
  // Model dimension update dependencies
  modelRef: React.RefObject<THREE.Group>;
  updateModelDimensions: (model: THREE.Group, measurements: Measurements) => void;
  step: number;
  isMobile: boolean;
  
  // Fast track mode
  isFastTrackMode?: boolean;
  
  // Skin color interval dependencies
  selectedSkinColor: string | null;
  showSkinColorPanel: boolean;
  setShowSkinColorTag: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Hair interval dependencies
  showHairPanel: boolean;
  selectedHair: 'hair1' | 'hair2' | null;
  setShowHairTag: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Hair visibility dependencies
  hairMeshMap: React.RefObject<{ [key: string]: THREE.Mesh[] }>;
  setSelectedHair: React.Dispatch<React.SetStateAction<'hair1' | 'hair2' | null>>;
  toggleHairSet: (hairType: 'hair1' | 'hair2') => void;
  
  // API trigger dependencies
  useApiRecommendation: boolean;
  apiSizeResult: unknown;
  isApiLoading: boolean;
  setApiSizeResult: React.Dispatch<React.SetStateAction<any>>;
  setConfidenceScore: React.Dispatch<React.SetStateAction<number>>;
  
  // Step tracking dependencies
  prevStepRef: React.MutableRefObject<number>;
  hasTrackedRecommendation: boolean;
  productId?: string;
  
  // Shape key application dependencies
  handleMorphChange?: (morphName: string, value: number) => void;
  
  // Debug data dependencies
  setDebugData?: React.Dispatch<React.SetStateAction<any>>;
}

export function useEffectManagement({
  // JSON calculation
  gender,
  measurements,
  userEditedMeasurements,
  setMeasurements,
  setUserEditedMeasurements,
  
  // Model dimension update
  modelRef,
  updateModelDimensions,
  step,
  isMobile,
  isFastTrackMode,
  
  // Skin color interval
  selectedSkinColor,
  showSkinColorPanel,
  setShowSkinColorTag,
  
  // Hair interval
  showHairPanel,
  selectedHair,
  setShowHairTag,
  
  // Hair visibility
  hairMeshMap,
  setSelectedHair,
  toggleHairSet,
  
  // API trigger
  useApiRecommendation,
  apiSizeResult,
  isApiLoading,
  setApiSizeResult,
  setConfidenceScore,
  
  // Step tracking
  prevStepRef,
  hasTrackedRecommendation,
  productId,
  
  // Shape key application
  handleMorphChange,
  
  // Debug data
  setDebugData
}: UseEffectManagementParams) {

  // Track fast track mode changes to prevent JSON override after restore
  const prevFastTrackMode = useRef<boolean>(isFastTrackMode);
  const fastTrackJustDisabled = useRef<boolean>(false);

  useEffect(() => {
    if (prevFastTrackMode.current && !isFastTrackMode) {
      // Fast track was just disabled
      fastTrackJustDisabled.current = true;
      // Clear the flag after a short delay
      setTimeout(() => {
        fastTrackJustDisabled.current = false;
      }, 100);
    }
    prevFastTrackMode.current = isFastTrackMode;
  }, [isFastTrackMode]);

  // Body scroll prevention effect
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const preventTouchMove = (e: TouchEvent) => {
      // Allow touch events on input elements (sliders, number inputs)
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.closest('input'))) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;

      window.scrollTo(0, scrollY);

      document.removeEventListener('touchmove', preventTouchMove);
    };
  }, []);

  // Skin color tag interval effect
  useEffect(() => {
    if (!selectedSkinColor && !showSkinColorPanel) {
      const interval = setInterval(() => {
        setShowSkinColorTag(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedSkinColor, showSkinColorPanel, setShowSkinColorTag]);

  // Reset user-edited flags when gender changes (measurements are set elsewhere)
  useEffect(() => {
    if (gender) {
      // Reset user-edited flags when gender changes, as all measurements are reset.
      setUserEditedMeasurements({ chest: false, waist: false, hips: false });
    }
  }, [gender, setUserEditedMeasurements])

  // Calculate JSON measurements ONLY when height/weight actually change
  useEffect(() => {
    // Skip JSON calculation in fast track mode to preserve profile values
    if (isFastTrackMode) {
      console.log('🚫 Skipping JSON calculation - Fast track mode active');
      return;
    }

    // Skip if fast track mode was just disabled to avoid overriding restored measurements
    if (fastTrackJustDisabled.current) {
      console.log('🚫 Skipping JSON calculation - Fast track mode was just disabled, preserving restored measurements');
      return;
    }

    // This effect now correctly handles updates after flags are reset.
    // JSON useEffect triggered for height/weight changes

    // We only proceed if we have the necessary data.
    if (gender && measurements.height && measurements.weight) {
      console.log('🔍 JSON calculation: checking conditions', { 
        userEditedMeasurements, 
        height: measurements.height, 
        weight: measurements.weight 
      });
      // Her zaman JSON base referans alınacak, ancak userEditedMeasurements flag'i true olan alanlar asla override edilmeyecek.
      const height = parseFloat(measurements.height);
      const weight = parseFloat(measurements.weight);
      if (!isNaN(height) && !isNaN(weight)) {
        const jsonMeasurements = calculateBodyMeasurements(height, weight, gender);
        if (jsonMeasurements) {
          // Update debugData with fetched measurements
          if (setDebugData) {
            console.log('🔄 Setting debugData with JSON measurements:', jsonMeasurements, 'from height/weight:', height, weight);
            setDebugData((prev: any) => ({
              ...prev,
              heightWeight: {
                ...prev?.heightWeight,
                fetchedData: {
                  measurements: jsonMeasurements
                }
              }
            }));
          }
          // Update measurements: sadece userEditedMeasurements false olan alanlar override edilir
          setMeasurements(prev => {
            console.log('[setMeasurements] useEffectManagement.ts: JSON override', {
              prev,
              userEditedMeasurements,
              jsonMeasurements
            });
            return {
              ...prev,
              chest: userEditedMeasurements.chest ? prev.chest : jsonMeasurements.chest.toString(),
              waist: userEditedMeasurements.waist ? prev.waist : jsonMeasurements.waist.toString(),
              hips: userEditedMeasurements.hips ? prev.hips : jsonMeasurements.hips.toString(),
            };
          });
          // Apply ALL morphs simultaneously after measurements are updated
          if (handleMorphChange) {
            // Use setTimeout to ensure measurements are fully updated before applying morphs
            setTimeout(() => {
              try {
                // Get baseline values for morph calculation
                const baselineValues = {
                  chest: gender === 'male' ? 100 : 95,
                  waist: gender === 'male' ? 85 : 80,
                  hips: gender === 'male' ? 95 : 100
                };
                // All morphs are now handled by updateModelDimensions only
              } catch (error) {
              }
            }, 0);
          }
        }
      }
    }
  }, [gender, measurements.height, measurements.weight, userEditedMeasurements]); // userEditedMeasurements eklendi

  // Fast track mode: Update JSON reference for sliders when height/weight changes or entering step 3
const prevFastTrackHeight = useRef(measurements.height);
const prevFastTrackWeight = useRef(measurements.weight);
// Fast track profil yüklemede ref'leri sync et
useEffect(() => {
  if (isFastTrackMode && measurements.height && measurements.weight) {
    prevFastTrackHeight.current = measurements.height;
    prevFastTrackWeight.current = measurements.weight;
  }
  // eslint-disable-next-line
}, [isFastTrackMode, measurements.height, measurements.weight]);
useEffect(() => {
  if (isFastTrackMode && gender && measurements.height && measurements.weight && setDebugData) {
    const height = parseFloat(measurements.height);
    const weight = parseFloat(measurements.weight);
    const prevHeight = parseFloat(prevFastTrackHeight.current) || 0;
    const prevWeight = parseFloat(prevFastTrackWeight.current) || 0;
    // Sadece height veya weight değiştiyse çalışsın
    if ((height !== prevHeight) || (weight !== prevWeight)) {
      prevFastTrackHeight.current = measurements.height;
      prevFastTrackWeight.current = measurements.weight;
      if (!isNaN(height) && !isNaN(weight)) {
        const jsonMeasurements = calculateBodyMeasurements(height, weight, gender);
        if (jsonMeasurements) {
          console.log('🔄 Fast track: Updating JSON reference for sliders:', jsonMeasurements, 'from profile height/weight:', height, weight);
          setDebugData((prev: any) => ({
            ...prev,
            heightWeight: {
              ...prev?.heightWeight,
              fetchedData: {
                measurements: jsonMeasurements
              }
            }
          }));
        }
      }
    }
  }
}, [isFastTrackMode, gender, measurements.height, measurements.weight, setDebugData]);

  // Reset user edited flags when height/weight changes to allow JSON override
  // But ONLY if the user is actually on height/weight steps, not on chest/waist/hips steps
  const prevHeight = useRef(measurements.height);
  const prevWeight = useRef(measurements.weight);
  
  useEffect(() => {
    // Use parseFloat for value comparison instead of string reference comparison
    const prevHeightValue = parseFloat(prevHeight.current) || 0;
    const currentHeightValue = parseFloat(measurements.height) || 0;
    const prevWeightValue = parseFloat(prevWeight.current) || 0;
    const currentWeightValue = parseFloat(measurements.weight) || 0;
    
    const heightChanged = prevHeightValue !== currentHeightValue;
    const weightChanged = prevWeightValue !== currentWeightValue;
    
    // Only reset flags if height or weight actually changed (not just step change)
    if (heightChanged || weightChanged) {
      console.log('🔍 Height/weight change detected:', {
        prevHeight: prevHeight.current,
        currentHeight: measurements.height,
        prevWeight: prevWeight.current, 
        currentWeight: measurements.weight,
        userEditedMeasurements
      });
      // Skip resetting flags if fast track was just disabled to preserve user values
      if (fastTrackJustDisabled.current) {
        console.log('🚫 Skipping user-edited flags reset - Fast track mode was just disabled');
        prevHeight.current = measurements.height;
        prevWeight.current = measurements.weight;
        return;
      }
      
      // Skip if we're preserving measurements from fast track disable
      if ((window as any).measurementsBeforeFastTrackDisable) {
        console.log('🚫 Skipping user-edited flags reset - measurements are being preserved');
        prevHeight.current = measurements.height;
        prevWeight.current = measurements.weight;
        return;
      }
      
      // Skip if profile is currently being loaded/applied
      if ((window as any).profileLoading) {
        console.log('🚫 Skipping user-edited flags reset - profile is being loaded');
        prevHeight.current = measurements.height;
        prevWeight.current = measurements.weight;
        return;
      }
      
      // Skip if user has already edited chest/waist/hips measurements to preserve their changes
      if (userEditedMeasurements.chest || userEditedMeasurements.waist || userEditedMeasurements.hips) {
        console.log('🚫 Skipping user-edited flags reset - user has manually edited measurements, preserving changes');
        prevHeight.current = measurements.height;
        prevWeight.current = measurements.weight;
        return;
      }
      
      console.log('🔄 Resetting user-edited flags due to height/weight change:', { heightChanged, weightChanged });
      console.log('⚠️  FORCE RESETTING userEditedMeasurements to false');
      setUserEditedMeasurements({ chest: false, waist: false, hips: false });
    }
    
    prevHeight.current = measurements.height;
    prevWeight.current = measurements.weight;
  }, [measurements.height, measurements.weight, setUserEditedMeasurements, userEditedMeasurements]);

  // Model dimension update effect - ONLY for height/weight, NOT chest/waist/hips
  useEffect(() => {
    console.log('🔍 Model dimension effect triggered:', {
      'measurements.height': measurements.height,
      'measurements.weight': measurements.weight,
      step,
      isMobile,
      isFastTrackMode
    });
    
    // SKIP model dimension update during fast track mode
    if (isFastTrackMode) {
      return;
    }
    
    // SKIP model dimension update right after fast track disable to prevent model reset
    if (fastTrackJustDisabled.current) {
      console.log('🚫 Skipping model dimension update - Fast track mode was just disabled');
      return;
    }

    if (modelRef.current && measurements.height && measurements.weight) {
      // Apply updateModelDimensions for height/weight changes when values exist
      // No step restriction - allow updates whenever height/weight changes
      {
        console.log('🔍 Model dimension update triggered for height/weight step:', {
          step,
          measurements: {
            height: measurements.height,
            weight: measurements.weight,
            chest: measurements.chest,
            waist: measurements.waist,
            hips: measurements.hips
          }
        });
        
        // Only apply height/weight morphs, preserve chest/waist/hips morphs
        // Create a measurements object with current values but signal to only update height/weight
        const heightWeightOnlyMeasurements = {
          height: measurements.height,
          weight: measurements.weight,
          chest: measurements.chest, // Keep current values for UI consistency
          waist: measurements.waist, // Keep current values for UI consistency
          hips: measurements.hips,   // Keep current values for UI consistency
          _updateOnlyHeightWeight: true // Signal to updateModelDimensions
        };
        updateModelDimensions(modelRef.current, heightWeightOnlyMeasurements);
      }
    }
  }, [measurements.height, measurements.weight, isMobile, updateModelDimensions, modelRef, isFastTrackMode]) // Removed 'step' to avoid triggering on step changes

  // Calculate shape keys only when measurements actually change, not on step changes
  const prevMeasurements = useRef({
    height: measurements.height,
    weight: measurements.weight,
    chest: measurements.chest,
    waist: measurements.waist,
    hips: measurements.hips
  });
  
  useEffect(() => {
    // Only trigger if measurements actually changed, not just step
    const measurementsChanged = 
      prevMeasurements.current.height !== measurements.height ||
      prevMeasurements.current.weight !== measurements.weight ||
      prevMeasurements.current.chest !== measurements.chest ||
      prevMeasurements.current.waist !== measurements.waist ||
      prevMeasurements.current.hips !== measurements.hips;
      
    if (!measurementsChanged) return;
    
    // Skip if not in measurement steps
    const stepTypes = [1, 2, 3]; // 1: height, 2: weight, 3: chest/waist/hips
    if (!stepTypes.includes(step)) return;
    if (!gender || !measurements.height || !measurements.weight) return;
    
    const height = parseFloat(measurements.height);
    const weight = parseFloat(measurements.weight);
    const chest = parseFloat(measurements.chest);
    const waist = parseFloat(measurements.waist);
    const hips = parseFloat(measurements.hips);
    
    if (isNaN(height) || isNaN(weight)) return;
    
    // Calculate shape keys for current measurements - use JSON defaults for missing values
    let shapeKeys = null;
    try {
      // Get JSON defaults for missing measurements
      const jsonMeasurements = calculateBodyMeasurements(height, weight, gender);
      if (!jsonMeasurements) return;
      
      shapeKeys = calculateShapeKeys(
        height,
        weight,
        typeof chest === 'number' && !isNaN(chest) ? chest : jsonMeasurements.chest,
        typeof waist === 'number' && !isNaN(waist) ? waist : jsonMeasurements.waist,
        typeof hips === 'number' && !isNaN(hips) ? hips : jsonMeasurements.hips,
        gender
      );
    } catch (e) {
      shapeKeys = null;
    }
    
    if (setDebugData && shapeKeys) {
      console.log('🔄 Updating shapeKeys due to measurement change:', shapeKeys);
      setDebugData((prev: any) => ({
        ...prev,
        heightWeight: {
          ...prev?.heightWeight,
          fetchedData: {
            ...(prev?.heightWeight?.fetchedData || {}),
            shapeKeys
          }
        }
      }));
    }
    
    // Update previous measurements
    prevMeasurements.current = {
      height: measurements.height,
      weight: measurements.weight,
      chest: measurements.chest,
      waist: measurements.waist,
      hips: measurements.hips
    };
  }, [step, gender, measurements.height, measurements.weight, measurements.chest, measurements.waist, measurements.hips, setDebugData]);

  // Hair tag interval effect
  useEffect(() => {
    if (showHairPanel || selectedHair) {
      setShowHairTag(false);
      return;
    };
    const interval = setInterval(() => {
      setShowHairTag(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, [showHairPanel, selectedHair, setShowHairTag]);

  // Hair visibility based on gender effect
  useEffect(() => {
    if (gender === 'female') {
      // Hide all hair for female models
      if (hairMeshMap.current) {
        Object.values(hairMeshMap.current).forEach(list => {
          list.forEach((mesh: THREE.Mesh) => { if (mesh) mesh.visible = false; });
        });
      }
      setSelectedHair(null);
    } else if (gender === 'male' && !selectedHair) {
      // Show default hair for male models if none selected
      toggleHairSet('hair1');
    }
  }, [gender, selectedHair, hairMeshMap, setSelectedHair, toggleHairSet]);

  // API call is now handled only by user clicking "See Result" button

  // Step tracking effect
  useEffect(() => {
    const currentStep = step;
    const previousStep = prevStepRef.current;
    prevStepRef.current = currentStep;
  }, [step, gender, measurements, isMobile, productId, hasTrackedRecommendation, prevStepRef]);
}