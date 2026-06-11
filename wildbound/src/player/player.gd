class_name Player extends Node2D
## Player overworld controller. Reads input, faces a direction, drives a
## GridMovement component for tile-locked movement with sprint, and interacts
## with whatever is on the faced cell. Locks itself while a dialog or menu is
## open or a map transition runs. Mirrors cell/facing into GameState so saves
## capture them.
##
## Movement (tween/occupancy) lives in GridMovement; direction math in
## Direction; constants in Constants — this script is just the glue + intent.

@onready var sprite: Sprite2D = $Sprite
@onready var movement: GridMovement = $GridMovement
@onready var camera: Camera2D = $Camera2D

var facing: int = Direction.Dir.DOWN

var _map: GameMap
var _dialog_lock := false
var _menu_lock := false
var _battle_lock := false

func _ready() -> void:
	add_to_group(Constants.GROUP_PLAYER)
	_map = get_tree().get_first_node_in_group(Constants.GROUP_GAME_MAP) as GameMap
	movement.setup(self, _map, GameState.player_cell)
	movement.teleport(GameState.player_cell)
	facing = GameState.facing
	_update_sprite()
	movement.arrived.connect(_on_arrived)
	EventBus.dialog_opened.connect(func() -> void: _dialog_lock = true)
	EventBus.dialog_closed.connect(func() -> void: _dialog_lock = false)
	EventBus.menu_opened.connect(func() -> void: _menu_lock = true)
	EventBus.menu_closed.connect(func() -> void: _menu_lock = false)
	EventBus.battle_started.connect(func() -> void: _battle_lock = true)
	EventBus.battle_ended.connect(func(_outcome: String) -> void: _battle_lock = false)

func _busy() -> bool:
	return _dialog_lock or _menu_lock or _battle_lock or SceneManager.is_transitioning

func _process(_delta: float) -> void:
	if _busy() or movement.is_moving:
		return
	var dir := GameInput.get_move_dir()
	if dir == Vector2i.ZERO:
		return
	var new_facing := Direction.from_vector(dir)
	if new_facing != facing:
		facing = new_facing
		_update_sprite()
		EventBus.player_turned.emit(facing)
	if movement.request_move(dir, Input.is_action_pressed("sprint")):
		GameState.facing = facing

func _unhandled_input(event: InputEvent) -> void:
	if _busy() or movement.is_moving:
		return
	if event.is_action_pressed("interact"):
		_try_interact()

func _try_interact() -> void:
	if _map == null:
		return
	var target := movement.cell + Direction.to_vector(facing)
	var interactable := _map.get_interactable_at(target)
	if interactable != null:
		interactable.interact(self)

## Called by GameMap once its size is known: clamps the camera to the map and
## centers it on maps smaller than the viewport (e.g. interiors).
func setup_camera(map_rect: Rect2) -> void:
	var eff_w := maxf(map_rect.size.x, Constants.BASE_WIDTH)
	var eff_h := maxf(map_rect.size.y, Constants.BASE_HEIGHT)
	camera.limit_left = int(map_rect.position.x + (map_rect.size.x - eff_w) / 2.0)
	camera.limit_top = int(map_rect.position.y + (map_rect.size.y - eff_h) / 2.0)
	camera.limit_right = camera.limit_left + int(eff_w)
	camera.limit_bottom = camera.limit_top + int(eff_h)
	camera.reset_smoothing()

func _on_arrived(cell: Vector2i) -> void:
	GameState.player_cell = cell
	EventBus.player_moved.emit(cell)

func _update_sprite() -> void:
	sprite.region_enabled = true
	sprite.region_rect = Direction.frame_rect(facing)
