import { TIME_SLOTS } from "@/lib/time-of-day";

// One layer per slot; TIME_SLOT_CSS (rendered in app/layout.tsx) fades in the
// layer matching <html data-time-slot>, which TimeSlotSync keeps current.
export default function TimeOfDayBackground() {
  return (
    <div aria-hidden="true" className="tod-backdrop">
      {TIME_SLOTS.map((slot) => (
        <div
          key={slot.id}
          data-slot={slot.id}
          className="tod-layer"
          style={{
            backgroundColor: slot.color,
            backgroundImage: `url(${slot.src})`,
          }}
        />
      ))}
    </div>
  );
}
