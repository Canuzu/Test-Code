class_name GridMovement extends Node
## Reusable tile-by-tile mover for player AND NPCs. Tweens its target body
## between cell centers and blocks new moves until the current one finishes.
## Knows nothing about input — owners drive it via request_move().
##
## Occupancy: while idle the mover occupies its cell in the GameMap registry;
## while moving it occupies BOTH origin and target (released on arrival), so two
## movers can never tween into the same cell or visually overlap.

signal arrived(cell: Vector2i)

@export var tiles_per_second: float = 6.0
@export var sprint_multiplier: float = 1.7

var cell: Vector2i
var is_moving: bool = false

var _body: Node2D
var _map: GameMap

func setup(body: Node2D, map: GameMap, start_cell: Vector2i) -> void:
	_body = body
	_map = map
	cell = start_cell
	if _map:
		_map.occupy_cell(cell, _body)

## Snap instantly to a cell (used on spawn).
func teleport(target_cell: Vector2i) -> void:
	if _map:
		_map.release_cell(cell, _body)
		_map.occupy_cell(target_cell, _body)
	cell = target_cell
	is_moving = false
	if _body and _map:
		_body.global_position = _map.cell_to_world(target_cell)

## Attempt to step one tile in `dir`. Returns false if already moving, no map,
## or the destination is blocked (terrain or another mover).
func request_move(dir: Vector2i, sprint: bool) -> bool:
	if is_moving or _map == null:
		return false
	var target := cell + dir
	if not _map.is_cell_enterable(target):
		return false
	is_moving = true
	_map.occupy_cell(target, _body)
	var speed := tiles_per_second * (sprint_multiplier if sprint else 1.0)
	var origin := cell
	var tween := _body.create_tween()
	tween.tween_property(_body, "global_position", _map.cell_to_world(target), 1.0 / speed)
	var on_finished := func() -> void:
		if _map:
			_map.release_cell(origin, _body)
		cell = target
		is_moving = false
		arrived.emit(cell)
	tween.finished.connect(on_finished)
	return true
