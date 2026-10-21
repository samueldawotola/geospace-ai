"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  MAX_DAYS,
  MIN_DAYS,
  validateTripInput,
  type TripInputErrors,
} from "@/lib/trip-input";

// Solid button in the time-of-day accent (--tod-btn-bg from
// src/lib/time-of-day.ts), 44px tall to line up with the trip inputs.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 shrink-0 rounded-xl bg-(--tod-btn-bg) px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--tod-btn-bg) disabled:cursor-progress disabled:opacity-80"
    >
      {/* Both labels share one grid cell so the button keeps its width while
          the spinner shows and the inputs beside it don't jump. */}
      <span className="grid place-items-center">
        <span className={`[grid-area:1/1] ${pending ? "invisible" : ""}`}>
          Generate trip
        </span>
        <span className={`[grid-area:1/1] ${pending ? "" : "invisible"}`}>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="sr-only">Generating…</span>
        </span>
      </span>
    </button>
  );
}

export type GenerateFormState = {
  error?: string;
  fieldErrors?: TripInputErrors;
  /** Several places match; the user picks one and the form resubmits with its placeId. */
  candidates?: { placeId: string; label: string }[];
  /** What was submitted. React resets the form after each action, so the
      fields refill from these instead of going blank. */
  values?: { days: string; destination: string };
};

const inputClass =
  "h-11 bg-card/60 backdrop-blur-sm border-border/60 focus-visible:ring-primary/40";

export function GenerateForm({
  action,
  defaultDestination,
}: {
  action: (
    prev: GenerateFormState,
    formData: FormData,
  ) => Promise<GenerateFormState>;
  defaultDestination?: string;
}) {
  const [serverState, formAction] = useActionState(action, {});
  const [clientErrors, setClientErrors] = useState<TripInputErrors | null>(
    null,
  );

  // Client errors show when the client check fails; otherwise fall back to
  // whatever the server's own check returned.
  const errors = clientErrors ?? serverState.fieldErrors ?? {};

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    const result = validateTripInput({
      days: data.get("days"),
      destination: data.get("destination"),
    });
    if (!result.ok) {
      // Preventing default also stops React from running the form action.
      e.preventDefault();
      setClientErrors(result.errors);
      return;
    }
    setClientErrors(null);
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="max-w-lg mx-auto text-left"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-1.5 sm:w-36 sm:shrink-0">
          <Label htmlFor="trip-days">How many days?</Label>
          <Input
            id="trip-days"
            name="days"
            type="number"
            inputMode="numeric"
            min={MIN_DAYS}
            max={MAX_DAYS}
            step={1}
            placeholder="e.g. 4"
            defaultValue={serverState.values?.days}
            required
            aria-invalid={errors.days ? true : undefined}
            aria-describedby={errors.days ? "trip-days-error" : undefined}
            className={inputClass}
          />
        </div>
        <div className="grid gap-1.5 sm:flex-1">
          <Label htmlFor="trip-destination">Where are you going?</Label>
          <Input
            id="trip-destination"
            name="destination"
            placeholder="e.g. Kyoto, Japan"
            defaultValue={serverState.values?.destination ?? defaultDestination}
            required
            aria-invalid={errors.destination ? true : undefined}
            aria-describedby={
              errors.destination ? "trip-destination-error" : undefined
            }
            className={inputClass}
          />
        </div>
        <SubmitButton />
      </div>

      {serverState.candidates && serverState.candidates.length > 0 && (
        <CandidateList candidates={serverState.candidates} />
      )}

      {(errors.days || errors.destination || serverState.error) && (
        <div className="mt-2 space-y-1 text-sm text-destructive" role="alert">
          {errors.days && <p id="trip-days-error">Days: {errors.days}</p>}
          {errors.destination && (
            <p id="trip-destination-error">
              Destination: {errors.destination}
            </p>
          )}
          {serverState.error && <p>{serverState.error}</p>}
        </div>
      )}
    </form>
  );
}

// Each option is a submit button carrying name="placeId", so picking one
// resubmits the form with the user's days plus that exact place.
function CandidateList({
  candidates,
}: {
  candidates: NonNullable<GenerateFormState["candidates"]>;
}) {
  const { pending } = useFormStatus();
  return (
    <fieldset className="mt-3" disabled={pending}>
      <legend className="text-sm font-medium">Which one did you mean?</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {candidates.map((c) => (
          <button
            key={c.placeId}
            type="submit"
            name="placeId"
            value={c.placeId}
            className="rounded-xl border border-border/60 bg-card/60 px-3 py-1.5 text-sm backdrop-blur-sm transition-colors hover:bg-card/90 disabled:opacity-60"
          >
            {c.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
