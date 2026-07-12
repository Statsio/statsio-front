import { chromium } from 'playwright';

const TOKEN = '4|xqT9Suyh2SeB25AIfYHC0HaSuCQJk9mBgfWtj12I46012419';
const USER = { id: 2, email: 'contact@statsio.fr' };
const BASE = 'http://localhost:3000';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

await page.addInitScript(
  ({ token, user }) => {
    window.localStorage.setItem('statsio.auth.accessToken', token);
    window.localStorage.setItem('statsio.auth.tokenType', 'Bearer');
    window.localStorage.setItem('statsio.auth.user', JSON.stringify(user));
  },
  { token: TOKEN, user: USER },
);

console.log('Navigating to studio page...');
const start = Date.now();
try {
  await page.goto(`${BASE}/studio/statsdata/eaufrance`, { waitUntil: 'domcontentloaded', timeout: 20000 });
} catch (e) {
  console.log('NAV ERROR:', e.message);
}
console.log('Initial nav took', Date.now() - start, 'ms');

await page.screenshot({ path: '/tmp/claude-1000/-home-corentingesse-statsio-project/65310c96-0302-4abd-8062-8ae82df65664/scratchpad/01-initial.png' });

// Wait for the canvas (chart) to appear, or timeout gracefully — this is the crash-risk moment.
console.log('Waiting for chart canvas...');
const waitStart = Date.now();
let canvasFound = false;
try {
  await page.waitForSelector('canvas', { timeout: 30000 });
  canvasFound = true;
} catch (e) {
  console.log('CANVAS WAIT ERROR:', e.message);
}
console.log('Canvas wait took', Date.now() - waitStart, 'ms, found:', canvasFound);

// Give it a bit more time to finish any heavy computation, then check responsiveness.
await page.waitForTimeout(3000);

const responsive = await Promise.race([
  page.evaluate(() => 1 + 1).then(() => true),
  new Promise((resolve) => setTimeout(() => resolve(false), 8000)),
]);
console.log('Page responsive to JS eval:', responsive);

await page.screenshot({ path: '/tmp/claude-1000/-home-corentingesse-statsio-project/65310c96-0302-4abd-8062-8ae82df65664/scratchpad/02-after-wait.png', fullPage: true });

console.log('Console errors count:', consoleErrors.length);
for (const e of consoleErrors.slice(0, 20)) console.log('  -', e);

await browser.close();
console.log('DONE');
