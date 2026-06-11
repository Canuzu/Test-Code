# Wildbound — Architecture

Guiding principle: **small, single-responsibility modules** that communicate
through a global signal bus instead of hard references. This keeps systems
(world, player, UI, save, battle…) independent and individually testable as the
project grows.

## Layers

```
core/        Pure helpers & constants (Direction, DialogDb). No node deps.
autoload/    Always-on singletons (services & shared state).
world/       The overworld: tiles, map data, the generic map scene, entities.
player/      Player entity + reusable grid-movement component.
creatures/   Types, stats, moves/species data + databases, Creature model.
battle/      Battle engine (pure logic) + the code-built battle scene.
ui/          Dialog box, team panel, debug HUD (full menus arrive later).
data/        Designer-authored content (dialog JSON; .tres from M3 on).
```

## Scene tree at runtime

```
Main (src/main.tscn — the only "real" scene Godot ever runs)
├─ MapHost            ← SceneManager swaps GameMap instances in here
│  └─ GameMap         (generic scene; built from MapRegistry data by map_id)
│     ├─ Ground       (TileMapLayer; TileSet built in code)
│     ├─ CanvasModulate  (per-map ambient light)
│     ├─ Player       (camera child inside)
│     └─ NPCs / SignBoards (spawned from map data)
├─ UILayer (CanvasLayer)
│  ├─ DialogBox
│  ├─ TeamPanel
│  └─ DebugHud
├─ BattleLayer (CanvasLayer, above UI, below fade)
│  └─ BattleScene     ← instanced by Main per encounter, freed afterwards
└─ FadeLayer (CanvasLayer, top)
   └─ Fade (ColorRect; SceneManager tweens its alpha)
```

## Autoload singletons

| Singleton | Responsibility |
|---|---|
| `GameInput` | Registers input actions at runtime (layout-independent physical keys); exposes input helpers. |
| `EventBus` | Global signals (`player_moved`, `dialog_requested`, `map_changed`, …). The decoupling backbone. |
| `GameState` | All save-relevant runtime state + `to_dict()`/`apply_dict()`; tracks playtime. |
| `SaveManager` | JSON read/write to `user://saves`, slot metadata, version + migration hook. |
| `SceneManager` | Owns map transitions: fade → free old map → write spawn into GameState → instance generic map → fade in. Also re-enters maps on `game_loaded`. |

Load order: GameInput → EventBus → GameState → SaveManager → SceneManager.

## Maps are data, not scenes

Each area lives in `src/world/maps/<id>.gd` as a plain `const DATA` literal:
ASCII rows, ambient color, warps, NPCs, signs. `MapRegistry` maps id → data;
the one generic `game_map.tscn` renders whichever id `SceneManager` assigns.

Why a plain literal: `tools/verify_project.py` parses it *without Godot* and
cross-checks the world graph — row shapes, legend chars, warp targets (both
directions walkable), NPC cells, sheet files, and dialog references. CI-grade
safety with zero engine dependency.

**Adding an area:** new data file + one `MapRegistry` match arm + (optionally)
dialog JSON. No scene work.

## Movement, collisions & occupancy

One `GridMovement` component serves player **and** NPCs: it tweens between cell
centers and asks the map two questions — is the tile walkable (`walkable`
custom-data on the TileSet), and is the cell free (occupancy registry)?

While a mover travels it occupies **both** origin and target, releasing the
origin on arrival; movers can therefore never tween into the same cell or
visually overlap. Out-of-map cells are blocked. This stays deterministic and is
the base for tall-grass encounters, ledges and tile events later.

## Interaction & dialog flow

```
[E] pressed → Player computes faced cell → GameMap.get_interactable_at(cell)
  → Interactable.interact(player)
     NPC: turns toward player, EventBus.dialog_requested.emit(id)
     SignBoard: EventBus.dialog_requested.emit(id)
→ DialogBox (UI) looks the id up in DialogDb (data/dialogs/*.json),
  plays pages with a typewriter effect, advances/cancels on [E],
  emits dialog_opened / dialog_closed
→ Player + NPCs pause themselves on dialog_opened, resume on dialog_closed.
```

The DialogBox consumes the closing key press (`set_input_as_handled`), so a
dialog can never re-trigger itself in the same frame. No system in this chain
holds a reference to any other — everything routes through the EventBus.

## Warps (doors & edges)

Warp definitions in map data list trigger cells and a target
(map / cell / facing). `GameMap` listens to `player_moved`; stepping onto a
trigger calls `SceneManager.change_map(...)`. Doors (house entrance, exit mats)
and edge transitions (village ↔ route) are the same mechanism.

## Save system

Each slot is a self-describing JSON file with `version`, `saved_at`, a cheap
`metadata` header (name/location/playtime — for the future load screen) and the
full `state` from `GameState.to_dict()`. Loading emits `game_loaded`;
`SceneManager` then rebuilds the saved map and spawn — loading works across
maps by construction. `_migrate()` is the hook for future format upgrades.

## Conventions

- `class_name` for reusable types; `snake_case` files matching the class.
- Tabs for indentation (Godot default).
- Cross-system communication via `EventBus` signals.
- Keep files focused; split rather than grow a "god file".
- After editing map/dialog data: run `python3 tools/verify_project.py`.

## Creatures & data (Milestone 3)

```
src/creatures/
├─ types.gd / stats.gd / growth.gd   # enums, names, formulas (pure helpers)
├─ type_chart.gd                     # effectiveness multipliers
├─ move_data.gd / species_data.gd    # typed Resource definitions
├─ move_database.gd / species_database.gd  # lazy id -> Resource lookups
├─ creature.gd                       # a live instance (stats/EXP/evolution)
└─ data/
   ├─ moves_table.gd                 # const DATA = [ ... ] (pure literal)
   └─ species_table.gd               # const DATA = [ ... ] (pure literal)
```

**Why data tables + typed Resources (not hand-authored .tres).** The content
lives as plain `const DATA` literals (like maps), so `tools/verify_project.py`
validates the entire roster — typing, 6-stat arrays, learnset move ids,
evolution chains, the three starter lines — *without Godot*. At load, the
databases build typed `MoveData` / `SpeciesData` **Resource** objects, so the
rest of the game still works against engine-integrated resources, and designers
can author `.tres` in the editor later via the same classes. See DECISIONS D13.

**Runtime shape.** `Creature` (RefCounted) holds `species_id`, level, EXP, IVs,
current HP, status, and ≤4 move ids. Stats are computed on demand from the
species base stats (`Stats.calc`). `gain_exp()` resolves level-ups, which grow
HP, learn level-up moves, and trigger evolution — each announced on the
`EventBus` (`creature_leveled`, `creature_evolved`). The party is
`GameState.party: Array[Creature]`, serialized with the rest of the save, so
loading restores the full team. The team panel and debug HUD only listen to the
EventBus and read `GameState`.

This is the data spine the battle system (M4) plugs into: `TypeChart`,
`MoveData.category/power`, and `Creature.stat()` are exactly the inputs a damage
formula needs.

## Battle system (Milestone 4)

```
src/battle/
├─ damage.gd        # static damage formula (STAB, crit, spread, burn penalty)
├─ status_fx.gd     # Gift/Brand data: chip damage, immunities, texts, tags
├─ combatant.gd     # Creature + volatile battle state (stat stages, PP)
├─ battle_ai.gd     # weighted move choice for wild creatures
├─ battle.gd        # the turn engine (RefCounted, no nodes)
└─ battle_scene.gd  # full-screen UI, built in code at 320x180
```

**Flow.** `GameMap` rolls its `encounters` table when the player steps on tall
grass and emits `encounter_started(wild)`. `Main` pauses the overworld
(`MapHost.process_mode = DISABLED`), instances `BattleScene` into the
BattleLayer and emits `battle_started` (player, team panel, and debug HUD lock
themselves). When the scene emits `battle_ended(outcome)`, Main frees it,
resumes the map — and on a loss runs the blackout: full-heal + warp to the
village start.

**Engine ↔ UI contract.** `Battle` resolves one player decision at a time
(`choose_move/switch/flee/replacement`) and returns an ordered list of event
dictionaries (`text`, `hp`, `faint`, `switch`, `refresh`). The scene plays them
back (typewriter, HP tweens, sprite swaps), then checks `battle.phase` to show
the next menu (CHOOSE → action menu, REPLACE → forced team menu, DONE →
fade-out + `battle_ended`). The engine never touches nodes and takes an
injectable RNG, so `tools/test_battle.tscn` runs whole seeded battles headless.

**What persists.** HP and status conditions live on `Creature` (and therefore
in saves); stat stages and PP are per battle (see DECISIONS D16). EXP is
awarded in-battle; level-ups, learned moves and evolutions surface as battle
text through the same `EventBus` signals the team panel already listens to.
