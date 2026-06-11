class_name ShopPanel extends Control
## Shop purchase UI. Appears when dialog_closed with a shop context.
## Code-built, displays items for sale and current money.

const COL_TEXT := Color("#e8e8f0")
const COL_DIM := Color("#8a90a8")
const COL_DISABLED := Color("#555a6e")
const COL_BG := Color("#10141f")
const COL_BORDER := Color("#2a3148")

enum Ui { BROWSE, CONFIRM }

var _ui: int = Ui.BROWSE
var _item_idx := 0
var _stock_items: Array = []
var _shop_id: String = ""

var _bg: ColorRect
var _title: Label
var _money_label: Label
var _item_list: VBoxContainer
var _item_labels: Array = []
var _details: Label
var _hint: Label

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_ui()
	EventBus.shop_opened.connect(_on_shop_opened)
	hide()

func _build_ui() -> void:
	_bg = ColorRect.new()
	_bg.color = Color("#000000aa")
	_bg.size = size
	add_child(_bg)

	var panel := _mk_panel(Vector2(40, 30), Vector2(240, 120))

	_title = Label.new()
	_title.text = "LADEN"
	_title.position = Vector2(50, 40)
	_title.add_theme_font_size_override("font_size", 10)
	_title.add_theme_color_override("font_color", COL_TEXT)
	add_child(_title)

	_money_label = Label.new()
	_money_label.position = Vector2(200, 40)
	_money_label.add_theme_font_size_override("font_size", 8)
	_money_label.add_theme_color_override("font_color", COL_DIM)
	add_child(_money_label)

	_item_list = VBoxContainer.new()
	_item_list.position = Vector2(50, 55)
	_item_list.size = Vector2(140, 80)
	add_child(_item_list)

	for i in 6:
		var label = Label.new()
		label.add_theme_font_size_override("font_size", 8)
		_item_list.add_child(label)
		_item_labels.append(label)

	_details = Label.new()
	_details.position = Vector2(200, 55)
	_details.size = Vector2(70, 80)
	_details.add_theme_font_size_override("font_size", 7)
	_details.add_theme_color_override("font_color", COL_DIM)
	_details.autowrap_mode = TextServer.AUTOWRAP_WORD
	add_child(_details)

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

func _on_shop_opened(shop_id: String, stock: Array) -> void:
	_shop_id = shop_id
	_stock_items = []
	var item_db = ItemDatabase.new()
	for item_id in stock:
		if item_db.has(item_id):
			_stock_items.append(item_db.get_item(item_id))
	_item_idx = 0
	_ui = Ui.BROWSE
	show()
	_refresh()

func _on_confirm() -> void:
	if _item_idx >= _stock_items.size():
		return
	var item: ItemData = _stock_items[_item_idx]
	if GameState.money < item.price:
		_hint.text = "Nicht genug Geld!"
		return
	GameState.money -= item.price
	GameState.inventory.add_item(item.id)
	_hint.text = "%s gekauft!" % item.display_name
	_refresh()

func _on_nav(dir: int) -> void:
	if _stock_items.size() > 0:
		_item_idx = wrapi(_item_idx + dir, 0, _stock_items.size())
		_refresh()

func _refresh() -> void:
	_money_label.text = "¥%d" % GameState.money
	for i in _item_labels.size():
		var label: Label = _item_labels[i]
		if i >= _stock_items.size():
			label.hide()
			continue
		label.show()
		var item: ItemData = _stock_items[i]
		label.text = "%s%s  ¥%d" % [
			"> " if i == _item_idx else "  ",
			item.display_name,
			item.price,
		]
		var color := COL_TEXT if i == _item_idx else COL_DIM
		label.add_theme_color_override("font_color", color)
	if _item_idx < _stock_items.size():
		var item: ItemData = _stock_items[_item_idx]
		_details.text = "%s\n\n¥%d" % [item.description, item.price]
	else:
		_details.text = ""
	_hint.text = "[E] kaufen · [Esc] schließen"

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
