# V8 Audio Visual Overhaul

Version id: `v8-audio-visual-overhaul`

## Direction

V8 treats the project as a dark mythic 2D action roguelite, not a casual snake prototype.

Reference goals:

- Combat readability and ability language: Hades-level clarity.
- Dark ritual tone and material weight: Blasphemous / Darkest Dungeon.
- Luminous particles and environmental glow: Ori.
- Silhouette discipline: Hollow Knight.

The game should avoid cheap vector clipart, Flash-game gradients, generic fantasy snakes, pasted PNG effects, and unreadable high-detail noise.

## Asset Prompt Standard

All new generated assets should include:

- `premium 2D game asset`
- `dark mythic action roguelite`
- `top-down / 3-quarter combat readability`
- `transparent background`
- `clean alpha edge`
- `readable at 64-128 px on mobile`
- `not photorealistic, not cheap vector, not cartoon mascot`
- `designed as modular Phaser sprite asset`

Core serpent prompt:

```text
Premium 2D game asset for a dark mythic action roguelite, benchmark quality comparable to top-tier console indie games: Hades-level combat readability, Blasphemous-like dark ritual atmosphere, Ori-like luminous VFX layering.

Subject: modular serpent protagonist, top-down / 3-quarter game view, designed for real-time combat readability.

Visual direction: dark jade and antique gold scales, obsidian bone plates, glowing memory nodes embedded along the spine, elegant threatening silhouette, readable head direction, not cute, not cartoon, not flat mobile-game clipart.

Production requirements: transparent background, clean alpha edges, centered full-body asset, strong silhouette at small mobile size, no text, no watermark, no UI, no mockup background, no blur, no cropped body, no extra characters.

Material detail: hand-painted 2D, layered scales, subtle rim light, gold vein patterns, jade inner glow, readable head direction, body segments designed for modular animation.

Game integration: works as a sprite in Phaser, readable at 64-128 px on screen, separated visual masses for head, body, memory node, tail, compatible with additive VFX and dark arena background.

Negative: low-budget flash game, cheap vector, generic fantasy snake, plastic toy, blurry, noisy edge, photorealistic animal, childish mascot, over-detailed unreadable texture.
```

## VFX Standard

Each skill must have four stages:

1. Anticipation: visible charge, direction, or body-node activation.
2. Sustain: readable continuous state while the skill exists.
3. Impact: high-contrast hit spark, shock, or burst.
4. Dissolve: embers, smoke, shards, mist, or electric residue.

Fire is not a pasted circle. It should grow from serpent scale nodes, wrap the body in short arcs, then burst outward on ticks.

Lightning should read as chain energy: bright bolt texture, secondary thin arcs, and a short impact flash on target.

Ice should read as persistent terrain influence: frosted ground, mist, slowing particles, and shattering edges.

Shield should read as segmented armor orbiting the front half of the serpent, not a simple circle.

## Audio Standard

The BGM must be audible as a combat loop within 3 seconds of starting the game.

V8 replaces the weak ambience-style `bgm-empty-city.ogg` with `bgm-fast-fight.ogg`, a short battle loop.

Mix targets:

- Normal combat BGM volume: 0.34-0.40.
- Boss / low HP / overload pressure: up to 0.50.
- Pickup SFX: audible but not louder than combat rhythm.
- Hit SFX: short, crunchy, and lower priority than BGM continuity.

## V8 Imported Asset Notes

- `public/assets/free/v8-audio/bgm-fast-fight.ogg`
- `public/assets/generated/v8-open/vfx/fire/fire_circles_400x400.png`
- `public/assets/generated/v8-open/vfx/lightning/lightning3.png`

The imported VFX are used with additive blending and layered with existing procedural rings/particles so they become part of the serpent combat language instead of static pasted images.

## QA Additions

Smoke tests should verify:

- V8 fire and lightning textures load.
- Battle BGM asset exists and starts.
- BGM source path is `bgm-fast-fight.ogg`.
- Skill layer includes more children when fire/lightning are active.
- External deployment still serves audio and VFX assets from the version directory.
