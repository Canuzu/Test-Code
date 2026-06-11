class_name GameMap extends Node2D
## Generic playable map. SceneManager instances game_map.tscn, sets `map_id`,
## and this script does the rest from MapRegistry data: builds the TileSet in
## code, paints the ASCII rows, applies the map's ambient light, spawns NPCs and
## signs, answers walkability/occupancy queries, and triggers warps when the
## player steps onto warp cells.
##
## It registers itself in the "game_map" group during _enter_tree — before any
## child (player, NPCs) runs _ready — so entities can locate it without a hard
## reference.

const TERRAIN_ATLAS: Texture2D = preload("res://assets/sprites/tiles/terrain_atlas.svg")
const NPC_SCENE: PackedScene = preload("res://src/world/entities/npc.tscn")

var map_id: String = "farnried"
var data: Dictionary = {}

var _occupied: Dictionary = {}
var _interactables: Array = []
var _warps: Dictionary = {}
var _rng := RandomNumberGenerator.new()

@onready var ground: TileMapLayer = $Ground
@onready var ambient: CanvasModulate = $CanvasModulate
@onready var player: Player = $Player

func _enter_tree() -> void:
	add_to_group(Constants.GROUP_GAME_MAP)

func _ready() -> void:
	data = MapRegistry.get_map(map_id)
	ground.tile_set = TileSetBuilder.build(TERRAIN_ATLAS)
	_paint(data.get("rows", []))
	var amb: Array = data.get("ambient", [1.0, 1.0, 1.0])
	ambient.color = Color(amb[0], amb[1], amb[2])
	_build_warps(data.get("warps", []))
	_spawn_signs(data.get("signs", []))
	_spawn_npcs(data.get("npcs", []))
	_spawn_shops(data.get("shops", []))
	player.setup_camera(_pixel_rect())
	_rng.randomize()
	EventBus.player_moved.connect(_on_player_moved)

func _paint(rows: Array) -> void:
	for y in rows.size():
		var row: String = rows[y]
		for x in row.length():
			var tile := TileDatabase.tile_from_char(row[x])
			ground.set_cell(Vector2i(x, y), TileDatabase.SOURCE_ID, TileDatabase.COORDS[tile])

func _build_warps(warps: Array) -> void:
	for warp in warps:
		for c in warp.get("cells", []):
			_warps[Vector2i(int(c[0]), int(c[1]))] = warp

func _spawn_signs(signs: Array) -> void:
	for def in signs:
		var sign_board := SignBoard.new()
		var c: Array = def.get("cell", [0, 0])
		sign_board.cell = Vector2i(int(c[0]), int(c[1]))
		sign_board.dialog_id = def.get("dialog", "")
		sign_board.position = Vector2(sign_board.cell * Constants.TILE_SIZE) + Vector2.ONE * (Constants.TILE_SIZE / 2.0)
		add_child(sign_board)
		_interactables.append(sign_board)

func _spawn_npcs(npcs: Array) -> void:
	for def in npcs:
		var npc: NPC = NPC_SCENE.instantiate()
		npc.configure(def)
		add_child(npc)
		_interactables.append(npc)

func _spawn_shops(shops: Array) -> void:
	for def in shops:
		var shop := Shop.new(
			def.get("id", ""),
			Vector2i(int(def.get("cell", [0, 0])[0]), int(def.get("cell", [0, 0])[1])),
			def.get("sheet", ""),
			def.get("stock", [])
		)
		shop.position = shop.grid_cell * Constants.TILE_SIZE + Vector2.ONE * (Constants.TILE_SIZE / 2.0)
		add_child(shop)
		_interactables.append(shop)

## --- Grid queries -----------------------------------------------------------

## True only for cells that exist in the painted map AND are flagged walkable.
## Out-of-map cells are treated as blocked, which keeps movement inside bounds.
func is_cell_walkable(cell: Vector2i) -> bool:
	var tile_data := ground.get_cell_tile_data(cell)
	if tile_data == null:
		return false
	return bool(tile_data.get_custom_data(TileSetBuilder.WALKABLE_LAYER))

## Walkable AND not occupied by another mover (player/NPC).
func is_cell_enterable(cell: Vector2i) -> bool:
	return is_cell_walkable(cell) and not _occupied.has(cell)

func occupy_cell(cell: Vector2i, who: Node) -> void:
	_occupied[cell] = who

func release_cell(cell: Vector2i, who: Node) -> void:
	if _occupied.get(cell) == who:
		_occupied.erase(cell)

## The interactable at `cell`, if any. Checks registered interactables first
## (signs, idle NPCs), then the occupancy owner (catches NPCs mid-step whose
## logical cell hasn't flipped yet).
func get_interactable_at(cell: Vector2i) -> Interactable:
	for interactable in _interactables:
		if interactable.get_cell() == cell:
			return interactable
	var occupant: Variant = _occupied.get(cell)
	if occupant is Interactable:
		return occupant
	return null

## Cell -> global pixel position of that cell's CENTER. Computed manually so it
## does not depend on the TileSet being assigned yet (entities position
## themselves in _ready, which runs before this map's _ready).
func cell_to_world(cell: Vector2i) -> Vector2:
	var half := Constants.TILE_SIZE / 2.0
	var local := Vector2(cell.x * Constants.TILE_SIZE + half, cell.y * Constants.TILE_SIZE + half)
	return ground.to_global(local)

func world_to_cell(world_pos: Vector2) -> Vector2i:
	var local := ground.to_local(world_pos)
	return Vector2i(floori(local.x / Constants.TILE_SIZE), floori(local.y / Constants.TILE_SIZE))

func _pixel_rect() -> Rect2:
	var rows: Array = data.get("rows", [])
	var height := rows.size()
	var width := 0 if height == 0 else String(rows[0]).length()
	return Rect2(0, 0, width * Constants.TILE_SIZE, height * Constants.TILE_SIZE)

## --- Warps & encounters -------------------------------------------------------

func _on_player_moved(cell: Vector2i) -> void:
	if SceneManager.is_transitioning:
		return
	var warp: Variant = _warps.get(cell)
	if warp != null:
		var to: Array = warp.get("to_cell", [0, 0])
		SceneManager.change_map(
			warp.get("to_map", ""),
			Vector2i(int(to[0]), int(to[1])),
			Direction.from_name(warp.get("facing", "down"))
		)
		return
	_maybe_encounter(cell)

## Rolls the map's encounter table when the player steps into tall grass.
## Skipped without a battle-able party (no soft-lock into an unwinnable fight).
func _maybe_encounter(cell: Vector2i) -> void:
	var encounters: Dictionary = data.get("encounters", {})
	if encounters.is_empty() or not _is_tall_grass(cell):
		return
	if _rng.randf() >= float(encounters.get("rate", 0.0)):
		return
	if not _party_can_fight():
		return
	var entry := _roll_table(encounters.get("table", []))
	if entry.is_empty():
		return
	var levels: Array = entry.get("levels", [2, 4])
	var level := _rng.randi_range(int(levels[0]), int(levels[1]))
	EventBus.encounter_started.emit(Creature.create(entry["species"], level))

func _is_tall_grass(cell: Vector2i) -> bool:
	var rows: Array = data.get("rows", [])
	if cell.y < 0 or cell.y >= rows.size():
		return false
	var row: String = rows[cell.y]
	return cell.x >= 0 and cell.x < row.length() and row[cell.x] == "g"

func _roll_table(table: Array) -> Dictionary:
	var total := 0
	for entry in table:
		total += int(entry.get("weight", 1))
	if total <= 0:
		return {}
	var roll := _rng.randi_range(1, total)
	for entry in table:
		roll -= int(entry.get("weight", 1))
		if roll <= 0:
			return entry
	return table.back()

func _party_can_fight() -> bool:
	for creature in GameState.party:
		if not creature.is_fainted():
			return true
	return false
