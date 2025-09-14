import React, { useEffect, useState } from 'react'
import { User, Check } from 'lucide-react'
import { UserProfile } from '../lib/userProfileStorage'
interface ProfileIndicatorProps {
  currentProfile: UserProfile | null
  onOpenProfile: () => void
  className?: string
  showSavedAnimation?: boolean
}

export function ProfileIndicator({ currentProfile, onOpenProfile, className = '', showSavedAnimation = false }: ProfileIndicatorProps) {
  const [showTick, setShowTick] = useState(false)

  // Handle saved animation
  useEffect(() => {
    if (showSavedAnimation) {
      setShowTick(true)
      const timer = setTimeout(() => {
        setShowTick(false)
      }, 2000) // Show tick for 2 seconds
      return () => clearTimeout(timer)
    }
  }, [showSavedAnimation])

  // Show saved tick animation
  if (showTick) {
    return (
      <button
        onClick={onOpenProfile}
        className={`relative p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-all cursor-pointer ${className}`}
        title="Profile Saved!"
      >
        <div className="relative">
          <User className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-ping">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      </button>
    )
  }

  if (!currentProfile) {
    return (
      <button
        onClick={onOpenProfile}
        className={`relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${className}`}
        title="Create Profile"
      >
        <User className="w-5 h-5 animate-bounce" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      </button>
    )
  }

  return (
    <button
      onClick={onOpenProfile}
      className={`relative p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${className}`}
      title="Manage Profile"
    >
      <User className="w-5 h-5" />
      <Check className="w-3 h-3 text-green-500 absolute -top-1 -right-1" />
    </button>
  )
} 