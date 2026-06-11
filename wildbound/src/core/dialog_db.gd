class_name DialogDb
## Loads and caches dialog content from data/dialogs/*.json.
##
## Files are listed explicitly (instead of scanning the directory) so exported
## builds work without extra export filters for directory listings. Each file
## maps dialog ids to { "pages": [ { "speaker": String, "text": String } ] }.

const FILES := [
	"res://data/dialogs/farnried.json",
	"res://data/dialogs/moospfad.json",
	"res://data/dialogs/elder_house.json",
]

static var _cache: Dictionary = {}
static var _loaded := false

static func get_pages(dialog_id: String) -> Array:
	if not _loaded:
		_load_all()
	var entry: Dictionary = _cache.get(dialog_id, {})
	return entry.get("pages", [])

static func _load_all() -> void:
	_loaded = true
	for path in FILES:
		var file := FileAccess.open(path, FileAccess.READ)
		if file == null:
			push_error("DialogDb: cannot open %s" % path)
			continue
		var data: Variant = JSON.parse_string(file.get_as_text())
		file.close()
		if typeof(data) != TYPE_DICTIONARY:
			push_error("DialogDb: malformed JSON in %s" % path)
			continue
		_cache.merge(data, true)
