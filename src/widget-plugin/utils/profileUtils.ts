import { UserProfile } from '../lib/userProfileStorage'

export function getProfileDisplayName(profile: UserProfile): string {
  return profile.name || (profile.gender === 'female' ? 'Alice' : 'Bob')
}

export function formatProfileMeasurements(measurements: UserProfile['measurements']): string {
  return `${measurements.height}cm × ${measurements.weight}kg`
}