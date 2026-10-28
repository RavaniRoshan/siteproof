import { test, expect } from "@playwright/test";

test("login and view demo project", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo@siteproof.local");
  await page.getByLabel("Password").fill("demo-password-123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("link", { name: /Site A/ }).click();
  await expect(page.getByRole("heading", { name: /Site A/ })).toBeVisible();
});

test("packet preview shows unapproved variation excluded", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo@siteproof.local");
  await page.getByLabel("Password").fill("demo-password-123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.goto("/packets/new?projectId=demo-project-1");
  const checkboxes = page.locator('input[type="checkbox"]');
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await checkboxes.nth(2).check();
  await page.getByRole("button", { name: "Create draft packet" }).click();
  await expect(page.getByText("approval_requested")).toBeVisible();
  await expect(page.getByText("no", { exact: true })).toBeVisible();
});
