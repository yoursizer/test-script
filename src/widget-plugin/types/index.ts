// Shared types for the sizing assistant application

export interface Measurements {
  height: string;
  weight: string;
  chest: string;
  waist: string;
  hips: string;
}

export type Gender = "male" | "female" | null;
export type Step = number;
