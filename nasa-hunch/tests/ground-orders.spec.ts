import { test, expect } from "@playwright/test";

// Requires: npm run dev (5173) + backend on 8080 (NO_DB=1)

async function loginAs(page: import("@playwright/test").Page, role: "Crew" | "Ground" | "Vendor") {
  await page.goto("/");
  await page.evaluate(() => { localStorage.removeItem("actor"); localStorage.removeItem("uiMode"); });
  await page.reload();
  await page.locator(".l-badge", { hasText: role }).click();
  const urlMap = { Crew: "/crew", Ground: "/ground", Vendor: "/vendors" };
  await page.waitForURL(`**${urlMap[role]}`, { timeout: 10_000 });
}

test("ground view shows DSLM Ground branding and sidebar", async ({ page }) => {
  await loginAs(page, "Ground");
  await expect(page.getByText("DSLM")).toBeVisible();
  await expect(page.getByText("Ground Control")).toBeVisible();
  // Sidebar nav items
  await expect(page.getByRole("button", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Orders" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Receive" })).toBeVisible();
});

test("ground can navigate to Orders screen", async ({ page }) => {
  await loginAs(page, "Ground");
  await page.getByRole("button", { name: "Orders" }).click();
  await expect(page.getByText("Purchase Orders to Vendor")).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Place New Order" })).toBeVisible();
});

test("ground can place a new purchase order", async ({ page }) => {
  await loginAs(page, "Ground");
  await page.getByRole("button", { name: "Orders" }).click();

  await page.getByRole("button", { name: "+ Place New Order" }).click();
  // Form should appear
  await expect(page.getByText("New Purchase Order")).toBeVisible();

  // Fill item name and quantity
  const itemNameInput = page.locator("input[placeholder='Item name\u2026']").first();
  const qtyInput = page.locator("input[type='number']").first();
  await itemNameInput.fill("Medical Gloves");
  await qtyInput.fill("10");

  await page.getByRole("button", { name: "Send to Vendor" }).click();
  // Form should close
  await expect(page.getByText("New Purchase Order")).not.toBeVisible({ timeout: 5_000 });
  // New PO should appear in the list
  await expect(page.locator("text=Medical Gloves").first()).toBeVisible({ timeout: 8_000 });
});

test("ground can navigate to Receive screen", async ({ page }) => {
  await loginAs(page, "Ground");
  await page.getByRole("button", { name: "Receive" }).click();
  // Receive screen should be mounted
  await expect(page.locator("main")).toBeVisible();
});

test("ground can navigate to Tag screen", async ({ page }) => {
  await loginAs(page, "Ground");
  await page.getByRole("button", { name: "Tag" }).click();
  await expect(page.locator("main")).toBeVisible();
});

test("ground can navigate to Pack screen", async ({ page }) => {
  await loginAs(page, "Ground");
  await page.getByRole("button", { name: "Pack" }).click();
  await expect(page.locator("main")).toBeVisible();
});

test("ground sidebar has correct aria-current on active item", async ({ page }) => {
  await loginAs(page, "Ground");
  // Dashboard is default active
  const dashBtn = page.getByRole("button", { name: "Dashboard" });
  await expect(dashBtn).toHaveAttribute("aria-current", "page");
  // Switch to Orders
  await page.getByRole("button", { name: "Orders" }).click();
  const ordersBtn = page.getByRole("button", { name: "Orders" });
  await expect(ordersBtn).toHaveAttribute("aria-current", "page");
  await expect(dashBtn).not.toHaveAttribute("aria-current", "page");
});

test("ground logout returns to login page", async ({ page }) => {
  await loginAs(page, "Ground");
  await page.getByRole("button", { name: "Logout" }).first().click();
  await page.waitForURL("**/", { timeout: 5_000 });
  await expect(page.getByText("DSLM")).toBeVisible();
  await expect(page.getByText("Inventory System")).toBeVisible();
});
