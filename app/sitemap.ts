import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Public routes only. Everything under /dashboard, /collection and /profile
 * requires a session, so it is deliberately absent.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/globe`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
