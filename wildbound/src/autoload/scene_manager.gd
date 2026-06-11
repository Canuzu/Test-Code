extends Node
## Owns map transitions. Autoloaded as `SceneManager`.
##
## The Main scene registers its MapHost (where the current GameMap instance
## lives) and a fullscreen fade rect. change_map() then: fades out, frees the
## old map, writes the spawn state into GameState, instances the generic map
## scene with the new map id, and fades back in. Loading a save game re-enters
## through the same path (game_loaded -> change_map), so there is exactly one
## way maps come into existence.

const FADE_TIME := 0.22
const MAP_SCENE := preload("res://src/world/game_map.tscn")

var is_transitioning: bool = false

var _host: Node = null
var _fade: ColorRect = null

func _ready() -> void:
	EventBus.game_loaded.connect(_on_game_loaded)

## Called once by main.gd.
func register_main(host: Node, fade: ColorRect) -> void:
	_host = host
	_fade = fade

func change_map(map_id: String, cell: Vector2i, facing: int) -> void:
	if is_transitioning or _host == null:
		return
	is_transitioning = true
	await _fade_to(1.0)
	# The await above also guarantees any signal chain that triggered this
	# transition (warp tiles, load hotkey) has fully unwound before we free.
	for child in _host.get_children():
		child.free()
	GameState.current_map = map_id
	GameState.player_cell = cell
	GameState.facing = facing
	var map: GameMap = MAP_SCENE.instantiate()
	map.map_id = map_id
	_host.add_child(map)
	EventBus.map_changed.emit(map_id)
	await _fade_to(0.0)
	is_transitioning = false

func _on_game_loaded(_slot: int) -> void:
	change_map(GameState.current_map, GameState.player_cell, GameState.facing)

func _fade_to(target: float) -> void:
	if _fade == null:
		await get_tree().process_frame
		return
	var tween := create_tween()
	tween.tween_property(_fade, "modulate:a", target, FADE_TIME)
	await tween.finished
