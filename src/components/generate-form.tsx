"use client";

import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Sparkle button, adapted from Uiverse.io by ilkhoeri. Every size derives from
// --sz-btn, set to 44px (h-11) to line up with the destination input. Colors
// follow the time of day (--tod-btn-* from src/lib/time-of-day.ts).
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative shrink-0 outline-0 [--sz-btn:44px] [--space:calc(var(--sz-btn)/5.5)] [--gen-sz:calc(var(--space)*2)] [--sz-text:calc(var(--sz-btn)-var(--gen-sz))] h-[var(--sz-btn)] pl-6 pr-4 border border-solid border-white/15 rounded-xl flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-[0.95] bg-[linear-gradient(45deg,var(--tod-btn-from),var(--tod-btn-to))] [box-shadow:#3c40434d_0_1px_2px_0,#3c404326_0_2px_6px_2px,#0000004d_0_30px_60px_-30px,#34343459_0_-2px_6px_0_inset] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--tod-btn-sparkle) disabled:cursor-progress"
    >
      {!pending && (
        <svg
          className="animate-pulse absolute z-10 overflow-visible transition-all duration-300 text-(--tod-btn-sparkle) group-hover:text-white top-[calc(var(--sz-text)/7)] left-[calc(var(--sz-text)/7)] h-[var(--gen-sz)] w-[var(--gen-sz)] group-hover:h-[var(--sz-text)] group-hover:w-[var(--sz-text)] group-hover:left-1/2 group-hover:top-1/2 group-hover:-translate-x-1/2 group-hover:-translate-y-1/2"
          stroke="none"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
          />
        </svg>
      )}
      {/* Both states share one grid cell, so the button stays sized to
          "Generate" (plus room for the sparkle) and the input beside it
          doesn't jump when a trip starts. */}
      <span className="grid place-items-center text-base font-extrabold leading-none text-white">
        <span
          className={`[grid-area:1/1] transition-all duration-200 ${pending ? "invisible" : "group-hover:opacity-0"}`}
        >
          Generate
        </span>
        <span className={`[grid-area:1/1] ${pending ? "" : "invisible"}`}>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="sr-only">Generating…</span>
        </span>
      </span>
    </button>
  );
}

export function GenerateForm({
  action,
  defaultValue,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValue?: string;
}) {
  return (
    <form action={action} className="flex gap-2 max-w-md mx-auto">
      <Input
        name="destination"
        placeholder="e.g. Kyoto, Japan"
        defaultValue={defaultValue}
        required
        className="h-11 bg-card/60 backdrop-blur-sm border-border/60
                   focus-visible:ring-primary/40"
      />
      <SubmitButton />
    </form>
  );
}
