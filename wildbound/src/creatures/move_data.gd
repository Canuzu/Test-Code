class_name MoveData extends Resource
## A move definition. Typed Resource so it integrates with the engine and could
## be authored as .tres later; built here from the moves data table.

enum Category { PHYSICAL, SPECIAL, STATUS }

@export var id: String = ""
@export var display_name: String = ""
@export var type: int = Types.T.BESTIE
@export var category: Category = Category.PHYSICAL
@export var power: int = 0
@export var accuracy: int = 100
@export var pp: int = 10
@export var priority: int = 0
## Structured battle effect (validated by tools/verify_project.py):
##   {"kind": "stat", "stat": "atk|def|spa|spd|spe", "stages": -2..2, "target": "self|enemy"}
##   {"kind": "status", "status": "poison|burn", "chance": 1..100}
## Status-category moves apply it as their whole action; damaging moves roll
## `chance` as a secondary effect after dealing damage. Empty = no effect.
@export var effect: Dictionary = {}
@export var description: String = ""

static func from_dict(d: Dictionary) -> MoveData:
	var m := MoveData.new()
	m.id = d["id"]
	m.display_name = d["display_name"]
	m.type = Types.from_id(d["type"])
	m.category = _category(d.get("category", "physical"))
	m.power = int(d.get("power", 0))
	m.accuracy = int(d.get("accuracy", 100))
	m.pp = int(d.get("pp", 10))
	m.priority = int(d.get("priority", 0))
	m.effect = d.get("effect", {})
	m.description = d.get("description", "")
	return m

static func _category(s: String) -> Category:
	match s:
		"special":
			return Category.SPECIAL
		"status":
			return Category.STATUS
	return Category.PHYSICAL
