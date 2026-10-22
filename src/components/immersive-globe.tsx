"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Globe2, Loader2, PersonStanding, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadGoogleMaps, onGoogleMapsAuthFailure } from "@/lib/google-maps";

type Mode = "globe" | "street";

const WORLD_VIEW = {
  center: { lat: 20, lng: 0, altitude: 0 },
  range: 20_000_000, // metres from the camera to the target — full globe
  tilt: 0,
  heading: 0,
};

const CITY_VIEW = {
  range: 1200, // close enough for photorealistic buildings to resolve
  tilt: 65,
};

type Choice = { label: string; lat: number; lng: number };

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

// Map3DElement silently drops flyCameraTo calls made while it is still
// starting up, and gmp-steadychange isn't reliable enough to wait on. So ask,
// check whether the camera has started moving, and ask again if it hasn't.
async function flyCameraWhenReady(
  map3d: any,
  endCamera: { center: { lat: number; lng: number; altitude: number } } & Record<string, unknown>,
  durationMillis: number,
) {
  const near = (a: any, b: { lat: number; lng: number }) =>
    Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lng - b.lng) < 1e-4;

  for (let attempt = 0; attempt < 40; attempt++) {
    if (!map3d.isConnected) return;
    const start = map3d.center;
    if (start && near(start, endCamera.center)) return;

    map3d.flyCameraTo({ endCamera, durationMillis });
    await new Promise((resolve) => setTimeout(resolve, 750));

    const now = map3d.center;
    if (!start || !now || !near(now, start)) return;
  }
}

export default function ImmersiveGlobe({
  initialDestination,
}: {
  // A trip's saved destination; the camera flies there once the globe loads.
  initialDestination?: string;
}) {
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const streetContainerRef = useRef<HTMLDivElement>(null);
  const map3dRef = useRef<any>(null);
  const panoramaRef = useRef<any>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("globe");
  const [query, setQuery] = useState(initialDestination ?? "");
  const [searching, setSearching] = useState(false);
  const [choices, setChoices] = useState<Choice[] | null>(null);

  // ---- Boot the 3D globe -------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onGoogleMapsAuthFailure(() => {
      if (cancelled) return;
      setStatus("error");
      setMessage(
        "Google Maps rejected the API key. Check that it's valid, the Maps " +
          "JavaScript and Map Tiles APIs are enabled, and this site is an " +
          "allowed referrer.",
      );
    });

    (async () => {
      try {
        const g = await loadGoogleMaps();
        const { Map3DElement } = (await g.maps.importLibrary("maps3d")) as any;

        if (cancelled || !globeContainerRef.current) return;

        const map3d = new Map3DElement({
          center: WORLD_VIEW.center,
          range: WORLD_VIEW.range,
          tilt: WORLD_VIEW.tilt,
          heading: WORLD_VIEW.heading,
          mode: "HYBRID", // photorealistic tiles + labels
        });

        map3d.style.width = "100%";
        map3d.style.height = "100%";

        globeContainerRef.current.replaceChildren(map3d);
        map3dRef.current = map3d;
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "Could not start the globe.",
        );
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
      map3dRef.current = null;
      panoramaRef.current = null;
    };
  }, []);

  // ---- Search: geocode, then fly the camera there ------------------------
  const flyToCoords = useCallback(async (lat: number, lng: number) => {
    setChoices(null);
    // Drop out of Street View if we were on the ground.
    setMode("globe");

    // flyCameraTo animates the descent instead of teleporting — this is the
    // whole "immersive" moment, so give it time to breathe.
    if (map3dRef.current) {
      await flyCameraWhenReady(
        map3dRef.current,
        {
          center: { lat, lng, altitude: 0 },
          range: CITY_VIEW.range,
          tilt: CITY_VIEW.tilt,
          heading: 0,
        },
        5000,
      );
    }
  }, []);

  // Never guess: no exact match shows "no results", several exact matches
  // show a list to pick from, and only a single match flies straight there.
  const flyToPlace = useCallback(async (place: string) => {
    const term = place.trim();
    if (!term || !map3dRef.current) return;

    setSearching(true);
    setMessage(null);
    setChoices(null);

    try {
      const g = await loadGoogleMaps();
      const { Geocoder } = (await g.maps.importLibrary("geocoding")) as any;
      let results: any[] = [];
      try {
        ({ results } = await new Geocoder().geocode({ address: term }));
      } catch (err) {
        // The geocoder rejects with ZERO_RESULTS instead of returning [].
        if ((err as { code?: string })?.code !== "ZERO_RESULTS") throw err;
      }

      // partial_match means Google matched only part of the query, which is
      // exactly the loose guess this search should not act on.
      const seen = new Set<string>();
      const exact: Choice[] = [];
      for (const r of results ?? []) {
        if (r.partial_match) continue;
        const lat = r.geometry?.location?.lat();
        const lng = r.geometry?.location?.lng();
        if (!isValidLatLng(lat, lng) || seen.has(r.formatted_address)) continue;
        seen.add(r.formatted_address);
        exact.push({ label: r.formatted_address, lat, lng: lng as number });
      }

      if (exact.length === 0) {
        setMessage(`No results for "${term}". Check the spelling or add a country.`);
        return;
      }
      if (exact.length > 1) {
        setChoices(exact.slice(0, 5));
        return;
      }
      await flyToCoords(exact[0].lat, exact[0].lng);
    } catch (err) {
      console.error(err);
      setMessage("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  }, [flyToCoords]);

  const handleSearch = useCallback(() => flyToPlace(query), [flyToPlace, query]);

  // Fly to the trip's destination once, as soon as the globe is ready.
  const flewToInitial = useRef(false);
  useEffect(() => {
    if (status !== "ready" || !initialDestination || flewToInitial.current) {
      return;
    }
    flewToInitial.current = true;
    flyToPlace(initialDestination);
  }, [status, initialDestination, flyToPlace]);

  // ---- Drop into Street View at whatever the camera is looking at --------
  const enterStreetView = useCallback(async () => {
    const map3d = map3dRef.current;
    if (!map3d) return;

    setMessage(null);

    try {
      const g = await loadGoogleMaps();
      const { StreetViewService, StreetViewPanorama } =
        (await g.maps.importLibrary("streetView")) as any;

      const center = map3d.center;
      if (!isValidLatLng(center?.lat, center?.lng)) {
        setMessage("Couldn't read the camera position. Try again.");
        return;
      }
      const location = { lat: center.lat, lng: center.lng };

      // Ask for the nearest outdoor panorama within 500m of the camera target.
      const { data } = await new StreetViewService().getPanorama({
        location,
        radius: 500,
        source: "outdoor",
      });

      setMode("street");

      if (panoramaRef.current) {
        panoramaRef.current.setPano(data.location.pano);
        panoramaRef.current.setVisible(true);
      } else if (streetContainerRef.current) {
        panoramaRef.current = new StreetViewPanorama(
          streetContainerRef.current,
          {
            pano: data.location.pano,
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            addressControl: true,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false,
          },
        );
      }
    } catch {
      setMessage(
        "No Street View coverage here. Fly closer to a road, then try again.",
      );
    }
  }, []);

  const exitStreetView = useCallback(() => {
    setMode("globe");
    panoramaRef.current?.setVisible(false);
  }, []);

  const resetToGlobe = useCallback(() => {
    exitStreetView();
    map3dRef.current?.flyCameraTo({
      endCamera: WORLD_VIEW,
      durationMillis: 3000,
    });
  }, [exitStreetView]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-black">
      {/*
        Both layers stay mounted and absolutely positioned. Street View needs
        real layout dimensions when it initialises — toggling `display: none`
        would give it a 0x0 container and render a grey box.
      */}
      <div ref={globeContainerRef} className="absolute inset-0" />

      <div
        ref={streetContainerRef}
        className={`absolute inset-0 transition-opacity duration-300 ${
          mode === "street"
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Search bar */}
      <div className="absolute left-1/2 top-4 z-10 w-full max-w-md -translate-x-1/2 px-4">
        <div className="flex gap-2 rounded-lg bg-white/95 p-2 shadow-sm backdrop-blur">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search a place, e.g. Kyoto"
            className="border-0 shadow-none focus-visible:ring-0"
            disabled={status !== "ready"}
          />
          <Button
            onClick={handleSearch}
            disabled={status !== "ready" || searching || !query.trim()}
            size="icon"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {message && (
          <p className="mt-2 rounded-md bg-white/95 px-3 py-2 text-sm text-black shadow-sm">
            {message}
          </p>
        )}

        {choices && (
          <div className="mt-2 rounded-md bg-white/95 p-2 text-sm text-black shadow-sm">
            <p className="px-1 pb-1 font-medium">Which one did you mean?</p>
            <ul>
              {choices.map((c) => (
                <li key={c.label}>
                  <button
                    type="button"
                    onClick={() => flyToCoords(c.lat, c.lng)}
                    className="w-full rounded px-1 py-1.5 text-left hover:bg-black/5"
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mode controls */}
      {status === "ready" && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {mode === "globe" ? (
            <>
              <Button onClick={enterStreetView} variant="secondary">
                <PersonStanding className="mr-2 h-4 w-4" />
                Street View
              </Button>
              <Button onClick={resetToGlobe} variant="secondary">
                <Globe2 className="mr-2 h-4 w-4" />
                Back to globe
              </Button>
            </>
          ) : (
            <Button onClick={exitStreetView} variant="secondary">
              <X className="mr-2 h-4 w-4" />
              Exit Street View
            </Button>
          )}
        </div>
      )}

      {/* Loading / error overlay */}
      {status !== "ready" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black text-white">
          {status === "loading" ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm opacity-80">Loading globe…</p>
            </>
          ) : (
            <>
              <Globe2 className="h-8 w-8 opacity-60" />
              <p className="max-w-sm text-center text-sm opacity-80">
                {message ?? "The globe couldn't load."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}