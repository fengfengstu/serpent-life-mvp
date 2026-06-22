import Phaser from "phaser";
import { BOSS_STAGES, CHAPTERS, COLORS, ELITE_EVENTS, ENEMY_KINDS, GAME_CONFIG, GROWTH_STAGES, LIFE_TEMPLATES, MEMORY_LINES, RELIC_POOL, SKILLS, SURPRISE_EVENTS } from "./config.js";
import { V13_BALANCE, V13_LEVELS, v13GrowthCost, v13LevelById, v13SkillCost, v13SkillXpCost } from "./v13-balance.js";

const W = 390;
const H = 844;
const TWO_PI = Math.PI * 2;
const IS_IOS =
  /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const LOW_POWER_RENDER = IS_IOS || ((navigator.hardwareConcurrency ?? 8) <= 4);
const RENDER_RESOLUTION = LOW_POWER_RENDER ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2);
const TEXT_RESOLUTION = Math.min(window.devicePixelRatio || 1, 3);
const SNAKE_RENDER_INTERVAL_MS = LOW_POWER_RENDER ? 16 : 34;
const SKILL_AURA_INTERVAL_MS = LOW_POWER_RENDER ? 80 : 50;
const HUD_RENDER_INTERVAL_MS = LOW_POWER_RENDER ? 120 : 80;
const UI_FONT = "Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif";

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function angleLerp(a, b, t) {
  let delta = ((b - a + Math.PI) % TWO_PI) - Math.PI;
  if (delta < -Math.PI) delta += TWO_PI;
  return a + delta * t;
}

function distance(a, b) {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function randomNear(point, minRadius, maxRadius) {
  const angle = Math.random() * TWO_PI;
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  return {
    x: point.x + Math.cos(angle) * radius,
    y: point.y + Math.sin(angle) * radius,
  };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class SerpentLifeScene extends Phaser.Scene {
  constructor() {
    super("SerpentLifeScene");
    this.mode = "boot";
  }

  preload() {
    this.load.setPath("assets/free");
    this.load.image("snake-glow", "snake-glow.png");
    this.load.image("energy-bloom", "energy-bloom.png");
    this.load.image("spark", "spark.png");
    this.load.setPath("assets/generated/sprite-forge/processed/impact");
    for (let i = 1; i <= 4; i += 1) this.load.image(`impact-${i}`, `impact-${i}.png`);
    this.load.setPath("assets/generated/v5-hd/processed/skills");
    this.load.image("vfx-fire-ring-v5", "vfx-fire-ring-v5.png");
    this.load.setPath("assets/generated/v11/serpent");
    this.load.image("snake-head-v11", "serpent-head.png");
    this.load.image("snake-body-v11", "serpent-body.png");
    this.load.image("snake-memory-v11", "memory.png");
    this.load.image("snake-tail-v11", "serpent-tail.png");
    this.load.setPath("assets/generated/v11/map");
    this.load.image("arena-v11-tutorial", "map-tutorial-blue.png");
    this.load.image("arena-v11-ch1", "map-chapter1-pale.png");
    this.load.image("arena-v11-ch2", "map-chapter2-ember.png");
    this.load.image("arena-v11-ch3", "map-chapter3-violet.png");
    this.load.setPath("assets/generated/v11/enemies");
    this.load.image("enemy-drifter-v11", "bone-shard-skitterer.png");
    this.load.image("enemy-hunter-v11", "winged-lance-bat.png");
    this.load.image("enemy-bloomer-v11", "floating-bishop-mage.png");
    this.load.image("enemy-sentinel-v11", "tower-shield-brute.png");
    this.load.image("boss-elite-v11", "elite-cathedral-serpent.png");
    this.load.setPath("assets/generated/v11/pickups");
    this.load.image("pickup-memory-small-v11", "amber-soul-chip.png");
    this.load.image("pickup-memory-medium-v11", "golden-rune-crystal.png");
    this.load.image("pickup-skill-v11", "blessed-memory-gem.png");
    this.load.setPath("assets/generated/v11/skills/icons");
    SKILLS.forEach((skill) => this.load.image(`skill-icon-${skill.id}-v11`, skill.iconFile ?? `${skill.id}.png`));
    this.load.setPath("assets/generated/v10/vfx/mouth-flame");
    for (let i = 1; i <= 4; i += 1) this.load.image(`v10-flame-tongue-${i}`, `flame_tongue_${String(i).padStart(2, "0")}.png`);
    for (let i = 1; i <= 3; i += 1) this.load.image(`v10-flame-impact-${i}`, `impact_burst_${String(i).padStart(2, "0")}.png`);
    this.load.setPath("assets/generated/v10/vfx/frost-trail");
    for (let i = 1; i <= 4; i += 1) this.load.image(`v10-frost-trail-${i}`, `frost_trail_${String(i).padStart(2, "0")}.png`);
    for (let i = 1; i <= 3; i += 1) this.load.image(`v10-frost-hit-${i}`, `frost_hit_${String(i).padStart(2, "0")}.png`);
    this.load.setPath("assets/generated/v10/vfx/chain-lightning");
    for (let i = 1; i <= 4; i += 1) this.load.image(`v10-chain-arc-${i}`, `chain_arc_${String(i).padStart(2, "0")}.png`);
    for (let i = 1; i <= 3; i += 1) this.load.image(`v10-chain-hit-${i}`, `chain_hit_${String(i).padStart(2, "0")}.png`);
    this.load.setPath("assets/generated/v10/vfx/guardian-orbit");
    for (let i = 1; i <= 2; i += 1) {
      this.load.image(`v10-guardian-shield-${i}`, `shield_${String(i).padStart(2, "0")}.png`);
      this.load.image(`v10-guardian-impact-${i}`, `impact_${String(i).padStart(2, "0")}.png`);
    }
    this.load.setPath("assets/generated/v10/vfx/fang-projectile");
    for (let i = 1; i <= 2; i += 1) {
      this.load.image(`v10-fang-${i}`, `fang_${String(i).padStart(2, "0")}.png`);
      this.load.image(`v10-fang-trail-${i}`, `trail_${String(i).padStart(2, "0")}.png`);
      this.load.image(`v10-fang-impact-${i}`, `impact_${String(i).padStart(2, "0")}.png`);
    }
    this.load.setPath("assets/generated/v10/vfx/memory-magnet");
    for (let i = 1; i <= 2; i += 1) {
      this.load.image(`v10-magnet-crystal-${i}`, `crystal_${String(i).padStart(2, "0")}.png`);
      this.load.image(`v10-magnet-trail-${i}`, `beadtrail_${String(i).padStart(2, "0")}.png`);
      this.load.image(`v10-magnet-burst-${i}`, `burst_${String(i).padStart(2, "0")}.png`);
    }
    this.load.setPath("assets/generated/v10/vfx/serpent-speed");
    for (let i = 1; i <= 2; i += 1) {
      this.load.image(`v10-speed-streak-${i}`, `streak_${String(i).padStart(2, "0")}.png`);
      this.load.image(`v10-speed-curve-${i}`, `curve_${String(i).padStart(2, "0")}.png`);
    }
    this.load.setPath("assets/generated/v10/vfx/piercing-spear");
    for (let i = 1; i <= 2; i += 1) {
      this.load.image(`v10-spear-${i}`, `spear_${String(i).padStart(2, "0")}.png`);
      this.load.image(`v10-spear-charge-${i}`, `charge_${String(i).padStart(2, "0")}.png`);
      this.load.image(`v10-spear-impact-${i}`, `impact_${String(i).padStart(2, "0")}.png`);
    }
  }

  create() {
    this.installSharpText();
    this.makeTextures();
    this.makeAnimations();
    this.input.addPointer(2);

    this.worldLayer = this.add.container(0, 0);
    this.fxLayer = this.add.container(0, 0);
    this.snakeLayer = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0).setScrollFactor(0).setDepth(70);

    this.cameras.main.setBackgroundColor(COLORS.ink);
    this.applyRenderScale();
    window.addEventListener("resize", () => this.resizeToWindow(), { passive: true });
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);

    this.buildDomUi();
    this.buildMenu();
    this.layout();
  }

  installSharpText() {
    const addText = this.add.text.bind(this.add);
    this.add.text = (...args) => {
      const obj = addText(...args);
      obj.setResolution(TEXT_RESOLUTION);
      if (!obj.style.fontFamily || obj.style.fontFamily === "Courier") obj.setFontFamily(UI_FONT);
      return obj;
    };
  }

  makeTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.clear();
    g.fillStyle(0x0b1419, 1);
    g.fillRect(0, 0, 768, 768);
    for (let y = 0; y < 768; y += 64) {
      for (let x = 0; x < 768; x += 64) {
        const alpha = ((x + y) / 64) % 2 === 0 ? 0.16 : 0.08;
        g.fillStyle(0x1b2c2e, alpha);
        g.fillRect(x + 1, y + 1, 62, 62);
      }
    }
    g.lineStyle(1, 0x31494a, 0.18);
    for (let i = 0; i <= 768; i += 64) {
      g.lineBetween(i, 0, i, 768);
      g.lineBetween(0, i, 768, i);
    }
    g.generateTexture("arena-bg", 768, 768);

    g.clear();
    g.fillStyle(COLORS.reward, 1);
    g.fillCircle(32, 32, 16);
    g.lineStyle(3, COLORS.dangerCore, 0.92);
    g.strokeCircle(32, 32, 19);
    g.lineStyle(2, COLORS.jade, 0.38);
    g.strokeCircle(32, 32, 24);
    g.generateTexture("food", 64, 64);

    g.clear();
    g.fillStyle(COLORS.reward, 1);
    g.fillCircle(32, 32, 18);
    g.lineStyle(4, COLORS.white, 0.8);
    g.strokeCircle(32, 32, 22);
    g.generateTexture("skill-pickup", 64, 64);

    g.clear();
    g.fillStyle(0x220a18, 1);
    g.fillTriangle(32, 3, 60, 34, 32, 61);
    g.fillTriangle(32, 3, 4, 34, 32, 61);
    g.lineStyle(5, COLORS.rose, 0.95);
    g.strokeTriangle(32, 3, 60, 34, 32, 61);
    g.strokeTriangle(32, 3, 4, 34, 32, 61);
    g.fillStyle(COLORS.white, 0.78);
    g.fillCircle(32, 30, 5);
    g.generateTexture("enemy-drifter", 64, 64);

    g.clear();
    g.fillStyle(0x1c102e, 1);
    g.fillTriangle(32, 0, 62, 24, 49, 61);
    g.fillTriangle(32, 0, 2, 24, 15, 61);
    g.fillStyle(0x522a78, 1);
    g.fillCircle(32, 33, 18);
    g.lineStyle(4, COLORS.violet, 0.98);
    g.strokeTriangle(32, 0, 62, 24, 49, 61);
    g.strokeTriangle(32, 0, 2, 24, 15, 61);
    g.fillStyle(COLORS.frost, 0.85);
    g.fillCircle(32, 28, 5);
    g.generateTexture("enemy-hunter", 64, 64);

    g.clear();
    g.fillStyle(0x28111f, 1);
    g.fillCircle(32, 32, 25);
    g.fillStyle(0x6b2457, 1);
    g.fillCircle(25, 25, 10);
    g.fillCircle(42, 35, 12);
    g.lineStyle(5, COLORS.red, 0.9);
    g.strokeCircle(32, 32, 25);
    g.fillStyle(COLORS.rose, 0.95);
    g.fillCircle(32, 31, 6);
    g.generateTexture("enemy-bloomer", 64, 64);

    g.clear();
    g.fillStyle(0x331932, 1);
    g.fillCircle(64, 64, 54);
    g.lineStyle(8, COLORS.rose, 0.9);
    g.strokeCircle(64, 64, 48);
    g.lineStyle(4, COLORS.gold, 0.75);
    g.strokeCircle(64, 64, 24);
    g.generateTexture("boss", 128, 128);

    g.clear();
    g.fillStyle(COLORS.playerShot, 0.32);
    g.fillTriangle(16, 0, 30, 16, 16, 32);
    g.fillTriangle(16, 0, 2, 16, 16, 32);
    g.fillStyle(COLORS.white, 1);
    g.fillTriangle(16, 5, 25, 16, 16, 27);
    g.fillTriangle(16, 5, 7, 16, 16, 27);
    g.lineStyle(2, COLORS.cyan, 0.9);
    g.strokeTriangle(16, 1, 30, 16, 16, 31);
    g.strokeTriangle(16, 1, 2, 16, 16, 31);
    g.generateTexture("player-projectile", 32, 32);

    g.clear();
    g.fillStyle(COLORS.enemyShot, 0.92);
    g.fillCircle(16, 16, 10);
    g.fillStyle(COLORS.dangerCore, 1);
    g.fillCircle(16, 16, 5);
    g.lineStyle(3, COLORS.red, 0.95);
    g.strokeCircle(16, 16, 13);
    g.generateTexture("enemy-projectile", 32, 32);

    g.destroy();
  }

  makeAnimations() {
    this.anims.create({
      key: "impact-fx",
      frames: [1, 2, 3, 4].map((i) => ({ key: `impact-${i}` })),
      frameRate: 18,
      repeat: 0,
      hideOnComplete: true,
    });
  }

  buildDomUi() {
    this.dom = { root: document.getElementById("ui-root") };
    if (!this.dom.root) return;
    this.dom.root.innerHTML = `
      <section data-screen="menu" class="ui-menu">
        <div class="ui-hero-art" aria-hidden="true"></div>
        <div class="ui-panel ui-menu-panel">
          <p class="ui-kicker">5.5 GDD MVP</p>
          <h1 class="ui-title">此生为蛇</h1>
          <p class="ui-subtitle">身体就是生命、资源和武器。吞噬记忆增长，拾取技能珠后决定是否消耗身体净化技能。</p>
          <button class="ui-button" data-action="start">第一关：灰林边境</button>
          <button class="ui-button ghost" data-action="start-tutorial">教学关</button>
          <div class="ui-level-row">
            <button class="ui-button ghost" data-action="start-level2">第二关</button>
            <button class="ui-button ghost" data-action="start-level3">第三关</button>
          </div>
        </div>
      </section>
      <section data-screen="hud" class="ui-hud ui-hidden">
        <div class="ui-hud-main">
          <div data-bind="chapter" class="ui-chapter">一章：孵梦回廊</div>
          <div data-bind="hearts" class="ui-hearts">命脉 3/3</div>
          <div data-bind="meta" class="ui-meta">身体 3 · 0s</div>
        </div>
        <div data-bind="skills" class="ui-skills"></div>
        <div class="ui-progress"><span data-bind="progress"></span></div>
        <div data-bind="boss-bar" class="ui-boss-bar ui-hidden">
          <strong data-bind="boss-label">终点 Boss</strong>
          <span><i data-bind="boss-hp"></i></span>
        </div>
        <button data-action="pause" class="ui-icon-button" aria-label="暂停">Ⅱ</button>
      </section>
      <section data-screen="upgrade" class="ui-upgrade ui-hidden">
        <div class="ui-upgrade-title">选择一次突变</div>
        <div data-bind="upgrade-cards" class="ui-card-grid"></div>
      </section>
      <section data-screen="pause" class="ui-pause ui-hidden">
        <div class="ui-panel">
          <h2 class="ui-title small">暂停</h2>
          <button class="ui-button" data-action="resume">继续</button>
          <button class="ui-button ghost" data-action="quit">返回主菜单</button>
        </div>
      </section>
      <section data-screen="gameover" class="ui-gameover ui-hidden">
        <div class="ui-panel ui-ending-panel">
          <p data-bind="ending-kicker" class="ui-kicker">蛇生结算</p>
          <h2 data-bind="ending-title" class="ui-title small">走马灯</h2>
          <div data-bind="memory-list" class="ui-memory-list"></div>
          <p data-bind="life-text" class="ui-life-text"></p>
          <p data-bind="final" class="ui-final"></p>
          <button class="ui-button" data-action="retry">再来一局</button>
          <button class="ui-button ghost" data-action="menu">返回</button>
        </div>
      </section>
    `;
    this.dom.screens = [...this.dom.root.querySelectorAll("[data-screen]")];
    this.dom.hearts = this.dom.root.querySelector("[data-bind='hearts']");
    this.dom.chapter = this.dom.root.querySelector("[data-bind='chapter']");
    this.dom.meta = this.dom.root.querySelector("[data-bind='meta']");
    this.dom.skills = this.dom.root.querySelector("[data-bind='skills']");
    this.dom.progress = this.dom.root.querySelector("[data-bind='progress']");
    this.dom.bossBar = this.dom.root.querySelector("[data-bind='boss-bar']");
    this.dom.bossLabel = this.dom.root.querySelector("[data-bind='boss-label']");
    this.dom.bossHp = this.dom.root.querySelector("[data-bind='boss-hp']");
    this.dom.cards = this.dom.root.querySelector("[data-bind='upgrade-cards']");
    this.dom.memoryList = this.dom.root.querySelector("[data-bind='memory-list']");
    this.dom.lifeText = this.dom.root.querySelector("[data-bind='life-text']");
    this.dom.final = this.dom.root.querySelector("[data-bind='final']");
    this.dom.endingKicker = this.dom.root.querySelector("[data-bind='ending-kicker']");
    this.dom.endingTitle = this.dom.root.querySelector("[data-bind='ending-title']");

    this.bindDomAction("start", () => this.startRun("level1"));
    this.bindDomAction("start-tutorial", () => this.startRun("tutorial"));
    this.bindDomAction("start-level2", () => this.startRun("level2"));
    this.bindDomAction("start-level3", () => this.startRun("level3"));
    this.bindDomAction("retry", () => this.startRun(this.run?.levelId ?? "level1"));
    this.bindDomAction("menu", () => this.buildMenu());
    this.bindDomAction("pause", () => this.pauseRun());
    this.bindDomAction("resume", () => this.resumeRun());
    this.bindDomAction("quit", () => this.buildMenu());
  }

  bindDomAction(action, cb) {
    this.dom.root.querySelectorAll(`[data-action='${action}']`).forEach((node) => {
      node.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        this.unlockAudio();
        cb();
      });
    });
  }

  showDom(screen) {
    if (!this.dom?.root) return;
    this.dom.screens.forEach((node) => {
      const active = node.dataset.screen === screen || (screen === "playing" && node.dataset.screen === "hud");
      node.classList.toggle("ui-hidden", !active);
    });
  }

  buildMenu() {
    this.mode = "menu";
    this.stopCombatMusic();
    this.clearGameObjects();
    this.showDom("menu");

    const { width, height } = this.viewSize();
    const bg = this.add.image(width / 2, height / 2, this.textureOr("arena-v11-ch1", "arena-bg")).setScrollFactor(0);
    bg.setDisplaySize(width, height).setAlpha(0.92);
    const shade = this.add.rectangle(width / 2, height / 2, width, height, COLORS.ink, 0.22).setScrollFactor(0);
    const halo = this.add.image(width / 2, height * 0.23, "snake-glow").setTint(COLORS.acid).setDisplaySize(260, 180).setAlpha(0.28).setScrollFactor(0);
    halo.setBlendMode(Phaser.BlendModes.ADD);
    const head = this.add.image(width / 2, height * 0.23, this.textureOr("snake-head-v11", "snake-glow")).setDisplaySize(124, 124).setScrollFactor(0);
    head.setRotation(-0.12);
    const body = [];
    for (let i = 1; i <= 8; i += 1) {
      const node = this.add.image(width / 2 - i * 23, height * 0.23 + Math.sin(i * 0.75) * 18, i === 8 ? this.textureOr("snake-tail-v11", "snake-body-v11") : this.textureOr("snake-body-v11", "snake-glow"));
      node.setDisplaySize(58 - i * 1.4, 58 - i * 1.4).setScrollFactor(0).setRotation(0.18 + i * 0.18);
      body.push(node);
    }
    this.tweens.add({ targets: [halo, head, ...body], y: "-=8", duration: 1300, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.uiLayer.add([bg, shade, halo, head, ...body]);
  }

  viewSize() {
    return { width: this.scale.width, height: this.scale.height };
  }

  displayScale() {
    const canvas = this.game?.canvas;
    if (!canvas?.clientWidth || !canvas?.clientHeight) return RENDER_RESOLUTION;
    return Math.max(1, canvas.width / canvas.clientWidth);
  }

  pointerPos(pointer) {
    const event = pointer.event;
    const rect = this.game?.canvas?.getBoundingClientRect();
    const touch = event?.changedTouches?.[0] ?? event?.touches?.[0] ?? event;
    if (touch && rect?.width && rect?.height && Number.isFinite(touch.clientX) && Number.isFinite(touch.clientY)) {
      const view = this.viewSize();
      return {
        id: pointer.id,
        x: ((touch.clientX - rect.left) / rect.width) * view.width,
        y: ((touch.clientY - rect.top) / rect.height) * view.height,
      };
    }
    const scale = this.displayScale();
    return { id: pointer.id, x: pointer.x, y: pointer.y };
  }

  screenPointFromGame(x, y) {
    const scale = this.displayScale();
    return { x: x / scale, y: y / scale };
  }

  gamePointFromScreen(x, y) {
    const scale = this.displayScale();
    return { x: x * scale, y: y * scale };
  }

  cameraViewSize() {
    const cam = this.cameras.main;
    const zoom = cam.zoom || 1;
    return { width: cam.width / zoom, height: cam.height / zoom };
  }

  applyRenderScale() {
    const scale = this.displayScale();
    const cam = this.cameras.main;
    cam.setViewport(0, 0, this.scale.width, this.scale.height);
    cam.setZoom(scale);
  }

  resizeToWindow() {
    const width = Math.max(320, Math.round(window.innerWidth * RENDER_RESOLUTION));
    const height = Math.max(568, Math.round(window.innerHeight * RENDER_RESOLUTION));
    this.scale.resize(width, height);
    this.applyRenderScale();
    this.layout();
    if (this.player) this.forceCameraToPlayer();
  }

  textureOr(key, fallback) {
    return this.textures.exists(key) ? key : fallback;
  }

  skillIconAssetPath(skill) {
    return `assets/generated/v11/skills/icons/${skill.iconFile ?? `${skill.id}.png`}`;
  }

  skillRarityForLevel(level = 1) {
    if (level >= 5) return "legendary";
    if (level >= 4) return "epic";
    if (level >= 2) return "rare";
    return "uncommon";
  }

  rarityLabel(rarity = "uncommon") {
    return {
      common: "普通",
      uncommon: "优秀",
      rare: "稀有",
      epic: "史诗",
      legendary: "传说",
    }[rarity] ?? "优秀";
  }

  arenaTextureForChapter(chapter = this.chapterForTime()) {
    if (chapter.id === "tutorial") return this.textureOr("arena-v11-tutorial", "arena-v11-ch1");
    if (chapter.index <= 0) return this.textureOr("arena-v11-ch1", "arena-bg");
    if (chapter.index === 1) return this.textureOr("arena-v11-ch2", "arena-v11-ch1");
    return this.textureOr("arena-v11-ch3", "arena-v11-ch1");
  }

  applyArenaTexture(chapter = this.chapterForTime()) {
    if (!this.bg) return;
    const texture = this.arenaTextureForChapter(chapter);
    if (this.bg.texture?.key !== texture) this.bg.setTexture(texture);
    this.bg.setTileScale(this.textures.exists(texture) && texture.startsWith("arena-v11") ? 0.58 : 0.26);
    this.bg.setAlpha(this.textures.exists(texture) && texture.startsWith("arena-v11") ? 0.62 : 1);
  }

  chapterForTime(timeMs = this.run?.timeMs ?? 0) {
    if (this.run?.v13) {
      const level = this.currentV13Level();
      const index = Math.max(0, (this.run.levelIndex ?? 1) - 1);
      const chapter = CHAPTERS[Math.min(index, CHAPTERS.length - 1)] ?? CHAPTERS[0];
      return { ...chapter, id: level.id, name: level.name, shortName: level.shortName, index };
    }
    let chapter = CHAPTERS[0];
    let index = 0;
    CHAPTERS.forEach((candidate, i) => {
      if (timeMs >= candidate.startMs) {
        chapter = candidate;
        index = i;
      }
    });
    return { ...chapter, index };
  }

  updateChapterState() {
    if (!this.run) return this.chapterForTime(0);
    const chapter = this.chapterForTime();
    if (chapter.index !== this.run.chapterIndex) {
      this.run.chapterIndex = chapter.index;
      this.addMemory(`进入「${chapter.name}」：${chapter.text}`, "chapter");
      this.floatText(this.player.x, this.player.y - 96, chapter.name, chapter.color);
      this.addRing(this.player.x, this.player.y, 280, chapter.color, 0.32);
      this.applyArenaTexture(chapter);
      this.screenShake = Math.max(this.screenShake, 6);
      this.playComboSound("growth");
    }
    return chapter;
  }

  nextBossSpec() {
    if (!this.run) return null;
    if (this.run.v13) {
      const level = this.currentV13Level();
      const base = BOSS_STAGES.find((spec) => spec.id === level.bossId) ?? BOSS_STAGES[0];
      if (level.id === "tutorial") {
        return {
          ...base,
          id: "tutorial_husk",
          name: "残忆蛇影",
          hp: 150,
          shield: 0,
          spawnMs: level.bossSpawnMs,
          spawnKills: 9999,
          radius: 50,
          speed: 54,
          color: COLORS.cyan,
          projectileColor: COLORS.frost,
          rewardText: "残忆蛇影散开，你已经掌握了吞噬、成长与净化。",
        };
      }
      return { ...base, spawnMs: level.bossSpawnMs, spawnKills: 9999, final: level.id === "level3" };
    }
    return BOSS_STAGES.find((spec) => !this.run.clearedBosses.includes(spec.id)) ?? null;
  }

  bossProgress(spec = this.nextBossSpec()) {
    if (!spec) return 1;
    const timePct = spec.spawnMs ? (this.run.v13 ? (this.run.levelElapsedMs ?? this.run.timeMs) : this.run.timeMs) / spec.spawnMs : 0;
    const killPct = spec.spawnKills ? this.run.kills / spec.spawnKills : 0;
    return clamp(Math.max(timePct, killPct), 0, 1);
  }

  clearGameObjects() {
    this.tweens.killAll();
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, 0);
    this.worldLayer?.removeAll(true);
    this.fxLayer?.removeAll(true);
    this.skillLayer?.removeAll(true);
    this.skillLayer?.destroy();
    this.skillLayer = null;
    this.bossRewardTimer?.remove(false);
    this.bossRewardTimer = null;
    this.snakeLayer?.removeAll(true);
    this.fastSnakeRender = null;
    this.uiLayer?.removeAll(true);
    this.cameraTarget?.destroy();
    this.cameraTarget = null;
  }

  currentV13Level() {
    return v13LevelById(this.run?.levelId ?? "level1");
  }

  v13LevelIndex(id) {
    return Math.max(0, V13_LEVELS.findIndex((level) => level.id === id));
  }

  startRun(levelId = "level1") {
    this.mode = "playing";
    this.clearGameObjects();
    this.showDom("playing");
    this.startCombatMusic();

    const level = v13LevelById(levelId);
    this.run = {
      v13: true,
      levelId: level.id,
      levelIndex: this.v13LevelIndex(level.id),
      levelElapsedMs: 0,
      timeMs: 0,
      coreHp: GAME_CONFIG.initialCoreHp,
      segments: V13_BALANCE.initialSegments,
      mxp: 0,
      sxp: 0,
      nextGrowthCost: v13GrowthCost(V13_BALANCE.initialSegments),
      firstSkillCoreGiven: false,
      heldSkillCores: 0,
      score: 0,
      kills: 0,
      wave: 1,
      chapterIndex: 0,
      clearedBosses: [],
      activeBossId: null,
      nextEliteMs: 64000,
      invulnMs: 900,
      bossSpawned: false,
      bossDefeated: false,
      nextFoodMs: 0,
      nextSkillMs: level.firstSkillCoreMs,
      lastSkillDropKills: 0,
      skillDropCount: 0,
      nextEnemyMs: 0,
      nextFireMs: 0,
      nextTurretMs: 0,
      nextSpearMs: 0,
      nextSpeedFxMs: 0,
      nextLightningMs: 0,
      nextBossShotMs: 0,
      nextEventMs: GAME_CONFIG.firstEventMs,
      nextSurpriseMs: 15000 + Math.random() * 9000,
      eventUntilMs: 0,
      bodyCracks: 0,
      bodyHitCooldownMs: 0,
      growthStage: GROWTH_STAGES[0].id,
      memoryOverflow: 0,
      greedPressure: 0,
      relics: [],
      recentSurprises: [],
      pendingRareCore: 0,
      pendingUpgrade: null,
      lastUpgradeMs: -V13_BALANCE.skill.minCardGapMs,
      upgradeCount: 0,
      comboHighlights: [],
      buildSequence: [],
      memoryTokens: [],
      currentEvent: null,
      currentElite: null,
      skills: {},
      selectedSlots: [],
      deathCause: "default",
    };
    SKILLS.forEach((skill) => {
      this.run.skills[skill.id] = 0;
    });

    this.player = {
      x: GAME_CONFIG.arena / 2,
      y: GAME_CONFIG.arena / 2,
      angle: 0,
      targetAngle: 0,
      trail: [],
      hurtMs: 0,
    };

    this.pickups = [];
    this.enemies = [];
    this.projectiles = [];
    this.shots = [];
    this.frostFields = [];
    this.floaters = [];
    this.bossWeakpoints = [];
    this.sfxCooldowns = new Map();
    this.boss = null;
    this.nextFrostFieldMs = 0;
    this.pointerState = null;
    this.screenShake = 0;
    this.snakeRenderMs = SNAKE_RENDER_INTERVAL_MS;
    this.skillAuraRenderMs = SKILL_AURA_INTERVAL_MS;
    this.hudRenderMs = HUD_RENDER_INTERVAL_MS;
    this.lastSkillSignature = null;

    this.bg = this.add.tileSprite(GAME_CONFIG.arena / 2, GAME_CONFIG.arena / 2, GAME_CONFIG.arena, GAME_CONFIG.arena, this.arenaTextureForChapter(this.chapterForTime(0)));
    this.applyArenaTexture(this.chapterForTime(0));
    this.floorShade = this.add.rectangle(GAME_CONFIG.arena / 2, GAME_CONFIG.arena / 2, GAME_CONFIG.arena, GAME_CONFIG.arena, COLORS.ink, 0.42);
    this.arenaVeil = this.add.tileSprite(GAME_CONFIG.arena / 2, GAME_CONFIG.arena / 2, GAME_CONFIG.arena, GAME_CONFIG.arena, "arena-bg");
    this.arenaVeil.setTileScale(0.72, 0.72).setAlpha(0.12).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.worldLayer.add([this.bg, this.floorShade, this.arenaVeil]);
    this.border = this.add.graphics();
    this.worldLayer.add(this.border);
    this.drawBorder();

    this.pickupLayer = this.add.container(0, 0);
    this.skillLayer = this.add.container(0, 0).setDepth(31);
    this.enemyLayer = this.add.container(0, 0);
    this.projectileLayer = this.add.container(0, 0);
    this.worldLayer.add([this.pickupLayer, this.enemyLayer, this.projectileLayer]);
    this.fxLayer.setDepth(20);
    this.snakeLayer.setDepth(30);

    [86, 162, 252].forEach((offset) => this.spawnPickup("food", this.player.x + offset, this.player.y + Phaser.Math.Between(-22, 22)));
    for (let i = 0; i < 7; i += 1) this.spawnPickup("food");

    this.buildHud();
    this.cameraTarget = this.add.zone(this.player.x, this.player.y, 1, 1);
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.arena, GAME_CONFIG.arena);
    this.forceCameraToPlayer();
    this.cameras.main.startFollow(this.cameraTarget, true, 0.12, 0.12);
    this.forceCameraToPlayer();
    this.addMemory(level.id === "tutorial" ? "教学开始：先拖动蛇首，吞噬发光记忆，让身体变长。" : `进入「${level.name}」：身体就是生命，也是净化技能的代价。`, "birth");
    this.renderSkillAuras();
    this.drawSnake();
    this.updateHud();
  }

  forceCameraToPlayer() {
    const cam = this.cameras.main;
    const view = this.cameraViewSize();
    const maxX = Math.max(0, GAME_CONFIG.arena - view.width);
    const maxY = Math.max(0, GAME_CONFIG.arena - view.height);
    cam.setScroll(
      clamp(this.player.x - view.width / 2, 0, maxX),
      clamp(this.player.y - view.height / 2, 0, maxY),
    );
  }

  drawBorder() {
    this.border.clear();
    this.border.lineStyle(5, COLORS.cyan, 0.18);
    this.border.strokeRoundedRect(28, 28, GAME_CONFIG.arena - 56, GAME_CONFIG.arena - 56, 42);
    this.border.lineStyle(1, COLORS.acid, 0.04);
    for (let i = 260; i < GAME_CONFIG.arena; i += 260) {
      this.border.lineBetween(i, 32, i, GAME_CONFIG.arena - 32);
      this.border.lineBetween(32, i, GAME_CONFIG.arena - 32, i);
    }
  }

  buildHud() {
    const { height } = this.viewSize();
    const scale = this.displayScale();
    this.hud = {};
    this.hud.joyBase = this.add.circle(86, height - 104, 42, 0x081315, 0.58).setStrokeStyle(2, COLORS.jade, 0.34).setScrollFactor(0);
    this.hud.joyKnob = this.add.circle(86, height - 104, 16, COLORS.jade, 0.78).setStrokeStyle(2, COLORS.gold, 0.72).setScrollFactor(0);
    this.hud.joyBase.setScale(scale);
    this.hud.joyKnob.setScale(scale);
    this.hud.joyBase.setVisible(false);
    this.hud.joyKnob.setVisible(false);
    this.uiLayer.add([this.hud.joyBase, this.hud.joyKnob]);
  }

  layout() {
    if (this.mode === "menu") {
      this.buildMenu();
      return;
    }
    if (!this.hud) return;
    const { height } = this.viewSize();
    const scale = this.displayScale();
    this.hud.joyBase.setScale(scale);
    this.hud.joyKnob.setScale(scale);
    if (!this.pointerState) {
      this.hud.joyBase.setPosition(86, height - 104);
      this.hud.joyKnob.setPosition(86, height - 104);
    }
  }

  pauseRun() {
    if (this.mode !== "playing") return;
    this.mode = "pause";
    this.showDom("pause");
    this.stopCombatMusic(false);
  }

  resumeRun() {
    if (this.mode !== "pause") return;
    this.mode = "playing";
    this.showDom("playing");
    this.startCombatMusic();
  }

  update(_time, delta) {
    if (this.mode !== "playing") return;
    const ms = Math.min(delta, GAME_CONFIG.maxFrameDelta);
    const dt = ms / 1000;
    this.run.timeMs += ms;
    this.run.levelElapsedMs = (this.run.levelElapsedMs ?? 0) + ms;
    if (this.run.timeMs < 120) this.forceCameraToPlayer();
    this.run.invulnMs = Math.max(0, this.run.invulnMs - ms);
    this.run.bodyHitCooldownMs = Math.max(0, this.run.bodyHitCooldownMs - ms);
    this.player.hurtMs = Math.max(0, this.player.hurtMs - ms);
    this.updateChapterState();

    this.updatePlayer(dt);
    this.updatePickups(dt);
    this.updateEnemies(dt, ms);
    this.updateBoss(dt, ms);
    this.updateBossWeakpoints();
    this.updateProjectiles(dt, ms);
    this.updateShots(dt, ms);
    this.updateSkills(dt, ms);
    this.updateWaveEvent(ms);
    this.updateRunSurprises(ms);
    this.updateMusicState();
    this.tryOpenQueuedUpgrade();
    this.skillAuraRenderMs += ms;
    if (this.skillAuraRenderMs >= SKILL_AURA_INTERVAL_MS) {
      this.skillAuraRenderMs = 0;
      this.renderSkillAuras();
    }
    this.updateSpawns(ms);
    if (LOW_POWER_RENDER) {
      this.drawSnake();
    } else {
      this.snakeRenderMs += ms;
      if (this.snakeRenderMs >= SNAKE_RENDER_INTERVAL_MS) {
        this.snakeRenderMs = 0;
        this.drawSnake();
      }
    }
    this.hudRenderMs += ms;
    if (this.hudRenderMs >= HUD_RENDER_INTERVAL_MS) {
      this.hudRenderMs = 0;
      this.updateHud();
    }
    this.updateCamera(ms);
  }

  onPointerDown(pointer) {
    this.unlockAudio();
    if (this.mode !== "playing") return;
    const pos = this.pointerPos(pointer);
    const { width } = this.viewSize();
    if (pos.y < 150 || pos.x > width - 76) return;
    this.pointerState = { id: pointer.id, sx: pos.x, sy: pos.y };
    this.hud?.joyBase?.setPosition(pos.x, pos.y).setVisible(true);
    this.hud?.joyKnob?.setPosition(pos.x, pos.y).setVisible(true);
    this.updatePointerAngle(pointer);
  }

  onPointerMove(pointer) {
    if (this.mode !== "playing" || !this.pointerState || this.pointerState.id !== pointer.id) return;
    this.updatePointerAngle(pointer);
  }

  onPointerUp(pointer) {
    if (this.pointerState?.id === pointer.id) {
      this.pointerState = null;
      this.hud?.joyBase?.setVisible(false);
      this.hud?.joyKnob?.setVisible(false);
    }
  }

  updatePointerAngle(pointer) {
    const p = this.pointerState;
    const pos = this.pointerPos(pointer);
    let dx = pos.x - p.sx;
    let dy = pos.y - p.sy;
    let len = Math.hypot(dx, dy);
    if (len <= GAME_CONFIG.inputDeadZone) return;
    this.player.targetAngle = Math.atan2(dy, dx);
    const cap = Math.min(GAME_CONFIG.joystickRadius, len);
    this.hud?.joyKnob?.setPosition(p.sx + (dx / len) * cap, p.sy + (dy / len) * cap);
  }

  updatePlayer(dt) {
    const segmentWeight = Math.max(0, this.run.segments - GAME_CONFIG.initialSegments);
    const speedLevel = this.run.skills.speed ?? 0;
    const turnRate = Math.max(GAME_CONFIG.turnRateFloor, GAME_CONFIG.baseTurnRate - segmentWeight * GAME_CONFIG.turnRateDecay) + speedLevel * 0.18;
    const speed = GAME_CONFIG.baseSpeed * (1 + speedLevel * 0.055);
    this.player.angle = angleLerp(this.player.angle, this.player.targetAngle, clamp(turnRate * dt, 0, 1));
    this.player.x += Math.cos(this.player.angle) * speed * dt;
    this.player.y += Math.sin(this.player.angle) * speed * dt;
    this.player.x = clamp(this.player.x, 46, GAME_CONFIG.arena - 46);
    this.player.y = clamp(this.player.y, 46, GAME_CONFIG.arena - 46);
    this.cameraTarget?.setPosition(this.player.x, this.player.y);

    this.player.trail.unshift({ x: this.player.x, y: this.player.y, angle: this.player.angle });
    const maxTrail = Math.ceil((GAME_CONFIG.maxSegments + 6) * GAME_CONFIG.segmentGap);
    if (this.player.trail.length > maxTrail) this.player.trail.length = maxTrail;
  }

  getSegmentPoint(index) {
    if (index === 0) return this.player;
    const trailIndex = Math.min(this.player.trail.length - 1, Math.floor(index * GAME_CONFIG.segmentGap));
    return this.player.trail[trailIndex] ?? this.player;
  }

  segmentNormal(point, side = 1) {
    const angle = point?.angle ?? this.player?.angle ?? 0;
    return {
      x: Math.cos(angle + Math.PI / 2) * side,
      y: Math.sin(angle + Math.PI / 2) * side,
    };
  }

  segmentAnchor(index, side = 1, offset = 18) {
    const point = this.getSegmentPoint(clamp(index, 0, Math.max(0, this.run.segments - 1)));
    const normal = this.segmentNormal(point, side);
    return {
      x: point.x + normal.x * offset,
      y: point.y + normal.y * offset,
      angle: point.angle ?? this.player.angle,
      normal,
      point,
    };
  }

  lengthScale(min = 1, max = 1.42) {
    const t = clamp((this.run.segments - GAME_CONFIG.initialSegments) / Math.max(1, GAME_CONFIG.maxSegments - GAME_CONFIG.initialSegments), 0, 1);
    return min + (max - min) * t;
  }

  pickupMagnetRadius() {
    const relicBonus = this.run?.relics?.includes("magnetic_scales") ? 38 : 0;
    const skillBonus = (this.run?.skills?.magnet ?? 0) * 32;
    return GAME_CONFIG.magnetRadius + Math.max(0, this.run.segments - GAME_CONFIG.initialSegments) * 2.2 + relicBonus + skillBonus;
  }

  updateSpawns(ms) {
    this.run.nextFoodMs -= ms;
    this.run.nextSkillMs -= ms;
    this.run.nextEnemyMs -= ms;
    this.run.nextEliteMs -= ms;
    const chapter = this.updateChapterState();
    this.run.wave = 1 + Math.floor(this.run.timeMs / 42000);
    const level = this.currentV13Level();
    const levelElapsed = this.run.levelElapsedMs ?? this.run.timeMs;

    const memoryRain = this.run.currentEvent?.id === "memory_rain";
    const hunt = this.run.currentEvent?.id === "hunt";
    const foodLimit = LOW_POWER_RENDER ? (memoryRain ? 24 : 18) : (memoryRain ? 34 : 26);
    if (this.run.nextFoodMs <= 0 && this.pickups.filter((p) => p.type === "food").length < foodLimit) {
      this.run.nextFoodMs = memoryRain ? Math.max(260, GAME_CONFIG.foodSpawnMs * 0.48) : Math.max(460, GAME_CONFIG.foodSpawnMs - chapter.index * 35);
      this.spawnPickup("food");
    }
    const levelCostIndex = Math.max(0, this.run.levelIndex - 1);
    if (!this.run.firstSkillCoreGiven && levelElapsed >= level.firstSkillCoreMs && this.run.sxp >= Math.floor(v13SkillXpCost(this.run.upgradeCount, levelCostIndex) * 0.72)) {
      this.trySpawnSkillPickup("first_core");
      this.run.firstSkillCoreGiven = true;
    } else {
      this.tryProgressSkillCore();
    }
    const chapterPressure = chapter.index * 4;
    const enemyLimit = level.enemyCapBase + Math.floor(this.run.wave * level.enemyCapGrowth) + chapterPressure + (hunt ? 6 : 0) + (this.run.currentElite ? 4 : 0);
    const tunedEnemyLimit = LOW_POWER_RENDER ? Math.min(enemyLimit, 24 + chapter.index * 4 + (hunt ? 3 : 0) + (this.run.currentElite ? 3 : 0)) : enemyLimit;
    if (levelElapsed >= level.enemyGraceMs && this.run.nextEnemyMs <= 0 && this.enemies.length < tunedEnemyLimit) {
      const pressure = Math.max(0, this.run.wave - 1) + chapter.index * 1.2;
      const teaching = levelElapsed < level.protectionMs;
      this.run.nextEnemyMs = Math.max(hunt ? 210 : 290, level.enemySpawnMs - pressure * 58) * (teaching ? 1.55 : 1) * (hunt ? 0.58 : 1);
      const eventKind = hunt && Math.random() < 0.68 ? "hunter" : this.run.currentElite?.id === "idol_edict" && Math.random() < 0.26 ? "sentinel" : undefined;
      this.spawnEnemy(teaching && Math.random() < 0.72 ? "drifter" : eventKind);
    }
    if (!this.boss && this.run.nextEliteMs <= 0 && this.run.timeMs > 70000) {
      this.triggerEliteEvent();
    }
    const nextBoss = this.nextBossSpec();
    if (!this.boss && nextBoss && levelElapsed >= nextBoss.spawnMs) {
      this.spawnBoss(nextBoss);
    }
  }

  updateWaveEvent(ms) {
    if (!this.run) return;
    if (this.run.currentEvent) {
      this.run.eventUntilMs -= ms;
      if (this.run.eventUntilMs <= 0) {
        this.addMemory(`「${this.run.currentEvent.name}」退去。`, "event");
        this.run.currentEvent = null;
        this.run.nextEventMs = GAME_CONFIG.waveEventMs;
      }
      return;
    }
    if (this.boss) return;
    this.run.nextEventMs -= ms;
    if (this.run.nextEventMs > 0) return;
    const choices = [
      { id: "memory_rain", name: "记忆雨", color: COLORS.reward },
      { id: "hunt", name: "围猎潮", color: COLORS.rose },
      { id: "resonance", name: "共鸣裂隙", color: COLORS.cyan },
    ];
    const event = pick(choices);
    this.run.currentEvent = event;
    this.run.eventUntilMs = GAME_CONFIG.waveEventDurationMs;
    this.addMemory(`巢穴事件：${event.name}。`, "event");
    this.floatText(this.player.x, this.player.y - 92, event.name, event.color);
    this.playEventSound(event.id);
    if (event.id === "memory_rain") {
      for (let i = 0; i < 7; i += 1) this.spawnPickup("food");
    } else if (event.id === "hunt") {
      for (let i = 0; i < 5; i += 1) this.spawnEnemy(i % 2 ? "hunter" : "drifter");
    } else {
      this.trySpawnSkillPickup("resonance");
      this.run.nextLightningMs = 0;
      this.addRing(this.player.x, this.player.y, 240, COLORS.cyan, 0.22);
    }
  }

  triggerEliteEvent() {
    const chapter = this.chapterForTime();
    const pool = ELITE_EVENTS.filter((event) => this.run.timeMs >= event.minMs && (!event.chapter || event.chapter === chapter.id));
    const event = pool.length ? pick(pool) : pick(ELITE_EVENTS);
    this.run.currentElite = event;
    this.run.nextEliteMs = 62000 + Math.random() * 28000;
    this.addMemory(`精英事件：${event.name}。${event.text}`, "elite");
    this.floatText(this.player.x, this.player.y - 112, event.name, event.color);
    this.addRing(this.player.x, this.player.y, 330, event.color, 0.36);
    const count = event.id === "idol_edict" ? 5 : 4;
    for (let i = 0; i < count; i += 1) {
      const kind = event.id === "crimson_surge" ? (i % 2 ? "bloomer" : "hunter") : event.id === "idol_edict" ? "sentinel" : (i % 2 ? "hunter" : "drifter");
      this.spawnEnemy(kind, null, { elite: true, auraTint: event.color, hpMultiplier: event.id === "idol_edict" ? 2.1 : 1.65, scoreBonus: 60 });
    }
    if (event.id === "idol_edict") this.trySpawnSkillPickup("elite");
    this.screenShake = Math.max(this.screenShake, 8);
    this.playEventSound(event.id);
    window.setTimeout(() => {
      if (this.run?.currentElite?.id === event.id) this.run.currentElite = null;
    }, 12000);
  }

  updateRunSurprises(ms) {
    if (!this.run || this.mode !== "playing" || this.boss) return;
    this.run.nextSurpriseMs -= ms;
    if (this.run.nextSurpriseMs > 0) return;
    const pressure = Math.min(8000, this.run.greedPressure * 1200 + this.run.memoryOverflow * 900);
    this.run.nextSurpriseMs = Math.max(12000, 22000 + Math.random() * 18000 - pressure);
    if (this.run.timeMs < 12000) return;
    const chance = 0.38 + Math.min(0.28, this.run.greedPressure * 0.04 + this.run.memoryOverflow * 0.035);
    if (Math.random() > chance) {
      this.addMemory("巢穴短暂安静了一瞬。", "event");
      return;
    }
    const event = this.rollSurprise("run");
    this.applySurprise(event);
    this.addRing(this.player.x, this.player.y, event.rarity === "rare" ? 300 : 220, event.rarity === "rare" ? COLORS.gold : COLORS.cyan, 0.32);
  }

  spawnPickup(type, forcedX = null, forcedY = null) {
    const point = forcedX === null ? randomNear(this.player ?? { x: GAME_CONFIG.arena / 2, y: GAME_CONFIG.arena / 2 }, 220, 780) : { x: forcedX, y: forcedY };
    const x = clamp(point.x, 80, GAME_CONFIG.arena - 80);
    const y = clamp(point.y, 80, GAME_CONFIG.arena - 80);
    const aura = this.add.image(x, y, "snake-glow").setTint(COLORS.reward);
    aura.setDisplaySize(type === "skill" ? 126 : 88, type === "skill" ? 126 : 88).setBlendMode(Phaser.BlendModes.ADD).setAlpha(type === "skill" ? 0.4 : 0.3);
    const foodTexture = this.run?.memoryOverflow > 0 ? this.textureOr("pickup-memory-medium-v11", "energy-bloom") : this.textureOr("pickup-memory-small-v11", "spark");
    const sprite = this.add.image(x, y, type === "skill" ? this.textureOr("pickup-skill-v11", "energy-bloom") : foodTexture).setDisplaySize(type === "skill" ? 50 : this.run?.memoryOverflow > 0 ? 42 : 34, type === "skill" ? 50 : this.run?.memoryOverflow > 0 ? 42 : 34);
    this.tweens.add({ targets: aura, alpha: type === "skill" ? 0.54 : 0.4, duration: 900, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: sprite, angle: 360, duration: type === "skill" ? 4200 : 5600, repeat: -1 });
    this.pickupLayer.add([aura, sprite]);
    this.pickups.push({ type, x, y, radius: type === "skill" ? 24 : 18, sprite, aura });
  }

  nextSkillDropDelay(source = "field") {
    const chapter = this.chapterForTime();
    const killsSince = Math.max(0, (this.run?.kills ?? 0) - (this.run?.lastSkillDropKills ?? 0));
    const chapterBonus = chapter.index * 2600;
    const killAccel = Math.min(GAME_CONFIG.skillDropKillAccelMaxMs, killsSince * GAME_CONFIG.skillDropKillAccelMs);
    const repeatTax = Math.min(3600, (this.run?.skillDropCount ?? 0) * 850);
    const sourceFactor = source === "field" ? 1 : source === "resonance" ? 0.46 : source.includes("elite") ? 0.55 : 0.68;
    const base = GAME_CONFIG.skillDropMs - chapterBonus - killAccel + repeatTax;
    return Math.max(GAME_CONFIG.skillDropMinMs, base * sourceFactor) + Math.random() * GAME_CONFIG.skillDropJitterMs;
  }

  markSkillDrop(source = "field") {
    if (!this.run) return;
    this.run.lastSkillDropKills = this.run.kills;
    this.run.skillDropCount += 1;
    this.run.nextSkillMs = V13_BALANCE.skill.minCardGapMs;
  }

  trySpawnSkillPickup(source = "field") {
    if (this.run?.pendingUpgrade) return false;
    if (this.pickups.filter((p) => p.type === "skill").length >= 1) return false;
    this.spawnPickup("skill");
    this.run.firstSkillCoreGiven = true;
    this.markSkillDrop(source);
    return true;
  }

  updatePickups(dt) {
    for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
      const p = this.pickups[i];
      const d = distance(this.player, p);
      const magnetRadius = this.pickupMagnetRadius();
      if (d < magnetRadius) {
        const pull = clamp((magnetRadius - d) / magnetRadius, 0, 1);
        p.x += (this.player.x - p.x) * pull * dt * 5;
        p.y += (this.player.y - p.y) * pull * dt * 5;
        p.sprite.setPosition(p.x, p.y);
        p.aura.setPosition(p.x, p.y);
        if ((this.run.skills.magnet ?? 0) > 0) {
          p.nextMagnetFxMs = (p.nextMagnetFxMs ?? 0) - dt * 1000;
          if (p.nextMagnetFxMs <= 0 && pull > 0.18) {
            p.nextMagnetFxMs = 130;
            const angle = Phaser.Math.Angle.Between(p.x, p.y, this.player.x, this.player.y);
            this.addBitmapFx("v10-magnet-trail", 4, p.x, p.y, { width: 48 + pull * 34, height: 18 + pull * 10, angle, alpha: 0.32 + pull * 0.28, duration: 240, originX: 0.15 });
          }
        }
      }
      if (d < GAME_CONFIG.headRadius + p.radius) {
        if (p.type === "skill") this.collectSkillPickup(i);
        else this.collectFood(i);
      }
    }
  }

  collectFood(index) {
    const p = this.pickups[index];
    this.destroyPickup(index);
    const reward = this.rollMemoryReward();
    this.run.mxp += reward.mxp;
    this.awardSkillXp(reward.sxp, "memory");
    if (reward.healCracks) this.run.bodyCracks = Math.max(0, this.run.bodyCracks - reward.healCracks);
    if (reward.overload) this.run.memoryOverflow += reward.overload;
    let grew = 0;
    while (this.run.mxp >= v13GrowthCost(this.run.segments) && this.run.segments < V13_BALANCE.maxSegments) {
      const cost = v13GrowthCost(this.run.segments);
      this.run.mxp -= cost;
      this.run.segments += 1;
      grew += 1;
    }
    if (this.run.segments >= V13_BALANCE.maxSegments && reward.mxp > 0 && !grew) {
      this.run.memoryOverflow += 1;
      this.run.greedPressure += 1;
    }
    this.run.score += 10 + this.run.wave * 2;
    this.addMemory(pick(MEMORY_LINES), "food");
    this.addBurst(p.x, p.y, COLORS.reward, 56, 0.24);
    if ((this.run.skills.magnet ?? 0) > 0) this.addBitmapFx("v10-magnet-burst", 4, p.x, p.y, { size: 72 + this.run.skills.magnet * 8, alpha: 0.58, duration: 300 });
    this.floatText(p.x, p.y, grew ? `身体 +${grew}` : `记忆 +${reward.mxp}`, COLORS.reward);
    this.playEatSound();
    this.updateGrowthStage(p);
    if (this.run.memoryOverflow > 0 && this.run.memoryOverflow % 6 === 0) this.queueUpgrade("overload");
  }

  rollMemoryReward() {
    const entries = Object.entries(V13_BALANCE.memory).filter(([, spec]) => typeof spec === "object" && spec.weight);
    const total = entries.reduce((sum, [, spec]) => sum + spec.weight, 0);
    let roll = Math.random() * total;
    for (const [, spec] of entries) {
      roll -= spec.weight;
      if (roll <= 0) return spec;
    }
    return V13_BALANCE.memory.small;
  }

  awardSkillXp(amount = 0, source = "memory") {
    if (!this.run || amount <= 0) return;
    this.run.sxp += amount;
    this.tryProgressSkillCore(source);
  }

  tryProgressSkillCore(source = "progress") {
    if (!this.run || this.run.pendingUpgrade) return false;
    if (this.pickups.filter((p) => p.type === "skill").length >= V13_BALANCE.skill.fieldCoreLimit) return false;
    const cost = v13SkillXpCost(this.run.upgradeCount, Math.max(0, this.run.levelIndex - 1));
    if (this.run.sxp < cost) return false;
    this.run.sxp -= cost;
    return this.trySpawnSkillPickup(source);
  }

  collectSkillPickup(index) {
    const p = this.pickups[index];
    this.destroyPickup(index);
    this.addMemory("它吞下了一枚改变命运的技能核。", "skill_drop");
    this.playSkillSound("lightning");
    this.queueUpgrade("skill");
  }

  currentGrowthStage() {
    let stage = GROWTH_STAGES[0];
    for (const candidate of GROWTH_STAGES) {
      if (this.run.segments >= candidate.at) stage = candidate;
    }
    return stage;
  }

  updateGrowthStage(point = this.player) {
    const stage = this.currentGrowthStage();
    if (stage.id === this.run.growthStage) return;
    this.run.growthStage = stage.id;
    this.addMemory(`它蜕变为「${stage.name}」：${stage.text}`, "growth");
    this.floatText(point.x, point.y - 46, `蜕变：${stage.name}`, COLORS.gold);
    this.addRing(point.x, point.y, 160, COLORS.gold, 0.36);
    this.playComboSound("growth");
    if (stage.id !== "overload") {
      this.awardSkillXp(2, "growth");
      this.floatText(point.x, point.y - 82, "技能进度 +2", COLORS.cyan);
    }
  }

  destroyPickup(index) {
    const p = this.pickups[index];
    this.pickups.splice(index, 1);
    this.tweens.killTweensOf([p.sprite, p.aura]);
    p.sprite.destroy();
    p.aura.destroy();
  }

  queueUpgrade(reason = "skill", options = {}) {
    if (!this.run || this.mode !== "playing") return;
    const priority = { boss: 4, overload: 3, skill: 2, growth: 1 };
    if (!this.run.pendingUpgrade || (priority[reason] ?? 0) >= (priority[this.run.pendingUpgrade.reason] ?? 0)) {
      this.run.pendingUpgrade = { reason, createdMs: this.run.timeMs };
    }
    if (!options.defer && this.canOpenUpgradeNow() && !this.isPlayerInImmediateDanger()) {
      this.openUpgrade(this.run.pendingUpgrade.reason);
    } else if (!options.defer) {
      this.floatText(this.player.x, this.player.y - 68, "突变已储存", COLORS.cyan);
    }
  }

  canOpenUpgradeNow() {
    return this.mode === "playing" && this.run.timeMs - this.run.lastUpgradeMs >= V13_BALANCE.skill.minCardGapMs;
  }

  isPlayerInImmediateDanger() {
    const enemyDanger = this.enemies.some((e) => Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) < 180 + e.radius);
    const projectileDanger = this.projectiles.some((p) => Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y) < 132 + p.radius);
    return enemyDanger || projectileDanger;
  }

  tryOpenQueuedUpgrade() {
    if (!this.run?.pendingUpgrade || !this.canOpenUpgradeNow()) return;
    const heldMs = this.run.timeMs - this.run.pendingUpgrade.createdMs;
    if (this.isPlayerInImmediateDanger() && heldMs < GAME_CONFIG.queuedUpgradeDangerHoldMs) return;
    this.openUpgrade(this.run.pendingUpgrade.reason);
  }

  openUpgrade(reason = "skill") {
    if (this.mode !== "playing") return;
    this.mode = "upgrade";
    this.run.pendingUpgrade = null;
    this.run.lastUpgradeMs = this.run.timeMs;
    this.run.upgradeCount += 1;
    this.showDom("upgrade");
    this.stopCombatMusic(false);
    this.playUpgradeSound();

    const choices = this.createUpgradeChoices(reason);
    if (!this.dom?.cards) return;
    this.dom.cards.innerHTML = "";
    choices.forEach((choice) => {
      const current = choice.type === "skill" ? this.run.skills[choice.id] : 0;
      const cost = choice.type === "skill" ? this.skillBodyCost(choice) : 0;
      const rarity = choice.type === "skill" ? this.skillRarityForLevel(current + 1) : choice.rarity ?? "uncommon";
      const card = document.createElement("button");
      card.className = `ui-card is-locked is-${rarity} ${choice.type === "skill" && !this.canPaySkillCost(cost) ? "is-too-expensive" : ""}`;
      const level = choice.type === "skill" ? `Lv${current + 1}` : choice.badge ?? "事件";
      const costText = choice.type === "skill" ? `消耗 ${cost} 节` : choice.badge ?? "不消耗";
      const icon = choice.type === "skill" ? `<span class="ui-card-icon"><img src="${this.skillIconAssetPath(choice)}" alt=""></span>` : `<span class="ui-card-icon">${choice.icon}</span>`;
      const hint = choice.type === "skill" && !this.canPaySkillCost(cost) ? "身体不足，先吞噬更多记忆。" : choice.text;
      card.innerHTML = `
        <span class="ui-rarity">${this.rarityLabel(rarity)}</span>
        <span class="ui-level">${level}</span>
        ${icon}
        <span class="ui-card-copy">
          <strong>${choice.name}</strong>
          <em>${hint}</em>
          <b>${costText}</b>
        </span>
      `;
      card.dataset.locked = "true";
      window.setTimeout(() => {
        card.dataset.locked = "false";
        card.classList.remove("is-locked");
      }, GAME_CONFIG.buildPauseCooldownMs);
      card.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        if (card.dataset.locked === "true") return;
        this.unlockAudio();
        this.applyChoice(choice);
      });
      this.dom.cards.appendChild(card);
    });
  }

  createUpgradeChoices(reason = "skill") {
    const choices = [];
    const skillCount = reason === "overload" ? 1 : 2;
    const skills = Phaser.Utils.Array.Shuffle(SKILLS.filter((skill) => this.run.skills[skill.id] < 5)).slice(0, skillCount);
    skills.forEach((skill) => choices.push({ ...skill, type: "skill" }));

    if (reason === "overload") {
      choices.push(
        { type: "overload", id: "flare", icon: "爆", name: "过载爆燃", badge: "消耗3", rarity: "rare", text: "消耗 3 过载记忆，立刻触发一次全身技能爆发。" },
        { type: "overload", id: "tailcut", icon: "断", name: "断尾求生", badge: "消耗3", rarity: "rare", text: "消耗 3 过载记忆，失去 4 节身体并回复 1 心。" },
      );
      return Phaser.Utils.Array.Shuffle(choices).slice(0, 3);
    }

    const relicCandidates = RELIC_POOL.filter((relic) => !this.run.relics.includes(relic.id));
    if (relicCandidates.length && (reason === "growth" || Math.random() < 0.42)) {
      const relic = pick(relicCandidates);
      choices.push({ ...relic, type: "relic", rarity: "uncommon" });
    }

    if (reason === "growth" || this.run.growthStage === "final_molt" || Math.random() < 0.28) {
      const surprise = this.rollSurprise("card");
      choices.push({ ...surprise, type: "surprise" });
    }

    while (choices.length < 3) {
      const fallback = pick(SKILLS.filter((skill) => this.run.skills[skill.id] < 5));
      if (!choices.some((choice) => choice.type === "skill" && choice.id === fallback.id)) choices.push({ ...fallback, type: "skill" });
      else break;
    }
    const reserve = { type: "skip", id: "reserve_body", icon: "蓄", name: "保留身体", badge: "不消耗", rarity: "uncommon", text: "放弃本次突变，保留长度，并额外唤来几枚记忆。" };
    const rolled = Phaser.Utils.Array.Shuffle(choices).slice(0, 2);
    return Phaser.Utils.Array.Shuffle([...rolled, reserve]).slice(0, 3);
  }

  applyChoice(choice) {
    if (choice.type === "skill") {
      this.applySkill(choice);
      return;
    }
    if (choice.type === "relic") {
      this.applyRelic(choice);
    } else if (choice.type === "surprise") {
      this.applySurprise(choice);
    } else if (choice.type === "overload") {
      this.applyOverloadChoice(choice);
    } else if (choice.type === "skip") {
      this.addMemory("它没有净化新技能，而是把身体留给下一次冒险。", "reserve");
      for (let i = 0; i < 3; i += 1) this.spawnPickup("food");
    }
    this.mode = "playing";
    this.showDom("playing");
    this.startCombatMusic();
    this.addBurst(this.player.x, this.player.y, COLORS.gold, 140, 0.28);
    this.playUpgradeSound();
  }

  rollSurprise(source = "event") {
    const recent = new Set(this.run.recentSurprises ?? []);
    const pool = SURPRISE_EVENTS.filter((event) => !recent.has(event.id));
    const candidates = pool.length ? pool : SURPRISE_EVENTS;
    const weighted = [];
    candidates.forEach((event) => {
      let weight = event.rarity === "rare" ? 2 : 4;
      if (this.run.growthStage === "final_molt" || this.run.memoryOverflow > 0) weight += 2;
      if (event.id === "greed_gate" && this.run.segments <= V13_BALANCE.safeAfterSkillSegments + 2) weight -= 1;
      if (event.id === "safe_void" && this.enemies.length > 8) weight += 3;
      if (source === "card") weight += 1;
      for (let i = 0; i < Math.max(1, weight); i += 1) weighted.push(event);
    });
    return pick(weighted);
  }

  rememberSurprise(id) {
    this.run.recentSurprises.push(id);
    if (this.run.recentSurprises.length > 4) this.run.recentSurprises.shift();
  }

  applyRelic(relic) {
    if (this.run.relics.includes(relic.id)) return;
    this.run.relics.push(relic.id);
    this.addMemory(`遗物入骨：「${relic.name}」。`, "relic");
    this.floatText(this.player.x, this.player.y - 54, relic.name, COLORS.gold);
    if (relic.id === "ember_gland") this.run.skills.fire = Math.min(5, this.run.skills.fire + 1);
    if (relic.id === "cold_blood") {
      this.run.skills.frost = Math.min(5, this.run.skills.frost + 1);
      this.run.bodyCracks = Math.max(0, this.run.bodyCracks - 1);
    }
    if (relic.id === "broken_tail") {
      this.run.segments = Math.max(V13_BALANCE.safeAfterSkillSegments, this.run.segments - 3);
      this.run.bodyCracks = 0;
      this.trySpawnSkillPickup("relic");
    }
    if (relic.id === "magnetic_scales") {
      this.run.greedPressure += 1;
      for (let i = 0; i < 4; i += 1) this.spawnPickup("food");
    }
    if (relic.id === "storm_vertebra") this.run.skills.lightning = Math.min(5, this.run.skills.lightning + 1);
    this.checkCombos();
  }

  applySurprise(event) {
    this.rememberSurprise(event.id);
    this.addMemory(`意外发生：「${event.name}」。`, "surprise");
    this.floatText(this.player.x, this.player.y - 72, event.name, event.rarity === "rare" ? COLORS.dangerCore : COLORS.cyan);
    if (event.id === "double_core") {
      this.run.bodyCracks = Math.min(V13_BALANCE.crackLimit, this.run.bodyCracks + 1);
      this.awardSkillXp(v13SkillXpCost(this.run.upgradeCount, Math.max(0, this.run.levelIndex - 1)), "double_core");
    } else if (event.id === "greed_gate") {
      for (let i = 0; i < 10; i += 1) this.spawnPickup("food");
      this.run.currentEvent = { id: "hunt", name: "围猎潮", color: COLORS.rose };
      this.run.eventUntilMs = GAME_CONFIG.waveEventDurationMs;
      for (let i = 0; i < 7; i += 1) this.spawnEnemy(i % 2 ? "hunter" : "drifter");
    } else if (event.id === "boss_echo") {
      this.run.memoryOverflow += 1;
      this.addRing(this.player.x, this.player.y, 260, COLORS.rose, 0.36);
      if (!this.boss && this.run.kills > 20) this.spawnBoss(this.nextBossSpec());
    } else if (event.id === "safe_void") {
      for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.enemies[i].x, this.enemies[i].y) < 360) this.killEnemy(i, COLORS.cyan);
      }
      this.run.greedPressure += 1;
    }
    this.playComboSound(event.id);
  }

  applyOverloadChoice(choice) {
    if (this.run.memoryOverflow < 3) return;
    this.run.memoryOverflow -= 3;
    if (choice.id === "flare") {
      SKILLS.forEach((skill) => {
        if (this.run.skills[skill.id] > 0) this.triggerSkillSurge(skill);
      });
      this.run.greedPressure += 1;
    } else if (choice.id === "tailcut") {
      this.run.segments = Math.max(V13_BALANCE.safeAfterSkillSegments, this.run.segments - 4);
      this.run.bodyCracks = 0;
      this.addMemory("它主动断尾，把贪婪换成一次呼吸。", "overload");
    }
  }

  skillBodyCost(skill) {
    const current = this.run.skills[skill.id] ?? 0;
    return v13SkillCost(current + 1);
  }

  canPaySkillCost(cost) {
    return this.run.segments - cost >= V13_BALANCE.safeAfterSkillSegments;
  }

  applySkill(skill) {
    const cost = this.skillBodyCost(skill);
    if (!this.canPaySkillCost(cost)) {
      this.floatText(this.player.x, this.player.y - 66, `身体不足：需要 ${cost} 节`, COLORS.rose);
      this.addMemory(`它还不够长，暂时无法净化「${skill.name}」。`, "reserve");
      for (let i = 0; i < 2; i += 1) this.spawnPickup("food");
      this.mode = "playing";
      this.showDom("playing");
      this.startCombatMusic();
      this.playBodyBlockSound(false);
      return;
    }
    this.run.segments = Math.max(V13_BALANCE.safeAfterSkillSegments, this.run.segments - cost);
    this.run.skills[skill.id] += 1;
    if (!this.run.selectedSlots.includes(skill.id) && this.run.selectedSlots.length < 5) this.run.selectedSlots.push(skill.id);
    this.run.buildSequence.push(skill.id);
    this.addMemory(`它消耗 ${cost} 节身体，净化了「${skill.name}」。`, skill.id);
    this.checkCombos();
    this.mode = "playing";
    this.showDom("playing");
    this.startCombatMusic();
    this.addBurst(this.player.x, this.player.y, COLORS.gold, 150, 0.3);
    this.triggerSkillSurge(skill);
    this.playUpgradeSound();
    this.run.invulnMs = Math.max(this.run.invulnMs, V13_BALANCE.postCardProtectionMs);
  }

  triggerSkillSurge(skill) {
    const level = this.run.skills[skill.id];
    this.playSkillSound(skill.id);
    if (skill.id === "fire") {
      this.addMouthFlame(230 + level * 34, 64 + level * 8, level);
      this.damageCone(this.player.x, this.player.y, this.player.angle, 260 + level * 34, 84 + level * 10, (2.7 + level * 0.55) * this.lengthScale(1, 1.16), COLORS.ember);
      return;
    }
    if (skill.id === "frost") {
      this.enemies.forEach((enemy) => {
        enemy.slowMs = Math.max(enemy.slowMs, 1200);
      });
      this.damageAround(this.player.x, this.player.y, 210, 1.6 + level * 0.3, COLORS.frost);
      for (let s = 0; s < Math.min(this.run.segments, 9); s += 2) {
        const p = this.getSegmentPoint(s);
        this.addSkillPulse(p.x, p.y, "frost", 104 + level * 14, COLORS.frost, 0.5, 560);
      }
      return;
    }
    if (skill.id === "turret") {
      for (let i = 0; i < Math.min(6, 2 + level); i += 1) {
        const point = this.getSegmentPoint(i % this.run.segments);
        const target = this.nearestEnemy(point.x, point.y);
        if (!target) continue;
        const mount = this.segmentAnchor(i % this.run.segments, i % 2 === 0 ? 1 : -1, 20);
        const angle = Phaser.Math.Angle.Between(mount.x, mount.y, target.x, target.y);
        this.addMuzzleFlash(mount.x, mount.y, angle, COLORS.playerShot);
        const sprite = this.add.image(mount.x, mount.y, this.frameKey("v10-fang", 4) ?? "player-projectile").setDisplaySize(42, 26);
        sprite.setRotation(angle);
        this.projectileLayer.add(sprite);
        this.shots.push({ x: mount.x, y: mount.y, angle, speed: 455, radius: 10, lifeMs: 1100, damage: (1.8 + level * 0.35) * this.lengthScale(1, 1.18), bounces: 1, trailPrefix: "v10-fang-trail", impactPrefix: "v10-fang-impact", nextTrailMs: 0, sprite });
      }
      return;
    }
    if (skill.id === "spear") {
      this.run.nextSpearMs = 0;
      this.updateSpear(9999);
      this.updateSpear(9999);
      return;
    }
    if (skill.id === "magnet") {
      this.addBitmapFx("v10-magnet-burst", 4, this.player.x, this.player.y, { size: 172 + level * 20, alpha: 0.72, duration: 480 });
      for (let i = 0; i < 5; i += 1) this.spawnPickup("food");
      return;
    }
    if (skill.id === "speed") {
      for (let i = 0; i < 8; i += 1) {
        const p = this.getSegmentPoint(Math.min(this.run.segments - 1, i));
        this.addBitmapFx("v10-speed-streak", 4, p.x, p.y, { width: 90 + level * 12, height: 28 + level * 2, angle: p.angle ?? this.player.angle, alpha: 0.44, duration: 360, originX: 0.82 });
      }
      return;
    }
    if (skill.id === "shield") {
      this.run.invulnMs = Math.max(this.run.invulnMs, 1600 + level * 220);
      this.addBitmapFx("v10-guardian-shield", 4, this.player.x, this.player.y, { size: 154 + level * 18, alpha: 0.72, duration: 520 });
      this.addRing(this.player.x, this.player.y, 128 + level * 16, COLORS.violet, 0.38);
      this.damageAround(this.player.x, this.player.y, 116 + level * 12, 1.4 + level * 0.25, COLORS.violet);
      return;
    }
    if (skill.id === "lightning") {
      this.run.nextLightningMs = 0;
      this.updateLightning(9999);
      this.updateLightning(9999);
    }
  }

  checkCombos() {
    const has = (id) => this.run.skills[id] > 0;
    const combos = [
      { id: "steam", name: "蒸汽蛇阵", need: ["fire", "frost"], color: COLORS.frost },
      { id: "rail", name: "雷炮回响", need: ["turret", "lightning"], color: COLORS.cyan },
      { id: "wall", name: "铁壁蛇阵", need: ["shield"], extra: () => this.run.segments >= 12, color: COLORS.gold },
    ];
    combos.forEach((combo) => {
      if (this.run.comboHighlights.includes(combo.id)) return;
      if (combo.need.every(has) && (!combo.extra || combo.extra())) {
        this.run.comboHighlights.push(combo.id);
        this.addMemory(`它第一次触发了 ${combo.name}。`, "combo");
        this.floatText(this.player.x, this.player.y - 40, combo.name, combo.color);
        this.addBurst(this.player.x, this.player.y, combo.color, 190, 0.34);
        this.playComboSound(combo.id);
      }
    });
  }

  hasCombo(id) {
    return this.run?.comboHighlights?.includes(id) ?? false;
  }

  spawnEnemy(forceKind, forcedPoint = null, mods = {}) {
    const roll = Math.random();
    const chapter = this.chapterForTime();
    const kind = forceKind ?? (chapter.index >= 2 && roll > 0.92 ? "sentinel" : roll > 0.86 ? "bloomer" : roll > 0.56 ? "hunter" : "drifter");
    const spec = ENEMY_KINDS[kind];
    const point = forcedPoint ?? randomNear(this.player ?? { x: GAME_CONFIG.arena / 2, y: GAME_CONFIG.arena / 2 }, 500, 780);
    const texture = this.textureOr(`enemy-${kind}-v11`, "enemy-drifter-v11");
    const sprite = this.add.sprite(clamp(point.x, 70, GAME_CONFIG.arena - 70), clamp(point.y, 70, GAME_CONFIG.arena - 70), texture);
    const baseSize = (kind === "sentinel" ? 72 : kind === "bloomer" ? 64 : kind === "hunter" ? 48 : 40) * (mods.elite ? 1.28 : 1);
    sprite.setDisplaySize(baseSize, baseSize);
    if (!String(texture).endsWith("-v11")) {
      if (kind === "hunter") sprite.setTint(0xff7fca);
      if (kind === "bloomer") sprite.setTint(0xe67bff);
    }
    const glow = this.add.image(sprite.x, sprite.y, "snake-glow").setTint(mods.auraTint ?? (kind === "sentinel" ? COLORS.gold : kind === "bloomer" ? COLORS.violet : COLORS.rose));
    glow.setDisplaySize(spec.radius * (mods.elite ? 4.3 : 3.4), spec.radius * (mods.elite ? 4.3 : 3.4)).setBlendMode(Phaser.BlendModes.ADD).setAlpha(mods.elite ? 0.28 : 0.16);
    this.enemyLayer.add([glow, sprite]);
    const maxHp = (spec.hp + Math.floor((this.run.wave + chapter.index) * 0.38)) * (mods.hpMultiplier ?? 1);
    this.enemies.push({
      kind,
      x: sprite.x,
      y: sprite.y,
      hp: maxHp,
      maxHp,
      radius: spec.radius * (mods.elite ? 1.18 : 1),
      speed: spec.speed * (mods.elite ? 0.94 : 1),
      elite: !!mods.elite,
      scoreBonus: mods.scoreBonus ?? 0,
      slowMs: 0,
      hitMs: 0,
      sprite,
      glow,
      baseSize,
      wobble: Math.random() * TWO_PI,
    });
  }

  updateEnemies(dt, ms) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const e = this.enemies[i];
      e.hitMs = Math.max(0, e.hitMs - ms);
      e.slowMs = Math.max(0, e.slowMs - ms);
      e.wobble += dt * 3;
      const angle = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
      const chapterPressure = (this.run.chapterIndex ?? 0) * 0.1;
      const speed = e.speed * (1 + Math.min(0.46, this.run.timeMs / 520000) + chapterPressure) * (e.slowMs > 0 ? 0.46 : 1);
      e.x += Math.cos(angle + Math.sin(e.wobble) * 0.22) * speed * dt;
      e.y += Math.sin(angle + Math.sin(e.wobble) * 0.22) * speed * dt;
      e.sprite.setPosition(e.x, e.y);
      e.glow.setPosition(e.x, e.y);
      e.sprite.rotation = angle + Math.PI / 2;
      e.sprite.setAlpha(e.hitMs > 0 ? 1 : 0.92);
      e.sprite.setDisplaySize(e.baseSize * (e.hitMs > 0 ? 1.08 : 1), e.baseSize * (e.hitMs > 0 ? 1.08 : 1));

      if (distance(e, this.player) < e.radius + GAME_CONFIG.headRadius) {
        this.damagePlayer(e.kind === "bloomer" ? "swarmed" : "greed");
        continue;
      }
      const bodyHit = this.findBodyHit(e.x, e.y, e.radius);
      if (bodyHit) {
        this.handleBodyContact(i, bodyHit);
      }
    }
  }

  findBodyHit(x, y, radius) {
    const stride = LOW_POWER_RENDER ? 2 : 1;
    for (let s = 2; s < this.run.segments; s += stride) {
      const point = this.getSegmentPoint(s);
      if (point && Phaser.Math.Distance.Between(x, y, point.x, point.y) < radius + GAME_CONFIG.bodyRadius) {
        return { index: s, point };
      }
    }
    return null;
  }

  handleBodyContact(enemyIndex, hit) {
    const enemy = this.enemies[enemyIndex];
    if (!enemy) return;
    enemy.slowMs = Math.max(enemy.slowMs, 520);
    this.damageEnemy(enemyIndex, 0.45 + this.run.skills.shield * 0.12, COLORS.gold, "dot");
    if (this.run.bodyHitCooldownMs > 0) return;
    this.run.bodyHitCooldownMs = GAME_CONFIG.bodyHitCooldownMs;
    const guarded = this.hasCombo("wall") || this.run.skills.shield >= 3;
    if (!guarded) this.run.bodyCracks = Math.min(V13_BALANCE.crackLimit, this.run.bodyCracks + 1);
    this.addBodyCrackFx(hit.point, guarded);
    this.playBodyBlockSound(guarded);
    this.floatText(hit.point.x, hit.point.y - 20, guarded ? "鳞甲反震" : `裂痕 ${this.run.bodyCracks}/${V13_BALANCE.crackLimit}`, guarded ? COLORS.gold : COLORS.rose);
    if (this.run.bodyCracks >= V13_BALANCE.crackLimit && this.run.segments > V13_BALANCE.deathSegments + V13_BALANCE.bodyCrackSegmentLoss) {
      this.run.segments -= V13_BALANCE.bodyCrackSegmentLoss;
      this.run.bodyCracks = 0;
      this.screenShake = Math.max(this.screenShake, 7);
      this.addMemory("身体裂痕崩开，一节记忆脱落。", "body_crack");
      this.playSegmentLossSound();
    }
  }

  damageEnemy(index, amount, color = COLORS.acid, source = "hit") {
    const e = this.enemies[index];
    if (!e) return;
    e.hp -= amount;
    e.hitMs = 120;
    if (source !== "dot") {
      this.addSpark(e.x, e.y, color, 5, 0.7);
      this.playImpact(e.x, e.y, color, 0.62);
    }
    if (e.hp <= 0) this.killEnemy(index, color);
  }

  killEnemy(index, color = COLORS.rose) {
    const e = this.enemies[index];
    if (!e) return;
    const spec = ENEMY_KINDS[e.kind];
    this.enemies.splice(index, 1);
    e.sprite.destroy();
    e.glow.destroy();
    this.run.kills += 1;
    this.awardSkillXp(e.elite ? V13_BALANCE.rewards.eliteSxp : V13_BALANCE.rewards.killSxp, e.elite ? "elite_kill" : "kill");
    this.run.score += spec.score + (e.scoreBonus ?? 0);
    this.playImpact(e.x, e.y, color, e.kind === "bloomer" ? 0.88 : 0.72);
    this.addBurst(e.x, e.y, color, e.kind === "bloomer" ? 94 : 68, 0.25);
    if (Math.random() < (e.elite ? 0.72 : 0.11)) {
      if (e.elite && Math.random() < 0.12) this.trySpawnSkillPickup("elite_kill");
      else this.spawnPickup("food", e.x, e.y);
    }
    if (e.elite) this.addMemory(`精英「${spec.name}」倒下，留下一段发热的记忆。`, "elite");
    if (this.run.kills % 18 === 0) this.addMemory(`它在第${this.run.wave}波杀出一条窄路。`, "kill");
    this.playHitSound();
  }

  spawnBoss(spec = this.nextBossSpec()) {
    if (!spec) return;
    this.run.bossSpawned = true;
    this.run.activeBossId = spec.id;
    const point = {
      x: this.player.x + Math.cos(this.player.angle) * 330,
      y: this.player.y + Math.sin(this.player.angle) * 330,
    };
    const sprite = this.add.sprite(clamp(point.x, 120, GAME_CONFIG.arena - 120), clamp(point.y, 120, GAME_CONFIG.arena - 120), this.textureOr("boss-elite-v11", "enemy-sentinel-v11"));
    const size = spec.final ? 220 : spec.id === "crimson_molt" ? 188 : 168;
    sprite.setDisplaySize(size, size);
    const glow = this.add.image(sprite.x, sprite.y, "snake-glow").setTint(spec.color).setDisplaySize(size * 1.12, size * 1.12).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.28);
    const hpBar = this.add.graphics();
    this.enemyLayer.add([glow, sprite, hpBar]);
    this.boss = {
      id: spec.id,
      name: spec.name,
      spec,
      x: sprite.x,
      y: sprite.y,
      hp: spec.hp,
      maxHp: spec.hp,
      radius: spec.radius,
      speed: spec.speed,
      sprite,
      glow,
      hpBar,
      phase: 1,
      shield: spec.shield,
      shieldMax: spec.shield,
      weakAngle: -Math.PI / 2,
      weakOpenMs: 4200,
      stunMs: 0,
      shotClock: 0,
    };
    this.createBossWeakpoints();
    this.updateBossWeakpoints();
    this.updateBossHpBar();
    this.addMemory(`${spec.name}从${this.chapterForTime().shortName}深处醒来。`, "boss");
    this.floatText(this.player.x, this.player.y - 80, `${spec.name} 醒来`, spec.color);
    this.addRing(this.player.x, this.player.y, 270, spec.projectileColor, 0.36);
    this.addRing(sprite.x, sprite.y, 240, spec.projectileColor, 0.42);
    this.screenShake = Math.max(this.screenShake, 12);
    this.playBossSpawnSound();
  }

  updateBoss(dt, ms) {
    if (!this.boss) return;
    const b = this.boss;
    b.stunMs = Math.max(0, b.stunMs - ms);
    b.weakOpenMs = Math.max(0, b.weakOpenMs - ms);
    if (b.weakOpenMs <= 0) {
      b.weakAngle += Math.PI * 0.72;
      b.weakOpenMs = b.phase === 2 ? 2600 : 3600;
    }
    b.phase = b.hp < b.maxHp * 0.5 ? 2 : 1;
    const a = Phaser.Math.Angle.Between(b.x, b.y, this.player.x, this.player.y);
    const stunScale = b.stunMs > 0 ? 0.36 : 1;
    b.x += Math.cos(a) * b.speed * (b.phase === 2 ? 1.25 : 1) * stunScale * dt;
    b.y += Math.sin(a) * b.speed * (b.phase === 2 ? 1.25 : 1) * stunScale * dt;
    b.sprite.setPosition(b.x, b.y);
    b.glow.setPosition(b.x, b.y);
    const pulse = Math.sin(this.run.timeMs / 180) * (b.phase === 2 ? 7 : 4);
    const baseSize = b.spec.final ? 220 : b.spec.id === "crimson_molt" ? 188 : 168;
    b.sprite.setDisplaySize(baseSize + pulse, baseSize + pulse);
    b.glow.rotation -= dt * 0.5;
    b.glow.setAlpha((b.phase === 2 ? 0.34 : 0.26) + Math.max(0, pulse) * 0.006);

    this.run.nextBossShotMs -= ms;
    if (this.run.nextBossShotMs <= 0) {
      this.run.nextBossShotMs = b.phase === 2 ? 1050 : 1500;
      this.spawnBossProjectiles();
    }

    if (distance(b, this.player) < b.radius + GAME_CONFIG.headRadius) {
      this.damagePlayer("boss");
    }
    this.updateBossHpBar();
  }

  updateBossHpBar() {
    if (!this.boss?.hpBar) return;
    const b = this.boss;
    const pct = clamp(b.hp / b.maxHp, 0, 1);
    const w = 190;
    const h = 11;
    const x = b.x - w / 2;
    const y = b.y - 124;
    b.hpBar.clear();
    b.hpBar.fillStyle(0x05090c, 0.78);
    b.hpBar.fillRoundedRect(x - 4, y - 4, w + 8, h + 8, 7);
    b.hpBar.lineStyle(2, b.spec.color, 0.45);
    b.hpBar.strokeRoundedRect(x - 4, y - 4, w + 8, h + 8, 7);
    b.hpBar.fillStyle(COLORS.rose, 0.22);
    b.hpBar.fillRoundedRect(x, y, w, h, 6);
    b.hpBar.fillStyle(b.shield > 0 ? b.spec.projectileColor : COLORS.gold, 0.92);
    b.hpBar.fillRoundedRect(x, y, Math.max(4, w * pct), h, 6);
    if (b.shield > 0) {
      const gap = w / Math.max(1, b.shieldMax);
      b.hpBar.lineStyle(2, COLORS.white, 0.32);
      for (let i = 1; i < b.shieldMax; i += 1) {
        b.hpBar.beginPath();
        b.hpBar.moveTo(x + gap * i, y - 2);
        b.hpBar.lineTo(x + gap * i, y + h + 2);
        b.hpBar.strokePath();
      }
    }
  }

  createBossWeakpoints() {
    this.bossWeakpoints.forEach((wp) => wp.sprite?.destroy());
    this.bossWeakpoints = [];
    if (!this.boss) return;
    for (let i = 0; i < this.boss.shieldMax; i += 1) {
      const sprite = this.add.circle(this.boss.x, this.boss.y, 10, this.boss.spec.projectileColor, 0.42).setStrokeStyle(2, COLORS.white, 0.45);
      sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.enemyLayer.add(sprite);
      this.bossWeakpoints.push({ index: i, angle: (i / this.boss.shieldMax) * TWO_PI, broken: false, sprite });
    }
  }

  updateBossWeakpoints() {
    if (!this.boss) {
      this.bossWeakpoints.forEach((wp) => wp.sprite?.destroy());
      this.bossWeakpoints = [];
      return;
    }
    const openIndex = this.bossWeakpoints.findIndex((wp) => !wp.broken);
    this.bossWeakpoints.forEach((wp, i) => {
      if (wp.broken) {
        wp.sprite?.setVisible(false);
        return;
      }
      const angle = this.boss.weakAngle + wp.angle;
      const active = i === openIndex;
      const radius = active ? 58 : 46;
      wp.x = this.boss.x + Math.cos(angle) * radius;
      wp.y = this.boss.y + Math.sin(angle) * radius;
      wp.active = active;
      wp.sprite.setVisible(true);
      wp.sprite.setPosition(wp.x, wp.y);
      wp.sprite.setRadius(active ? 12 + Math.sin(this.run.timeMs / 90) * 2 : 8);
      wp.sprite.setAlpha(active ? 0.62 : 0.22);
      wp.sprite.setFillStyle(active ? this.boss.spec.projectileColor : this.boss.spec.color, active ? 0.46 : 0.18);
    });
  }

  spawnBossProjectiles() {
    if (!this.boss) return;
    const pattern = this.boss.spec.pattern;
    const count = pattern === "spiral" ? (this.boss.phase === 2 ? 12 : 9) : pattern === "cross" ? 8 : this.boss.phase === 2 ? 7 : 5;
    const base = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
    for (let i = 0; i < count; i += 1) {
      let angle = base + (i - (count - 1) / 2) * 0.18;
      if (pattern === "cross") angle = (i / count) * TWO_PI + (this.boss.phase === 2 ? this.run.timeMs / 900 : 0);
      if (pattern === "spiral") angle = (i / count) * TWO_PI + this.run.timeMs / (this.boss.phase === 2 ? 620 : 840);
      const sprite = this.add.image(this.boss.x, this.boss.y, "enemy-projectile").setDisplaySize(24, 24);
      sprite.setTint(this.boss.spec.projectileColor);
      this.projectileLayer.add(sprite);
      this.projectiles.push({ x: this.boss.x, y: this.boss.y, angle, speed: pattern === "spiral" ? 150 : 185, radius: 9, lifeMs: pattern === "spiral" ? 4300 : 3600, sprite });
    }
    this.playSfx("boss-shot", 450, () => {
      this.tone(this.boss.phase === 2 ? 164 : 124, 0.09, "sawtooth", 0.018);
      this.noiseBurst(0.06, 0.014, 0, "bandpass", 360);
    });
  }

  updateProjectiles(dt, ms) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const p = this.projectiles[i];
      p.lifeMs -= ms;
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      p.sprite.setPosition(p.x, p.y);
      if (distance(p, this.player) < p.radius + GAME_CONFIG.headRadius) {
        this.destroyProjectile(i);
        this.damagePlayer("boss");
        continue;
      }
      let absorbed = false;
      for (let s = 2; s < this.run.segments; s += 2) {
        const point = this.getSegmentPoint(s);
        if (point && Phaser.Math.Distance.Between(p.x, p.y, point.x, point.y) < p.radius + GAME_CONFIG.bodyRadius) {
          absorbed = true;
          this.onBodyBlockProjectile(point);
          break;
        }
      }
      if (absorbed || p.lifeMs <= 0) this.destroyProjectile(i);
    }
  }

  destroyProjectile(index) {
    const p = this.projectiles[index];
    this.projectiles.splice(index, 1);
    p.sprite.destroy();
  }

  updateSkills(dt, ms) {
    this.updateFire(ms);
    this.updateFrost(dt, ms);
    this.updateTurret(ms);
    this.updateSpear(ms);
    this.updateSpeedFx(ms);
    this.updateShield(ms);
    this.updateLightning(ms);
    this.checkCombos();
  }

  updateFire(ms) {
    const level = this.run.skills.fire;
    if (!level) return;
    this.run.nextFireMs -= ms;
    if (this.run.nextFireMs > 0) return;
    this.run.nextFireMs = Math.max(level >= 5 ? 360 : 460, 1220 - level * 92);
    const length = (168 + level * 24) * this.lengthScale(1, 1.12);
    const width = 44 + level * 9 + (level >= 4 ? 14 : 0);
    this.addMouthFlame(length, width, level);
    this.damageCone(this.player.x, this.player.y, this.player.angle, length, width, (1.5 + level * 0.48) * this.lengthScale(1, 1.18), COLORS.ember);
    for (let s = 1; s < Math.min(this.run.segments, 10); s += Math.max(2, 5 - level)) {
      const p = this.getSegmentPoint(s);
      this.addSegmentEmbers(p, 38 + level * 8, 2 + level);
    }
  }

  updateFrost(dt, ms) {
    const level = this.run.skills.frost;
    if (!level) return;
    if (!this.nextFrostFieldMs) this.nextFrostFieldMs = 0;
    this.nextFrostFieldMs -= ms;
    if (this.nextFrostFieldMs <= 0) {
      this.nextFrostFieldMs = Math.max(level >= 5 ? 120 : 150, 360 - level * 34);
      const tail = this.getSegmentPoint(Math.min(this.run.segments - 1, 4 + level * 2)) ?? this.player;
      const length = 86 + level * 14 + (level >= 3 ? 22 : 0);
      const width = 24 + level * 4 + (level >= 5 ? 10 : 0);
      const key = this.frameKey("v10-frost-trail", 8) ?? "energy-bloom";
      const sprite = this.add.image(tail.x, tail.y, key);
      sprite.setDisplaySize(length, width);
      sprite.setRotation(tail.angle ?? this.player.angle);
      sprite.setBlendMode(Phaser.BlendModes.ADD);
      sprite.setAlpha(0.62);
      this.fxLayer.add(sprite);
      this.frostFields.push({ x: tail.x, y: tail.y, radius: (34 + level * 5 + (level >= 5 ? 10 : 0)) * this.lengthScale(1, 1.16), lifeMs: 1250 + level * 140 + (level >= 3 ? 280 : 0), sprite });
    }
    for (let i = this.frostFields.length - 1; i >= 0; i -= 1) {
      const f = this.frostFields[i];
      f.lifeMs -= ms;
      f.sprite.setAlpha(clamp(f.lifeMs / 1500, 0, 1) * 0.55);
      f.sprite.scaleX = 1 + Math.sin(f.lifeMs * 0.018) * 0.035;
      for (let e = this.enemies.length - 1; e >= 0; e -= 1) {
        const enemy = this.enemies[e];
        if (Phaser.Math.Distance.Between(f.x, f.y, enemy.x, enemy.y) < f.radius + enemy.radius) {
          enemy.slowMs = Math.max(enemy.slowMs, 420);
          this.damageEnemy(e, (0.55 + level * 0.14) * dt * this.lengthScale(1, 1.16), COLORS.frost, "dot");
        }
      }
      if (this.boss && Phaser.Math.Distance.Between(f.x, f.y, this.boss.x, this.boss.y) < f.radius + this.boss.radius) {
        this.damageBoss((0.9 + level * 0.18) * dt * this.lengthScale(1, 1.16) * (this.hasCombo("steam") ? 1.32 : 1), COLORS.frost, f.x, f.y, "frost");
      }
      if (f.lifeMs <= 0) {
        f.sprite.destroy();
        this.frostFields.splice(i, 1);
      }
    }
  }

  updateTurret(ms) {
    const level = this.run.skills.turret;
    if (!level) return;
    this.run.nextTurretMs -= ms;
    if (this.run.nextTurretMs > 0) return;
    this.run.nextTurretMs = Math.max(310, 840 - level * 75);
    const count = Math.min((level >= 3 ? 2 : 1) + level, Math.ceil(this.run.segments / 4));
    for (let i = 0; i < count; i += 1) {
      const index = 1 + i * Math.max(2, Math.floor(this.run.segments / Math.max(1, count)));
      const mount = this.segmentAnchor(index, i % 2 === 0 ? 1 : -1, 20);
      const target = this.nearestEnemy(mount.x, mount.y);
      if (!target) continue;
      const angle = Phaser.Math.Angle.Between(mount.x, mount.y, target.x, target.y);
      this.addMuzzleFlash(mount.x, mount.y, angle, COLORS.playerShot);
      const sprite = this.add.image(mount.x, mount.y, this.frameKey("v10-fang", 4) ?? "player-projectile").setDisplaySize(38, 24);
      sprite.setRotation(angle);
      this.projectileLayer.add(sprite);
      this.shots.push({ x: mount.x, y: mount.y, angle, speed: level >= 5 ? 455 : 405, radius: 10, lifeMs: level >= 5 ? 1160 : 980, damage: (1.25 + level * 0.38) * this.lengthScale(1, 1.18), bounces: this.run.comboHighlights.includes("rail") ? 2 : level >= 5 ? 1 : 0, trailPrefix: "v10-fang-trail", impactPrefix: "v10-fang-impact", nextTrailMs: 0, sprite });
    }
  }

  updateSpear(ms) {
    const level = this.run.skills.spear;
    if (!level) return;
    this.run.nextSpearMs -= ms;
    if (this.run.nextSpearMs > 0) return;
    this.run.nextSpearMs = Math.max(1320, 2850 - level * 245);
    const target = this.nearestEnemy(this.player.x, this.player.y);
    const angle = target ? Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y) : this.player.angle;
    const x = this.player.x + Math.cos(angle) * 44;
    const y = this.player.y + Math.sin(angle) * 44;
    this.addBitmapFx("v10-spear-charge", 4, x, y, { width: 76 + level * 8, height: 42 + level * 4, angle, alpha: 0.72, duration: 240, originX: 0.15 });
    const sprite = this.add.image(x, y, this.frameKey("v10-spear", 4) ?? "player-projectile").setDisplaySize(96 + level * 9, 34 + level * 3);
    sprite.setRotation(angle);
    sprite.setBlendMode(Phaser.BlendModes.ADD);
    this.projectileLayer.add(sprite);
    this.shots.push({ x, y, angle, speed: 540 + level * 16, radius: 15, lifeMs: 960 + level * 55, damage: (3.4 + level * 0.72) * this.lengthScale(1, 1.12), bounces: 0, pierces: 2 + level, hitEnemies: new Set(), impactPrefix: "v10-spear-impact", sprite });
  }

  updateSpeedFx(ms) {
    const level = this.run.skills.speed;
    if (!level) return;
    this.run.nextSpeedFxMs -= ms;
    if (this.run.nextSpeedFxMs > 0) return;
    this.run.nextSpeedFxMs = Math.max(70, 150 - level * 12);
    const p = this.getSegmentPoint(Math.min(this.run.segments - 1, 2 + Math.floor(Math.random() * Math.min(8, this.run.segments))));
    if (!p) return;
    const key = Math.random() > 0.42 ? "v10-speed-streak" : "v10-speed-curve";
    this.addBitmapFx(key, 4, p.x - Math.cos(p.angle ?? this.player.angle) * 14, p.y - Math.sin(p.angle ?? this.player.angle) * 14, {
      width: 68 + level * 9,
      height: 22 + level * 2,
      angle: p.angle ?? this.player.angle,
      alpha: 0.24 + level * 0.035,
      duration: 260,
      originX: 0.8,
    });
  }

  updateShots(dt, ms) {
    for (let i = this.shots.length - 1; i >= 0; i -= 1) {
      const s = this.shots[i];
      s.lifeMs -= ms;
      s.x += Math.cos(s.angle) * s.speed * dt;
      s.y += Math.sin(s.angle) * s.speed * dt;
      s.sprite.setPosition(s.x, s.y);
      s.sprite.setRotation(s.angle);
      if (s.trailPrefix) {
        s.nextTrailMs = (s.nextTrailMs ?? 0) - ms;
        if (s.nextTrailMs <= 0) {
          s.nextTrailMs = 68;
          this.addBitmapFx(s.trailPrefix, 4, s.x - Math.cos(s.angle) * 16, s.y - Math.sin(s.angle) * 16, { width: 48, height: 20, angle: s.angle, alpha: 0.42, duration: 190, originX: 0.7 });
        }
      }
      const hitIndex = this.enemies.findIndex((e) => !s.hitEnemies?.has(e) && Phaser.Math.Distance.Between(s.x, s.y, e.x, e.y) < s.radius + e.radius);
      if (hitIndex >= 0) {
        const hit = this.enemies[hitIndex];
        this.damageEnemy(hitIndex, s.damage, COLORS.playerShot);
        if (s.impactPrefix) this.addBitmapFx(s.impactPrefix, 4, hit.x, hit.y, { width: 54, height: 54, angle: s.angle, alpha: 0.72, duration: 260 });
        if (this.hasCombo("rail")) {
          const target = this.nearestEnemy(hit.x, hit.y, hit);
          if (target) {
          this.addBolt(hit.x, hit.y, target.x, target.y, COLORS.playerShot, 1.5, 0.32);
            const idx = this.enemies.indexOf(target);
            if (idx >= 0) this.damageEnemy(idx, s.damage * 0.46, COLORS.playerShot);
          } else if (this.boss) {
            this.addBolt(hit.x, hit.y, this.boss.x, this.boss.y, COLORS.playerShot, 1.5, 0.3);
            this.damageBoss(s.damage * 0.36, COLORS.playerShot, this.boss.x, this.boss.y, "rail");
          }
        }
        if (s.pierces > 0) {
          s.hitEnemies?.add(hit);
          s.pierces -= 1;
          continue;
        }
        s.bounces -= 1;
        if (s.bounces > 0) {
          const target = this.nearestEnemy(hit.x, hit.y, hit);
          if (target) {
            s.x = hit.x;
            s.y = hit.y;
            s.angle = Phaser.Math.Angle.Between(s.x, s.y, target.x, target.y);
            continue;
          }
        }
        this.destroyShot(i);
        continue;
      }
      if (this.boss && Phaser.Math.Distance.Between(s.x, s.y, this.boss.x, this.boss.y) < s.radius + this.boss.radius) {
        this.damageBoss(s.damage, COLORS.playerShot, s.x, s.y, "shot");
        if (s.impactPrefix) this.addBitmapFx(s.impactPrefix, 4, s.x, s.y, { width: 72, height: 72, angle: s.angle, alpha: 0.76, duration: 280 });
        this.destroyShot(i);
        continue;
      }
      if (s.lifeMs <= 0) this.destroyShot(i);
    }
  }

  destroyShot(index) {
    const s = this.shots[index];
    this.shots.splice(index, 1);
    s.sprite.destroy();
  }

  updateShield(ms) {
    const level = this.run.skills.shield;
    if (!level) return;
    const count = Math.min(level >= 3 ? 7 : 5, 1 + level + (level >= 3 ? 2 : 0));
    for (let i = 0; i < count; i += 1) {
      const anchor = this.segmentAnchor(i, i % 2 === 0 ? 1 : -1, 28 - i * 2);
      const x = anchor.x;
      const y = anchor.y;
      this.addSpark(x, y, COLORS.violet, 1, 0.12);
      this.damageAround(x, y, 28, 0.24 + level * 0.06, COLORS.violet, false);
    }
  }

  updateLightning(ms) {
    const level = this.run.skills.lightning;
    if (!level) return;
    this.run.nextLightningMs -= ms;
    if (this.run.nextLightningMs > 0) return;
    this.run.nextLightningMs = Math.max(520, 1200 - level * 90);
    const originIndex = Math.min(this.run.segments - 1, 2 + Math.floor(Math.random() * Math.max(1, this.run.segments - 2)));
    let origin = this.getSegmentPoint(originIndex);
    const previous = this.getSegmentPoint(Math.max(0, originIndex - 2));
    if (previous && origin) this.addBolt(previous.x, previous.y, origin.x, origin.y, COLORS.playerShot, 1.4, 0.32);
    const hit = new Set();
    const jumps = 1 + level + (this.run.comboHighlights.includes("rail") ? 2 : 0) + (level >= 5 ? 1 : 0);
    for (let j = 0; j < jumps; j += 1) {
      const target = this.nearestEnemy(origin.x, origin.y, null, hit);
      if (!target) {
        if (this.boss && Phaser.Math.Distance.Between(origin.x, origin.y, this.boss.x, this.boss.y) < 420) {
          this.addBolt(origin.x, origin.y, this.boss.x, this.boss.y, COLORS.playerShot, 2.4, 0.46);
          this.damageBoss((1.4 + level * 0.42) * this.lengthScale(1, 1.18), COLORS.playerShot, this.boss.x, this.boss.y, "lightning");
        }
        break;
      }
      hit.add(target);
      this.addBolt(origin.x, origin.y, target.x, target.y, COLORS.playerShot, 2.2, 0.48);
      const idx = this.enemies.indexOf(target);
      this.damageEnemy(idx, (1.2 + level * 0.38) * this.lengthScale(1, 1.18), COLORS.playerShot);
      origin = target;
    }
  }

  renderSkillAuras() {
    if (!this.skillLayer || !this.player || this.mode !== "playing") return;
    this.skillLayer.removeAll(true);
    const t = this.run.timeMs / 1000;
    const points = [];
    for (let s = 0; s < Math.min(this.run.segments, LOW_POWER_RENDER ? 14 : 18); s += 1) {
      const p = this.getSegmentPoint(s);
      if (p) points.push(p);
    }

    const fireLevel = this.run.skills.fire;
    if (fireLevel > 0) {
      const ribbon = this.add.graphics();
      ribbon.setBlendMode(Phaser.BlendModes.ADD);
      if (points.length > 1) {
        ribbon.lineStyle(12 + fireLevel * 1.5, COLORS.ember, 0.07);
        ribbon.beginPath();
        ribbon.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) ribbon.lineTo(points[i].x, points[i].y);
        ribbon.strokePath();
        ribbon.lineStyle(3, COLORS.gold, 0.18 + Math.sin(t * 7) * 0.028);
        ribbon.beginPath();
        ribbon.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) ribbon.lineTo(points[i].x, points[i].y);
        ribbon.strokePath();
      }
      this.skillLayer.add(ribbon);
      const mouth = this.add.image(this.player.x + Math.cos(this.player.angle) * 34, this.player.y + Math.sin(this.player.angle) * 34, this.frameKey("v10-flame-tongue", 8) ?? "spark");
      mouth.setOrigin(0.05, 0.5);
      mouth.setDisplaySize(86 + fireLevel * 14, 28 + fireLevel * 4);
      mouth.setRotation(this.player.angle);
      mouth.setBlendMode(Phaser.BlendModes.ADD);
      mouth.setAlpha(0.2 + fireLevel * 0.035 + Math.sin(t * 10) * 0.025);
      this.skillLayer.add(mouth);
    }

    const frostLevel = this.run.skills.frost;
    if (frostLevel > 0) {
      const frost = this.add.graphics();
      frost.setBlendMode(Phaser.BlendModes.ADD);
      if (points.length > 2) {
        frost.lineStyle(8 + frostLevel * 1.5, COLORS.frost, 0.05);
        frost.beginPath();
        frost.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) frost.lineTo(points[i].x, points[i].y);
        frost.strokePath();
      }
      this.skillLayer.add(frost);
      for (let s = 3; s < Math.min(this.run.segments, LOW_POWER_RENDER ? 13 : 17); s += LOW_POWER_RENDER ? 4 : 3) {
        const side = s % 2 === 0 ? 1 : -1;
        const ice = this.segmentAnchor(s, side, 18);
        const shard = this.add.triangle(ice.x, ice.y, 0, -7, 5, 6, -5, 6, COLORS.frost, 0.28);
        shard.setRotation(ice.angle + side * 1.2 + Math.sin(t * 6 + s) * 0.14);
        shard.setBlendMode(Phaser.BlendModes.ADD);
        this.skillLayer.add(shard);
      }
    }

    const turretLevel = this.run.skills.turret;
    if (turretLevel > 0) {
      const count = Math.min(LOW_POWER_RENDER ? 4 : 3 + turretLevel, Math.ceil(this.run.segments / 4));
      for (let i = 0; i < count; i += 1) {
        const index = 1 + i * Math.max(2, Math.floor(this.run.segments / Math.max(1, count)));
        const mount = this.segmentAnchor(index, i % 2 === 0 ? 1 : -1, 20);
        const target = this.nearestEnemy(mount.x, mount.y);
        const aim = target ? Phaser.Math.Angle.Between(mount.x, mount.y, target.x, target.y) : mount.angle;
        const fang = this.add.image(mount.x + Math.cos(aim) * 8, mount.y + Math.sin(aim) * 8, this.frameKey("v10-fang", 4) ?? "player-projectile");
        fang.setDisplaySize(28 + turretLevel * 2, 18 + turretLevel);
        fang.setRotation(aim);
        fang.setBlendMode(Phaser.BlendModes.ADD);
        fang.setAlpha(0.46);
        this.skillLayer.add(fang);
      }
    }

    const shieldLevel = this.run.skills.shield;
    if (shieldLevel > 0) {
      const count = Math.min(LOW_POWER_RENDER ? 4 : 6, 2 + shieldLevel);
      for (let i = 0; i < count; i += 1) {
        const index = Math.min(i, this.run.segments - 1);
        const side = i % 2 === 0 ? 1 : -1;
        const plate = this.segmentAnchor(index, side, 28 - Math.min(i, 4) * 2);
        const piece = this.add.graphics();
        piece.setPosition(plate.x, plate.y);
        piece.setRotation(plate.angle + side * 0.28);
        piece.setBlendMode(Phaser.BlendModes.ADD);
        piece.lineStyle(2.5, COLORS.violet, this.run.invulnMs > 0 ? 0.36 : 0.19);
        piece.beginPath();
        piece.arc(0, 0, 18 - i * 0.9 + shieldLevel * 2, side > 0 ? -0.95 : Math.PI - 0.95, side > 0 ? 0.95 : Math.PI + 0.95, false);
        piece.strokePath();
        piece.lineStyle(1, COLORS.white, this.run.invulnMs > 0 ? 0.24 : 0.1);
        piece.beginPath();
        piece.arc(0, 0, 12 - i * 0.5 + shieldLevel, side > 0 ? -0.75 : Math.PI - 0.75, side > 0 ? 0.75 : Math.PI + 0.75, false);
        piece.strokePath();
        this.skillLayer.add(piece);
      }
    }

    const lightningLevel = this.run.skills.lightning;
    if (lightningLevel > 0) {
      const charge = this.add.graphics();
      charge.setBlendMode(Phaser.BlendModes.ADD);
      let prev = null;
      for (let s = 1; s < Math.min(this.run.segments, LOW_POWER_RENDER ? 11 : 14); s += LOW_POWER_RENDER ? 4 : 3) {
        const p = this.getSegmentPoint(s);
        if (!p) continue;
        charge.fillStyle(COLORS.playerShot, 0.2 + Math.sin(t * 12 + s) * 0.06);
        charge.fillCircle(p.x, p.y, 5 + lightningLevel);
        if (prev && Math.sin(t * 13 + s) > 0.3) {
          charge.lineStyle(2, COLORS.playerShot, 0.28);
          charge.beginPath();
          charge.moveTo(prev.x, prev.y);
          charge.lineTo((prev.x + p.x) / 2 + Math.sin(t * 17 + s) * 8, (prev.y + p.y) / 2 + Math.cos(t * 15 + s) * 8);
          charge.lineTo(p.x, p.y);
          charge.strokePath();
        }
        prev = p;
      }
      this.skillLayer.add(charge);
    }
  }

  nearestEnemy(x, y, exclude = null, excluded = new Set()) {
    let best = null;
    let bestDist = Infinity;
    this.enemies.forEach((e) => {
      if (e === exclude || excluded.has(e)) return;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bestDist && d < 520) {
        best = e;
        bestDist = d;
      }
    });
    if (!best && this.boss) best = this.boss;
    return best;
  }

  damageAround(x, y, radius, amount, color, burst = true) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const e = this.enemies[i];
      if (Phaser.Math.Distance.Between(x, y, e.x, e.y) < radius + e.radius) {
        this.damageEnemy(i, amount, color, burst ? "hit" : "dot");
      }
    }
    if (this.boss && Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y) < radius + this.boss.radius) {
      this.damageBoss(amount, color, x, y, "area");
    }
  }

  damageBoss(amount, color = COLORS.acid, hitX = null, hitY = null, source = "hit") {
    if (!this.boss) return;
    const weak = this.hitBossWeakpoint(hitX ?? this.boss.x, hitY ?? this.boss.y);
    let applied = amount;
    if (this.boss.shield > 0 && !weak) applied *= 0.24;
    if (weak) applied *= source === "lightning" || source === "shot" ? 2.1 : 1.55;
    this.boss.hp -= applied;
    this.addSpark(weak?.x ?? this.boss.x, weak?.y ?? this.boss.y, weak ? COLORS.dangerCore : color, weak ? 7 : 2, weak ? 0.76 : 0.3);
    this.playImpact(weak?.x ?? this.boss.x, weak?.y ?? this.boss.y, weak ? COLORS.dangerCore : color, weak ? 1.05 : 0.84);
    if (weak) this.playWeakHitSound();
    if (this.boss.hp <= 0) this.defeatBoss();
  }

  defeatBoss() {
    if (!this.boss) return;
    const boss = this.boss;
    const { x, y, spec } = boss;
    boss.sprite.destroy();
    boss.glow.destroy();
    boss.hpBar?.destroy();
    this.bossWeakpoints.forEach((wp) => wp.sprite?.destroy());
    this.bossWeakpoints = [];
    this.projectiles.forEach((p) => p.sprite?.destroy());
    this.projectiles = [];
    this.boss = null;
    this.run.bossSpawned = false;
    this.run.activeBossId = null;
    this.run.clearedBosses.push(spec.id);
    this.run.score += spec.final ? 1600 : 760;
    this.run.segments = Math.min(V13_BALANCE.maxSegments, this.run.segments + 2);
    this.run.coreHp = this.run.segments;
    this.run.bodyCracks = 0;
    this.awardSkillXp(V13_BALANCE.rewards.bossPhaseSxp, "boss");
    this.addMemory(spec.rewardText, spec.final ? "victory" : "boss");
    this.addBurst(x, y, spec.final ? COLORS.gold : spec.color, spec.final ? 320 : 240, 0.44);
    this.addRing(x, y, spec.final ? 360 : 280, spec.color, 0.44);
    this.screenShake = Math.max(this.screenShake, spec.final ? 18 : 12);
    for (let i = 0; i < (spec.final ? 8 : 5); i += 1) this.spawnPickup("food", x + Phaser.Math.Between(-140, 140), y + Phaser.Math.Between(-140, 140));
    if (spec.final) {
      this.run.bossDefeated = true;
      if (this.run.levelId === "level3") {
        localStorage.setItem("serpentLifeTutorialDone", "1");
      }
      this.endRun("victory");
      return;
    }
    if (this.run.v13) {
      this.advanceV13Level();
      return;
    }
    this.run.nextEliteMs = 26000;
    this.run.nextEventMs = 12000;
    this.floatText(x, y - 92, `${spec.name} 已击败`, COLORS.gold);
    this.bossRewardTimer?.remove(false);
    this.bossRewardTimer = this.time.delayedCall(500, () => {
      if (this.mode === "playing") this.queueUpgrade("boss");
      this.bossRewardTimer = null;
    });
  }

  advanceV13Level() {
    const currentIndex = this.run.levelIndex ?? 1;
    if (this.run.levelId === "tutorial") localStorage.setItem("serpentLifeTutorialDone", "1");
    const next = V13_LEVELS[Math.min(V13_LEVELS.length - 1, currentIndex + 1)];
    if (!next || next.id === this.run.levelId) return;
    this.run.levelId = next.id;
    this.run.levelIndex = this.v13LevelIndex(next.id);
    this.run.levelElapsedMs = 0;
    this.run.firstSkillCoreGiven = false;
    this.run.bossSpawned = false;
    this.run.activeBossId = null;
    this.run.nextEnemyMs = next.enemyGraceMs;
    this.run.nextEliteMs = 42000;
    this.run.nextEventMs = 14000;
    this.run.invulnMs = Math.max(this.run.invulnMs, 2600);
    this.addMemory(`进入「${next.name}」：敌群会更密，身体和技能都要更谨慎。`, "chapter");
    this.floatText(this.player.x, this.player.y - 112, next.name, COLORS.gold);
    this.applyArenaTexture(this.chapterForTime());
    for (let i = 0; i < 8; i += 1) this.spawnPickup("food", this.player.x + Phaser.Math.Between(-220, 220), this.player.y + Phaser.Math.Between(-180, 180));
  }

  hitBossWeakpoint(x, y) {
    if (!this.boss || this.boss.shield <= 0) return null;
    const weak = this.bossWeakpoints.find((wp) => wp.active && !wp.broken && Phaser.Math.Distance.Between(x, y, wp.x, wp.y) < 54);
    if (!weak) return null;
    weak.broken = true;
    weak.sprite?.setVisible(false);
    this.boss.shield = Math.max(0, this.boss.shield - 1);
    this.boss.stunMs = Math.max(this.boss.stunMs, 720);
    this.screenShake = Math.max(this.screenShake, 10);
    this.addRing(weak.x, weak.y, 92, COLORS.dangerCore, 0.42);
    this.floatText(weak.x, weak.y - 28, this.boss.shield > 0 ? `弱点破裂 ${this.boss.shieldMax - this.boss.shield}/${this.boss.shieldMax}` : "Boss 破盾", COLORS.dangerCore);
    if (this.boss.shield === 0) {
      this.addMemory("Boss 护盾碎裂，核心暴露。", "boss");
      this.playComboSound("boss_break");
    }
    return weak;
  }

  damagePlayer(cause = "swarmed") {
    if (this.mode !== "playing" || this.run.invulnMs > 0) return;
    this.run.invulnMs = V13_BALANCE.headInvulnMs;
    this.player.hurtMs = 250;
    this.screenShake = Math.max(this.screenShake, 13);
    this.playHurtSound();
    const level = this.currentV13Level();
    const protectedFromDeath = (this.run.levelElapsedMs ?? this.run.timeMs) < level.protectionMs;
    const rawLoss = cause === "boss" ? V13_BALANCE.headHitSegments.boss : cause === "elite" ? V13_BALANCE.headHitSegments.elite : V13_BALANCE.headHitSegments.enemy;
    const loss = protectedFromDeath ? Math.min(1, rawLoss) : rawLoss;
    this.run.segments = Math.max(0, this.run.segments - loss);
    this.run.coreHp = this.run.segments;
    this.addMemory(`蛇首被击中，身体脱落 ${loss} 节。`, "hurt");
    this.addBurst(this.player.x, this.player.y, COLORS.red, 120, 0.34);
    this.floatText(this.player.x, this.player.y - 42, `-${loss} 身体`, COLORS.rose);
    if (this.run.segments <= V13_BALANCE.deathSegments && !this.run.emergencyMoltUsed) {
      this.run.emergencyMoltUsed = true;
      this.run.segments = V13_BALANCE.emergencyMoltSegments;
      this.run.invulnMs = 2200;
      this.run.bodyCracks = 0;
      this.addMemory("濒死蜕皮触发，最后几节身体把蛇首拖回了战场。", "molt");
      this.floatText(this.player.x, this.player.y - 76, "濒死蜕皮", COLORS.gold);
      return;
    }
    if (this.run.segments <= V13_BALANCE.deathSegments) {
      this.run.deathCause = cause;
      this.endRun(cause);
    }
  }

  drawSnake() {
    if (LOW_POWER_RENDER) {
      this.drawSnakeFast();
      return;
    }
    this.snakeLayer.removeAll(true);
    const hurt = this.player.hurtMs > 0;
    const spine = this.add.graphics();
    const points = [];
    for (let i = 0; i < this.run.segments; i += 1) {
      const p = this.getSegmentPoint(i);
      if (p) points.push(p);
    }
    if (points.length > 1) {
      spine.lineStyle(12, hurt ? COLORS.rose : COLORS.jade, hurt ? 0.12 : 0.055);
      spine.beginPath();
      spine.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) spine.lineTo(points[i].x, points[i].y);
      spine.strokePath();
      spine.lineStyle(4, COLORS.gold, hurt ? 0.12 : 0.04);
      spine.beginPath();
      spine.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) spine.lineTo(points[i].x, points[i].y);
      spine.strokePath();
      spine.lineStyle(2, COLORS.playerShot, hurt ? 0.1 : 0.035);
      spine.beginPath();
      spine.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) spine.lineTo(points[i].x, points[i].y);
      spine.strokePath();
      this.snakeLayer.add(spine);
    }
    for (let i = this.run.segments - 1; i >= 0; i -= 1) {
      const p = this.getSegmentPoint(i);
      const taper = 1 - i / (this.run.segments + 2);
      const isTail = i === this.run.segments - 1;
      const size = i === 0 ? 19 : isTail ? 14 + taper * 4 : 13 + taper * 6;
      const alpha = i === 0 ? 1 : clamp(0.82 - i * 0.018, 0.46, 0.82);
      const isMemory = i > 0 && i % 4 === 0 && !isTail;
      const shouldGlow = !LOW_POWER_RENDER || i === 0 || isTail || isMemory || i % 3 === 0;
      const glow = shouldGlow ? this.add.image(p.x, p.y, "snake-glow").setTint(hurt ? COLORS.rose : isMemory ? COLORS.reward : COLORS.jade) : null;
      if (glow) glow.setDisplaySize(size * (i === 0 ? 3.9 : 2.65), size * (i === 0 ? 3.9 : 2.65)).setBlendMode(Phaser.BlendModes.ADD).setAlpha(i === 0 ? 0.5 : isMemory ? 0.24 : 0.14);
      if (i === 0) {
        const body = this.add.image(p.x, p.y, this.textureOr("snake-head-v11", "snake-glow"));
        const headAngle = p.angle ?? this.player.angle;
        body.setRotation(headAngle + Math.PI / 2);
        body.setDisplaySize(72, 72);
        body.setAlpha(alpha);
        body.setTint(hurt ? 0xffd7e3 : 0xffffff);
        this.snakeLayer.add(glow ? [glow, body] : [body]);
      } else {
        const texture = isTail ? this.textureOr("snake-tail-v11", "snake-body-v11") : isMemory ? this.textureOr("snake-memory-v11", "snake-body-v11") : this.textureOr("snake-body-v11", "snake-glow");
        const displayX = isTail ? 42 + taper * 14 : isMemory ? 40 + taper * 9 : 34 + taper * 8;
        const displayY = isTail ? 32 + taper * 10 : isMemory ? 40 + taper * 9 : 34 + taper * 8;
        const body = this.add.image(p.x, p.y, texture);
        body.setDisplaySize(displayX, displayY);
        body.setRotation((p.angle ?? this.player.angle) + (isTail ? 0 : Math.PI / 2));
        body.setAlpha(alpha);
        body.setTint(hurt ? 0xffd7e3 : 0xffffff);
        const detail = !LOW_POWER_RENDER || isMemory ? this.add.graphics() : null;
        if (detail) {
          detail.setPosition(p.x, p.y);
          detail.setRotation(p.angle ?? this.player.angle);
          detail.setBlendMode(Phaser.BlendModes.ADD);
          detail.lineStyle(isMemory ? 3 : 2, isMemory ? COLORS.gold : COLORS.jade, isMemory ? 0.34 : 0.14);
          detail.beginPath();
          detail.moveTo(-displayX * 0.28, 0);
          detail.lineTo(displayX * 0.28, 0);
          detail.strokePath();
          if (isMemory) {
            detail.lineStyle(2, COLORS.reward, 0.42);
            detail.strokeCircle(0, 0, Math.min(displayX, displayY) * 0.36);
            detail.fillStyle(COLORS.reward, 0.24);
            detail.fillCircle(0, 0, 5);
          }
        }
        this.snakeLayer.add([glow, body, detail].filter(Boolean));
      }
    }
    this.snakeLayer.setDepth(30);
  }

  ensureFastSnakeRender() {
    if (this.fastSnakeRender?.nodes?.length >= GAME_CONFIG.maxSegments) return this.fastSnakeRender;
    this.snakeLayer.removeAll(true);
    const spine = this.add.graphics();
    this.snakeLayer.add(spine);
    const nodes = [];
    for (let i = GAME_CONFIG.maxSegments - 1; i >= 0; i -= 1) {
      const glow = this.add.image(0, 0, "snake-glow").setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
      const body = this.add.image(0, 0, this.textureOr("snake-body-v11", "snake-glow")).setVisible(false);
      this.snakeLayer.add([glow, body]);
      nodes[i] = { glow, body, lastTexture: null };
    }
    this.fastSnakeRender = { spine, nodes };
    this.snakeLayer.setDepth(30);
    return this.fastSnakeRender;
  }

  drawSnakeFast() {
    if (!this.snakeLayer || !this.player || !this.run) return;
    const hurt = this.player.hurtMs > 0;
    const render = this.ensureFastSnakeRender();
    const points = [];
    for (let i = 0; i < this.run.segments; i += 1) {
      const p = this.getSegmentPoint(i);
      if (p) points[i] = p;
    }
    render.spine.clear();
    if (points.length > 1 && points[0]) {
      render.spine.lineStyle(10, hurt ? COLORS.rose : COLORS.jade, hurt ? 0.1 : 0.045);
      render.spine.beginPath();
      render.spine.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        if (points[i]) render.spine.lineTo(points[i].x, points[i].y);
      }
      render.spine.strokePath();
      render.spine.lineStyle(3, COLORS.gold, hurt ? 0.1 : 0.035);
      render.spine.beginPath();
      render.spine.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        if (points[i]) render.spine.lineTo(points[i].x, points[i].y);
      }
      render.spine.strokePath();
    }
    for (let i = 0; i < render.nodes.length; i += 1) {
      const node = render.nodes[i];
      const p = points[i];
      const active = i < this.run.segments && !!p;
      node.body.setVisible(active);
      node.glow.setVisible(false);
      if (!active) continue;
      const taper = 1 - i / (this.run.segments + 2);
      const isTail = i === this.run.segments - 1;
      const isMemory = i > 0 && i % 4 === 0 && !isTail;
      const texture = i === 0
        ? this.textureOr("snake-head-v11", "snake-glow")
        : isTail
          ? this.textureOr("snake-tail-v11", "snake-body-v11")
          : isMemory
            ? this.textureOr("snake-memory-v11", "snake-body-v11")
            : this.textureOr("snake-body-v11", "snake-glow");
      if (node.lastTexture !== texture) {
        node.body.setTexture(texture);
        node.lastTexture = texture;
      }
      const displayX = i === 0 ? 72 : isTail ? 42 + taper * 14 : isMemory ? 40 + taper * 9 : 34 + taper * 8;
      const displayY = i === 0 ? 72 : isTail ? 32 + taper * 10 : isMemory ? 40 + taper * 9 : 34 + taper * 8;
      const alpha = i === 0 ? 1 : clamp(0.82 - i * 0.018, 0.46, 0.82);
      node.body
        .setPosition(p.x, p.y)
        .setDisplaySize(displayX, displayY)
        .setRotation((p.angle ?? this.player.angle) + (i === 0 || !isTail ? Math.PI / 2 : 0))
        .setAlpha(alpha)
        .setTint(hurt ? 0xffd7e3 : 0xffffff);
      const shouldGlow = i === 0 || isTail || isMemory || i % 3 === 0;
      if (shouldGlow) {
        const size = i === 0 ? 19 : isTail ? 14 + taper * 4 : 13 + taper * 6;
        node.glow
          .setVisible(true)
          .setPosition(p.x, p.y)
          .setTint(hurt ? COLORS.rose : isMemory ? COLORS.reward : COLORS.jade)
          .setDisplaySize(size * (i === 0 ? 3.9 : 2.65), size * (i === 0 ? 3.9 : 2.65))
          .setAlpha(i === 0 ? 0.42 : isMemory ? 0.2 : 0.11);
      }
    }
    this.snakeLayer.setDepth(30);
  }

  updateHud() {
    if (!this.dom?.hearts) return;
    const skillNeed = v13SkillXpCost(this.run.upgradeCount, Math.max(0, this.run.levelIndex - 1));
    this.dom.hearts.textContent = `身体 ${this.run.segments}/${V13_BALANCE.maxSegments} · 技 ${Math.floor(this.run.sxp)}/${skillNeed}`;
    const level = this.currentV13Level();
    const protect = (this.run.levelElapsedMs ?? this.run.timeMs) < level.protectionMs ? " · 保" : "";
    const cracks = this.run.bodyCracks > 0 ? ` · 裂${this.run.bodyCracks}/${V13_BALANCE.crackLimit}` : "";
    const event = this.run.currentEvent ? ` · ${this.run.currentEvent.name}` : "";
    const elite = this.run.currentElite ? ` · ${this.run.currentElite.name}` : "";
    const chapter = this.chapterForTime();
    const stage = this.currentGrowthStage();
    const growthNeed = v13GrowthCost(this.run.segments);
    const overload = this.run.memoryOverflow ? ` · 过载${this.run.memoryOverflow}` : "";
    if (this.dom.chapter) this.dom.chapter.textContent = `${chapter.name} · ${this.nextBossSpec()?.name ?? "终局完成"}`;
    this.dom.meta.textContent = `${stage.name} · 长成 ${Math.floor(this.run.mxp)}/${growthNeed} · ${Math.floor(this.run.timeMs / 1000)}s · ${this.run.kills}杀${overload}${cracks}${event}${elite}${protect}`;
    const skillSignature = SKILLS.map((skill) => this.run.skills[skill.id]).join("|");
    if (this.lastSkillSignature !== skillSignature) {
      this.lastSkillSignature = skillSignature;
      this.dom.skills.innerHTML = SKILLS.map((skill) => {
        const lv = this.run.skills[skill.id];
        return `<span class="${lv ? "is-on" : ""}"><img src="${this.skillIconAssetPath(skill)}" alt="">${lv || ""}</span>`;
      }).join("");
    }
    const awakenPct = this.boss ? 1 : this.bossProgress();
    this.dom.progress.style.width = `${Math.round(awakenPct * 100)}%`;
    if (this.dom.bossBar && this.dom.bossHp && this.dom.bossLabel) {
      const active = !!this.boss;
      this.dom.bossBar.classList.toggle("ui-hidden", !active);
      if (active) {
        const pct = clamp(this.boss.hp / this.boss.maxHp, 0, 1);
        this.dom.bossHp.style.width = `${Math.round(pct * 100)}%`;
        this.dom.bossLabel.textContent = `${this.boss.name} ${Math.round(pct * 100)}% · 护盾 ${this.boss.shield}/${this.boss.shieldMax}`;
      }
    }
  }

  updateCamera(ms) {
    if (this.screenShake > 0) {
      this.cameras.main.shake(Math.min(90, ms * 2), this.screenShake / 340);
      this.screenShake *= 0.82;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }
  }

  endRun(cause = "default") {
    if (this.mode === "gameover") return;
    this.mode = "gameover";
    this.stopCombatMusic();
    this.playDeathSound(cause === "victory");
    this.run.deathCause = cause;
    this.showDom("gameover");
    this.addBurst(this.player.x, this.player.y, cause === "victory" ? COLORS.gold : COLORS.rose, 210, 0.38);

    const result = this.makeLifeText(cause);
    const memoryLimit = this.scale.height < 640 ? 3 : 8;
    const memories = this.run.memoryTokens.slice(-memoryLimit);
    if (this.dom?.memoryList) {
      this.dom.memoryList.innerHTML = memories.map((m, index) => `<span style="--delay:${index * 0.12}s">${m.text}</span>`).join("");
    }
    if (this.dom?.lifeText) this.dom.lifeText.textContent = result;
    if (this.dom?.final) {
      const boss = this.boss ? ` · ${this.boss.name} ${Math.max(0, Math.round((this.boss.hp / this.boss.maxHp) * 100))}%` : this.run.bossDefeated ? " · 终局已破" : ` · Boss ${this.run.clearedBosses.length}/${BOSS_STAGES.length}`;
      this.dom.final.textContent = `分数 ${this.run.score} · 击杀 ${this.run.kills} · 身体 ${this.run.segments}/${V13_BALANCE.maxSegments} · ${this.chapterForTime().shortName}${boss}`;
    }
    if (this.dom?.endingKicker) this.dom.endingKicker.textContent = cause === "victory" ? "功成身退" : "死亡即故事";
    if (this.dom?.endingTitle) this.dom.endingTitle.textContent = cause === "victory" ? "它抵达了结尾" : "这条蛇的一生";
  }

  makeLifeText(cause) {
    const dominant = this.dominantTheme();
    const bossHp = this.boss ? Math.max(1, Math.round((this.boss.hp / this.boss.maxHp) * 100)) : 0;
    const templates = LIFE_TEMPLATES.filter((tpl) => (tpl.cause === cause || tpl.cause === "default") && (tpl.theme === dominant || tpl.theme === "default"));
    const tpl = pick(templates.length ? templates : LIFE_TEMPLATES);
    const combo = this.run.comboHighlights.length ? this.comboName(this.run.comboHighlights[this.run.comboHighlights.length - 1]) : "一次短暂的高光";
    const memory = this.run.memoryTokens.length ? this.run.memoryTokens[this.run.memoryTokens.length - 1].text.replace(/[。,.，]/g, "") : "第一枚记忆";
    return tpl.text
      .replaceAll("{stage}", `${this.run.wave}`)
      .replaceAll("{combo}", combo)
      .replaceAll("{memory}", memory)
      .replaceAll("{kills}", `${this.run.kills}`)
      .replaceAll("{bossHp}", `${bossHp}`);
  }

  dominantTheme() {
    const entries = SKILLS.map((skill) => [skill.theme, this.run.skills[skill.id]]);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0]?.[1] > 0 ? entries[0][0] : "default";
  }

  comboName(id) {
    return { steam: "蒸汽蛇阵", rail: "雷炮回响", wall: "铁壁蛇阵" }[id] ?? "未知 Combo";
  }

  addMemory(text, type) {
    this.run.memoryTokens.push({ text, type, at: Math.floor(this.run.timeMs / 1000) });
    if (this.run.memoryTokens.length > 28) this.run.memoryTokens.shift();
  }

  addRing(x, y, radius, color, alpha) {
    const g = this.add.circle(x, y, 8, color, 0).setStrokeStyle(4, color, alpha);
    this.fxLayer.add(g);
    this.tweens.add({ targets: g, radius, alpha: 0, duration: 260, ease: "Cubic.out", onComplete: () => g.destroy() });
  }

  addFireEmbers(x, y, radius, count = 8) {
    const step = TWO_PI / count;
    for (let i = 0; i < count; i += 1) {
      const a = i * step + Math.random() * 0.28;
      const start = radius * (0.52 + Math.random() * 0.28);
      const end = radius * (0.95 + Math.random() * 0.18);
      const ember = this.add.image(x + Math.cos(a) * start, y + Math.sin(a) * start, "spark");
      ember.setTint(i % 3 === 0 ? COLORS.gold : COLORS.ember);
      ember.setDisplaySize(9 + Math.random() * 8, 9 + Math.random() * 8);
      ember.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.72);
      this.fxLayer.add(ember);
      this.tweens.add({
        targets: ember,
        x: x + Math.cos(a) * end,
        y: y + Math.sin(a) * end,
        alpha: 0,
        duration: 260 + Math.random() * 160,
        ease: "Cubic.out",
        onComplete: () => ember.destroy(),
      });
    }
  }

  addSegmentEmbers(point, radius, count = 8) {
    const angle = point.angle ?? this.player.angle;
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? 1 : -1;
      const normal = this.segmentNormal(point, side);
      const spread = (Math.random() - 0.5) * 0.75;
      const startX = point.x + normal.x * (14 + Math.random() * 12);
      const startY = point.y + normal.y * (14 + Math.random() * 12);
      const outAngle = angle + side * (Math.PI / 2 + 0.25) + spread;
      const ember = this.add.image(startX, startY, "spark");
      ember.setTint(i % 3 === 0 ? COLORS.gold : COLORS.ember);
      ember.setDisplaySize(7 + Math.random() * 7, 7 + Math.random() * 7);
      ember.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.64);
      this.fxLayer.add(ember);
      this.tweens.add({
        targets: ember,
        x: startX + Math.cos(outAngle) * radius * (0.35 + Math.random() * 0.35),
        y: startY + Math.sin(outAngle) * radius * (0.35 + Math.random() * 0.35),
        alpha: 0,
        duration: 240 + Math.random() * 140,
        ease: "Cubic.out",
        onComplete: () => ember.destroy(),
      });
    }
  }

  frameKey(prefix, count) {
    const start = Math.floor(Math.random() * count);
    for (let i = 0; i < count; i += 1) {
      const key = `${prefix}-${((start + i) % count) + 1}`;
      if (this.textures.exists(key)) return key;
    }
    return null;
  }

  addBitmapFx(prefix, count, x, y, options = {}) {
    const key = this.frameKey(prefix, count);
    if (!key) return null;
    const sprite = this.add.image(x, y, key);
    sprite.setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
    sprite.setDisplaySize(options.width ?? options.size ?? 64, options.height ?? options.size ?? 64);
    sprite.setRotation(options.angle ?? 0);
    sprite.setAlpha(options.alpha ?? 0.65);
    sprite.setBlendMode(options.blend ?? Phaser.BlendModes.ADD);
    if (options.tint) sprite.setTint(options.tint);
    this.fxLayer.add(sprite);
    this.tweens.add({
      targets: sprite,
      x: x + (options.moveX ?? 0),
      y: y + (options.moveY ?? 0),
      displayWidth: (options.width ?? options.size ?? 64) * (options.grow ?? 1.08),
      displayHeight: (options.height ?? options.size ?? 64) * (options.growY ?? options.grow ?? 1.08),
      alpha: 0,
      duration: options.duration ?? 260,
      ease: options.ease ?? "Cubic.out",
      onComplete: () => sprite.destroy(),
    });
    return sprite;
  }

  addMouthFlame(length, width, level) {
    const angle = this.player.angle;
    const x = this.player.x + Math.cos(angle) * 38;
    const y = this.player.y + Math.sin(angle) * 38;
    this.addBitmapFx("v10-flame-tongue", 8, x, y, {
      width: length,
      height: width,
      angle,
      alpha: 0.78,
      duration: 310,
      originX: 0.05,
      grow: 1.08 + level * 0.025,
      moveX: Math.cos(angle) * (24 + level * 4),
      moveY: Math.sin(angle) * (24 + level * 4),
    });
    this.addSpark(x + Math.cos(angle) * length * 0.62, y + Math.sin(angle) * length * 0.62, COLORS.ember, 6 + level, 0.64);
  }

  damageCone(x, y, angle, length, width, amount, color) {
    const cx = Math.cos(angle);
    const cy = Math.sin(angle);
    const hitAt = (target) => {
      const dx = target.x - x;
      const dy = target.y - y;
      const forward = dx * cx + dy * cy;
      if (forward < 0 || forward > length) return false;
      const side = Math.abs(dx * -cy + dy * cx);
      const coneWidth = width * (0.38 + 0.72 * (forward / length));
      return side < coneWidth + (target.radius ?? 0);
    };
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      if (hitAt(this.enemies[i])) this.damageEnemy(i, amount, color, "hit");
    }
    if (this.boss && hitAt(this.boss)) this.damageBoss(amount * 1.15, color, this.boss.x, this.boss.y, "fire");
  }

  addFireRingImage(x, y, size, level = 1, alpha = 0.55) {
    if (!this.textures.exists("vfx-fire-ring-v5")) {
      this.addRing(x, y, size * 1.2, level >= 3 ? COLORS.gold : COLORS.ember, alpha * 0.72);
      return;
    }
    const image = this.add.image(x, y, "vfx-fire-ring-v5");
    const display = size * (level >= 4 ? 1.16 : 1);
    image.setDisplaySize(display, display);
    image.setTint(level >= 3 ? COLORS.gold : COLORS.ember);
    image.setBlendMode(Phaser.BlendModes.ADD);
    image.setAlpha(alpha);
    image.setRotation(Math.random() * TWO_PI);
    this.fxLayer.add(image);
    this.tweens.add({
      targets: image,
      displayWidth: display * 1.34,
      displayHeight: display * 1.34,
      angle: image.angle + (Math.random() > 0.5 ? 72 : -72),
      alpha: 0,
      duration: 520,
      ease: "Cubic.out",
      onComplete: () => image.destroy(),
    });
  }

  addMuzzleFlash(x, y, angle, color) {
    const flash = this.add.triangle(x + Math.cos(angle) * 18, y + Math.sin(angle) * 18, 20, 0, -8, -5, -8, 5, color, 0.58);
    flash.setRotation(angle);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.fxLayer.add(flash);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.7, scaleY: 0.65, duration: 120, ease: "Cubic.out", onComplete: () => flash.destroy() });
  }

  addBodyCrackFx(point, guarded = false) {
    const color = guarded ? COLORS.gold : COLORS.rose;
    const g = this.add.graphics();
    g.setPosition(point.x, point.y);
    g.setRotation(point.angle ?? this.player.angle);
    g.setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(guarded ? 2 : 3, color, guarded ? 0.42 : 0.5);
    for (let i = 0; i < 3; i += 1) {
      const x = -10 + i * 9;
      g.beginPath();
      g.moveTo(x, -8 + Math.random() * 4);
      g.lineTo(x + 5, Math.random() * 8 - 4);
      g.lineTo(x + 2, 8 - Math.random() * 4);
      g.strokePath();
    }
    this.fxLayer.add(g);
    this.tweens.add({ targets: g, alpha: 0, scaleX: 1.35, scaleY: 1.2, duration: 360, ease: "Cubic.out", onComplete: () => g.destroy() });
  }

  onBodyBlockProjectile(point) {
    const guarded = this.hasCombo("wall") || this.run.skills.shield >= 3;
    this.run.score += guarded ? 14 : 6;
    if (!guarded && this.run.bodyHitCooldownMs <= 0) {
      this.run.bodyCracks = Math.min(V13_BALANCE.crackLimit, this.run.bodyCracks + 1);
      this.run.bodyHitCooldownMs = V13_BALANCE.bodyHitCooldownMs;
    }
    this.addBodyCrackFx(point, guarded);
    this.playBodyBlockSound(guarded);
  }

  addSkillPulse(x, y, kind, size, tint, alpha = 0.72, duration = 420) {
    if (this.textures.exists(kind) && !["fire", "frost", "shield"].includes(kind)) {
      const image = this.add.image(x, y, kind);
      image.setDisplaySize(size * 0.58, size * 0.58);
      image.setTint(tint);
      image.setBlendMode(Phaser.BlendModes.ADD);
      image.setAlpha(alpha);
      image.setRotation(Math.random() * TWO_PI);
      this.fxLayer.add(image);
      this.tweens.add({
        targets: image,
        displayWidth: size,
        displayHeight: size,
        angle: image.angle + 96,
        alpha: 0,
        duration,
        ease: "Cubic.out",
        onComplete: () => image.destroy(),
      });
      return;
    }

    const fx = this.add.graphics();
    fx.setPosition(x, y);
    fx.setBlendMode(Phaser.BlendModes.ADD);
    if (kind === "fire") {
      fx.lineStyle(5, tint, alpha * 0.9);
      for (let i = 0; i < 4; i += 1) {
        const start = i * 1.47 + Math.random() * 0.25;
        fx.beginPath();
        fx.arc(0, 0, size * (0.34 + i * 0.045), start, start + 0.88, false);
        fx.strokePath();
      }
      fx.lineStyle(2, COLORS.gold, alpha * 0.55);
      fx.strokeCircle(0, 0, size * 0.43);
      fx.fillStyle(COLORS.ember, alpha * 0.1);
      fx.fillCircle(0, 0, size * 0.32);
    } else if (kind === "frost") {
      fx.lineStyle(4, tint, alpha * 0.72);
      fx.strokeEllipse(0, 0, size * 0.62, size * 0.24);
      fx.lineStyle(2, COLORS.white, alpha * 0.38);
      fx.beginPath();
      fx.moveTo(-size * 0.24, 0);
      fx.lineTo(size * 0.24, 0);
      fx.moveTo(0, -size * 0.12);
      fx.lineTo(0, size * 0.12);
      fx.strokePath();
    } else {
      fx.lineStyle(5, tint, alpha);
      fx.strokeCircle(0, 0, size * 0.22);
      fx.lineStyle(2, COLORS.white, alpha * 0.32);
      fx.strokeCircle(0, 0, size * 0.11);
    }
    this.fxLayer.add(fx);
    this.tweens.add({
      targets: fx,
      scaleX: 1.55,
      scaleY: 1.55,
      alpha: 0,
      duration,
      ease: "Cubic.out",
      onComplete: () => fx.destroy(),
    });
  }

  addBolt(x1, y1, x2, y2, color, width = 2.4, alpha = 0.48) {
    const chainKey = this.frameKey("v10-chain-arc", 8);
    if (chainKey) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const length = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      const sprite = this.add.image(midX, midY, chainKey);
      sprite.setDisplaySize(Math.max(64, length * 0.96), Math.max(20, width * 9));
      sprite.setRotation(Phaser.Math.Angle.Between(x1, y1, x2, y2));
      sprite.setBlendMode(Phaser.BlendModes.ADD);
      sprite.setAlpha(Math.min(0.72, alpha * 1.1));
      this.fxLayer.add(sprite);
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        scaleY: 0.55,
        duration: 170,
        ease: "Cubic.out",
        onComplete: () => sprite.destroy(),
      });
    }
    const g = this.add.graphics();
    g.lineStyle(width, color, alpha);
    g.beginPath();
    g.moveTo(x1, y1);
    const segments = 4;
    for (let i = 1; i < segments; i += 1) {
      const t = i / segments;
      const jitter = 16 + width * 5;
      g.lineTo(Phaser.Math.Linear(x1, x2, t) + (Math.random() - 0.5) * jitter, Phaser.Math.Linear(y1, y2, t) + (Math.random() - 0.5) * jitter);
    }
    g.lineTo(x2, y2);
    g.strokePath();
    this.fxLayer.add(g);
    this.tweens.add({ targets: g, alpha: 0, duration: 130, onComplete: () => g.destroy() });
  }

  addBurst(x, y, color, radius, alpha) {
    const bloom = this.add.image(x, y, "energy-bloom").setTint(color).setBlendMode(Phaser.BlendModes.ADD);
    bloom.setDisplaySize(16, 16).setAlpha(alpha);
    this.fxLayer.add(bloom);
    this.tweens.add({ targets: bloom, displayWidth: radius * 2, displayHeight: radius * 2, alpha: 0, duration: 360, ease: "Cubic.out", onComplete: () => bloom.destroy() });
    this.addSpark(x, y, color, LOW_POWER_RENDER ? 6 : 10, 0.85);
  }

  playImpact(x, y, color = COLORS.rose, scale = 0.7) {
    const fx = this.add.sprite(x, y, "impact-1").setTint(color).setScale(scale).setBlendMode(Phaser.BlendModes.ADD);
    this.fxLayer.add(fx);
    fx.play("impact-fx");
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  addSpark(x, y, color, count, power) {
    const sparkCount = LOW_POWER_RENDER ? Math.max(1, Math.ceil(count * 0.62)) : count;
    for (let i = 0; i < sparkCount; i += 1) {
      const a = Math.random() * TWO_PI;
      const d = (14 + Math.random() * 40) * power;
      const dot = this.add.circle(x, y, 3 + Math.random() * 3, color, 0.9);
      this.fxLayer.add(dot);
      this.tweens.add({ targets: dot, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 260 + Math.random() * 180, onComplete: () => dot.destroy() });
    }
  }

  floatText(x, y, text, color) {
    const obj = this.add.text(x, y, text, { fontSize: "18px", fontStyle: "900", color: `#${color.toString(16).padStart(6, "0")}` }).setOrigin(0.5);
    this.fxLayer.add(obj);
    this.tweens.add({ targets: obj, y: y - 34, alpha: 0, duration: 900, ease: "Cubic.out", onComplete: () => obj.destroy() });
  }

  unlockAudio() {
    if (this.audioCtx) {
      this.audioCtx.resume?.();
      this.startBgmAsset();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.audioCtx = new Ctx();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.42;
    this.masterGain.connect(this.audioCtx.destination);
    this.sfxCooldowns ??= new Map();
    this.loadAudioAssets();
    this.startBgmAsset();
  }

  loadAudioAssets() {
    if (this.audioAssets) return;
    const make = (src, volume = 0.5, loop = false) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = volume;
      audio.loop = loop;
      return audio;
    };
    this.audioAssets = {
      bgm: make("assets/free/v8-audio/bgm-fast-fight.ogg", 0.38, true),
      pickup: make("assets/free/sfx-pickup.ogg", 0.46),
      hit: make("assets/free/sfx-hit.ogg", 0.34),
      dash: make("assets/free/sfx-dash.ogg", 0.26),
      level: make("assets/free/sfx-level.ogg", 0.42),
    };
  }

  startBgmAsset() {
    if (!this.audioAssets?.bgm || this.mode === "menu") return;
    this.audioAssets.bgm.volume = this.boss ? 0.5 : 0.38;
    this.audioAssets.bgm.play().catch(() => {});
  }

  updateBgmAssetState() {
    if (!this.audioAssets?.bgm) return;
    const lowHp = (this.run?.segments ?? V13_BALANCE.initialSegments) <= V13_BALANCE.safeAfterSkillSegments + 1;
    const pressure = clamp((this.enemies?.length ?? 0) / 18 + (this.boss ? 0.5 : 0) + (lowHp ? 0.28 : 0) + (this.run?.memoryOverflow ?? 0) * 0.04, 0, 1.25);
    this.audioAssets.bgm.volume = 0.34 + pressure * 0.12;
    this.audioAssets.bgm.playbackRate = this.boss ? 1.045 : 1 + Math.min(0.035, pressure * 0.022);
  }

  stopBgmAsset() {
    if (!this.audioAssets?.bgm) return;
    this.audioAssets.bgm.pause();
  }

  playAssetSfx(id, volume = null) {
    const src = this.audioAssets?.[id];
    if (!src) return;
    const audio = src.cloneNode();
    audio.volume = volume ?? src.volume;
    audio.play().catch(() => {});
  }

  tone(freq, duration = 0.08, type = "sine", gain = 0.05, delay = 0, destination = null) {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime + delay;
    const osc = this.audioCtx.createOscillator();
    const amp = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(destination ?? this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  noiseBurst(duration = 0.08, gain = 0.035, delay = 0, filterType = "bandpass", frequency = 900) {
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime + delay;
    const buffer = this.audioCtx.createBuffer(1, Math.max(1, Math.floor(this.audioCtx.sampleRate * duration)), this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.audioCtx.createBufferSource();
    const filter = this.audioCtx.createBiquadFilter();
    const amp = this.audioCtx.createGain();
    src.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = 3.2;
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.masterGain);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  playSfx(id, cooldownMs = 0, fn = null) {
    if (!this.audioCtx || !this.masterGain) return;
    const nowMs = this.audioCtx.currentTime * 1000;
    const readyAt = this.sfxCooldowns?.get(id) ?? 0;
    if (nowMs < readyAt) return;
    this.sfxCooldowns?.set(id, nowMs + cooldownMs);
    fn?.();
  }

  startCombatMusic() {
    this.unlockAudio();
    if (this.musicNodes) return;
    this.startBgmAsset();
    const timer = window.setInterval(() => this.updateBgmAssetState(), 700);
    this.musicNodes = { assetOnly: true, timer };
    this.musicDebug = { active: true, ticks: 0, layer: "asset-bgm" };
  }

  tickCombatMusic(melody) {
    if (!this.audioCtx || !this.musicNodes || this.mode !== "playing") return;
    const lowHp = (this.run?.segments ?? V13_BALANCE.initialSegments) <= V13_BALANCE.safeAfterSkillSegments + 1;
    const eventPressure = this.run?.currentEvent?.id === "hunt" ? 0.34 : this.run?.currentEvent ? 0.18 : 0;
    const crackPressure = (this.run?.bodyCracks ?? 0) * 0.12;
    const intensity = clamp((this.run?.wave ?? 1) / 5 + (this.boss ? 0.45 : 0) + eventPressure + crackPressure + (lowHp ? 0.35 : 0), 0.2, 1.55);
    const root = this.boss ? 49 : 55;
    const step = this.musicStep % melody.length;
    const note = root * 2 ** (melody[step] / 12);
    const now = this.audioCtx.currentTime;
    this.musicNodes.bass.frequency.setTargetAtTime(root, now, 0.08);
    this.musicNodes.pulse.frequency.setTargetAtTime(root * 2, now, 0.08);
    this.musicNodes.danger.frequency.setTargetAtTime(lowHp ? 82.41 : 73.42, now, 0.1);
    this.musicNodes.dangerGain.gain.setTargetAtTime((lowHp || this.boss) ? 0.005 + intensity * 0.002 : 0.0001, now, 0.12);
    this.musicNodes.filter.frequency.setTargetAtTime(320 + intensity * 420, now, 0.12);
    this.musicNodes.gain.gain.setTargetAtTime(0.012 + intensity * 0.005, now, 0.08);
    if (step === 0 || step === 3 || this.boss || this.run?.currentEvent?.id === "resonance") {
      this.tone(note, 0.12, "triangle", 0.007 + intensity * 0.004);
    }
    if (step % 2 === 0) {
      this.tone(root * 0.5, 0.05, "sawtooth", 0.009 + intensity * 0.003);
      if (this.run?.currentEvent?.id === "hunt" || this.boss) this.noiseBurst(0.035, 0.012, 0.02, "lowpass", 180);
    }
    this.musicStep += 1;
    this.musicDebug = { active: true, ticks: (this.musicDebug?.ticks ?? 0) + 1, layer: this.boss ? "boss" : lowHp ? "lowHp" : this.run?.currentEvent?.id ?? "base" };
  }

  stopCombatMusic(fade = true) {
    if (this.musicNodes?.assetOnly) {
      window.clearInterval(this.musicNodes.timer);
      this.musicNodes = null;
      this.musicDebug = { active: false, ticks: this.musicDebug?.ticks ?? 0, layer: "stopped" };
      if (fade) this.stopBgmAsset();
      return;
    }
    if (!this.musicNodes || !this.audioCtx) {
      if (fade) this.stopBgmAsset();
      return;
    }
    const { bass, pulse, shimmer, danger, gain, timer } = this.musicNodes;
    window.clearInterval(timer);
    const now = this.audioCtx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (fade ? 0.35 : 0.05));
    bass.stop(now + (fade ? 0.38 : 0.08));
    pulse.stop(now + (fade ? 0.38 : 0.08));
    shimmer.stop(now + (fade ? 0.38 : 0.08));
    danger.stop(now + (fade ? 0.38 : 0.08));
    this.musicNodes = null;
    this.musicDebug = { active: false, ticks: this.musicDebug?.ticks ?? 0, layer: "stopped" };
    if (fade) this.stopBgmAsset();
  }

  updateMusicState() {
    if (!this.musicNodes || !this.audioCtx) return;
    if (this.audioCtx.state === "suspended") this.audioCtx.resume?.();
  }

  playEatSound() {
    this.playSfx("eat", 55, () => {
      this.playAssetSfx("pickup", 0.42);
      this.tone(520, 0.055, "sine", 0.028);
      this.tone(760, 0.075, "triangle", 0.021, 0.04);
      this.tone(1040, 0.05, "sine", 0.012, 0.075);
    });
  }

  playUpgradeSound() {
    this.playSfx("upgrade", 260, () => {
      this.playAssetSfx("level", 0.38);
      [330, 550, 880, 1320].forEach((freq, i) => this.tone(freq, 0.1, "triangle", 0.026, i * 0.045));
      this.noiseBurst(0.12, 0.018, 0.05, "highpass", 1400);
    });
  }

  playHitSound() {
    this.playSfx("enemy-hit", 90, () => {
      this.playAssetSfx("hit", 0.26);
      this.tone(185, 0.045, "square", 0.014);
      this.noiseBurst(0.035, 0.012, 0, "bandpass", 620);
    });
  }

  playHurtSound() {
    this.playSfx("player-hurt", 260, () => {
      this.playAssetSfx("hit", 0.38);
      this.tone(150, 0.16, "sawtooth", 0.045);
      this.tone(92, 0.22, "triangle", 0.025, 0.04);
      this.noiseBurst(0.11, 0.022, 0.02, "lowpass", 260);
    });
    if (navigator.vibrate) navigator.vibrate([18, 24, 16]);
  }

  playDeathSound(victory) {
    if (victory) {
      [330, 440, 660, 990].forEach((freq, i) => this.tone(freq, 0.2, "triangle", 0.035, i * 0.11));
      return;
    }
    this.tone(120, 0.5, "sawtooth", 0.048);
    [220, 277, 330].forEach((freq, i) => this.tone(freq, 0.45, "sine", 0.018, 0.55 + i * 0.18));
  }

  playSkillSound(id) {
    this.playSfx(`skill-${id}`, 180, () => {
      if (id === "fire") {
        this.tone(130, 0.11, "sawtooth", 0.026);
        this.noiseBurst(0.14, 0.02, 0.025, "bandpass", 740);
      } else if (id === "frost") {
        [660, 990, 1320].forEach((freq, i) => this.tone(freq, 0.11, "sine", 0.014, i * 0.035));
        this.noiseBurst(0.12, 0.012, 0.02, "highpass", 1800);
      } else if (id === "turret") {
        this.playAssetSfx("dash", 0.22);
        this.tone(260, 0.045, "square", 0.02);
        this.tone(520, 0.035, "triangle", 0.014, 0.035);
      } else if (id === "shield") {
        [220, 330, 440].forEach((freq, i) => this.tone(freq, 0.08, "triangle", 0.016, i * 0.03));
      } else if (id === "lightning") {
        this.tone(880, 0.045, "square", 0.016);
        this.tone(1760, 0.035, "sine", 0.012, 0.035);
        this.noiseBurst(0.05, 0.018, 0, "highpass", 2200);
      }
    });
  }

  playComboSound(id) {
    this.playSfx(`combo-${id}`, 500, () => {
      const root = id === "steam" ? 247 : id === "rail" ? 196 : id === "wall" ? 164 : 130;
      [0, 7, 12, 19].forEach((semi, i) => this.tone(root * 2 ** (semi / 12), 0.14, "triangle", 0.02, i * 0.055));
      this.noiseBurst(0.16, 0.02, 0.08, "bandpass", id === "boss_break" ? 520 : 1100);
    });
  }

  playEventSound(id) {
    this.playSfx(`event-${id}`, 700, () => {
      if (id === "hunt") {
        [98, 123, 98].forEach((freq, i) => this.tone(freq, 0.12, "sawtooth", 0.026, i * 0.09));
      } else if (id === "memory_rain") {
        [660, 880, 1100, 1320].forEach((freq, i) => this.tone(freq, 0.08, "sine", 0.016, i * 0.045));
      } else {
        [220, 440, 880].forEach((freq, i) => this.tone(freq, 0.1, "triangle", 0.019, i * 0.06));
      }
    });
  }

  playBodyBlockSound(guarded) {
    this.playSfx(guarded ? "body-guard" : "body-crack", 160, () => {
      this.tone(guarded ? 330 : 180, 0.055, guarded ? "triangle" : "sawtooth", guarded ? 0.018 : 0.024);
      this.playAssetSfx(guarded ? "level" : "hit", guarded ? 0.2 : 0.24);
      this.noiseBurst(0.055, 0.014, 0, "bandpass", guarded ? 1200 : 520);
    });
  }

  playSegmentLossSound() {
    this.playSfx("segment-loss", 480, () => {
      [220, 174, 130].forEach((freq, i) => this.tone(freq, 0.12, "triangle", 0.022, i * 0.07));
    });
  }

  playBossSpawnSound() {
    this.playSfx("boss-spawn", 1000, () => {
      this.tone(73.42, 0.44, "sawtooth", 0.04);
      this.tone(146.84, 0.32, "triangle", 0.025, 0.09);
      this.noiseBurst(0.28, 0.026, 0.08, "lowpass", 220);
    });
  }

  playWeakHitSound() {
    this.playSfx("weak-hit", 180, () => {
      this.tone(880, 0.06, "square", 0.022);
      this.tone(1320, 0.07, "sine", 0.016, 0.035);
      this.noiseBurst(0.07, 0.012, 0.02, "highpass", 2600);
    });
  }
}

const config = {
  type: Phaser.WEBGL,
  parent: "game",
  backgroundColor: "#05070b",
  scale: {
    mode: Phaser.Scale.NONE,
    width: Math.round(window.innerWidth * RENDER_RESOLUTION) || Math.round(W * RENDER_RESOLUTION),
    height: Math.round(window.innerHeight * RENDER_RESOLUTION) || Math.round(H * RENDER_RESOLUTION),
  },
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    resolution: TEXT_RESOLUTION,
    powerPreference: "high-performance",
  },
  resolution: TEXT_RESOLUTION,
  audio: {
    disableWebAudio: true,
  },
  scene: [SerpentLifeScene],
};

window.__SERPENT_LIFE__ = new Phaser.Game(config);
