/**
 * A static, zero-JS stand-in for <ImmersiveGlobe> on the public landing page.
 *
 * The real globe pulls the Google Maps JS API with maps3d/places/geocoding/
 * streetView — far past the landing page's JS budget, and it would bill a Maps
 * load for every anonymous visitor. This is a screenshot of that same component
 * actually rendering, so the landing page shows the real product with nothing
 * to download or hydrate.
 *
 * Two sources, picked by the browser from srcset: a 39KB 800px WebP for normal
 * displays, and the full 1600px PNG when the viewport and DPR warrant it.
 *
 * Plain <img> on purpose: next/image would ship client JS and break the
 * zero-JS guarantee. width/height carry the 8:5 intrinsic ratio so the box is
 * reserved before the image lands and nothing shifts.
 *
 * Imagery is Google's — keep the attribution with it.
 */
export function GlobeStill({ className }: { className?: string }) {
  return (
    <figure className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/globe-hero-800.webp"
        srcSet="/globe-hero-800.webp 800w, /globe-hero.png 1600w"
        sizes="(min-width: 768px) 30rem, 100vw"
        width={1600}
        height={1000}
        alt="The Geospace immersive globe, showing Earth from orbit over Africa and Europe"
        decoding="async"
        className="h-auto w-full rounded-lg"
      />
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">
        Globe imagery © Google
      </figcaption>
    </figure>
  );
}
