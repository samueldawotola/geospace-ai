"use client";

import { useSyncExternalStore } from "react";

import DotCursor from "@/components/dot-cursor";
import { TIME_SLOTS } from "@/lib/time-of-day";

// Mouse/trackpad users only: touch screens have no cursor to replace, and the
// trail is constant motion, so reduced-motion visitors keep the native cursor.
const QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function subscribeQuery(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// <html data-time-slot> is set before paint and kept current by TimeSlotSync.
function subscribeSlot(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-time-slot"] });
  return () => observer.disconnect();
}

/** Site-wide dot cursor whose head and trail follow the time of day. */
export default function TimeOfDayCursor() {
  const enabled = useSyncExternalStore(
    subscribeQuery,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  const slotId = useSyncExternalStore(
    subscribeSlot,
    () => document.documentElement.dataset.timeSlot,
    () => undefined,
  );

  if (!enabled) return null;
  const slot = TIME_SLOTS.find((s) => s.id === slotId) ?? TIME_SLOTS[0];

  return (
    <DotCursor
      label={false}
      size={16}
      headColor={slot.cursor.head}
      trailColor={slot.cursor.trail}
      style={{ position: "fixed", inset: 0, zIndex: 2147483647 }}
    />
  );
}
