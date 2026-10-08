/**
 * Canonical public origin, used by metadata, robots.ts and sitemap.ts.
 *
 * Note the apex domain 308-redirects to www, so the canonical host is www —
 * pointing crawlers at the apex would make every sitemap URL a redirect.
 *
 * APP_BASE_URL is Auth0's callback origin (localhost in development), so it is
 * only used when it is not localhost; otherwise fall back to production.
 */
const FALLBACK = "https://www.geospace-ai.com";

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_BASE_URL;
  if (configured && !configured.includes("localhost")) {
    return configured.replace(/\/$/, "");
  }
  return FALLBACK;
}

export const SITE_URL = resolveSiteUrl();
