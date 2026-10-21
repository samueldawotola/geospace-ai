import { LoadingBlock, LoadingPage } from "@/components/loading-block";
import TimeOfDayBackground from "@/components/time-of-day-background";

export default function Loading() {
  return (
    <LoadingPage label="Loading your collection…" className="flex flex-col items-center gap-6 py-16">
      <TimeOfDayBackground />
      <LoadingBlock className="h-80 w-full max-w-2xl" />
      <LoadingBlock className="h-10 w-full max-w-md" />
    </LoadingPage>
  );
}
