import { expect, test } from "@playwright/test";

const graphReady = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  await expect(page.locator(".status")).toContainText(/[1-9]\d* nodes/, { timeout: 45_000 });
};

test("loads graph with nodes and edges", async ({ page }) => {
  await graphReady(page);
  const status = await page.locator(".status").textContent();
  const m = status?.match(/(\d+)\/(\d+) nodes · (\d+) edges/);
  expect(m).toBeTruthy();
  expect(Number(m![1])).toBeGreaterThan(0);
  await expect(page.locator(".graph-canvas canvas")).toBeVisible();
});

test("search → arrow-nav → enter selects node and opens detail card", async ({ page }) => {
  await graphReady(page);
  await page.keyboard.press("/");
  await page.keyboard.type("deep-plan");
  const results = page.locator(".search-results li");
  await expect(results.first()).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  const firstId = await page.locator(".search-results li .sr-id").first().textContent();
  await page.keyboard.press("Enter");
  await expect(page.locator(".search-results")).toBeHidden();
  await expect(page.locator(".detail-float .detail h3")).toHaveText(firstId!);
});

test("prefix filter reduces visible node count", async ({ page }) => {
  await graphReady(page);
  await page.locator(".topbar select").first().selectOption("follow");
  await expect(page.locator(".status")).toContainText("182/", { timeout: 15_000 });
});

test("issues toggle shows only nodes with findings", async ({ page }) => {
  await graphReady(page);
  await page.locator(".tb-btn[title*='findings']").click();
  await page.waitForFunction(
    () => (window as any).__net?.body.data.nodes.get().filter((n: any) => !n.hidden).length < 100,
    { timeout: 15_000 }
  );
});

test("cluster mode groups nodes into hexagon clusters", async ({ page }) => {
  await graphReady(page);
  await page.locator(".tb-btn[title*='cluster']").click();
  await page.waitForFunction(
    () => (window as any).__net?.body.data.nodes.length < 300,
    { timeout: 20_000 }
  );
  await page.locator(".tb-btn[title*='cluster']").click();
  await page.waitForFunction(
    () => (window as any).__net?.body.data.nodes.length > 300,
    { timeout: 20_000 }
  );
});

test("theme toggle switches light/dark class", async ({ page }) => {
  await graphReady(page);
  const app = page.locator(".app");
  await expect(app).not.toHaveClass(/light/);
  await page.keyboard.press("d");
  await expect(app).toHaveClass(/light/);
});

test("escape clears selection", async ({ page }) => {
  await graphReady(page);
  await page.locator(".top-list li").first().click();
  await expect(page.locator(".detail-float")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".detail-float")).toBeHidden();
});
