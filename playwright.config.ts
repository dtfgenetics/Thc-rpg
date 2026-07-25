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
      command: "bash -lc 'npm run start -w apps/api 2>&1 | tee api-server.log'",
      url: "http://127.0.0.1:4000/health",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe"
    },
    {
      command: "bash -lc 'npm run start -w apps/web -- -H 127.0.0.1 -p 3000 2>&1 | tee web-server.log'",
      url: "http://127.0.0.1:3000/games/pheno-quest/grove",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe"
    }
  ]
});
