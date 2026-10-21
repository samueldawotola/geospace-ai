import { LoadingBlock, LoadingPage } from "@/components/loading-block";
import TimeOfDayBackground from "@/components/time-of-day-background";

export default function Loading() {
  return (
    <LoadingPage label="Loading your trips…" className="space-y-10">
      <TimeOfDayBackground />
      <div className="mx-auto max-w-xl space-y-4 py-8">
        <LoadingBlock className="mx-auto h-9 w-56" />
        <LoadingBlock className="mx-auto h-5 w-80 max-w-full" />
        <LoadingBlock className="mt-6 h-11 w-full" />
      </div>
      <div className="space-y-4">
        <LoadingBlock className="h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          <LoadingBlock className="h-72" />
          <LoadingBlock className="h-72" />
        </div>
      </div>
    </LoadingPage>
  );
}
