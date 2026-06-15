const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    baseURL: 'https://ttgshop.vn',
    // headless: false,
    launchOptions: {
      // slowMo: 500,
      // AdBlocker: chặn script quảng cáo (Google Ads, Criteo) ở cấp DNS ngay khi mở trình duyệt
      args: [
        '--host-rules=MAP *.googlesyndication.com 127.0.0.1, MAP *.doubleclick.net 127.0.0.1, MAP *.googleadservices.com 127.0.0.1, MAP *.google-analytics.com 127.0.0.1, MAP *.googletagservices.com 127.0.0.1, MAP *.criteo.com 127.0.0.1, MAP *.criteo.net 127.0.0.1',
      ],
    },
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
