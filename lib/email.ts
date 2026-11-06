import { Resend } from "resend";

// Optional by design: every email here is a nice-to-have, not a submission
// requirement, so a missing/misconfigured key must never break or delay the
// actual recommendation POST — it just silently no-ops instead.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "Food Recommendations <onboarding@resend.dev>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type NewRecommendationEmail = {
  id: number;
  dishName: string;
  restaurantName: string;
  rating: number;
  price: number;
  reviewerName: string | null;
};

// NOTIFY_EMAIL must be the Resend account's own signup address until a sending
// domain is verified — the sandbox sender can only deliver to that one inbox.
export async function sendNewRecommendationEmail(rec: NewRecommendationEmail) {
  const to = process.env.NOTIFY_EMAIL;
  if (!resend || !to) return;

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/recommendation/${rec.id}`;
  const by = rec.reviewerName ? ` by ${escapeHtml(rec.reviewerName)}` : "";

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `New recommendation: ${rec.dishName} at ${rec.restaurantName}`,
      html: `<p><strong>${escapeHtml(rec.dishName)}</strong> at ${escapeHtml(rec.restaurantName)}${by}</p><p>${"★".repeat(rec.rating)}${"☆".repeat(5 - rec.rating)} · ₹${rec.price}</p><p><a href="${url}">${url}</a></p>`,
    });
  } catch (err) {
    console.error("Failed to send new-recommendation email", err);
  }
}

export async function sendEditLinkEmail(to: string, dishName: string, id: number, editToken: string) {
  if (!resend) return;

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const editUrl = `${siteUrl}/edit/${id}?token=${editToken}`;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Your edit link for "${dishName}"`,
      html: `<p>Thanks for recommending <strong>${dishName}</strong>!</p><p>Save this link to edit or delete your post later — it works on any device, even if you clear your browser data:</p><p><a href="${editUrl}">${editUrl}</a></p>`,
    });
  } catch (err) {
    console.error("Failed to send edit-link email", err);
  }
}
