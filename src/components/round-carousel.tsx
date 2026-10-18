// Round Carousel — Originkit

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

// Changes from the Originkit original, for the collection page:
//  - Faces can carry a title (caption) and href (the face links to the trip).
//  - Dragging starts after a few pixels of movement, and a drag never counts
//    as a click — the original captured the pointer on press, which swallows
//    clicks on the faces.
//  - The ring pauses while a face is hovered or focused, so it's easy to click.
//  - Fewer than MIN_FACES items repeat around the ring (the radius formula
//    breaks down at 1–2 faces).
//  - Auto-spin is off for prefers-reduced-motion; dragging still works.
//  - Smoother motion: one eased velocity model (hover slows to a stop, a fling
//    coasts back into the auto spin), drag eases toward the pointer and hands
//    its on-screen speed to the coast on release, and back faces dim with an overlay rather
//    than a CSS filter (filters on moving 3D layers are costly).

interface RoundCarouselImage {
  src?: string;
  title?: string;
  href?: string;
}

interface RoundCarouselProps {
  images?: RoundCarouselImage[];
  imageWidth?: number;
  imageHeight?: number;
  spacing?: number;
  speed?: number;
  direction?: "right" | "left";
  drag?: boolean;
  sensitivity?: number;
  tilt?: number;
  perspective?: number;
  cornerRadius?: number;
  innerDim?: number;
  background?: string;
  style?: React.CSSProperties;
}

const DEFAULT_IMAGES: RoundCarouselImage[] = [
  { src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/e60dd7f7-a44f-40a7-df62-095b19cd8700/w=800" },
  { src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/eec164e9-23f8-4f87-b48a-a208fa806100/w=800" },
  { src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/859c75ea-953e-489e-be61-91a03a35d700/w=800" },
  { src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/933a7615-f4b6-4eae-8ed1-705fa0e24400/w=800" },
  { src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/7d4d2641-d6a8-4fef-e85c-b12ed100d500/w=800" },
  { src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/ed7b1c40-3332-43d8-a9eb-4615ef341b00/w=800" },
  { src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/31afae9c-5ba3-4ec3-2534-ed8198ed1100/w=800" },
  { src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/bd541261-75be-469c-7dc0-dae0ce81c400/w=800" },
];

const MIN_FACES = 6;
const DRAG_THRESHOLD = 6;
const FOLLOW_TAU = 0.06; // s: how closely the ring trails the pointer while dragging
const PAUSE_TAU = 0.25; // s: slow-down when a face is hovered
const GLIDE_TAU = 0.9; // s: fling coasting / easing back into the auto spin
const MAX_FLING = 900; // deg/s

export default function RoundCarousel({
  images = DEFAULT_IMAGES,
  imageWidth = 300,
  imageHeight = 300,
  spacing = 3,
  speed = 7,
  direction = "right",
  drag = true,
  sensitivity = 5,
  tilt = -7,
  perspective = 3000,
  cornerRadius = 22,
  innerDim = 3.5,
  background = "#000000",
  style = {},
}: RoundCarouselProps) {
  const source = images.length > 0 ? images : DEFAULT_IMAGES;
  // Pad up to MIN_FACES by cycling through the trips again.
  const items = Array.from({ length: Math.max(source.length, MIN_FACES) }, (_, i) => source[i % source.length]);
  const count = items.length;

  const ringRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const rotYRef = useRef(0); // rendered rotation (deg)
  const velRef = useRef(0); // angular velocity (deg/s) while not dragging
  const lastRef = useRef(0);
  const dragRef = useRef({
    down: false,
    active: false,
    moved: false,
    startX: 0,
    target: 0, // rotation the pointer is asking for; the ring eases toward it
  });
  const pausedRef = useRef(false);

  const angle = 360 / count;
  const factor = 1 + spacing * 0.15;
  const radius = (imageWidth * factor) / (2 * Math.tan(Math.PI / count));
  const radiusPx = cornerRadius;
  const degPerSec = speed * 6 * (direction === "left" ? -1 : 1);
  // Degrees of rotation per pixel dragged.
  const degPerPx = 0.12 * sensitivity;

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () =>
      (ring.style.transform = `translateZ(${-radius}px) rotateY(${rotYRef.current}deg)`);
    apply();

    // One velocity model for everything, eased with frame-rate independent
    // exponentials: the spin glides to a stop on hover, glides back to the
    // auto speed afterwards, and a fling coasts down into the auto spin.
    const draw = (now: number) => {
      const dt = lastRef.current ? Math.min((now - lastRef.current) / 1000, 0.05) : 0;
      lastRef.current = now;
      const d = dragRef.current;
      if (d.active) {
        const before = rotYRef.current;
        rotYRef.current += (d.target - rotYRef.current) * (1 - Math.exp(-dt / FOLLOW_TAU));
        // The ring's own on-screen speed; handed to the coast on release so
        // letting go never changes speed in a single frame.
        if (dt > 0) velRef.current = (rotYRef.current - before) / dt;
      } else {
        const goal = pausedRef.current || calm.matches ? 0 : degPerSec;
        const tau = pausedRef.current ? PAUSE_TAU : GLIDE_TAU;
        velRef.current += (goal - velRef.current) * (1 - Math.exp(-dt / tau));
        rotYRef.current += velRef.current * dt;
      }
      apply();
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastRef.current = 0;
    };
  }, [radius, degPerSec, count]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!drag) return;
    const d = dragRef.current;
    d.down = true;
    d.active = false;
    d.moved = false;
    d.startX = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.down) return;
    if (!d.active) {
      if (Math.abs(e.clientX - d.startX) < DRAG_THRESHOLD) return;
      d.active = true;
      d.moved = true;
      d.startX = e.clientX;
      d.target = rotYRef.current;
      velRef.current = 0;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    d.target += (e.clientX - d.startX) * degPerPx;
    d.startX = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const d = dragRef.current;
    if (d.active) velRef.current = Math.max(-MAX_FLING, Math.min(MAX_FLING, velRef.current));
    d.down = false;
    d.active = false;
  };
  // A drag that ends over a face must not open it.
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };
  const pause = () => (pausedRef.current = true);
  const resume = () => (pausedRef.current = false);
  const faceBase: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: radiusPx,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      style={{
        ...style,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background,
        perspective: `${perspective}px`,
        cursor: drag ? "grab" : "default",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt}deg)`,
        }}
      >
        <div
          ref={ringRef}
          style={{
            position: "relative",
            width: imageWidth,
            height: imageHeight,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {items.map((img, i) => {
            const src = img?.src;
            // Repeated faces are hidden from assistive tech and the tab order.
            const isRepeat = i >= source.length;
            const front = (
              <div
                style={{
                  ...faceBase,
                  backgroundColor: src ? "transparent" : "var(--tod-card-bg, #222)",
                  backgroundImage: src ? `url(${src})` : undefined,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  border: "1px solid var(--tod-card-border, transparent)",
                }}
              >
                {img.title && (
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/30 to-transparent px-4 pb-4 pt-10 text-left text-sm font-semibold tracking-wide text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
                    {img.title}
                  </span>
                )}
              </div>
            );
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {img.href ? (
                  <Link
                    href={img.href}
                    draggable={false}
                    aria-label={img.title ? `Open ${img.title}` : undefined}
                    aria-hidden={isRepeat || undefined}
                    tabIndex={isRepeat ? -1 : undefined}
                    onPointerEnter={pause}
                    onPointerLeave={resume}
                    onFocus={pause}
                    onBlur={resume}
                    className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-4 focus-visible:ring-(--tod-card-accent)"
                    style={{ borderRadius: radiusPx, backfaceVisibility: "hidden" }}
                  >
                    {front}
                  </Link>
                ) : (
                  front
                )}
                <div
                  style={{
                    ...faceBase,
                    transform: "rotateY(180deg)",
                    backgroundColor: src ? "transparent" : "#181818",
                    backgroundImage: src ? `url(${src})` : undefined,
                  }}
                >
                  {/* Dim overlay, equivalent to brightness(innerDim / 10). */}
                  <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${1 - innerDim / 10})` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
