import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark, MapPin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItineraryOverview } from "@/components/itinerary-overview";
import { GlobeStill } from "@/components/globe-still";
import TimeOfDayBackground from "@/components/time-of-day-background";
import { SAMPLE_ITINERARY } from "@/lib/sample-itinerary";

const GITHUB_REPO = "https://github.com/samueldawotola/geospace-ai";
const CONTACT_EMAIL = "ssgeospaceai@gmail.com";

const STEPS = [
  {
    icon: MapPin,
    heading: "Name a destination",
    body: "It's just one city, you say the word",
  },
  {
    icon: Sparkles,
    heading: "Get a grounded plan",
    body: "The model researches real places and cites its sources, day by day.",
  },
  {
    icon: Bookmark,
    heading: "Save it and come back",
    body: "Every itinerary stays in your account, ready to revisit and refine.",
  },
];

export default async function LandingPage() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/dashboard");
  }

  const sample = SAMPLE_ITINERARY;

  return (
    <div className="space-y-20 pb-8">
      <TimeOfDayBackground />

      {/* ---------- Hero ---------- */}
      <section className="grid items-center gap-10 pt-6 md:grid-cols-2 md:gap-8 md:pt-12">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            See the world before it changes.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Geospace builds custom, day by day itineraries that lets you know
            where you&apos;re actually going
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Button asChild size="lg" className="h-11">
              <a href="/auth/login?screen_hint=signup">Start planning free</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11">
              <a href="/auth/login">Log in</a>
            </Button>
          </div>
          <p className="mt-4 text-sm">
            <Link
              href="/globe"
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Explore the globe
            </Link>
          </p>
        </div>

        <div className="flex justify-center">
          <GlobeStill className="w-full max-w-md md:max-w-none" />
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section>
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, heading, body }) => (
            <Card
              key={heading}
              className="border-border/50 bg-card/60 backdrop-blur-sm"
            >
              <CardHeader className="pb-3">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-base">{heading}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Sample itinerary ---------- */}
      <section>
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            {sample.destination}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A real itinerary Geospace generated.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Card className="tod-card border ring-0 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-2xl">{sample.destination}</CardTitle>
                <Badge variant="secondary" className="shrink-0">
                  Itinerary
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {sample.data.destinationOverview}
              </p>
            </CardContent>
          </Card>

          <ItineraryOverview data={sample.data} />
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg" className="h-11">
            <a href="/auth/login?screen_hint=signup">
              Plan one for your destination
            </a>
          </Button>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border/50 pt-8">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Geospace AI</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-foreground transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
