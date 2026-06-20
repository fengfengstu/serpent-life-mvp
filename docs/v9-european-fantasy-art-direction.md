# V9 European Fantasy Art Direction

## Decision

V9 moves away from the previous dark-gold noisy fantasy direction. The chosen route is:

**European parchment tactical fantasy**

This means adventure-map readability, tabletop RPG token clarity, warm medieval stone, clean spell cards, and bestiary-like enemies. The target is not horror and not a dark dungeon mood.

## Rejected Prompt Direction

Avoid these terms in generation prompts:

- dark
- grimdark
- gothic horror
- blackened dungeon
- gritty
- noisy detail
- ornate dark-gold filigree
- hyper-detailed texture

These words push the model toward speckled surfaces and old V5/V8 visual DNA.

## Preferred Prompt Direction

Use:

- European high fantasy
- tabletop RPG adventure
- Dungeons-and-Dragons-like adventuring party readability
- medieval bestiary
- parchment tactical board-game assets
- warm stone dungeon
- spell cards
- clean ink outlines
- broad silhouettes
- low-noise painterly tokens
- mobile-readable top-down sprites

## Reviewed Routes

1. Classic RPG adventure painting  
   Strong fantasy feel, but slightly too close to traditional cover art and less modular.

2. Medieval illuminated manuscript  
   Very distinct, but too card-like and less suitable for kinetic combat.

3. Fairy-tale adventure book  
   Clean and readable, but too soft for roguelike combat pressure.

4. Modern tabletop RPG game assets  
   Strong game language, but drifted back toward noisy dark fantasy.

5. Parchment tactical board-game  
   Selected. Best balance of European fantasy, low noise, clear sprite separation, UI consistency, and Phaser implementation practicality.

## Runtime Asset Rule

Generated direction sheets are not used as whole-screen backgrounds. They are cropped into runtime assets under:

`public/assets/generated/v9-euro/`

V9 gameplay still uses Phaser primitives for hit flashes and combat readability, but the primary character/enemy/Boss/UI assets should come from the V9 European fantasy namespace.
