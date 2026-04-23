import { test, expect } from "@playwright/test";

test("landing page renders the prompt input", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /crie com o imagin/i })).toBeVisible();
  await expect(
    page.getByPlaceholder(/descreva um objeto|armário para banheiro/i),
  ).toBeVisible();
});

test("unauthenticated submit redirects to /login preserving prompt", async ({ page }) => {
  await page.goto("/");
  const input = page.getByPlaceholder(/descreva um objeto|armário para banheiro/i);
  await input.fill("Armário para banheiro");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/login/);
  await expect(page).toHaveURL(/prompt=/);
});
