# V11 Pale Cathedral Asset Validation

## Locked Art Direction

Direction B, "Pale Cathedral Monsters", is the selected enemy and pickup direction for V11.

This is not final integration approval. It only locks the visual route: pale bone, cathedral metal, restrained crimson curse energy, and gold pickups. Every asset must still pass in-game scale, silhouette, transparency, contrast, and animation checks.

## Size Ratio Spec

All sizes below are intended display heights in the game view, not source PNG dimensions.

| Asset | Role | Display Height | Collision Radius | Frequency | Readability Requirement |
| --- | --- | ---: | ---: | --- | --- |
| bone-shard-skitterer | Small swarm enemy | 40 px | 15 px | Very common | Must read as a small jagged ground threat, not a pickup. |
| winged-lance-bat | Fast narrow chaser | 48 px | 18 px | Common | Wider silhouette and red core must remain visible while moving fast. |
| tower-shield-brute | Slow tank | 72 px | 26 px | Uncommon | Must look heavier than other normal enemies at a glance. |
| floating-bishop-mage | Ranged caster | 64 px | 23 px | Uncommon | Staff/crimson focus must stand out because it telegraphs enemy skills. |
| elite-cathedral-serpent | Elite / mini-boss | 112 px | 42 px | Rare | Must never be spawned as a normal mob; needs a health bar when active. |
| amber-soul-chip | Small XP | 24 px | 11 px | Common | Gold/amber only; no teal, no red. |
| golden-rune-crystal | Medium XP | 34 px | 14 px | Occasional | Brighter than small XP, but not visually louder than enemies. |
| blessed-memory-gem | High-value XP | 44 px | 18 px | Rare | Must be readable from one screen away as a reward, not a projectile. |

## Gameplay Ratio Rules

1. Enemy size follows role, not concept art detail. Common swarm units stay small even if the source drawing contains more ornament.
2. Pickups must be smaller than enemies but brighter and cleaner. They signal value through gold hue and gentle pulse, not size.
3. Elite enemies are at least 1.5x the height of the largest normal enemy and must have a UI health bar.
4. Fast enemies should be narrower, with strong motion contrast. Tanks should be visibly wider and slower.
5. All enemy attacks use crimson or hostile white. Player, XP, and skill colors cannot reuse the enemy red core.
6. Collision radius is intentionally smaller than the visible sprite. Spikes and ornaments can pass close without feeling unfair.

## Validation Gates

Before V11 game integration, this set must pass:

- Actual transparent PNG assets display without green fringe, hard crop edges, or clipped tips.
- Mobile-size preview still distinguishes enemy, pickup, player head, and body.
- Debug collision rings line up with apparent threat volume.
- All sprites render at 1x CSS scale without blurry enlargement.
- Idle motion does not make small enemies look like rewards.
- Elite scale reads as a special event, not a large normal enemy.

## Current Decision

Proceed with Direction B for practical validation, but do not integrate directly into V11 until the validation page is approved.
