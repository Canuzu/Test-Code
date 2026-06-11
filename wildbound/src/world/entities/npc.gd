class_name NPC extends Interactable
## A villager that wanders inside an authored rectangle, blocks cells via
## GridMovement occupancy, faces the player when addressed, and opens its dialog
## through the EventBus. Configured from map data by GameMap before being added
## to the tree.

const WANDER_MIN_WAIT := 1.2
const WANDER_MAX_WAIT := 3.2

@onready var sprite: Sprite2D = $Sprite
@onready var movement: GridMovement = $GridMovement

var facing: int = Direction.Dir.DOWN

var _def: Dictionary = {}
var _map: GameMap
var _wander := Rect2i()
var _has_wander := false
var _wait := 0.0
var _paused := false

## Called by GameMap with the npc entry from map data, before add_child.
func configure(def: Dictionary) -> void:
	_def = def

func _ready() -> void:
	_map = get_tree().get_first_node_in_group(Constants.GROUP_GAME_MAP) as GameMap
	sprite.texture = load("res://assets/sprites/npcs/%s.svg" % _def.get("sheet", "npc_villager"))
	var c: Array = _def.get("cell", [0, 0])
	var start := Vector2i(int(c[0]), int(c[1]))
	movement.setup(self, _map, start)
	movement.teleport(start)
	_face(Direction.Dir.DOWN)
	var w: Variant = _def.get("wander")
	if w is Array and w.size() == 4:
		_wander = Rect2i(int(w[0]), int(w[1]), int(w[2]) - int(w[0]) + 1, int(w[3]) - int(w[1]) + 1)
		_has_wander = true
	EventBus.dialog_opened.connect(func() -> void: _paused = true)
	EventBus.dialog_closed.connect(func() -> void: _paused = false)
	_arm_timer()

func _process(delta: float) -> void:
	if _paused or not _has_wander or movement.is_moving or SceneManager.is_transitioning:
		return
	_wait -= delta
	if _wait > 0.0:
		return
	_arm_timer()
	_try_step()

func _arm_timer() -> void:
	_wait = randf_range(WANDER_MIN_WAIT, WANDER_MAX_WAIT)

func _try_step() -> void:
	var dir := randi() % 4
	_face(dir)
	var target := movement.cell + Direction.to_vector(dir)
	if not _wander.has_point(target):
		return
	movement.request_move(Direction.to_vector(dir), false)

func _face(dir: int) -> void:
	facing = dir
	sprite.region_enabled = true
	sprite.region_rect = Direction.frame_rect(dir)

func interact(player: Node2D) -> void:
	if _map:
		var player_cell := _map.world_to_cell(player.global_position)
		var v := player_cell - get_cell()
		if v != Vector2i.ZERO:
			_face(Direction.from_vector(v))
	EventBus.dialog_requested.emit(_def.get("dialog", ""))

func get_cell() -> Vector2i:
	return movement.cell
