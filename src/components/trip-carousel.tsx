"use client";

import { useSyncExternalStore } from "react";
import RoundCarousel from "@/components/round-carousel";
import { TripSearch } from "@/components/trip-search";

export type TripFace = { src?: string; title: string; href: string };

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

// Face width by viewport; the ring's radius scales with it.
function faceWidth(viewport: number) {
  if (viewport < 640) return 170;
  if (viewport < 1024) return 230;
  return 280;
}

/**
 * The collection page: every trip as a face on a spinning rotunda over the
 * time-of-day backdrop. Fills the viewport behind the sticky nav (z-30).
 */
export function TripCarousel({ trips }: { trips: TripFace[] }) {
  // Server snapshot is a desktop width; React swaps in the real one after
  // hydration without a mismatch.
  const viewport = useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 1280);
  const width = faceWidth(viewport);

  return (
    <div className="fixed inset-0">
      <RoundCarousel
        images={trips}
        imageWidth={width}
        imageHeight={Math.round(width * 1.25)}
        background="transparent"
      />

      {/* The nav wraps to two rows on phones (~97px), so clear it there. */}
      <div className="pointer-events-none absolute left-[3vw] top-32 z-10 sm:top-24">
        <h1 className="font-heading text-3xl font-bold leading-[0.9] tracking-tight md:text-5xl">
          My Collection
          <span className="ml-2 align-top font-mono text-[0.5em] tabular-nums">({trips.length})</span>
        </h1>
      </div>
      {/* Under the ring; outside RoundCarousel so typing never starts a drag. */}
      <div className="absolute inset-x-0 bottom-[8vh] z-10 mx-auto w-[min(28rem,calc(100%-2rem))]">
        <TripSearch trips={trips} />
      </div>
    </div>
  );
}
