import type { Metadata } from "next";
import SubmitForm from "@/components/SubmitForm";
import { getCommunityStats } from "@/lib/community";

export const metadata: Metadata = {
  title: "Recommend a Dish · Food Recommendations",
};

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ restaurant?: string }>;
}) {
  const [{ restaurant }, stats] = await Promise.all([searchParams, getCommunityStats()]);
  return (
    <SubmitForm
      initialRestaurant={typeof restaurant === "string" ? restaurant.slice(0, 100) : ""}
      stats={{
        dishes: stats.dishes,
        thisWeek: stats.thisWeek,
        withNotes: stats.withNotes,
        withoutNotes: stats.withoutNotes,
      }}
    />
  );
}
