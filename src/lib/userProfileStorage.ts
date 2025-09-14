// User Profile Interface
// UI data structures for profile management

export interface UserProfile {
  id: string;
  name: string;
  gender: "male" | "female";
  measurements: {
    height: string;
    weight: string;
    chest: string;
    waist: string;
    hips: string;
  };
  userAdjustedMeasurements?: {
    chest?: string;
    waist?: string;
    hips?: string;
    lastUpdated?: string;
  };
  skinColor?: string;
  hairType?: 'hair1' | 'hair2';
  modelState?: {
    morphValues: { [key: string]: number };
    hairMorphValues: { [key: string]: number };
    parameterValues: { [key: string]: number };
    skinColor: string;
    hairType: 'hair1' | 'hair2' | null;
    measurements: {
      height: string;
      weight: string;
      chest: string;
      waist: string;
      hips: string;
    };
  };
  sizeRecommendations: {
    [clothingType: string]: {
      size: string;
      confidence: number;
      timestamp: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface UserProfilesData {
  profiles: UserProfile[];
  activeProfileId: string | null;
  lastUsed: string;
}