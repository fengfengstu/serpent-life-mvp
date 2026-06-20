# V5 HD Art/VFX Pass

Version id: `v5-hd-art-vfx`

## Goal

Respond to the V4 quality gap by replacing low-resolution runtime slices with a more aggressive HD asset pass. This version focuses on clarity, anti-aliased illustration rendering, and visible skill VFX, especially the fire ring.

## New Assets

Raw GPT-image assets are archived under:

`public/assets/generated/v5-hd/raw/`

Runtime assets are processed under:

`public/assets/generated/v5-hd/processed/`

Runtime sizes:

| Group | Size |
| --- | --- |
| Serpent head/body/memory/tail | 512x512 each |
| Skill VFX fire/frost/shield/lightning | 512x512 each |
| Enemy drifter/hunter/bloomer/boss | 512x512 each |
| Arena floor | 2048x2048 |

## Runtime Changes

- Replaced V3 serpent modules with V5 HD serpent sprites.
- Replaced V4 skill VFX sprites with V5 HD skill sprites.
- Replaced V2 enemy/Boss animation placeholders with V5 HD enemy silhouettes.
- Replaced arena tile with a 2048 dark archive floor.
- Enabled renderer antialiasing for painterly AI assets.
- Reduced the old procedural snake spine line so it no longer reads as a rectangle.
- Promoted skill visuals above the snake layer and made fire ring stronger.
- Added fire ember particles around fire ring pulses.

## QA Notes

`scripts/qa-smoke.mjs` now checks:

- V5 textures are loaded.
- V5 source textures are 512x512 or 2048x2048 for arena.
- All five skills render into the skill layer.
- Touch joystick, upgrade flow, death/retry flow, and UI overflow still pass.
- Canvas DPR backing-store status is reported. Phaser `RESIZE` currently keeps canvas backing equal to CSS size, so true engine-level 2x supersampling remains a future architecture pass.
