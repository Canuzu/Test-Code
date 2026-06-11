#!/usr/bin/env python3
"""Static sanity checks for the Wildbound project (no Godot required).

Map + creature data are plain `const DATA` literals, so this script evaluates
them with ast.literal_eval and cross-checks the whole game without the engine:

  - every expected file exists
  - map rows rectangular + legal legend chars; warps point to existing maps and
    land on walkable cells; NPC/sign cells valid; sprite sheets exist
  - dialog ids referenced by maps exist in data/dialogs/*.json (and vice versa)
  - moves: unique ids, valid type/category, sane numbers, well-formed battle
    effects (stat stages / status conditions), status moves carry an effect
  - species: unique ids, valid types (1-2), 6 base stats, valid growth,
    learnset move ids exist, evolution targets exist, the three starter lines
    form clean 3-stage chains, a battle placeholder sprite exists
  - encounters: only on maps with tall grass (and vice versa), valid species,
    weights and level ranges
  - generated SVGs are well-formed XML

Exit code is non-zero if any check fails.
"""
import ast
import glob
import json
import os
import sys
import xml.dom.minidom as minidom

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Python mirror of TileDatabase LEGEND/WALKABLE — keep in sync.
WALKABLE = {
    ".": True, "g": True, "p": True, "s": True,
    "~": False, "T": False, "o": False, "*": True,
    "h": False, "H": False, "D": True, "S": False,
    "f": True, "W": False, "r": True, "t": False,
}

VALID_TYPES = {"pflanze", "feuer", "wasser", "erde", "luft",
               "blitz", "eis", "gift", "mystik", "bestie"}
VALID_CATEGORIES = {"physical", "special", "status"}
VALID_GROWTH = {"fast", "medium", "slow"}
# Mirror of Stats.IDS / StatusFx.DATA — keep in sync.
VALID_EFFECT_STATS = {"atk", "def", "spa", "spd", "spe"}
VALID_STATUSES = {"poison", "burn"}

START_MAP, START_CELL = "farnried", (9, 8)

STARTER_LINES = [
    ["mooskind", "farnax", "wurzeltitan"],
    ["funkwelp", "glutpirsch", "infernax"],
    ["troepfling", "bachhuter", "flutkoloss"],
]

EXPECTED = [
    "project.godot", "icon.svg",
    "src/main.gd", "src/main.tscn",
    "src/core/constants.gd", "src/core/direction.gd", "src/core/dialog_db.gd",
    "src/autoload/game_input.gd", "src/autoload/event_bus.gd",
    "src/autoload/game_state.gd", "src/autoload/save_manager.gd",
    "src/autoload/scene_manager.gd",
    "src/world/tile_database.gd", "src/world/tileset_builder.gd",
    "src/world/game_map.gd", "src/world/game_map.tscn",
    "src/world/maps/map_registry.gd",
    "src/world/entities/interactable.gd", "src/world/entities/sign_board.gd",
    "src/world/entities/npc.gd", "src/world/entities/npc.tscn",
    "src/player/grid_movement.gd", "src/player/player.gd", "src/player/player.tscn",
    "src/ui/dialog_box.gd", "src/ui/dialog_box.tscn",
    "src/ui/debug_hud.gd", "src/ui/team_panel.gd", "src/ui/team_panel.tscn",
    "src/creatures/stats.gd", "src/creatures/types.gd", "src/creatures/type_chart.gd",
    "src/creatures/growth.gd", "src/creatures/move_data.gd", "src/creatures/species_data.gd",
    "src/creatures/creature.gd", "src/creatures/move_database.gd",
    "src/creatures/species_database.gd",
    "src/creatures/data/moves_table.gd", "src/creatures/data/species_table.gd",
    "src/items/item_data.gd", "src/items/item_database.gd", "src/items/inventory.gd",
    "src/items/catch.gd", "src/items/data/items_table.gd",
    "src/ui/bag_panel.gd", "src/ui/shop_panel.gd",
    "src/world/entities/shop.gd",
    "src/battle/damage.gd", "src/battle/combatant.gd", "src/battle/status_fx.gd",
    "src/battle/battle_ai.gd", "src/battle/battle.gd", "src/battle/battle_scene.gd",
    "tools/test_battle.gd", "tools/test_battle.tscn",
    "assets/sprites/tiles/terrain_atlas.svg", "assets/sprites/player/player_sheet.svg",
]

errors = []


def literal_after_marker(path, marker="const DATA := "):
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    if marker not in text:
        errors.append(f"{os.path.relpath(path, ROOT)}: no DATA literal")
        return None
    try:
        return ast.literal_eval(text.split(marker, 1)[1].strip())
    except (ValueError, SyntaxError) as exc:
        errors.append(f"{os.path.relpath(path, ROOT)}: DATA not parseable: {exc}")
        return None


# --- world -------------------------------------------------------------------

def load_maps():
    maps = {}
    for path in sorted(glob.glob(os.path.join(ROOT, "src/world/maps/*.gd"))):
        if path.endswith("map_registry.gd"):
            continue
        data = literal_after_marker(path)
        if data is not None:
            maps[data["id"]] = data
    return maps


def load_dialog_ids():
    ids = set()
    for path in sorted(glob.glob(os.path.join(ROOT, "data/dialogs/*.json"))):
        with open(path, encoding="utf-8") as fh:
            try:
                data = json.load(fh)
            except json.JSONDecodeError as exc:
                errors.append(f"{os.path.basename(path)}: bad JSON: {exc}")
                continue
        for key, entry in data.items():
            if not isinstance(entry.get("pages"), list) or not entry["pages"]:
                errors.append(f"dialog '{key}': missing/empty pages")
            ids.add(key)
    return ids


def cell_ok(rows, x, y):
    return 0 <= y < len(rows) and 0 <= x < len(rows[y])


def walkable(rows, x, y):
    return cell_ok(rows, x, y) and WALKABLE.get(rows[y][x], False)


def check_encounters(map_id, data, rows, species_ids):
    enc = data.get("encounters")
    has_grass = any("g" in row for row in rows)
    if enc is None:
        if has_grass:
            errors.append(f"{map_id}: tall grass but no encounters table")
        return
    if not has_grass:
        errors.append(f"{map_id}: encounters defined but map has no tall grass")
    rate = enc.get("rate", 0)
    if not (isinstance(rate, (int, float)) and 0 < rate <= 1):
        errors.append(f"{map_id}: encounter rate {rate!r} not in (0, 1]")
    table = enc.get("table", [])
    if not table:
        errors.append(f"{map_id}: empty encounter table")
    for entry in table:
        sid = entry.get("species", "")
        if sid not in species_ids:
            errors.append(f"{map_id}: encounter species '{sid}' unknown")
        if not (isinstance(entry.get("weight"), int) and entry["weight"] > 0):
            errors.append(f"{map_id}: encounter '{sid}' needs an int weight > 0")
        levels = entry.get("levels", [])
        if (len(levels) != 2 or any(not isinstance(v, int) for v in levels)
                or not 1 <= levels[0] <= levels[1] <= 100):
            errors.append(f"{map_id}: encounter '{sid}' bad level range {levels}")


def check_map(map_id, data, all_maps, dialog_ids, used_dialogs, species_ids):
    rows = data.get("rows", [])
    if not rows:
        errors.append(f"{map_id}: no rows")
        return
    if len({len(r) for r in rows}) != 1:
        errors.append(f"{map_id}: rows not rectangular")
    for y, row in enumerate(rows):
        bad = set(row) - set(WALKABLE)
        if bad:
            errors.append(f"{map_id}: row {y} illegal chars {bad}")
    for warp in data.get("warps", []):
        target = warp.get("to_map", "")
        if target not in all_maps:
            errors.append(f"{map_id}: warp to unknown map '{target}'")
        for cx, cy in warp.get("cells", []):
            if not walkable(rows, cx, cy):
                errors.append(f"{map_id}: warp cell ({cx},{cy}) not walkable")
        if target in all_maps:
            tx, ty = warp.get("to_cell", [0, 0])
            if not walkable(all_maps[target]["rows"], tx, ty):
                errors.append(f"{map_id}: warp target ({tx},{ty}) in '{target}' not walkable")
    for npc in data.get("npcs", []):
        x, y = npc.get("cell", [0, 0])
        if not walkable(rows, x, y):
            errors.append(f"{map_id}: npc '{npc.get('id')}' cell not walkable")
        if not os.path.isfile(os.path.join(ROOT, f"assets/sprites/npcs/{npc.get('sheet','')}.svg")):
            errors.append(f"{map_id}: npc sheet missing: {npc.get('sheet')}.svg")
        used_dialogs.add(npc.get("dialog", ""))
        if npc.get("dialog", "") not in dialog_ids:
            errors.append(f"{map_id}: npc dialog '{npc.get('dialog')}' not found")
    for sign in data.get("signs", []):
        x, y = sign.get("cell", [0, 0])
        if not cell_ok(rows, x, y):
            errors.append(f"{map_id}: sign cell out of bounds")
        used_dialogs.add(sign.get("dialog", ""))
        if sign.get("dialog", "") not in dialog_ids:
            errors.append(f"{map_id}: sign dialog '{sign.get('dialog')}' not found")
    for shop in data.get("shops", []):
        x, y = shop.get("cell", [0, 0])
        if not walkable(rows, x, y):
            errors.append(f"{map_id}: shop '{shop.get('id')}' cell not walkable")
        if not os.path.isfile(os.path.join(ROOT, f"assets/sprites/npcs/{shop.get('sheet','')}.svg")):
            errors.append(f"{map_id}: shop sheet missing: {shop.get('sheet')}.svg")
        used_dialogs.add(shop.get("id", ""))
        if shop.get("id", "") not in dialog_ids:
            errors.append(f"{map_id}: shop dialog '{shop.get('id')}' not found")
        for item_id in shop.get("stock", []):
            if item_id == "":
                errors.append(f"{map_id}: shop '{shop.get('id')}' empty stock item")
    check_encounters(map_id, data, rows, species_ids)
    print(f"map ok: {map_id} ({len(rows[0])}x{len(rows)}, "
          f"{len(data.get('npcs', []))} npcs, {len(data.get('warps', []))} warps, "
          f"{len(data.get('encounters', {}).get('table', []))} encounter species)")


# --- creatures ---------------------------------------------------------------

def check_move_effect(m):
    eff = m.get("effect")
    if eff is None:
        if m["category"] == "status":
            errors.append(f"move '{m['id']}': status move without effect")
        return
    kind = eff.get("kind")
    if kind == "stat":
        if eff.get("stat") not in VALID_EFFECT_STATS:
            errors.append(f"move '{m['id']}': effect stat '{eff.get('stat')}' invalid")
        if eff.get("stages") not in (-2, -1, 1, 2):
            errors.append(f"move '{m['id']}': effect stages {eff.get('stages')!r} not in -2..2 (nonzero)")
        if eff.get("target") not in ("self", "enemy"):
            errors.append(f"move '{m['id']}': effect target '{eff.get('target')}' invalid")
    elif kind == "status":
        if eff.get("status") not in VALID_STATUSES:
            errors.append(f"move '{m['id']}': effect status '{eff.get('status')}' invalid")
        chance = eff.get("chance", 100)
        if not (isinstance(chance, int) and 1 <= chance <= 100):
            errors.append(f"move '{m['id']}': effect chance {chance!r} not in 1..100")
    else:
        errors.append(f"move '{m['id']}': effect kind '{kind}' invalid")


def check_creatures():
    moves = literal_after_marker(os.path.join(ROOT, "src/creatures/data/moves_table.gd"))
    species = literal_after_marker(os.path.join(ROOT, "src/creatures/data/species_table.gd"))
    if moves is None or species is None:
        return set()

    move_ids = set()
    for m in moves:
        if m["id"] in move_ids:
            errors.append(f"move '{m['id']}' duplicated")
        move_ids.add(m["id"])
        if m["type"] not in VALID_TYPES:
            errors.append(f"move '{m['id']}': bad type '{m['type']}'")
        if m["category"] not in VALID_CATEGORIES:
            errors.append(f"move '{m['id']}': bad category '{m['category']}'")
        if not (0 <= m.get("accuracy", 100) <= 100):
            errors.append(f"move '{m['id']}': accuracy out of range")
        if m["category"] == "status":
            if m.get("power", 0) != 0:
                errors.append(f"move '{m['id']}': status move must have power 0")
        elif m.get("power", 0) < 1:
            errors.append(f"move '{m['id']}': damaging move needs power >= 1")
        check_move_effect(m)

    species_ids = {s["id"] for s in species}
    dex_seen = set()
    for s in species:
        sid = s["id"]
        types = s.get("types", [])
        if not 1 <= len(types) <= 2 or any(t not in VALID_TYPES for t in types):
            errors.append(f"species '{sid}': bad types {types}")
        if len(s.get("base_stats", [])) != 6 or any(not isinstance(v, int) for v in s["base_stats"]):
            errors.append(f"species '{sid}': base_stats must be 6 ints")
        if s.get("growth", "medium") not in VALID_GROWTH:
            errors.append(f"species '{sid}': bad growth '{s.get('growth')}'")
        if s.get("dex") in dex_seen:
            errors.append(f"species '{sid}': duplicate dex {s.get('dex')}")
        dex_seen.add(s.get("dex"))
        for entry in s.get("learnset", []):
            if entry["move"] not in move_ids:
                errors.append(f"species '{sid}': learnset move '{entry['move']}' unknown")
        if not os.path.isfile(os.path.join(ROOT, f"assets/sprites/creatures/{sid}.svg")):
            errors.append(f"species '{sid}': battle sprite missing "
                          f"(run tools/gen_placeholder_art.py and add it to CREATURES)")
        evo = s.get("evolves_to", "")
        if evo:
            if evo not in species_ids:
                errors.append(f"species '{sid}': evolves_to unknown '{evo}'")
            if evo == sid:
                errors.append(f"species '{sid}': evolves into itself")
            if s.get("evolve_level", 0) <= 0:
                errors.append(f"species '{sid}': evolves_to set but evolve_level <= 0")

    by_id = {s["id"]: s for s in species}
    for line in STARTER_LINES:
        for stage_id in line:
            if stage_id not in by_id:
                errors.append(f"starter line: species '{stage_id}' missing")
        for a, b in zip(line, line[1:]):
            if by_id.get(a, {}).get("evolves_to") != b:
                errors.append(f"starter line: '{a}' should evolve to '{b}'")
        if by_id.get(line[-1], {}).get("evolves_to", ""):
            errors.append(f"starter line: final '{line[-1]}' should not evolve")

    print(f"creatures ok: {len(move_ids)} moves, {len(species_ids)} species, "
          f"{len(STARTER_LINES)} starter lines")
    return species_ids


def check_items():
    items = literal_after_marker(os.path.join(ROOT, "src/items/data/items_table.gd"))
    if items is None:
        return set()

    item_ids = set()
    for item in items:
        item_id = item["id"]
        if item_id in item_ids:
            errors.append(f"item '{item_id}' duplicated")
        item_ids.add(item_id)

        item_type = item.get("type", "")
        if item_type not in ("ball", "consumable", "key", "tm"):
            errors.append(f"item '{item_id}': bad type '{item_type}'")

        price = item.get("price", 0)
        if not (isinstance(price, int) and price >= 0):
            errors.append(f"item '{item_id}': price must be non-negative int, got {price!r}")

        effect = item.get("effect", {})
        if effect:
            action = effect.get("action", "")
            if action == "heal_hp":
                if "value" not in effect:
                    errors.append(f"item '{item_id}': heal_hp effect missing 'value'")
            elif action == "heal_full":
                pass  # no parameters needed
            elif action == "cure_status":
                status = effect.get("status", "")
                if status not in VALID_STATUSES:
                    errors.append(f"item '{item_id}': cure_status unknown '{status}'")
            elif action in ("", None):
                if item_type == "consumable":
                    errors.append(f"item '{item_id}': consumable without effect action")
            else:
                if item_type == "consumable":
                    errors.append(f"item '{item_id}': unknown effect action '{action}'")

            if item_type == "ball" and effect.get("catch_power"):
                if not isinstance(effect["catch_power"], (int, float)):
                    errors.append(f"item '{item_id}': catch_power must be number")

    print(f"items ok: {len(item_ids)} items")
    return item_ids


# --- assets ------------------------------------------------------------------

def check_svgs():
    paths = ["icon.svg", "assets/sprites/tiles/terrain_atlas.svg",
             "assets/sprites/player/player_sheet.svg"]
    paths += [os.path.relpath(p, ROOT)
              for p in glob.glob(os.path.join(ROOT, "assets/sprites/npcs/*.svg"))]
    paths += [os.path.relpath(p, ROOT)
              for p in glob.glob(os.path.join(ROOT, "assets/sprites/creatures/*.svg"))]
    for rel in paths:
        full = os.path.join(ROOT, rel)
        if not os.path.isfile(full):
            errors.append(f"missing svg: {rel}")
            continue
        try:
            minidom.parse(full)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"svg malformed: {rel}: {exc}")
    print(f"svg ok: {len(paths)} files")


def main():
    for rel in EXPECTED:
        if not os.path.isfile(os.path.join(ROOT, rel)):
            errors.append(f"missing file: {rel}")

    species_ids = check_creatures()
    item_ids = check_items()

    maps = load_maps()
    dialog_ids = load_dialog_ids()
    used_dialogs = set()

    if START_MAP not in maps:
        errors.append(f"start map '{START_MAP}' missing")
    elif not walkable(maps[START_MAP]["rows"], *START_CELL):
        errors.append(f"start cell {START_CELL} not walkable in '{START_MAP}'")

    for map_id, data in sorted(maps.items()):
        check_map(map_id, data, maps, dialog_ids, used_dialogs, species_ids)

    unused = dialog_ids - used_dialogs
    if unused:
        errors.append(f"dialog ids defined but never referenced: {sorted(unused)}")

    check_svgs()

    if errors:
        print("\nFAILED:")
        for e in errors:
            print("  - " + e)
        sys.exit(1)
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
