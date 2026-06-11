extends Label
## Lightweight on-screen debug overlay: controls hint, live state, and toasts
## (save/load, evolution). Purely a development aid — the real HUD/menus arrive
## later. Listens to EventBus and reads GameState; no gameplay references.

var _toast := ""
var _toast_time := 0.0

func _ready() -> void:
	EventBus.game_saved.connect(func(slot: int) -> void: _show_toast("Gespeichert (Slot %d)" % slot))
	EventBus.game_loaded.connect(func(slot: int) -> void: _show_toast("Geladen (Slot %d)" % slot))
	EventBus.creature_evolved.connect(func(a: String, b: String) -> void: _show_toast("%s entwickelt sich zu %s!" % [a, b]))
	# The battle scene brings its own panels; the overlay would sit on top of them.
	EventBus.battle_started.connect(hide)
	EventBus.battle_ended.connect(func(_outcome: String) -> void: show())

func _show_toast(msg: String) -> void:
	_toast = msg
	_toast_time = 2.5

func _process(delta: float) -> void:
	if _toast_time > 0.0:
		_toast_time -= delta
		if _toast_time <= 0.0:
			_toast = ""
	text = "WILDBOUND — Milestone 4\n[WASD] move  [Shift] sprint  [E] talk  [T] team  ·  hohes Gras: Kämpfe!\n[F5/F9] save/load  ·  Debug: [1/2/3] Starter  [L] EXP\n%s  ·  cell %s  ·  Team %d\n%s" % [
		MapRegistry.display_name(GameState.current_map),
		str(GameState.player_cell),
		GameState.party.size(),
		_toast,
	]
