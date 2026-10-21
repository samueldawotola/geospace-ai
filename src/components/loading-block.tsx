import { cn } from "@/lib/utils";

/**
 * Placeholder block for the route loading.tsx files. Uses the time-of-day
 * glass (.tod-card) so skeletons match the cards they stand in for.
 */
export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("tod-card animate-pulse rounded-xl border backdrop-blur-sm motion-reduce:animate-none", className)}
    />
  );
}

/** Wraps a route skeleton so screen readers announce the wait. */
export function LoadingPage({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
