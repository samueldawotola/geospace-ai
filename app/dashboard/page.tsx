import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { syncUser, getUserTrips } from "@/db/users";
import { generateTrip } from "@/lib/actions";
import { getDestinationPhotos } from "@/lib/photos";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateForm, type GenerateFormState } from "@/components/generate-form";
import { DeleteTripButton } from "@/components/delete-trip-button";
import { ProfileNudge } from "@/components/profile-nudge";
import TimeOfDayBackground from "@/components/time-of-day-background";

const SUGGESTED_DESTINATIONS = ["Kyoto", "Lisbon", "Reykjavík"];

function firstName(
  displayName: string | null,
  authName: string | null | undefined,
  email: string,
) {
  const fromDisplay = displayName?.trim().split(/\s+/)[0];
  if (fromDisplay) return fromDisplay;

  const fromAuth = authName?.trim().split(/\s+/)[0];
  if (fromAuth) return fromAuth;

  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function isProfileIncomplete(user: {
  displayName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  travelStyle: string | null;
  budget: string | null;
}) {
  return (
    !user.displayName ||
    !user.dateOfBirth ||
    !user.nationality ||
    !user.travelStyle ||
    !user.budget
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const session = await auth0.getSession();

  // Logged-out visitors get the public landing page, not a login wall.
  if (!session) {
    redirect("/");
  }
  if (!session.user.email) {
    throw new Error("No email is associated with this account");
  }

  const dbUser = await syncUser(session.user.sub, session.user.email);
  const userTrips = await getUserTrips(dbUser.id);
  const { destination } = await searchParams;

  const photosByTrip = await Promise.all(
    userTrips.map((trip) => getDestinationPhotos(trip.destination, 1)),
  );

  async function createTrip(
    _prev: GenerateFormState,
    formData: FormData,
  ): Promise<GenerateFormState> {
    "use server";
    const days = formData.get("days");
    const destination = formData.get("destination");
    const result = await generateTrip({
      days,
      destination,
      placeId: formData.get("placeId"),
    });
    if (result.trip) {
      redirect(`/dashboard/trips/${result.trip.id}`);
    }
    return {
      error: result.error,
      fieldErrors: result.fieldErrors,
      candidates: result.candidates?.map(({ placeId, label }) => ({ placeId, label })),
      values: {
        days: typeof days === "string" ? days : "",
        destination: typeof destination === "string" ? destination : "",
      },
    };
  }

  const name = firstName(
    dbUser.displayName,
    session.user.given_name ?? session.user.name,
    session.user.email,
  );

  return (
    <div className="space-y-10">
      <TimeOfDayBackground />

      <div className="relative mx-auto max-w-xl text-center py-8">
        <h1 className="text-3xl font-semibold tracking-tight">Where to next?</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {name}. Enter a trip length and destination.
        </p>
        <div className="mt-6">
          <GenerateForm
            key={destination ?? ""}
            action={createTrip}
            defaultDestination={destination}
          />
        </div>
      </div>

      {isProfileIncomplete(dbUser) && <ProfileNudge userId={dbUser.id} />}

      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-medium">Your trips</h2>
          {userTrips.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {userTrips.length} saved
            </span>
          )}
        </div>

        {userTrips.length === 0 ? (
          <Card className="tod-card border border-dashed ring-0 backdrop-blur-sm">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                No trips yet — try Kyoto, Lisbon, or Reykjavík.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_DESTINATIONS.map((city) => (
                  <Link
                    key={city}
                    href={`/dashboard?destination=${encodeURIComponent(city)}`}
                    className="rounded-4xl border border-border/60 bg-input/30 px-3 py-1.5 text-sm
                               hover:bg-input/50 transition-colors"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {userTrips.map((trip, i) => {
              const photo = photosByTrip[i][0];
              return (
                <Card
                  key={trip.id}
                  className="tod-card tod-card-interactive group relative overflow-hidden border ring-0 backdrop-blur-sm"
                >
                  <Link
                    href={`/dashboard/trips/${trip.id}`}
                    className="absolute inset-0 z-0"
                    aria-label={`View itinerary for ${trip.destination}`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {trip.destination}
                      </CardTitle>
                      <div className="relative z-10 shrink-0">
                        <DeleteTripButton
                          tripId={trip.id}
                          destination={trip.destination}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {trip.days} {trip.days === 1 ? "day" : "days"} ·{" "}
                      {new Date(trip.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </CardHeader>
                  {photo && (
                    <CardContent>
                      <div className="aspect-[4/3] overflow-hidden rounded-lg">
                        <img
                          src={photo.src}
                          alt={photo.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
