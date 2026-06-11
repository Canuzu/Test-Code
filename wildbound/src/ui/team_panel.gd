extends Control
## Team overview, toggled with [T]. Lists party members with level, typing, HP,
## the full six-stat spread, and known moves. A styled team screen comes in the
## UI milestone; this proves the creature data + party model end to end and
## stays fully decoupled (EventBus only).

@onready var text: RichTextLabel = $Panel/Scroll/Text

var _open := false
var _dialog_open := false
var _battle_open := false

func _ready() -> void:
	hide()
	EventBus.dialog_opened.connect(func() -> void: _dialog_open = true)
	EventBus.dialog_closed.connect(func() -> void: _dialog_open = false)
	EventBus.battle_started.connect(func() -> void: _battle_open = true)
	EventBus.battle_ended.connect(func(_outcome: String) -> void: _battle_open = false)
	EventBus.party_changed.connect(_refresh_if_open)
	EventBus.creature_evolved.connect(func(_a: String, _b: String) -> void: _refresh_if_open())
	EventBus.creature_leveled.connect(func(_c, _l: int) -> void: _refresh_if_open())

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("team") and not _dialog_open and not _battle_open and not SceneManager.is_transitioning:
		_toggle()
		get_viewport().set_input_as_handled()
	elif _open and event.is_action_pressed("menu"):
		_close()
		get_viewport().set_input_as_handled()

func _toggle() -> void:
	if _open:
		_close()
	else:
		_open_panel()

func _open_panel() -> void:
	_render()
	show()
	_open = true
	EventBus.menu_opened.emit()

func _close() -> void:
	hide()
	_open = false
	EventBus.menu_closed.emit()

func _refresh_if_open(_arg = null) -> void:
	if _open:
		_render()

func _render() -> void:
	if GameState.party.is_empty():
		text.text = "[b]TEAM[/b]\n\n[i]Noch keine Kreaturen.[/i]\n\nDebug: [1] / [2] / [3] fügen einen Starter hinzu, [L] gibt dem ersten Mitglied EXP (Level & Entwicklung)."
		return
	var blocks: Array = ["[b]TEAM[/b]  (%d/6)" % GameState.party.size()]
	for creature in GameState.party:
		blocks.append(_creature_block(creature))
	text.text = "\n\n".join(blocks)

func _creature_block(c: Creature) -> String:
	var type_str := ""
	for t in c.data().types:
		type_str += Types.bbcode(t) + "  "
	var move_names: Array = []
	for move_id in c.moves:
		var move := MoveDatabase.get_move(move_id)
		move_names.append(move.display_name if move else move_id)
	var stat_line := ""
	for i in Stats.COUNT:
		stat_line += "%s %d   " % [Stats.SHORT[i], c.stat(i)]
	return "[b]%s[/b]  Lv.%d    %s\nKP %d/%d\n%s\nAttacken: %s" % [
		c.display_name(), c.level, type_str.strip_edges(),
		c.current_hp, c.max_hp(),
		stat_line.strip_edges(),
		", ".join(move_names),
	]
