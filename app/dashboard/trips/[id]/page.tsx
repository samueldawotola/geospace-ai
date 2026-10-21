import { auth0 } from "@/lib/auth0";
import { redirect, notFound } from "next/navigation";
import { syncUser, getTripById } from "@/db/users";
import { getHotelsForDestination } from "@/lib/hotels";
import { getDestinationPhotos } from "@/lib/photos";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeleteTripButton } from "@/components/delete-trip-button";
import { HotelList } from "@/components/hotel-list";
import { StickyScrollCards } from "@/components/ui/sticky-scroll-cards";
import { SkipToInfoLink } from "@/components/skip-to-info-link";
import { ItineraryOverview } from "@/components/itinerary-overview";
import { ExpandableText } from "@/components/expandable-text";
import TimeOfDayBackground from "@/components/time-of-day-background";

export default async function TripDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }
  if (!session.user.email) {
    throw new Error("No email is associated with this account");
  }

  const dbUser = await syncUser(session.user.sub, session.user.email);
  const trip = await getTripById(id, dbUser.id);

  if (!trip) {
    notFound();
  }

  const [hotels, photos] = await Promise.all([
    getHotelsForDestination(trip.destination),
    getDestinationPhotos(trip.destination),
  ]);

  return (
    <div className="space-y-6">
      <TimeOfDayBackground />

      <Link
        href="/dashboard"
        className="fixed left-4 top-1/2 z-40 -translate-y-1/2 text-base font-medium text-muted-foreground hover:text-primary transition-colors md:left-8"
      >
        ← Back to trips
      </Link>

      {/* Mirrors "Back to trips": same height, opposite edge. */}
      {photos.length > 0 && (
        <SkipToInfoLink
          targetId="trip-info"
          className="fixed right-4 top-1/2 z-40 -translate-y-1/2 text-base font-medium text-muted-foreground hover:text-primary transition-colors md:right-8"
        >
          Skip to info ↓
        </SkipToInfoLink>
      )}

      {photos.length > 0 && (
        <StickyScrollCards
          cards={photos}
          hint={`scroll to explore ${trip.destination}`}
        />
      )}

      <Card id="trip-info" className="tod-card border ring-0 backdrop-blur-sm scroll-mt-20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-2xl">{trip.destination}</CardTitle>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="secondary">
                {trip.days} {trip.days === 1 ? "day" : "days"}
              </Badge>
              <Link
                href={`/globe?destination=${encodeURIComponent(trip.destination)}`}
                className="px-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                View on globe
              </Link>
              <DeleteTripButton
                tripId={trip.id}
                destination={trip.destination}
                redirectTo="/dashboard"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ExpandableText lines={4}>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {trip.data?.destinationOverview ?? trip.content}
            </p>
          </ExpandableText>
        </CardContent>
      </Card>

      {trip.data && (
        <Tabs defaultValue="overview">
          <TabsList className="tod-card border backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hotels">
              Hotels &amp; Stays
              {hotels.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {hotels.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hotels">
            <HotelList hotels={hotels} />
          </TabsContent>

          <TabsContent value="overview">
            <ItineraryOverview data={trip.data} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
