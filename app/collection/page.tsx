import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { syncUser, getUserTrips } from "@/db/users";
import { getDestinationPhotos } from "@/lib/photos";
import { TripCarousel, type TripFace } from "@/components/trip-carousel";
import TimeOfDayBackground from "@/components/time-of-day-background";

export const metadata = {
  title: "My Collection · Geospace AI",
  description: "See the world before it changes.",
};

export default async function CollectionPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }
  if (!session.user.email) {
    throw new Error("No email is associated with this account");
  }

  const dbUser = await syncUser(session.user.sub, session.user.email);
  const trips = await getUserTrips(dbUser.id);

  const photosByTrip = await Promise.all(
    trips.map((trip) => getDestinationPhotos(trip.destination, 1)),
  );

  // Every trip gets a face; one without a photo shows as a tinted card.
  const items: TripFace[] = trips.map((trip, i) => ({
    src: photosByTrip[i][0]?.src,
    title: trip.destination,
    href: `/dashboard/trips/${trip.id}`,
  }));

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <TimeOfDayBackground />
        <h1 className="text-2xl font-semibold tracking-tight">My Collection</h1>
        <p className="text-muted-foreground mt-2">
          No trips yet — plan one to start your collection.
        </p>
      </div>
    );
  }

  return (
    <>
      <TimeOfDayBackground />
      <TripCarousel trips={items} />
    </>
  );
}
