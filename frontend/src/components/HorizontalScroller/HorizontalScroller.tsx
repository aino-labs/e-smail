import React, { useRef, useEffect, useCallback, useState } from "react";
import "./HorizontalScroller.scss";

interface HorizontalScrollerProps {
  className?: string;
  style?: Record<string, string>;
  children?: React.ReactNode;
}

const HorizontalScroller: React.FC<HorizontalScrollerProps> = ({
  className = "",
  style = {},
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);
  const touchStartX = useRef(0);

  const [showFade, setShowFade] = useState(false);

  const updateFadeState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth;
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth;
    setShowFade(overflowing && !isAtEnd);
  }, []);

  const startLoop = useCallback(() => {
    if (rafId.current !== null) return;

    const step = () => {
      const el = containerRef.current;
      if (!el) return;

      const diff = targetScroll.current - currentScroll.current;

      if (Math.abs(diff) < 0.3 && Math.abs(velocity.current) < 0.1) {
        currentScroll.current = targetScroll.current;
        el.scrollLeft = currentScroll.current;
        rafId.current = null;
        updateFadeState();
        return;
      }

      currentScroll.current += diff * 0.2;
      velocity.current *= 0.5;
      currentScroll.current += velocity.current;

      const max = el.scrollWidth - el.clientWidth;
      currentScroll.current = Math.max(0, Math.min(max, currentScroll.current));
      targetScroll.current = currentScroll.current;

      el.scrollLeft = currentScroll.current;
      updateFadeState();

      rafId.current = requestAnimationFrame(step);
    };

    rafId.current = requestAnimationFrame(step);
  }, [updateFadeState]);

  const addDelta = useCallback(
    (delta: number) => {
      const el = containerRef.current;
      if (!el) return;

      const max = el.scrollWidth - el.clientWidth;
      targetScroll.current += delta;
      targetScroll.current = Math.max(0, Math.min(max, targetScroll.current));
      velocity.current += delta * 0.08;

      if (rafId.current === null) {
        startLoop();
      }
    },
    [startLoop],
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      let rawDelta = event.deltaY + event.deltaX;
      if (event.deltaMode === 1) {
        rawDelta *= 16;
      }
      addDelta(rawDelta * 2);
    },
    [addDelta],
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    velocity.current = 0;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const dx = touchStartX.current - e.touches[0].clientX;
      touchStartX.current = e.touches[0].clientX;
      addDelta(dx);
    },
    [addDelta],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });

    const observer = new ResizeObserver(() => {
      updateFadeState();
    });
    observer.observe(el);

    updateFadeState();

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      observer.disconnect();
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, updateFadeState]);

  return (
    <div
      className={`horizontal-scroller ${className} ${
        showFade ? "has-overflow-fade" : ""
      }`}
      style={style}
      ref={containerRef}
    >
      {children}
    </div>
  );
};

export default HorizontalScroller;
