# Dual Wheel Environment Asset Guide

This folder now contains the production scaffold for the environmental slot build.

## Active Asset Root

- `src/stories/assets/background`
- `src/stories/assets/midground`
- `src/stories/assets/board`
- `src/stories/assets/cells`
- `src/stories/assets/symbols`
- `src/stories/assets/fx`
- `src/stories/assets/audio`
- `src/stories/assets/post`

## Current State

The live workshop already simulates part of the environment in code:

- portal pulse and glow
- atmosphere haze
- particle motion
- altar contact shadow
- altar perspective tilt
- cool/warm symbol relighting

What is still missing is the production art and audio set that will replace those placeholders with authored assets.

## Source Of Truth

The filename and milestone manifest lives in:

- `src/stories/data/dualWheelEnvironmentAssetPlan.ts`

The task breakdown and implementation order lives in:

- `src/stories/assets/ENVIRONMENT_TASK_TICKETS.md`

Use that file as the canonical list for:

- required filenames
- milestone ownership
- current asset status
- production ordering

Use the task ticket doc as the canonical list for:

- discipline ownership
- build sequence
- acceptance criteria
- sprint slicing

## Drop Rules

1. Use the exact filenames from the manifest.
2. Keep background and midground assets separated so depth can be animated independently.
3. Keep altar layers separated into base, trim, recess, AO, and contact shadow.
4. Keep FX sparse and soft. Do not create dense overlays that hide symbol centers.
5. Do not move the current live symbol files yet unless the imports are intentionally migrated.

## Migration Notes

The current live symbol set still sits in the legacy flat asset root:

- `symbol-*.png`
- `blue-wheel-symbol.png`
- `red-dual-wheel-symbol.png`

Those are still runtime sources today. The new `symbols/` folder is the target production home for the art-backed migration, not yet the active import path.

## Immediate Sprint Target

Priority order for the next real art pass:

1. `background/bg_far.png`
2. `midground/arch_frame.png`
3. `midground/portal_core.png`
4. `midground/portal_glow.png`
5. `board/board_base.png`
6. `board/board_trim_gold.png`
7. `board/board_cell_recess.png`
8. `board/board_contact_shadow.png`
9. `fx/fx_particle_soft.png`
10. `audio/amb_portal_hum_loop.wav`

If only one milestone ships first, it should be `Milestone 1 - Structural Read`.
