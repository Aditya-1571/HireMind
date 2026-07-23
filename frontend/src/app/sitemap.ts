import type { MetadataRoute } from "next";

const siteUrl = (process.env.SITE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
