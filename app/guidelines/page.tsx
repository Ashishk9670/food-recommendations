import { BadgeCheck, BookOpen, Camera, Flag, IndianRupee, KeyRound, Soup, Star, Tags } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { KEYWORD_RULES } from "@/lib/detectCategory";
import { MAX_PHOTOS_PER_RECOMMENDATION } from "@/lib/limits";
import { RATING_LABELS } from "@/lib/ratings";

export const metadata: Metadata = {
  title: "Tasting Guidelines · Food Recommendations",
  description: "How to write a recommendation colleagues can trust: ratings, notes, photos and price.",
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-card p-5 shadow-card sm:p-6">
      <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-ink">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        {title}
      </h2>
      <div className="space-y-2 text-[15px] leading-6 text-muted">{children}</div>
    </section>
  );
}

export default function GuidelinesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <section className="mb-8">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent">
          <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
          For a trusted team database
        </p>
        <h1 className="text-[30px] font-extrabold leading-[38px] tracking-tight text-ink sm:text-[40px] sm:leading-[48px]">
          Tasting Guidelines
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-6 text-muted">
          A recommendation is only useful if colleagues can trust it. Here&apos;s what makes a good
          one.
        </p>
      </section>

      <div className="space-y-5">
        <Section icon={BadgeCheck} title="Keep it authentic">
          <p>
            Only recommend dishes you&apos;ve ordered and eaten yourself. There are no sponsored
            listings here — every post comes from a colleague.
          </p>
        </Section>

        <Section icon={Star} title="How the stars work">
          <ul className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => (
              <li key={stars} className="flex items-center gap-3">
                <span className="w-16 flex-shrink-0 font-semibold text-star" aria-label={`${stars} stars`}>
                  {"★".repeat(stars)}
                </span>
                <span className="text-ink">{RATING_LABELS[stars]}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Soup} title="Notes that help">
          <p>One or two lines go a long way. The most useful notes mention:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Spice level, and whether it can be made milder</li>
            <li>Portion size — is it enough for one, or two light eaters?</li>
            <li>What to order with it, and what to skip</li>
            <li>Delivery time or wait at lunch rush, if it was notable</li>
          </ul>
        </Section>

        <Section icon={Camera} title="Photos">
          <p>
            Add up to {MAX_PHOTOS_PER_RECOMMENDATION} of your own photos (JPEG, PNG, WEBP, HEIC or
            GIF). Big phone photos are resized automatically before upload, so there&apos;s no need to
            shrink them yourself. An overhead or side angle that shows the portion beats a menu picture.
            The first photo is the cover on the card. On a phone you can take the photo straight from
            the form.
          </p>
        </Section>

        <Section icon={IndianRupee} title="Price">
          <p>
            Enter what you actually paid after any Swiggy, Zomato or dine-in discount, so the budget
            filters reflect real lunch costs.
          </p>
        </Section>

        <Section icon={Tags} title="Categories">
          <p>
            The form picks a category from the dish name as you type; tap a different one if it
            guessed wrong. What it looks for:
          </p>
          <ul className="space-y-2">
            {KEYWORD_RULES.map((rule) => (
              <li key={rule.category} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                <CategoryBadge category={rule.category} className="w-fit" />
                <span className="text-sm">{rule.keywords.slice(0, 8).join(", ")}…</span>
              </li>
            ))}
            <li className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
              <CategoryBadge category="Other" className="w-fit" />
              <span className="text-sm">Anything else.</span>
            </li>
          </ul>
        </Section>

        <Section icon={Flag} title="Comments and reporting">
          <p>
            Keep comments kind and about the food. If a post looks fake, offensive or misplaced, use
            the flag on its card — it goes to the admins&apos; moderation queue, who can dismiss the
            report or remove the post.
          </p>
        </Section>

        <Section icon={KeyRound} title="Editing your posts">
          <p>
            There are no accounts. The browser you post from keeps a private edit key, so you can
            edit or delete your posts from that browser — see{" "}
            <Link href="/me" className="font-semibold text-accent hover:underline">
              My recommendations
            </Link>
            . Clearing site data or switching device loses that key.
          </p>
        </Section>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/submit"
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover"
        >
          Recommend a dish
        </Link>
      </div>
    </div>
  );
}
