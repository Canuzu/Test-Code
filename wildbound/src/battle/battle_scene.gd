class_name BattleScene extends Control
## Full-screen wild-battle UI. Main instances this into the BattleLayer with
## `wild` set, the scene drives a Battle engine and plays back its event stream
## (text, HP tweens, faints, switches), then emits EventBus.battle_ended.
##
## The whole layout is built in code (D7-style: no hand-edited scene files for
## things a loop can place better) at the 320x180 base resolution. Keyboard
## only: arrows/WASD navigate, `interact` confirms, `menu` cancels.

const TEXT_SPEED := 45.0          # chars/second, matches DialogBox
const AUTO_ADVANCE := 1.1         # seconds a finished line stays before moving on
const HP_TWEEN := 0.4
const ACTIONS := ["KAMPF", "TEAM", "FLUCHT"]
const CATEGORY_NAMES := {
	MoveData.Category.PHYSICAL: "Physisch",
	MoveData.Category.SPECIAL: "Spezial",
	MoveData.Category.STATUS: "Status",
}

const COL_TEXT := Color("#e8e8f0")
const COL_DIM := Color("#8a90a8")
const COL_DISABLED := Color("#555a6e")
const COL_HP_HIGH := Color("#5acb6a")
const COL_HP_MID := Color("#d6c14a")
const COL_HP_LOW := Color("#c65b3c")
const COL_EXP := Color("#5a86c6")

enum Ui { BUSY, ACTION, MOVES, TEAM, REPLACE }

var wild: Creature

var _battle: Battle
var _ui: int = Ui.BUSY
var _action_idx := 0
var _move_idx := 0
var _team_idx := 0
var _skip := false

var _enemy_sprite: TextureRect
var _player_sprite: TextureRect
var _enemy_name: Label
var _enemy_level: Label
var _enemy_status: Label
var _enemy_hp_fill: ColorRect
var _player_name: Label
var _player_level: Label
var _player_status: Label
var _player_hp_fill: ColorRect
var _player_hp_text: Label
var _player_exp_fill: ColorRect
var _msg_panel: Control
var _msg_label: Label
var _action_panel: Control
var _action_labels: Array = []
var _move_panel: Control
var _move_labels: Array = []
var _move_info: Label
var _team_panel: Control
var _team_labels: Array = []
var _team_hint: Label
var _flash: ColorRect

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_ui()
	_battle = Battle.new(GameState.party, wild)
	_load_sprite("enemy")
	_refresh_panels()
	_flash.modulate.a = 1.0
	create_tween().tween_property(_flash, "modulate:a", 0.0, 0.45)
	_run(_battle.start())

# --- engine event playback ----------------------------------------------------

func _run(events: Array) -> void:
	_ui = Ui.BUSY
	_hide_menus()
	for ev in events:
		match String(ev["t"]):
			"text":
				await _say(ev["msg"])
			"hp":
				await _tween_hp(ev["side"], ev["from"], ev["to"])
			"faint":
				await _animate_faint(ev["side"])
			"switch":
				_load_sprite(ev["side"])
				_refresh_panels()
			"refresh":
				_refresh_panels()
	match _battle.phase:
		Battle.Phase.CHOOSE:
			_open_action()
		Battle.Phase.REPLACE:
			_open_team(true)
		Battle.Phase.DONE:
			await _finish()

func _say(msg: String) -> void:
	_msg_label.text = msg
	_msg_label.visible_characters = 0
	_skip = false
	var shown := 0.0
	while _msg_label.visible_characters < msg.length():
		if _skip:
			break
		shown += TEXT_SPEED * get_process_delta_time()
		_msg_label.visible_characters = int(shown)
		await get_tree().process_frame
	_msg_label.visible_characters = -1
	_skip = false
	var waited := 0.0
	while waited < AUTO_ADVANCE and not _skip:
		waited += get_process_delta_time()
		await get_tree().process_frame
	_skip = false

func _pause(seconds: float) -> void:
	var waited := 0.0
	while waited < seconds:
		waited += get_process_delta_time()
		await get_tree().process_frame

func _tween_hp(side: String, from: int, to: int) -> void:
	var combatant := _combatant(side)
	var max_hp := combatant.creature.max_hp()
	var t := 0.0
	while t < HP_TWEEN:
		t += get_process_delta_time()
		_set_hp_bar(side, lerpf(from, to, clampf(t / HP_TWEEN, 0.0, 1.0)), max_hp)
		await get_tree().process_frame
	_set_hp_bar(side, to, max_hp)

func _animate_faint(side: String) -> void:
	var sprite := _enemy_sprite if side == "enemy" else _player_sprite
	var tw := create_tween().set_parallel(true)
	tw.tween_property(sprite, "modulate:a", 0.0, 0.35)
	tw.tween_property(sprite, "position:y", sprite.position.y + 10.0, 0.35)
	await tw.finished
	sprite.position.y -= 10.0

func _finish() -> void:
	await _pause(0.4)
	var tw := create_tween()
	tw.tween_property(_flash, "modulate:a", 1.0, 0.3)
	await tw.finished
	EventBus.battle_ended.emit(_battle.outcome)

# --- input ----------------------------------------------------------------

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact"):
		_on_confirm()
	elif event.is_action_pressed("menu"):
		_on_cancel()
	elif event.is_action_pressed("move_up"):
		_on_nav(Vector2i.UP)
	elif event.is_action_pressed("move_down"):
		_on_nav(Vector2i.DOWN)
	elif event.is_action_pressed("move_left"):
		_on_nav(Vector2i.LEFT)
	elif event.is_action_pressed("move_right"):
		_on_nav(Vector2i.RIGHT)
	# Swallow all keys while a battle runs (no overworld hotkeys behind it).
	if event is InputEventKey:
		get_viewport().set_input_as_handled()

func _on_confirm() -> void:
	match _ui:
		Ui.BUSY:
			_skip = true
		Ui.ACTION:
			_confirm_action()
		Ui.MOVES:
			_confirm_move()
		Ui.TEAM, Ui.REPLACE:
			_confirm_team()

func _on_cancel() -> void:
	match _ui:
		Ui.MOVES, Ui.TEAM:
			_open_action()
		_:
			pass

func _on_nav(dir: Vector2i) -> void:
	match _ui:
		Ui.ACTION:
			if dir.y != 0:
				_action_idx = wrapi(_action_idx + dir.y, 0, ACTIONS.size())
				_render_action()
		Ui.MOVES:
			var slots := _battle.player.creature.moves.size()
			if slots > 0:
				if dir.x != 0:
					_move_idx = wrapi(_move_idx + dir.x, 0, slots)
				elif dir.y != 0 and slots > 2:
					_move_idx = wrapi(_move_idx + 2 * dir.y, 0, slots)
				_render_moves()
		Ui.TEAM, Ui.REPLACE:
			if dir.y != 0:
				_team_idx = wrapi(_team_idx + dir.y, 0, _battle.party().size())
				_render_team()

func _confirm_action() -> void:
	match _action_idx:
		0:
			if _battle.player.out_of_pp():
				_run(_battle.choose_move(-1))
			else:
				_open_moves()
		1:
			_open_team(false)
		2:
			_run(_battle.choose_flee())

func _confirm_move() -> void:
	if _move_idx >= _battle.player.creature.moves.size():
		return
	if _battle.player.pp_left(_move_idx) <= 0:
		_move_info.text = "Keine AP übrig!"
		return
	_run(_battle.choose_move(_move_idx))

func _confirm_team() -> void:
	var party := _battle.party()
	if _team_idx >= party.size():
		return
	var creature: Creature = party[_team_idx]
	if creature == _battle.player.creature:
		_team_hint.text = "%s kämpft bereits!" % creature.display_name()
		return
	if creature.is_fainted():
		_team_hint.text = "%s ist kampfunfähig!" % creature.display_name()
		return
	if _ui == Ui.REPLACE:
		_run(_battle.choose_replacement(_team_idx))
	else:
		_run(_battle.choose_switch(_team_idx))

# --- menu state -----------------------------------------------------------

func _hide_menus() -> void:
	_action_panel.hide()
	_move_panel.hide()
	_team_panel.hide()
	_msg_panel.show()

func _open_action() -> void:
	_ui = Ui.ACTION
	_hide_menus()
	_msg_label.text = "Was soll %s tun?" % _battle.player.disp_name()
	_msg_label.visible_characters = -1
	_action_panel.show()
	_render_action()

func _open_moves() -> void:
	_ui = Ui.MOVES
	_hide_menus()
	_msg_panel.hide()
	_move_idx = mini(_move_idx, maxi(0, _battle.player.creature.moves.size() - 1))
	_move_panel.show()
	_render_moves()

func _open_team(forced: bool) -> void:
	_ui = Ui.REPLACE if forced else Ui.TEAM
	_action_panel.hide()
	_move_panel.hide()
	_msg_panel.show()
	if forced:
		_msg_label.text = "Wen schickst du als Nächstes?"
		_msg_label.visible_characters = -1
	_team_idx = 0
	_team_panel.show()
	_render_team()

func _render_action() -> void:
	for i in _action_labels.size():
		var label: Label = _action_labels[i]
		label.text = ("> " if i == _action_idx else "  ") + ACTIONS[i]
		label.add_theme_color_override("font_color", COL_TEXT if i == _action_idx else COL_DIM)

func _render_moves() -> void:
	var moves: Array = _battle.player.creature.moves
	for i in _move_labels.size():
		var label: Label = _move_labels[i]
		if i >= moves.size():
			label.text = "  —"
			label.add_theme_color_override("font_color", COL_DISABLED)
			continue
		var move := MoveDatabase.get_move(moves[i])
		label.text = ("> " if i == _move_idx else "  ") + (move.display_name if move != null else moves[i])
		var color := COL_TEXT if i == _move_idx else COL_DIM
		if _battle.player.pp_left(i) <= 0:
			color = COL_DISABLED
		label.add_theme_color_override("font_color", color)
	var selected := MoveDatabase.get_move(moves[_move_idx]) if _move_idx < moves.size() else null
	if selected != null:
		var power := "Stärke %d" % selected.power if selected.power > 0 else "—"
		_move_info.text = "%s · %s · %s · AP %d/%d" % [
			Types.to_name(selected.type), CATEGORY_NAMES[selected.category], power,
			_battle.player.pp_left(_move_idx), selected.pp,
		]
	else:
		_move_info.text = ""

func _render_team() -> void:
	var party := _battle.party()
	for i in _team_labels.size():
		var label: Label = _team_labels[i]
		if i >= party.size():
			label.hide()
			continue
		label.show()
		var c: Creature = party[i]
		var extra := ""
		if c == _battle.player.creature:
			extra = "  (im Kampf)"
		elif c.is_fainted():
			extra = "  (besiegt)"
		elif c.status != "":
			extra = "  [%s]" % StatusFx.tag(c.status)
		label.text = "%s%s  Lv.%d  KP %d/%d%s" % [
			"> " if i == _team_idx else "  ", c.display_name(), c.level,
			c.current_hp, c.max_hp(), extra,
		]
		var color := COL_TEXT if i == _team_idx else COL_DIM
		if c.is_fainted():
			color = COL_DISABLED
		label.add_theme_color_override("font_color", color)
	_team_hint.text = "[E] wählen" + ("" if _ui == Ui.REPLACE else " · [Esc] zurück")

# --- panels & bars ----------------------------------------------------------

func _combatant(side: String) -> Combatant:
	return _battle.player if side == "player" else _battle.enemy

func _load_sprite(side: String) -> void:
	var sprite := _enemy_sprite if side == "enemy" else _player_sprite
	var combatant := _combatant(side)
	sprite.texture = load("res://assets/sprites/creatures/%s.svg" % combatant.creature.species_id)
	sprite.modulate.a = 1.0

func _refresh_panels() -> void:
	var e := _battle.enemy.creature
	_enemy_name.text = e.display_name()
	_enemy_level.text = "Lv.%d" % e.level
	_set_status_tag(_enemy_status, e.status)
	_set_hp_bar("enemy", e.current_hp, e.max_hp())
	if _battle.player == null:
		return   # before the first send-out (intro text still running)
	var p := _battle.player.creature
	_player_name.text = p.display_name()
	_player_level.text = "Lv.%d" % p.level
	_set_status_tag(_player_status, p.status)
	_set_hp_bar("player", p.current_hp, p.max_hp())
	_player_exp_fill.size.x = roundf(116.0 * _exp_frac(p))

func _set_status_tag(label: Label, status_id: String) -> void:
	label.text = StatusFx.tag(status_id)
	label.add_theme_color_override("font_color", StatusFx.color(status_id))

func _set_hp_bar(side: String, value: float, max_hp: int) -> void:
	var frac := clampf(value / maxf(1.0, float(max_hp)), 0.0, 1.0)
	var fill := _enemy_hp_fill if side == "enemy" else _player_hp_fill
	fill.size.x = roundf(88.0 * frac)
	fill.color = COL_HP_HIGH if frac > 0.5 else (COL_HP_MID if frac > 0.2 else COL_HP_LOW)
	if side == "player":
		_player_hp_text.text = "KP %d/%d" % [roundi(value), max_hp]

func _exp_frac(c: Creature) -> float:
	if c.level >= 100:
		return 1.0
	var lo := Growth.exp_to_reach(c.level, c.data().growth_rate)
	var hi := Growth.exp_to_reach(c.level + 1, c.data().growth_rate)
	return clampf(float(c.exp - lo) / maxf(1.0, float(hi - lo)), 0.0, 1.0)

# --- one-time UI construction -----------------------------------------------

func _build_ui() -> void:
	var sky := ColorRect.new()
	sky.color = Color("#202840")
	sky.size = Vector2(320, 100)
	add_child(sky)
	var ground := ColorRect.new()
	ground.color = Color("#18202f")
	ground.position = Vector2(0, 100)
	ground.size = Vector2(320, 80)
	add_child(ground)

	_mk_platform(Vector2(227, 62), Vector2(64, 8))
	_mk_platform(Vector2(28, 114), Vector2(68, 9))
	_enemy_sprite = _mk_sprite(Vector2(235, 18), false)
	_player_sprite = _mk_sprite(Vector2(38, 70), true)

	var enemy_panel := _mk_panel(Vector2(6, 6), Vector2(124, 32), self)
	_enemy_name = _mk_label(enemy_panel, Vector2(5, 2), "")
	_enemy_level = _mk_label(enemy_panel, Vector2(92, 2), "")
	_enemy_status = _mk_label(enemy_panel, Vector2(98, 15), "")
	_enemy_hp_fill = _mk_bar(enemy_panel, Vector2(5, 17), Vector2(90, 5), COL_HP_HIGH)

	var player_panel := _mk_panel(Vector2(186, 86), Vector2(128, 44), self)
	_player_name = _mk_label(player_panel, Vector2(5, 2), "")
	_player_level = _mk_label(player_panel, Vector2(96, 2), "")
	_player_status = _mk_label(player_panel, Vector2(100, 15), "")
	_player_hp_fill = _mk_bar(player_panel, Vector2(5, 17), Vector2(90, 5), COL_HP_HIGH)
	_player_hp_text = _mk_label(player_panel, Vector2(5, 24), "")
	_player_exp_fill = _mk_bar(player_panel, Vector2(5, 38), Vector2(118, 3), COL_EXP)

	_msg_panel = _mk_panel(Vector2(0, 134), Vector2(320, 46), self)
	_msg_label = _mk_label(_msg_panel, Vector2(8, 5), "")
	_msg_label.size = Vector2(230, 36)
	_msg_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

	_action_panel = _mk_panel(Vector2(232, 134), Vector2(88, 46), self)
	for i in ACTIONS.size():
		_action_labels.append(_mk_label(_action_panel, Vector2(8, 4 + i * 13), ACTIONS[i]))
	_action_panel.hide()

	_move_panel = _mk_panel(Vector2(0, 134), Vector2(320, 46), self)
	for i in 4:
		var x := 10 + (i % 2) * 110
		var y := 4 + int(i / 2.0) * 13
		_move_labels.append(_mk_label(_move_panel, Vector2(x, y), ""))
	_move_info = _mk_label(_move_panel, Vector2(10, 32), "", COL_DIM)
	_move_panel.hide()

	_team_panel = _mk_panel(Vector2(70, 22), Vector2(180, 102), self)
	_mk_label(_team_panel, Vector2(8, 3), "TEAM")
	for i in 6:
		_team_labels.append(_mk_label(_team_panel, Vector2(8, 16 + i * 12), ""))
	_team_hint = _mk_label(_team_panel, Vector2(8, 90), "", COL_DIM)
	_team_panel.hide()

	_flash = ColorRect.new()
	_flash.color = Color("#070a12")
	_flash.size = Vector2(320, 180)
	add_child(_flash)

func _mk_panel(pos: Vector2, panel_size: Vector2, parent: Control) -> Control:
	var border := ColorRect.new()
	border.color = Color("#2a3148")
	border.position = pos
	border.size = panel_size
	parent.add_child(border)
	var inner := ColorRect.new()
	inner.color = Color("#10141f")
	inner.position = Vector2.ONE
	inner.size = panel_size - Vector2(2, 2)
	border.add_child(inner)
	return border

func _mk_label(parent: Control, pos: Vector2, txt: String, color: Color = COL_TEXT) -> Label:
	var label := Label.new()
	label.position = pos
	label.text = txt
	label.add_theme_font_size_override("font_size", 8)
	label.add_theme_color_override("font_color", color)
	parent.add_child(label)
	return label

func _mk_bar(parent: Control, pos: Vector2, bar_size: Vector2, fill_color: Color) -> ColorRect:
	var back := ColorRect.new()
	back.color = Color("#0a0d16")
	back.position = pos
	back.size = bar_size
	parent.add_child(back)
	var fill := ColorRect.new()
	fill.color = fill_color
	fill.position = Vector2.ONE
	fill.size = bar_size - Vector2(2, 2)
	back.add_child(fill)
	return fill

func _mk_platform(pos: Vector2, platform_size: Vector2) -> void:
	var platform := ColorRect.new()
	platform.color = Color("#11161f")
	platform.position = pos
	platform.size = platform_size
	add_child(platform)

func _mk_sprite(pos: Vector2, flip: bool) -> TextureRect:
	var sprite := TextureRect.new()
	sprite.position = pos
	sprite.size = Vector2(48, 48)
	sprite.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	sprite.flip_h = flip
	add_child(sprite)
	return sprite
