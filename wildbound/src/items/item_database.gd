extends Node
class_name ItemDatabase

var _cache: Dictionary = {}
var _data_loaded := false

func _ready() -> void:
	if not _data_loaded:
		_load_all()

func _load_all() -> void:
	if _data_loaded:
		return
	var table = load("res://src/items/data/items_table.gd").DATA
	for item_dict in table:
		var item = ItemData.from_dict(item_dict)
		_cache[item.id] = item
	_data_loaded = true

func get_item(id: String) -> ItemData:
	if not _data_loaded:
		_load_all()
	return _cache.get(id)

func has(id: String) -> bool:
	if not _data_loaded:
		_load_all()
	return id in _cache

func all_ids() -> Array:
	if not _data_loaded:
		_load_all()
	return _cache.keys()

func all_items() -> Array:
	if not _data_loaded:
		_load_all()
	return _cache.values()
