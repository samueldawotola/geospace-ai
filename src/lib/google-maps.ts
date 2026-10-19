type GoogleMapsGlobal = {
  maps: {
    importLibrary: (name: string) => Promise<any>;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsGlobal;
    gm_authFailure?: () => void;
  }
}

let loadPromise: Promise<GoogleMapsGlobal> | null = null;

// Maps calls window.gm_authFailure when the key is rejected (invalid key,
// referrer not allowed, API not enabled). The script still loads, so without
// this the app thinks it's ready while Google draws its own error box.
const authFailureListeners = new Set<() => void>();

export function onGoogleMapsAuthFailure(listener: () => void): () => void {
  authFailureListeners.add(listener);
  return () => authFailureListeners.delete(listener);
}

export function loadGoogleMaps(): Promise<GoogleMapsGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
      return;
    }

    if (window.google?.maps) {
      resolve(window.google);
      return;
    }

    window.gm_authFailure = () => {
      authFailureListeners.forEach((listener) => listener());
    };

    const callbackName = "__geospaceInitGoogleMaps";

    const timeout = window.setTimeout(() => {
      loadPromise = null;
      reject(
        new Error(
          "Google Maps did not initialize within 15s. Check the console for a Maps error code.",
        ),
      );
    }, 15000);

    (window as any)[callbackName] = () => {
      window.clearTimeout(timeout);
      delete (window as any)[callbackName];

      if (window.google?.maps) {
        resolve(window.google);
      } else {
        loadPromise = null;
        reject(new Error("Google Maps callback fired but the API is missing"));
      }
    };

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${key}` +
      // Map3DElement ships in the weekly channel; pin it so a project-level
      // default channel can't silently drop us onto one without maps3d.
      `&v=weekly` +
      `&libraries=maps3d,places,geocoding,streetView` +
      `&loading=async&callback=${callbackName}`;
    script.async = true;

    script.onerror = () => {
      window.clearTimeout(timeout);
      loadPromise = null;
      reject(new Error("Failed to load the Google Maps JavaScript API"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export {};