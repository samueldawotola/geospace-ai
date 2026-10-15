import type { TripPlan } from "@/db/schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The body of a trip's "Overview" tab. Extracted from
 * app/dashboard/trips/[id]/page.tsx so the public landing page can render a
 * sample itinerary with the exact markup the real trip view uses.
 *
 * Presentation only — no session, no database, no fetches — so it is safe to
 * render on a page served to anonymous visitors.
 */
export function ItineraryOverview({ data }: { data: TripPlan }) {
  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Day by day</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.itinerary.map((day) => (
            <div key={day.day} className="border-l-2 border-primary/30 pl-4">
              <p className="font-medium text-sm">
                Day {day.day} — {day.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground/80">Morning: </span>
                {day.morning}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground/80">Afternoon: </span>
                {day.afternoon}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground/80">Evening: </span>
                {day.evening}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Packing list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.packingList.map((group) => (
              <div key={group.category}>
                <p className="text-sm font-medium">{group.category}</p>
                <p className="text-sm text-muted-foreground">
                  {group.items.join(", ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Budget breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {(() => {
              const b = data.budgetBreakdown;
              const rows: [string, number][] = [
                ["Lodging", b.lodging],
                ["Food", b.food],
                ["Activities", b.activities],
                ["Transport", b.transport],
                ["Misc", b.misc],
              ];
              return (
                <>
                  {rows.map(([label, amount]) => (
                    <div
                      key={label}
                      className="flex justify-between text-muted-foreground"
                    >
                      <span>{label}</span>
                      <span>
                        {b.currency} {amount}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium pt-1 border-t border-border/50">
                    <span>Total</span>
                    <span>
                      {b.currency} {b.total}
                    </span>
                  </div>
                  {b.notes && (
                    <p className="text-muted-foreground pt-2">{b.notes}</p>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {data.localTips.length > 0 && (
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Local tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {data.localTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.grounded && data.grounded.riskFactors.length > 0 && (
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Risk factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.grounded.riskFactors.map((risk) => (
              <div key={risk.label}>
                <p className="text-sm font-medium">{risk.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{risk.body}</p>
                {risk.sourceUrl && (
                  <a
                    href={risk.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    {risk.sourceName}
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.grounded && (
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Online content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Official sources</p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                {data.grounded.onlineContent.officialSources.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {s.name}
                    </a>{" "}
                    — {s.note}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">Community sources</p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                {data.grounded.onlineContent.communitySources.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {s.name}
                    </a>{" "}
                    — {s.note}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">Creators worth following</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
                {data.grounded.onlineContent.creatorTypes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">What to search</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
                {data.grounded.onlineContent.searchTerms.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {data.grounded && (
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Housing plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">
                {data.grounded.housingPlan.recommendation}
              </p>
              <p className="text-muted-foreground mt-1">
                {data.grounded.housingPlan.reasoning}
              </p>
            </div>
            {data.grounded.housingPlan.alternatives.map((a) => (
              <div key={a.option}>
                <p className="font-medium">{a.option}</p>
                <p className="text-muted-foreground">{a.note}</p>
              </div>
            ))}
            <p className="text-muted-foreground pt-2 border-t border-border/50">
              {data.grounded.housingPlan.budgetPick}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
