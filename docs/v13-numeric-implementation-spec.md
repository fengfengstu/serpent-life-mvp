# V13 Numeric Implementation Spec

This is the implementation-sized version of the ChatGPT Web report in `reports/2026-06-22-v13-numeric-design.md`.

## Product Goal

V13 freezes the current visual direction and rebuilds the rules. The core loop is no longer "avoid enemies and occasionally pick a card"; it is:

`eat memory -> grow body -> spend body for skills -> survive with a shorter but stronger snake -> regrow -> face a boss`.

## P0 Rules

- Body length is the primary life/resource display.
- Initial body length is `12`; death threshold is below `3`.
- Head hits remove body segments. Body hits add cracks; three cracks remove one body segment.
- Eating memory grants `MXP` for growth and `SXP` for skill-core progress.
- Growth is not one pickup per segment. Next segment cost is `4 + floor((segments - 12) / 6) * 2`.
- Skill cards only open after picking up a field skill core.
- A skill core is generated when `SXP >= 12 + choices * 4 + highestOfferedLevel * 2`.
- Skill card cost by target level is `[2, 3, 4, 5, 7]` body segments.
- Paying for a skill cannot reduce body below `5`; if insufficient, the card is visible but blocked.
- Boss rewards are positive and do not cost body.

## Flow

- Menu offers Tutorial and First Level.
- Completion of tutorial is saved in `localStorage`; returning players default to First Level but may replay tutorial.
- Tutorial lasts 75-90 seconds and teaches movement, memory growth, body damage, one skill core, and a small boss.
- Formal levels: Level 1, Level 2, Level 3. Each has a boss and advances after boss defeat.

## Opening Safety

- Tutorial: no harmful enemies before 30 seconds.
- Formal levels: no enemies before 5-7 seconds.
- First spawned enemies must be outside the visible comfort zone, not next to the head.
- Protection window prevents early death but still shows feedback.

## Verification Targets

| Time | Body | Skill Choices | Notes |
| --- | --- | --- | --- |
| 30s | 16-18 | 0 | skill progress almost full |
| 60s | 18-22 | 1 | first build choice made |
| 180s | 23-29 | 3-4 | Boss 1 solved or nearly solved |
| 300s | 28-36 | 5-6 | Boss 2 solved or nearly solved |
| 480s | 32-45 | 7-8 | final boss endgame |

## Implementation Order

1. Shared balance constants in `src/v13-balance.js`.
2. `scripts/simulate-v13.mjs` for curve validation.
3. Game run state: `mxp`, `sxp`, `heldSkillCores`, `levelId`, `levelElapsedMs`, `tutorialCompleted`.
4. Memory growth and skill-core generation.
5. Body-based damage and HUD changes.
6. Menu level selection and tutorial completion.
7. Safe spawning and three-level boss progression.
8. QA smoke assertions for V13 economy, tutorial/menu, opening safety, boss damage.
