extends Control
## The dialog textbox. Listens for EventBus.dialog_requested, plays pages with a
## typewriter effect, advances on `interact`, and announces open/close on the
## EventBus so gameplay (player, NPCs) can pause itself. It consumes the
## interact press while open, so closing a dialog never re-triggers the
## interactable in the same frame.

const CHARS_PER_SECOND := 45.0

@onready var name_label: Label = $Panel/Name
@onready var text_label: Label = $Panel/Text
@onready var hint_label: Label = $Panel/Hint

var _pages: Array = []
var _page := 0
var _progress := 0.0
var _open := false

func _ready() -> void:
	hide()
	EventBus.dialog_requested.connect(_on_dialog_requested)
	EventBus.map_changed.connect(_on_map_changed)

func _on_map_changed(_map_id: String) -> void:
	if _open:
		_close()

func _on_dialog_requested(dialog_id: String) -> void:
	if _open:
		return
	var pages := DialogDb.get_pages(dialog_id)
	if pages.is_empty():
		push_warning("DialogBox: no pages for dialog id '%s'" % dialog_id)
		return
	_pages = pages
	_page = 0
	_open = true
	show()
	_start_page()
	EventBus.dialog_opened.emit()

func _start_page() -> void:
	var page: Dictionary = _pages[_page]
	name_label.text = page.get("speaker", "")
	name_label.visible = name_label.text != ""
	text_label.text = page.get("text", "")
	text_label.visible_characters = 0
	_progress = 0.0

func _page_done() -> bool:
	return text_label.visible_characters >= text_label.text.length()

func _process(delta: float) -> void:
	if not _open:
		return
	if not _page_done():
		_progress += CHARS_PER_SECOND * delta
		text_label.visible_characters = int(_progress)
	hint_label.visible = _page_done() and (Time.get_ticks_msec() / 300) % 2 == 0

func _unhandled_input(event: InputEvent) -> void:
	if not _open:
		return
	if event.is_action_pressed("interact"):
		if not _page_done():
			text_label.visible_characters = text_label.text.length()
		elif _page + 1 < _pages.size():
			_page += 1
			_start_page()
		else:
			_close()
		get_viewport().set_input_as_handled()

func _close() -> void:
	_open = false
	hide()
	EventBus.dialog_closed.emit()
