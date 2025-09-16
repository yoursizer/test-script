import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

interface RadialHeightSliderProps {
  value: number; // height in cm
  onChange: (newValue: number) => void;
  useMetric: boolean;
}

// Helper: convert cm to feet/inches
function cmToFeetInches(cm: number) {
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}

// Helper: convert feet/inches to cm
function feetInchesToCm(feet: number, inches: number) {
  return Math.round((feet * 12 + inches) * 2.54);
}

const MIN_FEET = 4; // Corresponds to ~140cm
const MAX_FEET = 7; // Loop up to 7 to include values up to 6'11" (~210cm)
const MIN_INCHES = 0;
const MAX_INCHES = 11;
const MIN_CM = 140;
const MAX_CM = 210;
const TICK_WIDTH = 18; // px - reduced for mobile
const RULER_PADDING_TICKS = 10; // minimal padding

export const RadialHeightSlider: React.FC<RadialHeightSliderProps> = ({ value, onChange, useMetric }) => {
  // Imperial state
  const { feet, inches } = cmToFeetInches(value);
  const [ft, setFt] = useState(feet);
  const [inch, setInch] = useState(inches);
  // Metric state
  const [cm, setCm] = useState(Math.round(value));
  // Local input states for typing
  const [localFt, setLocalFt] = useState(feet.toString());
  const [localInch, setLocalInch] = useState(inches.toString());
  const [localCm, setLocalCm] = useState(cm.toString());
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);
  const lastClientX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const [dragStartValueCm, setDragStartValueCm] = useState<number | null>(null);

  // Memoize ticks generation to prevent unnecessary recalculations
  const { ticksImperial, ticksMetric, paddedTicks } = useMemo(() => {
    const imperial = [];
    // Generate imperial ticks, but only if their cm equivalent is within the allowed range
    for (let f = MIN_FEET; f <= MAX_FEET; f++) {
      for (let i = 0; i < 12; i++) {
        const cmValue = feetInchesToCm(f, i);
        if (cmValue >= MIN_CM && cmValue <= MAX_CM) {
          const isMajor = i % 6 === 0; // Highlight 6-inch marks
          const isLabel = i % 3 === 0;
          imperial.push({
            feet: f,
            inches: i,
            label: isLabel ? `${f}' ${i}"` : null,
            isMajor,
          });
        }
      }
    }

    const metric = [];
    for (let c = MIN_CM; c <= MAX_CM; c++) {
      const isMajor = c % 5 === 0; // Highlight 5cm marks
      const isLabel = c % 10 === 0;
      metric.push({
        cm: c,
        label: isLabel ? `${c}` : null,
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

    return { ticksImperial: imperial, ticksMetric: metric, paddedTicks: padded };
  }, [useMetric]);

  // Sync state with value prop
  useEffect(() => {
    if (useMetric) {
      setCm(Math.round(value));
      setLocalCm(Math.round(value).toString());
      if (rulerRef.current) {
        // Calculate the exact scroll position for the current cm value
        const targetCm = Math.round(value);
        const cmIndex = targetCm - MIN_CM; // 0-based index in the metric array
        const totalIndex = RULER_PADDING_TICKS + cmIndex; // Add padding offset
        const scrollTo = totalIndex * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
        rulerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
      }
    } else {
      const { feet, inches } = cmToFeetInches(value);
      setFt(feet);
      setInch(inches);
      setLocalFt(feet.toString());
      setLocalInch(inches.toString());
      if (rulerRef.current) {
        // Calculate the exact scroll position for the current feet/inches value
        const feetIndex = (feet - MIN_FEET) * 12 + inches; // 0-based index in imperial array
        const totalIndex = RULER_PADDING_TICKS + feetIndex; // Add padding offset
        const scrollTo = totalIndex * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
        rulerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
      }
    }
  }, [value, useMetric]);

  // Handle number input changes
  const handleFtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(' ft', '');
    setLocalFt(inputValue);
  };

  const handleInchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(' in', '');
    setLocalInch(inputValue);
  };

  const handleCmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(' cm', '');
    setLocalCm(inputValue);
  };

  // Handle input blur events
  const handleFtBlur = () => {
    const parsedValue = parseInt(localFt);
    if (isNaN(parsedValue)) {
      setLocalFt(feet.toString());
      return;
    }
    const newFt = Math.max(MIN_FEET, Math.min(MAX_FEET, parsedValue));
    setFt(newFt);
    setLocalFt(newFt.toString());
    onChange(feetInchesToCm(newFt, inch));
  };

  const handleInchBlur = () => {
    const parsedValue = parseInt(localInch);
    if (isNaN(parsedValue)) {
      setLocalInch(inches.toString());
      return;
    }
    const newInch = Math.max(MIN_INCHES, Math.min(MAX_INCHES, parsedValue));
    setInch(newInch);
    setLocalInch(newInch.toString());
    onChange(feetInchesToCm(ft, newInch));
  };

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

  // Momentum animation function
  const applyMomentum = useCallback(() => {
    if (!rulerRef.current || Math.abs(velocity.current) < 0.5) return;

    const startScroll = rulerRef.current.scrollLeft;
    const momentumDistance = velocity.current * 0.4; // Increased momentum feel

    const targetScroll = Math.max(0, Math.min(
      startScroll + momentumDistance,
      rulerRef.current.scrollWidth - rulerRef.current.offsetWidth
    ));

    let startTime = Date.now();
    const duration = Math.min(800, Math.max(300, Math.abs(velocity.current) * 100)); // Dynamic duration

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

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
        if (tick && typeof tick.cm === "number") {
          setCm(tick.cm);
          setLocalCm(tick.cm.toString());
          onChange(tick.cm);
        }
      } else {
        if (
          tick &&
          typeof tick.feet === "number" &&
          typeof tick.inches === "number"
        ) {
          setFt(tick.feet);
          setInch(tick.inches);
          setLocalFt(tick.feet.toString());
          setLocalInch(tick.inches.toString());
          onChange(feetInchesToCm(tick.feet, tick.inches));
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Snap to nearest tick after momentum
        snapToNearestTick();
      }
    };

    requestAnimationFrame(animate);
  }, [useMetric, paddedTicks, onChange, cm, ft, inch]);

  // Snap to nearest tick
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
      if (tick && typeof tick.cm === "number") {
        setCm(tick.cm);
        setLocalCm(tick.cm.toString());
        onChange(tick.cm);
      }
    } else {
      if (
        tick &&
        typeof tick.feet === "number" &&
        typeof tick.inches === "number"
      ) {
        setFt(tick.feet);
        setInch(tick.inches);
        setLocalFt(tick.feet.toString());
        setLocalInch(tick.inches.toString());
        onChange(feetInchesToCm(tick.feet, tick.inches));
      }
    }

    // Smooth scroll to exact position
    const exactScrollPosition =
      tickIdx * TICK_WIDTH - rulerRef.current.offsetWidth / 2 + TICK_WIDTH / 2;
    rulerRef.current.scrollTo({ left: exactScrollPosition, behavior: "smooth" });
  }, [useMetric, paddedTicks, onChange]);

  // Create a ref to hold the latest state and props.
  // This is the key to solving the "stale closure" problem in event listeners.
  const stateRef = useRef({
    cm,
    ft,
    inch,
    isDragging,
    useMetric,
    onChange,
    paddedTicks,
    applyMomentum,
    snapToNearestTick,
  });

  // Keep the ref updated on every render.
  useEffect(() => {
    stateRef.current = {
      cm,
      ft,
      inch,
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
      // Use the state from the ref to ensure we have the latest values.
      const { cm, ft, inch, useMetric } = stateRef.current;
      setIsDragging(true);
      dragStartX.current =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      lastClientX.current = dragStartX.current;
      scrollStart.current = rulerRef.current ? rulerRef.current.scrollLeft : 0;
      lastTime.current = Date.now();
      velocity.current = 0;
      // Store the starting value of the drag using state to trigger re-render
      setDragStartValueCm(useMetric ? cm : feetInchesToCm(ft, inch));
    },
    [
      /* This callback now has no dependencies, it will never be re-created. */
    ]
  );

  const onDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // We get all the latest state and props directly from the ref.
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

    // Smooth scroll update
    rulerRef.current.scrollLeft = newScrollLeft;

    // Calculate velocity for momentum (before state updates)
    const currentTime = Date.now();
    if (lastTime.current > 0) {
      const deltaTime = currentTime - lastTime.current;
      const deltaX = clientX - lastClientX.current;
      if (deltaTime > 0) {
        velocity.current = (deltaX / deltaTime) * 16; // Scale for 60fps
      }
    }
    lastClientX.current = clientX;
    lastTime.current = currentTime;

    // Update current value in real-time during drag
    const center = newScrollLeft + rulerRef.current.offsetWidth / 2;
    const exactIndex = center / TICK_WIDTH; // Exact position including decimals
    const idx = Math.round(exactIndex); // Round to nearest tick

    // Find the closest valid tick (skip null padding ticks)
    let tickIdx = Math.max(0, Math.min(idx, paddedTicks.length - 1));
    let tick = paddedTicks[tickIdx];

    // If we hit a null tick, find the closest valid tick
    if (!tick) {
      let foundValid = false;
      for (
        let offset = 1;
        offset < paddedTicks.length && !foundValid;
        offset++
      ) {
        // Check right
        if (
          tickIdx + offset < paddedTicks.length &&
          paddedTicks[tickIdx + offset]
        ) {
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
      if (tick && typeof tick.cm === "number") {
        setCm(tick.cm);
        setLocalCm(tick.cm.toString());
        onChange(tick.cm);
      }
    } else {
      if (
        tick &&
        typeof tick.feet === "number" &&
        typeof tick.inches === "number"
      ) {
        setFt(tick.feet);
        setInch(tick.inches);
        setLocalFt(tick.feet.toString());
        setLocalInch(tick.inches.toString());
        onChange(feetInchesToCm(tick.feet, tick.inches));
      }
    }
  }, [
    /* This callback now has no dependencies, it will never be re-created. */
  ]);

  const onDragEnd = useCallback(() => {
    const { applyMomentum, snapToNearestTick } = stateRef.current;
    setIsDragging(false);

    // Apply momentum or snap immediately
    if (Math.abs(velocity.current) > 0.5) {
      applyMomentum();
    } else {
      snapToNearestTick();
    }

    velocity.current = 0;
    lastTime.current = 0;
    lastClientX.current = 0;
    // Clear the drag trail on release by setting state to null
    setDragStartValueCm(null);
  }, [
    /* This callback now has no dependencies, it will never be re-created. */
  ]);

  // Mouse/touch event handlers
  useEffect(() => {
    // Because onDragMove and onDragEnd are now stable, this effect runs only once.
    const handleMouseMove = (e: MouseEvent) => {
      // We check the ref for the most up-to-date dragging state.
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
      <div className="flex justify-center font-bold  relative -translate-y-[20px]">
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
          <>
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={`${ft} ft`}
                readOnly
                className="w-14 text-center border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold bg-gray-50"
              />
            </div>
            <div className="flex flex-col items-center ml-2">
              <input
                type="text"
                value={`${localInch} in`}
                readOnly
                className="w-14 text-center border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold bg-gray-50"
              />
            </div>
          </>
        )}
      </div>

      {/* Ruler */}
      <div className="relative w-full h-16 bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
        {/* Center indicator line has been removed */}

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
              const isSelected = useMetric
                ? tick && tick.cm === cm
                : tick && tick.feet === ft && tick.inches === inch;

              let isInDragTrail = false;
              if (tick && isDragging && dragStartValueCm !== null) {
                const currentValueCm = useMetric
                  ? cm
                  : feetInchesToCm(ft, inch);
                const tickValueCm = useMetric
                  ? tick.cm
                  : feetInchesToCm(tick.feet, tick.inches);

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

export default RadialHeightSlider; 