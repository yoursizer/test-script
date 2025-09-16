import { useState, useCallback } from 'react'
import * as THREE from 'three'

interface UseParameterManagementProps {
  modelRef: React.RefObject<THREE.Group>
}

export function useParameterManagement({ modelRef }: UseParameterManagementProps) {
  const [parameterValues, setParameterValues] = useState<Map<string, number>>(new Map())

  const handleParameterChange = useCallback((paramName: string, value: number) => {
    if (!modelRef.current) return

    modelRef.current.traverse(child => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.Material & { 
          bumpScale?: number;
          bumpMap?: THREE.Texture;
          aoMapIntensity?: number;
          normalMap?: THREE.Texture;
          normalScale?: THREE.Vector2;
        }
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
            if (material.normalMap && material.normalScale) {
              material.normalScale.set(value, value)
            }
            break
        }
      }
    })

    setParameterValues(prev => new Map(prev).set(paramName, value))
  }, [modelRef])

  return {
    parameterValues,
    setParameterValues,
    handleParameterChange
  }
}
