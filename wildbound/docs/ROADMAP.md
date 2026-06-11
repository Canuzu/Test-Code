# Wildbound — Roadmap

Milestones are vertical slices: each one ends with something runnable. We build
**one milestone at a time**.

## ✅ M1 — Overworld foundation
Project skeleton · runtime input · grid player controller (4-dir + sprint) ·
code-built TileSet + ASCII demo map · follow camera (smoothing, integer scale) ·
tile-based collisions · JSON save scaffold (quick save/load) · placeholder art.

## ✅ M2 — World & interaction
NPCs with wander AI + cell occupancy · `interact` action · data-driven dialog
system (JSON, typewriter box) · signs · three connected maps (Farnried,
Moospfad, elder's house) with door/edge warps · SceneManager with screen fade ·
per-map ambient light · camera limits per map · world-graph verifier.

## ✅ M3 — Creatures & data
10 elemental types + effectiveness chart · six-stat model (phys/special split) ·
19 moves and 12 species (three 3-stage starter lines + wild species) as typed
Resources built from verifiable data tables · stat/EXP/level-up/learnset/
evolution logic · party model persisted in saves · team overview panel · roster
validation in the verifier. *(Scales toward the 150+ target via more data.)*

## ✅ M4 — Battle system
Turn-based wild battles from tall-grass encounter tables · event-driven battle
engine (UI-independent, seeded & headless-testable) · classic damage formula
with STAB/crit/spread · stat stages · Gift/Brand status conditions (persist
after battle) · priority + initiative turn order · switch/flee · EXP with
in-battle level-ups, move learning and evolution · blackout flow · battle UI
(HP/EXP bars, typewriter log, action/move/team menus) · generated creature
placeholder sprites · battle/encounter validation in verifier + engine tests.

## ✅ M5 — Catching & items *(current)*
Pokéball types with catch rate formula · item data (balls, consumables, effects) ·
inventory system (99-stack limits, persisted in saves) · catch mechanics (four-shake
roll, status modifiers, wild capture after victory) · bag UI (overworld item use,
creature healing/status cure) · shop system (NPC merchants, purchase flow, money
management) · 7-item starter stock (3 ball types + 3 healing items) · complete M4
battle integration (CATCH phase, item selection, success/failure flow).

## M6 — Trainers
Trainer classes · line-of-sight detection · battle AI · rewards/rematches.

## M7 — UI & menus
Main menu · team overview · bag UI · save/load screen · pause menu · settings.

## M8 — Audio
Music manager with area-based tracks & crossfade · SFX bus · battle/town/route
themes.

## M9 — Quests & progression
Quest/flag system · story beats · regions & gated progression (e.g. **Verdania**).

## M10 — Content & polish
Fill the creature roster (150+), routes/towns/caves, balancing, transitions,
save-format hardening, export builds (Windows/Linux/Mac).

> Scope note: 150+ creatures and a full region are deliberately back-loaded —
> the systems (M3–M4) must be solid and data-driven before mass content.
