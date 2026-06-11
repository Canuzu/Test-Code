extends Node
## JSON save/load to `user://saves`. Autoloaded as `SaveManager`.
##
## Each slot is a self-describing JSON file with a version + metadata header, so
## a future save/load screen can list slots (name, location, playtime) cheaply
## without deserializing the whole game state. The `_migrate()` hook lets us
## evolve the format across versions without breaking old saves.

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(Constants.SAVE_DIR)

func _slot_path(slot: int) -> String:
	return "%s/slot_%02d.json" % [Constants.SAVE_DIR, slot]

func has_slot(slot: int) -> bool:
	return FileAccess.file_exists(_slot_path(slot))

func save_to_slot(slot: int) -> bool:
	var payload := {
		"version": Constants.SAVE_VERSION,
		"saved_at": Time.get_unix_time_from_system(),
		"metadata": {
			"player_name": GameState.player_name,
			"location": GameState.current_map,
			"playtime": GameState.playtime,
		},
		"state": GameState.to_dict(),
	}
	var file := FileAccess.open(_slot_path(slot), FileAccess.WRITE)
	if file == null:
		EventBus.save_failed.emit(slot, "could not open file for writing")
		return false
	file.store_string(JSON.stringify(payload, "\t"))
	file.close()
	EventBus.game_saved.emit(slot)
	return true

func load_from_slot(slot: int) -> bool:
	if not has_slot(slot):
		return false
	var file := FileAccess.open(_slot_path(slot), FileAccess.READ)
	if file == null:
		return false
	var text := file.get_as_text()
	file.close()
	var data: Variant = JSON.parse_string(text)
	if typeof(data) != TYPE_DICTIONARY:
		return false
	data = _migrate(data)
	GameState.apply_dict(data.get("state", {}))
	EventBus.game_loaded.emit(slot)
	return true

## Returns just the lightweight header for slot listings ({} if empty).
func get_metadata(slot: int) -> Dictionary:
	if not has_slot(slot):
		return {}
	var file := FileAccess.open(_slot_path(slot), FileAccess.READ)
	if file == null:
		return {}
	var data: Variant = JSON.parse_string(file.get_as_text())
	file.close()
	if typeof(data) != TYPE_DICTIONARY:
		return {}
	return data.get("metadata", {})

func delete_slot(slot: int) -> void:
	if has_slot(slot):
		DirAccess.remove_absolute(_slot_path(slot))

## Hook for future save-format upgrades. Receives the raw parsed dict and returns
## a dict matching the current version.
func _migrate(data: Dictionary) -> Dictionary:
	var _v := int(data.get("version", 1))
	# Example for later: if _v < 2: data = _v1_to_v2(data)
	return data
