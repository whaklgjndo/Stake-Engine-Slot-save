# Dual Wheel Environment Task Tickets

Structured for direct use in Jira, Linear, or an internal production board.

This document complements:

- `src/stories/data/dualWheelEnvironmentAssetPlan.ts`
- `src/stories/assets/ENVIRONMENT_ASSET_GUIDE.md`

The asset plan is the filename/source-of-truth manifest. This file is the work breakdown and implementation order.

---

## 1. Art: Environment And Board

### ART-01: Far Background Build

Objective: Establish distant environment with depth falloff.

Scope:

- jungle, cliffs, sky opening
- waterfall base layer
- foliage silhouettes
- haze pass

Deliverables:

- `bg_far.png`
- `bg_waterfalls.png`
- `bg_foliage_silhouette.png`
- `bg_haze.png`

Dependencies:

- none

Acceptance criteria:

- reads clearly at 50% opacity under blur
- no high-contrast focal points behind gameplay

### ART-02: Portal And Arch

Objective: Create the primary focal element and light source.

Scope:

- portal core and glow
- arch or temple frame
- optional distortion mask

Deliverables:

- `portal_core.png`
- `portal_glow.png`
- `portal_distortion_mask.png`
- `arch_frame.png`

Dependencies:

- `ART-01`

Acceptance criteria:

- portal remains legible behind the board at reduced opacity
- glow reads without washing out symbols

### ART-03: Slot Board

Objective: Replace the flat panel look with a physical altar.

Scope:

- stone base
- gold trim
- carved recesses
- ambient occlusion
- contact shadow

Deliverables:

- `board_base.png`
- `board_trim_gold.png`
- `board_cell_recess.png`
- `board_ao.png`
- `board_contact_shadow.png`

Dependencies:

- `ART-02`

Acceptance criteria:

- board reads as a 3D object without animation
- separation from the background is clear through shadow and contrast

### ART-04: Surface Detail Pass

Objective: Add realism and material breakup.

Scope:

- runes
- cracks
- moss
- wear

Deliverables:

- `board_runes.png`
- `board_damage_detail.png`
- `board_moss_overlay.png`

Dependencies:

- `ART-03`

Acceptance criteria:

- detail is visible at full size
- detail does not become noisy at gameplay scale

---

## 2. Art: Symbols And Cells

### ART-05: Cell Redesign

Objective: Replace flat cells with carved recesses.

Scope:

- cell base
- inner shadow
- win-state overlay

Deliverables:

- `cell_base.png`
- `cell_inner_shadow.png`
- `cell_win_glow.png`

Dependencies:

- `ART-03`

Acceptance criteria:

- cells feel embedded, not overlaid
- win state is readable without overpowering symbols

### ART-06: Symbol Lighting Variants

Objective: Align all symbols with the world lighting model.

Scope per symbol:

- base
- cool rim-light mask
- warm highlight mask
- win emissive pass

Dependencies:

- `ART-05`

Acceptance criteria:

- symbols remain legible at reel size
- lighting is consistent with portal and lantern directions

---

## 3. VFX

### VFX-01: Ambient Particles

Objective: Introduce continuous environmental motion.

Scope:

- dust
- pollen
- magical motes
- behind-board and front-of-board layers

Deliverables:

- `fx_particle_soft.png`
- `fx_particle_magic.png`

Dependencies:

- `ART-01`

Acceptance criteria:

- particles do not obscure symbol centers more than 10% of the time
- motion is slow and non-repetitive

### VFX-02: Portal Effects

Objective: Make the portal the active energy source.

Scope:

- pulse ring
- glow intensification
- distortion

Deliverables:

- `fx_portal_pulse.png`
- `portal_distortion_mask.png`

Dependencies:

- `ART-02`

Acceptance criteria:

- portal pulse is visible
- pulse does not exceed symbol luminance

### VFX-03: Event Effects

Objective: Tie world FX to gameplay outcomes.

Scope:

- win sparkles
- energy bursts
- highlight sweeps
- bonus flare

Deliverables:

- `fx_win_sparkle.png`
- `fx_energy_burst.png`
- `fx_bonus_flare.png`
- `fx_highlight_sweep.png`

Dependencies:

- `VFX-01`

Acceptance criteria:

- effects trigger on the right event types
- standard effects stay under 1.5 seconds

---

## 4. Animation

### ANIM-01: Portal Idle Loop

Objective: Create subtle continuous portal motion.

Scope:

- scale pulse from `1.00` to `1.02`
- opacity pulse
- distortion drift

Dependencies:

- `VFX-02`

Acceptance criteria:

- loop is seamless
- cycle length stays between 3 and 6 seconds

### ANIM-02: Environmental Motion

Objective: Bring the environment to life.

Scope:

- waterfall motion
- light ray drift
- particle drift

Dependencies:

- `ART-01`
- `VFX-01`

Acceptance criteria:

- motion is detectable within 3 seconds
- no obvious repetition within 10 seconds

### ANIM-03: Interaction Animations

Objective: Connect gameplay to the world.

Scope:

- spin start response
- reel stop response
- win, big win, and bonus response

Dependencies:

- `ANIM-01`
- `ANIM-02`
- `VFX-03`

Acceptance criteria:

- events fire within 100ms of gameplay state changes
- no dropped or overlapping sequences

---

## 5. Engineering

### ENG-01: Layered Rendering System

Objective: Implement the ordered scene stack.

Scope:

- background -> midground -> board -> FX -> post

Dependencies:

- `ART-01` through `ART-05`

Acceptance criteria:

- layer order is correct
- each layer has independent opacity and blur control

### ENG-02: Lighting System

Objective: Simulate environmental lighting on 2D content.

Scope:

- rim lighting
- additive glow passes
- blend modes

Dependencies:

- `ART-06`

Acceptance criteria:

- symbols respond to both portal and warm accent light
- no clipping or overexposure

### ENG-03: FX System

Objective: Manage particles and event-driven effects.

Scope:

- particle emitters
- event triggers
- layer assignment

Dependencies:

- `VFX-01`
- `VFX-03`

Acceptance criteria:

- stable FPS under heavy common FX load
- no leaks or infinite spawns

### ENG-04: Animation Controller

Objective: Centralize timing for idle, transition, and event animation.

Scope:

- idle loops
- event triggers
- transition states

Dependencies:

- `ANIM-01` through `ANIM-03`

Acceptance criteria:

- animations stay synchronized with gameplay state
- no visual or audio desync

### ENG-05: Post Processing

Objective: Apply the final cohesion layer.

Scope:

- bloom
- vignette
- color grading

Deliverables:

- `post_vignette.png`
- `colorgrade_teal_gold.cube`

Dependencies:

- all visual layers

Acceptance criteria:

- symbols remain readable after grading
- bloom does not bleed into gameplay clarity

---

## 6. Audio

### AUD-01: Ambient Soundscape

Objective: Establish environmental presence.

Scope:

- waterfall loop
- jungle ambience
- portal hum

Dependencies:

- none

Acceptance criteria:

- loops are seamless
- ambient mix stays below gameplay SFX

### AUD-02: Interaction SFX

Objective: Reinforce gameplay events.

Scope:

- spin
- reel stop
- symbol land
- win
- big win
- bonus

Dependencies:

- `ENG-04`

Acceptance criteria:

- trigger latency stays under 100ms
- no clipping or overlap distortion

---

## 7. QA

### QA-01: Visual Clarity Pass

Checks:

- symbol readability at all times
- no FX obscuring outcomes
- correct contrast hierarchy

### QA-02: Performance Pass

Checks:

- stable FPS on target devices
- particle count within budget
- no memory leaks

### QA-03: Immersion Validation

Checks:

- board reads as part of the world
- environment moves in idle
- portal acts as the primary light source
- the world responds to gameplay events

---

## 8. Recommended Sprint Breakdown

### Sprint 1

- `ART-01`
- `ART-02`
- `ART-03`
- `ENG-01`

### Sprint 2

- `ART-05`
- `ART-06`
- `ENG-02`
- `VFX-01`

### Sprint 3

- `VFX-02`
- `VFX-03`
- `ANIM-01`
- `ANIM-02`
- `ENG-03`

### Sprint 4

- `ANIM-03`
- `ENG-04`
- `ENG-05`
- `AUD-01`
- `AUD-02`

### Sprint 5

- `QA-01`
- `QA-02`
- `QA-03`
- polish and tuning

---

## 9. Technical Implementation Order

### Scene Architecture

Back to front:

1. far background
2. atmospheric layer
3. midground anchor
4. gameplay object
5. front FX

### Board Integration

The board should be treated as an environmental prop:

- stone base
- gold trim
- worn edges
- engraved rune channels
- contact shadow beneath the board
- ambient occlusion around the frame
- reflected portal light on upper edges

### Symbol Rendering Model

Every symbol should inherit:

- base material light
- cool portal-side rim light
- warm lantern-side accent light

### Portal System

The portal should function as:

- primary light emitter
- motion anchor
- win-feedback surface
- depth focal point

### Motion Design

Keep ambient motion:

- subtle
- long-looping
- low amplitude
- unsynchronized across systems

### Atmosphere And Depth

Farther layers should carry:

- less contrast
- less detail
- less saturation
- more haze

### Interaction Mapping

Event mapping target:

| Event      | Board                    | Portal                       | Environment             |
| ---------- | ------------------------ | ---------------------------- | ----------------------- |
| Idle       | subtle specular drift    | low pulse                    | particles drift         |
| Spin start | light sweep              | charge glow                  | faint wind motion       |
| Reel stop  | local settle flash       | brief flicker                | small particle response |
| Win        | symbol glow pulse        | brighter pulse               | fog/light reaction      |
| Big win    | emissive accents         | larger bloom pulse           | particle surge          |
| Bonus      | frame and runes activate | strong flare and color shift | whole scene intensifies |

### Production Phases

1. structural
2. lighting
3. atmosphere
4. motion
5. feedback
6. polish

---

## 10. Non-Negotiable Constraints

Protect:

- symbol readability
- reel legibility
- win-state visibility
- UX timing response

Avoid:

- overbright backgrounds
- FX crossing symbol silhouettes too often
- too much bloom
- muddy color contrast
- ambient motion that competes with outcomes

---

## 11. Final Acceptance Definition

The environment work is complete when:

- the slot board is perceived as a physical object embedded in the environment
- the portal behaves as the central light and energy source
- idle state shows continuous subtle motion
- gameplay events trigger coordinated environmental responses
- visual clarity is preserved under all effects

---

## 12. Immediate High-Impact Build Order

If only one short sprint ships first, do this:

1. replace the flat board frame with a stone-and-gold altar frame
2. place the glowing portal centered behind the reels
3. blur and darken the background heavily
4. add teal rim light and warm highlights to symbols
5. add particles in front of and behind the board
6. add a soft portal pulse on idle
