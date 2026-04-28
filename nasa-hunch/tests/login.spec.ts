import { test, expect } from "@playwright/test";

// Requires: npm run dev (port 5173) + backend on port 8080 (NO_DB=1)

const CREW_BADGE   = "0003070837";
const GROUND_BADGE = "0003104127";
const VENDOR_BADGE = "0003200001";

test.beforeEach(async ({ page }) => {
  // Clear auth so each test starts at login
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("actor");
    localStorage.removeItem("uiMode");
  });
  await page.reload();
});

test("login page renders DSLM branding and test badge buttons", async ({ page }) => {
  await expect(page.getByText("DSLM")).toBeVisible();
  await expect(page.getByText("Inventory System")).toBeVisible();
  // All three role buttons visible
  await expect(page.getByText("Crew")).toBeVisible();
  await expect(page.getByText("Ground")).toBeVisible();
  await expect(page.getByText("Vendor")).toBeVisible();
});

test("crew badge login navigates to /crew", async ({ page }) => {
  // Click the Crew test badge button
  await page.locator(".l-badge", { hasText: "Crew" }).click();
  await page.waitForURL("**/crew", { timeout: 10_000 });
  await expect(page).toHaveURL(/\/crew$/);
  await expect(page.getByText("DSLM")).toBeVisible();
});

test("ground badge login navigates to /ground", async ({ page }) => {
  await page.locator(".l-badge", { hasText: "Ground" }).click();
  await page.waitForURL("**/ground", { timeout: 10_000 });
  await expect(page).toHaveURL(/\/ground$/);
});

test("vendor badge login navigates to /vendors", async ({ page }) => {
  await page.locator(".l-badge", { hasText: "Vendor" }).click();
  await page.waitForURL("**/vendors", { timeout: 10_000 });
  await expect(page).toHaveURL(/\/vendors$/);
});

test("manual badge input + Enter key triggers login", async ({ page }) => {
  const input = page.locator(".l-input").first();
  await input.fill(CREW_BADGE);
  await input.press("Enter");
  await page.waitForURL("**/crew", { timeout: 10_000 });
  await expect(page).toHaveURL(/\/crew$/);
});

test("unknown badge shows error message", async ({ page }) => {
  const input = page.locator(".l-input").first();
  await input.fill("9999999999");
  await input.press("Enter");
  await expect(page.getByText(/Unknown badge/)).toBeVisible({ timeout: 5_000 });
});

test("theme toggle switches between dark and light", async ({ page }) => {
  const toggle = page.getByLabel("Toggle theme");
  const html = page.locator("html");
  const initialTheme = await html.getAttribute("data-theme");
  await toggle.click();
  const newTheme = await html.getAttribute("data-theme");
  expect(newTheme).not.toBe(initialTheme);
});
