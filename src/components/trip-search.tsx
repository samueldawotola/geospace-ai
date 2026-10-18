"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinIcon, SparklesIcon } from "lucide-react";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Trip = { title: string; href: string };

const PLAN_PREFIX = "__plan__";

// The menu sits on time-of-day glass, so rows use the slot's text color and an
// accent-tinted highlight instead of the default white-popover colors.
const GROUP = "text-(--tod-card-fg)";
const ITEM =
  "data-selected:bg-(--card) data-selected:text-(--tod-card-fg) data-selected:*:[svg]:text-(--tod-card-fg)";

// Case- and accent-insensitive ("reykjavik" finds "Reykjavík").
const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Substring match on the destination; the "plan it" row always shows.
function filter(value: string, search: string) {
  if (value.startsWith(PLAN_PREFIX)) return 1;
  const q = fold(search);
  return !q || fold(value).includes(q) ? 1 : 0;
}

/**
 * Search under the collection carousel. Enter opens the highlighted trip's
 * itinerary; with no match, it offers to plan one (the dashboard, with the
 * place pre-filled — it doesn't start generating on its own).
 */
export function TripSearch({ trips }: { trips: Trip[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const typed = query.trim();
  const hasMatch = typed !== "" && trips.some((t) => fold(t.title).includes(fold(typed)));

  return (
    <Command
      filter={filter}
      label="Search your trips"
      // The shared input wrapper drops its bottom padding (lists usually open
      // below it); this list opens above, so restore it to center the field.
      className="relative h-auto overflow-visible rounded-2xl tod-card border ring-0 backdrop-blur-sm [&_[data-slot=command-input-wrapper]]:pb-1"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search your trips — e.g. Kyoto"
        aria-label="Search your trips"
        className="h-10"
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery("");
        }}
      />
      {typed && (
        <CommandList
          className="tod-card absolute inset-x-0 bottom-full mb-2 rounded-2xl border p-1 shadow-lg backdrop-blur-xl"
          // The slot's glass color layered twice (~92% opaque): backdrop blur
          // doesn't reach the 3D ring, so faces would otherwise ghost through.
          style={{
            backgroundColor: "var(--tod-card-hover)",
            backgroundImage: "linear-gradient(var(--tod-card-hover), var(--tod-card-hover))",
          }}
        >
          {hasMatch && (
            <CommandGroup heading="Your trips" className={GROUP}>
              {trips.map((t) => (
                <CommandItem key={t.href} value={t.title} className={ITEM} onSelect={() => router.push(t.href)}>
                  <MapPinIcon className="opacity-60" />
                  <span className="truncate">{t.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading={hasMatch ? undefined : `No trip for “${typed}” yet`} className={GROUP}>
            <CommandItem
              className={ITEM}
              value={`${PLAN_PREFIX}${typed}`}
              onSelect={() => router.push(`/dashboard?destination=${encodeURIComponent(typed)}`)}
            >
              <SparklesIcon className="opacity-60" />
              <span className="truncate">Plan a trip to “{typed}”</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
}
