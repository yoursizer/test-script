"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { SizingAssistant } from './sizing-assistant'
import { profileService } from './services/profileService'
import { verifyLicense } from './components/license'
import { LicenseOverlay } from './components/invalid-overlay/license-overlay'
import { analytics } from './components/analytics'

interface FindYourSizerWidgetProps {
  buttonText?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  className?: string
  buttonBg?: string
  licenseKey?: string
  onSizeRecommended?: (size: string) => void
  productId?: string
  brandId?: string
  clothingType?: string
}

export function FindYourSizerWidget({ 
  buttonText, 
  position = 'center', 
  className = '', 
  buttonBg,
  licenseKey = "demo-key",
  onSizeRecommended,
  productId = "default-product",
  brandId = "generic",
  clothingType = "tshirt"
}: FindYourSizerWidgetProps) {
  const [showSizingAssistant, setShowSizingAssistant] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [currentLicenseStatus, setCurrentLicenseStatus] = useState<{ isValid: boolean; message?: string } | null>(null)
  const [hasAttemptedLicenseCheck, setHasAttemptedLicenseCheck] = useState(false)
  const lastProfileId = useRef<string | null>(null)
  const lastProfileContent = useRef<string | null>(null)



  // Load current profile on component mount
  useEffect(() => {
    const loadProfile = () => {
      const activeProfile = profileService.getActiveProfile()
      const currentProfileContent = activeProfile ? JSON.stringify(activeProfile) : null
      
      // Update if the profile ID changed OR if the profile content changed (like name updates)
      const shouldUpdate = activeProfile?.id !== lastProfileId.current || 
                          currentProfileContent !== lastProfileContent.current
      
      if (shouldUpdate) {
        setCurrentProfile(activeProfile)
        lastProfileId.current = activeProfile?.id || null
        lastProfileContent.current = currentProfileContent
      }
    }
    
    loadProfile()
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadProfile()
    }
    
    // Listen for measurements restart
    const handleMeasurementsRestarted = () => {
      loadProfile()
    }

    // Listen for new profile service events
    const handleProfileCreated = (event: Event) => {
      const customEvent = event as CustomEvent
      const { profile } = customEvent.detail
      console.log('🎉 ProductView: New profile created:', profile.name)
      loadProfile() // Reload to get the new active profile
    }

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      const { profile } = customEvent.detail
      console.log('✏️ ProductView: Profile updated:', profile.name)
      loadProfile() // Reload to get the updated profile
    }
    
    window.addEventListener('yoursizer-profile-updated', handleProfileUpdate)
    window.addEventListener('yoursizer-measurements-restarted', handleMeasurementsRestarted)
    window.addEventListener('user_profile_created', handleProfileCreated)
    window.addEventListener('user_profile_updated', handleProfileUpdated)
    
    return () => {
      window.removeEventListener('yoursizer-profile-updated', handleProfileUpdate)
      window.removeEventListener('yoursizer-measurements-restarted', handleMeasurementsRestarted)
      window.removeEventListener('user_profile_created', handleProfileCreated)
      window.removeEventListener('user_profile_updated', handleProfileUpdated)
    }
  }, [])

  // Handle license verification and sizing assistant opening
  const handleFindSizeClick = async () => {
    setIsChecking(true);
    setHasAttemptedLicenseCheck(true);
    
    // Pre-detect location when button is clicked
    try {
      await analytics.preDetectLocation();
    } catch (error) {
      console.warn('Location pre-detection failed:', error);
    }
    
    try {
      const result = await verifyLicense(licenseKey);
      setCurrentLicenseStatus(result);
      
      if (result.isValid) {
        setShowSizingAssistant(true);
      }
    } catch (error) {
      console.error('License verification failed:', error);
      setCurrentLicenseStatus({
        isValid: false,
        message: 'Failed to verify license. Please try again later.'
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Handle license retry
  const handleLicenseRetry = () => {
    setHasAttemptedLicenseCheck(false);
    handleFindSizeClick();
  };

  // Handle size recommendation from the sizing assistant
  const handleSizeRecommended = (size: string) => {
    console.log('📦 ProductView: Size recommended:', size)
    // setSelectedSize(size) 
    setShowSizingAssistant(false)
    onSizeRecommended?.(size)
  }

  // Get initial step based on user state
  const getInitialStep = () => {
    if (currentProfile) {
      // Check if we're on mobile and return appropriate step
      const isMobile = window.innerWidth < 768;
      return isMobile ? 8 : 5; // Step 8 for mobile, Step 5 for desktop
    }
    return 1 // Start from beginning for new users or users without size
  }

  // Dynamic button text based on profile and props
  const getButtonText = () => {
    // If custom buttonText is provided, use it
    
    // Otherwise, use dynamic text based on profile
    if (currentProfile) {
      return `Find ${currentProfile.name}'s Size`
    }
    return buttonText || 'Find Your Size'
  }

  // Get position classes based on position prop
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'justify-start'
      case 'bottom':
        return 'justify-end'
      case 'left':
        return 'justify-start'
      case 'right':
        return 'justify-end'
      case 'center':
      default:
        return 'justify-center'
    }
  }

  return (
    <div className={`container ${className}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
      >

        {/* Product Details */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >

          {/* Size Selection */}
          <div className="space-y-4">
            <div className={`flex items-center ${getPositionClasses()}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFindSizeClick}
                disabled={isChecking}
                className="relative inline-flex h-10 overflow-hidden rounded-full p-[3px] focus:outline-none focus:ring-4 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                style={buttonBg ? { 
                  background: buttonBg,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
              >
                {!buttonBg && (
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#50ffab_0%,#282bff_50%,#ffe665_100%)]" />
                )}
                <span className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full ${buttonBg ? 'text-white' : 'bg-white text-black'} px-3 py-1 text-sm font-medium backdrop-blur-3xl space-x-2`}>
                  {isChecking ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      {!currentProfile && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      )}
                      <span>{getButtonText()}</span>
                    </>
                  )}
                </span>
              </motion.button>
            </div>
    
          </div>

        </motion.div>
      </motion.div>
      
      {showSizingAssistant && (
        <SizingAssistant
          onClose={() => setShowSizingAssistant(false)}
          onSizeRecommended={handleSizeRecommended}
          productId={productId}
          brandId={brandId}
          clothingType={clothingType}
          licenseStatus={currentLicenseStatus}
          licenseKey={licenseKey}
        />
      )}

      {/* License Overlay */}
      <LicenseOverlay
        licenseStatus={currentLicenseStatus}
        onClose={() => setCurrentLicenseStatus(null)}
        onRetry={handleLicenseRetry}
        isVisible={hasAttemptedLicenseCheck && !currentLicenseStatus?.isValid}
        isChecking={isChecking}
      />
    </div>
  )
}

