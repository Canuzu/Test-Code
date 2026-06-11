class_name BagPanel extends Control
## Inventory panel for overworld use. Code-built (no .tscn), toggleable with [B].
## Displays owned items, lets player use consumables on party members.

const COL_TEXT := Color("#e8e8f0")
const COL_DIM := Color("#8a90a8")
const COL_DISABLED := Color("#555a6e")
const COL_BG := Color("#10141f")
const COL_BORDER := Color("#2a3148")

enum Ui { BROWSE, DETAILS, USE, SELECT_CREATURE }

var _ui: int = Ui.BROWSE
var _item_idx := 0
var _creature_idx := 0
var _owned_items: Array = []
var _selected_item: ItemData = null

var _bg: ColorRect
var _title: Label
var _item_list: VBoxContainer
var _item_labels: Array = []
var _details_panel: Control
var _details_text: Label
var _creature_list: VBoxContainer
var _creature_labels: Array = []
var _hint: Label

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_ui()
	EventBus.inventory_changed.connect(_on_inventory_changed)

func _build_ui() -> void:
	_bg = ColorRect.new()
	_bg.color = Color("#000000aa")
	_bg.size = size
	add_child(_bg)

	var panel := _mk_panel(Vector2(40, 30), Vector2(240, 120))

	_title = Label.new()
	_title.text = "BEUTEL"
	_title.position = Vector2(50, 40)
	_title.add_theme_font_size_override("font_size", 10)
	_title.add_theme_color_override("font_color", COL_TEXT)
	add_child(_title)

	_item_list = VBoxContainer.new()
	_item_list.position = Vector2(50, 55)
	_item_list.size = Vector2(100, 80)
	add_child(_item_list)

	for i in 6:
		var label = Label.new()
		label.add_theme_font_size_override("font_size", 8)
		_item_list.add_child(label)
		_item_labels.append(label)

	_details_panel = _mk_panel(Vector2(160, 30), Vector2(110, 120))
	_details_text = Label.new()
	_details_text.position = Vector2(170, 40)
	_details_text.size = Vector2(90, 100)
	_details_text.add_theme_font_size_override("font_size", 7)
	_details_text.add_theme_color_override("font_color", COL_DIM)
	_details_text.autowrap_mode = TextServer.AUTOWRAP_WORD
	add_child(_details_text)

	_creature_list = VBoxContainer.new()
	_creature_list.position = Vector2(50, 55)
	_creature_list.size = Vector2(200, 80)
	_creature_list.hide()
	add_child(_creature_list)

	for i in 6:
		var label = Label.new()
		label.add_theme_font_size_override("font_size", 8)
		_creature_list.add_child(label)
		_creature_labels.append(label)

	_hint = Label.new()
	_hint.position = Vector2(50, 115)
	_hint.add_theme_font_size_override("font_size", 7)
	_hint.add_theme_color_override("font_color", COL_DIM)
	add_child(_hint)

func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event.is_action_pressed("interact"):
		_on_confirm()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("menu"):
		hide()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("move_up"):
		_on_nav(-1)
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("move_down"):
		_on_nav(1)
		get_viewport().set_input_as_handled()

func _on_inventory_changed(item_id: String, count: int) -> void:
	if visible:
		_refresh_items()

func _on_confirm() -> void:
	match _ui:
		Ui.BROWSE:
			if _item_idx < _owned_items.size():
				_selected_item = _owned_items[_item_idx]
				if _selected_item.type == "consumable":
					_ui = Ui.SELECT_CREATURE
					_creature_list.show()
					_item_list.hide()
					_details_panel.hide()
					_refresh_creatures()
				else:
					_hint.text = "Kann nicht verwendet werden"
		Ui.SELECT_CREATURE:
			if _creature_idx < GameState.party.size():
				var creature: Creature = GameState.party[_creature_idx]
				_use_item_on(creature)
				_ui = Ui.BROWSE
				_creature_list.hide()
				_item_list.show()
				_details_panel.show()
				_refresh_items()

func _on_nav(dir: int) -> void:
	match _ui:
		Ui.BROWSE:
			if _owned_items.size() > 0:
				_item_idx = wrapi(_item_idx + dir, 0, _owned_items.size())
				_refresh_items()
		Ui.SELECT_CREATURE:
			if GameState.party.size() > 0:
				_creature_idx = wrapi(_creature_idx + dir, 0, GameState.party.size())
				_refresh_creatures()

func _refresh_items() -> void:
	_owned_items = []
	var item_db = ItemDatabase.new()
	for item_id in GameState.inventory.get_items():
		if item_db.has(item_id):
			_owned_items.append(item_db.get_item(item_id))

	for i in _item_labels.size():
		var label: Label = _item_labels[i]
		if i >= _owned_items.size():
			label.hide()
			continue
		label.show()
		var item: ItemData = _owned_items[i]
		var count := GameState.inventory.count_item(item.id)
		label.text = "%s%s × %d" % [
			"> " if i == _item_idx else "  ",
			item.display_name,
			count,
		]
		label.add_theme_color_override("font_color", COL_TEXT if i == _item_idx else COL_DIM)

	if _item_idx < _owned_items.size():
		_details_text.text = _owned_items[_item_idx].description
	else:
		_details_text.text = ""

	if _owned_items.is_empty():
		_hint.text = "Beutel leer"
	else:
		_hint.text = "[E] verwenden · [Esc] schließen"

func _refresh_creatures() -> void:
	var party: Array = GameState.party
	for i in _creature_labels.size():
		var label: Label = _creature_labels[i]
		if i >= party.size():
			label.hide()
			continue
		label.show()
		var c: Creature = party[i]
		var extra := ""
		if c.is_fainted():
			extra = "  (besiegt)"
		elif c.status != "":
			extra = "  [%s]" % StatusFx.tag(c.status)
		label.text = "%s%s  Lv.%d  KP %d/%d%s" % [
			"> " if i == _creature_idx else "  ",
			c.display_name(),
			c.level,
			c.current_hp,
			c.max_hp(),
			extra,
		]
		var color := COL_TEXT if i == _creature_idx else COL_DIM
		if c.is_fainted():
			color = COL_DISABLED
		label.add_theme_color_override("font_color", color)

	_hint.text = "[E] wählen · [Esc] zurück"

func _use_item_on(creature: Creature) -> void:
	if _selected_item == null:
		return

	match String(_selected_item.effect.get("action", "")):
		"heal_hp":
			var heal_amount: int = int(_selected_item.effect.get("value", 0))
			var old_hp := creature.current_hp
			creature.current_hp = mini(creature.current_hp + heal_amount, creature.max_hp())
			if old_hp != creature.current_hp:
				GameState.inventory.remove_item(_selected_item.id)
				_hint.text = "%s erhält %d KP!" % [creature.display_name(), creature.current_hp - old_hp]
				EventBus.item_used.emit(_selected_item.id, "overworld")
			else:
				_hint.text = "%s ist vollständig genesen!" % creature.display_name()
		"heal_full":
			creature.heal_full()
			GameState.inventory.remove_item(_selected_item.id)
			_hint.text = "%s ist wieder bereit!" % creature.display_name()
			EventBus.item_used.emit(_selected_item.id, "overworld")
		"cure_status":
			var status_id: String = _selected_item.effect.get("status", "")
			if creature.status == status_id:
				creature.status = ""
				GameState.inventory.remove_item(_selected_item.id)
				_hint.text = "%s ist kuriert!" % creature.display_name()
				EventBus.item_used.emit(_selected_item.id, "overworld")
			else:
				_hint.text = "%s hat dieses Problem nicht!" % creature.display_name()
		_:
			_hint.text = "Kann nicht verwendet werden"

func _mk_panel(pos: Vector2, panel_size: Vector2) -> Control:
	var border := ColorRect.new()
	border.color = COL_BORDER
	border.position = pos
	border.size = panel_size
	add_child(border)
	var inner := ColorRect.new()
	inner.color = COL_BG
	inner.position = Vector2.ONE
	inner.size = panel_size - Vector2(2, 2)
	border.add_child(inner)
	return border
