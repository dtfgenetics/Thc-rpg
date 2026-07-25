import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["line"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } }
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] }
    }
  ],
  webServer: [
    {
      command: "npm run start -w apps/api",
      url: "http://127.0.0.1:4000/health",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI
    },
    {
      command: "npm run start -w apps/web",
      url: "http://127.0.0.1:3000/games/pheno-quest/grove",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI
    }
  ]
});
