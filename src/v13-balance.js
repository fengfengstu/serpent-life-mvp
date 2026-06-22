export const V13_LEVELS = [
  {
    id: "tutorial",
    name: "教学关：残忆洞穴",
    shortName: "教学",
    durationMs: 90000,
    bossSpawnMs: 65000,
    enemyGraceMs: 30000,
    protectionMs: 90000,
    firstSkillCoreMs: 32000,
    enemyCapBase: 2,
    enemyCapGrowth: 0.35,
    enemySpawnMs: 1850,
    bossId: "tutorial_husk",
  },
  {
    id: "level1",
    name: "第一关：灰林边境",
    shortName: "灰林",
    durationMs: 150000,
    bossSpawnMs: 120000,
    enemyGraceMs: 7000,
    protectionMs: 12000,
    firstSkillCoreMs: 36000,
    enemyCapBase: 5,
    enemyCapGrowth: 1.2,
    enemySpawnMs: 1220,
    bossId: "memory_warden",
  },
  {
    id: "level2",
    name: "第二关：断塔墓园",
    shortName: "断塔",
    durationMs: 155000,
    bossSpawnMs: 115000,
    enemyGraceMs: 6000,
    protectionMs: 9000,
    firstSkillCoreMs: 30000,
    enemyCapBase: 8,
    enemyCapGrowth: 1.65,
    enemySpawnMs: 980,
    bossId: "crimson_molt",
  },
  {
    id: "level3",
    name: "第三关：无冠王庭",
    shortName: "王庭",
    durationMs: 180000,
    bossSpawnMs: 120000,
    enemyGraceMs: 5000,
    protectionMs: 7000,
    firstSkillCoreMs: 28000,
    enemyCapBase: 11,
    enemyCapGrowth: 2.05,
    enemySpawnMs: 840,
    bossId: "archivist_idol",
  },
];

export const V13_BALANCE = {
  initialSegments: 12,
  maxSegments: 56,
  deathSegments: 3,
  safeAfterSkillSegments: 5,
  emergencyMoltSegments: 4,
  headHitSegments: {
    enemy: 2,
    elite: 3,
    boss: 5,
    bossHeavy: 6,
  },
  crackLimit: 3,
  bodyCrackSegmentLoss: 1,
  headInvulnMs: 1250,
  bodyHitCooldownMs: 820,
  postCardProtectionMs: 1800,
  skillCorePickupRadius: 28,
  memory: {
    baseGrowCost: 5,
    growCostPerSegments: 2,
    growCostStep: 6,
    small: { mxp: 1, sxp: 1, weight: 72 },
    clear: { mxp: 3, sxp: 1, healCracks: 1, weight: 18 },
    warm: { mxp: 5, sxp: 1, healCracks: 1, weight: 6 },
    compressed: { mxp: 8, sxp: 2, weight: 3 },
    overload: { mxp: 0, sxp: 10, overload: 1, weight: 1 },
  },
  skill: {
    baseCost: 30,
    costPerChoice: 10,
    costPerLevel: 4,
    minCardGapMs: 60000,
    maxHeldCores: 2,
    fieldCoreLimit: 1,
    firstCoreFallbackMs: 44000,
    coreSpawnMinDistance: 260,
    coreSpawnMaxDistance: 460,
    costsByLevel: [2, 3, 4, 5, 7],
    highTierStartsAtLevel: 4,
  },
  rewards: {
    killSxp: 1,
    eliteSxp: 8,
    bossPhaseSxp: 10,
    triangleSxp: 3,
    circleSxp: 6,
  },
  targets: [
    { second: 30, bodyMin: 16, bodyMax: 18, choicesMin: 0, choicesMax: 0, note: "技能进度接近满格" },
    { second: 60, bodyMin: 18, bodyMax: 22, choicesMin: 1, choicesMax: 1, note: "第一次构筑成立" },
    { second: 180, bodyMin: 23, bodyMax: 29, choicesMin: 3, choicesMax: 4, note: "Boss1 已解决或濒死" },
    { second: 300, bodyMin: 28, bodyMax: 36, choicesMin: 5, choicesMax: 6, note: "Boss2 已解决或濒死" },
    { second: 480, bodyMin: 32, bodyMax: 45, choicesMin: 7, choicesMax: 8, note: "最终 Boss 结束段" },
  ],
};

export function v13GrowthCost(segments) {
  return V13_BALANCE.memory.baseGrowCost + Math.floor(Math.max(0, segments - V13_BALANCE.initialSegments) / V13_BALANCE.memory.growCostStep) * V13_BALANCE.memory.growCostPerSegments;
}

export function v13SkillCost(level) {
  const index = Math.max(0, Math.min(V13_BALANCE.skill.costsByLevel.length - 1, level - 1));
  return V13_BALANCE.skill.costsByLevel[index];
}

export function v13SkillXpCost(choiceCount, levelIndex = 0) {
  return V13_BALANCE.skill.baseCost + choiceCount * V13_BALANCE.skill.costPerChoice + levelIndex * V13_BALANCE.skill.costPerLevel;
}

export function v13LevelById(id) {
  return V13_LEVELS.find((level) => level.id === id) ?? V13_LEVELS[1];
}
