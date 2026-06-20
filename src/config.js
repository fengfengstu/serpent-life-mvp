export const GAME_CONFIG = {
  arena: 3000,
  maxFrameDelta: 34,
  initialCoreHp: 3,
  initialSegments: 3,
  maxSegments: 25,
  segmentGap: 18,
  baseSpeed: 188,
  baseTurnRate: 7.2,
  turnRateDecay: 0.022,
  turnRateFloor: 4.15,
  inputDeadZone: 7,
  joystickRadius: 56,
  joystickFollowRadius: 72,
  headRadius: 17,
  bodyRadius: 13,
  magnetRadius: 118,
  invulnMs: 1100,
  lethalProtectionMs: 30000,
  buildPauseCooldownMs: 650,
  foodSpawnMs: 680,
  skillDropMs: 12000,
  enemySpawnMs: 1180,
  bossSpawnMs: 135000,
  bossSpawnKills: 54,
  bossHp: 360,
  settlementHardCapMs: 20000,
};

export const COLORS = {
  ink: 0x05070b,
  abyss: 0x080b0d,
  panel: 0x101820,
  line: 0x274152,
  cyan: 0x61efff,
  acid: 0xa7ff65,
  gold: 0xffd166,
  ember: 0xff7043,
  frost: 0x7ce6ff,
  rose: 0xff5f91,
  violet: 0x9d7dff,
  red: 0xff3b4f,
  white: 0xf4fbff,
  slate: 0x8da0a8,
};

export const SKILLS = [
  {
    id: "fire",
    name: "火焰光环",
    icon: "火",
    theme: "flame",
    text: "蛇身节点周期性爆出火环，清理贴身怪潮。",
  },
  {
    id: "frost",
    name: "冰冻轨迹",
    icon: "冰",
    theme: "frost",
    text: "尾迹留下冰雾，减速并蚕食追兵。",
  },
  {
    id: "turret",
    name: "弹射炮台",
    icon: "炮",
    theme: "tech",
    text: "蛇身节点自动发射弹丸，在怪群间弹射。",
  },
  {
    id: "shield",
    name: "旋转护盾",
    icon: "盾",
    theme: "guard",
    text: "蛇头周围生成护盾星，近身敌人会被切开。",
  },
  {
    id: "lightning",
    name: "闪电链",
    icon: "雷",
    theme: "voltage",
    text: "电弧寻找最近敌人，并向附近目标跳跃。",
  },
];

export const ENEMY_KINDS = {
  drifter: { name: "饥影", hp: 2, radius: 18, speed: 92, score: 18 },
  hunter: { name: "裂牙", hp: 4, radius: 21, speed: 128, score: 36 },
  bloomer: { name: "瘤核", hp: 7, radius: 26, speed: 72, score: 64 },
};

export const LIFE_TEMPLATES = [
  {
    cause: "greed",
    theme: "flame",
    text: "它生来只有三颗心，却把每一次吞噬都当成火种。第{stage}波时，{combo}照亮了半个巢穴；可它仍把头探向更深处。最终，贪婪没有熄灭它，只是把它烧成了一段被记住的蛇生。",
  },
  {
    cause: "greed",
    theme: "frost",
    text: "这条蛇沿着自己的冰痕前行，越长越安静，也越不肯回头。它在第{stage}波拾起{memory}，又为了下一枚记忆越过安全线。死亡来得很轻，像霜落在蛇首上。",
  },
  {
    cause: "greed",
    theme: "tech",
    text: "炮火替它开路，弹跳的光点替它计算风险。可它最后一次选择不是计算，而是多吃一口。第{stage}波后，{combo}仍在回响，它却已经把命门交给了怪潮。",
  },
  {
    cause: "swarmed",
    theme: "guard",
    text: "它曾用旋转的盾守住蛇首，也用身体替世界划出边界。第{stage}波时，怪潮从四面合拢，它没有后退，只把最后一段记忆护在身后。沉默之后，鳞光仍慢慢亮起。",
  },
  {
    cause: "swarmed",
    theme: "voltage",
    text: "电光在它的脊骨上奔跑，像一串不肯断开的念头。它击碎了{kills}只敌影，却没能在第{stage}波找到空隙。最后的闪电没有杀敌，只照见了它曾经走过的弯路。",
  },
  {
    cause: "boss",
    theme: "flame",
    text: "它终于抵达终点 Boss 面前，火环绕身，记忆如炭。那一战里，{combo}短暂撕开了巨影。可三颗心终有尽头，它倒下时没有退缩，只把一生烧成了最后的光。",
  },
  {
    cause: "boss",
    theme: "frost",
    text: "Boss 的影子压住了巢穴，它却用冰痕一寸寸量过战场。第{stage}波之后，{memory}还挂在蛇身中段。它没能通关，但死亡很干净，像一条冻结的归路。",
  },
  {
    cause: "boss",
    theme: "tech",
    text: "它带着炮台和电弧闯到终点，把自己的身体排成一座移动阵地。Boss 还剩{bossHp}%生命时，蛇首被击中。胜利只差一点，于是遗憾也显得格外锋利。",
  },
  {
    cause: "victory",
    theme: "guard",
    text: "这条蛇没有把贪婪交给深渊。它用护盾守住三颗心，用长身记下每一次选择，最终穿过 Boss 的残影。结局安静落下时，它不是怪物，而是一段完整走完的蛇生。",
  },
  {
    cause: "victory",
    theme: "voltage",
    text: "它把闪电藏进骨节，把每一次吞噬变成下一次前进。终点 Boss 倒下时，第{stage}波的回声仍在远处。它活着抵达结尾，却依旧安静，因为一生从不因胜利而变轻。",
  },
  {
    cause: "timeout",
    theme: "flame",
    text: "它在火光、冰雾与怪潮之间撑得太久，久到巢穴都开始记住它的路径。第{stage}波后，蛇身已近极限。死亡不是突然来临，而是这段贪婪终于写完了最后一行。",
  },
  {
    cause: "default",
    theme: "default",
    text: "这条蛇吃下{memory}，长出新的身体，也长出新的风险。它击碎{kills}只敌影，在第{stage}波停下。没有人能说它失败，因为每一节发光的身体，都曾是它认真活过的证据。",
  },
];

export const MEMORY_LINES = [
  "第一枚记忆在蛇首后方亮起。",
  "它学会了用身体承载火力。",
  "一段冰冷的尾迹留在怪潮中。",
  "炮台在蛇身中段醒来。",
  "护盾绕着命门旋转。",
  "闪电从一节身体跳向下一节。",
  "它曾在危险区多贪了一口。",
  "它听见 Boss 从巢穴深处回应。",
  "它差一点就选择回头。",
  "最后一颗心跳得很轻。",
];
