import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export default defineConfig({
  testDir: './tests/seo',
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: fs.existsSync(chrome) ? { executablePath: chrome } : {},
    trace: 'retain-on-failure'
  },
  webServer: { command: 'node scripts/seo/serve-dist.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: false }
});
