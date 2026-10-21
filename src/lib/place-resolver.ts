/**
 * Turns what a user typed into one real place, or says honestly that it
 * can't. Never guesses:
 * - no confident match       -> { status: "not_found" }
 * - several plausible places -> { status: "ambiguous", candidates } for the user to pick
 * - exactly one              -> { status: "resolved", place }
 *
 * Candidates come from Google Places Autocomplete, which lists alternatives
 * ("Springfield, MO" / "Springfield, IL" / ...). Text Search is not used here
 * because it always returns a single best guess, biased toward the server's
 * own location.
 */

const PLACES = "https://places.googleapis.com/v1";

/** A candidate must score at least this to count as a match (0-1). */
export const MATCH_THRESHOLD = 0.75;
/** ...and be within this much of the best candidate to count as a rival. */
const RIVAL_MARGIN = 0.1;
const MAX_CANDIDATES = 5;

// Types that make sense as a trip destination. Roads, shops, restaurants and
// other businesses are dropped, which is what filters out "Springfield Ridge
// Drive" or "Paris Baguette" from the suggestions.
const DESTINATION_TYPES = new Set([
  "country",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "locality",
  "postal_town",
  "sublocality",
  "sublocality_level_1",
  "colloquial_area",
  "archipelago",
  "island",
  "natural_feature",
  "mountain_peak",
  "national_park",
  "state_park",
  "beach",
  "tourist_attraction",
  "historical_place",
  "historical_landmark",
  "landmark",
  "scenic_spot",
]);

export type PlaceCandidate = {
  placeId: string;
  /** "Springfield, IL, USA" */
  label: string;
  confidence: number;
};

export type ResolvedPlace = {
  placeId: string;
  /** Short display name used as the trip's destination, e.g. "Kyoto, Japan". */
  label: string;
  name: string;
  address: string;
  types: string[];
  location: { lat: number; lng: number };
  viewport: { low: LatLng; high: LatLng } | null;
  summary: string | null;
};

type LatLng = { latitude: number; longitude: number };

export type Resolution =
  | { status: "resolved"; place: ResolvedPlace }
  | { status: "ambiguous"; candidates: PlaceCandidate[] }
  | { status: "not_found" };

// ---------- Matching ----------

const ABBREVIATIONS: Record<string, string> = {
  mt: "mount",
  mtn: "mountain",
  st: "saint",
  ste: "sainte",
  ft: "fort",
  pt: "point",
  natl: "national",
};

function tokens(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s,]/gu, " ")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((t) => ABBREVIATIONS[t] ?? t);
}

// Sørensen-Dice on character bigrams: 1 for identical, tolerant of typos
// ("japn" vs "japan" = 0.57, which still lets "kyoto japn" reach 0.79).
function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const grams = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const g = a.slice(i, i + 2);
    grams.set(g, (grams.get(g) ?? 0) + 1);
  }
  let overlap = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const g = b.slice(i, i + 2);
    const n = grams.get(g) ?? 0;
    if (n > 0) {
      grams.set(g, n - 1);
      overlap++;
    }
  }
  return (2 * overlap) / (a.length + b.length - 2);
}

const best = (t: string, pool: string[]) => Math.max(0, ...pool.map((p) => dice(t, p)));

/**
 * How well a candidate explains what the user typed, 0-1.
 * - Every word the user typed should appear in the candidate's name or
 *   address ("Springfield, IL" penalizes "Springfield, MO").
 * - The candidate's name shouldn't carry extra words the user never typed
 *   ("Kyoto" penalizes "Kyoto Garden").
 */
export function matchConfidence(query: string, mainText: string, secondaryText: string): number {
  const q = tokens(query);
  const main = tokens(mainText);
  const all = [...main, ...tokens(secondaryText)];
  if (q.length === 0 || main.length === 0) return 0;

  const queryCovered = q.reduce((sum, t) => sum + best(t, all), 0) / q.length;
  const nameCovered = main.filter((t) => best(t, q) >= 0.8).length / main.length;
  return queryCovered * (0.5 + 0.5 * nameCovered);
}

// ---------- Google Places calls ----------

function headers(fieldMask?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
    ...(fieldMask ? { "X-Goog-FieldMask": fieldMask } : {}),
  };
}

type Prediction = {
  placeId: string;
  text?: { text?: string };
  structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
  types?: string[];
};

async function autocomplete(input: string): Promise<Prediction[]> {
  const res = await fetch(`${PLACES}/places:autocomplete`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error(`Places autocomplete failed: ${res.status}`);
  const data = (await res.json()) as { suggestions?: { placePrediction?: Prediction }[] };
  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is Prediction => Boolean(p?.placeId));
}

type PlaceDetails = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  types?: string[];
  location?: LatLng;
  viewport?: { low: LatLng; high: LatLng };
  editorialSummary?: { text?: string };
  addressComponents?: { longText?: string; shortText?: string; types?: string[] }[];
};

const POLITICAL = new Set(["country", "administrative_area_level_1", "administrative_area_level_2", "locality", "postal_town", "colloquial_area"]);

// Regions and cities read well as their formatted address ("Kyoto, Japan").
// A landmark's formatted address is a street address, so use its name plus
// the city and country instead ("Tokyo Tower, Tokyo, Japan").
function labelFor(d: PlaceDetails): string {
  const name = d.displayName?.text ?? "";
  if ((d.types ?? []).some((t) => POLITICAL.has(t)) && d.formattedAddress) {
    return d.formattedAddress;
  }
  const part = (type: string) =>
    d.addressComponents?.find((c) => c.types?.includes(type))?.longText;
  const parts = [name, part("locality") ?? part("administrative_area_level_1"), part("country")];
  return [...new Set(parts.filter(Boolean))].join(", ");
}

export async function getPlaceById(placeId: string): Promise<ResolvedPlace | null> {
  if (!/^[\w-]{10,300}$/.test(placeId)) return null;
  const res = await fetch(`${PLACES}/places/${encodeURIComponent(placeId)}`, {
    headers: headers(
      "id,displayName,formattedAddress,types,location,viewport,editorialSummary,addressComponents",
    ),
  });
  if (!res.ok) return null;
  const d = (await res.json()) as PlaceDetails;
  if (!d.location || !d.displayName?.text) return null;
  return {
    placeId: d.id,
    label: labelFor(d),
    name: d.displayName.text,
    address: d.formattedAddress ?? "",
    types: d.types ?? [],
    location: { lat: d.location.latitude, lng: d.location.longitude },
    viewport: d.viewport ?? null,
    summary: d.editorialSummary?.text ?? null,
  };
}

// Two attractions with the same name are rarely equally plausible: "Mt Fuji"
// means the volcano, not a hill in Yokosuka. When every rival is an attraction
// (no cities or regions) and one has at least 10x the reviews of the next,
// take it. Same-named cities have no such signal and stay ambiguous.
async function dominantAttraction(
  rivals: PlaceCandidate[],
  predictions: Prediction[],
): Promise<PlaceCandidate | null> {
  const typesOf = (id: string) => predictions.find((p) => p.placeId === id)?.types ?? [];
  if (rivals.some((c) => typesOf(c.placeId).some((t) => POLITICAL.has(t)))) return null;

  const counts = await Promise.all(
    rivals.map(async (c) => {
      const res = await fetch(`${PLACES}/places/${encodeURIComponent(c.placeId)}`, {
        headers: headers("userRatingCount"),
      });
      if (!res.ok) return 0;
      return ((await res.json()) as { userRatingCount?: number }).userRatingCount ?? 0;
    }),
  );
  const ranked = rivals
    .map((c, i) => ({ c, n: counts[i] }))
    .sort((a, b) => b.n - a.n);
  const [first, second] = ranked;
  return first.n >= 1000 && first.n >= 10 * second.n ? first.c : null;
}

// Strip postcodes so "Big Sur, CA, USA" and "Big Sur, CA 93920, USA" count as one.
const sameLabel = (label: string) => tokens(label.replace(/\d+/g, "")).join(" ");

export async function resolveDestination(input: string): Promise<Resolution> {
  const predictions = await autocomplete(input);

  const scored = predictions
    .filter((p) => (p.types ?? []).some((t) => DESTINATION_TYPES.has(t)))
    .map((p) => {
      const main = p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";
      const secondary = p.structuredFormat?.secondaryText?.text ?? "";
      return {
        placeId: p.placeId,
        label: p.text?.text ?? [main, secondary].filter(Boolean).join(", "),
        confidence: matchConfidence(input, main, secondary),
      };
    })
    .filter((c) => c.confidence >= MATCH_THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence);

  if (scored.length === 0) return { status: "not_found" };

  const top = scored[0].confidence;
  const seen = new Set<string>();
  const rivals = scored.filter((c) => {
    if (c.confidence < top - RIVAL_MARGIN) return false;
    const key = sameLabel(c.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let pick = rivals[0];
  if (rivals.length > 1) {
    const dominant = await dominantAttraction(rivals, predictions);
    if (!dominant) {
      return { status: "ambiguous", candidates: rivals.slice(0, MAX_CANDIDATES) };
    }
    pick = dominant;
  }

  const place = await getPlaceById(pick.placeId);
  return place ? { status: "resolved", place } : { status: "not_found" };
}

// ---------- Grounding data for the itinerary ----------

export type GroundingPlace = {
  name: string;
  type: string;
  area: string;
  rating: number | null;
  reviews: number | null;
  summary: string | null;
  /** Google's summary of visitor reviews: what people see, do, order, pay. */
  highlights: string | null;
  /** e.g. "JPY 1000-2000" for restaurants. */
  priceRange: string | null;
};

type SearchPlace = {
  displayName?: { text?: string };
  primaryType?: string;
  types?: string[];
  shortFormattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  editorialSummary?: { text?: string };
  reviewSummary?: { text?: { text?: string } };
  priceRange?: {
    startPrice?: { currencyCode?: string; units?: string };
    endPrice?: { currencyCode?: string; units?: string };
  };
};

function formatPriceRange(r: SearchPlace["priceRange"]): string | null {
  const start = r?.startPrice?.units;
  if (!start) return null;
  const currency = r?.startPrice?.currencyCode ?? "";
  const end = r?.endPrice?.units;
  return `${currency} ${start}${end ? `-${end}` : "+"}`.trim();
}

// Small places (a landmark) have tiny viewports; widen to ~10 km so the
// searches still find what's around them.
function searchArea(place: ResolvedPlace) {
  const pad = 0.05;
  const v = place.viewport ?? {
    low: { latitude: place.location.lat, longitude: place.location.lng },
    high: { latitude: place.location.lat, longitude: place.location.lng },
  };
  const span = (a: number, b: number) => Math.abs(b - a);
  const grow = span(v.low.latitude, v.high.latitude) < 0.1 ? pad : 0;
  return {
    rectangle: {
      low: { latitude: v.low.latitude - grow, longitude: v.low.longitude - grow },
      high: { latitude: v.high.latitude + grow, longitude: v.high.longitude + grow },
    },
  };
}

async function searchNear(place: ResolvedPlace, textQuery: string): Promise<SearchPlace[]> {
  const res = await fetch(`${PLACES}/places:searchText`, {
    method: "POST",
    headers: headers(
      "places.displayName,places.primaryType,places.types,places.shortFormattedAddress,places.rating,places.userRatingCount,places.editorialSummary,places.reviewSummary,places.priceRange",
    ),
    body: JSON.stringify({ textQuery, pageSize: 20, locationRestriction: searchArea(place) }),
  });
  if (!res.ok) throw new Error(`Places text search failed: ${res.status}`);
  return ((await res.json()) as { places?: SearchPlace[] }).places ?? [];
}

/**
 * Real, currently listed places around the destination. The itinerary prompt
 * may only name places from this list (see src/lib/llm.ts).
 */
export async function getGroundingPlaces(place: ResolvedPlace): Promise<GroundingPlace[]> {
  // Sights for the days, streets and markets for wandering, restaurants so
  // every evening can name a real place to eat.
  const searches = await Promise.allSettled([
    searchNear(place, `top tourist attractions in ${place.label}`),
    searchNear(place, `neighborhoods, markets and food streets in ${place.label}`),
    searchNear(place, `popular local restaurants in ${place.label}`),
  ]);
  const found = searches.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  const seen = new Set<string>();
  const out: GroundingPlace[] = [];
  for (const p of found) {
    const name = p.displayName?.text;
    // Barely-reviewed listings are often mis-tagged or closed.
    if (!name || (p.userRatingCount ?? 0) < 30 || seen.has(name)) continue;
    seen.add(name);
    out.push({
      name,
      type: (p.primaryType ?? p.types?.[0] ?? "place").replace(/_/g, " "),
      area: p.shortFormattedAddress ?? "",
      rating: p.rating ?? null,
      reviews: p.userRatingCount ?? null,
      summary: p.editorialSummary?.text ?? null,
      // Trimmed: the first sentences carry the specifics, the rest repeats.
      highlights: p.reviewSummary?.text?.text?.slice(0, 400) ?? null,
      priceRange: formatPriceRange(p.priceRange),
    });
  }
  return out;
}
