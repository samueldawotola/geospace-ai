import { LoadingBlock, LoadingPage } from "@/components/loading-block";
import TimeOfDayBackground from "@/components/time-of-day-background";

export default function Loading() {
  return (
    <LoadingPage label="Loading itinerary…" className="space-y-6">
      <TimeOfDayBackground />
      <LoadingBlock className="h-[60vh]" />
      <LoadingBlock className="h-40" />
      <LoadingBlock className="h-56" />
    </LoadingPage>
  );
}
