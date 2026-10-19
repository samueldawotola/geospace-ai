// Shared by the generate form (client) and generateTrip (server) so both
// sides enforce the same rules.

export const MIN_DAYS = 1;
export const MAX_DAYS = 30;

export type TripInputErrors = { days?: string; destination?: string };

export type TripInput = { days: number; destination: string };

export function validateTripInput(input: {
  days: unknown;
  destination: unknown;
}):
  | { ok: true; value: TripInput }
  | { ok: false; errors: TripInputErrors } {
  const errors: TripInputErrors = {};

  const rawDays =
    typeof input.days === "string" ? input.days.trim() : input.days;
  const days =
    typeof rawDays === "number"
      ? rawDays
      : typeof rawDays === "string" && rawDays !== ""
        ? Number(rawDays)
        : NaN;
  if (rawDays === "" || rawDays === null || rawDays === undefined) {
    errors.days = "Enter how many days.";
  } else if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
    errors.days = `Enter a whole number from ${MIN_DAYS} to ${MAX_DAYS}.`;
  }

  const destination =
    typeof input.destination === "string" ? input.destination.trim() : "";
  if (!destination) {
    errors.destination = "Enter a destination.";
  }

  if (errors.days || errors.destination) return { ok: false, errors };
  return { ok: true, value: { days, destination } };
}
