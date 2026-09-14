import { expect, test } from "@playwright/test";

const appReady = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  await expect(page.locator(".counts")).toContainText(/[1-9]\d* nodes/, { timeout: 45_000 });
};

test("loads graph with nodes, edges, and sidebar list", async ({ page }) => {
  await appReady(page);
  const counts = await page.locator(".counts").textContent();
  const m = counts?.match(/(\d+) nodes · (\d+) edges/);
  expect(m).toBeTruthy();
  expect(Number(m![1])).toBeGreaterThan(0);
  expect(Number(m![2])).toBeGreaterThan(0);
  await expect(page.locator(".graph-canvas canvas")).toBeVisible();
  await expect(page.locator(".node-list li").first()).toBeVisible();
});

test("sidebar tabs filter list by resource type", async ({ page }) => {
  await appReady(page);
  await page.locator(".tabs button", { hasText: "mcp" }).click();
  const items = page.locator(".node-list li .node-type");
  await expect(items.first()).toBeVisible();
  for (const t of await items.allTextContents()) expect(t).toBe("mcp");
});

test("click list item selects node and renders markdown preview", async ({ page }) => {
  await appReady(page);
  const first = page.locator(".node-list li").first();
  const id = await first.locator(".node-id").textContent();
  await first.click();
  await expect(page.locator(".preview-head h2")).toHaveText(id!);
  await expect(page.locator(".preview-body .md")).toBeVisible({ timeout: 15_000 });
});

test("search filters the sidebar list", async ({ page }) => {
  await appReady(page);
  const total = await page.locator(".node-list li").count();
  await page.keyboard.press("/");
  await page.keyboard.type("deep-plan");
  await expect(page.locator(".node-list li")).toHaveCount(1, { timeout: 10_000 });
  expect(total).toBeGreaterThan(1);
  await expect(page.locator(".node-list .node-id")).toHaveText("deep-plan");
});

test("prefix filter reduces visible list count", async ({ page }) => {
  await appReady(page);
  await page.locator(".tabs button", { hasText: "skills" }).click();
  await page.locator(".topbar select").selectOption("follow");
  await expect(page.locator(".node-list li").first()).toBeVisible();
  const ids = await page.locator(".node-list li .node-id").allTextContents();
  for (const id of ids) expect(id.startsWith("follow-")).toBeTruthy();
});

test("theme toggle switches light/dark class", async ({ page }) => {
  await appReady(page);
  const app = page.locator(".app");
  const wasLight = await app.evaluate((el) => el.classList.contains("light"));
  await page.keyboard.press("d");
  await expect(app).toHaveClass(wasLight ? /^(?!.*light).*$/ : /light/);
});

test("escape clears selection and preview returns to empty state", async ({ page }) => {
  await appReady(page);
  await page.locator(".node-list li").first().click();
  await expect(page.locator(".preview-head")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".preview-empty")).toBeVisible();
});
