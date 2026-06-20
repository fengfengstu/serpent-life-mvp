# V6 Defold Spike

Version id: `v6-defold-spike`

## Decision

This is the first actual engine-switch branch. V5 improved Phaser art and VFX, but it did not change the rendering stack. V6 validates Defold as a parallel HTML5 game build.

## Scope

The Spike implements a single playable combat arena:

- Defold 1.12.4 Bob HTML5/WASM build.
- Local portable OpenJDK 25 toolchain, ignored from source control.
- 390x844 portrait display with `high_dpi = 1`.
- V5 HD serpent, enemy, skill, and arena assets reused through a Defold atlas.
- Mouse/touch drag and keyboard direction input.
- Serpent head movement and 12-segment body follow.
- Memory pickups that increase length and upgrade fire/frost pacing.
- Enemy swarm pursuit and contact damage.
- Fire ring pulses and frost trail fields.
- Shield and lightning visual identity.
- Death state with tap/space restart.

## Verified Differences From Phaser V5

- Defold HTML5 canvas renders at high-DPI backing store locally: 390 CSS px maps to 780 canvas px.
- The Defold bundle is about 18 MB before publish polish, much smaller than the Phaser V5 published directory.
- The scene runs as a true Defold/WASM export, not a Phaser skin.

## Known Spike Limits

- No polished HUD yet.
- Upgrade cards are simplified into automatic fire/frost progression.
- No full Boss encounter.
- The default Defold HTML shell needs publish-time polish to remove the footer.
- This is a migration decision Spike, not a final replacement of the Phaser branch.

