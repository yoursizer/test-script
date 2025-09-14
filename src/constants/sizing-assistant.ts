// Model URLs
export const MODEL_URLS = {
  male: "https://d2dipktybqm49f.cloudfront.net/male20-13-v2-15jun-2025.glb",
  female: "https://d2dipktybqm49f.cloudfront.net/female20-18-v1-v1-15jun-2025.glb"
} as const;

// Weight and measurement limits - updated from actual data analysis
export const WEIGHT_LIMITS = {
  min: 40,
  max: 150
} as const;

// Measurement limits - updated from actual data analysis (Combined Male & Female)
export const MEASUREMENT_LIMITS = {
  height: { min: 137, max: 210 },
  chest: { min: 61, max: 170.6 },
  waist: { min: 41.5, max: 154.5 },
  hips: { min: 81.1, max: 159.5 }
} as const;

// Allowed morph targets
export const ALLOWED_MORPH_TARGETS: string[] = [
  'height_200',
  'male_overweight',
  'male_skinny',
  'female_overweight',
  'Chest Width',
  'Hips Size',
  'Waist Thickness',
  'Shoulder Width',
  'Upperarm Length',
  'Forearm Length',
  'Shin Length',
  'Thigh Length',
  'Neck length',
  'Breast Size',
];

// Hair morph targets
export const ALLOWED_HAIR_MORPH_TARGETS: string[] = [
  'hair1', 'hair2', 'hair3',
  'hair1_length', 'hair2_length', 'hair3_length',
  'hair1_volume', 'hair2_volume', 'hair3_volume',
  'hair_style_1', 'hair_style_2', 'hair_style_3'
];

// Skin color options
export const SKIN_COLOR_OPTIONS = [
  { id: 1, color: '#F5E6D3', name: 'Skin 1', materialName: 'skin01' },
  { id: 4, color: '#8B6E44', name: 'Skin 4', materialName: 'skin04' },
  { id: 6, color: '#4C3824', name: 'Skin 6', materialName: 'skin06' }
] as const;

// Parameter controls
export const PARAMETER_CONTROLS = [
  { name: 'Wrinkles', default: 0, min: 0, max: 6, step: 0.01 },
  { name: 'Cavity Strength', default: 0, min: 0, max: 1.3, step: 0.01 },
  { name: 'Normal Strength', default: 1.0, min: 0, max: 4, step: 0.01 }
] as const;

// Unit conversion constants
export const UNIT_CONVERSION = {
  cmToFeet: 30.48,
  kgToLbs: 2.20462,
  inchesToCm: 2.54
} as const;

// Three.js scene configuration
export const SCENE_CONFIG = {
  backgroundColor: 0xf8f9fa,
  camera: {
    fov: 45,
    near: 0.1,
    far: 1000,
    position: [0, 1.7, 4] as [number, number, number]
  },
  renderer: {
    maxPixelRatio: 2,
    toneMappingExposure: 1
  },
  lighting: {
    ambient: {
      color: 0xfffff2,
      intensity: 1
    },
    directional: {
      color: 0xfffff2,
      main: {
        intensity: 1.1,
        position: [2, 3, 4] as [number, number, number]
      },
      back: {
        intensity: 0.6,
        position: [-2, 3, -4] as [number, number, number]
      },
      fill: {
        intensity: 0.4,
        position: [0, 2, -2] as [number, number, number]
      }
    }
  }
} as const;
// Model positioning - keep for 3D scene setup
export const MODEL_POSITIONING = {
  male: {
    xOffsetMultiplier: 0.05,
    yOffsetMultiplier: 0.05,
    rotationY: Math.PI * 0.15,
    zOffset: 0.2
  },
  female: {
    rotationY: Math.PI * 0.075,
    zOffset: 0.3
  },
  cameraDistanceMultiplier: 0.5
} as const;

// Size chart configuration - keep for size calculation
export const SIZE_CHART = {
  thresholds: {
    XS: 90,
    S: 95,
    M: 100,
    L: 105
    // XL: anything above 105
  },
  defaultSize: "M",
  baseConfidence: 85,
  sizes: ["XS", "S", "M", "L", "XL"]
};

// API and product configuration - keep for business logic
export const API_CONFIG = {
  defaultBrandName: 'generic',
  defaultProductId: 'generic_unknown-product',
  kayraBrandIdentifier: 'kayra',
  defaultClothingType: "upperwear",
  productsUrlPath: '/products/'
} as const;

// UI configuration - keep for interface
export const UI_CONFIG = {
  skinColorTagBlinkInterval: 2000,
  touchEventPassive: false,
  sizeOptionNames: ['Size', 'size', 'SIZE', 'Sizes', 'sizes']
} as const;