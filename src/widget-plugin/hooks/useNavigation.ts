import { useState, useCallback, useRef, useEffect } from 'react'
import { UserProfile } from '../lib/userProfileStorage'
import { profileService } from '../services/profileService'
import { analytics } from '../components/analytics'

interface ApiSizeResult {
  size?: string;
  confidence?: number;
  error?: string;
  explanation?: string;
  smaller_size?: string | null;
  larger_size?: string | null;
  smaller_reason?: string | null;
  larger_reason?: string | null;
  range_type?: string;
}

interface ApiResponse {
  size: string;
  confidence: number;
  explanation?: string;
  smaller_size?: string | null;
  larger_size?: string | null;
  smaller_reason?: string | null;
  larger_reason?: string | null;
  range_type?: string;
}

interface UseNavigationProps {
  isMobile: boolean
  useApiRecommendation: boolean
  setApiSizeResult: (result: ApiSizeResult | null) => void
  setConfidenceScore: (score: number) => void
  measurements?: {
    height: string;
    weight: string;
    chest: string;
    waist: string;
    hips: string;
  }
  setMeasurementsChanged?: (changed: boolean) => void
  measurementsChanged?: boolean
  setIsApiLoadingLocal?: (loading: boolean) => void
  createProfileFromCurrentData?: (() => any) | undefined
  initialStep?: number
  initialGender?: "male" | "female" | null
  onProfileCached?: () => void
  activeProfile?: any
  isFastTrackMode?: boolean
  onStartNewProfile?: () => void
  licenseKey?: string
}

export function useNavigation({
  isMobile,
  useApiRecommendation,
  setApiSizeResult,
  setConfidenceScore,
  measurements,
  setMeasurementsChanged,
  measurementsChanged,
  setIsApiLoadingLocal,
  createProfileFromCurrentData,
  initialStep,
  initialGender,
  onProfileCached,
  activeProfile, // Add activeProfile to detect fast-track mode
  isFastTrackMode, // Add isFastTrackMode flag
  onStartNewProfile,
  licenseKey
}: UseNavigationProps) {
  const [step, setStep] = useState(initialStep || 1)
  const [gender, setGender] = useState<"male" | "female" | null>(initialGender || null)
  
  // Update step when initialStep changes (for fast-track mode only)
  useEffect(() => {
    if (initialStep && initialStep > 1) {
      setStep(initialStep)
    }
  }, [initialStep])
  
  // Store the API function reference
  const apiSizeRecommendationRef = useRef<(() => Promise<unknown>) | null>(null)
  
  // Store profile creation function reference
  const createProfileRef = useRef<(() => any) | null>(null)
  
  // Track if profile was auto-created for current session
  const hasAutoCreatedProfile = useRef(false)
  const autoCreatedProfileId = useRef<string | null>(null)
  
  // Update profile creation reference
  useEffect(() => {
    createProfileRef.current = createProfileFromCurrentData || null
  }, [createProfileFromCurrentData])

  const totalSteps = isMobile ? 7 : 4
  
  // Auto-create profile cache when measurements are complete
  const createProfileCache = useCallback((selectedSkinColor?: string | null, currentMorphValues?: Map<string, number>) => {
    if (hasAutoCreatedProfile.current) {
      return
    }

    if (!gender || !measurements || !measurements.height || !measurements.weight || 
        !measurements.chest || !measurements.waist || !measurements.hips) {
      return
    }

    // If there's an active profile, update it instead of creating new one
    if (activeProfile) {
      
      try {
        const updates: any = {
          measurements: {
            height: measurements.height,
            weight: measurements.weight,
            chest: measurements.chest,
            waist: measurements.waist,
            hips: measurements.hips
          },
          updatedAt: new Date().toISOString()
        }
        
        if (selectedSkinColor) {
          updates.skinColor = selectedSkinColor
        }
        
        // Save current morph values to preserve model state
        if (currentMorphValues && currentMorphValues.size > 0) {
          updates.morphValues = Object.fromEntries(currentMorphValues)
        }
        
        // Update the existing profile
        profileService.updateProfile(activeProfile.id, updates)
        
        hasAutoCreatedProfile.current = true
        onProfileCached?.()
        
        return activeProfile
      } catch (error) {
      }
      return
    }

    
    try {
      // Generate profile name with incremental numbering
      const baseName = gender === 'male' ? 'Bob' : 'Alice'
      let profileName = baseName
      let counter = 1
      
      // Get existing profiles to check for name conflicts
      const existingProfiles = profileService.getAllProfiles()
      
      // Find the highest number for this base name
      const existingNumbers = existingProfiles
        .filter(p => p.name.startsWith(baseName) && p.gender === gender)
        .map(p => {
          if (p.name === baseName) return 1
          const match = p.name.match(new RegExp(`^${baseName} (\\d+)$`))
          return match ? parseInt(match[1]) : 0
        })
        .filter(n => n > 0)
      
      if (existingNumbers.length > 0) {
        counter = Math.max(...existingNumbers) + 1
        profileName = `${baseName} ${counter}`
      }

      // Create the profile data
      const profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> = {
        name: profileName,
        gender,
        measurements: {
          height: measurements.height,
          weight: measurements.weight,
          chest: measurements.chest,
          waist: measurements.waist,
          hips: measurements.hips
        },
        skinColor: selectedSkinColor || undefined,
        hairType: gender === 'male' ? 'hair1' : 'hair1',
        sizeRecommendations: {}
      }
      
      // Create profile and make it the current active one
      const newProfile = profileService.createProfile(gender, profileData.measurements)
      
      // Update with additional data if available
      const updates: any = {}
      
      if (selectedSkinColor) {
        updates.skinColor = selectedSkinColor
      }
      
      // Save current morph values to preserve model state
      if (currentMorphValues && currentMorphValues.size > 0) {
        updates.morphValues = Object.fromEntries(currentMorphValues)
      }
      
      // Apply all updates
      if (Object.keys(updates).length > 0) {
        profileService.updateProfile(newProfile.id, updates)
      }
      
      // Set as active profile (latest becomes current)
      profileService.setActiveProfile(newProfile.id)
      
      // Mark as auto-created for this session
      hasAutoCreatedProfile.current = true
      autoCreatedProfileId.current = newProfile.id
      
      // Trigger saved animation
      onProfileCached?.()
      
      return newProfile
    } catch (error) {
    }
  }, [gender, measurements, onProfileCached, isFastTrackMode, activeProfile])

  // Store previous measurements to detect actual changes
  const prevMeasurementsRef = useRef<string>('')
  const isInitializedRef = useRef(false)
  
  // Reset measurementsChanged flag when starting new session or setting programmatic values
  const resetMeasurementsChanged = useCallback(() => {
    if (setMeasurementsChanged) {
      setMeasurementsChanged(false)
    }
  }, [setMeasurementsChanged])
  
  // Clear API result when measurements actually change
  useEffect(() => {
    const currentMeasurements = JSON.stringify({
      height: measurements?.height,
      weight: measurements?.weight, 
      chest: measurements?.chest,
      waist: measurements?.waist,
      hips: measurements?.hips
    })
    
    // Skip the first render (initialization)
    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      prevMeasurementsRef.current = currentMeasurements
      // Only reset measurementsChanged flag on true initialization (not during step navigation)
      // This prevents resetting the flag when user has already interacted with sliders
      if (step === 1) {
        resetMeasurementsChanged()
      }
      return
    }
    
    // Only trigger if measurements actually changed
    if (prevMeasurementsRef.current !== currentMeasurements) {
      setApiSizeResult(null)
      setConfidenceScore(0)
      // Don't set measurementsChanged here - it should only be set by user slider interactions
      // setMeasurementsChanged?.(true)
      setIsApiLoadingLocal?.(false)
      
      // Reset auto-creation flag when measurements change significantly
      hasAutoCreatedProfile.current = false
    }
    
    prevMeasurementsRef.current = currentMeasurements
  }, [measurements?.height, measurements?.weight, measurements?.chest, measurements?.waist, measurements?.hips, setApiSizeResult, setConfidenceScore, setIsApiLoadingLocal])

  // Function to update the API reference
  const setApiSizeRecommendation = (apiFunc: () => Promise<unknown>) => {
    apiSizeRecommendationRef.current = apiFunc
  }

  const handleNext = useCallback(async (selectedSkinColor?: string | null, currentMorphValues?: Map<string, number>) => {
    const finalStep = isMobile ? 7 : 4;
    
    // Auto-create profile cache when reaching final measurement step (before "See Result")
    // Auto-create profile cache and trigger API call when moving from measurement complete step
    const measurementCompleteStep = isMobile ? 6 : 3 // Last measurement step
    const apiTriggerStep = isMobile ? 7 : 4 // Step where API should trigger
    
    if (step === measurementCompleteStep) {
      createProfileCache(selectedSkinColor, currentMorphValues)
      
      // Trigger API call when clicking Next from step 3->4 (desktop) or step 6->7 (mobile)
      if (apiSizeRecommendationRef.current) {
        try {
          setIsApiLoadingLocal?.(true)
          const result = await apiSizeRecommendationRef.current()
          setApiSizeResult(result as any)
          setConfidenceScore((result as any)?.confidence || 0)
          setMeasurementsChanged?.(false) // Reset the flag after successful API call
          
          // Automatically track size recommendation when API result is received
          if (result && licenseKey) {
            // For existing users, use the same measurements that were sent to the API
            // The API call uses activeProfile.measurements for existing users
            const measurementsData = measurements ? {
              height: measurements.height ? parseFloat(measurements.height) : undefined,
              weight: measurements.weight ? parseFloat(measurements.weight) : undefined,
              chest: measurements.chest ? parseFloat(measurements.chest) : undefined,
              waist: measurements.waist ? parseFloat(measurements.waist) : undefined,
              hips: measurements.hips ? parseFloat(measurements.hips) : undefined
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
              result as any,
              gender || undefined,
              measurementsData,
              stepProgression
            ).catch(error => {
              console.warn('Failed to auto-track size recommendation:', error);
            });
          }
        } catch (error) {
          // API failed - set error state
          setApiSizeResult({ error: (error as Error).message || 'API request failed' })
          setConfidenceScore(0)
          setMeasurementsChanged?.(false) // Reset the flag even on error
        } finally {
          setIsApiLoadingLocal?.(false) // Clear loading state
        }
      } else {
        // No API function available - set error state
        setApiSizeResult({ error: 'Size recommendation service not available' })
        setConfidenceScore(0)
        setMeasurementsChanged?.(false) // Reset the flag even on error
      }
    }
    
    // Create profile before final step (existing logic)
    if (step === finalStep - 1 && createProfileRef.current) {
      createProfileRef.current()
    }
    
    if (step === finalStep) {
      // API call already happened at measurementCompleteStep, don't advance step further
      // But we still need to track the final step started event
      if (licenseKey) {
        const stepNames = isMobile ? {
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
        
        // Track completion of current step
        analytics.trackStepCompleted(licenseKey, stepNames[step as keyof typeof stepNames] || `step_${step}`, `step_${step}`, isMobile).catch(error => {
          console.warn('Failed to track step completion:', error);
        });
        
        // Start tracking for final step
        analytics.startStepTracking(`step_${finalStep}`);
        
        // Include user inputs for final step with current measurement values
        const userInputs = {
          gender: gender || undefined,
          measurements: measurements ? (() => {
            const measurementData: any = {};
            
            // Include all measurements for final step
            if (measurements.height) measurementData.height = parseFloat(measurements.height);
            if (measurements.weight) measurementData.weight = parseFloat(measurements.weight);
            if (measurements.chest) measurementData.chest = parseFloat(measurements.chest);
            if (measurements.waist) measurementData.waist = parseFloat(measurements.waist);
            if (measurements.hips) measurementData.hips = parseFloat(measurements.hips);
            
            return Object.keys(measurementData).length > 0 ? measurementData : undefined;
          })() : undefined,
          step_progression: {
            step_1_completed: true,
            step_2_completed: true,
            step_3_completed: true,
            step_4_completed: true,
            step_5_completed: isMobile,
            step_6_completed: isMobile,
            step_7_completed: isMobile
          }
        };
        
        
        analytics.trackStepStarted(licenseKey, `step_${finalStep}`, stepNames[finalStep as keyof typeof stepNames] || `step_${finalStep}`, gender || undefined, isMobile, userInputs, undefined, measurementsChanged).catch(error => {
          console.warn('Failed to track final step started:', error);
        });
      }
      return;
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      
      // Track step completion for current step
      if (licenseKey) {
        const stepNames = isMobile ? {
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
        
        // Track completion of current step
        analytics.trackStepCompleted(licenseKey, stepNames[step as keyof typeof stepNames] || `step_${step}`, `step_${step}`, isMobile).catch(error => {
          console.warn('Failed to track step completion:', error);
        });
        
        // Start tracking for next step (including final step)
        if (nextStep <= finalStep) {
          analytics.startStepTracking(`step_${nextStep}`);
          
          console.log('🔍 Navigation Step Debug:', {
            nextStep,
            finalStep,
            isMobile,
            measurementsChanged,
            stepCondition: nextStep <= finalStep
          });
          
          // For steps 2-4 (desktop) or 2-7 (mobile), include user inputs and recommended sizes
          const shouldIncludeUserInputs = 
            (!isMobile && nextStep >= 2 && nextStep <= 4) ||
            (isMobile && nextStep >= 2 && nextStep <= 7);
            
          if (shouldIncludeUserInputs) {
            console.log('📊 Navigation Debug:', {
              nextStep,
              measurementsChanged,
              shouldIncludeUserInputs,
              measurements: measurements ? {
                height: measurements.height,
                weight: measurements.weight,
                chest: measurements.chest,
                waist: measurements.waist,
                hips: measurements.hips
              } : null
            });
            // Include userInputs with current measurement values
            // If measurementsChanged is false, include default values for analytics tracking
            const userInputs = {
              gender: gender || undefined,
              measurements: measurements ? (() => {
                const measurementData: any = {};
                
                // Desktop flow: step 2 = height+weight, step 3 = height+weight (chest/waist/hips auto-calculated), step 4 = all
                if (!isMobile) {
                  if (nextStep >= 2) {
                    if (measurements.height) measurementData.height = parseFloat(measurements.height);
                    if (measurements.weight) measurementData.weight = parseFloat(measurements.weight);
                  }
                  // For desktop, chest/waist/hips are only included in step 4 (final step)
                  if (nextStep >= 4) {
                    if (measurements.chest) measurementData.chest = parseFloat(measurements.chest);
                    if (measurements.waist) measurementData.waist = parseFloat(measurements.waist);
                    if (measurements.hips) measurementData.hips = parseFloat(measurements.hips);
                  }
                } else {
                  // Mobile flow: step 2 = height, step 3 = +weight, step 4 = +chest, step 5 = +waist, step 6 = +hips, step 7 = all
                  if (nextStep >= 2 && measurements.height) {
                    measurementData.height = parseFloat(measurements.height);
                  }
                  if (nextStep >= 3 && measurements.weight) {
                    measurementData.weight = parseFloat(measurements.weight);
                  }
                  if (nextStep >= 4 && measurements.chest) {
                    measurementData.chest = parseFloat(measurements.chest);
                  }
                  if (nextStep >= 5 && measurements.waist) {
                    measurementData.waist = parseFloat(measurements.waist);
                  }
                  if (nextStep >= 6 && measurements.hips) {
                    measurementData.hips = parseFloat(measurements.hips);
                  }
                }
                
                return Object.keys(measurementData).length > 0 ? measurementData : undefined;
              })() : undefined,
              step_progression: {
                step_1_completed: true, // Gender selection completed
                step_2_completed: nextStep > 2,
                step_3_completed: nextStep > 3,
                step_4_completed: nextStep > 4,
                step_5_completed: nextStep > 5,
                step_6_completed: nextStep > 6,
                step_7_completed: nextStep > 7
              }
            };
            
            
            // For steps before final step, we don't have recommended sizes yet, so pass undefined
            analytics.trackStepStarted(licenseKey, `step_${nextStep}`, stepNames[nextStep as keyof typeof stepNames] || `step_${nextStep}`, gender || undefined, isMobile, userInputs, undefined, measurementsChanged).catch(error => {
              console.warn('Failed to track step started:', error);
            });
          } else {
            // For other steps, use the original call
            analytics.trackStepStarted(licenseKey, `step_${nextStep}`, stepNames[nextStep as keyof typeof stepNames] || `step_${nextStep}`, undefined, isMobile, undefined, undefined, measurementsChanged).catch(error => {
              console.warn('Failed to track step started:', error);
            });
          }
        }
      }
    }
  }, [step, isMobile, setApiSizeResult, setConfidenceScore, setMeasurementsChanged, setIsApiLoadingLocal, createProfileFromCurrentData, createProfileCache, licenseKey, gender, measurements])

  const handlePrevious = useCallback(() => {
    if (step > 1) {
      // Reset everything when going back from step 2 to step 1
      if (step === 2 && onStartNewProfile) {
        // Delete auto-created profile if it exists
        if (hasAutoCreatedProfile.current && autoCreatedProfileId.current) {
          try {
            profileService.deleteProfile(autoCreatedProfileId.current)
            hasAutoCreatedProfile.current = false
            autoCreatedProfileId.current = null
          } catch (error) {
            console.error('Failed to delete auto-created profile:', error)
          }
        }
        onStartNewProfile()
      } else {
        const previousStep = step - 1;
        setStep(previousStep);
        
        // Track step navigation when going back
        if (licenseKey) {
          const stepNames = isMobile ? {
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
          
          // Clear any existing events for this step to allow re-tracking
          analytics.clearStepEvents(`step_${previousStep}`);
          
          // Start tracking for the step we're navigating back to
          analytics.startStepTracking(`step_${previousStep}`);
          
          // Include user inputs for back navigation with current measurement values
          const userInputs = {
            gender: gender || undefined,
            measurements: measurements ? (() => {
              const measurementData: any = {};
              
              // Desktop flow: step 2 = height+weight, step 3 = height+weight, step 4 = all
              if (!isMobile) {
                if (previousStep >= 2) {
                  if (measurements.height) measurementData.height = parseFloat(measurements.height);
                  if (measurements.weight) measurementData.weight = parseFloat(measurements.weight);
                }
                if (previousStep >= 4) {
                  if (measurements.chest) measurementData.chest = parseFloat(measurements.chest);
                  if (measurements.waist) measurementData.waist = parseFloat(measurements.waist);
                  if (measurements.hips) measurementData.hips = parseFloat(measurements.hips);
                }
              } else {
                // Mobile flow: step 2 = height, step 3 = +weight, step 4 = +chest, step 5 = +waist, step 6 = +hips, step 7 = all
                if (previousStep >= 2 && measurements.height) {
                  measurementData.height = parseFloat(measurements.height);
                }
                if (previousStep >= 3 && measurements.weight) {
                  measurementData.weight = parseFloat(measurements.weight);
                }
                if (previousStep >= 4 && measurements.chest) {
                  measurementData.chest = parseFloat(measurements.chest);
                }
                if (previousStep >= 5 && measurements.waist) {
                  measurementData.waist = parseFloat(measurements.waist);
                }
                if (previousStep >= 6 && measurements.hips) {
                  measurementData.hips = parseFloat(measurements.hips);
                }
              }
              
              return Object.keys(measurementData).length > 0 ? measurementData : undefined;
            })() : undefined,
            step_progression: {
              step_1_completed: true,
              step_2_completed: previousStep > 2,
              step_3_completed: previousStep > 3,
              step_4_completed: previousStep > 4,
              step_5_completed: previousStep > 5,
              step_6_completed: previousStep > 6,
              step_7_completed: previousStep > 7
            }
          };
          
          analytics.trackStepStarted(licenseKey, `step_${previousStep}`, stepNames[previousStep as keyof typeof stepNames] || `step_${previousStep}`, gender || undefined, isMobile, userInputs, undefined, measurementsChanged).catch(error => {
            console.warn('Failed to track step started (back navigation):', error);
          });
        }
      }
    }
  }, [step, onStartNewProfile, licenseKey, isMobile])

  // Function to update profile creation reference from outside
  const setCreateProfileFromCurrentData = (profileCreationFunc: (() => any) | undefined) => {
    createProfileRef.current = profileCreationFunc || null
  }

  // Function to navigate to step 0 (new profile creation/edit measurements)
  const handleNavigateToStep0 = useCallback(() => {
    setStep(0);
    
    // Track step 0 started for new profile creation
    if (licenseKey) {
      const stepNames = isMobile ? {
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
      
      // Clear any existing events for step 0 to allow re-tracking
      analytics.clearStepEvents('step_0');
      
      // Start tracking for step 0
      analytics.startStepTracking('step_0');
      analytics.trackStepStarted(licenseKey, 'step_0', stepNames[0], undefined, isMobile, undefined, undefined, measurementsChanged).catch(error => {
        console.warn('Failed to track step 0 started (new profile):', error);
      });
    }
  }, [licenseKey, isMobile])

  return {
    step,
    setStep,
    gender,
    setGender,
    totalSteps,
    handleNext,
    handlePrevious,
    handleNavigateToStep0, // Export the new function
    setApiSizeRecommendation, // Export this to allow setting the API function
    setCreateProfileFromCurrentData,
    createProfileCache // Export for manual cache creation
  }
}