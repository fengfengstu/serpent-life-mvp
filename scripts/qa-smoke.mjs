import { chromium } from "playwright";

const target = process.env.QA_URL ?? "http://localhost:4174/";
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "small", width: 320, height: 568 },
];

function visibleUiOverflowScript() {
  const bad = [];
  for (const el of document.querySelectorAll("#ui-root *")) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) {
      bad.push({
        className: String(el.className),
        text: el.textContent?.slice(0, 40),
        rect: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)],
      });
    }
  }
  return bad;
}

async function runViewport(browser, viewport) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const logs = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) logs.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => logs.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => logs.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`));

  await page.goto(target, { waitUntil: "networkidle" });
  await page.screenshot({ path: `qa-smoke-${viewport.name}-menu.png`, fullPage: false });
  await page.locator("[data-action='start']").tap();
  await page.waitForTimeout(650);
  const first = await page.evaluate(() => {
    const scene = window.__SERPENT_LIFE__.scene.keys.SerpentLifeScene;
    const cam = scene.cameras.main;
    return {
      mode: scene.mode,
      hp: scene.run.coreHp,
      segments: scene.run.segments,
      pickups: scene.pickups.length,
      visibleEnemies: scene.enemies.filter((e) => e.x > cam.scrollX && e.x < cam.scrollX + innerWidth && e.y > cam.scrollY && e.y < cam.scrollY + innerHeight).length,
      textures: [
        "impact-1",
        "player-projectile",
        "enemy-projectile",
        "arena-v5",
        "snake-head-v5",
        "snake-body-v5",
        "snake-memory-v5",
        "snake-tail-v5",
        "vfx-fire-ring-v5",
        "vfx-frost-field-v5",
        "vfx-shield-star-v5",
        "vfx-lightning-core-v5",
        "enemy-drifter-v5",
        "enemy-hunter-v5",
        "enemy-bloomer-v5",
        "boss-core-v5",
      ].map((key) => [key, scene.textures.exists(key)]),
      textureSourceSizes: [
        "arena-v5",
        "snake-head-v5",
        "vfx-fire-ring-v5",
        "enemy-drifter-v5",
      ].map((key) => {
        const source = scene.textures.get(key).source[0];
        return [key, source.width, source.height];
      }),
      firstEnemyTexture: scene.enemies[0]?.sprite?.texture?.key ?? null,
      canvas: (() => {
        const c = document.querySelector("canvas");
        return { cssWidth: c.clientWidth, cssHeight: c.clientHeight, width: c.width, height: c.height, dpr: devicePixelRatio };
      })(),
    };
  });
  await page.screenshot({ path: `qa-smoke-${viewport.name}-first.png`, fullPage: false });
  const skillVisuals = await page.evaluate(() => {
    const scene = window.__SERPENT_LIFE__.scene.keys.SerpentLifeScene;
    ["fire", "frost", "turret", "shield", "lightning"].forEach((id) => {
      scene.run.skills[id] = 1;
    });
    scene.renderSkillAuras();
    return {
      skillLayerChildren: scene.skillLayer?.length ?? 0,
      skills: { ...scene.run.skills },
    };
  });
  await page.screenshot({ path: `qa-smoke-${viewport.name}-skills.png`, fullPage: false });

  await page.mouse.move(viewport.width * 0.38, viewport.height * 0.72);
  await page.mouse.down();
  await page.mouse.move(viewport.width * 0.8, viewport.height * 0.76, { steps: 8 });
  const joystick = await page.evaluate(() => {
    const scene = window.__SERPENT_LIFE__.scene.keys.SerpentLifeScene;
    return {
      pointerState: scene.pointerState,
      joyBase: scene.hud?.joyBase ? { x: Math.round(scene.hud.joyBase.x), y: Math.round(scene.hud.joyBase.y) } : null,
      joyKnob: scene.hud?.joyKnob ? { x: Math.round(scene.hud.joyKnob.x), y: Math.round(scene.hud.joyKnob.y) } : null,
      targetAngle: Number(scene.player.targetAngle.toFixed(2)),
    };
  });
  await page.mouse.up();

  await page.waitForTimeout(2600);
  let upgrade = { reached: false };
  if ((await page.locator(".ui-card").count()) > 0) {
    await page.screenshot({ path: `qa-smoke-${viewport.name}-upgrade.png`, fullPage: false });
    await page.waitForTimeout(800);
    await page.locator(".ui-card").first().tap();
    await page.waitForTimeout(700);
    upgrade = await page.evaluate(() => {
      const scene = window.__SERPENT_LIFE__.scene.keys.SerpentLifeScene;
      return { reached: true, modeAfterPick: scene.mode, skills: scene.run.skills, hasMusic: !!scene.musicNodes };
    });
  }

  await page.evaluate(() => window.__SERPENT_LIFE__.scene.keys.SerpentLifeScene.endRun("swarmed"));
  await page.waitForTimeout(400);
  const endingOverflow = await page.evaluate(visibleUiOverflowScript);
  await page.locator("[data-action='retry']").tap();
  await page.waitForTimeout(600);
  const retry = await page.evaluate(() => {
    const scene = window.__SERPENT_LIFE__.scene.keys.SerpentLifeScene;
    const cam = scene.cameras.main;
    return {
      mode: scene.mode,
      playerVisible: scene.player.x > cam.scrollX && scene.player.x < cam.scrollX + innerWidth && scene.player.y > cam.scrollY && scene.player.y < cam.scrollY + innerHeight,
      hp: scene.run.coreHp,
      segments: scene.run.segments,
    };
  });
  const overflow = await page.evaluate(visibleUiOverflowScript);
  await page.close();

  return {
    viewport,
    logs: logs.filter((line) => !line.includes("GPU stall due to ReadPixels")),
    first,
    skillVisuals,
    joystick,
    upgrade,
    endingOverflow: endingOverflow.length,
    overflow: overflow.length,
    retry,
  };
}

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of viewports) results.push(await runViewport(browser, viewport));
} finally {
  await browser.close();
}

const failures = [];
for (const result of results) {
  if (result.logs.length) failures.push(`${result.viewport.name}: console errors`);
  if (result.first.mode !== "playing") failures.push(`${result.viewport.name}: first screen not playing`);
  if (result.first.visibleEnemies < 1) failures.push(`${result.viewport.name}: no visible early enemy`);
  if (!result.first.textures.every(([, ok]) => ok)) failures.push(`${result.viewport.name}: missing generated texture`);
  if (!String(result.first.firstEnemyTexture).endsWith("-v5")) failures.push(`${result.viewport.name}: first enemy is not V5 art`);
  if (!result.first.textureSourceSizes.every(([key, w, h]) => key === "arena-v5" ? w >= 2048 && h >= 2048 : w >= 512 && h >= 512)) {
    failures.push(`${result.viewport.name}: V5 source texture is not high resolution`);
  }
  result.first.canvas.highDprBackingStore =
    result.first.canvas.width >= result.first.canvas.cssWidth * 2 &&
    result.first.canvas.height >= result.first.canvas.cssHeight * 2;
  if (result.skillVisuals.skillLayerChildren < 5) failures.push(`${result.viewport.name}: skill visuals did not render`);
  if (!result.joystick.pointerState || !result.joystick.joyBase) failures.push(`${result.viewport.name}: joystick did not activate`);
  if (!result.upgrade.reached || result.upgrade.modeAfterPick !== "playing") failures.push(`${result.viewport.name}: upgrade flow did not return to playing`);
  if (result.endingOverflow || result.overflow) failures.push(`${result.viewport.name}: UI overflow`);
  if (!result.retry.playerVisible) failures.push(`${result.viewport.name}: retry camera lost player`);
}

console.log(JSON.stringify({ target, results, failures }, null, 2));
if (failures.length) process.exit(1);
