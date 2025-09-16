import { UserProfile } from '../lib/userProfileStorage'

/**
 * Check if profile has complete data needed for fast-track
 */
export function isProfileReadyForFastTrack(profile: UserProfile | null): boolean {
  if (!profile) return false
  
  const { measurements, gender } = profile
  
  return !!(
    gender &&
    measurements?.height &&
    measurements?.weight &&
    measurements?.chest &&
    measurements?.waist &&
    measurements?.hips
  )
}

/**
 * Extract profile data for fast-track application
 */
export function extractProfileDataForFastTrack(profile: UserProfile) {
  return {
    measurements: profile.measurements,
    gender: profile.gender,
    skinColor: profile.skinColor,
    hairType: profile.hairType,
    // @ts-ignore - morphValues property may not exist in UserProfile type
    morphValues: profile.morphValues ? new Map(Object.entries(profile.morphValues)) : null,
    // @ts-ignore - hairMorphValues property may not exist in UserProfile type
    hairMorphValues: profile.hairMorphValues ? new Map(Object.entries(profile.hairMorphValues)) : null
  }
}

/**
 * Calculate appropriate initial step based on profile availability
 */
export function calculateInitialStep(profile: UserProfile | null, isMobile: boolean): number {
  if (isProfileReadyForFastTrack(profile)) {
    // Jump to final step if profile is complete
    return isMobile ? 7 : 4
  }
  // Start from beginning if no complete profile
  return 1
}

/**
 * Check if we should trigger immediate API call
 */
export function shouldTriggerImmediateApiCall(
  profile: UserProfile | null, 
  step: number, 
  totalSteps: number
): boolean {
  return isProfileReadyForFastTrack(profile) && step === totalSteps
}

/**
 * Validate profile data completeness for debugging
 */
export function validateProfileData(profile: UserProfile | null): {
  isValid: boolean
  missingFields: string[]
} {
  if (!profile) {
    return { isValid: false, missingFields: ['profile'] }
  }

  const missingFields: string[] = []
  
  if (!profile.gender) missingFields.push('gender')
  if (!profile.measurements?.height) missingFields.push('measurements.height')
  if (!profile.measurements?.weight) missingFields.push('measurements.weight')
  if (!profile.measurements?.chest) missingFields.push('measurements.chest')
  if (!profile.measurements?.waist) missingFields.push('measurements.waist')
  if (!profile.measurements?.hips) missingFields.push('measurements.hips')
  // fitPreference is no longer required for fast track since it defaults to 'regular'

  return {
    isValid: missingFields.length === 0,
    missingFields
  }
} 