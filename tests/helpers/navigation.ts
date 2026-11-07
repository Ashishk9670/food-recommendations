import { expect, type Page } from "@playwright/test";

// Open /submit and wait until the form has hydrated. Events fired before then
// (notably file-input `change` and `drop`) hit DOM with no handlers attached
// and are silently lost. Pages hydrate per Suspense boundary, so a signal from
// the header isn't enough — the photo buttons stay disabled until the form
// itself is interactive, which makes them the right thing to wait on.
export async function gotoSubmitReady(page: Page) {
  await page.goto("/submit");
  await expect(page.getByRole("button", { name: "Upload Photos" })).toBeEnabled();
}
