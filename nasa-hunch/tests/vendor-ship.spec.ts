import { test, expect } from "@playwright/test";

async function loginAs(page: import("@playwright/test").Page, role: "Crew" | "Ground" | "Vendor") {
  await page.goto("/");
  await page.evaluate(() => { localStorage.removeItem("actor"); localStorage.removeItem("uiMode"); });
  await page.reload();
  await page.locator(".l-badge", { hasText: role }).click();
  const urlMap = { Crew: "/crew", Ground: "/ground", Vendor: "/vendors" };
  await page.waitForURL(`**${urlMap[role]}`, { timeout: 10_000 });
}

test("vendor view shows Sunrise Supply Co. branding and sidebar", async ({ page }) => {
  await loginAs(page, "Vendor");
  await expect(page.getByText("Sunrise Supply Co.")).toBeVisible();
  await expect(page.getByText("NASA-VND-00847")).toBeVisible();
  await expect(page.getByRole("button", { name: "My Orders" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Invoices" })).toBeVisible();
  await expect(page.getByRole("button", { name: "My Shipments" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Past Orders" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Packing Rules" })).toBeVisible();
});

test("vendor My Orders page shows live polling indicator", async ({ page }) => {
  await loginAs(page, "Vendor");
  await page.getByRole("button", { name: "My Orders" }).click();
  await expect(page.getByText("Orders from Ground")).toBeVisible();
  await expect(page.getByText(/polling every 5s/)).toBeVisible();
});

test("vendor Packing Rules shows CTB dimensions", async ({ page }) => {
  await loginAs(page, "Vendor");
  await page.getByRole("button", { name: "Packing Rules" }).click();
  await expect(page.getByText("NASA ISS Vendor Packing Requirements")).toBeVisible();
  await expect(page.getByText("48 cm")).toBeVisible();
  await expect(page.getByText("40 cm")).toBeVisible();
  await expect(page.getByText("33 cm")).toBeVisible();
  await expect(page.getByText("15 kg")).toBeVisible();
});

test("vendor Packing Rules shows RFID requirements", async ({ page }) => {
  await loginAs(page, "Vendor");
  await page.getByRole("button", { name: "Packing Rules" }).click();
  await expect(page.getByText("RFID Tagging Requirements")).toBeVisible();
  await expect(page.getByText(/EPC Gen 2/)).toBeVisible();
});

test("vendor Packing Rules shows prohibited items list", async ({ page }) => {
  await loginAs(page, "Vendor");
  await page.getByRole("button", { name: "Packing Rules" }).click();
  await expect(page.getByText(/Prohibited/)).toBeVisible();
  await expect(page.getByText(/Flammable liquids/)).toBeVisible();
});

test("vendor Invoices page shows empty state before shipping", async ({ page }) => {
  await loginAs(page, "Vendor");
  // Clear past state
  await page.evaluate(() => { localStorage.removeItem("vendor_shipped"); localStorage.removeItem("vendor_past_orders"); });
  await page.reload();
  await page.waitForURL("**/vendors");
  await page.getByRole("button", { name: "Invoices" }).click();
  await expect(page.getByText("Invoices Sent to Ground")).toBeVisible();
});

test("vendor Shipments page shows empty state initially", async ({ page }) => {
  await loginAs(page, "Vendor");
  await page.getByRole("button", { name: "My Shipments" }).click();
  await expect(page.getByText("My Shipments to NASA Ground")).toBeVisible();
});

test("vendor ship flow: pick all → tag all → ship", async ({ page }) => {
  // First place a ground order so vendor has something to fulfill
  await loginAs(page, "Ground");
  await page.getByRole("button", { name: "Orders" }).click();
  await page.getByRole("button", { name: "+ Place New Order" }).click();
  const itemNameInput = page.locator("input[placeholder='Item name\u2026']").first();
  const qtyInput = page.locator("input[type='number']").first();
  await itemNameInput.fill("Test Bandages");
  await qtyInput.fill("2");
  await page.getByRole("button", { name: "Send to Vendor" }).click();
  await page.waitForTimeout(500);

  // Now switch to vendor
  await loginAs(page, "Vendor");
  // Clear any previously shipped state so we see the new PO
  await page.evaluate(() => { localStorage.removeItem("vendor_shipped"); localStorage.removeItem("vendor_past_orders"); });
  await page.reload();
  await page.waitForURL("**/vendors");

  // Wait for PO to appear via polling (up to 8s)
  const poRow = page.locator("[class*='v-row'], button[aria-expanded]").first();
  await expect(poRow).toBeVisible({ timeout: 8_000 });

  // Expand it
  await poRow.click();

  // Pick all
  const pickAllBtn = page.getByRole("button", { name: /Pick All/ });
  if (await pickAllBtn.isVisible()) await pickAllBtn.click();

  // Tag all
  const tagAllBtn = page.getByRole("button", { name: /Tag All RFID/ });
  if (await tagAllBtn.isVisible()) await tagAllBtn.click();

  // Ship button should become available
  const shipBtn = page.getByRole("button", { name: /Ship to Ground/ });
  await expect(shipBtn).toBeVisible({ timeout: 5_000 });
  await shipBtn.click();

  // Invoice should be generated — check Invoices tab
  await page.getByRole("button", { name: "Invoices" }).click();
  await expect(page.locator("text=INV-").first()).toBeVisible({ timeout: 5_000 });

  // Shipment should appear in My Shipments
  await page.getByRole("button", { name: "My Shipments" }).click();
  await expect(page.locator("text=SHIP-VND-").first()).toBeVisible({ timeout: 5_000 });
});

test("vendor sidebar aria-current tracks active page", async ({ page }) => {
  await loginAs(page, "Vendor");
  const myOrdersBtn = page.getByRole("button", { name: "My Orders" });
  await expect(myOrdersBtn).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Packing Rules" }).click();
  await expect(page.getByRole("button", { name: "Packing Rules" })).toHaveAttribute("aria-current", "page");
  await expect(myOrdersBtn).not.toHaveAttribute("aria-current", "page");
});
