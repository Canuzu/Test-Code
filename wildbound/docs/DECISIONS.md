# Wildbound — Decision Log

Lightweight ADR-style record of *why* things are the way they are. Newest at the
bottom. Each entry: decision · rationale · alternatives considered.

## D1 — World setting: Nature & Elements
**Decision:** Original world themed around nature and the elements (forests,
volcanoes, oceans; creatures from animals/plants/elements).
**Rationale:** Broadest creative range, most asset-friendly to produce, and
closest to the classic feel while staying fully original.
**Alternatives:** Steampunk, Cosmic/Sci-Fi, Mythology.

## D2 — Movement: grid / tile-locked
**Decision:** Player moves one 16px tile at a time, tweened between cell centers.
**Rationale:** Authentic classic-RPG feel; simplifies collisions, tile events,
and the future encounter system.
**Alternatives:** Free 8-direction pixel movement (more complex collisions/events).

## D3 — Pixel style: 16px tiles @ 320×180, integer scaling
**Decision:** 16px tiles, 320×180 base resolution, integer scale mode, nearest
texture filter, GL Compatibility renderer.
**Rationale:** Crisp retro GBA/DS look, lots of visible world, broad PC support.
**Alternatives:** 32px detailed tiles (more work per asset, less world on screen).

## D4 — Repository: private, standalone project named "Wildbound"
**Decision:** Wildbound lives in its own private repository, separate from any
other project. *Verdania* is reserved as an in-game town name.
**Rationale:** Clean, independent history for a brand-new game.
**Note:** The initial scaffold was developed in an isolated environment and
delivered as an archive to seed the new repository (the environment could not
create/push a new repo directly).

## D5 — Data format: hybrid (JSON saves + Resources for static data)
**Decision:** Save games as human-readable, versioned JSON in `user://saves`;
static design data (creatures, moves, items) as Godot `.tres` Resources.
**Rationale:** Saves stay debuggable and robust; static data gets engine
integration and type-safety. Best of both.
**Alternatives:** All-JSON (less type-safe) · all-Resources (saves hard to
inspect/diff).

## D6 — Tone: mature & atmospheric
**Decision:** Slightly more serious themes, deeper story, stronger mood; muted
palette (reflected already in the dusk `CanvasModulate` and tile colors).
**Rationale:** Differentiates the game and matches the intended audience.
**Alternatives:** Family-friendly/classic light tone.

## D7 — Code-built TileSet + ASCII demo map (M1)
**Decision:** Build the `TileSet` (with a `walkable` custom-data layer) in code
and paint a hand-authored ASCII map, instead of editor-authored `.tres`.
**Rationale:** Avoids fragile hand-edited resource files early; maps stay
readable as text. Migration to editor-authored maps is isolated behind
`GameMap`'s small API.
**Alternatives:** Author TileSet/maps in the Godot editor now (heavier, harder to
hand-verify without the editor).

## D8 — Collisions via tile walkability (not physics)
**Decision:** Terrain collisions use a per-tile `walkable` flag; out-of-map =
blocked. No physics bodies for terrain.
**Rationale:** Deterministic, cheap, and the natural base for tall-grass
encounters, ledges, and tile-triggered events. NPCs will register occupied cells
later.
**Alternatives:** StaticBody/physics tilemap collisions (heavier, less suited to
grid logic).

## D9 — Maps are data files + one generic map scene
**Decision:** Areas live as plain `const DATA` literals (ASCII rows, warps,
NPCs, signs, ambient) in `src/world/maps/`; a single generic `game_map.tscn`
renders any of them via `MapRegistry`. `SceneManager` swaps instances inside the
persistent Main scene.
**Rationale:** New content without scene work; text-diffable maps; and the
plain-literal constraint lets `tools/verify_project.py` validate the entire
world graph (warp targets, NPC cells, dialog refs) without Godot.
**Alternatives:** One authored scene per map (heavier, fragile .tscn diffs, no
static verification).

## D10 — Dialog: JSON content + EventBus-driven UI
**Decision:** Dialog text lives in `data/dialogs/*.json` (explicit file list in
`DialogDb`); anything can open a dialog by emitting
`EventBus.dialog_requested`. The DialogBox announces `dialog_opened/closed`,
and player/NPCs pause themselves on those signals.
**Rationale:** Content stays out of code and is localization-ready; emitters
and the UI never reference each other; the explicit file list avoids
res:// directory-scan issues in exported builds.
**Alternatives:** .tres dialog resources (clunkier for prose), direct
player→UI references (coupling).

## D11 — Shared GridMovement with dual-cell occupancy
**Decision:** Player and NPCs use the same `GridMovement`; while moving, a body
occupies origin AND target cell, releasing the origin on arrival. The map keeps
the occupancy registry next to tile walkability.
**Rationale:** One movement implementation to maintain; movers can never tween
into the same cell or visually overlap — deterministic, like the classics.
**Alternatives:** Physics bodies (overkill, frame-dependent), target-only
reservation (allows brief visual overlap).

## D12 — Game text in German for now
**Decision:** Dialog content is written in German; UI/debug strings and all
code/docs stay English. Localization is planned (dialog ids are already
language-neutral keys).
**Rationale:** The design owner writes/reviews German fastest; swapping the
JSON values for translated files later is mechanical.
**Alternatives:** English-first content (harder for the owner to review tone).

## D13 — Static creature data as code tables → typed Resources (refines D5)
**Decision:** Moves and species are authored as plain `const DATA` literals in
`src/creatures/data/`, then built into typed `MoveData` / `SpeciesData`
**Resource** objects by their databases at load. Type ids / categories / growth
rates are string keys in the data, mapped to enums in code.
**Rationale:** Keeps D5's intent (typed, engine-integrated static data) while
avoiding hand-authored `.tres` webs that can't be verified without the Godot
editor. The literal form lets `tools/verify_project.py` check the whole roster
(typing, stat arrays, learnsets, evolution chains, starter lines) in CI. The
`Resource` classes remain, so `.tres` authoring in-editor is still possible
later. Consistent with D7 (code-built TileSet) and D9 (maps as data).
**Alternatives:** Hand-authored `.tres` per move/species (fragile cross-refs, no
static verification) · pure JSON (loses typed Resource integration).

## D14 — Six-stat model, ~10 types, classic starter triangle
**Decision:** KP/Angriff/Verteidigung/Sp.-Angriff/Sp.-Verteidigung/Initiative
with physical/special/status move categories; a compact 10-type roster
(Pflanze, Feuer, Wasser, Erde, Luft, Blitz, Eis, Gift, Mystik, Bestie); and a
Pflanze→Feuer→Wasser starter triangle, each a 3-stage evolution line.
**Rationale:** Proven depth for balancing and evolutions; a 10-type chart is
readable and tunable; the triangle is instantly understood and exercises the
evolution system fully.
**Alternatives:** Five-stat (less tactical depth) · 15+ types (heavier balancing)
· an original starter triad (fresher but less legible).

## D15 — Battle engine as an event stream, decoupled from the UI
**Decision:** `Battle` (RefCounted) resolves each player decision synchronously
and returns a list of plain event dictionaries (`text`, `hp`, `faint`,
`switch`, `refresh`); `BattleScene` only plays these back. The engine takes an
injectable `RandomNumberGenerator`.
**Rationale:** The whole battle flow is testable headless with a seeded RNG
(`tools/test_battle.tscn`) and the UI stays dumb — trainer battles (M6) and
animations later only extend the event vocabulary, not the flow. Damage math
(`Damage`), conditions (`StatusFx`) and wild-AI (`BattleAI`) are separate,
stateless modules for the same reason.
**Alternatives:** UI-driven battle state machine (untestable without rendering)
· signal-per-effect (ordering between text and animation becomes implicit).

## D16 — What persists after a battle (and what doesn't)
**Decision:** Current HP and status conditions live on `Creature` and persist
into the overworld and saves (the save format already carried both fields).
Stat stages reset on every switch-in; **PP is per battle** (refilled when the
next battle starts). Defeat = classic blackout: full-heal + warp to the village
start (heal stations arrive with items/quests). Moves learned on level-up fill
empty slots only; a replace dialog comes with the catching/UI milestones.
**Rationale:** Persistent HP/status keeps grass routes risky without yet having
healing items (M5); per-battle PP avoids growing the save format and a
PP-restore economy before items exist — Verzweifler still prevents stalling.
**Alternatives:** Persistent PP (classic, but meaningless without items) ·
full heal after each battle (removes route attrition entirely).

## D17 — Encounters are part of the map literal
**Decision:** Wild encounters are an `"encounters"` block (rate + weighted
species table with level ranges) inside each map's `const DATA`, rolled by
`GameMap` when the player steps on tall grass; the battle starts via
`EventBus.encounter_started` and Main hosts the battle scene above the paused
overworld. The battle UI itself is built in code at 320x180 (no .tscn layout).
**Rationale:** Consistent with D9 — the verifier cross-checks encounter species,
weights, level ranges, and that grass and tables only appear together. Code-built
UI follows D7: loops place repeated controls (menus, bars) more reliably than
hand-edited scene files.
**Alternatives:** Global encounter config per region (less local tuning) ·
hand-authored battle scene (hard to verify, fragile diffs).
