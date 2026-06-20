# V7 Art Direction Spike

Version id: `v7-art-direction`

## Decision

V6 proved that Defold HTML5/WASM can run, but its visual result was not acceptable as a product-facing art pass. The assets looked pasted together: serpent illustration, fire PNG, frost PNG, and enemy art did not share one visual language.

V7 is a more aggressive art-direction spike. It uses a standalone high-DPI Canvas renderer and draws the core game procedurally so the serpent, enemies, pickups, skills, and arena share the same shape, line, glow, and color rules.

## Scope

- Standalone HTML Canvas build, no Phaser or Defold runtime.
- True high-DPI backing store: 390 CSS px renders to 780 canvas px on DPR 2 screens.
- No imported gameplay PNGs for the main scene.
- Unified palette: dark teal arena, jade/gold serpent, amber memory, magenta enemies, cyan frost, ember fire.
- Skills are generated from serpent motion:
  - Fire is a glowing spine ribbon plus node pulses.
  - Frost is a trailing cold mist field.
  - Lightning is represented by memory-node energy and future bolt hooks.
- Growth has visible meaning through longer body, more pickup pull, stronger body contact, and stronger skill density.
- Boss phase is gated by time/kills and has HP plus projectiles.

## Known Spike Limits

- This is a visual direction prototype, not the full GDD implementation.
- UI is intentionally minimal.
- Audio and upgrade-card systems are not ported into this standalone renderer yet.
- The next production pass should either port this visual language back into the main game or continue the custom Canvas route with the complete GDD loop.
