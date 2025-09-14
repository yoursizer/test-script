import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// MERKEZI KONFIGÜRASYON KULLANIMI
import { SCENE_CONFIG } from '../constants/sizing-assistant';

interface UseThreeSceneReturn {
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  modelRef: React.MutableRefObject<THREE.Group | null>;
}

export function useThreeScene(
  modelContainerRef: React.RefObject<HTMLDivElement>
): UseThreeSceneReturn {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
   
    if (!modelContainerRef.current) {
      return;
    }

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_CONFIG.backgroundColor);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      SCENE_CONFIG.camera.fov,
      modelContainerRef.current.clientWidth / modelContainerRef.current.clientHeight,
      SCENE_CONFIG.camera.near,
      SCENE_CONFIG.camera.far
    );
    cameraRef.current = camera;
    camera.position.set(...SCENE_CONFIG.camera.position);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    renderer.setSize(modelContainerRef.current.clientWidth, modelContainerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, SCENE_CONFIG.renderer.maxPixelRatio));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // @ts-ignore
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = SCENE_CONFIG.renderer.toneMappingExposure;
    

    
    modelContainerRef.current.appendChild(renderer.domElement);

    // Create lights
    const ambientLight = new THREE.AmbientLight(
      SCENE_CONFIG.lighting.ambient.color, 
      SCENE_CONFIG.lighting.ambient.intensity
    );
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      SCENE_CONFIG.lighting.directional.color, 
      SCENE_CONFIG.lighting.directional.main.intensity
    );
    directionalLight.position.set(...SCENE_CONFIG.lighting.directional.main.position);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(
      SCENE_CONFIG.lighting.directional.color, 
      SCENE_CONFIG.lighting.directional.back.intensity
    );
    backLight.position.set(...SCENE_CONFIG.lighting.directional.back.position);
    scene.add(backLight);

    const fillLight = new THREE.DirectionalLight(
      SCENE_CONFIG.lighting.directional.color, 
      SCENE_CONFIG.lighting.directional.fill.intensity
    );
    fillLight.position.set(...SCENE_CONFIG.lighting.directional.fill.position);
    scene.add(fillLight);

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 0, 0);
    controls.update();

    // Handle resize
    const handleResize = () => {
      if (!modelContainerRef.current) return;
      const width = modelContainerRef.current.clientWidth;
      const height = modelContainerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, SCENE_CONFIG.renderer.maxPixelRatio));
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Animation loop
    let frameCount = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      
      // Log first few frames
      if (frameCount < 5) {
    
        frameCount++;
      }
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current = null;
      }
      renderer.dispose();
      if (modelContainerRef.current?.contains(renderer.domElement)) {
        modelContainerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelContainerRef]);

  return {
    sceneRef,
    cameraRef,
    rendererRef,
    modelRef
  };
}