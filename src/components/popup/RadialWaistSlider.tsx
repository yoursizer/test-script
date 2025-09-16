import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

interface RadialWaistSliderProps {
  value: number; // waist in cm
  onChange: (newValue: number) => void;
  useMetric: boolean;
}

// Conversion functions
const cmToInches = (cm: number) => Math.round(cm / 2.54);
const inchesToCm = (inches: number) => Math.round(inches * 2.54);

const MIN_CM = 43;  // ~17 inches
const MAX_CM = 134; // ~53 inches
const MIN_INCHES = cmToInches(MIN_CM);
const MAX_INCHES = cmToInches(MAX_CM);
const TICK_WIDTH = 18; // px - reduced for mobile
const RULER_PADDING_TICKS = 10; // minimal padding

export const RadialWaistSlider: React.FC<RadialWaistSliderProps> = ({ value, onChange, useMetric }) => {
  // State for display values
  const [cm, setCm] = useState(Math.round(value));
  const [inches, setInches] = useState(cmToInches(value));
  // Local input states for typing
  const [localCm, setLocalCm] = useState(cm.toString());
  const [localInches, setLocalInches] = useState(inches.toString());
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);
  const lastClientX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const [dragStartValueCm, setDragStartValueCm] = useState<number | null>(null);

  // Memoize ticks generation to prevent unnecessary recalculations
  const { ticksMetric, ticksImperial, paddedTicks } = useMemo(() => {
    const metric = [];
    for (let c = MIN_CM; c <= MAX_CM; c += 1) {
      const isMajor = c % 5 === 0; // Changed from 10 to 5 for more frequent major marks
      const isLabel = c % 10 === 0; // Changed from 20 to 10 for more frequent labels
      metric.push({
        cm: c,
        label: isLabel ? `${c}` : null,
        isMajor,
      });
    }

    const imperial = [];
    for (let i = MIN_INCHES; i <= MAX_INCHES; i += 1) {
      const isMajor = i % 2 === 0; // Changed from 5 to 2 for more frequent major marks
      const isLabel = i % 4 === 0; // Changed from 10 to 4 for more frequent labels
      imperial.push({
        inches: i,
        label: isLabel ? `${i}"` : null,
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
      setCm(Math.round(value));
      setLocalCm(Math.round(value).toString());
      if (rulerRef.current) {
        const targetCm = Math.round(value);
        const cmIndex = (targetCm - MIN_CM) / 2; // 0-based index in the metric array
        const totalIndex = RULER_PADDING_TICKS + cmIndex; // Add padding offset
        const scrollTo = totalIndex * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
        rulerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
      }
    } else {
      const inchesValue = cmToInches(value);
      setInches(inchesValue);
      setLocalInches(inchesValue.toString());
      if (rulerRef.current) {
        const inchesIndex = inchesValue - MIN_INCHES; // 0-based index in imperial array
        const totalIndex = RULER_PADDING_TICKS + inchesIndex; // Add padding offset
        const scrollTo = totalIndex * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
        rulerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
      }
    }
  }, [value, useMetric]);

  // Handle number input changes
  const handleCmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(' cm', '');
    setLocalCm(inputValue);
  };

  const handleInchesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace('"', '');
    setLocalInches(inputValue);
  };

  // Handle input blur events
  const handleCmBlur = () => {
    const parsedValue = parseInt(localCm);
    if (isNaN(parsedValue)) {
      setLocalCm(cm.toString());
      return;
    }
    const newCm = Math.max(MIN_CM, Math.min(MAX_CM, parsedValue));
    setCm(newCm);
    setLocalCm(newCm.toString());
    onChange(newCm);
  };

  const handleInchesBlur = () => {
    const parsedValue = parseInt(localInches);
    if (isNaN(parsedValue)) {
      setLocalInches(inches.toString());
      return;
    }
    const newInches = Math.max(MIN_INCHES, Math.min(MAX_INCHES, parsedValue));
    setInches(newInches);
    setLocalInches(newInches.toString());
    onChange(inchesToCm(newInches));
  };

  // Momentum animation function
  const applyMomentum = useCallback(() => {
    if (!rulerRef.current || Math.abs(velocity.current) < 0.5) return;

    const startScroll = rulerRef.current.scrollLeft;
    const momentumDistance = velocity.current * 0.6;

    const targetScroll = Math.max(0, Math.min(
      startScroll + momentumDistance,
      rulerRef.current.scrollWidth - rulerRef.current.offsetWidth
    ));

    let startTime = Date.now();
    const duration = Math.min(1200, Math.max(400, Math.abs(velocity.current) * 150));

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);

      const currentScroll = startScroll + (targetScroll - startScroll) * easeOut;
      rulerRef.current!.scrollLeft = currentScroll;

      const center = currentScroll + rulerRef.current!.offsetWidth / 2;
      const idx = Math.round(center / TICK_WIDTH);

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
        if (tick && typeof tick.cm === "number") {
          setCm(tick.cm);
          setLocalCm(tick.cm.toString());
          onChange(tick.cm);
        }
      } else {
        if (tick && typeof tick.inches === "number") {
          setInches(tick.inches);
          setLocalInches(tick.inches.toString());
          onChange(inchesToCm(tick.inches));
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        snapToNearestTick();
      }
    };

    requestAnimationFrame(animate);
  }, [useMetric, paddedTicks, onChange]);

  // Snap to nearest tick with smooth transition
  const snapToNearestTick = useCallback(() => {
    if (!rulerRef.current) return;

    const center = rulerRef.current.scrollLeft + rulerRef.current.offsetWidth / 2;
    const exactIndex = center / TICK_WIDTH;
    const idx = Math.round(exactIndex);

    let tickIdx = Math.max(0, Math.min(idx, paddedTicks.length - 1));
    let tick = paddedTicks[tickIdx];

    if (!tick) {
      let foundValid = false;
      for (let offset = 1; offset < paddedTicks.length && !foundValid; offset++) {
        if (tickIdx + offset < paddedTicks.length && paddedTicks[tickIdx + offset]) {
          tick = paddedTicks[tickIdx + offset];
          tickIdx = tickIdx + offset;
          foundValid = true;
        } else if (tickIdx - offset >= 0 && paddedTicks[tickIdx - offset]) {
          tick = paddedTicks[tickIdx - offset];
          tickIdx = tickIdx - offset;
          foundValid = true;
        }
      }
    }

    if (useMetric) {
      if (tick && typeof tick.cm === "number") {
        setCm(tick.cm);
        setLocalCm(tick.cm.toString());
        onChange(tick.cm);
      }
    } else {
      if (tick && typeof tick.inches === "number") {
        setInches(tick.inches);
        setLocalInches(tick.inches.toString());
        onChange(inchesToCm(tick.inches));
      }
    }

    const exactScrollPosition =
      tickIdx * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
    rulerRef.current.scrollTo({
      left: exactScrollPosition,
      behavior: "smooth",
    });
  }, [useMetric, paddedTicks, onChange]);

  // Create a ref to hold the latest state and props
  const stateRef = useRef({
    cm,
    inches,
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
      cm,
      inches,
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
      const { cm, inches, useMetric } = stateRef.current;
      setIsDragging(true);
      dragStartX.current =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      lastClientX.current = dragStartX.current;
      scrollStart.current = rulerRef.current ? rulerRef.current.scrollLeft : 0;
      lastTime.current = Date.now();
      velocity.current = 0;
      setDragStartValueCm(useMetric ? cm : inchesToCm(inches));
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

    requestAnimationFrame(() => {
      rulerRef.current!.scrollLeft = newScrollLeft;
    });

    const currentTime = Date.now();
    if (lastTime.current > 0) {
      const deltaTime = currentTime - lastTime.current;
      const deltaX = clientX - lastClientX.current;
      if (deltaTime > 0) {
        velocity.current = (velocity.current * 0.8) + ((deltaX / deltaTime) * 16 * 0.2);
      }
    }
    lastClientX.current = clientX;
    lastTime.current = currentTime;

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
      if (tick && typeof tick.cm === "number") {
        setCm(tick.cm);
        setLocalCm(tick.cm.toString());
        onChange(tick.cm);
      }
    } else {
      if (tick && typeof tick.inches === "number") {
        setInches(tick.inches);
        setLocalInches(tick.inches.toString());
        onChange(inchesToCm(tick.inches));
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
    setDragStartValueCm(null);
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
    <div className="w-full flex flex-col items-center select-none">
      {/* Inputs */}
      <div className="flex justify-center font-bold relative -translate-y-[20px]">
        {useMetric ? (
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={`${cm} cm`}
              readOnly
              className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold bg-gray-50"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={`${inches}"`}
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
                ? tick && tick.cm === cm
                : tick && tick.inches === inches;

              let isInDragTrail = false;
              if (tick && isDragging && dragStartValueCm !== null) {
                const currentValueCm = useMetric ? cm : inchesToCm(inches);
                const tickValueCm = useMetric
                  ? tick.cm
                  : inchesToCm(tick.inches);

                const start = dragStartValueCm;
                const end = currentValueCm;

                if (
                  (tickValueCm >= start && tickValueCm <= end) ||
                  (tickValueCm <= start && tickValueCm >= end)
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