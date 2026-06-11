# Wildbound

A 2D monster-catching RPG built in **Godot 4** (GDScript), inspired by the feel
of classic handheld RPGs but with an entirely original world, creatures, and
story.

- **Setting:** Nature & Elements — forests, volcanoes, oceans; creatures rooted
  in animals, plants, and the elements.
- **Tone:** mature & atmospheric.
- **Worldbuilding:** the journey starts in the mist-bound village of
  **Farnried**; the city of **Verdania** waits beyond the blocked road north.

> **Status — Milestone 4:** battle system — turn-based wild battles in tall
> grass · classic damage formula (STAB/crit/type chart) · stat stages ·
> Gift/Brand status conditions that persist after battle · switch & flee ·
> EXP with in-battle level-ups, move learning and evolution · blackout on
> defeat · battle UI with HP/EXP bars and menus · headless engine tests.
> *(M1: skeleton, grid movement, tilemap, camera, collisions, save scaffold.
> M2: NPCs, dialog, multi-map world with transitions, scene manager.
> M3: types/stats/moves/species data system, party in saves, team panel.)*

## Controls

| Action | Keys |
|---|---|
| Move (tile-by-tile) | `W A S D` / Arrow keys |
| Sprint | `Shift` |
| Talk / read / interact | `E` / `Enter` / `Space` |
| Team overview | `T` (close with `Esc`) |
| **Battle:** navigate menus / confirm / back | Arrows or `WASD` / `E` / `Esc` |
| Quick save / load | `F5` / `F9` *(debug, not during battles)* |
| **Debug:** add starter / give EXP | `1` `2` `3` / `L` |

## Run it

1. Install **Godot 4.3+** (standard build, not .NET): <https://godotengine.org/download>
2. Open the Godot Project Manager → **Import** → choose this folder's `project.godot`.
3. Press **F5 / Play**. Main scene: `src/main.tscn`.

On first import, Godot generates `.godot/` and `*.svg.import` files (git-ignored).

**Try it:** press `1`/`2`/`3` to add the Pflanze/Feuer/Wasser starters, then
walk into the **tall grass** in Farnried or north on Moospfad — wild battles
trigger (Nebelmotte, Glimmkäfer, Steinpicker). Fight with type advantages in
mind, watch EXP/level-ups/evolutions happen mid-battle, switch members, poison
wears your team down until you flee or win — and if you black out, you wake up
back in Farnried, fully healed. The team panel (`T`) shows persistent HP and
status; quick-save keeps it all.

## Project structure

```
wildbound/
├─ project.godot
├─ assets/sprites/{player,npcs,tiles}/   # SVG placeholder art (tools/)
├─ data/dialogs/                         # dialog content as JSON
├─ docs/                                 # ARCHITECTURE / ROADMAP / DECISIONS
├─ src/
│  ├─ main.gd / main.tscn                # root: map host, UI/battle layers, screen fade
│  ├─ autoload/                          # game_input · event_bus · game_state · save_manager · scene_manager
│  ├─ core/                              # constants · direction · dialog_db
│  ├─ creatures/                         # types · stats · type_chart · growth · move/species data + databases · creature
│  │  └─ data/                           # moves_table · species_table (pure data literals)
│  ├─ battle/                            # damage · status_fx · combatant · battle_ai · battle (engine) · battle_scene (UI)
│  ├─ player/                            # player · grid_movement (player & NPCs)
│  ├─ world/                             # game_map · maps/ · entities/ · tile_database · tileset_builder
│  └─ ui/                                # dialog_box · team_panel · debug_hud
└─ tools/                                # gen_placeholder_art.py · verify_project.py · test_battle (headless engine tests)
```

## Tech & conventions

- **Engine:** Godot 4.3+, **GL Compatibility** renderer; 320×180, 16px tiles,
  integer scaling, nearest filter.
- **Movement/collisions:** one shared `GridMovement` (player + NPCs) with cell
  occupancy; per-tile `walkable` flag, no physics for terrain.
- **Content as data:** maps, dialogs, **moves & species, encounter tables** are
  plain data (literals / JSON) validated by `tools/verify_project.py` without
  Godot; battle-engine tests run headless via
  `godot --headless res://tools/test_battle.tscn`.
- **Creatures:** typed `Resource` classes (`MoveData`, `SpeciesData`) built from
  the data tables; six-stat model; `Creature` handles stats/EXP/evolution.
- **Battles:** UI-independent event-stream engine (`Battle`) with injectable
  RNG; HP/status persist after battle, stat stages and PP do not.
- **Saves:** versioned JSON in `user://saves`, including the full party.
- **Autoloads:** `GameInput`, `EventBus`, `GameState`, `SaveManager`, `SceneManager`.
- **Style:** small modules; systems talk via `EventBus`, never hard references.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — module map & data flow
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — milestone plan
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — design & tech decision log

## License / assets

All code and assets are original to this project. License: **TBD**.
