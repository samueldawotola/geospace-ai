import OpenAI from "openai";
import type { StickyScrollCardItem } from "@/components/ui/sticky-scroll-cards";

const openai = new OpenAI();
const RANK_MODEL = "gpt-5.4-mini";

// Filename-based: catches things identifiable from the file's title alone.
const EXCLUDE_FILENAME = /flag_of|coat_of_arms|locator_map|_map_|satview|satellite|\.svg$|icon/i;

// Caption-based: many map/satellite images (e.g. "Kyoto_city_map.png", or a
// storm captured from orbit) don't say so in the filename, only in the
// human-written caption Wikipedia attaches to them.
const EXCLUDE_CAPTION = /\b(map|locator|satellite|cyclone|hurricane|typhoon)\b/i;

// How many non-excluded candidates to pull before picking the final set.
// Larger than `limit` so there's real material for the ranking step below to
// choose from instead of just whatever happened to appear first in the article.
const POOL_SIZE = 20;

function cleanPhotoTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\.[a-zA-Z0-9]+$/, "") // strip file extension
    .replace(/_/g, " ")
    .replace(/\([^)]*\d[^)]*\)/g, " ") // drop parenthetical IDs, e.g. (44050138950)
    .replace(/\d+/g, " ") // drop remaining numbers, e.g. dates, index suffixes
    .replace(/\s*,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/[,-]\s*$/, "")
    .trim();
}

type Candidate = StickyScrollCardItem & { caption?: string };

// Wikipedia article image order follows the article's prose (history, then
// geography, then culture, ...), not visual distinctiveness — a place's most
// iconic, recognizable sights (Socotra's dragon's blood trees, say) can easily
// end up past a plain "first N" cutoff. Ask the model to pick the subset that
// most instantly reads as *this* place, using the same free/licensed Wikimedia
// pool — this only re-ranks existing candidates, it never sources or displays
// anything beyond that pool.
async function pickMostIconic(
  destination: string,
  candidates: Candidate[],
  limit: number,
): Promise<Candidate[]> {
  if (candidates.length <= limit) return candidates;

  try {
    const listing = candidates
      .map((c, i) => `${i}: ${c.title}${c.caption ? ` — ${c.caption}` : ""}`)
      .join("\n");

    const response = await openai.responses.create({
      model: RANK_MODEL,
      input: [
        {
          role: "system",
          content:
            "You pick photos for a travel app. Given a destination and a numbered list " +
            "of candidate Wikimedia photos (title and caption when known), choose the " +
            "ones that most instantly and iconically represent that specific place — " +
            "famous natural features, landmarks, or scenery over generic streets, " +
            "buildings, transit, or historical portraits, unless nothing more iconic " +
            "is available. Order your picks best-first.",
        },
        {
          role: "user",
          content: `Destination: ${destination}\n\nCandidates:\n${listing}\n\nPick up to ${limit}.`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "photo_picks",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              selected: { type: "array", items: { type: "integer" } },
            },
            required: ["selected"],
          },
          strict: true,
        },
      },
    });

    const { selected } = JSON.parse(response.output_text) as {
      selected: number[];
    };

    const picked = selected
      .map((i) => candidates[i])
      .filter((c): c is Candidate => c !== undefined);

    if (picked.length === 0) return candidates.slice(0, limit);

    const seen = new Set(picked);
    for (const c of candidates) {
      if (picked.length >= limit) break;
      if (!seen.has(c)) picked.push(c);
    }

    return picked.slice(0, limit);
  } catch (err) {
    console.error("Failed to rank destination photos:", err);
    return candidates.slice(0, limit);
  }
}

export async function getDestinationPhotos(
  destination: string,
  limit = 6,
): Promise<StickyScrollCardItem[]> {
  try {
    // Search on just the locality (e.g. "Miami" out of "Miami, FL, USA") —
    // state/country suffixes throw off Wikipedia's relevance ranking and can
    // match an unrelated article with few or no usable photos.
    const searchTerm = destination.split(",")[0].trim() || destination;

    const searchUrl = `https://en.wikipedia.org/w/api.php?${new URLSearchParams(
      {
        action: "query",
        list: "search",
        srsearch: searchTerm,
        srlimit: "1",
        format: "json",
        origin: "*",
      },
    )}`;

    const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } });
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const title = searchData?.query?.search?.[0]?.title;
    if (!title) return [];

    const mediaRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`,
      { next: { revalidate: 86400 } },
    );
    if (!mediaRes.ok) return [];
    const mediaData = await mediaRes.json();

    const items = (mediaData?.items ?? []) as Array<{
      title?: string;
      type?: string;
      caption?: { text?: string };
      srcset?: Array<{ src?: string; scale?: string }>;
    }>;

    const candidates: Candidate[] = [];
    for (const item of items) {
      if (item.type !== "image") continue;
      const rawTitle = item.title?.replace(/^File:/, "") ?? "";
      const rawSrc = item.srcset?.at(-1)?.src;
      if (!rawTitle || !rawSrc || EXCLUDE_FILENAME.test(rawTitle)) continue;

      const captionText = item.caption?.text;
      if (captionText && EXCLUDE_CAPTION.test(captionText)) continue;

      const cleanTitle = cleanPhotoTitle(rawTitle);
      if (!cleanTitle) continue;

      const src = rawSrc.startsWith("//") ? `https:${rawSrc}` : rawSrc;
      candidates.push({ title: cleanTitle, src, caption: captionText });
      if (candidates.length >= POOL_SIZE) break;
    }

    const picked = await pickMostIconic(searchTerm, candidates, limit);
    return picked.map(({ title, src }) => ({ title, src }));
  } catch (err) {
    console.error("Failed to fetch destination photos:", err);
    return [];
  }
}
