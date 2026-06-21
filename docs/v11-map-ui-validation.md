# V11 Map And UI Validation

## Purpose

This pass validates the map and UI layer before integrating V11 gameplay. It uses real PNG assets and actual screen placement rather than concept-poster mockups.

## Map Direction

The map stays in the selected Pale Cathedral route. Each chapter should be readable through floor color temperature and rune pattern, not through heavy UI labels.

| Stage | Visual Key | Gameplay Read |
| --- | --- | --- |
| Tutorial | Cool blue stone, clear rings | Safe learning space, low enemy pressure |
| Chapter 1 | Pale brass stone | Baseline combat arena |
| Chapter 2 | Ember red bands | Higher enemy density and aggressive waves |
| Chapter 3 | Violet curse bands | Casters, elites, and boss pressure |

## UI Components

| Component | Rule |
| --- | --- |
| Body / life meter | Shows body segments as life and spendable skill fuel. No heart icons. |
| Experience bar | Shows current purification progress and next skill-bead pressure. |
| Boss bar | Hidden outside boss/elite events. Must be wide and red when visible. |
| Skill slots | Icons must read at 36-44 px. Fancy frame cannot overpower the symbol. |
| Skill bead cards | Large enough for mobile tapping; text needs a solid reading plate and overflow clamp. Add a level corner badge and rarity color frame. Choice can be rejected to save body length. |
| Joystick | Must be local to touch start in game. Validation only checks opacity and style. |

## Skill Card Rarity And Level Rules

Skill cards should express upgrade value in three parallel ways:

- Level badge: top-right `Lv1` to `Lv5`.
- Rarity label: top-left short text, such as common / uncommon / rare / epic / legendary in the final localized copy.
- Rarity color: gray, green, blue, purple, gold. This is the preferred final scale because it matches familiar action RPG loot language.

The prototype currently validates green, blue, and purple. Gold should be reserved for rare high-cost choices and boss/event rewards.

## Rejection Rules

- Reject if HUD covers the player or boss warning area on mobile.
- Reject if any UI element depends on low-opacity text for critical state.
- Reject if skill icons become decorative circles instead of recognizable fire, ice, shield, fang, magnet, speed, lightning, orbit, spear.
- Reject if the map is so busy that XP pickups or small enemies disappear. Small tile seams and scratches must stay low contrast.
- Reject if any skill card title, description, or cost text spills out of its designated reading area.
- Reject if level, rarity, title, effect, and cost cannot be read at mobile size.
- Reject if boss bar appears before a boss/elite event.

## Current Notes

The old V9 HUD is not suitable because it is a screenshot-like combined image and includes obsolete map/enemy content. The new UI sheet is suitable for component validation, but some generated joystick fragments are not final game assets.
