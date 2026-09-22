import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const outDir = path.resolve('docs/screenshots');
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto('http://localhost:5180/login', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(outDir, '01-login.png') });

await page.getByRole('button', { name: /open the floor/i }).click();
await page.waitForURL('http://localhost:5180/');
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(outDir, '02-studio.png') });

const shots = [
  ['/board', '03-board.png'],
  ['/projects', '04-projects.png'],
  ['/attendance', '05-attendance.png'],
  ['/reports', '06-reports.png'],
  ['/people', '07-people.png'],
  ['/bugs', '08-bugs.png'],
];

for (const [url, file] of shots) {
  await page.goto(`http://localhost:5180${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(outDir, file) });
}

await browser.close();
console.log('Saved screenshots to', outDir);
