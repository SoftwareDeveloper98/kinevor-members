import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, '..', '..', 'docs', 'screenshots');
const webUrl = process.env.KINEVOR_WEB_URL ?? 'http://localhost:4202';
const apiUrl = process.env.KINEVOR_API_URL ?? 'http://localhost:5083';
const channel = process.env.PLAYWRIGHT_CHANNEL ?? 'chrome';

const browser = await chromium.launch(channel ? { channel } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });

try {
  await mkdir(output, { recursive: true });

  await page.goto(`${webUrl}/members`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('kinevor-member-directory .member-card', { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: resolve(output, 'web-directory.png'),
    fullPage: true,
  });
  console.log('saved web-directory.png');

  await page.goto(
    `${webUrl}/members/11111111-1111-1111-1111-111111111111`,
    { waitUntil: 'domcontentloaded' },
  );
  await page.waitForSelector('kinevor-member-detail .detail-hero', { timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: resolve(output, 'web-member-detail.png'),
    fullPage: true,
  });
  console.log('saved web-member-detail.png');

  await page.goto(`${webUrl}/me`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('kinevor-member-profile .profile-hero', { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: resolve(output, 'web-member-profile.png'),
    fullPage: true,
  });
  console.log('saved web-member-profile.png');

  await page.goto(`${apiUrl}/swagger/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.swagger-ui .info', { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: resolve(output, 'api-swagger.png'),
    fullPage: true,
  });
  console.log('saved api-swagger.png');
} finally {
  await browser.close();
}
