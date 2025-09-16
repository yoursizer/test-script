import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

interface RadialWeightSliderProps {
  value: number; // weight in kg
  onChange: (newValue: number) => void;
  useMetric: boolean;
}

function kgToLbs(kg: number) {
  return Math.round(kg * 2.20462);
}

function lbsToKg(lbs: number) {
  return Math.round(lbs / 2.20462);
}

const MIN_KG = 40;
const MAX_KG = 150;
const MIN_LBS = kgToLbs(MIN_KG);
const MAX_LBS = kgToLbs(MAX_KG);
const TICK_WIDTH = 18; // px - reduced for mobile
const RULER_PADDING_TICKS = 10; // minimal padding

export const RadialWeightSlider: React.FC<RadialWeightSliderProps> = ({ value, onChange, useMetric }) => {
  // State for display values
  const [kg, setKg] = useState(Math.round(value));
  const [lbs, setLbs] = useState(kgToLbs(value));
  // Local input states for typing
  const [localKg, setLocalKg] = useState(kg.toString());
  const [localLbs, setLocalLbs] = useState(lbs.toString());
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);
  const lastClientX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const [dragStartValueKg, setDragStartValueKg] = useState<number | null>(null);

  // Memoize ticks generation to prevent unnecessary recalculations
  const { ticksMetric, ticksImperial, paddedTicks } = useMemo(() => {
    const metric = [];
    for (let k = MIN_KG; k <= MAX_KG; k += 1) {
      const isMajor = k % 5 === 0; // Highlight every 5kg marks
      const isLabel = k % 10 === 0; // Label every 10kg
      metric.push({
        kg: k,
        label: isLabel ? `${k}` : null,
        isMajor,
      });
    }

    const imperial = [];
    // Round MIN_LBS and MAX_LBS to nearest whole number
    const roundedMinLbs = Math.floor(MIN_LBS);
    const roundedMaxLbs = Math.ceil(MAX_LBS);
    for (let l = roundedMinLbs; l <= roundedMaxLbs; l += 1) {
      const isMajor = l % 5 === 0; // Highlight every 5lbs marks
      const isLabel = l % 10 === 0; // Label every 10lbs
      imperial.push({
        lbs: l,
        label: isLabel ? `${l}` : null,
        isMajor,
      });
    }

    const padded = useMetric
      ? [
        ...Array(RULER_PADDING_TICKS).fill(null),
        ...metric,
        ...Array(RULER_PADDING_TICKS).fill(null),
      ]
      : [
        ...Array(RULER_PADDING_TICKS).fill(null),
        ...imperial,
        ...Array(RULER_PADDING_TICKS).fill(null),
      ];

    return { ticksMetric: metric, ticksImperial: imperial, paddedTicks: padded };
  }, [useMetric]);

  // Sync state with value prop
  useEffect(() => {
    if (useMetric) {
      setKg(Math.round(value));
      setLocalKg(Math.round(value).toString());
      if (rulerRef.current) {
        // Calculate the exact scroll position for the current kg value
        const targetKg = Math.round(value);
        const kgIndex = targetKg - MIN_KG; // 0-based index in the metric array
        const totalIndex = RULER_PADDING_TICKS + kgIndex; // Add padding offset
        const scrollTo = totalIndex * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
        rulerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
      }
    } else {
      const lbsValue = kgToLbs(value);
      setLbs(lbsValue);
      setLocalLbs(lbsValue.toString());
      if (rulerRef.current) {
        // Calculate the exact scroll position for the current lbs value
        const lbsIndex = lbsValue - MIN_LBS; // 0-based index in imperial array
        const totalIndex = RULER_PADDING_TICKS + lbsIndex; // Add padding offset
        const scrollTo = totalIndex * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
        rulerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
      }
    }
  }, [value, useMetric]);

  // Handle number input changes
  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(' kg', '');
    setLocalKg(inputValue);
  };

  const handleLbsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(' lbs', '');
    setLocalLbs(inputValue);
  };

  // Handle input blur events
  const handleKgBlur = () => {
    const parsedValue = parseInt(localKg);
    if (isNaN(parsedValue)) {
      setLocalKg(kg.toString());
      return;
    }
    const newKg = Math.max(MIN_KG, Math.min(MAX_KG, parsedValue));
    setKg(newKg);
    setLocalKg(newKg.toString());
    onChange(newKg);
  };

  const handleLbsBlur = () => {
    const parsedValue = parseInt(localLbs);
    if (isNaN(parsedValue)) {
      setLocalLbs(lbs.toString());
      return;
    }
    const newLbs = Math.max(MIN_LBS, Math.min(MAX_LBS, parsedValue));
    setLbs(newLbs);
    setLocalLbs(newLbs.toString());
    onChange(lbsToKg(newLbs));
  };

  // Momentum animation function
  const applyMomentum = useCallback(() => {
    if (!rulerRef.current || Math.abs(velocity.current) < 0.5) return;

    const startScroll = rulerRef.current.scrollLeft;
    const momentumDistance = velocity.current * 0.6; // Increased momentum multiplier for smoother feel

    const targetScroll = Math.max(0, Math.min(
      startScroll + momentumDistance,
      rulerRef.current.scrollWidth - rulerRef.current.offsetWidth
    ));

    let startTime = Date.now();
    const duration = Math.min(1200, Math.max(400, Math.abs(velocity.current) * 150)); // Increased duration for smoother animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Using cubic-bezier-like easing for smoother deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4);

      const currentScroll = startScroll + (targetScroll - startScroll) * easeOut;
      rulerRef.current!.scrollLeft = currentScroll;

      // Update values during momentum animation too
      const center = currentScroll + rulerRef.current!.offsetWidth / 2;
      const idx = Math.round(center / TICK_WIDTH);

      // Find the closest valid tick (skip null padding ticks)
      let tickIdx = Math.max(0, Math.min(idx, paddedTicks.length - 1));
      let tick = paddedTicks[tickIdx];

      // If we hit a null tick, find the closest valid tick
      if (!tick) {
        let foundValid = false;
        for (let offset = 1; offset < paddedTicks.length && !foundValid; offset++) {
          // Check right
          if (tickIdx + offset < paddedTicks.length && paddedTicks[tickIdx + offset]) {
            tick = paddedTicks[tickIdx + offset];
            foundValid = true;
          }
          // Check left
          else if (tickIdx - offset >= 0 && paddedTicks[tickIdx - offset]) {
            tick = paddedTicks[tickIdx - offset];
            foundValid = true;
          }
        }
      }

      if (useMetric) {
        if (tick && typeof tick.kg === "number") {
          setKg(tick.kg);
          setLocalKg(tick.kg.toString());
          onChange(tick.kg);
        }
      } else {
        if (tick && typeof tick.lbs === "number") {
          setLbs(tick.lbs);
          setLocalLbs(tick.lbs.toString());
          onChange(lbsToKg(tick.lbs));
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Snap to nearest tick after momentum with smooth transition
        snapToNearestTick();
      }
    };

    requestAnimationFrame(animate);
  }, [useMetric, paddedTicks, onChange]);

  // Snap to nearest tick with smooth transition
  const snapToNearestTick = useCallback(() => {
    if (!rulerRef.current) return;

    const center = rulerRef.current.scrollLeft + rulerRef.current.offsetWidth / 2;
    const exactIndex = center / TICK_WIDTH; // Exact position including decimals
    const idx = Math.round(exactIndex); // Round to nearest tick

    // Find the closest valid tick (skip null padding ticks)
    let tickIdx = Math.max(0, Math.min(idx, paddedTicks.length - 1));
    let tick = paddedTicks[tickIdx];

    // If we hit a null tick, find the closest valid tick
    if (!tick) {
      let foundValid = false;
      for (let offset = 1; offset < paddedTicks.length && !foundValid; offset++) {
        // Check right
        if (tickIdx + offset < paddedTicks.length && paddedTicks[tickIdx + offset]) {
          tick = paddedTicks[tickIdx + offset];
          tickIdx = tickIdx + offset;
          foundValid = true;
        }
        // Check left
        else if (tickIdx - offset >= 0 && paddedTicks[tickIdx - offset]) {
          tick = paddedTicks[tickIdx - offset];
          tickIdx = tickIdx - offset;
          foundValid = true;
        }
      }
    }

    if (useMetric) {
      if (tick && typeof tick.kg === "number") {
        setKg(tick.kg);
        setLocalKg(tick.kg.toString());
        onChange(tick.kg);
      }
    } else {
      if (tick && typeof tick.lbs === "number") {
        setLbs(tick.lbs);
        setLocalLbs(tick.lbs.toString());
        onChange(lbsToKg(tick.lbs));
      }
    }

    // Smooth scroll to exact position with improved easing
    const exactScrollPosition =
      tickIdx * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
    rulerRef.current.scrollTo({
      left: exactScrollPosition,
      behavior: "smooth",
    });
  }, [useMetric, paddedTicks, onChange]);

  // Create a ref to hold the latest state and props
  const stateRef = useRef({
    kg,
    lbs,
    isDragging,
    useMetric,
    onChange,
    paddedTicks,
    applyMomentum,
    snapToNearestTick,
  });

  // Keep the ref updated on every render
  useEffect(() => {
    stateRef.current = {
      kg,
      lbs,
      isDragging,
      useMetric,
      onChange,
      paddedTicks,
      applyMomentum,
      snapToNearestTick,
    };
  });

  // Optimized drag handlers
  const onDragStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      const { kg, lbs, useMetric } = stateRef.current;
      setIsDragging(true);
      dragStartX.current =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      lastClientX.current = dragStartX.current;
      scrollStart.current = rulerRef.current ? rulerRef.current.scrollLeft : 0;
      lastTime.current = Date.now();
      velocity.current = 0;
      setDragStartValueKg(useMetric ? kg : lbsToKg(lbs));
    },
    []
  );

  const onDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const { paddedTicks, useMetric, onChange } = stateRef.current;

    if (!rulerRef.current) return;

    e.preventDefault();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const dx = dragStartX.current - clientX;
    const newScrollLeft = Math.max(
      0,
      Math.min(
        scrollStart.current + dx,
        rulerRef.current.scrollWidth - rulerRef.current.offsetWidth
      )
    );

    // Smooth scroll update with improved performance
    requestAnimationFrame(() => {
      rulerRef.current!.scrollLeft = newScrollLeft;
    });

    // Calculate velocity for momentum with improved precision
    const currentTime = Date.now();
    if (lastTime.current > 0) {
      const deltaTime = currentTime - lastTime.current;
      const deltaX = clientX - lastClientX.current;
      if (deltaTime > 0) {
        // Improved velocity calculation with smoothing
        velocity.current = (velocity.current * 0.8) + ((deltaX / deltaTime) * 16 * 0.2);
      }
    }
    lastClientX.current = clientX;
    lastTime.current = currentTime;

    // Update current value in real-time during drag
    const center = newScrollLeft + rulerRef.current.offsetWidth / 2;
    const exactIndex = center / TICK_WIDTH;
    const idx = Math.round(exactIndex);

    let tickIdx = Math.max(0, Math.min(idx, paddedTicks.length - 1));
    let tick = paddedTicks[tickIdx];

    if (!tick) {
      let foundValid = false;
      for (let offset = 1; offset < paddedTicks.length && !foundValid; offset++) {
        if (tickIdx + offset < paddedTicks.length && paddedTicks[tickIdx + offset]) {
          tick = paddedTicks[tickIdx + offset];
          foundValid = true;
        } else if (tickIdx - offset >= 0 && paddedTicks[tickIdx - offset]) {
          tick = paddedTicks[tickIdx - offset];
          foundValid = true;
        }
      }
    }

    if (useMetric) {
      if (tick && typeof tick.kg === "number") {
        setKg(tick.kg);
        setLocalKg(tick.kg.toString());
        onChange(tick.kg);
      }
    } else {
      if (tick && typeof tick.lbs === "number") {
        setLbs(tick.lbs);
        setLocalLbs(tick.lbs.toString());
        onChange(lbsToKg(tick.lbs));
      }
    }
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
    setDragStartValueKg(null);
  }, []);

  // Mouse/touch event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (stateRef.current.isDragging) {
        onDragMove(e as any);
      }
    };

    const handleMouseUp = () => {
      if (stateRef.current.isDragging) {
        onDragEnd();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (stateRef.current.isDragging) {
        onDragMove(e as any);
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

  return (
    <div className="w-full flex flex-col items-center select-none mb-2">
      {/* Inputs */}
      <div className="flex justify-center font-bold relative -translate-y-[20px]">
        {useMetric ? (
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={`${kg} kg`}
              readOnly
              className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold bg-gray-50"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={`${lbs} lbs`}
              readOnly
              className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* Ruler */}
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
          onTouchStart={(e) => {
            e.preventDefault();
            onDragStart(e);
          }}
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
              const isSelected = useMetric
                ? tick && tick.kg === kg
                : tick && tick.lbs === lbs;

              let isInDragTrail = false;
              if (tick && isDragging && dragStartValueKg !== null) {
                const currentValueKg = useMetric ? kg : lbsToKg(lbs);
                const tickValueKg = useMetric
                  ? tick.kg
                  : lbsToKg(tick.lbs);

                const start = dragStartValueKg;
                const end = currentValueKg;

                if (
                  (tickValueKg >= start && tickValueKg <= end) ||
                  (tickValueKg <= start && tickValueKg >= end)
                ) {
                  isInDragTrail = true;
                }
              }

              const isLabelTick = tick?.label !== null;
              const isMajorTick = tick?.isMajor;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-start h-full"
                  style={{
                    width: TICK_WIDTH,
                    minWidth: TICK_WIDTH,
                  }}
                >
                  {/* Label at top */}
                  <div className="flex items-start justify-center pt-1">
                    {tick && tick.label && (
                      <div className="text-xs font-medium text-gray-600 whitespace-nowrap">
                        {tick.label}
                      </div>
                    )}
                  </div>

                  {/* Tick mark */}
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
                              : isMajorTick
                                ? " bg-gray-500"
                                : " bg-gray-300")
                          : "bg-transparent"
                      }
                      style={{
                        width: isSelected
                          ? "3px"
                          : isLabelTick
                            ? "2.5px"
                            : isMajorTick
                              ? "2.5px"
                              : "1.5px",
                        height: isSelected
                          ? "32px"
                          : isLabelTick
                            ? "28px"
                            : isMajorTick
                              ? "22px"
                              : "16px",
                        borderRadius: "2px",
                      }}
                    ></div>
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