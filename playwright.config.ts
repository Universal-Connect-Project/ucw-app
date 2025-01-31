import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 10000,
  testMatch: /.*\.playwright.ts/,
  reporter: [
    ['html']
  ],
  use: {
    trace: 'on-first-retry',
  }
};
export default config;

//npx playwright install chromium