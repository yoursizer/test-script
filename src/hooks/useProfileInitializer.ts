import { useState, useEffect } from 'react'
import { UserProfile } from '../lib/userProfileStorage'
import { profileService } from '../services/profileService'
import { isProfileReadyForFastTrack, calculateInitialStep, validateProfileData } from '../utils/profileFastTrackUtils'

interface UseProfileInitializerReturn {
  activeProfile: UserProfile | null
  allProfiles: UserProfile[]
  initialStep: number
  isFastTrackMode: boolean
  isProfileReady: boolean
  setIsFastTrackMode: (value: boolean) => void
}

export function useProfileInitializer(isMobile: boolean): UseProfileInitializerReturn {
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([])
  const [initialStep, setInitialStep] = useState(1)
  const [isFastTrackMode, setIsFastTrackMode] = useState(false)

  useEffect(() => {
    // Load all profiles and determine active one
    const profiles = profileService.getAllProfiles()
    const active = profileService.getActiveProfile()

    setAllProfiles(profiles)
    setActiveProfile(active)

    // Validate profile for fast-track capability
    const validation = validateProfileData(active)
    const canFastTrack = isProfileReadyForFastTrack(active)
    
    console.log('🔍 Profile initializer:', { active: !!active, activeProfileName: active?.name, canFastTrack, validation });
    
    if (canFastTrack) {
      console.log('✅ Setting fast track mode TRUE');
      const step = calculateInitialStep(active, isMobile)
      setInitialStep(step)
      setIsFastTrackMode(true)
    } else {
      if (active) {
      }
      
      setInitialStep(1)
      setIsFastTrackMode(false)
    }
  }, [isMobile])

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ profiles: UserProfile[], activeProfileId: string | null }>
      const { profiles, activeProfileId } = customEvent.detail
      
      setAllProfiles(profiles)
      const active = profiles.find(p => p.id === activeProfileId) || null
      setActiveProfile(active)
      
      // Re-evaluate fast-track capability when profiles change
      const canFastTrack = isProfileReadyForFastTrack(active)
      setIsFastTrackMode(canFastTrack)
      
      if (canFastTrack && active) {
        const step = calculateInitialStep(active, isMobile)
        setInitialStep(step)
      } else {
        setInitialStep(1)
      }
    }

    window.addEventListener('yoursizer-profile-updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('yoursizer-profile-updated', handleProfileUpdate)
    }
  }, [isMobile])

  return {
    activeProfile,
    allProfiles,
    initialStep,
    isFastTrackMode,
    isProfileReady: isProfileReadyForFastTrack(activeProfile),
    setIsFastTrackMode
  }
}