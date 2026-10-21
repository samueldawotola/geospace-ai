"use client";

import { useState } from "react";
import { ChevronsUpDownIcon } from "lucide-react";

import type { TripPlan } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExpandableText } from "@/components/expandable-text";

type Day = TripPlan["itinerary"][number];

// Plain substring match on a day's title and plans. cmdk's default fuzzy
// score matches scattered letters, which across long plan text hits every day.
function matchesDay(value: string, search: string, keywords?: string[]) {
  const q = search.trim().toLowerCase();
  if (!q) return 1;
  return [value, ...(keywords ?? [])].some((t) => t.toLowerCase().includes(q)) ? 1 : 0;
}

/**
 * "Day by day" card showing one day at a time. The day picker is the combobox
 * from Uiverse/shadcn (Popover + Command); choosing a day swaps the content in
 * place — no navigation, it all stays inside the itinerary.
 */
export function DayByDay({ days }: { days: Day[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(days[0]?.day);
  const day = days.find((d) => d.day === selected) ?? days[0];

  return (
    <Card className="tod-card border ring-0 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Day by day</CardTitle>
          {days.length > 0 && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                role="combobox"
                aria-expanded={open}
                aria-label="Choose a day"
                className="flex h-10 w-full max-w-xs items-center justify-between gap-2 rounded-xl border border-border/60 bg-transparent px-3 text-sm shadow-xs outline-none transition-colors hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="truncate">
                  Day {day.day} — {day.title}
                </span>
                <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-xl border-border/60 p-0 shadow-sm">
                <Command filter={matchesDay}>
                  <CommandInput placeholder="Search days..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No day found.</CommandEmpty>
                    <CommandGroup>
                      {days.map((d) => (
                        <CommandItem
                          key={d.day}
                          value={`Day ${d.day} ${d.title}`}
                          // Search matches places in the day's plans, not just its title.
                          keywords={[d.morning, d.afternoon, d.evening]}
                          className="pr-2"
                          data-checked={d.day === day.day}
                          onSelect={() => {
                            setSelected(d.day);
                            setOpen(false);
                          }}
                        >
                          <span className="truncate">
                            Day {d.day} — {d.title}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>
      {day && (
        <CardContent>
          <div key={day.day} className="border-l-2 border-primary/30 pl-4" aria-live="polite">
            <p className="font-medium text-sm">
              Day {day.day} — {day.title}
            </p>
            <ExpandableText lines={3} className="mt-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground/80">Morning: </span>
                {day.morning}
              </p>
            </ExpandableText>
            <ExpandableText lines={3} className="mt-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground/80">Afternoon: </span>
                {day.afternoon}
              </p>
            </ExpandableText>
            <ExpandableText lines={3} className="mt-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground/80">Evening: </span>
                {day.evening}
              </p>
            </ExpandableText>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
