extends Node
## Registers input actions at runtime using *physical* keycodes (keyboard-layout
## independent, so WASD works on QWERTZ/AZERTY too) and exposes small input
## helpers. Autoloaded as `GameInput`. Defined in code instead of project.godot
## to keep the action list readable and in one place.

const ACTIONS := {
	"move_up": [KEY_W, KEY_UP],
	"move_down": [KEY_S, KEY_DOWN],
	"move_left": [KEY_A, KEY_LEFT],
	"move_right": [KEY_D, KEY_RIGHT],
	"sprint": [KEY_SHIFT],
	"interact": [KEY_E, KEY_ENTER, KEY_SPACE],
	"menu": [KEY_ESCAPE],
	"team": [KEY_T],
	"quick_save": [KEY_F5],
	"quick_load": [KEY_F9],
}

func _ready() -> void:
	for action in ACTIONS:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for key in ACTIONS[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)

## Returns the currently held cardinal direction as a unit Vector2i (single
## axis), or Vector2i.ZERO if none. Vertical wins on diagonal presses so the
## grid mover never receives an ambiguous diagonal.
func get_move_dir() -> Vector2i:
	if Input.is_action_pressed("move_up"):
		return Vector2i.UP
	if Input.is_action_pressed("move_down"):
		return Vector2i.DOWN
	if Input.is_action_pressed("move_left"):
		return Vector2i.LEFT
	if Input.is_action_pressed("move_right"):
		return Vector2i.RIGHT
	return Vector2i.ZERO
