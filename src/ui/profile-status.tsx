import React from 'react'
import { User, Settings, Plus } from 'lucide-react'
import { UserProfile } from '../lib/userProfileStorage'
import { getProfileDisplayName, formatProfileMeasurements } from '../utils/profileUtils'

interface ProfileStatusProps {
  currentProfile: UserProfile | null
  allProfiles: UserProfile[]
  onProfileSelect: (profile: UserProfile) => void
  onOpenProfileModal: () => void
  onStartNewProfile: () => void
  className?: string
}

export function ProfileStatus({ 
  currentProfile, 
  allProfiles, 
  onProfileSelect, 
  onOpenProfileModal, 
  onStartNewProfile,
  className = '' 
}: ProfileStatusProps) {
  if (!currentProfile) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">No Profile</h3>
              <p className="text-sm text-gray-500">Create a profile to save your measurements</p>
            </div>
          </div>
          <button
            onClick={onStartNewProfile}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{getProfileDisplayName(currentProfile)}</h3>
            <p className="text-sm text-gray-600">{formatProfileMeasurements(currentProfile.measurements)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allProfiles.length > 1 && (
            <select
              value={currentProfile.id}
              onChange={(e) => {
                const profile = allProfiles.find(p => p.id === e.target.value)
                if (profile) onProfileSelect(profile)
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {getProfileDisplayName(profile)}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={onOpenProfileModal}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Profile Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 