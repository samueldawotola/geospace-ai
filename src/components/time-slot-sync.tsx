"use client";

import { useEffect } from "react";
import { applyTimeSlot } from "@/lib/time-of-day";

// Keeps <html data-time-slot> current while a page stays open. The inline
// script in app/layout.tsx sets it before first paint; everything themed by
// time of day (backdrop, top bar) reads it from CSS.
export default function TimeSlotSync() {
  useEffect(() => {
    applyTimeSlot();
    const timer = setInterval(() => applyTimeSlot(), 60_000); // re-check every minute
    // Background tabs throttle timers and laptops sleep; catch up on return.
    const onVisible = () => {
      if (document.visibilityState === "visible") applyTimeSlot();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
