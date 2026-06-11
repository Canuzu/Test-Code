class_name MoveDatabase
## Loads the moves data table into typed MoveData resources, indexed by id.
## Lazy-built and cached; ids are stable keys used by learnsets and creatures.

static var _cache: Dictionary = {}

static func _ensure() -> void:
	if _cache.is_empty():
		for entry in MovesTable.DATA:
			_cache[entry["id"]] = MoveData.from_dict(entry)

static func get_move(id: String) -> MoveData:
	_ensure()
	return _cache.get(id)

static func has(id: String) -> bool:
	_ensure()
	return _cache.has(id)

static func all_ids() -> Array:
	_ensure()
	return _cache.keys()
