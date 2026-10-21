import { LoadingBlock, LoadingPage } from "@/components/loading-block";
import TimeOfDayBackground from "@/components/time-of-day-background";

export default function Loading() {
  return (
    <LoadingPage label="Loading your profile…" className="mx-auto max-w-2xl space-y-6">
      <TimeOfDayBackground />
      <div className="space-y-2">
        <LoadingBlock className="h-8 w-40" />
        <LoadingBlock className="h-5 w-72 max-w-full" />
      </div>
      <LoadingBlock className="h-[28rem]" />
    </LoadingPage>
  );
}
