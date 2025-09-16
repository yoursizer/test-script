// Profile Service - Backend logic for profile management
import { UserProfile, UserProfilesData } from '../lib/userProfileStorage'

const STORAGE_KEY = 'yoursizer_user_profiles';
const COOKIE_NAME = 'yoursizer_user_profiles';
const COOKIE_EXPIRY_DAYS = 365; // Long-term storage (1 year)

class ProfileService {
  private static instance: ProfileService;
  private data: UserProfilesData | null = null;

  private constructor() {
    this.loadData();
  }

  // Event emitter for cross-page communication
  private emitProfileEvent(eventType: 'user_profile_created' | 'user_profile_updated', profile: UserProfile): void {
    const event = new CustomEvent(eventType, {
      detail: { profile }
    });
    window.dispatchEvent(event);
    console.log(`📡 Emitted ${eventType} event:`, profile.name);
  }

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  // Cookie management for long-term storage
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  // Storage methods with fallback
  private saveToStorage(data: UserProfilesData): void {
    const dataString = JSON.stringify(data);
    
    try {
      // Try cookies first (preferred for long-term storage)
      this.setCookie(COOKIE_NAME, dataString, COOKIE_EXPIRY_DAYS);
    } catch (error) {
      try {
        // Fallback to localStorage
        localStorage.setItem(STORAGE_KEY, dataString);
      } catch (localStorageError) {
      }
    }
  }

  private loadFromStorage(): UserProfilesData | null {
    try {
      // Try cookies first
      const cookieData = this.getCookie(COOKIE_NAME);
      if (cookieData) {
        return JSON.parse(cookieData);
      }

      // Fallback to localStorage
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const data = JSON.parse(localData);
        // Migrate to cookies for better long-term storage
        this.saveToStorage(data);
        return data;
      }
    } catch (error) {
    }
    return null;
  }

  private loadData(): void {
    if (!this.data) {
      this.data = this.loadFromStorage() || {
        profiles: [],
        activeProfileId: null,
        lastUsed: new Date().toISOString()
      };
      
      // Clean up any duplicate profiles on load
      this.cleanupDuplicateProfiles();
    }
  }

  // Clean up duplicate profiles (keep the most recent one for each name/gender combination)
  private cleanupDuplicateProfiles(): void {
    if (!this.data) return;
    
    const profiles = this.data.profiles;
    const uniqueProfiles = new Map<string, UserProfile>();
    
    // Group profiles by name and gender
    profiles.forEach(profile => {
      const key = `${profile.name}_${profile.gender}`;
      const existing = uniqueProfiles.get(key);
      
      if (!existing || new Date(profile.updatedAt) > new Date(existing.updatedAt)) {
        // Keep the most recent profile
        uniqueProfiles.set(key, profile);
      }
    });
    
    // If we found duplicates, update the profiles array
    if (uniqueProfiles.size < profiles.length) {
      this.data.profiles = Array.from(uniqueProfiles.values());
      
      // Ensure we still have an active profile
      if (this.data.activeProfileId) {
        const activeProfileExists = this.data.profiles.some(p => p.id === this.data!.activeProfileId);
        if (!activeProfileExists) {
          // Set the first profile as active if the active profile was removed
          this.data.activeProfileId = this.data.profiles.length > 0 ? this.data.profiles[0].id : null;
        }
      }
      
      this.saveData();
    }
  }

  private saveData(): void {
    if (this.data) {
      this.data.lastUsed = new Date().toISOString();
      this.saveToStorage(this.data);
      
      // Dispatch custom event to notify UI components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent<{ profiles: UserProfile[], activeProfileId: string | null }>('yoursizer-profile-updated', {
          detail: { profiles: this.data.profiles, activeProfileId: this.data.activeProfileId }
        }));
      }
    }
  }

  // Public API methods
  public getAllProfiles(): UserProfile[] {
    return this.data?.profiles || [];
  }

  public getActiveProfile(): UserProfile | null {
    if (!this.data?.activeProfileId) return null;
    return this.data.profiles.find(p => p.id === this.data!.activeProfileId) || null;
  }

  public getProfileById(id: string): UserProfile | null {
    return this.data?.profiles.find(p => p.id === id) || null;
  }

  public createProfile(
    gender: "male" | "female", 
    measurements: UserProfile['measurements']
  ): UserProfile {
    const id = `USER_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Generate unique name for multiple profiles
    const baseName = gender === 'female' ? 'Alice' : 'Bob';
    let profileName = baseName;
    let counter = 1;
    
    // Check for existing profiles with same name and increment counter
    while (this.data?.profiles.some(p => p.name === profileName && p.gender === gender)) {
      counter++;
      profileName = `${baseName} ${counter}`;
    }
    
    const newProfile: UserProfile = {
      id,
      name: profileName,
      gender,
      measurements,
      hairType: gender === 'male' ? 'hair2' : 'hair1',
      sizeRecommendations: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    if (!this.data) {
      this.data = {
        profiles: [],
        activeProfileId: null,
        lastUsed: new Date().toISOString()
      };
    }

    // Set all existing profiles as inactive
    this.data.profiles.forEach(p => p.isActive = false);
    
    // Add new profile and set as active
    this.data.profiles.push(newProfile);
    this.data.activeProfileId = id;
    
    this.saveData();
    
    // Emit event for product view
    this.emitProfileEvent('user_profile_created', newProfile);
    
    return newProfile;
  }

  public updateProfile(id: string, updates: Partial<UserProfile>): UserProfile | null {
    const profileIndex = this.data?.profiles.findIndex(p => p.id === id);
    if (profileIndex === undefined || profileIndex === -1) return null;

    const updatedProfile = {
      ...this.data!.profiles[profileIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.data!.profiles[profileIndex] = updatedProfile;
    this.saveData();
    
    // Emit event for product view
    this.emitProfileEvent('user_profile_updated', updatedProfile);
    
    return updatedProfile;
  }

  public setActiveProfile(id: string): boolean {
    if (!this.data) return false;
    
    const profileExists = this.data.profiles.some(p => p.id === id);
    if (!profileExists) return false;

    // Set all profiles as inactive
    this.data.profiles.forEach(p => p.isActive = false);
    
    // Set target profile as active
    const targetProfile = this.data.profiles.find(p => p.id === id);
    if (targetProfile) {
      targetProfile.isActive = true;
    }
    
    this.data.activeProfileId = id;
    this.saveData();
    return true;
  }

  public clearActiveProfile(): boolean {
    if (!this.data) return false;
    
    // Set all profiles as inactive
    this.data.profiles.forEach(p => p.isActive = false);
    
    // Clear active profile ID
    this.data.activeProfileId = null;
    this.saveData();
    
    // Dispatch update event
    const event = new CustomEvent('yoursizer-profile-updated', {
      detail: {
        profiles: this.data.profiles,
        activeProfileId: null
      }
    });
    window.dispatchEvent(event);
    
    return true;
  }

  public deleteProfile(id: string): boolean {
    if (!this.data) return false;
    
    const profileIndex = this.data.profiles.findIndex(p => p.id === id);
    if (profileIndex === -1) return false;

    this.data.profiles.splice(profileIndex, 1);
    
    // If deleted profile was active, clear the active profile ID
    if (this.data.activeProfileId === id) {
      this.data.activeProfileId = null;
      // Clear active flag from all remaining profiles
      this.data.profiles.forEach(p => p.isActive = false);
    }
    
    this.saveData();
    return true;
  }

  public updateProfileName(id: string, newName: string): boolean {
    const profile = this.getProfileById(id);
    if (!profile) return false;

    this.updateProfile(id, { name: newName.trim() });
    return true;
  }

  public hasActiveProfile(): boolean {
    return this.data?.activeProfileId !== null && this.data?.activeProfileId !== undefined;
  }

  public getProfileCount(): number {
    return this.data?.profiles.length || 0;
  }

  // Force refresh data from storage
  public refreshData(): void {
    this.data = null;
    this.loadData();
    // Dispatch event after refresh to notify components
    if (typeof window !== 'undefined') {
      // After loadData(), this.data is guaranteed to be initialized
      const currentData = this.data!; // Use non-null assertion
      window.dispatchEvent(new CustomEvent('yoursizer-profile-updated', {
        detail: { profiles: currentData.profiles, activeProfileId: currentData.activeProfileId }
      }));
    }
  }

  public clearAllData(): void {
    this.data = {
      profiles: [],
      activeProfileId: null,
      lastUsed: new Date().toISOString()
    };
    this.saveData();
    
    // Clear from both storage methods
    this.deleteCookie(COOKIE_NAME);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
    }
  }
}

export const profileService = ProfileService.getInstance();