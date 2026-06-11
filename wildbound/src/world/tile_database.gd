class_name TileDatabase
## Single source of truth for terrain tiles: atlas coordinates, walkability, and
## the ASCII legend used by hand-authored map data. Add a tile here and it is
## immediately available to the TileSet builder, the painter, and the legend.
## NOTE: keep in sync with tools/gen_placeholder_art.py (atlas layout) and
## tools/verify_project.py (python copy of the legend/walkability).

const SOURCE_ID := 0

enum Tile {
	GRASS, TALL_GRASS, PATH, SAND,
	WATER, TREE, ROCK, FLOWERS,
	HOUSE_WALL, HOUSE_ROOF, DOOR, SIGN,
	FLOOR_WOOD, WALL_INNER, RUG, TABLE,
}

## Atlas coordinates (column, row) inside terrain_atlas.svg (16px cells, 4x4).
const COORDS := {
	Tile.GRASS: Vector2i(0, 0),
	Tile.TALL_GRASS: Vector2i(1, 0),
	Tile.PATH: Vector2i(2, 0),
	Tile.SAND: Vector2i(3, 0),
	Tile.WATER: Vector2i(0, 1),
	Tile.TREE: Vector2i(1, 1),
	Tile.ROCK: Vector2i(2, 1),
	Tile.FLOWERS: Vector2i(3, 1),
	Tile.HOUSE_WALL: Vector2i(0, 2),
	Tile.HOUSE_ROOF: Vector2i(1, 2),
	Tile.DOOR: Vector2i(2, 2),
	Tile.SIGN: Vector2i(3, 2),
	Tile.FLOOR_WOOD: Vector2i(0, 3),
	Tile.WALL_INNER: Vector2i(1, 3),
	Tile.RUG: Vector2i(2, 3),
	Tile.TABLE: Vector2i(3, 3),
}

const WALKABLE := {
	Tile.GRASS: true,
	Tile.TALL_GRASS: true,
	Tile.PATH: true,
	Tile.SAND: true,
	Tile.WATER: false,
	Tile.TREE: false,
	Tile.ROCK: false,
	Tile.FLOWERS: true,
	Tile.HOUSE_WALL: false,
	Tile.HOUSE_ROOF: false,
	Tile.DOOR: true,
	Tile.SIGN: false,
	Tile.FLOOR_WOOD: true,
	Tile.WALL_INNER: false,
	Tile.RUG: true,
	Tile.TABLE: false,
}

## Maps ASCII characters (used in map data "rows") to tiles.
const LEGEND := {
	".": Tile.GRASS,
	"g": Tile.TALL_GRASS,
	"p": Tile.PATH,
	"s": Tile.SAND,
	"~": Tile.WATER,
	"T": Tile.TREE,
	"o": Tile.ROCK,
	"*": Tile.FLOWERS,
	"h": Tile.HOUSE_WALL,
	"H": Tile.HOUSE_ROOF,
	"D": Tile.DOOR,
	"S": Tile.SIGN,
	"f": Tile.FLOOR_WOOD,
	"W": Tile.WALL_INNER,
	"r": Tile.RUG,
	"t": Tile.TABLE,
}

static func tile_from_char(ch: String) -> int:
	return LEGEND.get(ch, Tile.GRASS)
