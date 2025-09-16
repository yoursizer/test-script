import { useEffect, useRef, useCallback } from 'react'
import { UserProfile } from '../lib/userProfileStorage'
import { extractProfileDataForFastTrack, shouldTriggerImmediateApiCall } from '../utils/profileFastTrackUtils'
import { analytics } from '../components/analytics'

interface UseProfileFastTrackParams {
  activeProfile: UserProfile | null
  isFastTrackMode: boolean
  step: number
  totalSteps: number
  
  // State setters
  setMeasurements: (measurements: any) => void
  setGender: (gender: "male" | "female") => void
  setSelectedSkinColor: (color: string | null) => void
  setSelectedHair?: (hair: string | null) => void
  setDebugData?: (data: any) => void
  
  // Model functions
  modelRef?: React.MutableRefObject<any>
  updateModelDimensions?: (model: any, measurements: any) => void
  handleSkinColorSelect?: (color: string) => void
  applyMorphValues?: (morphMap: Map<string, number>) => void
  
  // API trigger for fast track - should be the wrapped function that includes request data
  getWrappedApiCall?: () => Promise<unknown>
  setApiSizeResult?: React.Dispatch<React.SetStateAction<any>>
  setConfidenceScore?: React.Dispatch<React.SetStateAction<number>>
  setMeasurementsChanged?: (changed: boolean) => void
  setIsApiLoadingLocal?: (loading: boolean) => void
  
  // Additional parameters for analytics
  licenseKey?: string
  gender?: "male" | "female" | null
  measurements?: {
    height: string;
    weight: string;
    chest: string;
    waist: string;
    hips: string;
  }
  isMobile?: boolean
}

export function useProfileFastTrack(params: UseProfileFastTrackParams) {
  const {
    activeProfile,
    isFastTrackMode,
    step,
    totalSteps,
    setMeasurements,
    setGender,
    setSelectedSkinColor,
    setSelectedHair,
    setDebugData,
    modelRef,
    updateModelDimensions,
    handleSkinColorSelect,
    applyMorphValues,
    getWrappedApiCall,
    setApiSizeResult,
    setConfidenceScore,
    setMeasurementsChanged,
    setIsApiLoadingLocal,
    licenseKey,
    gender,
    measurements,
    isMobile
  } = params

  const hasAppliedFastTrack = useRef(false)
  const apiCallTriggered = useRef(false)

  // Trigger immediate API call for fast-track mode
  const triggerImmediateApiCall = useCallback(async () => {
    if (!shouldTriggerImmediateApiCall(activeProfile, step, totalSteps) || 
        apiCallTriggered.current || 
        !getWrappedApiCall) {
      return
    }

    try {
      apiCallTriggered.current = true
      
      // Set loading state
      if (setIsApiLoadingLocal) {
        setIsApiLoadingLocal(true)
      }
      
      // Small delay to ensure model is ready
      setTimeout(async () => {
        try {
          const result = await getWrappedApiCall?.()
          if (result && setApiSizeResult && setConfidenceScore) {
            setApiSizeResult({ 
              size: (result as any).size, 
              confidence: (result as any).confidence, 
              method: (result as any).method,
              explanation: (result as any).explanation,
              smaller_size: (result as any).smaller_size,
              larger_size: (result as any).larger_size,
              smaller_reason: (result as any).smaller_reason,
              larger_reason: (result as any).larger_reason,
              range_type: (result as any).range_type
            })
            setConfidenceScore((result as any).confidence)
            if (setMeasurementsChanged) {
              setMeasurementsChanged(false)
            }
          } else if (setApiSizeResult) {
            // API returned null - set error state
            setApiSizeResult({ error: 'API returned no result', method: 'api' })
            if (setConfidenceScore) setConfidenceScore(0)
            if (setMeasurementsChanged) setMeasurementsChanged(false)
          }
        } catch (error) {
          if (setApiSizeResult) {
            // API failed - set error state
            setApiSizeResult({ error: (error as Error).message || 'API request failed', method: 'api' })
            if (setConfidenceScore) setConfidenceScore(0)
            if (setMeasurementsChanged) setMeasurementsChanged(false)
          }
        } finally {
          if (setIsApiLoadingLocal) {
            setIsApiLoadingLocal(false)
          }
        }
      }, 500) // 500ms delay for model readiness
      
    } catch (error) {
      apiCallTriggered.current = false
      if (setIsApiLoadingLocal) {
        setIsApiLoadingLocal(false)
      }
    }
  }, [activeProfile, step, totalSteps, getWrappedApiCall, setApiSizeResult, setConfidenceScore, setMeasurementsChanged, setIsApiLoadingLocal, licenseKey, gender, measurements, isMobile])

  // Apply profile data immediately for fast-track mode
  const applyProfileDataForFastTrack = useCallback(() => {
    if (!activeProfile || !isFastTrackMode || hasAppliedFastTrack.current) {
      return
    }

    
    const profileData = extractProfileDataForFastTrack(activeProfile)
    
    // Apply basic data
   console.log('[setMeasurements] useProfileFastTrack.ts: profileData override', profileData.measurements);
   setMeasurements(profileData.measurements)
   setGender(profileData.gender)
   // Reset measurementsChanged flag when loading profile data
   if (setMeasurementsChanged) {
     setMeasurementsChanged(false);
   }

    // Set debugData with profile measurements for blue indicator
    if (setDebugData) {
      setDebugData({
        heightWeight: {
          fetchedData: {
            measurements: {
              chest: parseFloat(profileData.measurements.chest),    // Profile value for blue indicator
              waist: parseFloat(profileData.measurements.waist),    // Profile value for blue indicator
              hips: parseFloat(profileData.measurements.hips)       // Profile value for blue indicator
            }
          }
        }
      })
    }

    // Apply skin color
    if (profileData.skinColor) {
      setSelectedSkinColor(profileData.skinColor)
      if (handleSkinColorSelect) {
        handleSkinColorSelect(profileData.skinColor)
      }
    }

    // Apply hair (if applicable)
    if (profileData.hairType && setSelectedHair) {
      setSelectedHair(profileData.hairType)
    }

    // Apply model dimensions
    if (modelRef?.current && updateModelDimensions) {
      updateModelDimensions(modelRef.current, profileData.measurements)
    }

    // Apply morphs (if any)
    if (profileData.morphValues && applyMorphValues) {
      applyMorphValues(profileData.morphValues as Map<string, number>)
    }

    hasAppliedFastTrack.current = true
    
    // Trigger API call when fast track applies profile data (only if not already triggered)
    if (apiCallTriggered.current) {
      return;
    }
    apiCallTriggered.current = true
    
    if (setIsApiLoadingLocal) {
      setIsApiLoadingLocal(true)
    }
    
    setTimeout(async () => {
        try {
          const result = await getWrappedApiCall?.()
          if (result && setApiSizeResult && setConfidenceScore) {
            const apiResult = { 
              size: (result as any).size, 
              confidence: (result as any).confidence, 
              method: (result as any).method,
              explanation: (result as any).explanation,
              smaller_size: (result as any).smaller_size,
              larger_size: (result as any).larger_size,
              smaller_reason: (result as any).smaller_reason,
              larger_reason: (result as any).larger_reason,
              range_type: (result as any).range_type
            };
            setApiSizeResult(apiResult);
            setConfidenceScore((result as any).confidence)
            if (setMeasurementsChanged) {
              setMeasurementsChanged(false)
            }
            
            // Automatically track size recommendation when API result is received
            if (result && licenseKey) {
              // For fast-track mode, use activeProfile measurements (same as API call)
              const measurementsForAnalytics = activeProfile?.measurements || measurements;
              const measurementsData = measurementsForAnalytics ? {
                height: measurementsForAnalytics.height ? parseFloat(measurementsForAnalytics.height) : undefined,
                weight: measurementsForAnalytics.weight ? parseFloat(measurementsForAnalytics.weight) : undefined,
                chest: measurementsForAnalytics.chest ? parseFloat(measurementsForAnalytics.chest) : undefined,
                waist: measurementsForAnalytics.waist ? parseFloat(measurementsForAnalytics.waist) : undefined,
                hips: measurementsForAnalytics.hips ? parseFloat(measurementsForAnalytics.hips) : undefined
              } : undefined;
              
              const stepProgression = isMobile ? {
                step_1_completed: true,
                step_2_completed: true,
                step_3_completed: true,
                step_4_completed: true,
                step_5_completed: true,
                step_6_completed: true,
                step_7_completed: true
              } : {
                step_1_completed: true,
                step_2_completed: true,
                step_3_completed: true,
                step_4_completed: true
              };
              
              analytics.trackSizeRecommendationFromApiResult(
                licenseKey,
                apiResult,
                gender || undefined,
                measurementsData,
                stepProgression
              ).catch(error => {
                console.warn('Failed to auto-track size recommendation (fast-track):', error);
              });
            }
          } else if (setApiSizeResult) {
            setApiSizeResult({ error: 'API returned no result', method: 'api' })
            if (setConfidenceScore) setConfidenceScore(0)
            if (setMeasurementsChanged) setMeasurementsChanged(false)
          }
        } catch (error) {
          if (setApiSizeResult) {
            setApiSizeResult({ error: (error as Error).message || 'API request failed', method: 'api' })
            if (setConfidenceScore) setConfidenceScore(0)
            if (setMeasurementsChanged) setMeasurementsChanged(false)
          }
        } finally {
        if (setIsApiLoadingLocal) {
          setIsApiLoadingLocal(false)
        }
      }
    }, 500)
  }, [
    activeProfile,
    isFastTrackMode,
    setMeasurements,
    setGender,
    setSelectedSkinColor,
    setSelectedHair,
    handleSkinColorSelect,
    modelRef,
    updateModelDimensions,
    applyMorphValues,
    step,
    totalSteps,
    triggerImmediateApiCall,
    getWrappedApiCall,
    setApiSizeResult,
    setConfidenceScore,
    setMeasurementsChanged,
    setIsApiLoadingLocal,
    licenseKey,
    gender,
    measurements,
    isMobile
  ])

  // Apply profile data when fast-track mode is active
  useEffect(() => {
    if (isFastTrackMode && activeProfile) {
      applyProfileDataForFastTrack()
    }
  }, [isFastTrackMode, activeProfile?.id])

  // Trigger API call when reaching final step in fast-track mode
  useEffect(() => {
    if (isFastTrackMode && hasAppliedFastTrack.current) {
      triggerImmediateApiCall()
    }
  }, [isFastTrackMode, step, triggerImmediateApiCall])

  // Reset flags when profile changes
  useEffect(() => {
    hasAppliedFastTrack.current = false
    apiCallTriggered.current = false
  }, [activeProfile?.id])

  return {
    isFastTrackActive: isFastTrackMode && !!activeProfile,
    hasAppliedData: hasAppliedFastTrack.current,
    isApiCallTriggered: apiCallTriggered.current
  }
}