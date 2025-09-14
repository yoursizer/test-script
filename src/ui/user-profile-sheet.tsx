import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Plus, Check, Trash2, X, Edit2 } from 'lucide-react'
import { UserProfile } from '../lib/userProfileStorage'
import { getProfileDisplayName, formatProfileMeasurements } from '../utils/profileUtils'

interface UserProfileSheetProps {
  isVisible: boolean
  onClose: () => void
  onProfileSelect: (profile: UserProfile) => void
  onRestart: () => void
  onStartNewProfile: () => void
  currentProfile: UserProfile | null
  allProfiles: UserProfile[]
  activeProfileId: string | null
  onProfileSwitch: (profile: UserProfile) => void
  onProfileRemove: (profileId: string) => void
  onProfileNameUpdate: (profileId: string, newName: string) => void
  debugData?: any
}

export function UserProfileSheet({ 
  isVisible, 
  onClose, 
  onProfileSelect, 
  onRestart, 
  onStartNewProfile,
  currentProfile,
  allProfiles,
  activeProfileId,
  onProfileSwitch,
  onProfileRemove,
  onProfileNameUpdate,
  debugData = {}
}: UserProfileSheetProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [isRemovingProfile, setIsRemovingProfile] = useState(false)

  useEffect(() => {
    if (currentProfile) {
      setEditedName(currentProfile.name)
    }
  }, [currentProfile])



  const getEffectiveMeasurements = (profile: UserProfile) => {
    const userAdjusted = profile.userAdjustedMeasurements;
    
    if (userAdjusted && (userAdjusted.chest || userAdjusted.waist || userAdjusted.hips)) {
      return {
        ...profile.measurements,
        chest: userAdjusted.chest || profile.measurements.chest,
        waist: userAdjusted.waist || profile.measurements.waist,
        hips: userAdjusted.hips || profile.measurements.hips
      };
    }

    return profile.measurements;
  };

  const handleProfileSwitch = (profile: UserProfile) => {
    onProfileSwitch(profile)
    setEditedName(profile.name)
  }

  const handleAddNewProfile = () => {
    onStartNewProfile()
    onClose()
  }

  const handleRestartWithNewProfile = () => {
    // Delete current profile first, then start fresh
    if (currentProfile) {
      onProfileRemove(currentProfile.id)
    }
    onStartNewProfile()
    onClose()
  }

  const handleRemoveProfile = (profileId: string) => {
    if (isRemovingProfile) return;
    
    setIsRemovingProfile(true);
    onProfileRemove(profileId);
    setIsRemovingProfile(false);
  }

  const handleNameEdit = () => {
    setIsEditingName(true)
  }

  const handleNameSave = () => {
    if (currentProfile && editedName.trim()) {
      onProfileNameUpdate(currentProfile.id, editedName.trim())
      setIsEditingName(false)
    } else if (currentProfile && !editedName.trim()) {
      setEditedName(currentProfile.name)
      setIsEditingName(false)
    }
  }

  const handleNameCancel = () => {
    if (currentProfile) {
      setEditedName(currentProfile.name)
    }
    setIsEditingName(false)
  }

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNameSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleNameCancel()
    }
  }

  const getBodyTypeLabelForProfile = (measurement: string, measurementType: 'chest' | 'waist' | 'hips'): string => {
    if (!measurement || measurement.trim() === '') return "Normal"
    const numValue = parseFloat(measurement)
    if (isNaN(numValue)) return "Normal"
    
    const fetchedData = debugData?.heightWeight?.fetchedData?.measurements;
    let jsonValue = 0;
    if (fetchedData) {
      if (measurementType === 'chest') jsonValue = fetchedData.chest;
      else if (measurementType === 'waist') jsonValue = fetchedData.waist;
      else if (measurementType === 'hips') jsonValue = fetchedData.hips;
    }
    
    if (!jsonValue || jsonValue === 0) {
      const fallbackRanges = {
        chest: { min: 80, max: 120 },
        waist: { min: 65, max: 110 },
        hips: { min: 85, max: 125 }
      };
      const range = fallbackRanges[measurementType];
      const percent = (numValue - range.min) / (range.max - range.min);
      const index = Math.round(percent * 4);
      const labels = {
        chest: ['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide'],
        waist: ['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide'],
        hips: ['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide']
      };
      const clampedIndex = Math.min(Math.max(index, 0), 4);
      return labels[measurementType][clampedIndex];
    }
    
    const min = jsonValue - 6;
    const max = jsonValue + 6;
    
    const labels = {
      chest: ['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide'],
      waist: ['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide'],
      hips: ['Very Narrow', 'Narrow', 'Normal', 'Wide', 'Very Wide']
    };
    
    const measurementLabels = labels[measurementType];
    const range = max - min;
    if (range <= 0) return measurementLabels[2] || 'Normal';
    
    const percent = (numValue - min) / range;
    const index = Math.round(percent * (measurementLabels.length - 1));
    const clampedIndex = Math.min(Math.max(index, 0), measurementLabels.length - 1);
    return measurementLabels[clampedIndex] || 'Normal';
  }

  const formatMeasurement = (value: string, unit: string): string => {
    if (!value || value.trim() === '') return `0${unit}`
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue === 0) return `0${unit}`
    return `${numValue.toFixed(1)}${unit}`
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/20"
      style={{ 
        touchAction: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="fixed right-0 top-0 h-full w-full max-w-full sm:max-w-sm bg-white shadow-2xl flex flex-col"
        style={{ 
          maxHeight: '100vh', 
          height: '100%',
          touchAction: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'auto'
        }}
      >
          <div className="flex items-center justify-between p-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                {currentProfile ? currentProfile.name : "User"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div 
            className="flex-1 p-3 space-y-3" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'auto',
              overscrollBehavior: 'auto',
              transform: 'translateZ(0)' // Force hardware acceleration for Safari
            }}
          >
            {currentProfile && currentProfile.measurements ? (
              <div className="space-y-3">
                {/* Compact Name Section */}
                <div className="text-center">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 justify-center">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={handleNameKeyPress}
                        className="text-base font-bold text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none text-center"
                        autoFocus
                        spellCheck="false"
                        autoComplete="off"
                        maxLength={20}
                      />
                      <button onClick={handleNameSave} className="text-green-600 p-1">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={handleNameCancel} className="text-gray-500 p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-center">
                      <h3 className="text-base font-bold text-gray-900">{currentProfile.name}</h3>
                      <button onClick={handleNameEdit} className="text-gray-400 p-1">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>

                {/* Compact Measurements Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-gray-500 mb-1">Height</div>
                    <div className="font-semibold text-gray-900">
                      {formatMeasurement(currentProfile.measurements.height, "cm")}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-gray-500 mb-1">Weight</div>
                    <div className="font-semibold text-gray-900">
                      {formatMeasurement(currentProfile.measurements.weight, "kg")}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-gray-500 mb-1">Chest</div>
                    <div className="font-semibold text-gray-900">
                      {formatMeasurement(getEffectiveMeasurements(currentProfile).chest, "cm")}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-gray-500 mb-1">Waist</div>
                    <div className="font-semibold text-gray-900">
                      {formatMeasurement(getEffectiveMeasurements(currentProfile).waist, "cm")}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-gray-500 mb-1">Hips</div>
                    <div className="font-semibold text-gray-900">
                      {formatMeasurement(getEffectiveMeasurements(currentProfile).hips, "cm")}
                    </div>
                  </div>
                </div>

                {/* Compact Action Button */}
                <button
                  onClick={handleRestartWithNewProfile}
                  className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Edit Measurements
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {currentProfile ? "Profile Incomplete" : "No Profile Yet"}
                  </h3>
                  <p className="text-gray-600 text-xs">
                    {currentProfile 
                      ? "Complete the sizing process."
                      : "Create your measurement profile"
                    }
                  </p>
                  <button
                    onClick={handleAddNewProfile}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    {currentProfile ? "Complete Profile" : "Create Profile"}
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 my-3"></div>

            <div className="space-y-2">
              <button
                onClick={handleAddNewProfile}
                className="w-full flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </div>
                <span className="font-medium">Add new profile</span>
              </button>

              {allProfiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-gray-700">Profiles ({allProfiles.length})</h3>
                  {allProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`p-2 sm:p-3 rounded-lg border transition-all ${
                        profile.id === activeProfileId
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Mobile Layout - Compact */}
                      <div className="sm:hidden flex items-center justify-between">
                        {/* Left side: Profile info */}
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-2 h-2 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{getProfileDisplayName(profile)}</p>
                            <div className="text-xs space-y-0.5 mt-1">
                              {/* First line: Height, Weight */}
                              <div className="flex gap-4">
                                <span className="text-gray-500">H: {formatMeasurement(profile.measurements.height, "cm")}</span>
                                <span className="text-gray-500">W: {formatMeasurement(profile.measurements.weight, "kg")}</span>
                              </div>
                              {/* Second line: Chest, Waist, Hips */}
                              <div className="flex gap-3">
                                <span className="text-gray-500">C: {formatMeasurement(getEffectiveMeasurements(profile).chest, "cm")}</span>
                                <span className="text-gray-500">W: {formatMeasurement(getEffectiveMeasurements(profile).waist, "cm")}</span>
                                <span className="text-gray-500">H: {formatMeasurement(getEffectiveMeasurements(profile).hips, "cm")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right side: Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {profile.id === activeProfileId && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                          <button
                            onClick={() => handleProfileSwitch(profile)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              profile.id === activeProfileId
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {profile.id === activeProfileId ? "Active" : "Switch"}
                          </button>
                          <button
                            onClick={() => handleRemoveProfile(profile.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Remove profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Desktop Layout - Original */}
                      <div className="hidden sm:block">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{getProfileDisplayName(profile)}</p>
                              <p className="text-sm text-gray-500">
                                {formatProfileMeasurements(profile.measurements)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {profile.id === activeProfileId && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                            <button
                              onClick={() => handleProfileSwitch(profile)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                profile.id === activeProfileId
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {profile.id === activeProfileId ? "Active" : "Switch"}
                            </button>
                            <button
                              onClick={() => handleRemoveProfile(profile.id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Remove profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Desktop measurements */}
                        <div className="text-xs text-gray-400 space-y-1">
                          <p>Height: {formatMeasurement(profile.measurements.height, "cm")} • Weight: {formatMeasurement(profile.measurements.weight, "kg")}</p>
                          <p>Chest: {formatMeasurement(getEffectiveMeasurements(profile).chest, "cm")} • Waist: {formatMeasurement(getEffectiveMeasurements(profile).waist, "cm")} • Hips: {formatMeasurement(getEffectiveMeasurements(profile).hips, "cm")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}


            </div>
          </div>
        </div>
      </div>
    )
}