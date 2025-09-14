/**
 * Debug Utilities
 * Consolidated debug panel and logging utilities
 */

import React from 'react';

/**
 * Generic Debug Panel Props
 */
interface BaseDebugPanelProps {
  title: string;
  className?: string;
}

/**
 * Simple Debug Panel for JSON data
 */
interface DebugPanelProps extends BaseDebugPanelProps {
  data: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ title, data, className = "" }) => {
  return (
    <div className={`bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono ${className}`}>
      <div className="text-yellow-400 font-bold mb-2">{title}</div>
      <pre className="whitespace-pre-wrap overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

/**
 * Enhanced JSON Debug Panel with loading states
 */
interface JsonDebugPanelProps extends BaseDebugPanelProps {
  jsonData: any;
  isLoading: boolean;
  error: string | null | undefined;
}

export const JsonDebugPanel: React.FC<JsonDebugPanelProps> = ({ 
  jsonData, 
  isLoading, 
  error, 
  title = "JSON Debug Data",
  className = ""
}) => {
  if (!jsonData && !isLoading && !error) {
    return null;
  }

  return (
    <div className={`bg-black text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96 ${className}`}>
      <div className="mb-2">
        <h3 className="text-white font-bold mb-1">{title}</h3>
        <div className="text-gray-400 text-xs">
          {new Date().toLocaleTimeString()} | Status: {isLoading ? 'Loading...' : error ? 'Error' : 'Ready'}
        </div>
      </div>
      
      {isLoading && (
        <div className="text-yellow-400 mb-2">
          <span className="animate-pulse">● Loading JSON data...</span>
        </div>
      )}
      
      {error && (
        <div className="text-red-400 mb-2">
          <span>● Error: {error}</span>
        </div>
      )}
      
      {jsonData && (
        <div className="space-y-2">
          {jsonData.heightWeight && (
            <div>
              <span className="text-blue-400">Height/Weight:</span>
              <div className="ml-2">
                <span className="text-white">Height: {jsonData.heightWeight.height}cm</span>
                <br />
                <span className="text-white">Weight: {jsonData.heightWeight.weight}kg</span>
              </div>
            </div>
          )}
          
          {jsonData.shapeKeys && (
            <div>
              <span className="text-blue-400">Shape Keys:</span>
              <div className="ml-2">
                <span className="text-white">Chest: {jsonData.shapeKeys.chest?.toFixed(2)}</span>
                <br />
                <span className="text-white">Waist: {jsonData.shapeKeys.waist?.toFixed(2)}</span>
                <br />
                <span className="text-white">Hips: {jsonData.shapeKeys.hips?.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {jsonData.measurements && (
            <div>
              <span className="text-blue-400">Measurements:</span>
              <div className="ml-2">
                <span className="text-white">Chest: {jsonData.measurements.chest}cm</span>
                <br />
                <span className="text-white">Waist: {jsonData.measurements.waist}cm</span>
                <br />
                <span className="text-white">Hip: {jsonData.measurements.hip}cm</span>
              </div>
            </div>
          )}
          
          <div className="mt-2 pt-2 border-t border-gray-600">
            <span className="text-gray-400">Raw Data:</span>
            <pre className="text-xs text-gray-300 mt-1 overflow-x-auto">
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Debug data formatters for different step contexts
 */
export const DebugDataFormatters = {
  step2: (measurements: any, debugData: any, getLocalJSONBasedLimits?: Function) => ({
    measurements: { height: measurements.height, weight: measurements.weight },
    fetchedData: debugData?.heightWeight?.fetchedData || null,
    limits: debugData?.limits || null,
    morphTargets: debugData?.morphTargets || null,
    currentMeasurements: {
      chest: measurements.chest,
      waist: measurements.waist,
      hips: measurements.hips
    },
    ranges: getLocalJSONBasedLimits ? {
      chest: getLocalJSONBasedLimits('chest'),
      waist: getLocalJSONBasedLimits('waist'),
      hips: getLocalJSONBasedLimits('hips')
    } : null
  }),

  step3: (measurements: any, debugData: any) => ({
    measurements: { 
      chest: measurements.chest, 
      waist: measurements.waist, 
      hips: measurements.hips 
    },
    fetchedData: debugData?.heightWeight?.fetchedData?.measurements || null,
    jsonBasedLimits: debugData?.jsonBasedLimits || null,
    userEditedFlags: debugData?.userEditedMeasurements || null
  })
};

/**
 * Morph Debug Panel - Shows 0.36 logic calculations and current morph values
 */
interface MorphDebugPanelProps extends BaseDebugPanelProps {
  morphTargets: Map<string, { name: string; meshes: Array<{ mesh: any; index: number }> }>;
  morphValues: Map<string, number>;
  calculateMorphRange?: (jsonPositionPercent: number) => { min: number; max: number; rangeBelow: number; rangeAbove: number; total: number };
  measurements?: any;
  jsonValues?: { chest?: number; waist?: number; hips?: number };
  sliderRanges?: { 
    chest?: { min: number; max: number }; 
    waist?: { min: number; max: number }; 
    hips?: { min: number; max: number }; 
  };
}

export const MorphDebugPanel: React.FC<MorphDebugPanelProps> = ({ 
  title = "Morph Debug Panel",
  morphTargets,
  morphValues,
  calculateMorphRange,
  measurements,
  jsonValues,
  sliderRanges,
  className = ""
}) => {
  const renderMorphTargetInfo = (morphName: string) => {
    const currentMorphValue = morphValues.get(morphName) || 0;
    const hasData = morphTargets.has(morphName);
    
    // Calculate range info if we have the calculation function and relevant data
    let rangeInfo = null;
    if (calculateMorphRange && jsonValues && sliderRanges && measurements) {
      const measurementType = morphName.includes('Chest') ? 'chest' : 
                             morphName.includes('Waist') ? 'waist' : 
                             morphName.includes('Hips') ? 'hips' : null;
      
      if (measurementType && jsonValues[measurementType] && sliderRanges[measurementType]) {
        const jsonValue = jsonValues[measurementType];
        const sliderRange = sliderRanges[measurementType];
        const sliderSpan = sliderRange.max - sliderRange.min;
        const jsonPositionPercent = (jsonValue - sliderRange.min) / sliderSpan;
        const range = calculateMorphRange(jsonPositionPercent);
        
        rangeInfo = {
          jsonValue,
          jsonPosition: jsonPositionPercent * 100,
          range,
          currentValue: measurements[measurementType],
          sliderRange
        };
      }
    }
    
    return (
      <div key={morphName} className="border-b border-gray-600 pb-2 mb-2">
        <div className="flex justify-between items-center">
          <span className="text-blue-400 font-medium">{morphName}</span>
          <span className={`${Math.abs(currentMorphValue) > 0.001 ? 'text-red-400' : 'text-green-400'}`}>
            {currentMorphValue.toFixed(3)}
          </span>
        </div>
        
        {hasData && (
          <div className="text-xs text-gray-400 mt-1">
            Meshes: {morphTargets.get(morphName)?.meshes.length || 0}
          </div>
        )}
        
        {rangeInfo && (
          <div className="mt-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">JSON:</span> {rangeInfo.jsonValue}cm
              </div>
              <div>
                <span className="text-gray-400">Current:</span> {rangeInfo.currentValue || 'N/A'}cm
              </div>
              <div>
                <span className="text-gray-400">Position:</span> {rangeInfo.jsonPosition.toFixed(1)}%
              </div>
              <div>
                <span className="text-gray-400">Range:</span> {rangeInfo.range.total.toFixed(3)}
              </div>
            </div>
            <div className="mt-1">
              <div className="text-gray-400">
                Min: <span className="text-red-300">{rangeInfo.range.min.toFixed(3)}</span> | 
                Max: <span className="text-green-300">{rangeInfo.range.max.toFixed(3)}</span>
              </div>
              <div className="text-gray-400">
                Below: {rangeInfo.range.rangeBelow.toFixed(3)} | 
                Above: {rangeInfo.range.rangeAbove.toFixed(3)}
              </div>
            </div>
            
            {/* Visual range indicator */}
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2 relative">
                <div 
                  className="absolute top-0 h-2 bg-gradient-to-r from-red-400 to-green-400 rounded-full"
                  style={{ width: '100%' }}
                />
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white"
                  style={{ left: `${rangeInfo.jsonPosition}%` }}
                  title={`JSON at ${rangeInfo.jsonPosition.toFixed(1)}%`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeMorphs = Array.from(morphValues.entries()).filter(([_, value]) => Math.abs(value) > 0.001);
  const totalMorphTargets = morphTargets.size;

  return (
    <div className={`bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono max-h-96 overflow-auto ${className}`}>
      <div className="mb-3">
        <h3 className="text-yellow-400 font-bold mb-1">{title}</h3>
        <div className="text-gray-400 text-xs">
          {new Date().toLocaleTimeString()} | Active: {activeMorphs.length}/{totalMorphTargets}
        </div>
      </div>
      
      {/* Summary */}
      <div className="mb-4 p-2 bg-gray-800 rounded">
        <div className="text-white text-sm mb-2">0.36 Logic Summary</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Total Range: <span className="text-cyan-400">0.360</span></div>
          <div>JSON at Morph: <span className="text-blue-400">0.000</span></div>
          <div>Active Morphs: <span className="text-yellow-400">{activeMorphs.length}</span></div>
          <div>Available: <span className="text-gray-400">{totalMorphTargets}</span></div>
        </div>
      </div>
      
      {/* Active Morphs */}
      {activeMorphs.length > 0 && (
        <div className="mb-4">
          <div className="text-white text-sm mb-2">🔥 Active Morphs</div>
          {activeMorphs.map(([morphName, value]) => renderMorphTargetInfo(morphName))}
        </div>
      )}
      
      {/* Key Morphs (even if inactive) */}
      <div>
        <div className="text-white text-sm mb-2">📊 Key Morphs</div>
        {['Chest Width', 'Belly Size', 'Hips Size', 'male_overweight', 'female_overweight', 'male_height', 'female_height'].map(morphName => {
          if (morphTargets.has(morphName)) {
            return renderMorphTargetInfo(morphName);
          }
          return null;
        })}
      </div>
      
      {/* All Other Morphs (collapsed) */}
      {morphTargets.size > 7 && (
        <details className="mt-4">
          <summary className="text-white text-sm cursor-pointer">All Morph Targets ({morphTargets.size})</summary>
          <div className="mt-2">
            {Array.from(morphTargets.keys())
              .filter(name => !['Chest Width', 'Belly Size', 'Hips Size', 'male_overweight', 'female_overweight', 'male_height', 'female_height'].includes(name))
              .map(morphName => renderMorphTargetInfo(morphName))}
          </div>
        </details>
      )}
    </div>
  );
};

/**
 * Console logging utilities for debug information
 */
export const DebugLogger = {
  step5: (data: {
    isApiLoading: boolean;
    measurementsChanged: boolean;
    apiSizeResult: any;
    hasSize: boolean;
    hasError: boolean;
  }) => {
    console.log('🔍 Desktop Step 5 Debug:', data);
  },

  measurement: (type: string, data: any, isMobile: boolean = false) => {
    const platform = isMobile ? '📱 Mobile' : '🖥️ Desktop';
    console.log(`${platform} ${type} measurement debug:`, data);
  },

  morph: (morphName: string, data: {
    morphValue: number;
    sliderPositionPercent: number;
    jsonPositionPercent: number;
    morphRange: any;
  }) => {
    console.log(`🎯 Morph ${morphName}:`, data);
  }
};
