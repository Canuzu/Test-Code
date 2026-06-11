#!/usr/bin/env python3
"""Generate placeholder SVG art for Wildbound (Milestones 1-4).

Re-runnable and dependency-free. Produces crisp, pixel-aligned art:
  - assets/sprites/tiles/terrain_atlas.svg   (64x64, 4x4 cells, 16px tiles)
  - assets/sprites/player/player_sheet.svg   (64x16, frames: down,up,left,right)
  - assets/sprites/npcs/npc_*.svg            (recolored character sheets)
  - assets/sprites/creatures/<id>.svg        (48x48 battle placeholders)
  - icon.svg                                 (64x64 project icon)

These are intentionally simple stand-ins with a muted, "mature & atmospheric"
palette. Replace them with final art later without touching any game code.
The atlas layout MUST match TileDatabase.COORDS; the creature list MUST cover
every species id in src/creatures/data/species_table.gd (the verifier checks).
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rect(x, y, w, h, fill):
    return f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>'


def svg(width, height, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" shape-rendering="crispEdges">\n'
        + "\n".join(body)
        + "\n</svg>\n"
    )


# --- terrain tiles (one function per tile, drawing at offset ox,oy) ----------

def grass(ox, oy):
    return [
        rect(ox, oy, 16, 16, "#3e5e3a"),
        rect(ox + 3, oy + 4, 2, 2, "#46693f"),
        rect(ox + 10, oy + 9, 2, 2, "#46693f"),
        rect(ox + 12, oy + 3, 1, 1, "#365230"),
        rect(ox + 5, oy + 12, 1, 1, "#365230"),
    ]


def tall_grass(ox, oy):
    out = [rect(ox, oy, 16, 16, "#2f4a2c")]
    for bx in (2, 6, 10, 13):
        out.append(rect(ox + bx, oy + 4, 1, 8, "#3a5a34"))
        out.append(rect(ox + bx + 1, oy + 7, 1, 5, "#25401f"))
    return out


def path(ox, oy):
    return [
        rect(ox, oy, 16, 16, "#6e5d44"),
        rect(ox + 2, oy + 3, 2, 1, "#7d6a4e"),
        rect(ox + 9, oy + 6, 2, 1, "#7d6a4e"),
        rect(ox + 5, oy + 11, 2, 1, "#5f5039"),
        rect(ox + 12, oy + 12, 1, 1, "#5f5039"),
    ]


def sand(ox, oy):
    return [
        rect(ox, oy, 16, 16, "#b3a06a"),
        rect(ox + 3, oy + 5, 2, 1, "#c2b07a"),
        rect(ox + 10, oy + 4, 1, 1, "#c2b07a"),
        rect(ox + 7, oy + 11, 2, 1, "#a3915d"),
    ]


def water(ox, oy):
    return [
        rect(ox, oy, 16, 16, "#2f4d6e"),
        rect(ox + 1, oy + 4, 7, 1, "#3c5d82"),
        rect(ox + 9, oy + 9, 6, 1, "#3c5d82"),
        rect(ox + 4, oy + 12, 5, 1, "#284461"),
    ]


def tree(ox, oy):
    out = grass(ox, oy)
    out += [
        rect(ox + 7, oy + 11, 2, 4, "#3b2a1d"),
        rect(ox + 2, oy + 1, 12, 11, "#243a20"),
        rect(ox + 3, oy + 2, 4, 3, "#2f4a29"),
        rect(ox + 9, oy + 6, 4, 3, "#1c2f18"),
    ]
    return out


def rock(ox, oy):
    out = grass(ox, oy)
    out += [
        rect(ox + 3, oy + 6, 10, 8, "#565c62"),
        rect(ox + 5, oy + 4, 6, 3, "#565c62"),
        rect(ox + 4, oy + 5, 3, 2, "#6c727a"),
        rect(ox + 9, oy + 10, 3, 3, "#3f444a"),
    ]
    return out


def flowers(ox, oy):
    out = grass(ox, oy)
    for (fx, fy, col) in [(3, 4, "#8a4a4a"), (10, 6, "#6a4a7a"), (6, 11, "#9a7a3a")]:
        out += [
            rect(ox + fx, oy + fy, 2, 2, col),
            rect(ox + fx, oy + fy + 2, 2, 1, "#2f4a2c"),
        ]
    return out


def house_wall(ox, oy):
    out = [rect(ox, oy, 16, 16, "#4a3a2c")]
    for ly in (4, 8, 12):
        out.append(rect(ox, oy + ly, 16, 1, "#3a2d22"))
    out += [
        rect(ox + 3, oy + 2, 2, 1, "#564434"),
        rect(ox + 11, oy + 6, 2, 1, "#564434"),
        rect(ox + 6, oy + 10, 2, 1, "#564434"),
    ]
    return out


def house_roof(ox, oy):
    out = [rect(ox, oy, 16, 16, "#4a4a58")]
    for ly in (5, 10):
        out.append(rect(ox, oy + ly, 16, 1, "#3c3c48"))
    out += [
        rect(ox, oy, 16, 2, "#585868"),
        rect(ox + 4, oy + 6, 2, 1, "#585868"),
        rect(ox + 10, oy + 12, 2, 1, "#585868"),
    ]
    return out


def door(ox, oy):
    out = house_wall(ox, oy)
    out += [
        rect(ox + 3, oy + 2, 10, 14, "#2c2018"),
        rect(ox + 4, oy + 3, 8, 13, "#4a3826"),
        rect(ox + 5, oy + 4, 2, 10, "#54402c"),
        rect(ox + 9, oy + 4, 2, 10, "#54402c"),
        rect(ox + 11, oy + 9, 1, 2, "#b09a50"),
    ]
    return out


def sign_tile(ox, oy):
    out = grass(ox, oy)
    out += [
        rect(ox + 7, oy + 8, 2, 6, "#3b2a1d"),
        rect(ox + 2, oy + 2, 12, 7, "#6a5232"),
        rect(ox + 3, oy + 3, 10, 5, "#7a6240"),
        rect(ox + 4, oy + 4, 8, 1, "#594830"),
        rect(ox + 4, oy + 6, 6, 1, "#594830"),
    ]
    return out


def floor_wood(ox, oy):
    out = [rect(ox, oy, 16, 16, "#5e4a36")]
    for ly in (4, 8, 12):
        out.append(rect(ox, oy + ly, 16, 1, "#4e3c2c"))
    out += [
        rect(ox + 5, oy + 1, 1, 3, "#4e3c2c"),
        rect(ox + 11, oy + 5, 1, 3, "#4e3c2c"),
        rect(ox + 3, oy + 9, 1, 3, "#4e3c2c"),
        rect(ox + 9, oy + 13, 1, 3, "#4e3c2c"),
    ]
    return out


def wall_inner(ox, oy):
    out = [rect(ox, oy, 16, 16, "#3a3340")]
    out += [
        rect(ox + 5, oy, 1, 13, "#423a4a"),
        rect(ox + 11, oy, 1, 13, "#423a4a"),
        rect(ox, oy + 13, 16, 3, "#2c2630"),
    ]
    return out


def rug(ox, oy):
    out = [rect(ox, oy, 16, 16, "#5a3a3a")]
    out += [
        rect(ox + 1, oy + 1, 14, 1, "#7a4a4a"),
        rect(ox + 1, oy + 14, 14, 1, "#7a4a4a"),
        rect(ox + 1, oy + 1, 1, 14, "#7a4a4a"),
        rect(ox + 14, oy + 1, 1, 14, "#7a4a4a"),
        rect(ox + 6, oy + 6, 4, 4, "#6a4444"),
        rect(ox + 7, oy + 7, 2, 2, "#7a5050"),
    ]
    return out


def table(ox, oy):
    out = floor_wood(ox, oy)
    out += [
        rect(ox + 2, oy + 10, 2, 4, "#5a4430"),
        rect(ox + 12, oy + 10, 2, 4, "#5a4430"),
        rect(ox + 1, oy + 2, 14, 8, "#7a5c3e"),
        rect(ox + 1, oy + 2, 14, 1, "#8a6c4a"),
        rect(ox + 1, oy + 9, 14, 1, "#5a4430"),
    ]
    return out


# Layout MUST match TileDatabase.COORDS (column, row) * 16.
ATLAS_LAYOUT = [
    (grass, 0, 0), (tall_grass, 1, 0), (path, 2, 0), (sand, 3, 0),
    (water, 0, 1), (tree, 1, 1), (rock, 2, 1), (flowers, 3, 1),
    (house_wall, 0, 2), (house_roof, 1, 2), (door, 2, 2), (sign_tile, 3, 2),
    (floor_wood, 0, 3), (wall_inner, 1, 3), (rug, 2, 3), (table, 3, 3),
]


def build_terrain_atlas():
    body = []
    for fn, cx, cy in ATLAS_LAYOUT:
        body += fn(cx * 16, cy * 16)
    return svg(64, 64, body)


# --- character sheets ---------------------------------------------------------

OUTLINE = "#1b2233"

# name -> (cloak, hood, facing-marker)
CHARACTER_PALETTES = {
    "player_sheet": ("#3f5a7a", "#4a6a8e", "#9fd0d6"),
    "npc_villager": ("#5a7a4a", "#6a8a55", "#d6e0a0"),
    "npc_elder": ("#6a5a7a", "#7a6a8a", "#d0c0e0"),
    "npc_wanderer": ("#7a5c3e", "#8a6c48", "#e0d0b0"),
}


def character_frame(ox, palette, marker, eyes):
    cloak, hood, mark = palette
    out = [
        rect(ox + 4, 14, 8, 1, "#20242c"),
        rect(ox + 3, 3, 10, 12, OUTLINE),
        rect(ox + 4, 4, 8, 10, cloak),
        rect(ox + 5, 4, 6, 3, hood),
    ]
    mx, my = marker
    out.append(rect(ox + mx, my, 2, 2, mark))
    for (ex, ey) in eyes:
        out.append(rect(ox + ex, ey, 1, 1, OUTLINE))
    return out


def build_character_sheet(palette):
    body = []
    # frame order MUST match Direction enum: down, up, left, right
    body += character_frame(0, palette, marker=(7, 12), eyes=[(6, 6), (9, 6)])
    body += character_frame(16, palette, marker=(7, 3), eyes=[])
    body += character_frame(32, palette, marker=(3, 8), eyes=[(5, 6)])
    body += character_frame(48, palette, marker=(11, 8), eyes=[(10, 6)])
    return svg(64, 16, body)


# --- creature battle placeholders (M4) -----------------------------------------

# Primary-type palette: (body, dark, light). Mirrors Types.COLORS, muted.
CREATURE_TYPE_COLORS = {
    "pflanze": ("#5a9a4a", "#3d6b33", "#a8d09a"),
    "feuer": ("#c65b3c", "#8a3d27", "#e8a37a"),
    "wasser": ("#3f7cc6", "#2a5589", "#9ac0e8"),
    "erde": ("#a9824e", "#735834", "#d4b88a"),
    "luft": ("#8fb8d6", "#5f87a6", "#cfe4f0"),
    "blitz": ("#d6c14a", "#9a8a30", "#f0e49a"),
    "eis": ("#7fc4d6", "#52909f", "#c4e8f0"),
    "gift": ("#8a5aa6", "#5d3a73", "#c4a0d6"),
    "mystik": ("#b563a0", "#7d4070", "#e0a8d0"),
    "bestie": ("#b0a08a", "#7a6e5c", "#d8cdb8"),
}

# species id -> (primary type for the palette/motif, evolution stage 1..3).
# Stage drives body size so evolution lines visibly grow.
CREATURES = [
    ("mooskind", "pflanze", 1), ("farnax", "pflanze", 2), ("wurzeltitan", "pflanze", 3),
    ("funkwelp", "feuer", 1), ("glutpirsch", "feuer", 2), ("infernax", "feuer", 3),
    ("troepfling", "wasser", 1), ("bachhuter", "wasser", 2), ("flutkoloss", "wasser", 3),
    ("nebelmotte", "luft", 1), ("steinpicker", "erde", 1), ("glimmkaefer", "blitz", 1),
]

OUTLINE_EYE = "#1b2233"


def _disc(cx, cy, r, fill):
    """Pixelated filled circle as 1px-high rect rows."""
    out = []
    for dy in range(-r, r + 1):
        half = int((r * r - dy * dy) ** 0.5)
        if half > 0:
            out.append(rect(cx - half, cy + dy, 2 * half, 1, fill))
    return out


def _motif(type_id, cx, cy, r, dark, light):
    top = cy - r
    if type_id == "pflanze":  # sprout with two leaves
        return [rect(cx, top - 4, 1, 4, dark),
                rect(cx - 3, top - 5, 3, 2, light), rect(cx + 1, top - 6, 3, 2, light)]
    if type_id == "feuer":  # flame tuft
        return [rect(cx - 3, top - 3, 2, 3, light), rect(cx, top - 5, 2, 5, light),
                rect(cx + 3, top - 2, 2, 2, light)]
    if type_id == "wasser":  # droplet + side fin
        return [rect(cx - 1, top - 4, 2, 4, light), rect(cx + r - 1, cy - 2, 4, 5, light)]
    if type_id == "erde":  # rocky bumps
        return [rect(cx - r // 2 - 2, top + 2, 3, 3, dark), rect(cx + r // 2, top + 3, 4, 3, dark)]
    if type_id == "luft":  # stubby wings
        return [rect(cx - r - 5, cy - 3, 5, 2, light), rect(cx - r - 4, cy - 1, 4, 2, light),
                rect(cx + r, cy - 3, 5, 2, light), rect(cx + r, cy - 1, 4, 2, light)]
    if type_id == "blitz":  # chest bolt
        return [rect(cx, cy + 1, 2, 1, light), rect(cx - 2, cy + 2, 2, 1, light),
                rect(cx, cy + 3, 2, 1, light)]
    if type_id == "eis":  # crystal spikes
        return [rect(cx - 5, top - 3, 2, 3, light), rect(cx - 1, top - 5, 2, 5, light),
                rect(cx + 3, top - 3, 2, 3, light)]
    if type_id == "gift":  # spots
        return [rect(cx - r // 2 - 1, cy - 2, 2, 2, dark), rect(cx + r // 2 - 1, cy + 2, 2, 2, dark),
                rect(cx - 1, cy - r // 2 - 1, 2, 2, dark)]
    if type_id == "mystik":  # gem on the brow
        return [rect(cx - 1, cy - (2 * r) // 3, 2, 2, light)]
    # bestie: ears
    return [rect(cx - r + 1, top + 1, 3, 4, dark), rect(cx + r - 4, top + 1, 3, 4, dark)]


def creature_sprite(type_id, stage):
    body, dark, light = CREATURE_TYPE_COLORS[type_id]
    r = 9 + 3 * stage          # 12 / 15 / 18 — evolutions grow
    cx, cy = 24, 27
    parts = [rect(cx - r - 1, 44, 2 * (r + 1), 2, "#11161f")]   # ground shadow
    parts += _disc(cx, cy, r, dark)                              # 1px outline ring
    parts += _disc(cx, cy, r - 1, body)
    parts += _disc(cx, cy + r // 2, r // 2, light)               # belly
    eye_y = cy - r // 3
    eye_dx = 2 + r // 4
    for ex in (cx - eye_dx, cx + eye_dx - 2):
        parts.append(rect(ex, eye_y, 2, 3, "#f2f4f8"))
        parts.append(rect(ex, eye_y + 1, 1, 1, OUTLINE_EYE))
    parts.append(rect(cx - 1, cy + r // 4, 3, 1, dark))          # mouth
    parts += _motif(type_id, cx, cy, r, dark, light)
    return svg(48, 48, parts)


def build_icon():
    body = [
        '  <rect x="0" y="0" width="64" height="64" rx="10" fill="#2f4a3a"/>',
        '  <rect x="0" y="0" width="64" height="64" rx="10" fill="none" stroke="#1c2f24" stroke-width="3"/>',
        '  <path d="M12 16 L21 48 L32 28 L43 48 L52 16" fill="none" '
        'stroke="#cfe0c0" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>',
        '  <circle cx="32" cy="40" r="3" fill="#9fd0d6"/>',
    ]
    return svg(64, 64, body)


def write(rel_path, content):
    full = os.path.join(ROOT, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)
    print(f"wrote {rel_path} ({len(content)} bytes)")


def main():
    write("assets/sprites/tiles/terrain_atlas.svg", build_terrain_atlas())
    write("assets/sprites/player/player_sheet.svg",
          build_character_sheet(CHARACTER_PALETTES["player_sheet"]))
    for name in ("npc_villager", "npc_elder", "npc_wanderer"):
        write(f"assets/sprites/npcs/{name}.svg",
              build_character_sheet(CHARACTER_PALETTES[name]))
    for species_id, type_id, stage in CREATURES:
        write(f"assets/sprites/creatures/{species_id}.svg",
              creature_sprite(type_id, stage))
    write("icon.svg", build_icon())


if __name__ == "__main__":
    main()
