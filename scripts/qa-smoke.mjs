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
      visibleEnemies: (() => {
        const view = cam.worldView;
        return scene.enemies.filter((e) => e.x > view.x && e.x < view.right && e.y > view.y && e.y < view.bottom).length;
      })(),
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
        "fire-circle-v8",
        "vfx-frost-field-v5",
        "vfx-shield-star-v5",
        "vfx-lightning-core-v5",
        "lightning-bolt-v8",
        "arena-v9",
        "snake-head-v9",
        "snake-body-v9",
        "snake-memory-v9",
        "snake-tail-v9",
        "enemy-drifter-v9",
        "enemy-hunter-v9",
        "enemy-bloomer-v9",
        "enemy-sentinel-v9",
        "boss-warden-v9",
        "boss-crimson-v9",
        "boss-archivist-v9",
        "pickup-memory-v9",
        "pickup-skill-v9",
        "enemy-drifter-v5",
        "enemy-hunter-v5",
        "enemy-bloomer-v5",
        "boss-core-v5",
      ].map((key) => [key, scene.textures.exists(key)]),
      textureSourceSizes: [
        "arena-v5",
        "snake-head-v5",
        "vfx-fire-ring-v5",
        "fire-circle-v8",
        "arena-v9",
        "snake-head-v9",
        "boss-archivist-v9",
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

  const gameplayProbe = await page.evaluate(() => {
    const scene = window.__SERPENT_LIFE__.scene.keys.SerpentLifeScene;
    const audioBefore = {
      hasCtx: !!scene.audioCtx,
      state: scene.audioCtx?.state ?? null,
      hasMusic: !!scene.musicNodes,
      layer: scene.musicDebug?.layer ?? null,
      hasAssetBgm: !!scene.audioAssets?.bgm,
      bgmSrc: scene.audioAssets?.bgm?.src ?? null,
      bgmVolume: scene.audioAssets?.bgm?.volume ?? 0,
    };

    scene.run.nextEventMs = 0;
    scene.updateWaveEvent(1);
    const eventStarted = !!scene.run.currentEvent;

    scene.run.segments = Math.max(10, scene.run.segments);
    scene.run.bodyCracks = 0;
    scene.run.bodyHitCooldownMs = 0;
    const bodyPoint = scene.getSegmentPoint(4);
    const beforeSegments = scene.run.segments;
    scene.handleBodyContact(0, { index: 4, point: bodyPoint });
    const bodyRisk = {
      cracks: scene.run.bodyCracks,
      segmentsBefore: beforeSegments,
      segmentsAfter: scene.run.segments,
    };

    const choiceTypes = new Set();
    for (let i = 0; i < 24; i += 1) {
      scene.createUpgradeChoices("growth").forEach((choice) => choiceTypes.add(choice.type));
    }
    scene.run.segments = 8;
    scene.updateGrowthStage(scene.player);
    const growthProbe = {
      stageAfterEight: scene.run.growthStage,
      choiceTypes: [...choiceTypes],
      overloadTypes: scene.createUpgradeChoices("overload").map((choice) => choice.type),
    };
    scene.mode = "playing";
    scene.showDom("playing");

    scene.run.skills.fire = 3;
    scene.run.nextFireMs = 0;
    const fxBefore = scene.fxLayer?.length ?? 0;
    scene.updateFire(1000);
    const fireProbe = {
      fxBefore,
      fxAfter: scene.fxLayer?.length ?? 0,
    };

    const originalRandom = Math.random;
    Math.random = () => 0.1;
    scene.run.timeMs = 20000;
    scene.run.nextSurpriseMs = 0;
    scene.run.greedPressure = 9;
    scene.run.memoryOverflow = 3;
    const surprisesBefore = scene.run.recentSurprises.length;
    scene.updateRunSurprises(1);
    Math.random = originalRandom;
    const surpriseProbe = {
      before: surprisesBefore,
      after: scene.run.recentSurprises.length,
      nextMs: scene.run.nextSurpriseMs,
    };

    scene.spawnBoss();
    const firstBossId = scene.boss?.id;
    const bossHp0 = scene.boss.hp;
    const weak = scene.bossWeakpoints.find((wp) => wp.active && !wp.broken) ?? scene.bossWeakpoints.find((wp) => !wp.broken);
    scene.damageBoss(12, 0x9af7ff, weak.x, weak.y, "shot");
    scene.updateHud();
    const bossProbe = {
      shieldAfterWeakHit: scene.boss?.shield ?? 0,
      hpAfterWeakHit: scene.boss?.hp ?? 0,
      weakpoints: scene.bossWeakpoints.length,
      weakHitDamaged: (scene.boss?.hp ?? 0) < bossHp0,
      hudVisible: !scene.dom.bossBar.classList.contains("ui-hidden"),
      hudWidth: scene.dom.bossHp.style.width,
      worldBarExists: !!scene.boss?.hpBar,
    };

    scene.boss.hp = 1;
    scene.damageBoss(999, 0x9af7ff, scene.boss.x, scene.boss.y, "shot");
    const afterFirstBoss = {
      mode: scene.mode,
      cleared: [...scene.run.clearedBosses],
      boss: !!scene.boss,
      nextBoss: scene.nextBossSpec()?.id ?? null,
    };

    scene.triggerEliteEvent();
    const eliteProbe = {
      currentElite: scene.run.currentElite?.id ?? null,
      eliteEnemies: scene.enemies.filter((e) => e.elite).length,
    };

    scene.run.clearedBosses = ["memory_warden", "crimson_molt"];
    const finalSpec = scene.nextBossSpec();
    scene.spawnBoss(finalSpec);
    scene.boss.hp = 1;
    scene.boss.shield = 0;
    scene.damageBoss(999, 0xffd166, scene.boss.x, scene.boss.y, "shot");
    const finalBossProbe = {
      mode: scene.mode,
      bossDefeated: scene.run.bossDefeated,
      cleared: [...scene.run.clearedBosses],
    };

    scene.endRun("swarmed");
    scene.startRun();
    return {
      audioBefore,
      eventStarted,
      bodyRisk,
      growthProbe,
      fireProbe,
      surpriseProbe,
      bossProbe,
      firstBossId,
      afterFirstBoss,
      eliteProbe,
      finalBossProbe,
      retryClean: {
        boss: !!scene.boss,
        projectiles: scene.projectiles.length,
        shots: scene.shots.length,
        frostFields: scene.frostFields.length,
        bodyCracks: scene.run.bodyCracks,
        currentEvent: scene.run.currentEvent,
        currentElite: scene.run.currentElite,
        clearedBosses: scene.run.clearedBosses.length,
        bossWeakpoints: scene.bossWeakpoints.length,
        hasMusic: !!scene.musicNodes,
      },
    };
  });

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
    if ((await page.evaluate(() => window.__SERPENT_LIFE__.scene.keys.SerpentLifeScene.mode)) === "upgrade" && (await page.locator(".ui-card").count()) > 0) {
      await page.waitForTimeout(800);
      await page.locator(".ui-card").first().tap();
      await page.waitForTimeout(500);
    }
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
      playerVisible: (() => {
        const view = cam.worldView;
        return scene.player.x > view.x && scene.player.x < view.right && scene.player.y > view.y && scene.player.y < view.bottom;
      })(),
      hp: scene.run.coreHp,
      segments: scene.run.segments,
    };
  });
  const overflow = await page.evaluate(visibleUiOverflowScript);
  await page.close();

  return {
    viewport,
    logs: logs.filter((line) => !line.includes("GPU stall due to ReadPixels") && !line.includes("bgm-empty-city.ogg net::ERR_ABORTED")),
    first,
    skillVisuals,
    gameplayProbe,
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
  if (!String(result.first.firstEnemyTexture).endsWith("-v9")) failures.push(`${result.viewport.name}: first enemy is not V9 art`);
  if (!result.first.textureSourceSizes.every(([key, w, h]) => key === "arena-v5" || key === "arena-v9" ? w >= 2048 && h >= 2048 : key === "fire-circle-v8" ? w >= 3200 && h >= 3200 : w >= 512 && h >= 512)) {
    failures.push(`${result.viewport.name}: source texture is not high resolution`);
  }
  result.first.canvas.highDprBackingStore =
    result.first.canvas.width >= result.first.canvas.cssWidth * 2 &&
    result.first.canvas.height >= result.first.canvas.cssHeight * 2;
  if (!result.first.canvas.highDprBackingStore) failures.push(`${result.viewport.name}: canvas is not rendered at high DPR`);
  if (result.skillVisuals.skillLayerChildren < 5) failures.push(`${result.viewport.name}: skill visuals did not render`);
  if (!result.gameplayProbe.audioBefore.hasCtx || !result.gameplayProbe.audioBefore.hasMusic || !result.gameplayProbe.audioBefore.hasAssetBgm) failures.push(`${result.viewport.name}: asset audio/BGM did not start`);
  if (!String(result.gameplayProbe.audioBefore.bgmSrc).includes("bgm-fast-fight.ogg") || result.gameplayProbe.audioBefore.bgmVolume < 0.3) failures.push(`${result.viewport.name}: V8 battle BGM is missing or too quiet`);
  if (!result.gameplayProbe.eventStarted) failures.push(`${result.viewport.name}: wave event did not start`);
  if (result.gameplayProbe.bodyRisk.cracks < 1) failures.push(`${result.viewport.name}: body risk did not add cracks`);
  if (result.gameplayProbe.growthProbe.stageAfterEight !== "ring") failures.push(`${result.viewport.name}: growth stage did not advance`);
  if (!result.gameplayProbe.growthProbe.choiceTypes.some((type) => type !== "skill")) failures.push(`${result.viewport.name}: roguelike choices did not include relic/surprise`);
  if (!result.gameplayProbe.growthProbe.overloadTypes.includes("overload")) failures.push(`${result.viewport.name}: overload choice missing`);
  if (result.gameplayProbe.fireProbe.fxAfter <= result.gameplayProbe.fireProbe.fxBefore) failures.push(`${result.viewport.name}: fire ring effect did not spawn`);
  if (result.gameplayProbe.surpriseProbe.after <= result.gameplayProbe.surpriseProbe.before) failures.push(`${result.viewport.name}: director surprise did not trigger`);
  if (result.gameplayProbe.bossProbe.shieldAfterWeakHit >= 3 || !result.gameplayProbe.bossProbe.weakHitDamaged) failures.push(`${result.viewport.name}: boss weakpoint did not register`);
  if (!result.gameplayProbe.bossProbe.hudVisible || !result.gameplayProbe.bossProbe.worldBarExists) failures.push(`${result.viewport.name}: boss HP bar missing`);
  if (!result.gameplayProbe.firstBossId || result.gameplayProbe.afterFirstBoss.mode !== "playing" || result.gameplayProbe.afterFirstBoss.cleared.length < 1 || !result.gameplayProbe.afterFirstBoss.nextBoss) failures.push(`${result.viewport.name}: first boss did not advance chapter flow`);
  if (!result.gameplayProbe.eliteProbe.currentElite || result.gameplayProbe.eliteProbe.eliteEnemies < 1) failures.push(`${result.viewport.name}: elite event did not spawn elites`);
  if (result.gameplayProbe.finalBossProbe.mode !== "gameover" || !result.gameplayProbe.finalBossProbe.bossDefeated || result.gameplayProbe.finalBossProbe.cleared.length < 2) failures.push(`${result.viewport.name}: final boss did not end run`);
  if (result.gameplayProbe.retryClean.boss || result.gameplayProbe.retryClean.projectiles || result.gameplayProbe.retryClean.shots || result.gameplayProbe.retryClean.frostFields || result.gameplayProbe.retryClean.bodyCracks || result.gameplayProbe.retryClean.currentEvent || result.gameplayProbe.retryClean.currentElite || result.gameplayProbe.retryClean.clearedBosses || result.gameplayProbe.retryClean.bossWeakpoints) {
    failures.push(`${result.viewport.name}: retry retained gameplay state`);
  }
  if (!result.gameplayProbe.retryClean.hasMusic) failures.push(`${result.viewport.name}: music did not restart after retry`);
  if (!result.joystick.pointerState || !result.joystick.joyBase) failures.push(`${result.viewport.name}: joystick did not activate`);
  if (!result.upgrade.reached || result.upgrade.modeAfterPick !== "playing") failures.push(`${result.viewport.name}: upgrade flow did not return to playing`);
  if (result.endingOverflow || result.overflow) failures.push(`${result.viewport.name}: UI overflow`);
  if (!result.retry.playerVisible) failures.push(`${result.viewport.name}: retry camera lost player`);
}

console.log(JSON.stringify({ target, results, failures }, null, 2));
if (failures.length) process.exit(1);
