import type { TripPlan } from "@/db/schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayByDay } from "@/components/day-by-day";
import { Marked, splitSentences } from "@/components/marked-text";

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
      <DayByDay days={data.itinerary} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="tod-card border ring-0 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Packing list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.packingList.map((group) => (
              <div key={group.category}>
                <p className="text-sm font-medium">{group.category}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground marker:text-primary/70">
                  {group.items.map((item, i) => (
                    <li key={i}>
                      <Marked text={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="tod-card border ring-0 backdrop-blur-sm">
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
        <Card className="tod-card border ring-0 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Local tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground marker:text-primary/70">
              {data.localTips.map((tip, i) => (
                <li key={i}>
                  <Marked text={tip} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.grounded && data.grounded.riskFactors.length > 0 && (
        <Card className="tod-card border ring-0 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Risk factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.grounded.riskFactors.map((risk) => (
              <div key={risk.label}>
                <p className="text-sm font-medium">{risk.label}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground marker:text-primary/70">
                  {splitSentences(risk.body).map((sentence, i) => (
                    <li key={i}>
                      <Marked text={sentence} />
                    </li>
                  ))}
                </ul>
                {risk.sourceUrl && (
                  <a
                    href={risk.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-xs text-primary underline"
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
        <Card className="tod-card border ring-0 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Online content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Official sources</p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                {data.grounded.onlineContent.officialSources.map((s) => (
                  <SourceItem key={s.url || s.name} source={s} />
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">Community sources</p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                {data.grounded.onlineContent.communitySources.map((s) => (
                  <SourceItem key={s.url || s.name} source={s} />
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
        <Card className="tod-card border ring-0 backdrop-blur-sm">
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

type Source = TripPlan["grounded"]["onlineContent"]["officialSources"][number];

// The model sometimes names a source without a URL; show it as plain text
// rather than an empty link that reloads the page.
function SourceItem({ source }: { source: Source }) {
  return (
    <li>
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {source.name}
        </a>
      ) : (
        <span className="font-medium text-foreground/80">{source.name}</span>
      )}{" "}
      — {source.note}
    </li>
  );
}
