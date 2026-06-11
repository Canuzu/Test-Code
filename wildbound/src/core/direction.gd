class_name Direction
## Four-way cardinal direction helpers for grid movement and facing.
## Enum order matches the character sprite-sheet frame order (down, up, left, right).

enum Dir { DOWN, UP, LEFT, RIGHT }

const VECTORS := {
	Dir.DOWN: Vector2i(0, 1),
	Dir.UP: Vector2i(0, -1),
	Dir.LEFT: Vector2i(-1, 0),
	Dir.RIGHT: Vector2i(1, 0),
}

static func to_vector(dir: int) -> Vector2i:
	return VECTORS[dir]

static func from_vector(v: Vector2i) -> int:
	if v.x > 0:
		return Dir.RIGHT
	if v.x < 0:
		return Dir.LEFT
	if v.y < 0:
		return Dir.UP
	return Dir.DOWN

static func opposite(dir: int) -> int:
	match dir:
		Dir.DOWN:
			return Dir.UP
		Dir.UP:
			return Dir.DOWN
		Dir.LEFT:
			return Dir.RIGHT
		Dir.RIGHT:
			return Dir.LEFT
	return dir

static func to_name(dir: int) -> String:
	return ["down", "up", "left", "right"][dir]

## Parses map-data facing strings ("up", "down", ...). Defaults to DOWN.
static func from_name(name: String) -> int:
	match name:
		"up":
			return Dir.UP
		"left":
			return Dir.LEFT
		"right":
			return Dir.RIGHT
	return Dir.DOWN

## Region rect of the facing frame inside a 4-frame character sheet.
static func frame_rect(dir: int) -> Rect2:
	return Rect2(dir * Constants.TILE_SIZE, 0, Constants.TILE_SIZE, Constants.TILE_SIZE)
