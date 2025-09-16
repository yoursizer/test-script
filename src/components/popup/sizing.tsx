import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { X, Info, ArrowRight, ArrowLeft, Upload, Settings, Palette, Brush } from "lucide-react"
import { MeasurementGuide } from "./measurment"
import { RadialHeightSlider } from "./RadialHeightSlider"
import { RadialWeightSlider } from "./RadialWeightSlider"
import { RadialChestSlider } from "./RadialChestSlider"
import { RadialWaistSlider } from "./RadialWaistSlider"
import { RadialHipsSlider } from "./RadialHipsSlider"
import { useSizeRecommendation } from "../../hooks/useSizeRecommendation"

const maleModelUrl = "https://d2dipktybqm49f.cloudfront.net/male20-13-v2-15jun-2025.glb";
const femaleModelUrl = "https://d2dipktybqm49f.cloudfront.net/female20-18-v1-v1-15jun-2025.glb";

interface SizingAssistantProps {
  onClose: () => void
  onSizeRecommended: (size: string) => void
  productId?: string;
  licenseStatus: { isValid: boolean; message?: string } | null;
  licenseKey: string;
}

export function SizingAssistant({ onClose, onSizeRecommended, productId, licenseStatus, licenseKey }: SizingAssistantProps) {
  const [step, setStep] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [gender, setGender] = useState<"male" | "female" | null>(null)
  const [useMetric, setUseMetric] = useState(true)
  const [measurements, setMeasurements] = useState({
    height: "170",
    weight: "75",
    chest: "100",
    waist: "85",
    hips: "95"
  })
  const [fitPreference, setFitPreference] = useState<"slim" | "regular" | "relaxed">("regular")
  const [showMeasurementGuide, setShowMeasurementGuide] = useState<"chest" | "waist" | "hips" | null>(null)
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [showSkinColorTag, setShowSkinColorTag] = useState(true)
  const [showSkinColorPanel, setShowSkinColorPanel] = useState(false)
  const [selectedSkinColor, setSelectedSkinColor] = useState<string | null>(null)
  const [hasTrackedRecommendation, setHasTrackedRecommendation] = useState(false);

  // API-based size recommendation
  const { getSizeRecommendation, isLoading: isApiLoading, error: apiError } = useSizeRecommendation();
  const [apiSizeResult, setApiSizeResult] = useState<{ size: string; confidence: number; method?: string } | null>(null);
  const [useApiRecommendation, setUseApiRecommendation] = useState(true);

  const [morphTargets, setMorphTargets] = useState<Map<string, { name: string; meshes: Array<{ mesh: THREE.Mesh; index: number }> }>>(new Map())
  const [morphValues, setMorphValues] = useState<Map<string, number>>(new Map())
  const [parameterValues, setParameterValues] = useState<Map<string, number>>(new Map())

  const prevStepRef = useRef<number>(0);

  const modelContainerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)

  // Hair feature state
  const [showHairTag, setShowHairTag] = useState(true);
  const [showHairPanel, setShowHairPanel] = useState(false);
  const [selectedHair, setSelectedHair] = useState<'hair1' | 'hair2' | null>(null);
  const [hairMorphTargets, setHairMorphTargets] = useState<Map<string, { name: string; meshes: any[] }>>(new Map());
  const [hairMorphValues, setHairMorphValues] = useState<Map<string, number>>(new Map());
  const hairMeshMap = useRef<{ hair1: any[], hair2: any[], hair3: any[] }>({ hair1: [], hair2: [], hair3: [] });

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const preventTouchMove = (e: TouchEvent) => {
      // Allow touch events on input elements (sliders, number inputs)
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.closest('input'))) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;

      window.scrollTo(0, scrollY);

      document.removeEventListener('touchmove', preventTouchMove);
    };
  }, []);

  // const logShopifyData = () => {
  //   if (process.env.NODE_ENV !== 'production') {
  //     console.log('Shopify data:', (window as any).Shopify);
  //   }
  // }

  const allowedMorphTargets = [
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
    'Brest size',
    'Belly Size'
  ];

  const allowedHairMorphTargets = [
    'hair1', 'hair2', 'hair3',
    'hair1_length', 'hair2_length', 'hair3_length',
    'hair1_volume', 'hair2_volume', 'hair3_volume',
    'hair_style_1', 'hair_style_2', 'hair_style_3'
  ];

  const WEIGHT_LIMITS = {
    min: 40,
    max: 150,
    default: 75
  }

  const MEASUREMENT_LIMITS = {
    height: { min: 140, max: 210, default: 170 },
    chest: { min: 58, max: 140, default: 100 },
    waist: { min: 43, max: 134, default: 85 },
    hips: { min: 73, max: 137, default: 95 }
  }

  const parameterControls = [
    { name: 'Wrinkles', default: 0, min: 0, max: 6, step: 0.01 },
    { name: 'Cavity Strength', default: 0, min: 0, max: 1.3, step: 0.01 },
    { name: 'Normal Strength', default: 1.0, min: 0, max: 4, step: 0.01 }
  ]

  const cmToFeet = (cm: number) => {
    const feet = cm / 30.48
    const wholeFeet = Math.floor(feet)
    const inches = Math.round((feet - wholeFeet) * 12)
    return `${wholeFeet}'${inches}"`
  }

  const kgToLbs = (kg: number) => {
    return Math.round(kg * 2.20462)
  }

  const lbsToKg = (lbs: number) => {
    return Math.round(lbs / 2.20462)
  }

  const feetToCm = (feet: string) => {
    const [ft, inches] = feet.split("'")
    const totalInches = parseInt(ft) * 12 + parseInt(inches)
    return Math.round(totalInches * 2.54)
  }

  const skinColorOptions = [
    { id: 1, color: '#F5E6D3', name: 'Skin 1', materialName: 'skin01' },
    // { id: 2, color: '#E6C9A8', name: 'Skin 2', materialName: 'skin02' },
    // { id: 3, color: '#C4A97E', name: 'Skin 3', materialName: 'skin03' },
    { id: 4, color: '#8B6E44', name: 'Skin 4', materialName: 'skin04' },
    // { id: 5, color: '#6B4E31', name: 'Skin 5', materialName: 'skin05' },
    { id: 6, color: '#4C3824', name: 'Skin 6', materialName: 'skin06' },
    // { id: 7, color: '#3C2E1C', name: 'Skin 7', materialName: 'skin07' }
  ];

  // Add skin material map
  const skinMaterialMap = useRef<{ [key: string]: THREE.Material }>({});
  const skinTargetMesh = useRef<THREE.Mesh | null>(null);
  const skinTargetMaterialIndex = useRef<number>(-1);

  useEffect(() => {
    if (!selectedSkinColor && !showSkinColorPanel) {
      const interval = setInterval(() => {
        setShowSkinColorTag(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedSkinColor, showSkinColorPanel]);

  // Update handleSkinColorSelect to handle material changes
  const handleSkinColorSelect = (color: string) => {
    setSelectedSkinColor(color);
    setShowSkinColorPanel(false);
    setShowSkinColorTag(false);

    // Find the selected skin option
    const selectedOption = skinColorOptions.find(opt => opt.color === color);
    if (!selectedOption) return;

    // Switch to the corresponding skin material
    switchSkin(selectedOption.materialName);
  };

  // Add switchSkin function to match test.html implementation
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
    if (gender === 'female') return; // Don't allow hair changes for female models
    Object.entries(hairMeshMap.current).forEach(([key, list]: [string, THREE.Mesh[]]) => {
      const show = key === set;
      list.forEach(mesh => { if (mesh) mesh.visible = show; });
    });
    setSelectedHair(set);
  };

  useEffect(() => {
    if (!modelContainerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf8f9fa)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      45,
      modelContainerRef.current.clientWidth / modelContainerRef.current.clientHeight,
      0.1,
      1000
    )
    cameraRef.current = camera
    camera.position.set(0, 1.7, 4)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    })
    rendererRef.current = renderer
    renderer.setSize(modelContainerRef.current.clientWidth, modelContainerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // @ts-ignore
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    modelContainerRef.current.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(2, 3, 4)
    scene.add(directionalLight)

    const backLight = new THREE.DirectionalLight(0xffffff, 0.6)
    backLight.position.set(-2, 3, -4)
    scene.add(backLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
    fillLight.position.set(0, 2, -2)
    scene.add(fillLight)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.target.set(0, 0, 0)
    // Convert 20 degrees to radians (20 * Math.PI / 180)
    // controls.minAzimuthAngle = -Math.PI / 4.5  // -40 degrees
    // controls.maxAzimuthAngle = Math.PI * (70/180)  // 70 degrees
    controls.update()

    const handleResize = () => {
      if (!modelContainerRef.current) return
      const width = modelContainerRef.current.clientWidth
      const height = modelContainerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    window.addEventListener('resize', handleResize)
    handleResize()

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (modelRef.current) {
        scene.remove(modelRef.current)
        modelRef.current = null
      }
      renderer.dispose()
      if (modelContainerRef.current?.contains(renderer.domElement)) {
        modelContainerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    if (!gender || !sceneRef.current) return

    setIsModelLoading(true)
    setModelError(null)

    if (modelContainerRef.current) {
      modelContainerRef.current.style.opacity = '0.5'
    }

    const loader = new GLTFLoader()
    const modelPath = gender === 'male' ? maleModelUrl : femaleModelUrl;

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

        let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.5

        if (gender === 'male') {
          cameraRef.current!.position.set(0, size.y / 2, cameraDistance)
        } else {
          cameraRef.current!.position.set(0, size.y / 2, cameraDistance)
        }
        cameraRef.current!.lookAt(new THREE.Vector3(0, 0, 0))

        const morphTargetsMap = new Map()
        const hairMorphsMap = new Map()
        const tempHairMeshMap: { hair1: any[], hair2: any[], hair3: any[] } = { hair1: [], hair2: [], hair3: [] };

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mesh = child as THREE.Mesh & {
              morphTargetDictionary: { [key: string]: number };
              morphTargetInfluences: number[];
              material: THREE.Material | THREE.Material[];
            };

            if (mesh.morphTargetDictionary) {
              Object.entries(mesh.morphTargetDictionary).forEach(([name, index]) => {
                if (allowedMorphTargets.includes(name)) {
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
              if (matName.includes('hair1')) tempHairMeshMap.hair1.push(mesh);
              if (matName.includes('hair2')) tempHairMeshMap.hair2.push(mesh);
              if (matName.includes('hair3')) tempHairMeshMap.hair3.push(mesh);

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

              // Additional check for hair meshes by mesh name (for male models)
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

              if (mesh.morphTargetDictionary) {
                Object.entries(mesh.morphTargetDictionary).forEach(([name, index]) => {
                  if (allowedHairMorphTargets.includes(name)) {
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

        if (hairMorphsMap.size > 0 || tempHairMeshMap.hair1.length > 0) {
          toggleHairSet('hair1');
        } else {
          setSelectedHair(null);
        }

        if (sceneRef.current) {
          sceneRef.current.add(model)
        }

        if (modelContainerRef.current) {
          modelContainerRef.current.style.opacity = '1'
        }

        setIsModelLoading(false)
      },
      (xhr: ProgressEvent<EventTarget>) => {
        const event = xhr as unknown as { loaded: number; total: number };
        console.log(`Loading model: ${event.loaded / event.total * 100}%`);
      },
      (error: unknown) => {
        console.error('Error loading model:', error);
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

  useEffect(() => {
    if (gender === 'male') {
      setMeasurements({
        height: "170",
        weight: "75",
        chest: "100",
        waist: "85",
        hips: "95"
      })
    } else if (gender === 'female') {
      setMeasurements({
        height: "160",
        weight: "60",
        chest: "90",
        waist: "75",
        hips: "100"
      })
    }
  }, [gender])

  const updateModelDimensions = (model: THREE.Group, measurements: any) => {
    const height = measurements.height && !isNaN(parseFloat(measurements.height))
      ? parseFloat(measurements.height)
      : (gender === 'male' ? 170 : 160)
    const weight = measurements.weight && !isNaN(parseFloat(measurements.weight))
      ? parseFloat(measurements.weight)
      : (gender === 'male' ? 75 : 60)
    const chest = measurements.chest && !isNaN(parseFloat(measurements.chest))
      ? parseFloat(measurements.chest)
      : (gender === 'male' ? 100 : 90)
    const waist = measurements.waist && !isNaN(parseFloat(measurements.waist))
      ? parseFloat(measurements.waist)
      : (gender === 'male' ? 85 : 75)
    const hips = measurements.hips && !isNaN(parseFloat(measurements.hips))
      ? parseFloat(measurements.hips)
      : (gender === 'male' ? 95 : 100)

    const clampedHeight = Math.min(Math.max(height, MEASUREMENT_LIMITS.height.min), MEASUREMENT_LIMITS.height.max)
    const clampedWeight = Math.min(Math.max(weight, WEIGHT_LIMITS.min), WEIGHT_LIMITS.max)
    const clampedChest = Math.min(Math.max(chest, MEASUREMENT_LIMITS.chest.min), MEASUREMENT_LIMITS.chest.max)
    const clampedWaist = Math.min(Math.max(waist, MEASUREMENT_LIMITS.waist.min), MEASUREMENT_LIMITS.waist.max)
    const clampedHips = Math.min(Math.max(hips, MEASUREMENT_LIMITS.hips.min), MEASUREMENT_LIMITS.hips.max)

    const heightValue = gender === 'female'
      ? Math.min(Math.max((clampedHeight - 160) / 22, -1.35), 1.50)
      : Math.min(Math.max((clampedHeight - 170) / 22, -1.35), 1.50);

    const baseWeight = gender === 'female' ? 60 : 75;
    const normalizedWeight = (clampedWeight - baseWeight) /
      (WEIGHT_LIMITS.max - baseWeight);

    const clampedWeightValue = gender === 'female'
      ? Math.max(-1, Math.min(2, normalizedWeight * 2))
      : Math.max(-0.20, Math.min(1.02, normalizedWeight * 1.22));

    const chestValue = Math.min(Math.max((clampedChest - 95) / 35, -1.40), 1.0);
    const waistValue = Math.min(Math.max((clampedWaist - 80) / 46, -1.40), 1.75);
    const hipsValue = Math.min(Math.max((clampedHips - 95) / 18, -1.20), 1.20);

    morphTargets.forEach((morphData, morphName) => {
      morphData.meshes.forEach(({ mesh, index }) => {
        // Special protection for hair3 - always set chest morph targets to 0
        const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const matName = material?.name?.toLowerCase() || '';
        const meshName = mesh.name?.toLowerCase() || '';

        if (matName.includes('hair3') || meshName.includes('hair3')) {
          const chestMorphTargets = ['Chest Width', 'Shoulder Width', 'Chest Height'];
          if (chestMorphTargets.includes(morphName)) {
            // Force chest morph targets to 0 for hair3
            const typedMesh = mesh as THREE.Mesh & { morphTargetInfluences: number[] };
            typedMesh.morphTargetInfluences[index] = 0;
            return; // Skip normal processing for hair3 chest morphs
          }
        }

        const typedMesh = mesh as THREE.Mesh & {
          morphTargetDictionary: { [key: string]: number };
          morphTargetInfluences: number[];
        };

        let targetValue = 0;
        switch (morphName) {
          case 'height_200':
            targetValue = (gender === 'male') ? heightValue : heightValue;
            break;
          case 'male_overweight':
            targetValue = gender === 'male' ? clampedWeightValue : 0;
            break;
          case 'male_skinny':
            targetValue = gender === 'male' ? -clampedWeightValue : 0;
            break;
          case 'female_overweight':
            if (gender === 'female') {
              targetValue = clampedWeightValue;
            }
            break;
          case 'Chest Width':
            targetValue = chestValue;
            break;
          case 'Shoulder Width':
            targetValue = chestValue * 0.8;
            break;
          case 'Waist Thickness':
            targetValue = waistValue;
            break;
          case 'Hips Size':
            targetValue = hipsValue;
            break;
          case 'Belly Size':
            targetValue = waistValue * 0.8;
            break;
          case 'Chest Height':
            targetValue = heightValue * 0.5;
            break;
          case 'Hips Height':
            targetValue = heightValue * 0.5;
            break;
          case 'Thigh Thickness':
            targetValue = hipsValue * 0.7;
            break;
          case 'Thigh Length':
            targetValue = heightValue * 0.3;
            break;
        }

        targetValue = Math.min(Math.max(targetValue, -2), 2);
        typedMesh.morphTargetInfluences[index] = targetValue;
      });
    });
  }

  useEffect(() => {
    if (modelRef.current) {
      updateModelDimensions(modelRef.current, measurements)
    }
  }, [measurements])

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const calculateSize = () => {
    const height = measurements.height && !isNaN(parseFloat(measurements.height))
      ? parseFloat(measurements.height)
      : (MEASUREMENT_LIMITS.height.min + MEASUREMENT_LIMITS.height.max) / 2
    const weight = measurements.weight && !isNaN(parseFloat(measurements.weight))
      ? parseFloat(measurements.weight)
      : (WEIGHT_LIMITS.min + WEIGHT_LIMITS.max) / 2
    const chest = measurements.chest && !isNaN(parseFloat(measurements.chest))
      ? parseFloat(measurements.chest)
      : (MEASUREMENT_LIMITS.chest.min + MEASUREMENT_LIMITS.chest.max) / 2
    const waist = measurements.waist && !isNaN(parseFloat(measurements.waist))
      ? parseFloat(measurements.waist)
      : (MEASUREMENT_LIMITS.waist.min + MEASUREMENT_LIMITS.waist.max) / 2

    const clampedHeight = Math.min(Math.max(height, MEASUREMENT_LIMITS.height.min), MEASUREMENT_LIMITS.height.max)
    const clampedWeight = Math.min(Math.max(weight, WEIGHT_LIMITS.min), WEIGHT_LIMITS.max)
    const clampedChest = Math.min(Math.max(chest, MEASUREMENT_LIMITS.chest.min), MEASUREMENT_LIMITS.chest.max)
    const clampedWaist = Math.min(Math.max(waist, MEASUREMENT_LIMITS.waist.min), MEASUREMENT_LIMITS.waist.max)

    let baseSize = "M"
    let confidence = 85

    if (clampedChest < 90) baseSize = "XS"
    else if (clampedChest < 95) baseSize = "S"
    else if (clampedChest < 100) baseSize = "M"
    else if (clampedChest < 105) baseSize = "L"
    else baseSize = "XL"

    if (fitPreference === "slim" && baseSize !== "XS") {
      baseSize = ["XS", "S", "M", "L", "XL"][["XS", "S", "M", "L", "XL"].indexOf(baseSize) - 1]
      confidence -= 5
    } else if (fitPreference === "relaxed" && baseSize !== "XL") {
      baseSize = ["XS", "S", "M", "L", "XL"][["XS", "S", "M", "L", "XL"].indexOf(baseSize) + 1]
      confidence -= 5
    }

    return { size: baseSize, confidence }
  }

  const getApiSizeRecommendation = async () => {
    if (!gender) return null;

    const height = measurements.height && !isNaN(parseFloat(measurements.height))
      ? parseFloat(measurements.height)
      : (gender === 'male' ? 170 : 160)
    const weight = measurements.weight && !isNaN(parseFloat(measurements.weight))
      ? parseFloat(measurements.weight)
      : (gender === 'male' ? 75 : 60)
    const chest = measurements.chest && !isNaN(parseFloat(measurements.chest))
      ? parseFloat(measurements.chest)
      : (gender === 'male' ? 100 : 90)
    const waist = measurements.waist && !isNaN(parseFloat(measurements.waist))
      ? parseFloat(measurements.waist)
      : (gender === 'male' ? 85 : 75)
    const hips = measurements.hips && !isNaN(parseFloat(measurements.hips))
      ? parseFloat(measurements.hips)
      : (gender === 'male' ? 95 : 100)

    const requestData = {
      gender,
      measurements: {
        chest,
        waist,
        hip: hips,
        height,
        weight
      },
      fit_preference: fitPreference,
      clothing_type: "Trousers", // TODO: Make this dynamic based on product type
      use_ai: true,
      brand_id: "default",  // Changed from 'brand' to 'brand_id'
      product_id: "default"  // Added product_id field
    };

    const result = await getSizeRecommendation(requestData);
    return result;
  };

  const handleNext = async () => {
    if (step === 5) {
      if (useApiRecommendation) {
        // Try API first
        const apiResult = await getApiSizeRecommendation();
        console.log('🚀 API Result:', apiResult);
        if (apiResult) {
          setApiSizeResult({ size: apiResult.size, confidence: apiResult.confidence, method: apiResult.method });
          setConfidenceScore(apiResult.confidence);
          // Don't call onSizeRecommended here to prevent auto-closing
          // onSizeRecommended(apiResult.size);
        } else {
          // Fallback to local calculation if API fails
          console.log('⚠️ API failed, using local calculation as fallback');
          const { size, confidence } = calculateSize();
          setConfidenceScore(confidence);
          // Don't call onSizeRecommended here to prevent auto-closing
          // onSizeRecommended(size);
        }
      } else {
        // Use local calculation
        const { size, confidence } = calculateSize();
        setConfidenceScore(confidence);
        // Don't call onSizeRecommended here to prevent auto-closing
        // onSizeRecommended(size);
      }
    } else {
      setStep(step + 1)
    }
  }

  const handleAddToBag = async () => {
    // Use API result if available, otherwise fallback to local calculation
    let size: string;
    if (apiSizeResult) {
      size = apiSizeResult.size;
    } else {
      const localResult = calculateSize();
      size = localResult.size;
    }

    console.log(`Attempting to add product with size ${size} to cart...`);

    try {
      let product: any = null;
      let actualProductId = productId;

      if (window.location.pathname.includes('/products/')) {
        try {
          const urlParts = window.location.pathname.split('/products/');
          const productHandle = urlParts[1]?.split('?')[0]?.split('/')[0];

          if (productHandle) {
            const handleResponse = await fetch(`/products/${productHandle}.js`);
            if (handleResponse.ok) {
              product = await handleResponse.json();
              actualProductId = product.id.toString();
            }
          }
        } catch (handleError) {
          console.log('Handle extraction failed:', handleError);
        }
      }

      if (!product) {
        try {
          const scripts = Array.from(document.querySelectorAll('script'));
          for (const script of scripts) {
            const content = script.textContent || script.innerHTML;

            if (content.includes('"product"') && (content.includes('"variants"') || content.includes('"id"'))) {
              try {
                const matches = content.match(/(?:product["\s]*:[\s]*|var[\s]+product[\s]*=[\s]*|window\.product[\s]*=[\s]*|"product"[\s]*:[\s]*)(\{[^}]+\}|\{[\s\S]*?\})/);
                if (matches && matches[1]) {
                  const productData = JSON.parse(matches[1]);
                  if (productData.id && productData.variants) {
                    product = productData;
                    actualProductId = product.id.toString();
                    break;
                  }
                }
              } catch (parseError) { }
            }
          }
        } catch (scriptError) {
          console.log('Script extraction failed:', scriptError);
        }
      }

      if (!product && productId) {
        try {
          const urlsToTry = [
            `/products/${productId}.js`,
            `/products/${productId}`,
            `/admin/api/2023-10/products/${productId}.json`
          ];

          for (const url of urlsToTry) {
            try {
              const response = await fetch(url);
              if (response.ok) {
                const data = await response.json();
                product = data.product || data;
                if (product && product.variants) {
                  actualProductId = product.id.toString();
                  break;
                }
              }
            } catch (urlError) { }
          }
        } catch (apiError) {
          console.log('API method failed:', apiError);
        }
      }

      if (!product) {
        alert(`Could not find product data. Please manually select size "${size}" and add to cart.`);
        onSizeRecommended(size);
        return;
      }

      let selectedVariant = null;

      const sizeOptionNames = ['Size', 'size', 'SIZE', 'Sizes', 'sizes'];

      for (const variant of product.variants) {
        for (let i = 0; i < variant.options.length; i++) {
          const optionName = product.options[i]?.name;
          const optionValue = variant.options[i];

          if (sizeOptionNames.includes(optionName) &&
            optionValue?.toLowerCase() === size.toLowerCase()) {
            selectedVariant = variant;
            break;
          }
        }
        if (selectedVariant) break;
      }

      if (!selectedVariant) {
        const availableSizes = product.variants
          .map((v: any) => {
            for (let i = 0; i < v.options.length; i++) {
              const optionName = product.options[i]?.name;
              if (sizeOptionNames.includes(optionName)) {
                return v.options[i];
              }
            }
            return null;
          })
          .filter(Boolean)
          .filter((value: any, index: number, self: any[]) => self.indexOf(value) === index);

        const useFirstVariant = confirm(`Recommended size "${size}" not found. Available: ${availableSizes.join(', ')}. Use first available variant?`);

        if (useFirstVariant) {
          selectedVariant = product.variants.find((v: any) => v.available) || product.variants[0];
        } else {
          alert(`Please manually select size "${size}" or the closest available size from: ${availableSizes.join(', ')}`);
          onClose();
          return;
        }
      }

      if (!selectedVariant) {
        throw new Error("No available variants found for this product");
      }

      const variantId = selectedVariant.id;

      const cartData = {
        id: variantId,
        quantity: 1,
        properties: {
          'Recommended by': 'YourSizer',
          'Recommended Size': size,
          'Actual Variant': selectedVariant.title || selectedVariant.options.join(' / '),
          'Fit Preference': fitPreference,
          'Gender': gender
        }
      };

      const cartResponse = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(cartData)
      });

      if (!cartResponse.ok) {
        const errorText = await cartResponse.text();
        const status = cartResponse.status;
        throw new Error(`Failed to add to cart (${status}): ${errorText}`);
      }

      const cartResult = await cartResponse.json();

      try {
        if ((window as any).Shopify && (window as any).Shopify.onCartUpdate) {
          (window as any).Shopify.onCartUpdate();
        }

        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cartResult } }));

        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (refreshError) {
        window.location.reload();
      }

      onClose();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Failed to add to cart: ${errorMessage}\n\n📏 Your recommended size: ${size}`);
      onSizeRecommended(size);
    }
  }

  const handleWeightMorphs = (weightValue: number) => {
    if (!modelRef.current || !gender) return;

    const baseWeight = gender === 'female' ? 60 : 75;
    const normalizedWeight = (weightValue - baseWeight) / (WEIGHT_LIMITS.max - baseWeight);
    const clampedWeightValue = gender === 'female'
      ? Math.max(-1, Math.min(2, normalizedWeight * 2))
      : Math.max(-0.20, Math.min(1.02, normalizedWeight * 1.22));

    const overweightData = morphTargets.get('male_overweight');
    if (overweightData) {
      overweightData.meshes.forEach(({ mesh, index }) => {
        const typedMesh = mesh as THREE.Mesh & { morphTargetInfluences: number[] };
        typedMesh.morphTargetInfluences[index] = clampedWeightValue;
      });
    }

    const skinnyData = morphTargets.get('male_skinny');
    if (skinnyData) {
      skinnyData.meshes.forEach(({ mesh, index }) => {
        const typedMesh = mesh as THREE.Mesh & { morphTargetInfluences: number[] };
        typedMesh.morphTargetInfluences[index] = -clampedWeightValue;
      });
    }

    setMorphValues(prev => {
      const newMap = new Map(prev);
      newMap.set('male_overweight', clampedWeightValue);
      newMap.set('male_skinny', -clampedWeightValue);
      return newMap;
    });
  };

  const inputValuesRef = useRef<Record<string, string>>({})

  const renderMeasurementInputs = (type: 'height' | 'weight' | 'chest' | 'waist' | 'hips') => {
    const CM_PER_INCH = 2.54;
    const LBS_PER_KG = 2.20462;

    const metricRanges = {
      height: { min: MEASUREMENT_LIMITS.height.min, max: MEASUREMENT_LIMITS.height.max },
      weight: { min: WEIGHT_LIMITS.min, max: WEIGHT_LIMITS.max },
      chest: { min: MEASUREMENT_LIMITS.chest.min, max: MEASUREMENT_LIMITS.chest.max },
      waist: { min: MEASUREMENT_LIMITS.waist.min, max: MEASUREMENT_LIMITS.waist.max },
      hips: { min: MEASUREMENT_LIMITS.hips.min, max: MEASUREMENT_LIMITS.hips.max }
    };

    const displayRanges = {
      height: useMetric
        ? { min: MEASUREMENT_LIMITS.height.min, max: MEASUREMENT_LIMITS.height.max, step: 1 }
        : { min: Math.round(MEASUREMENT_LIMITS.height.min / CM_PER_INCH), max: Math.round(MEASUREMENT_LIMITS.height.max / CM_PER_INCH), step: 1 },
      weight: useMetric
        ? { min: WEIGHT_LIMITS.min, max: WEIGHT_LIMITS.max, step: 1 }
        : { min: Math.round(WEIGHT_LIMITS.min * LBS_PER_KG), max: Math.round(WEIGHT_LIMITS.max * LBS_PER_KG), step: 1 },
      chest: useMetric
        ? { min: MEASUREMENT_LIMITS.chest.min, max: MEASUREMENT_LIMITS.chest.max, step: 1 }
        : { min: parseFloat((MEASUREMENT_LIMITS.chest.min / CM_PER_INCH).toFixed(1)), max: parseFloat((MEASUREMENT_LIMITS.chest.max / CM_PER_INCH).toFixed(1)), step: 0.1 },
      waist: useMetric
        ? { min: MEASUREMENT_LIMITS.waist.min, max: MEASUREMENT_LIMITS.waist.max, step: 1 }
        : { min: parseFloat((MEASUREMENT_LIMITS.waist.min / CM_PER_INCH).toFixed(1)), max: parseFloat((MEASUREMENT_LIMITS.waist.max / CM_PER_INCH).toFixed(1)), step: 0.1 },
      hips: useMetric
        ? { min: MEASUREMENT_LIMITS.hips.min, max: MEASUREMENT_LIMITS.hips.max, step: 1 }
        : { min: parseFloat((MEASUREMENT_LIMITS.hips.min / CM_PER_INCH).toFixed(1)), max: parseFloat((MEASUREMENT_LIMITS.hips.max / CM_PER_INCH).toFixed(1)), step: 0.1 }
    };
    const displayRange = displayRanges[type];

    const getCurrentDisplayValue = () => {
      const metricString = measurements[type];
      if (metricString === '' || isNaN(parseFloat(metricString))) {
        return '';
      }
      const metricValue = parseFloat(metricString);
      if (!useMetric) {
        if (type === 'weight') return (metricValue * LBS_PER_KG).toFixed(0);
        else return (metricValue / CM_PER_INCH).toFixed(1);
      }
      return metricValue.toFixed(0);
    };

    const getSliderValue = () => {
      const metricString = measurements[type];
      if (metricString === '' || isNaN(parseFloat(metricString))) {
        return 0;
      }
      const metricValue = parseFloat(metricString);
      let displayValue: number;
      if (!useMetric) {
        if (type === 'weight') displayValue = metricValue * LBS_PER_KG;
        else displayValue = metricValue / CM_PER_INCH;
      } else {
        displayValue = metricValue;
      }

      const normalizedValue = (displayValue - displayRange.min) / (displayRange.max - displayRange.min);
      return Math.max(0, Math.min(1, normalizedValue));
    };

    const formatDisplayLabel = (metricString: string): string => {
      if (metricString === '' || isNaN(parseFloat(metricString))) {
        return '';
      }
      const metricValue = parseFloat(metricString);
      if (!useMetric) {
        if (type === 'height') return cmToFeet(metricValue);
        if (type === 'weight') return `${(metricValue * LBS_PER_KG).toFixed(0)} lbs`;
        else return `${(metricValue / CM_PER_INCH).toFixed(1)}"`;
      }
      return `${metricValue.toFixed(0)} ${type === 'weight' ? 'kg' : 'cm'}`;
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const sliderValue = parseFloat(e.target.value);
      const displayValue = displayRange.min + (sliderValue * (displayRange.max - displayRange.min));

      let metricValue: number;
      if (!useMetric) {
        if (type === 'weight') metricValue = displayValue / LBS_PER_KG;
        else metricValue = displayValue * CM_PER_INCH;
      } else {
        metricValue = displayValue;
      }

      setMeasurements(prev => ({ ...prev, [type]: metricValue.toFixed(1) }));

      if (type === 'weight') {
        handleWeightMorphs(metricValue);
      }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const displayValue = e.target.value;

      if (displayValue === '') {
        setMeasurements(prev => ({ ...prev, [type]: '' }));
        return;
      }

      const displayValueNum = parseFloat(displayValue);
      if (isNaN(displayValueNum)) {
        return;
      }

      let metricValue: number;
      if (!useMetric) {
        if (type === 'weight') metricValue = displayValueNum / LBS_PER_KG;
        else metricValue = displayValueNum * CM_PER_INCH;
      } else {
        metricValue = displayValueNum;
      }

      setMeasurements(prev => ({ ...prev, [type]: metricValue.toFixed(1) }));

      if (type === 'weight') {
        handleWeightMorphs(metricValue);
      }
    };

    // Special handling for weight on mobile
    if (type === 'weight' && isMobile) {
      return (
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {type}: {formatDisplayLabel(measurements[type])}
            </label>
          </div>
          <RadialWeightSlider
            value={parseFloat(measurements[type])}
            onChange={(newValue) => {
              setMeasurements(prev => ({ ...prev, [type]: newValue.toFixed(1) }));
              handleWeightMorphs(newValue);
            }}
            useMetric={useMetric}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2 md:space-y-3">
        {!isMobile && (
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {type}: {formatDisplayLabel(measurements[type])}
            </label>
            {(type === 'chest' || type === 'waist' || type === 'hips') && (
              <button
                onClick={() => setShowMeasurementGuide(type as any)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex gap-2 md:gap-4">
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={getSliderValue()}
              onChange={handleSliderChange}
              className="w-full h-3 md:h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-0.5 md:mt-1">
              <span>{displayRange.min}</span>
              <span>{displayRange.max}</span>
            </div>
          </div>
          <input
            type="number"
            value={getCurrentDisplayValue()}
            onChange={handleNumberChange}
            className="w-16 md:w-20 px-1 md:px-2 py-0.5 md:py-1 border rounded-lg text-center text-base"
            step={displayRange.step}
            min={displayRange.min}
            max={displayRange.max}
          />
        </div>
      </div>
    );
  }

  const fitDescriptions = {
    slim: "Closer fit, ideal for a more tailored look",
    regular: "Standard fit, comfortable for everyday wear",
    relaxed: "Looser fit, perfect for a casual style"
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
  }, [])


  const isSafari = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }, []);

  const getModalHeight = useCallback(() => {
    if (!isMobile) return '600px';
    if (isSafari) return '85vh';
    return '92vh';
  }, [isMobile, isSafari]);

  useEffect(() => {
    const currentStep = step;
    const previousStep = prevStepRef.current;
    prevStepRef.current = currentStep;
  }, [step, gender, measurements, isMobile, fitPreference, productId, hasTrackedRecommendation]);

  useEffect(() => {
    if (showHairPanel || selectedHair) {
      setShowHairTag(false);
      return;
    };
    const interval = setInterval(() => {
      setShowHairTag(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, [showHairPanel, selectedHair]);

  const handleMorphChange = (morphName: string, value: number) => {
    const morphData = morphTargets.get(morphName);
    if (!morphData) return;

    value = Math.min(Math.max(value, -1), 2);

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

  const handleParameterChange = (paramName: string, value: number) => {
    if (!modelRef.current) return

    modelRef.current.traverse(child => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as any;
        switch (paramName) {
          case 'Wrinkles':
            if (material.bumpMap) {
              material.bumpScale = value
            }
            break
          case 'Cavity Strength':
            if (material.aoMapIntensity !== undefined) {
              material.aoMapIntensity = value
            }
            break
          case 'Normal Strength':
            if (material.normalMap) {
              material.normalScale.set(value, value)
            }
            break
        }
      }
    })

    setParameterValues(prev => new Map(prev).set(paramName, value))
  }

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
  }

  const renderStepContent = () => {
    if (!isMobile) {
      switch (step) {
        case 1:
          return (
            <div className="flex flex-col flex-1">
              <div className="space-y-4 md:space-y-6 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Select Your Gender</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {["male", "female"].map((option) => {
                    const isSelected = gender === option;

                    return (
                      <button
                        key={option}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const newGender = option as "male" | "female";
                          setGender(newGender);
                        }}
                        disabled={isModelLoading}
                        className={`p-4 md:p-6 rounded-xl border-2 transition-all relative ${gender === option
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                          } ${isModelLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <p className="text-base md:text-lg font-medium capitalize text-gray-900">
                          {option}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* <div className="hidden md:block">
                  <div className="mt-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900">Skin Tone Customization</h2>
                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                      <div className="flex items-center justify-center gap-6">
                        {skinColorOptions.map((option) => (
                          <button
                            key={option.id}
                            disabled
                            className="w-16 h-16 rounded-full transition-all opacity-60 cursor-not-allowed"
                            style={{ backgroundColor: option.color }}
                          />
                        ))}
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-base text-gray-500">
                          Skin tone customization coming soon
                        </p>
                        <p className="text-sm text-orange-600 mt-2">
                          Coming Soon
                        </p>
                      </div>
                    </div>
                  </div>
                </div> */}

              </div>
            </div>
          )

        case 2:
          return (
            <div className="space-y-4">
              {isMobile ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">Your Height</h2>
                    <button
                      onClick={() => setUseMetric(!useMetric)}
                      className="text-xs text-blue-600"
                    >
                      Switch to {useMetric ? 'Imperial' : 'Metric'}
                    </button>
                  </div>
                  <RadialHeightSlider
                    value={parseFloat(measurements.height) || 170}
                    onChange={val => setMeasurements(prev => ({ ...prev, height: val.toString() }))}
                    useMetric={useMetric}
                  />
                  {renderMeasurementInputs('weight')}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Basic Measurement</h2>
                    <button
                      onClick={() => setUseMetric(!useMetric)}
                      className="text-xs md:text-sm text-blue-600 hover:text-blue-700"
                    >
                      Switch to {useMetric ? 'Imperial' : 'Metric'}
                    </button>
                  </div>
                  <div className="space-y-4 md:space-y-6">
                    {renderMeasurementInputs('height')}
                    {renderMeasurementInputs('weight')}
                  </div>
                </div>
              )}
            </div>
          );

        case 3:
          return (
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Body Measurements</h2>
                <button
                  onClick={() => setUseMetric(!useMetric)}
                  className="text-xs md:text-sm text-blue-600 hover:text-blue-700"
                >
                  Switch to {useMetric ? 'Imperial' : 'Metric'}
                </button>
              </div>
              <div className="space-y-4 md:space-y-6">
                {renderMeasurementInputs('chest')}
                {renderMeasurementInputs('waist')}
                {renderMeasurementInputs('hips')}
              </div>
            </div>
          )

        case 4:
          return (
            <div className="space-y-4 md:space-y-6 overflow-y-auto">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Fit Preference</h2>
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                {[
                  { type: "slim", desc: "Close fitting, follows body contours" },
                  { type: "regular", desc: "Standard fit, balanced comfort" },
                  { type: "relaxed", desc: "Looser fit with extra room" }
                ].map(({ type, desc }) => (
                  <button
                    key={type}
                    onClick={() => setFitPreference(type as "slim" | "regular" | "relaxed")}
                    className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all ${fitPreference === type
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-base md:text-lg font-medium capitalize text-gray-900">{type}</p>
                      <p className="text-xs md:text-sm text-gray-600 md:hidden">{desc}</p>
                    </div>
                    <p className="hidden md:block text-sm text-gray-600 mt-2">{
                      type === "slim" ? "Close-fitting, follows body contours" :
                        type === "regular" ? "Standard fit, balanced comfort" :
                          "Looser fit with extra room"
                    }</p>
                  </button>
                ))}
              </div>
              <div className="space-y-3 md:space-y-4 pb-4">
                <div>
                  <h3 className="text-base md:text-lg font-medium mb-2 text-gray-900">Photo Upload</h3>
                  <button disabled className="w-full p-3 md:p-4 rounded-xl border-2 border-gray-200 opacity-60 cursor-not-allowed">
                    <p className="text-base md:text-lg font-medium text-gray-900">Upload Your Photo</p>
                    <p className="text-xs md:text-sm text-orange-600">Coming Soon</p>
                  </button>
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-medium mb-2 text-gray-900">Customization</h3>
                  <button disabled className="w-full p-3 md:p-4 rounded-xl border-2 border-gray-200 opacity-60 cursor-not-allowed">
                    <p className="text-base md:text-lg font-medium text-gray-900">Customize Your Fit</p>
                    <p className="text-xs md:text-sm text-orange-600">Coming Soon</p>
                  </button>
                </div>
              </div>
            </div>
          )

        case 5:
          // Only show API result if available, don't fallback to local calculation while loading
          const desktopSizeResult = apiSizeResult || (isApiLoading ? null : calculateSize());
          const { size, confidence } = desktopSizeResult || { size: "---", confidence: 0 };
          return (
            <div className="space-y-4 md:space-y-6 overflow-y-auto">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Your Recommended Size</h2>
              {isApiLoading && (
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-blue-600">Getting your perfect size...</p>
                </div>
              )}
              {apiError && (
                <div className="bg-yellow-50 p-4 rounded-xl text-center">
                  <p className="text-sm text-yellow-700">Using local calculation (API unavailable)</p>
                </div>
              )}
              {!isApiLoading && desktopSizeResult && (
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-3 md:mb-4">{size}</div>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-gray-600">
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-sm">Confidence Score:</span>
                      <span className="font-medium">{confidence}%</span>
                    </div>
                  </div>
                  {/* AI Indicator */}
                  {apiSizeResult?.method === "ai" && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-purple-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Yoursizer AI powered recommendation</span>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="hidden md:flex w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Advanced Settings
              </button>
              <AnimatePresence>
                {showAdvancedSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 bg-gray-50 rounded-lg space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900">Advanced Settings</h3>
                      <button
                        onClick={() => {
                          resetAllMorphs()
                          setShowAdvancedSettings(false)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Reset All
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Shape Modifiers</h4>
                      {Array.from(morphTargets.entries()).map(([morphName, morphData]) => (
                        <div key={morphName} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-600">{morphName}</label>
                            <span className="text-xs text-gray-500">
                              {morphValues.get(morphName)?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-1"
                            max="2"
                            step="0.01"
                            value={morphValues.get(morphName) || 0}
                            onChange={(e) => handleMorphChange(morphName, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Hair Modifiers</h4>
                      {Array.from(hairMorphTargets.entries())
                        .filter(([morphName]) => !['hair1', 'hair2', 'hair3', 'hair_style_1', 'hair_style_2', 'hair_style_3'].includes(morphName))
                        .map(([morphName]) => (
                          <div key={morphName} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm text-gray-600 capitalize">{morphName.replace(/_/g, ' ')}</label>
                              <span className="text-xs text-gray-500">
                                {(hairMorphValues.get(morphName) || 0).toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={hairMorphValues.get(morphName) || 0}
                              onChange={(e) => handleHairMorphChange(morphName, parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        ))}
                      {hairMorphTargets.size === 0 && <p className="text-sm text-gray-500">No adjustable hair morphs found.</p>}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Material Parameters</h4>
                      {parameterControls.map(param => (
                        <div key={param.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-600">{param.name}</label>
                            <span className="text-xs text-gray-500">
                              {parameterValues.get(param.name)?.toFixed(2) || param.default.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={parameterValues.get(param.name) || param.default}
                            onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="pb-3 md:pb-4">
                <button
                  onClick={handleAddToBag}
                  className="w-full py-3 md:py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Add to Bag with Size {size}
                </button>
              </div>
            </div>
          )

        default:
          return null
      }
    }

    switch (step) {
      case 1:
        return (
          <div className="flex flex-col flex-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Select Your Gender</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["male", "female"].map((option) => {
                  const isSelected = gender === option;

                  return (
                    <button
                      key={option}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const newGender = option as "male" | "female";
                        setGender(newGender);
                      }}
                      disabled={isModelLoading}
                      className={`p-3 rounded-xl border-2 transition-all relative ${gender === option
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                        } ${isModelLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <p className="text-sm font-medium capitalize text-gray-900">
                        {option}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Your Height</h2>
              <button
                onClick={() => setUseMetric(!useMetric)}
                className="text-xs text-blue-600"
              >
                Switch to {useMetric ? 'Imperial' : 'Metric'}
              </button>
            </div>
            {isMobile ? (
              <RadialHeightSlider
                value={parseFloat(measurements.height) || 170}
                onChange={val => setMeasurements(prev => ({ ...prev, height: val.toString() }))}
                useMetric={useMetric}
              />
            ) : (
              renderMeasurementInputs('height')
            )}
          </div>
        )

      case 3:
        return (
          <div className="">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Your Weight</h2>
              <button
                onClick={() => setUseMetric(!useMetric)}
                className="text-xs text-blue-600"
              >
                Switch to {useMetric ? 'Imperial' : 'Metric'}
              </button>
            </div>
            {isMobile ? (
              <RadialWeightSlider
                value={parseFloat(measurements.weight) || 75}
                onChange={val => {
                  setMeasurements(prev => ({ ...prev, weight: val.toString() }));
                  handleWeightMorphs(val);
                }}
                useMetric={useMetric}
              />
            ) : (
              renderMeasurementInputs('weight')
            )}
          </div>
        )
      case 4:
        return (
          <div className="">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Chest Size</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseMetric(!useMetric)}
                  className="text-xs text-blue-600"
                >
                  Switch to {useMetric ? 'Imperial' : 'Metric'}
                </button>
              </div>
            </div>
            {isMobile ? (
              <RadialChestSlider
                value={parseFloat(measurements.chest) || 90}
                onChange={val => {
                  setMeasurements(prev => ({ ...prev, chest: val.toString() }));
                  handleMorphChange('chest', val);
                }}
                useMetric={useMetric}
              />
            ) : (
              renderMeasurementInputs('chest')
            )}
          </div>
        )

      case 5:
        return (
          <div className="">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Waist Size</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseMetric(!useMetric)}
                  className="text-xs text-blue-600"
                >
                  Switch to {useMetric ? 'Imperial' : 'Metric'}
                </button>
                <button
                  onClick={() => setShowMeasurementGuide('waist')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
            {isMobile ? (
              <RadialWaistSlider
                value={parseFloat(measurements.waist) || 85}
                onChange={val => {
                  setMeasurements(prev => ({ ...prev, waist: val.toString() }));
                  handleMorphChange('waist', val);
                }}
                useMetric={useMetric}
              />
            ) : (
              renderMeasurementInputs('waist')
            )}
          </div>
        )

      case 6:
        return (
          <div className="">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Hips Size</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseMetric(!useMetric)}
                  className="text-xs text-blue-600"
                >
                  Switch to {useMetric ? 'Imperial' : 'Metric'}
                </button>
                <button
                  onClick={() => setShowMeasurementGuide('hips')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
            {isMobile ? (
              <RadialHipsSlider
                value={parseFloat(measurements.hips) || 95}
                onChange={val => {
                  setMeasurements(prev => ({ ...prev, hips: val.toString() }));
                  handleMorphChange('hips', val);
                }}
                useMetric={useMetric}
              />
            ) : (
              renderMeasurementInputs('hips')
            )}
          </div>
        )

      case 7:
        return (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-gray-900">Fit Preference</h2>
            <div className="flex flex-row gap-2">
              {[
                { type: "slim", desc: "Close fitting" },
                { type: "regular", desc: "Standard fit" },
                { type: "relaxed", desc: "Looser fit" }
              ].map(({ type, desc }) => (
                <button
                  key={type}
                  onClick={() => setFitPreference(type as "slim" | "regular" | "relaxed")}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all ${fitPreference === type
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                  <div className="text-center">
                    <p className="text-xs font-medium capitalize text-gray-900">{type}</p>
                    <p className="text-xs text-gray-600 mt-1">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 8:
        // Only show API result if available, don't fallback to local calculation while loading
        const mobileSizeResult = apiSizeResult || (isApiLoading ? null : calculateSize());
        const { size: mobileSize, confidence: mobileConfidence } = mobileSizeResult || { size: "---", confidence: 0 };
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Your Perfect Size</h2>
            {isApiLoading && (
              <div className="bg-blue-50 p-3 rounded-xl text-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-blue-600">Getting your perfect size...</p>
              </div>
            )}
            {apiError && (
              <div className="bg-yellow-50 p-3 rounded-xl text-center">
                <p className="text-sm text-yellow-700">Using local calculation (API unavailable)</p>
              </div>
            )}
            {!isApiLoading && mobileSizeResult && (
              <div className="bg-blue-50 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Size</p>
                    <p className="text-2xl font-bold text-blue-600">{mobileSize}</p>
                  </div>
                  <div className="flex-1 text-center border-l border-r border-blue-200 px-2">
                    <p className="text-sm font-medium text-gray-600">Confidence</p>
                    <p className="text-lg font-medium text-blue-600">{mobileConfidence}%</p>
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={handleAddToBag}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
                {/* AI Indicator for mobile */}
                {apiSizeResult?.method === "ai" && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs text-purple-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>AI-powered recommendation</span>
                  </div>
                )}
              </div>
            )}
            <AnimatePresence>
              {showAdvancedSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 bg-gray-50 rounded-lg space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-gray-900">Advanced Settings</h3>
                    <button
                      onClick={() => {
                        resetAllMorphs()
                        setShowAdvancedSettings(false)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Reset All
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Shape Modifiers</h4>
                    {Array.from(morphTargets.entries()).map(([morphName, morphData]) => (
                      <div key={morphName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-600">{morphName}</label>
                          <span className="text-xs text-gray-500">
                            {morphValues.get(morphName)?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-1"
                          max="2"
                          step="0.01"
                          value={morphValues.get(morphName) || 0}
                          onChange={(e) => handleMorphChange(morphName, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Hair Modifiers</h4>
                    {Array.from(hairMorphTargets.entries())
                      .filter(([morphName]) => !['hair1', 'hair2', 'hair3', 'hair_style_1', 'hair_style_2', 'hair_style_3'].includes(morphName))
                      .map(([morphName]) => (
                        <div key={morphName} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-600 capitalize">{morphName.replace(/_/g, ' ')}</label>
                            <span className="text-xs text-gray-500">
                              {(hairMorphValues.get(morphName) || 0).toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={hairMorphValues.get(morphName) || 0}
                            onChange={(e) => handleHairMorphChange(morphName, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      ))}
                    {hairMorphTargets.size === 0 && <p className="text-sm text-gray-500">No adjustable hair morphs found.</p>}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Material Parameters</h4>
                    {parameterControls.map(param => (
                      <div key={param.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-600">{param.name}</label>
                          <span className="text-xs text-gray-500">
                            {parameterValues.get(param.name)?.toFixed(2) || param.default.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={parameterValues.get(param.name) || param.default}
                          onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )

      default:
        return null
    }
  }

  const totalSteps = isMobile ? 8 : 5

  const handleActualClose = () => {
    setHasTrackedRecommendation(false);
    onClose();
  };

  // Add this effect to handle hair visibility based on gender
  useEffect(() => {
    if (gender === 'female') {
      // Hide all hair for female models
      Object.values(hairMeshMap.current).forEach(list => {
        list.forEach(mesh => { if (mesh) mesh.visible = false; });
      });
      setSelectedHair(null);
    } else if (gender === 'male' && !selectedHair) {
      // Show default hair for male models if none selected
      toggleHairSet('hair1');
    }
  }, [gender]);

  // Trigger API call when reaching final step
  useEffect(() => {
    const finalStep = isMobile ? 8 : 5;
    console.log('🔍 Step check:', { step, finalStep, isMobile, useApiRecommendation, hasApiResult: !!apiSizeResult, isApiLoading });
    
    if (step === finalStep && useApiRecommendation && !apiSizeResult && !isApiLoading) {
      console.log('🚀 Triggering API call for size recommendation...');
      getApiSizeRecommendation().then(result => {
        if (result) {
          console.log('✅ API call successful:', result);
          setApiSizeResult({ size: result.size, confidence: result.confidence, method: result.method });
          setConfidenceScore(result.confidence);
          // Don't call onSizeRecommended here to prevent auto-closing
          // onSizeRecommended(result.size);
        } else {
          console.log('⚠️ API call failed, will use local calculation');
        }
      });
    }
  }, [step, isMobile, useApiRecommendation, apiSizeResult, isApiLoading, gender, measurements, fitPreference]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-end bg-black/50 p-0"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onTouchMove={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleActualClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white w-full md:w-[900px] md:h-[600px] overflow-hidden relative rounded-t-[32px] md:rounded-2xl flex flex-col font-normal leading-normal"
        style={{
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          height: getModalHeight(),
          maxHeight: getModalHeight(),
        }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 flex-shrink-0" />

        <div className="flex-1 flex flex-col min-h-0">
          <div className="md:hidden border-b border-gray-100 p-1.5 bg-white flex-shrink-0 flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-gray-600 text-xs">
                Powered by <span className="font-semibold text-blue-600">YourSizer</span>
              </p>
            </div>
            <button
              onClick={handleActualClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex md:flex-row flex-col flex-1 overflow-hidden min-h-0">
            <div className="md:w-1/2 w-full h-[65vh] md:h-auto bg-gray-50 relative overflow-hidden">
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                <div className="md:hidden">
                  <button disabled className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center opacity-60">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>

                {/* Icons Container */}
                <div className="flex flex-col items-end gap-2">
                  {/* Hair Button */}
                  <div className="relative">
                    <AnimatePresence>
                      {showHairTag && !selectedHair && !showHairPanel && gender === 'male' && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-white px-2 py-0.5 rounded shadow-sm text-xs whitespace-nowrap"
                        >
                          Hair
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {gender === 'male' && (
                      <button
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
                        onClick={() => setShowHairPanel(!showHairPanel)}
                      >
                        <Brush className="w-4 h-4 md:w-5 md:h-5 text-black" />
                      </button>
                    )}
                    <AnimatePresence>
                      {showHairPanel && gender === 'male' && (
                        <motion.div
                          initial={{ opacity: 0, x: "100%" }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: "100%" }}
                          className="absolute right-full top-0 mr-2 flex items-center gap-2"
                        >
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            onClick={() => toggleHairSet('hair1')}
                            className={`w-8 h-8 rounded-full shadow-md hover:scale-110 transition-transform text-xs font-medium ${selectedHair === 'hair1'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            H1
                          </motion.button>
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            onClick={() => toggleHairSet('hair2')}
                            className={`w-8 h-8 rounded-full shadow-md hover:scale-110 transition-transform text-xs font-medium ${selectedHair === 'hair2'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            H2
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Skin Color Button */}
                  <div className="relative">
                    <div className="flex flex-col gap-2">
                      {skinColorOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleSkinColorSelect(option.color)}
                          className={`w-8 h-8 rounded-full shadow-md hover:scale-110 transition-transform ${selectedSkinColor === option.color
                              ? 'ring-2 ring-blue-600 ring-offset-2'
                              : ''
                            }`}
                          style={{ backgroundColor: option.color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div
                ref={modelContainerRef}
                className="w-full h-full relative"
                style={{
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
              />
              {isModelLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 md:w-8 md:h-8 border-3 md:border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs md:text-sm text-gray-600">Loading 3D Model...</p>
                  </div>
                </div>
              )}
              {modelError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                  <div className="text-center p-3 md:p-4">
                    <p className="text-red-600 font-medium mb-2 text-sm">{modelError}</p>
                    <button
                      onClick={() => {
                        setModelError(null)
                        setGender(gender)
                      }}
                      className="text-blue-600 hover:text-blue-700 text-xs md:text-sm"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="md:w-1/2 w-full flex flex-col overflow-hidden bg-white relative min-h-0">
              <div className="hidden md:flex items-center border-b border-gray-100 flex-shrink-0">
                <div className="flex gap-3 px-6 py-6 flex-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-blue-600" : "bg-gray-200"
                        }`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleActualClose}
                  className="text-gray-500 hover:text-gray-700 p-3 rounded-full hover:bg-gray-100 mr-4"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className={`flex-1 px-6 pt-1 pb-20 md:py-4 md:pb-2 min-h-0 ${isMobile ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                {renderStepContent()}
              </div>

              <div className="md:relative absolute bottom-0 left-0 right-0 md:left-auto md:right-auto border-t border-gray-100 bg-white flex-shrink-0">
                <div className="flex justify-between items-center p-2">
                  <div className="flex-shrink-0 w-16">
                    {step > 1 && (
                      <button
                        onClick={() => setStep(step - 1)}
                        className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg text-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                    )}
                  </div>

                  <div className="md:hidden flex gap-1 flex-1 max-w-32 mx-4">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${i < step ? "bg-blue-600" : "bg-gray-200"
                          }`}
                      />
                    ))}
                  </div>

                  <div className="flex-shrink-0">
                    {step < totalSteps && (
                      <button
                        onClick={() => setStep(step + 1)}
                        disabled={
                          (step === 1 && !gender) ||
                          (isMobile && step === 2 && !measurements.height) ||
                          (isMobile && step === 3 && !measurements.weight) ||
                          (isMobile && step === 4 && !measurements.chest) ||
                          (isMobile && step === 5 && !measurements.waist) ||
                          (isMobile && step === 6 && !measurements.hips) ||
                          (isMobile && step === 7 && !fitPreference) ||
                          (!isMobile && step === 2 && (!measurements.height || !measurements.weight)) ||
                          (!isMobile && step === 3 && (!measurements.chest || !measurements.waist || !measurements.hips)) ||
                          (!isMobile && step === 4 && !fitPreference)
                        }
                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {(isMobile && step === 7) || (!isMobile && step === 4) ? "See Result" : "Next"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    {step === totalSteps && (
                      <button
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Advanced
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block border-t border-gray-100 p-3 text-center bg-white flex-shrink-0">
            <p className="text-gray-600 text-sm">
              Powered by <span className="font-semibold text-blue-600">YourSizer</span>
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showMeasurementGuide && (
          <MeasurementGuide
            measurementType={showMeasurementGuide}
            onClose={() => setShowMeasurementGuide(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}