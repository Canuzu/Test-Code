class_name SpeciesDatabase
## Loads the species data table into typed SpeciesData resources, indexed by id.
## Lazy-built and cached; ids are stable keys used by creatures, evolutions, and
## (later) encounter tables and trainer rosters.

static var _cache: Dictionary = {}

static func _ensure() -> void:
	if _cache.is_empty():
		for entry in SpeciesTable.DATA:
			_cache[entry["id"]] = SpeciesData.from_dict(entry)

static func get_species(id: String) -> SpeciesData:
	_ensure()
	return _cache.get(id)

static func has(id: String) -> bool:
	_ensure()
	return _cache.has(id)

static func all_ids() -> Array:
	_ensure()
	return _cache.keys()
