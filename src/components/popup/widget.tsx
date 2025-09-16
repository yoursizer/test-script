"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { SizingAssistant } from "./sizing-assistant"
import { verifyLicense } from "../../action/license"
import { analytics } from "../../action/analytics"

export interface FindYourSizeWidgetProps {
  className?: string;
  licenseKey: string;
  productId?: string;
  brandId?: string;
  clothingType?: string;
  onAddToBag?: (size: string) => void;
}

export function FindYourSizeWidget({ className = "", licenseKey, productId, brandId, clothingType, onAddToBag }: FindYourSizeWidgetProps) {
  const [selectedSize, setSelectedSize] = useState("")
  const [showSizingAssistant, setShowSizingAssistant] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [licenseStatus, setLicenseStatus] = useState<{ isValid: boolean; message?: string } | null>(null)

  const handleFindSizeClick = async () => {
    setIsChecking(true);
    try {
      const result = await verifyLicense(licenseKey);
      setLicenseStatus(result);
      // Track popup opened event
      await analytics.trackPopupOpened(licenseKey, productId);
      setShowSizingAssistant(true);
    } catch (error) {
      console.error('License verification failed:', error);
      setLicenseStatus({
        isValid: false,
        message: 'Failed to verify license. Please try again later.'
      });
      setShowSizingAssistant(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSizeRecommended = async (size: string) => {
    setSelectedSize(size)
    // Size recommendation tracking is now handled in SizingAssistant
    setShowSizingAssistant(false)
  }

  return (
    <div className={className}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleFindSizeClick}
        disabled={isChecking}
        className="relative inline-flex h-10 overflow-hidden rounded-full p-[3px] focus:outline-none focus:ring-4 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
      >
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#50ffab_0%,#282bff_50%,#ffe665_100%)]" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white px-3 py-1 text-sm font-medium text-black backdrop-blur-3xl space-x-2">
          {isChecking ? (
            <span>Verifying...</span>
          ) : (
            <>
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
              <span>Find Your Size</span>
            </>
          )}
        </span>
      </motion.button>

      {/* Sizing Assistant Modal */}
      {showSizingAssistant && (
        <SizingAssistant
          onClose={() => setShowSizingAssistant(false)}
          onSizeRecommended={handleSizeRecommended}
          onAddToBag={onAddToBag}
          licenseStatus={licenseStatus}
          licenseKey={licenseKey}
          productId={productId}
          brandId={brandId}
          clothingType={clothingType}
          onLicenseRetry={handleFindSizeClick}
          isChecking={isChecking}
        />
      )}
    </div>
  )
}
