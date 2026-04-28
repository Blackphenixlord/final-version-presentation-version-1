import { test, expect } from "@playwright/test";

async function loginAs(page: import("@playwright/test").Page, role: "Crew" | "Ground" | "Vendor") {
  await page.goto("/");
  await page.evaluate(() => { localStorage.removeItem("actor"); localStorage.removeItem("uiMode"); });
  await page.reload();
  await page.locator(".l-badge", { hasText: role }).click();
  const urlMap = { Crew: "/crew", Ground: "/ground", Vendor: "/vendors" };
  await page.waitForURL(`**${urlMap[role]}`, { timeout: 10_000 });
}

test("crew view shows DSLM Crew branding and sidebar", async ({ page }) => {
  await loginAs(page, "Crew");
  await expect(page.getByText("DSLM")).toBeVisible();
  await expect(page.getByText("Inventory Operations")).toBeVisible();
  await expect(page.getByRole("button", { name: "Take out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Put back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Throw away" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Low Resources" })).toBeVisible();
  await expect(page.getByRole("button", { name: "3D Module" })).toBeVisible();
});

test("crew Take out screen is active by default", async ({ page }) => {
  await loginAs(page, "Crew");
  const takeBtn = page.getByRole("button", { name: "Take out" });
  await expect(takeBtn).toHaveAttribute("aria-current", "page");
  await expect(page.locator("main")).toBeVisible();
});

test("crew can navigate to Put back screen", async ({ page }) => {
  await loginAs(page, "Crew");
  await page.getByRole("button", { name: "Put back" }).click();
  const putBackBtn = page.getByRole("button", { name: "Put back" });
  await expect(putBackBtn).toHaveAttribute("aria-current", "page");
  await expect(page.locator("main")).toBeVisible();
});

test("crew can navigate to Throw away screen", async ({ page }) => {
  await loginAs(page, "Crew");
  await page.getByRole("button", { name: "Throw away" }).click();
  await expect(page.getByRole("button", { name: "Throw away" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("main")).toBeVisible();
});

test("crew can navigate to Low Resources screen", async ({ page }) => {
  await loginAs(page, "Crew");
  await page.getByRole("button", { name: "Low Resources" }).click();
  await expect(page.getByRole("button", { name: "Low Resources" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("main")).toBeVisible();
});

test("crew 3D Module lazy-loads without crashing", async ({ page }) => {
  await loginAs(page, "Crew");
  await page.getByRole("button", { name: "3D Module" }).click();
  // Loading spinner or actual canvas — either is fine
  await expect(page.locator("main")).toBeVisible();
  // Give time for lazy load; canvas or fallback text should appear
  await page.waitForTimeout(3_000);
  await expect(page.locator("main")).toBeVisible();
});

test("crew sidebar nav uses role=navigation with aria-label", async ({ page }) => {
  await loginAs(page, "Crew");
  await expect(page.getByRole("navigation", { name: "Crew operations" })).toBeVisible();
});

test("crew main content has accessible landmark", async ({ page }) => {
  await loginAs(page, "Crew");
  await expect(page.getByRole("main")).toBeVisible();
});

test("skip link is present and focusable", async ({ page }) => {
  await loginAs(page, "Crew");
  const skipLink = page.locator(".skip-link");
  await expect(skipLink).toBeAttached();
  // Tab to it from top of page
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  // Focus should have moved to main content
  const main = page.locator("#crew-main");
  await expect(main).toBeFocused();
});

test("crew synced pill shows timestamp", async ({ page }) => {
  await loginAs(page, "Crew");
  await expect(page.getByText("Synced")).toBeVisible();
});

test("crew logout returns to login page", async ({ page }) => {
  await loginAs(page, "Crew");
  await page.getByRole("button", { name: "Logout" }).first().click();
  await page.waitForURL("**/", { timeout: 5_000 });
  await expect(page.getByText("Inventory System")).toBeVisible();
});
