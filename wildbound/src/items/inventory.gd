class_name Inventory

const MAX_STACK := 99

var _items: Dictionary = {}

func add_item(item_id: String, count: int = 1) -> bool:
	if count <= 0:
		return false
	var current = _items.get(item_id, 0)
	var new_count = min(current + count, MAX_STACK)
	var added = new_count - current
	_items[item_id] = new_count
	if EventBus:
		EventBus.inventory_changed.emit(item_id, new_count)
	return added == count

func remove_item(item_id: String, count: int = 1) -> bool:
	if count <= 0:
		return false
	var current = _items.get(item_id, 0)
	if current < count:
		return false
	var new_count = current - count
	if new_count == 0:
		_items.erase(item_id)
	else:
		_items[item_id] = new_count
	if EventBus:
		EventBus.inventory_changed.emit(item_id, new_count)
	return true

func has_item(item_id: String, count: int = 1) -> bool:
	return _items.get(item_id, 0) >= count

func count_item(item_id: String) -> int:
	return _items.get(item_id, 0)

func get_items() -> Dictionary:
	return _items.duplicate()

func is_empty() -> bool:
	return _items.is_empty()

func to_dict() -> Dictionary:
	return _items.duplicate()

func from_dict(data: Dictionary) -> void:
	_items.clear()
	for item_id in data:
		var count = int(data[item_id])
		if count > 0:
			_items[item_id] = min(count, MAX_STACK)
