import { V13_BALANCE, V13_LEVELS, v13GrowthCost, v13SkillCost, v13SkillXpCost } from "../src/v13-balance.js";

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)))];
}

function weightedMemory(rand) {
  const entries = Object.entries(V13_BALANCE.memory).filter(([, v]) => typeof v === "object" && v.weight);
  const total = entries.reduce((sum, [, v]) => sum + v.weight, 0);
  let roll = rand() * total;
  for (const [id, spec] of entries) {
    roll -= spec.weight;
    if (roll <= 0) return { id, ...spec };
  }
  const [id, spec] = entries[0];
  return { id, ...spec };
}

function runOne(seed) {
  const rand = mulberry32(seed);
  const state = {
    t: 0,
    levelIndex: 1,
    levelElapsed: 0,
    segments: V13_BALANCE.initialSegments,
    mxp: 0,
    sxp: 0,
    choices: 0,
    heldCore: 0,
    lastCardAt: -999,
    hits: 0,
    deaths: 0,
    snapshots: {},
  };

  for (let second = 1; second <= 500; second += 1) {
    state.t = second;
    const level = V13_LEVELS[state.levelIndex] ?? V13_LEVELS[V13_LEVELS.length - 1];
    state.levelElapsed += 1;

    const levelPressure = Math.max(0, state.levelIndex - 1);
    const pickupRate = 0.56 + levelPressure * 0.08 + Math.min(0.22, state.choices * 0.025);
    const killRate = state.levelElapsed < level.enemyGraceMs / 1000 ? 0.05 : 0.26 + levelPressure * 0.08 + state.choices * 0.035;

    if (rand() < pickupRate) {
      const mem = weightedMemory(rand);
      state.mxp += mem.mxp;
      state.sxp += mem.sxp;
    }
    if (rand() < killRate) {
      state.sxp += rand() < 0.09 + levelPressure * 0.02 ? V13_BALANCE.rewards.eliteSxp : V13_BALANCE.rewards.killSxp;
    }

    while (state.mxp >= v13GrowthCost(state.segments) && state.segments < V13_BALANCE.maxSegments) {
      const cost = v13GrowthCost(state.segments);
      state.mxp -= cost;
      state.segments += 1;
    }

    const xpCost = v13SkillXpCost(state.choices, state.levelIndex - 1);
    if (state.sxp >= xpCost && state.heldCore < V13_BALANCE.skill.maxHeldCores) {
      state.sxp -= xpCost;
      state.heldCore += 1;
    }

    const canOpen = state.heldCore > 0 && second - state.lastCardAt >= V13_BALANCE.skill.minCardGapMs / 1000;
    const bodyCost = v13SkillCost(Math.min(5, 1 + Math.floor(state.choices / 2)));
    if (canOpen && state.segments - bodyCost >= V13_BALANCE.safeAfterSkillSegments) {
      state.segments -= bodyCost;
      state.choices += 1;
      state.heldCore -= 1;
      state.lastCardAt = second;
    }

    const inDanger = state.levelElapsed > level.enemyGraceMs / 1000 && rand() < 0.012 + levelPressure * 0.006 + Math.max(0, 24 - state.segments) * 0.0008;
    if (inDanger) {
      state.hits += 1;
      state.segments -= rand() < 0.75 ? V13_BALANCE.headHitSegments.enemy : V13_BALANCE.headHitSegments.elite;
      if (state.segments <= V13_BALANCE.deathSegments) {
        state.deaths += 1;
        state.segments = V13_BALANCE.initialSegments;
        state.mxp = 0;
        state.sxp = 0;
        state.heldCore = 0;
        state.lastCardAt = second;
      }
    }

    if (state.levelElapsed >= level.durationMs / 1000 && state.levelIndex < V13_LEVELS.length - 1) {
      state.levelIndex += 1;
      state.levelElapsed = 0;
      state.sxp += V13_BALANCE.rewards.bossPhaseSxp;
    }

    for (const target of V13_BALANCE.targets) {
      if (target.second === second) {
        state.snapshots[second] = { body: state.segments, choices: state.choices, deaths: state.deaths };
      }
    }
  }
  return state;
}

const runs = Array.from({ length: 1000 }, (_, i) => runOne(13000 + i * 17));
const report = {
  runs: runs.length,
  targets: V13_BALANCE.targets.map((target) => {
    const body = runs.map((run) => run.snapshots[target.second]?.body ?? run.segments);
    const choices = runs.map((run) => run.snapshots[target.second]?.choices ?? run.choices);
    const deaths = runs.map((run) => run.snapshots[target.second]?.deaths ?? run.deaths);
    const summary = {
      second: target.second,
      note: target.note,
      body: { p10: percentile(body, 0.1), p50: percentile(body, 0.5), p90: percentile(body, 0.9), target: [target.bodyMin, target.bodyMax] },
      choices: { p10: percentile(choices, 0.1), p50: percentile(choices, 0.5), p90: percentile(choices, 0.9), target: [target.choicesMin, target.choicesMax] },
      deaths: { p50: percentile(deaths, 0.5), p90: percentile(deaths, 0.9) },
    };
    summary.pass = summary.body.p50 >= target.bodyMin && summary.body.p50 <= target.bodyMax && summary.choices.p50 >= target.choicesMin && summary.choices.p50 <= target.choicesMax;
    return summary;
  }),
};

report.pass = report.targets.every((target) => target.pass);
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exit(1);
