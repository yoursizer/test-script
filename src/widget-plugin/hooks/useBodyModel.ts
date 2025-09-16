import { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { 
  MODEL_URLS, 
  ALLOWED_MORPH_TARGETS, 
  ALLOWED_HAIR_MORPH_TARGETS,
  SKIN_COLOR_OPTIONS,
  WEIGHT_LIMITS,
  MEASUREMENT_LIMITS
} from '../constants/sizing-assistant';
import { calculateBodyMeasurements, calculateShapeKeys } from '../utils/bodyMeasurements';
import { Measurements, Gender } from '../types';


// Define interfaces for mesh data
interface HairMeshData {
  mesh: THREE.Mesh;
  index: number;
}

interface HairMeshMap {
  hair1: THREE.Mesh[];
  hair2: THREE.Mesh[];
  hair3: THREE.Mesh[];
}

// Define the hook parameters interface
interface UseBodyModelParams {
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  modelContainerRef: React.RefObject<HTMLDivElement>;
  gender: Gender;
  measurements: Measurements;
  step: number;
  isMobile: boolean;
  setIsModelLoading: (loading: boolean) => void;
  setModelError: (error: string | null) => void;
  selectedSkinColor: string | null;
  showSkinColorPanel: boolean;
  setSelectedSkinColor: (color: string | null) => void;
  setShowSkinColorPanel: (show: boolean) => void;
  setShowSkinColorTag: (show: boolean) => void;
  showHairPanel: boolean;
  selectedHair: 'hair1' | 'hair2' | null;
  setSelectedHair: (hair: 'hair1' | 'hair2' | null) => void;
  setShowHairTag: (show: boolean) => void;
  setDebugData?: (data: unknown) => void;
  isProfileSwitching?: boolean;
  currentProfile?: any; // UserProfile type
  isFastTrackMode?: boolean;
}

// Define the hook return interface
interface UseBodyModelReturn {
  modelRef: React.MutableRefObject<THREE.Group | null>;
  morphTargets: Map<string, { name: string; meshes: Array<{ mesh: THREE.Mesh; index: number }> }>;
  setMorphTargets: React.Dispatch<React.SetStateAction<Map<string, { name: string; meshes: Array<{ mesh: THREE.Mesh; index: number }> }>>>;
  morphValues: Map<string, number>;
  setMorphValues: React.Dispatch<React.SetStateAction<Map<string, number>>>;
  hairMorphTargets: Map<string, { name: string; meshes: HairMeshData[] }>;
  setHairMorphTargets: React.Dispatch<React.SetStateAction<Map<string, { name: string; meshes: HairMeshData[] }>>>;
  hairMorphValues: Map<string, number>;
  setHairMorphValues: React.Dispatch<React.SetStateAction<Map<string, number>>>;
  hairMeshMap: React.MutableRefObject<HairMeshMap>;
  handleSkinColorSelect: (color: string) => void;
  switchSkin: (name: string) => void;
  handleHairMorphChange: (morphName: string, value: number) => void;
  toggleHairSet: (set: 'hair1' | 'hair2') => void;
  handleMorphChange: (morphName: string, value: number) => void;
  handleMorphChangeFromSlider: (morphName: string, sliderValue: number, jsonValue: number, sliderMin: number, sliderMax: number, updatedMeasurements: Measurements) => any;
  calculateMorphRange: (jsonPositionPercent: number, measurementType?: 'chest' | 'waist' | 'hips') => { min: number; max: number; rangeBelow: number; rangeAbove: number; total: number };
  calculateMorphFromSliderPosition: (sliderPositionPercent: number, jsonPositionPercent: number, measurementType?: 'chest' | 'waist' | 'hips') => { morphValue: number; morphRange: { min: number; max: number }; isAtJSON: boolean };
  resetAllMorphs: () => void;
  applyMorphValues: (morphMap: Map<string, number>) => void;
  updateModelDimensions: (model: THREE.Group, measurements: Measurements) => void;
}

export function useBodyModel(params: UseBodyModelParams): UseBodyModelReturn {
  const {
    sceneRef,
    cameraRef,
    modelContainerRef,
    gender,
    measurements,
    step,
    isMobile,
    setIsModelLoading,
    setModelError,
    selectedSkinColor,
    setSelectedSkinColor,
    setShowSkinColorPanel,
    setShowSkinColorTag,
    setSelectedHair,
    setDebugData,
    isProfileSwitching,
    currentProfile,
    isFastTrackMode,
  } = params;

  // Refs for model and materials
  const modelRef = useRef<THREE.Group | null>(null);
  const skinMaterialMap = useRef<{ [key: string]: THREE.Material }>({});
  const skinTargetMesh = useRef<THREE.Mesh | null>(null);
  const skinTargetMaterialIndex = useRef<number>(-1);
  const hairMeshMap = useRef<HairMeshMap>({ hair1: [], hair2: [], hair3: [] });
  
  // Store pending morphs to apply after model loads
  const pendingMorphValues = useRef<Map<string, number> | null>(null);
  
  // Store pending skin color to apply after model loads
  const pendingSkinColor = useRef<string | null>(null);
  
  // Store pending profile to apply after model loads
  const pendingProfile = useRef<any | null>(null);

  // State for morph targets
  const [morphTargets, setMorphTargets] = useState<Map<string, { name: string; meshes: Array<{ mesh: THREE.Mesh; index: number }> }>>(new Map());
  const [morphValues, setMorphValues] = useState<Map<string, number>>(new Map());
  const [hairMorphTargets, setHairMorphTargets] = useState<Map<string, { name: string; meshes: HairMeshData[] }>>(new Map());
  const [hairMorphValues, setHairMorphValues] = useState<Map<string, number>>(new Map());

  // Cache for JSON data to prevent unnecessary fetches
  const jsonDataCache = useRef<{
    [key: string]: {
      height: number;
      weight: number;
      measurements: { chest: number; waist: number; hip: number };
    };
  }>({});

  // GLTF Model Loading Effect
  useEffect(() => {
    if (!gender || !sceneRef.current) return

    setIsModelLoading(true)
    setModelError(null)

    if (modelContainerRef.current) {
      modelContainerRef.current.style.opacity = '0.5'
    }

    const loader = new GLTFLoader()
    const modelPath = gender === 'male' ? MODEL_URLS.male : MODEL_URLS.female;
    

    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current)
      modelRef.current = null
    }

    loader.load(
      modelPath,
      (gltf) => {

        const model = gltf.scene
        modelRef.current = model

        // Reset skin material maps
        skinMaterialMap.current = {};
        skinTargetMesh.current = null;
        skinTargetMaterialIndex.current = -1;

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Log available morph targets for debugging
            if (child.morphTargetDictionary) {
              const heightTargets = Object.keys(child.morphTargetDictionary).filter(name => 
                name.includes('height') || name === 'height_200' || name === 'male_height' || name === 'female_height'
              );
              if (heightTargets.length > 0) {
              }
            }
            
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat, idx) => {
              const name = mat.name?.toLowerCase();
              if (name?.startsWith('skin')) {
                skinMaterialMap.current[name] = mat;
                if (name === 'skin01' && !skinTargetMesh.current) {
                  skinTargetMesh.current = child;
                  skinTargetMaterialIndex.current = Array.isArray(child.material) ? idx : -1;
                }
              }
            });
          }
        });

        // Set initial skin color
        switchSkin('skin01');

        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        if (gender === 'male') {
          model.position.x = -center.x - size.x * 0.05;
          model.position.y = -center.y + size.y * 0.05;
          model.rotation.x = 0;
        } else {
          model.position.x = -center.x;
          model.position.y = -center.y
        }

        if (gender === 'male') {
          model.rotation.y = Math.PI * 0.15;
        } else {
          model.rotation.y = Math.PI * 0.075;
        }

        if (gender === 'male') {
          model.position.z = -center.z + 0.2
        } else {
          model.position.z = -center.z + 0.3
        }

        const maxDim = Math.max(size.x, size.y, size.z)
        const fov = cameraRef.current!.fov * (Math.PI / 180)

        const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.5

        if (gender === 'male') {
          cameraRef.current!.position.set(0, size.y / 2, cameraDistance)
        } else {
          cameraRef.current!.position.set(0, size.y / 2, cameraDistance)
        }
        cameraRef.current!.lookAt(new THREE.Vector3(0, 0, 0))

        const morphTargetsMap = new Map()
        const hairMorphsMap = new Map()
        const tempHairMeshMap: HairMeshMap = { hair1: [], hair2: [], hair3: [] };

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mesh = child as THREE.Mesh & {
              morphTargetDictionary: { [key: string]: number };
              morphTargetInfluences: number[];
              material: THREE.Material | THREE.Material[];
            };

            if (mesh.morphTargetDictionary) {
              Object.entries(mesh.morphTargetDictionary).forEach(([name, index]) => {
                if (ALLOWED_MORPH_TARGETS.includes(name)) {
                  if (!morphTargetsMap.has(name)) {
                    morphTargetsMap.set(name, { name, meshes: [] })
                  }
                  morphTargetsMap.get(name).meshes.push({ mesh: mesh, index });
                }
              });
            }

            const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            if (material) {
              const matName = material.name.toLowerCase();
              
              // Hair mesh detection and grouping (EXACT OLD LOGIC)
              if (matName.includes('hair1')) {
                tempHairMeshMap.hair1.push(mesh);
              }
              if (matName.includes('hair2')) {
                tempHairMeshMap.hair2.push(mesh);
              }
              if (matName.includes('hair3')) {
                tempHairMeshMap.hair3.push(mesh);
              }

              // Remove chest-related morph targets from hair meshes
              if (matName.includes('hair1') || matName.includes('hair2') || matName.includes('hair3')) {
                if (mesh.morphTargetDictionary) {
                  const chestMorphTargets = ['Chest Width', 'Shoulder Width', 'Chest Height'];
                  chestMorphTargets.forEach(morphName => {
                    if (mesh.morphTargetDictionary[morphName] !== undefined) {
                      const index = mesh.morphTargetDictionary[morphName];
                      mesh.morphTargetInfluences[index] = 0;
                    }
                  });
                }
              }

              // Additional check for hair meshes by mesh name
              const meshName = mesh.name?.toLowerCase() || '';
              if (meshName.includes('hair1') || meshName.includes('hair2') || meshName.includes('hair3') ||
                meshName.includes('hair')) {
                if (mesh.morphTargetDictionary) {
                  const chestMorphTargets = ['Chest Width', 'Shoulder Width', 'Chest Height'];
                  chestMorphTargets.forEach(morphName => {
                    if (mesh.morphTargetDictionary[morphName] !== undefined) {
                      const index = mesh.morphTargetDictionary[morphName];
                      mesh.morphTargetInfluences[index] = 0;
                    }
                  });
                }
              }

              // Hair morph target discovery
              if (mesh.morphTargetDictionary) {
                Object.entries(mesh.morphTargetDictionary).forEach(([name, index]) => {
                  if (ALLOWED_HAIR_MORPH_TARGETS.includes(name)) {
                    if (!hairMorphsMap.has(name)) {
                      hairMorphsMap.set(name, { name, meshes: [] });
                    }
                    hairMorphsMap.get(name).meshes.push({ mesh, index });
                  }
                });
              }
            }
          }
        });
        

        setMorphTargets(morphTargetsMap);
        setHairMorphTargets(hairMorphsMap);
        hairMeshMap.current = tempHairMeshMap;

        // Calculate and apply initial morphs based on default measurements
        // Skip default morphs if we have pending profile morphs to apply
        const initialMorphValues = new Map<string, number>();
        const hasPendingProfileMorphs = pendingMorphValues.current !== null;
        
        if (!hasPendingProfileMorphs) {
          try {
            // Use profile values in fast track mode, otherwise use defaults
            let defaultHeight, defaultWeight;
            if (isFastTrackMode && currentProfile?.measurements) {
              defaultHeight = parseFloat(currentProfile.measurements.height) || (gender === 'male' ? 175 : 165);
              defaultWeight = parseFloat(currentProfile.measurements.weight) || (gender === 'male' ? 70 : 60);
            } else {
              defaultHeight = gender === 'male' ? 175 : 165;
              defaultWeight = gender === 'male' ? 70 : 60;
            }
            const jsonMeasurements = calculateBodyMeasurements(defaultHeight, defaultWeight, gender);
          
          if (jsonMeasurements) {
            const initialShapeKeys = calculateShapeKeys(
              defaultHeight,
              defaultWeight,
              jsonMeasurements.chest,
              jsonMeasurements.waist,
              jsonMeasurements.hips,
              gender
            );

            if (initialShapeKeys) {
              
              // Map shape keys to morph target names
              const shapeKeyToMorphMap: { [key: string]: string } = {
                boy: 'height_200',
                kilo: gender === 'male' ? 'male_overweight' : 'female_overweight',
                chest: 'Chest Width',
                waist: 'Waist Thickness',
                hips: 'Hips Size',
                // Breast Size is handled separately for females
              };

              // Apply calculated morphs
              for (const [key, morphName] of Object.entries(shapeKeyToMorphMap)) {
                if (initialShapeKeys[key as keyof typeof initialShapeKeys] !== undefined) {
                  const value = initialShapeKeys[key as keyof typeof initialShapeKeys]!;
                  initialMorphValues.set(morphName, value);
                }
              }
            }
          }
          } catch (error) {
          }

          // Set default breast size for females
          if (gender === 'female') {
              initialMorphValues.set('Breast Size', 0.5);
          } else {  
              initialMorphValues.set('Breast Size', 0);
          }
        } else {
        }
        // Apply all initial morphs to the model
        initialMorphValues.forEach((value, name) => {
          const morphData = morphTargetsMap.get(name);
          if (morphData) {
            morphData.meshes.forEach(({ mesh, index }: { mesh: THREE.Mesh; index: number }) => {
              const typedMesh = mesh as THREE.Mesh & { morphTargetInfluences: number[] };
              if (typedMesh.morphTargetInfluences) {
                typedMesh.morphTargetInfluences[index] = value;
              }
            });
          }
        });

        // Update the state with all initial morphs at once
        setMorphValues(prev => new Map([...Array.from(prev.entries()), ...Array.from(initialMorphValues.entries())]));

        // EXACT OLD LOGIC: Auto-select first available hair set
        if (hairMorphsMap.size > 0 || tempHairMeshMap.hair1.length > 0 || tempHairMeshMap.hair2.length > 0) {
          // Find the first available hair set
          let firstAvailableHair = 'hair1';
          if (tempHairMeshMap.hair1.length > 0) {
            firstAvailableHair = 'hair1';
          } else if (tempHairMeshMap.hair2.length > 0) {
            firstAvailableHair = 'hair2';
          }
          
          // Directly set the first available hair visible like the old implementation
          Object.entries(tempHairMeshMap).forEach(([key, list]: [string, THREE.Mesh[]]) => {
            const show = key === firstAvailableHair;
            list.forEach(mesh => { if (mesh) mesh.visible = show; });
          });
          setSelectedHair(firstAvailableHair as 'hair1' | 'hair2');
        } else {
          setSelectedHair(null);
        }

        if (sceneRef.current) {
          sceneRef.current.add(model)
          
          // Debug model bounds
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
        } else {
        }

        if (modelContainerRef.current) {
          modelContainerRef.current.style.opacity = '1'
        }

        setIsModelLoading(false)
        
        // Apply initial measurements after model is loaded (skip if we have pending profile morphs)
        if (!pendingMorphValues.current) {
          updateModelDimensions(model, measurements);
        } else {
        }
        
        // Apply any pending profile morphs after model is loaded
        if (pendingMorphValues.current) {
          const pendingMorphs = pendingMorphValues.current;
          
          // Apply morphs directly using the local morphTargetsMap (don't wait for state update)
          let appliedCount = 0;
          pendingMorphs.forEach((value, morphName) => {
            const morphData = morphTargetsMap.get(morphName);
            if (morphData) {
              // Apply to all meshes for this morph
              morphData.meshes.forEach(({ mesh, index }: { mesh: THREE.Mesh; index: number }) => {
                const typedMesh = mesh as THREE.Mesh & { morphTargetInfluences: number[] };
                if (typedMesh.morphTargetInfluences) {
                  typedMesh.morphTargetInfluences[index] = value;
                  appliedCount++;
                }
              });
            } else {
            }
          });
          
          // Update state with applied morph values
          setMorphValues(new Map([...pendingMorphs]));
          
          // Clear pending morphs
          pendingMorphValues.current = null;
        }
        
        // Apply any pending skin color after model is loaded
        if (pendingSkinColor.current) {
          const color = pendingSkinColor.current;
          
          // Find the selected skin option
          const selectedOption = SKIN_COLOR_OPTIONS.find(opt => opt.color === color);
          if (selectedOption) {
            // Switch to the corresponding skin material
            switchSkin(selectedOption.materialName);
          }
          
          // Clear pending skin color
          pendingSkinColor.current = null;
        }
        
        // Apply any pending profile after model is loaded
        if (pendingProfile.current) {
          const profile = pendingProfile.current;
          
          // Apply profile measurements by calling updateModelDimensions
          // This will apply ALL morphs (height, weight, chest, waist, hips) from the profile
          updateModelDimensions(model, profile.measurements);
          
          // Apply profile morphs if stored
          // @ts-ignore - morphValues property may not exist in UserProfile type  
          if (profile.morphValues && typeof profile.morphValues === 'object') {
            const morphMap = new Map<string, number>();
            // @ts-ignore - morphValues property may not exist in UserProfile type
            Object.entries(profile.morphValues).forEach(([key, value]) => {
              if (typeof value === 'number') {
                morphMap.set(key, value);
              }
            });
            if (morphMap.size > 0) {
              setMorphValues(morphMap);
              
              // Apply morphs to model using the local morphTargetsMap
              morphMap.forEach((value, morphName) => {
                const morphData = morphTargetsMap.get(morphName);
                if (morphData) {
                  morphData.meshes.forEach(({ mesh, index }: { mesh: THREE.Mesh; index: number }) => {
                    const typedMesh = mesh as THREE.Mesh & { morphTargetInfluences: number[] };
                    if (typedMesh.morphTargetInfluences) {
                      typedMesh.morphTargetInfluences[index] = value;
                    }
                  });
                }
              });
            }
          }
          
          // Clear pending profile
          pendingProfile.current = null;
        }
      },
      (xhr: ProgressEvent<EventTarget>) => {
        // Progress tracking can be implemented here if needed
      },
      (error: unknown) => {
        setModelError('Failed to load 3D model. Please check your connection and try again.');
        setIsModelLoading(false);
        if (modelContainerRef.current) {
          modelContainerRef.current.style.opacity = '1';
        }
      }
    )
    return () => {
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current)
        modelRef.current = null
      }
    }
  }, [gender])



  // Skin color functions
  const handleSkinColorSelect = (color: string) => {
    setSelectedSkinColor(color);
    setShowSkinColorPanel(false);
    setShowSkinColorTag(false);

    // Find the selected skin option
    const selectedOption = SKIN_COLOR_OPTIONS.find(opt => opt.color === color);
    if (!selectedOption) return;

    // Check if skin materials are ready (model loaded)
    if (!skinTargetMesh.current || Object.keys(skinMaterialMap.current).length === 0) {
      pendingSkinColor.current = color;
      return;
    }

    // Switch to the corresponding skin material
    switchSkin(selectedOption.materialName);
  };

  const switchSkin = (name: string) => {
    if (!skinTargetMesh.current || !skinMaterialMap.current[name]) return;

    const newMat = skinMaterialMap.current[name];
    if (Array.isArray(skinTargetMesh.current.material)) {
      if (skinTargetMaterialIndex.current !== -1) {
        skinTargetMesh.current.material[skinTargetMaterialIndex.current] = newMat;
        (skinTargetMesh.current.material as THREE.Material[]).forEach(mat => mat.needsUpdate = true);
      }
    } else {
      skinTargetMesh.current.material = newMat;
      (skinTargetMesh.current.material as THREE.Material).needsUpdate = true;
    }
  };

  const handleHairMorphChange = (morphName: string, value: number) => {
    const hairMorphData = hairMorphTargets.get(morphName);
    if (!hairMorphData) return;

    value = Math.min(Math.max(value, 0), 1);

    // Only apply morph changes to meshes that are currently visible
    hairMorphData.meshes.forEach(({ mesh, index }) => {
      if (mesh && mesh.morphTargetInfluences && mesh.visible) {
        mesh.morphTargetInfluences[index] = value;
      }
    });

    setHairMorphValues(prev => new Map(prev).set(morphName, value));
  };

  const toggleHairSet = (set: 'hair1' | 'hair2') => {
    Object.entries(hairMeshMap.current).forEach(([key, list]: [string, THREE.Mesh[]]) => {
      const show = key === set;
      list.forEach(mesh => { if (mesh) mesh.visible = show; });
    });
    setSelectedHair(set);
  };

  // Helper function to calculate morph value from measurement using JSON data
  const calculateMorphValueFromMeasurement = (measurementValue: number, measurementType?: 'chest' | 'waist' | 'hips', gender: 'male' | 'female' = 'male', height: number = 175, weight: number = 70, currentMeasurements?: Measurements): number => {
    if (!measurementType) return 0;
    
    try {
      // Use the same JSON calculation as updateModelDimensions
      const chest = measurementType === 'chest' ? measurementValue : (currentMeasurements?.chest ? parseFloat(currentMeasurements.chest) : (gender === 'male' ? 100 : 95));
      const waist = measurementType === 'waist' ? measurementValue : (currentMeasurements?.waist ? parseFloat(currentMeasurements.waist) : (gender === 'male' ? 85 : 80));
      const hips = measurementType === 'hips' ? measurementValue : (currentMeasurements?.hips ? parseFloat(currentMeasurements.hips) : (gender === 'male' ? 95 : 100));

      const shapeKeys = calculateShapeKeys(height, weight, 
        chest,
        waist, 
        hips,
        gender
      );
      
      if (shapeKeys) {
        if (measurementType === 'chest') return shapeKeys.chest;
        if (measurementType === 'waist') return shapeKeys.waist; 
        if (measurementType === 'hips') return shapeKeys.hips;
      }
    } catch (error) {
    }
    
    return 0;
  };

  // 1.4 Morph Logic Functions
  const calculateMorphRange = (jsonPositionPercent: number, measurementType?: 'chest' | 'waist' | 'hips', jsonMorphValue: number = 0) => {
    // Separate morph ranges for each measurement type
    const MORPH_RANGES = {
      chest: 1,
      waist: 1,
      hips: 1,
      default: 1 // For backward compatibility with non-body measurements
    };
    
    const TOTAL_MORPH_RANGE = measurementType ? MORPH_RANGES[measurementType] : MORPH_RANGES.default;
    
    // Calculate how much range to distribute below and above JSON position
    const rangeBelow = TOTAL_MORPH_RANGE * jsonPositionPercent;
    const rangeAbove = TOTAL_MORPH_RANGE * (1 - jsonPositionPercent);
    
    // JSON morph value is the baseline, add range around it
    const morphMin = jsonMorphValue - rangeBelow;
    const morphMax = jsonMorphValue + rangeAbove;
    
    return { 
      min: morphMin, 
      max: morphMax, 
      rangeBelow, 
      rangeAbove,
      total: morphMax - morphMin
    };
  };

  const calculateMorphFromSliderPosition = (sliderPositionPercent: number, jsonPositionPercent: number, measurementType?: 'chest' | 'waist' | 'hips', jsonMorphValue: number = 0) => {
    const morphRange = calculateMorphRange(jsonPositionPercent, measurementType, jsonMorphValue);
    
    // Convert slider position to morph value
    const morphValue = morphRange.min + (sliderPositionPercent * (morphRange.max - morphRange.min));
    
    return {
      morphValue,
      morphRange,
      isAtJSON: Math.abs(sliderPositionPercent - jsonPositionPercent) < 0.001
    };
  };

  // Enhanced morph change with slider position support
  const handleMorphChangeFromSlider = (
    morphName: string, 
    sliderValue: number, 
    jsonValue: number, 
    sliderMin: number, 
    sliderMax: number,
    updatedMeasurements: Measurements
  ) => {
    console.log(`🔄 handleMorphChangeFromSlider called: ${morphName}, morphTargets.size: ${morphTargets.size}`);
    const morphData = morphTargets.get(morphName);
    if (!morphData) {
      console.log(`❌ No morph data found for: ${morphName}, available keys:`, Array.from(morphTargets.keys()));
      return;
    }

    // Calculate positions
    const sliderRange = sliderMax - sliderMin;
    const sliderPositionPercent = (sliderValue - sliderMin) / sliderRange;
    const jsonPositionPercent = (jsonValue - sliderMin) / sliderRange;
    
    // Detect measurement type from morph name
    let measurementType: 'chest' | 'waist' | 'hips' | undefined;
    if (morphName === 'Chest Width') measurementType = 'chest';
    else if (morphName === 'Waist Thickness') measurementType = 'waist';
    else if (morphName === 'Hips Size') measurementType = 'hips';
    
    // Calculate JSON morph value from measurement using JSON data
    const height = parseFloat(updatedMeasurements.height) || 175;
    const weight = parseFloat(updatedMeasurements.weight) || 70;
    const jsonMorphValue = calculateMorphValueFromMeasurement(jsonValue, measurementType, gender || 'male', height, weight, updatedMeasurements);
    
    // Calculate morph value using 0.72 logic for body measurements  
    const result = calculateMorphFromSliderPosition(sliderPositionPercent, jsonPositionPercent, measurementType, jsonMorphValue);
    const morphValue = result.morphValue;
    

    // Apply morph value to all meshes
    morphData.meshes.forEach(({ mesh, index }) => {
      const typedMesh = mesh as THREE.Mesh & {
        morphTargetInfluences: number[];
      };
      typedMesh.morphTargetInfluences[index] = morphValue;
    });

    setMorphValues(prev => new Map(prev).set(morphName, morphValue));

    // Return result for debugging
    return {
      morphValue,
      sliderPositionPercent: sliderPositionPercent * 100,
      jsonPositionPercent: jsonPositionPercent * 100,
      morphRange: result.morphRange
    };
  };

  const handleMorphChange = (morphName: string, value: number) => {

    const morphData = morphTargets.get(morphName);
    if (!morphData) {

      return;
    }

    value = Math.min(Math.max(value, -2), 3);

    morphData.meshes.forEach(({ mesh, index }) => {
      const typedMesh = mesh as THREE.Mesh & {
        morphTargetInfluences: number[];
      };
      typedMesh.morphTargetInfluences[index] = value;
    });

    setMorphValues(prev => new Map(prev).set(morphName, value));

    if (morphName === 'male_overweight') {
      const skinnyData = morphTargets.get('male_skinny');
      if (skinnyData) {
        skinnyData.meshes.forEach(({ mesh, index }) => {
          const typedMesh = mesh as THREE.Mesh & {
            morphTargetInfluences: number[];
          };
          typedMesh.morphTargetInfluences[index] = -value;
        });
      }
    }
  };

  const resetAllMorphs = () => {
    morphTargets.forEach((morphData) => {
      morphData.meshes.forEach(({ mesh, index }) => {
        if (mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[index] = 0;
        }
      });
    });
    setMorphValues(new Map());

    hairMorphTargets.forEach((_, morphName) => {
      handleHairMorphChange(morphName, 0);
    });
    setHairMorphValues(new Map());
  };

  // Apply multiple morph values from a Map (used for profile loading)
  const applyMorphValues = useCallback((morphMap: Map<string, number>) => {
    if (!morphMap || morphMap.size === 0) {
      return;
    }

    // Check if morphTargets are ready (model loaded)
    if (morphTargets.size === 0) {
      pendingMorphValues.current = morphMap;
      return;
    }

    let appliedCount = 0;
    
    morphMap.forEach((value, morphName) => {
      const morphData = morphTargets.get(morphName);
      if (morphData) {
        // Apply to all meshes for this morph
        morphData.meshes.forEach(({ mesh, index }) => {
          const typedMesh = mesh as THREE.Mesh & { morphTargetInfluences: number[] };
          if (typedMesh.morphTargetInfluences) {
            typedMesh.morphTargetInfluences[index] = value;
            appliedCount++;
          }
        });
      } else {
      }
    });

    // Update state with applied morph values
    setMorphValues(prev => new Map([...prev, ...morphMap]));
    
    // Clear pending morphs since they were applied
    pendingMorphValues.current = null;
  }, [morphTargets]);

  const updateModelDimensions = useCallback(async (model: THREE.Group, measurements: Measurements) => {
    // Parse measurements - no defaults, must be provided
    const height = measurements.height && !isNaN(parseFloat(measurements.height))
      ? parseFloat(measurements.height)
      : null;
    const weight = measurements.weight && !isNaN(parseFloat(measurements.weight))
      ? parseFloat(measurements.weight)
      : null;
    const chest = measurements.chest && !isNaN(parseFloat(measurements.chest))
      ? parseFloat(measurements.chest)
      : null;
    const waist = measurements.waist && !isNaN(parseFloat(measurements.waist))
      ? parseFloat(measurements.waist)
      : null;
    const hips = measurements.hips && !isNaN(parseFloat(measurements.hips))
      ? parseFloat(measurements.hips)
      : null;

    // Early return if measurements are incomplete
    if (!height || !weight) {
      return;
    }

    const clampedHeight = Math.min(Math.max(height, MEASUREMENT_LIMITS.height.min), MEASUREMENT_LIMITS.height.max);
    const clampedWeight = Math.min(Math.max(weight, WEIGHT_LIMITS.min), WEIGHT_LIMITS.max);

    // Get JSON base values - no hardcoded fallbacks
    let jsonBaseChest: number | null = null;
    let jsonBaseWaist: number | null = null;
    let jsonBaseHips: number | null = null;

    if (gender && !isNaN(height) && !isNaN(weight)) {
      // Check cache first
      const cacheKey = `${height}_${weight}`;
      let jsonMeasurements = jsonDataCache.current[cacheKey]?.measurements;
      
      if (!jsonMeasurements) {
        const fetchedData = calculateBodyMeasurements(height, weight, gender);
        if (fetchedData) {
          // Convert to expected format
          jsonMeasurements = {
            chest: fetchedData.chest,
            waist: fetchedData.waist,
            hip: fetchedData.hips
          };
          jsonDataCache.current[cacheKey] = {
            height,
            weight,
            measurements: jsonMeasurements
          };
        }
      }
      
      if (jsonMeasurements) {
        jsonBaseChest = jsonMeasurements.chest;
        jsonBaseWaist = jsonMeasurements.waist;
        jsonBaseHips = jsonMeasurements.hip;
        
                
        // Update debug data with fetched JSON information
        if (setDebugData) {
          setDebugData((prevData: any) => ({
            ...prevData,
            fetchedData: jsonMeasurements,
            limits: {
              chest: { min: jsonMeasurements.chest - 6, max: jsonMeasurements.chest + 6, base: jsonMeasurements.chest },
              waist: { min: jsonMeasurements.waist - 6, max: jsonMeasurements.waist + 6, base: jsonMeasurements.waist },
              hips: { min: jsonMeasurements.hip - 6, max: jsonMeasurements.hip + 6, base: jsonMeasurements.hip }
            },
            lastFetchedAt: new Date().toISOString(),
            cacheKey: `${height}_${weight}`
          }));
        }
      }
    }

    // Only proceed if we have JSON base values
    if (!jsonBaseChest || !jsonBaseWaist || !jsonBaseHips) {
      return;
    }

    // Use JSON base values with ±6 range
    const chestMin = jsonBaseChest - 6;
    const chestMax = jsonBaseChest + 6;
    const waistMin = jsonBaseWaist - 6;
    const waistMax = jsonBaseWaist + 6;
    const hipsMin = jsonBaseHips - 6;
    const hipsMax = jsonBaseHips + 6;

    // Clamp body measurements if provided, otherwise use JSON defaults
    const clampedChest = chest ? Math.min(Math.max(chest, chestMin), chestMax) : jsonBaseChest;
    const clampedWaist = waist ? Math.min(Math.max(waist, waistMin), waistMax) : jsonBaseWaist;
    const clampedHips = hips ? Math.min(Math.max(hips, hipsMin), hipsMax) : jsonBaseHips;

    // Use JSON shape keys for all measurements instead of manual normalization
    if (height && weight && clampedChest && clampedWaist && clampedHips) {
      try {
        const shapeKeys = calculateShapeKeys(clampedHeight, clampedWeight, clampedChest, clampedWaist, clampedHips, gender || 'male');
        
        if (shapeKeys) {
          // Apply shape keys from JSON data
          morphTargets.forEach((morphData, morphName) => {
            morphData.meshes.forEach(({ mesh, index }) => {
              const typedMesh = mesh as THREE.Mesh & { morphTargetInfluences: number[] };
              
              // Apply morphs when we have valid measurements (including defaults from JSON)
              const applyHeight = height && !isNaN(height);
              const applyWeight = weight && !isNaN(weight);
              const applyChest = clampedChest && !isNaN(clampedChest);
              const applyWaist = !isNaN(clampedWaist);
              const applyHips = !isNaN(clampedHips);

              if (morphName === 'height_200' && applyHeight && shapeKeys.boy !== undefined) {
                // DEBUG: Test male height morph isolation
                const debugMorphValue = gender === 'male' ? shapeKeys.boy : shapeKeys.boy;
                typedMesh.morphTargetInfluences[index] = debugMorphValue;
              } else if (morphName === 'male_overweight' && applyWeight && shapeKeys.kilo !== undefined) {
                typedMesh.morphTargetInfluences[index] = shapeKeys.kilo;
              } else if (morphName === 'female_overweight' && applyWeight && shapeKeys.kilo !== undefined) {
                typedMesh.morphTargetInfluences[index] = shapeKeys.kilo;
              // ENABLED for height/weight changes: Apply chest/waist/hips when JSON baseline changes  
              // This only triggers when height/weight changes (not when chest/waist/hips change)
              } else if (morphName === 'Chest Width' && applyChest && shapeKeys.chest !== undefined) {
                typedMesh.morphTargetInfluences[index] = shapeKeys.chest;
              } else if (morphName === 'Waist Thickness' && applyWaist && shapeKeys.waist !== undefined) {
                typedMesh.morphTargetInfluences[index] = shapeKeys.waist;
              } else if (morphName === 'Hips Size' && applyHips && shapeKeys.hips !== undefined) {
                typedMesh.morphTargetInfluences[index] = shapeKeys.hips;
              }
            });
          });
          
          // Update morph values state
          setMorphValues(prev => {
            const newMap = new Map(prev);
            if (shapeKeys.boy !== undefined) {
              newMap.set('height_200', shapeKeys.boy);
            }
            if (shapeKeys.kilo !== undefined) {
              newMap.set(gender === 'female' ? 'female_overweight' : 'male_overweight', shapeKeys.kilo);
            }
            // ENABLED for height/weight changes: Update chest/waist/hips when JSON baseline changes
            // This only triggers when height/weight changes (not when chest/waist/hips change)
            if (shapeKeys.chest !== undefined) {
              newMap.set('Chest Width', shapeKeys.chest);
            }
            if (shapeKeys.waist !== undefined) {
              newMap.set('Waist Thickness', shapeKeys.waist);
            }
            if (shapeKeys.hips !== undefined) {
              newMap.set('Hips Size', shapeKeys.hips);
            }
            return newMap;
          });
        }
      } catch (error) {
      }
    } else {
    }
    
    // Update debug data with current measurements
    if (setDebugData) {
      setDebugData((prevData: any) => ({
        ...prevData,
        currentMeasurements: {
          height: clampedHeight,
          weight: clampedWeight,
          chest: clampedChest,
          waist: clampedWaist,
          hips: clampedHips
        },
        baseValues: {
          chest: jsonBaseChest,
          waist: jsonBaseWaist,
          hips: jsonBaseHips
        },
        lastUpdatedAt: new Date().toISOString()
      }));
    }
  }, [gender, measurements.height, measurements.weight, morphTargets, setDebugData]); // Only height/weight dependencies

  // Profile switching effect - Apply all morphs when switching profiles
  useEffect(() => {
   
    if (isProfileSwitching && currentProfile) {
      if (modelRef.current) {
        
        // Apply profile measurements by calling updateModelDimensions
        // This will apply ALL morphs (height, weight, chest, waist, hips) from the profile
        updateModelDimensions(modelRef.current, currentProfile.measurements);
        
        // Apply profile morphs if stored
        // @ts-ignore - morphValues property may not exist in UserProfile type  
        if (currentProfile.morphValues && typeof currentProfile.morphValues === 'object') {
          const morphMap = new Map<string, number>();
          // @ts-ignore - morphValues property may not exist in UserProfile type
          Object.entries(currentProfile.morphValues).forEach(([key, value]) => {
            if (typeof value === 'number') {
              morphMap.set(key, value);
            }
          });
          if (morphMap.size > 0) {
            setMorphValues(morphMap);
            
            // Apply morphs to model
            morphMap.forEach((value, morphName) => {
              const morphData = morphTargets.get(morphName);
              if (morphData) {
                morphData.meshes.forEach(({ mesh, index }) => {
                  const typedMesh = mesh as THREE.Mesh & { morphTargetInfluences: number[] };
                  if (typedMesh.morphTargetInfluences) {
                    typedMesh.morphTargetInfluences[index] = value;
                  }
                });
              }
            });
          }
        }
      } else {
        // Model not loaded yet, store profile for later application
        pendingProfile.current = currentProfile;
      }
    }
  }, [isProfileSwitching, currentProfile, updateModelDimensions, morphTargets, setMorphValues]);

  return {
    modelRef,
    morphTargets,
    setMorphTargets,
    morphValues,
    setMorphValues,
    hairMorphTargets,
    setHairMorphTargets,
    hairMorphValues,
    setHairMorphValues,
    hairMeshMap,
    handleSkinColorSelect,
    switchSkin,
    handleHairMorphChange,
    toggleHairSet,
    handleMorphChange,
    handleMorphChangeFromSlider,
    calculateMorphRange,
    calculateMorphFromSliderPosition,
    resetAllMorphs,
    applyMorphValues,
    updateModelDimensions
  };
}