import type { MetadataRoute } from "next";
import { getRestaurants } from "@/lib/restaurants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const restaurants = await getRestaurants().catch(() => []);

  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/submit`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/restaurants`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/guidelines`, changeFrequency: "monthly", priority: 0.5 },
    ...restaurants.map((spot) => ({
      url: `${baseUrl}/restaurants/${spot.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
