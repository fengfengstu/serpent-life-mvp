import Phaser from "phaser";
import { COLORS, ENEMY_KINDS, GAME_CONFIG, LIFE_TEMPLATES, MEMORY_LINES, SKILLS } from "./config.js";

const W = 390;
const H = 844;
const TWO_PI = Math.PI * 2;
const TEXT_RESOLUTION = Math.min(window.devicePixelRatio || 1, 3);
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
    this.load.setPath("assets/generated");
    this.load.image("key-art", "serpent-life-key-art.png");
    this.load.image("asset-sheet", "serpent-life-asset-sheet.png");
    this.load.image("remaster-head", "remaster/serpent-head.png");
    this.load.image("remaster-body", "remaster/serpent-body.png");
    this.load.image("remaster-enemy", "remaster/enemy-common.png");
    this.load.image("remaster-boss", "remaster/boss-core.png");
    this.load.image("remaster-memory", "remaster/memory-core.png");
    this.load.setPath("assets/generated/sprite-forge/processed/impact");
    for (let i = 1; i <= 4; i += 1) this.load.image(`impact-${i}`, `impact-${i}.png`);
    this.load.setPath("assets/generated/sprite-forge/processed/enemy-idle");
    this.load.image("sf-enemy-idle-1", "idle-1.png");
    this.load.setPath("assets/generated/sprite-forge/processed/boss-idle");
    this.load.image("sf-boss-idle-1", "idle-1.png");
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
    this.scale.on("resize", this.layout, this);
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
    g.fillStyle(COLORS.acid, 1);
    g.fillCircle(32, 32, 18);
    g.lineStyle(4, COLORS.gold, 0.9);
    g.strokeCircle(32, 32, 20);
    g.generateTexture("food", 64, 64);

    g.clear();
    g.fillStyle(COLORS.gold, 1);
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
    g.fillStyle(COLORS.cyan, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture("projectile", 16, 16);

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
          <p class="ui-subtitle">越贪越强，越贪越险。拖动控制蛇首，吞噬记忆，构筑技能，在死亡后读完这一生。</p>
          <button class="ui-button" data-action="start">开始这一生</button>
        </div>
      </section>
      <section data-screen="hud" class="ui-hud ui-hidden">
        <div class="ui-hud-main">
          <div data-bind="hearts" class="ui-hearts">♥♥♥</div>
          <div data-bind="meta" class="ui-meta">长度 3 · 0s</div>
        </div>
        <div data-bind="skills" class="ui-skills"></div>
        <div class="ui-progress"><span data-bind="progress"></span></div>
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
    this.dom.meta = this.dom.root.querySelector("[data-bind='meta']");
    this.dom.skills = this.dom.root.querySelector("[data-bind='skills']");
    this.dom.progress = this.dom.root.querySelector("[data-bind='progress']");
    this.dom.cards = this.dom.root.querySelector("[data-bind='upgrade-cards']");
    this.dom.memoryList = this.dom.root.querySelector("[data-bind='memory-list']");
    this.dom.lifeText = this.dom.root.querySelector("[data-bind='life-text']");
    this.dom.final = this.dom.root.querySelector("[data-bind='final']");
    this.dom.endingKicker = this.dom.root.querySelector("[data-bind='ending-kicker']");
    this.dom.endingTitle = this.dom.root.querySelector("[data-bind='ending-title']");

    this.bindDomAction("start", () => this.startRun());
    this.bindDomAction("retry", () => this.startRun());
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
    const bg = this.add.image(width / 2, height / 2, "key-art").setScrollFactor(0);
    bg.setDisplaySize(width, height).setAlpha(0.92);
    const shade = this.add.rectangle(width / 2, height / 2, width, height, COLORS.ink, 0.22).setScrollFactor(0);
    const halo = this.add.image(width / 2, height * 0.23, "snake-glow").setTint(COLORS.acid).setDisplaySize(260, 180).setAlpha(0.28).setScrollFactor(0);
    halo.setBlendMode(Phaser.BlendModes.ADD);
    const head = this.add.circle(width / 2, height * 0.23, 30, COLORS.gold, 1).setScrollFactor(0);
    const body = [];
    for (let i = 1; i <= 8; i += 1) {
      body.push(this.add.circle(width / 2 - i * 23, height * 0.23 + Math.sin(i * 0.75) * 18, 21 - i * 0.8, COLORS.acid, 0.9).setScrollFactor(0));
    }
    this.tweens.add({ targets: [halo, head, ...body], y: "-=8", duration: 1300, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.uiLayer.add([bg, shade, halo, head, ...body]);
  }

  viewSize() {
    return { width: this.scale.width, height: this.scale.height };
  }

  clearGameObjects() {
    this.tweens.killAll();
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, 0);
    this.worldLayer?.removeAll(true);
    this.fxLayer?.removeAll(true);
    this.snakeLayer?.removeAll(true);
    this.uiLayer?.removeAll(true);
    this.cameraTarget?.destroy();
    this.cameraTarget = null;
  }

  startRun() {
    this.mode = "playing";
    this.clearGameObjects();
    this.showDom("playing");
    this.startCombatMusic();

    this.run = {
      timeMs: 0,
      coreHp: GAME_CONFIG.initialCoreHp,
      segments: GAME_CONFIG.initialSegments,
      score: 0,
      kills: 0,
      wave: 1,
      invulnMs: 900,
      bossSpawned: false,
      bossDefeated: false,
      nextFoodMs: 0,
      nextSkillMs: 5500,
      nextEnemyMs: 0,
      nextFireMs: 0,
      nextTurretMs: 0,
      nextLightningMs: 0,
      nextBossShotMs: 0,
      comboHighlights: [],
      buildSequence: [],
      memoryTokens: [],
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
    this.pointerState = null;
    this.screenShake = 0;

    this.bg = this.add.tileSprite(GAME_CONFIG.arena / 2, GAME_CONFIG.arena / 2, GAME_CONFIG.arena, GAME_CONFIG.arena, "arena-bg");
    this.bg.setTileScale(0.72, 0.72);
    this.arenaArt = this.add.image(GAME_CONFIG.arena / 2, GAME_CONFIG.arena / 2, "key-art");
    this.arenaArt.setDisplaySize(GAME_CONFIG.arena * 0.86, GAME_CONFIG.arena).setAlpha(0.035);
    this.worldLayer.add([this.bg, this.arenaArt]);
    this.border = this.add.graphics();
    this.worldLayer.add(this.border);
    this.drawBorder();

    this.pickupLayer = this.add.container(0, 0);
    this.enemyLayer = this.add.container(0, 0);
    this.projectileLayer = this.add.container(0, 0);
    this.worldLayer.add([this.pickupLayer, this.enemyLayer, this.projectileLayer]);
    this.fxLayer.setDepth(20);
    this.snakeLayer.setDepth(30);

    this.spawnPickup("skill", this.player.x + 380, this.player.y);
    [80, 148, 248].forEach((offset) => this.spawnPickup("food", this.player.x + offset, this.player.y + Phaser.Math.Between(-22, 22)));
    for (let i = 0; i < 8; i += 1) this.spawnPickup("food");
    this.spawnEnemy("drifter", { x: this.player.x + 340, y: this.player.y - 120 });
    this.spawnEnemy("drifter", { x: this.player.x + 280, y: this.player.y + 180 });
    this.spawnEnemy("hunter", { x: this.player.x + 520, y: this.player.y + 60 });

    this.buildHud();
    this.cameraTarget = this.add.zone(this.player.x, this.player.y, 1, 1);
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.arena, GAME_CONFIG.arena);
    this.forceCameraToPlayer();
    this.cameras.main.startFollow(this.cameraTarget, true, 0.12, 0.12);
    this.forceCameraToPlayer();
    this.addMemory("出生时，它只有三节身体和三颗心。", "birth");
    this.updateHud();
  }

  forceCameraToPlayer() {
    const cam = this.cameras.main;
    const maxX = Math.max(0, GAME_CONFIG.arena - cam.width);
    const maxY = Math.max(0, GAME_CONFIG.arena - cam.height);
    cam.setScroll(
      clamp(this.player.x - cam.width / 2, 0, maxX),
      clamp(this.player.y - cam.height / 2, 0, maxY),
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
    this.hud = {};
    this.hud.joyBase = this.add.circle(86, height - 104, 58, 0x081315, 0.62).setStrokeStyle(3, COLORS.acid, 0.35).setScrollFactor(0);
    this.hud.joyKnob = this.add.circle(86, height - 104, 22, COLORS.acid, 0.82).setStrokeStyle(3, COLORS.gold, 0.75).setScrollFactor(0);
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
    if (this.run.timeMs < 120) this.forceCameraToPlayer();
    this.run.invulnMs = Math.max(0, this.run.invulnMs - ms);
    this.player.hurtMs = Math.max(0, this.player.hurtMs - ms);

    this.updatePlayer(dt);
    this.updatePickups(dt);
    this.updateEnemies(dt, ms);
    this.updateBoss(dt, ms);
    this.updateProjectiles(dt, ms);
    this.updateShots(dt, ms);
    this.updateSkills(dt, ms);
    this.updateSpawns(ms);
    this.drawSnake();
    this.updateHud();
    this.updateCamera(ms);
  }

  onPointerDown(pointer) {
    this.unlockAudio();
    if (this.mode !== "playing") return;
    if (pointer.y < 150 || pointer.x > this.scale.width - 76) return;
    this.pointerState = { id: pointer.id, sx: pointer.x, sy: pointer.y };
    this.hud?.joyBase?.setPosition(pointer.x, pointer.y).setVisible(true);
    this.hud?.joyKnob?.setPosition(pointer.x, pointer.y).setVisible(true);
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
    let dx = pointer.x - p.sx;
    let dy = pointer.y - p.sy;
    let len = Math.hypot(dx, dy);
    if (len <= GAME_CONFIG.inputDeadZone) return;
    if (len > GAME_CONFIG.joystickFollowRadius) {
      const follow = len - GAME_CONFIG.joystickFollowRadius;
      p.sx += (dx / len) * follow;
      p.sy += (dy / len) * follow;
      dx = pointer.x - p.sx;
      dy = pointer.y - p.sy;
      len = Math.hypot(dx, dy);
      this.hud?.joyBase?.setPosition(p.sx, p.sy);
    }
    this.player.targetAngle = Math.atan2(dy, dx);
    const cap = Math.min(GAME_CONFIG.joystickRadius, len);
    this.hud?.joyKnob?.setPosition(p.sx + (dx / len) * cap, p.sy + (dy / len) * cap);
  }

  updatePlayer(dt) {
    const segmentWeight = Math.max(0, this.run.segments - GAME_CONFIG.initialSegments);
    const turnRate = Math.max(GAME_CONFIG.turnRateFloor, GAME_CONFIG.baseTurnRate - segmentWeight * GAME_CONFIG.turnRateDecay);
    this.player.angle = angleLerp(this.player.angle, this.player.targetAngle, clamp(turnRate * dt, 0, 1));
    this.player.x += Math.cos(this.player.angle) * GAME_CONFIG.baseSpeed * dt;
    this.player.y += Math.sin(this.player.angle) * GAME_CONFIG.baseSpeed * dt;
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

  updateSpawns(ms) {
    this.run.nextFoodMs -= ms;
    this.run.nextSkillMs -= ms;
    this.run.nextEnemyMs -= ms;
    this.run.wave = 1 + Math.floor(this.run.timeMs / 30000);

    if (this.run.nextFoodMs <= 0 && this.pickups.filter((p) => p.type === "food").length < 26) {
      this.run.nextFoodMs = GAME_CONFIG.foodSpawnMs;
      this.spawnPickup("food");
    }
    if (this.run.nextSkillMs <= 0 && this.pickups.filter((p) => p.type === "skill").length < 2) {
      this.run.nextSkillMs = GAME_CONFIG.skillDropMs;
      this.spawnPickup("skill");
    }
    if (this.run.nextEnemyMs <= 0 && this.enemies.length < 10 + this.run.wave * 3) {
      const pressure = Math.max(0, this.run.wave - 1);
      const teaching = this.run.timeMs < GAME_CONFIG.lethalProtectionMs;
      this.run.nextEnemyMs = Math.max(320, GAME_CONFIG.enemySpawnMs - pressure * 80) * (teaching ? 1.55 : 1);
      this.spawnEnemy(teaching && Math.random() < 0.72 ? "drifter" : undefined);
    }
    if (!this.run.bossSpawned && (this.run.timeMs >= GAME_CONFIG.bossSpawnMs || this.run.kills >= GAME_CONFIG.bossSpawnKills)) {
      this.spawnBoss();
    }
  }

  spawnPickup(type, forcedX = null, forcedY = null) {
    const point = forcedX === null ? randomNear(this.player ?? { x: GAME_CONFIG.arena / 2, y: GAME_CONFIG.arena / 2 }, 220, 780) : { x: forcedX, y: forcedY };
    const x = clamp(point.x, 80, GAME_CONFIG.arena - 80);
    const y = clamp(point.y, 80, GAME_CONFIG.arena - 80);
    const aura = this.add.image(x, y, "snake-glow").setTint(type === "skill" ? COLORS.gold : COLORS.acid);
    aura.setDisplaySize(type === "skill" ? 112 : 82, type === "skill" ? 112 : 82).setBlendMode(Phaser.BlendModes.ADD).setAlpha(type === "skill" ? 0.34 : 0.24);
    const sprite = this.add.image(x, y, "remaster-memory").setDisplaySize(type === "skill" ? 58 : 42, type === "skill" ? 58 : 42);
    sprite.setTint(type === "skill" ? 0xffffff : 0xe9fff0);
    this.tweens.add({ targets: aura, alpha: type === "skill" ? 0.48 : 0.34, duration: 900, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: sprite, angle: 360, duration: type === "skill" ? 4200 : 5600, repeat: -1 });
    this.pickupLayer.add([aura, sprite]);
    this.pickups.push({ type, x, y, radius: type === "skill" ? 24 : 18, sprite, aura });
  }

  updatePickups(dt) {
    for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
      const p = this.pickups[i];
      const d = distance(this.player, p);
      if (d < GAME_CONFIG.magnetRadius) {
        const pull = clamp((GAME_CONFIG.magnetRadius - d) / GAME_CONFIG.magnetRadius, 0, 1);
        p.x += (this.player.x - p.x) * pull * dt * 5;
        p.y += (this.player.y - p.y) * pull * dt * 5;
        p.sprite.setPosition(p.x, p.y);
        p.aura.setPosition(p.x, p.y);
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
    if (this.run.segments < GAME_CONFIG.maxSegments) this.run.segments += 1;
    this.run.score += 10 + this.run.wave * 2;
    this.addMemory(pick(MEMORY_LINES), "food");
    this.addBurst(p.x, p.y, COLORS.acid, 56, 0.24);
    this.floatText(p.x, p.y, "+1 记忆", COLORS.acid);
    this.playEatSound();
  }

  collectSkillPickup(index) {
    const p = this.pickups[index];
    this.destroyPickup(index);
    this.addMemory("它吞下了一枚改变命运的技能核。", "skill_drop");
    this.openUpgrade();
  }

  destroyPickup(index) {
    const p = this.pickups[index];
    this.pickups.splice(index, 1);
    this.tweens.killTweensOf([p.sprite, p.aura]);
    p.sprite.destroy();
    p.aura.destroy();
  }

  openUpgrade() {
    this.mode = "upgrade";
    this.showDom("upgrade");
    this.stopCombatMusic(false);
    this.playUpgradeSound();

    const available = SKILLS.filter((skill) => this.run.skills[skill.id] < 5);
    const choices = Phaser.Utils.Array.Shuffle([...available]).slice(0, 3);
    if (!this.dom?.cards) return;
    this.dom.cards.innerHTML = "";
    choices.forEach((skill) => {
      const current = this.run.skills[skill.id];
      const card = document.createElement("button");
      card.className = "ui-card is-locked";
      card.innerHTML = `<strong><span>${skill.icon}</span>${skill.name} Lv.${current + 1}</strong><em>${skill.text}</em>`;
      card.disabled = true;
      window.setTimeout(() => {
        card.disabled = false;
        card.classList.remove("is-locked");
      }, GAME_CONFIG.buildPauseCooldownMs);
      card.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        if (card.disabled) return;
        this.unlockAudio();
        this.applySkill(skill);
      });
      this.dom.cards.appendChild(card);
    });
  }

  applySkill(skill) {
    this.run.skills[skill.id] += 1;
    if (!this.run.selectedSlots.includes(skill.id) && this.run.selectedSlots.length < 5) this.run.selectedSlots.push(skill.id);
    this.run.buildSequence.push(skill.id);
    this.addMemory(`它选择了「${skill.name}」。`, skill.id);
    this.checkCombos();
    this.mode = "playing";
    this.showDom("playing");
    this.startCombatMusic();
    this.addBurst(this.player.x, this.player.y, COLORS.gold, 150, 0.3);
    this.triggerSkillSurge(skill);
    this.playUpgradeSound();
  }

  triggerSkillSurge(skill) {
    const level = this.run.skills[skill.id];
    if (skill.id === "fire") {
      for (let s = 0; s < this.run.segments; s += 2) {
        const p = this.getSegmentPoint(s);
        this.addRing(p.x, p.y, 92 + level * 12, COLORS.ember, 0.34);
        this.damageAround(p.x, p.y, 92 + level * 12, 2.2 + level * 0.4, COLORS.ember);
      }
      return;
    }
    if (skill.id === "frost") {
      this.enemies.forEach((enemy) => {
        enemy.slowMs = Math.max(enemy.slowMs, 1200);
      });
      this.damageAround(this.player.x, this.player.y, 210, 1.6 + level * 0.3, COLORS.frost);
      this.addRing(this.player.x, this.player.y, 210, COLORS.frost, 0.32);
      return;
    }
    if (skill.id === "turret") {
      for (let i = 0; i < Math.min(6, 2 + level); i += 1) {
        const point = this.getSegmentPoint(i % this.run.segments);
        const target = this.nearestEnemy(point.x, point.y);
        if (!target) continue;
        const angle = Phaser.Math.Angle.Between(point.x, point.y, target.x, target.y);
        const sprite = this.add.image(point.x, point.y, "projectile").setTint(COLORS.gold).setDisplaySize(18, 18);
        this.projectileLayer.add(sprite);
        this.shots.push({ x: point.x, y: point.y, angle, speed: 430, radius: 10, lifeMs: 1100, damage: 1.8 + level * 0.35, bounces: 1, sprite });
      }
      return;
    }
    if (skill.id === "shield") {
      this.run.invulnMs = Math.max(this.run.invulnMs, 1600 + level * 220);
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
      }
    });
  }

  spawnEnemy(forceKind, forcedPoint = null) {
    const roll = Math.random();
    const kind = forceKind ?? (roll > 0.86 ? "bloomer" : roll > 0.56 ? "hunter" : "drifter");
    const spec = ENEMY_KINDS[kind];
    const point = forcedPoint ?? randomNear(this.player ?? { x: GAME_CONFIG.arena / 2, y: GAME_CONFIG.arena / 2 }, 500, 780);
    const texture = "sf-enemy-idle-1";
    const sprite = this.add.image(clamp(point.x, 70, GAME_CONFIG.arena - 70), clamp(point.y, 70, GAME_CONFIG.arena - 70), texture);
    const baseSize = kind === "bloomer" ? 104 : kind === "hunter" ? 92 : 82;
    sprite.setDisplaySize(baseSize, baseSize);
    if (kind === "hunter") sprite.setTint(0xffc2e3);
    if (kind === "bloomer") sprite.setTint(0xd8b4ff);
    const glow = this.add.image(sprite.x, sprite.y, "snake-glow").setTint(kind === "bloomer" ? COLORS.violet : COLORS.rose);
    glow.setDisplaySize(spec.radius * 3.4, spec.radius * 3.4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.16);
    this.enemyLayer.add([glow, sprite]);
    this.enemies.push({
      kind,
      x: sprite.x,
      y: sprite.y,
      hp: spec.hp + Math.floor(this.run.wave * 0.45),
      maxHp: spec.hp + Math.floor(this.run.wave * 0.45),
      radius: spec.radius,
      speed: spec.speed,
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
      const speed = e.speed * (1 + Math.min(0.8, this.run.timeMs / 180000)) * (e.slowMs > 0 ? 0.46 : 1);
      e.x += Math.cos(angle + Math.sin(e.wobble) * 0.22) * speed * dt;
      e.y += Math.sin(angle + Math.sin(e.wobble) * 0.22) * speed * dt;
      e.sprite.setPosition(e.x, e.y);
      e.glow.setPosition(e.x, e.y);
      e.sprite.rotation += dt * (e.kind === "hunter" ? 2.8 : 1.8);
      e.sprite.setAlpha(e.hitMs > 0 ? 1 : 0.92);
      e.sprite.setDisplaySize(e.baseSize * (e.hitMs > 0 ? 1.08 : 1), e.baseSize * (e.hitMs > 0 ? 1.08 : 1));

      if (distance(e, this.player) < e.radius + GAME_CONFIG.headRadius) {
        this.damagePlayer(e.kind === "bloomer" ? "swarmed" : "greed");
      }
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
    this.run.score += spec.score;
    this.playImpact(e.x, e.y, color, e.kind === "bloomer" ? 0.88 : 0.72);
    this.addBurst(e.x, e.y, color, e.kind === "bloomer" ? 94 : 68, 0.25);
    if (Math.random() < 0.11) this.spawnPickup("food");
    if (this.run.kills % 18 === 0) this.addMemory(`它在第${this.run.wave}波杀出一条窄路。`, "kill");
    this.playHitSound();
  }

  spawnBoss() {
    this.run.bossSpawned = true;
    const point = {
      x: this.player.x + Math.cos(this.player.angle) * 330,
      y: this.player.y + Math.sin(this.player.angle) * 330,
    };
    const sprite = this.add.image(clamp(point.x, 120, GAME_CONFIG.arena - 120), clamp(point.y, 120, GAME_CONFIG.arena - 120), "sf-boss-idle-1");
    sprite.setDisplaySize(248, 248);
    const glow = this.add.image(sprite.x, sprite.y, "snake-glow").setTint(COLORS.rose).setDisplaySize(284, 284).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.28);
    this.enemyLayer.add([glow, sprite]);
    this.boss = {
      x: sprite.x,
      y: sprite.y,
      hp: GAME_CONFIG.bossHp,
      maxHp: GAME_CONFIG.bossHp,
      radius: 68,
      speed: 82,
      sprite,
      glow,
      phase: 1,
    };
    this.addMemory("Boss 从终点巢穴里醒来。", "boss");
    this.floatText(this.player.x, this.player.y - 80, "终点 Boss 醒来", COLORS.rose);
    this.screenShake = Math.max(this.screenShake, 12);
  }

  updateBoss(dt, ms) {
    if (!this.boss) return;
    const b = this.boss;
    b.phase = b.hp < b.maxHp * 0.5 ? 2 : 1;
    const a = Phaser.Math.Angle.Between(b.x, b.y, this.player.x, this.player.y);
    b.x += Math.cos(a) * b.speed * (b.phase === 2 ? 1.25 : 1) * dt;
    b.y += Math.sin(a) * b.speed * (b.phase === 2 ? 1.25 : 1) * dt;
    b.sprite.setPosition(b.x, b.y);
    b.glow.setPosition(b.x, b.y);
    b.sprite.rotation += dt * 0.6;
    b.glow.rotation -= dt * 0.5;

    this.run.nextBossShotMs -= ms;
    if (this.run.nextBossShotMs <= 0) {
      this.run.nextBossShotMs = b.phase === 2 ? 1050 : 1500;
      this.spawnBossProjectiles();
    }

    if (distance(b, this.player) < b.radius + GAME_CONFIG.headRadius) {
      this.damagePlayer("boss");
    }
  }

  spawnBossProjectiles() {
    if (!this.boss) return;
    const count = this.boss.phase === 2 ? 7 : 5;
    const base = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
    for (let i = 0; i < count; i += 1) {
      const spread = (i - (count - 1) / 2) * 0.18;
      const angle = base + spread;
      const sprite = this.add.image(this.boss.x, this.boss.y, "projectile").setTint(COLORS.rose).setDisplaySize(18, 18);
      this.projectileLayer.add(sprite);
      this.projectiles.push({ x: this.boss.x, y: this.boss.y, angle, speed: 185, radius: 9, lifeMs: 3600, sprite });
    }
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
    this.updateShield(ms);
    this.updateLightning(ms);
    this.checkCombos();
  }

  updateFire(ms) {
    const level = this.run.skills.fire;
    if (!level) return;
    this.run.nextFireMs -= ms;
    if (this.run.nextFireMs > 0) return;
    this.run.nextFireMs = Math.max(360, 900 - level * 80);
    const radius = 54 + level * 8 + (this.run.comboHighlights.includes("steam") ? 20 : 0);
    for (let s = 0; s < this.run.segments; s += Math.max(2, 5 - level)) {
      const p = this.getSegmentPoint(s);
      this.addRing(p.x, p.y, radius, COLORS.ember, 0.22);
      this.damageAround(p.x, p.y, radius, 1 + level * 0.35, COLORS.ember);
    }
  }

  updateFrost(dt, ms) {
    const level = this.run.skills.frost;
    if (!level) return;
    if (!this.nextFrostFieldMs) this.nextFrostFieldMs = 0;
    this.nextFrostFieldMs -= ms;
    if (this.nextFrostFieldMs <= 0) {
      this.nextFrostFieldMs = Math.max(160, 360 - level * 30);
      const sprite = this.add.image(this.player.x, this.player.y, "snake-glow").setTint(COLORS.frost);
      sprite.setDisplaySize(72 + level * 10, 72 + level * 10).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.18);
      this.fxLayer.add(sprite);
      this.frostFields.push({ x: this.player.x, y: this.player.y, radius: 38 + level * 5, lifeMs: 1250 + level * 120, sprite });
    }
    for (let i = this.frostFields.length - 1; i >= 0; i -= 1) {
      const f = this.frostFields[i];
      f.lifeMs -= ms;
      f.sprite.setAlpha(clamp(f.lifeMs / 1500, 0, 1) * 0.18);
      for (let e = this.enemies.length - 1; e >= 0; e -= 1) {
        const enemy = this.enemies[e];
        if (Phaser.Math.Distance.Between(f.x, f.y, enemy.x, enemy.y) < f.radius + enemy.radius) {
          enemy.slowMs = Math.max(enemy.slowMs, 420);
          this.damageEnemy(e, (0.55 + level * 0.14) * dt, COLORS.frost, "dot");
        }
      }
      if (this.boss && Phaser.Math.Distance.Between(f.x, f.y, this.boss.x, this.boss.y) < f.radius + this.boss.radius) {
        this.damageBoss((0.9 + level * 0.18) * dt, COLORS.frost);
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
    const count = Math.min(1 + level, Math.ceil(this.run.segments / 5));
    for (let i = 0; i < count; i += 1) {
      const point = this.getSegmentPoint(1 + i * Math.max(2, Math.floor(this.run.segments / Math.max(1, count))));
      const target = this.nearestEnemy(point.x, point.y);
      if (!target) continue;
      const angle = Phaser.Math.Angle.Between(point.x, point.y, target.x, target.y);
      const sprite = this.add.image(point.x, point.y, "projectile").setTint(COLORS.gold).setDisplaySize(16, 16);
      this.projectileLayer.add(sprite);
      this.shots.push({ x: point.x, y: point.y, angle, speed: 380, radius: 9, lifeMs: 950, damage: 1.1 + level * 0.35, bounces: this.run.comboHighlights.includes("rail") ? 2 : 1, sprite });
    }
  }

  updateShots(dt, ms) {
    for (let i = this.shots.length - 1; i >= 0; i -= 1) {
      const s = this.shots[i];
      s.lifeMs -= ms;
      s.x += Math.cos(s.angle) * s.speed * dt;
      s.y += Math.sin(s.angle) * s.speed * dt;
      s.sprite.setPosition(s.x, s.y);
      const hitIndex = this.enemies.findIndex((e) => Phaser.Math.Distance.Between(s.x, s.y, e.x, e.y) < s.radius + e.radius);
      if (hitIndex >= 0) {
        const hit = this.enemies[hitIndex];
        this.damageEnemy(hitIndex, s.damage, COLORS.gold);
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
        this.damageBoss(s.damage, COLORS.gold);
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
    const count = Math.min(5, 1 + level);
    const radius = 42 + level * 5;
    const t = this.run.timeMs / 480;
    for (let i = 0; i < count; i += 1) {
      const a = t + (i / count) * TWO_PI;
      const x = this.player.x + Math.cos(a) * radius;
      const y = this.player.y + Math.sin(a) * radius;
      this.addSpark(x, y, COLORS.violet, 1, 0.12);
      this.damageAround(x, y, 24, 0.24 + level * 0.06, COLORS.violet, false);
    }
  }

  updateLightning(ms) {
    const level = this.run.skills.lightning;
    if (!level) return;
    this.run.nextLightningMs -= ms;
    if (this.run.nextLightningMs > 0) return;
    this.run.nextLightningMs = Math.max(520, 1200 - level * 90);
    let origin = this.getSegmentPoint(Math.min(this.run.segments - 1, 2 + Math.floor(Math.random() * Math.max(1, this.run.segments - 2))));
    const hit = new Set();
    const jumps = 1 + level + (this.run.comboHighlights.includes("rail") ? 2 : 0);
    for (let j = 0; j < jumps; j += 1) {
      const target = this.nearestEnemy(origin.x, origin.y, null, hit);
      if (!target) {
        if (this.boss && Phaser.Math.Distance.Between(origin.x, origin.y, this.boss.x, this.boss.y) < 420) {
          this.addBolt(origin.x, origin.y, this.boss.x, this.boss.y, COLORS.cyan);
          this.damageBoss(1.4 + level * 0.42, COLORS.cyan);
        }
        break;
      }
      hit.add(target);
      this.addBolt(origin.x, origin.y, target.x, target.y, COLORS.cyan);
      const idx = this.enemies.indexOf(target);
      this.damageEnemy(idx, 1.2 + level * 0.38, COLORS.cyan);
      origin = target;
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
      this.damageBoss(amount, color);
    }
  }

  damageBoss(amount, color = COLORS.acid) {
    if (!this.boss) return;
    this.boss.hp -= amount;
      this.addSpark(this.boss.x, this.boss.y, color, 2, 0.3);
      this.playImpact(this.boss.x, this.boss.y, color, 0.84);
    if (this.boss.hp <= 0) {
      const { x, y } = this.boss;
      this.boss.sprite.destroy();
      this.boss.glow.destroy();
      this.boss = null;
      this.run.bossDefeated = true;
      this.addMemory("它击碎了终点 Boss 的心脏。", "victory");
      this.addBurst(x, y, COLORS.gold, 260, 0.42);
      this.run.score += 900;
      this.endRun("victory");
    }
  }

  damagePlayer(cause = "swarmed") {
    if (this.mode !== "playing" || this.run.invulnMs > 0) return;
    this.run.invulnMs = GAME_CONFIG.invulnMs;
    this.player.hurtMs = 250;
    this.screenShake = Math.max(this.screenShake, 13);
    this.playHurtSound();
    const protectedFromDeath = this.run.timeMs < GAME_CONFIG.lethalProtectionMs && this.run.coreHp <= 1;
    if (!protectedFromDeath && this.run.timeMs >= 12000) this.run.coreHp -= 1;
    this.addMemory("蛇首被击中，三颗心少了一次回声。", "hurt");
    this.addBurst(this.player.x, this.player.y, COLORS.red, 120, 0.34);
    if (this.run.coreHp <= 0) {
      this.run.deathCause = cause;
      this.endRun(cause);
    }
  }

  drawSnake() {
    this.snakeLayer.removeAll(true);
    const hurt = this.player.hurtMs > 0;
    const spine = this.add.graphics();
    const points = [];
    for (let i = 0; i < this.run.segments; i += 1) {
      const p = this.getSegmentPoint(i);
      if (p) points.push(p);
    }
    if (points.length > 1) {
      spine.lineStyle(22, hurt ? COLORS.rose : COLORS.acid, 0.26);
      spine.beginPath();
      spine.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) spine.lineTo(points[i].x, points[i].y);
      spine.strokePath();
      spine.lineStyle(12, COLORS.gold, hurt ? 0.18 : 0.12);
      spine.beginPath();
      spine.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) spine.lineTo(points[i].x, points[i].y);
      spine.strokePath();
      spine.lineStyle(5, COLORS.cyan, 0.22);
      spine.beginPath();
      spine.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) spine.lineTo(points[i].x, points[i].y);
      spine.strokePath();
      this.snakeLayer.add(spine);
    }
    for (let i = this.run.segments - 1; i >= 0; i -= 1) {
      const p = this.getSegmentPoint(i);
      const taper = 1 - i / (this.run.segments + 2);
      const size = i === 0 ? 23 : 12 + taper * 7;
      const alpha = i === 0 ? 1 : clamp(0.82 - i * 0.018, 0.46, 0.82);
      const glow = this.add.image(p.x, p.y, "snake-glow").setTint(hurt ? COLORS.rose : i % 4 === 0 ? COLORS.gold : COLORS.acid);
      glow.setDisplaySize(size * (i === 0 ? 3.4 : 2.5), size * (i === 0 ? 3.4 : 2.5)).setBlendMode(Phaser.BlendModes.ADD).setAlpha(i === 0 ? 0.45 : 0.18);
      if (i === 0) {
        const body = this.add.image(p.x, p.y, "remaster-head");
        body.setRotation(p.angle ?? this.player.angle);
        body.setDisplaySize(76, 76);
        body.setAlpha(alpha);
        if (hurt) body.setTint(0xffd7e3);
        this.snakeLayer.add([glow, body]);
      } else {
        const scaleX = 26 + taper * 8;
        const scaleY = 18 + taper * 5;
        const body = this.add.ellipse(p.x, p.y, scaleX, scaleY, i % 4 === 0 ? COLORS.gold : COLORS.acid, i % 4 === 0 ? 0.86 : 0.62);
        body.setRotation(p.angle ?? this.player.angle);
        body.setStrokeStyle(2, i % 4 === 0 ? COLORS.white : COLORS.cyan, i % 4 === 0 ? 0.34 : 0.18);
        body.setAlpha(alpha);
        this.snakeLayer.add([glow, body]);
        if (i % 4 === 0) {
          const mem = this.add.image(p.x, p.y, "remaster-memory").setDisplaySize(11, 11).setAlpha(0.88);
          this.snakeLayer.add(mem);
        }
      }
    }
    this.snakeLayer.setDepth(10);
  }

  updateHud() {
    if (!this.dom?.hearts) return;
    const hp = Math.max(0, this.run.coreHp);
    this.dom.hearts.textContent = `${"♥".repeat(hp)}${"♡".repeat(GAME_CONFIG.initialCoreHp - hp)}`;
    const protect = this.run.timeMs < GAME_CONFIG.lethalProtectionMs ? " · 保护中" : "";
    this.dom.meta.textContent = `长度 ${this.run.segments}/${GAME_CONFIG.maxSegments} · ${Math.floor(this.run.timeMs / 1000)}s · 击杀 ${this.run.kills}${protect}`;
    this.dom.skills.innerHTML = SKILLS.map((skill) => {
      const lv = this.run.skills[skill.id];
      return `<span class="${lv ? "is-on" : ""}">${skill.icon}${lv || ""}</span>`;
    }).join("");
    const bossPct = this.boss ? clamp(this.boss.hp / this.boss.maxHp, 0, 1) : clamp((this.run.timeMs / GAME_CONFIG.bossSpawnMs), 0, 1);
    this.dom.progress.style.width = `${Math.round(bossPct * 100)}%`;
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
    const memories = this.run.memoryTokens.slice(-8);
    if (this.dom?.memoryList) {
      this.dom.memoryList.innerHTML = memories.map((m, index) => `<span style="--delay:${index * 0.12}s">${m.text}</span>`).join("");
    }
    if (this.dom?.lifeText) this.dom.lifeText.textContent = result;
    if (this.dom?.final) {
      const boss = this.boss ? ` · Boss ${Math.max(0, Math.round((this.boss.hp / this.boss.maxHp) * 100))}%` : this.run.bossDefeated ? " · Boss 已倒下" : "";
      this.dom.final.textContent = `分数 ${this.run.score} · 击杀 ${this.run.kills} · 长度 ${this.run.segments}/${GAME_CONFIG.maxSegments} · 第${this.run.wave}波${boss}`;
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

  addBolt(x1, y1, x2, y2, color) {
    const g = this.add.graphics();
    g.lineStyle(4, color, 0.72);
    g.beginPath();
    g.moveTo(x1, y1);
    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 36;
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 36;
    g.lineTo(midX, midY);
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
    this.addSpark(x, y, color, 10, 0.85);
  }

  playImpact(x, y, color = COLORS.rose, scale = 0.7) {
    const fx = this.add.sprite(x, y, "impact-1").setTint(color).setScale(scale).setBlendMode(Phaser.BlendModes.ADD);
    this.fxLayer.add(fx);
    fx.play("impact-fx");
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  addSpark(x, y, color, count, power) {
    for (let i = 0; i < count; i += 1) {
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
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.audioCtx = new Ctx();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.42;
    this.masterGain.connect(this.audioCtx.destination);
  }

  tone(freq, duration = 0.08, type = "sine", gain = 0.05, delay = 0) {
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
    amp.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  startCombatMusic() {
    this.unlockAudio();
    if (!this.audioCtx || this.musicNodes) return;
    const bass = this.audioCtx.createOscillator();
    const pulse = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    bass.type = "triangle";
    pulse.type = "square";
    bass.frequency.value = 55;
    pulse.frequency.value = 110;
    gain.gain.value = 0.018;
    bass.connect(gain);
    pulse.connect(gain);
    gain.connect(this.masterGain);
    bass.start();
    pulse.start();
    this.musicNodes = { bass, pulse, gain };
  }

  stopCombatMusic(fade = true) {
    if (!this.musicNodes || !this.audioCtx) return;
    const { bass, pulse, gain } = this.musicNodes;
    const now = this.audioCtx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (fade ? 0.35 : 0.05));
    bass.stop(now + (fade ? 0.38 : 0.08));
    pulse.stop(now + (fade ? 0.38 : 0.08));
    this.musicNodes = null;
  }

  playEatSound() {
    this.tone(520, 0.06, "sine", 0.035);
    this.tone(760, 0.08, "triangle", 0.025, 0.045);
  }

  playUpgradeSound() {
    [330, 550, 880].forEach((freq, i) => this.tone(freq, 0.09, "triangle", 0.032, i * 0.045));
  }

  playHitSound() {
    this.tone(180, 0.05, "square", 0.018);
  }

  playHurtSound() {
    this.tone(150, 0.16, "sawtooth", 0.05);
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
}

const config = {
  type: Phaser.WEBGL,
  parent: "game",
  backgroundColor: "#05070b",
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: W,
    height: H,
  },
  render: {
    antialias: false,
    pixelArt: false,
    roundPixels: false,
    powerPreference: "high-performance",
  },
  resolution: TEXT_RESOLUTION,
  audio: {
    disableWebAudio: true,
  },
  scene: [SerpentLifeScene],
};

window.__SERPENT_LIFE__ = new Phaser.Game(config);
