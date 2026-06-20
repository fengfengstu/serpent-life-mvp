import { chromium } from "playwright";

const target = process.env.QA_URL ?? "http://localhost:4180/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const logs = [];
page.on("console", (msg) => {
  const text = msg.text();
  if (!text.includes("ReadPixels")) logs.push(`${msg.type()}: ${text}`);
});
page.on("pageerror", (err) => logs.push(`pageerror: ${err.message}`));
page.on("requestfailed", (req) => logs.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`));

await page.goto(target, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1000);
await page.mouse.move(180, 600);
await page.mouse.down();
await page.mouse.move(80, 500, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(2200);
await page.screenshot({ path: "qa-defold-spike-mobile-after-input.png", fullPage: false });

const info = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return { hasCanvas: false };
  const rect = canvas.getBoundingClientRect();
  return {
    hasCanvas: true,
    width: canvas.width,
    height: canvas.height,
    cssWidth: Math.round(rect.width),
    cssHeight: Math.round(rect.height),
    highDprBackingStore: canvas.width >= Math.round(rect.width) * 2,
    bodyText: document.body.innerText.slice(0, 120),
  };
});

await browser.close();

const failures = [];
if (!info.hasCanvas) failures.push("missing canvas");
if (!info.highDprBackingStore) failures.push("canvas is not high-DPR");
if (logs.some((line) => line.startsWith("pageerror") || line.startsWith("requestfailed"))) failures.push("runtime or request failure");

console.log(JSON.stringify({ target, info, logs, failures }, null, 2));
if (failures.length) process.exit(1);

