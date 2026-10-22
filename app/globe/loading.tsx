import { LoadingPage } from "@/components/loading-block";
import TimeOfDayBackground from "@/components/time-of-day-background";

// Same frame as the globe page, so the black globe area appears immediately.
export default function Loading() {
  return (
    <LoadingPage label="Loading globe…" className="p-4">
      <TimeOfDayBackground />
      <h1 className="mb-3 text-2xl font-semibold">Immersive Globe</h1>
      <div className="h-[calc(100vh-9rem)] w-full rounded-lg bg-black" />
    </LoadingPage>
  );
}
