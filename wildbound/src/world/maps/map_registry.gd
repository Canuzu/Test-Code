class_name MapRegistry
## Central lookup from map id -> map data dictionary. New maps: create a data
## file in src/world/maps/ and add one match arm here.

static func get_map(id: String) -> Dictionary:
	match id:
		"farnried":
			return FarnriedMap.DATA
		"moospfad":
			return MoospfadMap.DATA
		"elder_house":
			return ElderHouseMap.DATA
	push_error("MapRegistry: unknown map id '%s'" % id)
	return {}

static func display_name(id: String) -> String:
	return get_map(id).get("display_name", id)
