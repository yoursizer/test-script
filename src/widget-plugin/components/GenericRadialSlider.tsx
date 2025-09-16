import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

export type MeasurementType = 'height' | 'weight' | 'chest' | 'waist' | 'hips';

interface GenericRadialSliderProps {
  value: number;
  onChange: (newValue: number) => void;
  useMetric: boolean;
  measurementType: MeasurementType;
  fetchedValue?: number; // For dynamic range calculations (chest, waist, hips)
}

// Type definitions for measurement configurations
interface BaseConfig {
  min: number;
  max: number;
  majorTick: number;
  labelTick: number;
  unit: string;
}

interface HeightConfig {
  metric: BaseConfig;
  imperial: BaseConfig;
  conversion: {
    toImperial: (cm: number) => { feet: number; inches: number };
    fromImperial: (feet: number, inches: number) => number;
  };
}

interface StandardConfig {
  metric: BaseConfig;
  imperial: BaseConfig;
  conversion: {
    toImperial: (value: number) => number;
    fromImperial: (value: number) => number;
  };
  dynamicRange?: boolean;
}

type MeasurementConfig = {
  height: HeightConfig;
  weight: StandardConfig;
  chest: StandardConfig;
  waist: StandardConfig;
  hips: StandardConfig;
};

// Tick type definitions
interface HeightTick {
  value: { feet: number; inches: number };
  label: string | null;
  isMajor: boolean;
  cmValue: number;
}

interface StandardTick {
  value: number;
  label: string | null;
  isMajor: boolean;
}

type Tick = HeightTick | StandardTick;

// Configuration for different measurement types
const MEASUREMENT_CONFIG: MeasurementConfig = {
  height: {
    metric: { min: 137, max: 210, majorTick: 5, labelTick: 10, unit: 'cm' },
    imperial: { min: 4, max: 7, majorTick: 6, labelTick: 3, unit: 'ft/in' },
    conversion: {
      toImperial: (cm: number) => {
        const totalInches = Math.round(cm / 2.54);
        return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
      },
      fromImperial: (feet: number, inches: number) => Math.round((feet * 12 + inches) * 2.54)
    }
  },
  weight: {
    metric: { min: 40, max: 150, majorTick: 5, labelTick: 10, unit: 'kg' },
    imperial: { min: 77, max: 331, majorTick: 10, labelTick: 25, unit: 'lbs' },
    conversion: {
      toImperial: (kg: number) => Math.round(kg * 2.20462),
      fromImperial: (lbs: number) => Math.round(lbs / 2.20462)
    }
  },
  chest: {
    metric: { min: 86.5, max: 154.4, majorTick: 5, labelTick: 10, unit: 'cm' },
    imperial: { min: 28, max: 59, majorTick: 5, labelTick: 10, unit: 'in' },
    conversion: {
      toImperial: (cm: number) => Math.round(cm / 2.54),
      fromImperial: (inches: number) => Math.round(inches * 2.54)
    },
    dynamicRange: true
  },
  waist: {
    metric: { min: 71.5, max: 134, majorTick: 5, labelTick: 10, unit: 'cm' },
    imperial: { min: 24, max: 55, majorTick: 5, labelTick: 10, unit: 'in' },
    conversion: {
      toImperial: (cm: number) => Math.round(cm / 2.54),
      fromImperial: (inches: number) => Math.round(inches * 2.54)
    },
    dynamicRange: true
  },
  hips: {
    metric: { min: 90.7, max: 150.5, majorTick: 5, labelTick: 10, unit: 'cm' },
    imperial: { min: 28, max: 59, majorTick: 5, labelTick: 10, unit: 'in' },
    conversion: {
      toImperial: (cm: number) => Math.round(cm / 2.54),
      fromImperial: (inches: number) => Math.round(inches * 2.54)
    },
    dynamicRange: true
  }
};

const TICK_WIDTH = 18;
const RULER_PADDING_TICKS = 10;

// Dynamic range calculation for chest, waist, hips
const calculateDynamicRange = (fetchedValue: number, config: BaseConfig) => {
  const idealMin = fetchedValue - 6;
  const idealMax = fetchedValue + 6;
  
  if (idealMin >= config.min && idealMax <= config.max) {
    return { min: idealMin, max: idealMax };
  }
  
  if (idealMax > config.max) {
    return { min: Math.max(config.min, config.max - 12), max: config.max };
  }
  
  if (idealMin < config.min) {
    return { min: config.min, max: Math.min(config.max, config.min + 12) };
  }
  
  return { min: idealMin, max: idealMax };
};

export const GenericRadialSlider: React.FC<GenericRadialSliderProps> = ({
  value,
  onChange,
  useMetric,
  measurementType,
  fetchedValue
}) => {
  const config = MEASUREMENT_CONFIG[measurementType];
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);
  const lastClientX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const [dragStartValueCm, setDragStartValueCm] = useState<number | null>(null);

  // Calculate display values
  const displayValue = useMemo(() => {
    if (useMetric) {
      return Math.round(value);
    } else {
      if (measurementType === 'height') {
        return config.conversion.toImperial(value);
      } else {
        return config.conversion.toImperial(value);
      }
    }
  }, [value, useMetric, measurementType, config]);

  // Generate ticks based on measurement type and unit
  const { ticks, paddedTicks } = useMemo(() => {
    const currentConfig = useMetric ? config.metric : config.imperial;
    let range = { min: currentConfig.min, max: currentConfig.max };
    
    // Apply dynamic range for chest, waist, hips
    const hasDynamicRange = 'dynamicRange' in config && config.dynamicRange;
    if (hasDynamicRange && fetchedValue) {
      const baseValue = useMetric ? fetchedValue : (config as StandardConfig).conversion.toImperial(fetchedValue);
      range = calculateDynamicRange(baseValue, currentConfig);
    }

    const tickArray: Tick[] = [];
    
    if (measurementType === 'height' && !useMetric) {
      // Special handling for imperial height (feet/inches)
      for (let f = range.min; f <= range.max; f++) {
        for (let i = 0; i < 12; i++) {
          const cmValue = config.conversion.fromImperial(f, i);
          if (cmValue >= config.metric.min && cmValue <= config.metric.max) {
            const isMajor = i % 6 === 0;
            const isLabel = i % 3 === 0;
            tickArray.push({
              value: { feet: f, inches: i },
              label: isLabel ? `${f}' ${i}"` : null,
              isMajor,
              cmValue
            });
          }
        }
      }
    } else {
      // Standard numeric ticks
      for (let val = range.min; val <= range.max; val++) {
        const isMajor = val % currentConfig.majorTick === 0;
        const isLabel = val % currentConfig.labelTick === 0;
        tickArray.push({
          value: val,
          label: isLabel ? `${val}${currentConfig.unit === 'in' ? '"' : ''}` : null,
          isMajor
        });
      }
    }

    const padded = [
      ...Array(RULER_PADDING_TICKS).fill(null),
      ...tickArray,
      ...Array(RULER_PADDING_TICKS).fill(null)
    ];

    return { ticks: tickArray, paddedTicks: padded };
  }, [useMetric, measurementType, config, fetchedValue]);

  // Sync scroll position with value
  useEffect(() => {
    if (!rulerRef.current) return;
    
    let targetIndex = 0;
    
    if (measurementType === 'height' && !useMetric) {
      const { feet, inches } = displayValue as { feet: number; inches: number };
      const feetIndex = (feet - config.imperial.min) * 12 + inches;
      targetIndex = RULER_PADDING_TICKS + feetIndex;
    } else {
      const numValue = displayValue as number;
      const currentConfig = useMetric ? config.metric : config.imperial;
      let range = { min: currentConfig.min, max: currentConfig.max };
      
      const hasDynamicRange = 'dynamicRange' in config && config.dynamicRange;
      if (hasDynamicRange && fetchedValue) {
        const baseValue = useMetric ? fetchedValue : (config as StandardConfig).conversion.toImperial(fetchedValue);
        range = calculateDynamicRange(baseValue, currentConfig);
      }
      
      const valueIndex = numValue - range.min;
      targetIndex = RULER_PADDING_TICKS + valueIndex;
    }
    
    const scrollTo = targetIndex * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
    rulerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
  }, [value, useMetric, measurementType, fetchedValue, displayValue, config]);

  // Momentum animation
  const applyMomentum = useCallback(() => {
    if (!rulerRef.current || Math.abs(velocity.current) < 0.5) return;

    const startScroll = rulerRef.current.scrollLeft;
    const momentumDistance = velocity.current * 0.6;
    const targetScroll = Math.max(0, Math.min(
      startScroll + momentumDistance,
      rulerRef.current.scrollWidth - rulerRef.current.offsetWidth
    ));

    const startTime = Date.now();
    const duration = Math.min(1000, Math.max(400, Math.abs(velocity.current) * 150));

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentScroll = startScroll + (targetScroll - startScroll) * easeOut;
      rulerRef.current!.scrollLeft = currentScroll;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        snapToNearestTick();
      }
    };

    requestAnimationFrame(animate);
  }, [paddedTicks, useMetric, measurementType, config, onChange]);

  // Snap to nearest tick
  const snapToNearestTick = useCallback(() => {
    if (!rulerRef.current) return;

    const center = rulerRef.current.scrollLeft + rulerRef.current.offsetWidth / 2;
    const idx = Math.round(center / TICK_WIDTH);
    let tickIdx = Math.max(0, Math.min(idx, paddedTicks.length - 1));
    let tick = paddedTicks[tickIdx];

    // Find valid tick if we hit padding
    if (!tick) {
      for (let offset = 1; offset < paddedTicks.length; offset++) {
        if (tickIdx + offset < paddedTicks.length && paddedTicks[tickIdx + offset]) {
          tick = paddedTicks[tickIdx + offset];
          tickIdx = tickIdx + offset;
          break;
        } else if (tickIdx - offset >= 0 && paddedTicks[tickIdx - offset]) {
          tick = paddedTicks[tickIdx - offset];
          tickIdx = tickIdx - offset;
          break;
        }
      }
    }

    if (tick) {
      let newValue: number;
      
      if (measurementType === 'height' && !useMetric) {
        const { feet, inches } = tick.value as { feet: number; inches: number };
        newValue = (config as HeightConfig).conversion.fromImperial(feet, inches);
      } else {
        const numValue = tick.value as number;
        newValue = useMetric ? numValue : (config as StandardConfig).conversion.fromImperial(numValue);
      }
      
      onChange(newValue);
    }

    // Smooth scroll to position
    const exactScrollPosition = tickIdx * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
    rulerRef.current.scrollTo({ left: exactScrollPosition, behavior: "smooth" });
  }, [paddedTicks, useMetric, measurementType, config, onChange]);

  // State ref for stable callbacks
  const stateRef = useRef({ isDragging, paddedTicks, applyMomentum, snapToNearestTick, onChange });
  
  useEffect(() => {
    stateRef.current = { isDragging, paddedTicks, applyMomentum, snapToNearestTick, onChange };
  });

  // Drag handlers
  const onDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    lastClientX.current = dragStartX.current;
    scrollStart.current = rulerRef.current ? rulerRef.current.scrollLeft : 0;
    lastTime.current = Date.now();
    velocity.current = 0;
    setDragStartValueCm(value);
  }, [value]);

  const onDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!rulerRef.current) return;

    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const dx = dragStartX.current - clientX;
    const newScrollLeft = Math.max(0, Math.min(
      scrollStart.current + dx,
      rulerRef.current.scrollWidth - rulerRef.current.offsetWidth
    ));

    rulerRef.current.scrollLeft = newScrollLeft;

    // Calculate velocity
    const currentTime = Date.now();
    if (lastTime.current > 0) {
      const deltaTime = currentTime - lastTime.current;
      const deltaX = clientX - lastClientX.current;
      if (deltaTime > 0) {
        velocity.current = (deltaX / deltaTime) * 16;
      }
    }
    lastClientX.current = clientX;
    lastTime.current = currentTime;
  }, []);

  const onDragEnd = useCallback(() => {
    const { applyMomentum, snapToNearestTick } = stateRef.current;
    setIsDragging(false);

    if (Math.abs(velocity.current) > 0.5) {
      applyMomentum();
    } else {
      snapToNearestTick();
    }

    velocity.current = 0;
    lastTime.current = 0;
    lastClientX.current = 0;
    setDragStartValueCm(null);
  }, []);

  // Mouse/touch event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (stateRef.current.isDragging) {
        onDragMove(e as unknown as React.MouseEvent);
      }
    };

    const handleMouseUp = () => {
      if (stateRef.current.isDragging) {
        onDragEnd();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (stateRef.current.isDragging) {
        onDragMove(e as unknown as React.TouchEvent);
      }
    };

    const handleTouchEnd = () => {
      if (stateRef.current.isDragging) {
        onDragEnd();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onDragMove, onDragEnd]);

  // Render input display
  const renderInput = () => {
    if (measurementType === 'height' && !useMetric) {
      const { feet, inches } = displayValue as { feet: number; inches: number };
      return (
        <div className="flex justify-center font-bold relative -translate-y-[20px]">
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={`${feet} ft`}
              readOnly
              className="w-14 text-center border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold bg-gray-50"
            />
          </div>
          <div className="flex flex-col items-center ml-2">
            <input
              type="text"
              value={`${inches} in`}
              readOnly
              className="w-14 text-center border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold bg-gray-50"
            />
          </div>
        </div>
      );
    } else {
      const unit = useMetric ? config.metric.unit : config.imperial.unit;
      return (
        <div className="flex justify-center font-bold relative -translate-y-[20px]">
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={`${displayValue} ${unit}`}
              readOnly
              className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold bg-gray-50"
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none mb-2">
      {renderInput()}
      
      <div className="relative w-full h-16 bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
        <div
          ref={rulerRef}
          className="ruler-container w-full h-full overflow-x-auto overflow-y-hidden relative touch-pan-x"
          style={{
            WebkitOverflowScrolling: "touch",
            background: "#ffffff",
            cursor: isDragging ? 'grabbing' : 'grab',
            overscrollBehavior: 'none',
            touchAction: 'pan-x',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onTouchStart={onDragStart}
          onMouseDown={onDragStart}
        >
          <style>{`
            .ruler-container::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div
            className="flex items-end h-full px-2"
            style={{
              minWidth: paddedTicks.length * TICK_WIDTH,
              width: paddedTicks.length * TICK_WIDTH,
            }}
          >
            {paddedTicks.map((tick, idx) => {
              const isSelected = tick && (
                (measurementType === 'height' && !useMetric) 
                  ? tick.value.feet === (displayValue as { feet: number; inches: number }).feet && tick.value.inches === (displayValue as { feet: number; inches: number }).inches
                  : tick.value === displayValue
              );

              let isInDragTrail = false;
              if (tick && isDragging && dragStartValueCm !== null) {
                const currentValueCm = value;
                let tickValueCm: number;
                
                if ('cmValue' in tick) {
                  // Height tick with cmValue
                  tickValueCm = tick.cmValue;
                } else if (useMetric) {
                  // Metric tick
                  tickValueCm = tick.value as number;
                } else {
                  // Imperial tick
                  if (measurementType === 'height') {
                    const { feet, inches } = tick.value as { feet: number; inches: number };
                    tickValueCm = (config as HeightConfig).conversion.fromImperial(feet, inches);
                  } else {
                    tickValueCm = (config as StandardConfig).conversion.fromImperial(tick.value as number);
                  }
                }
                
                const start = dragStartValueCm;
                const end = currentValueCm;

                if ((tickValueCm >= start && tickValueCm <= end) || (tickValueCm <= start && tickValueCm >= end)) {
                  isInDragTrail = true;
                }
              }

              const isLabelTick = tick?.label !== null;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-start h-full"
                  style={{
                    width: TICK_WIDTH,
                    minWidth: TICK_WIDTH,
                  }}
                >
                  <div className="flex items-start justify-center pt-1">
                    {tick && tick.label && (
                      <div className="text-xs font-medium text-gray-600 whitespace-nowrap">
                        {tick.label}
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-1 relative flex justify-center items-end"
                    style={{ zIndex: isSelected ? 20 : 1, height: "40px" }}
                  >
                    <div
                      className={
                        tick
                          ? `transition-all duration-100 ease-in-out` +
                          (isSelected
                            ? " bg-blue-500"
                            : isInDragTrail
                              ? " bg-blue-300"
                              : tick.isMajor
                                ? " bg-gray-500"
                                : " bg-gray-300")
                          : "bg-transparent"
                      }
                      style={{
                        width: isSelected
                          ? "3px"
                          : isLabelTick
                            ? "2.5px"
                            : tick?.isMajor
                              ? "2.5px"
                              : "1.5px",
                        height: isSelected
                          ? "32px"
                          : isLabelTick
                            ? "28px"
                            : tick?.isMajor
                              ? "22px"
                              : "16px",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericRadialSlider;