extends Node
## Holds all runtime state that belongs in a save file. Autoloaded as `GameState`.
## Serialization (to/from a plain Dictionary) lives here; SaveManager handles the
## disk I/O. As new systems arrive (inventory, quests) they extend
## to_dict()/apply_dict() and the save format grows in one obvious place.

const START_MAP := "farnried"
const START_CELL := Vector2i(9, 8)

var player_name: String = "Hero"
var current_map: String = START_MAP
var player_cell: Vector2i = START_CELL
var facing: int = Direction.Dir.DOWN
var playtime: float = 0.0
var flags: Dictionary = {}
var party: Array = []   # of Creature (max 6)
var inventory: Inventory = Inventory.new()
var money: int = 0

var _counting: bool = true

func _process(delta: float) -> void:
	if _counting:
		playtime += delta

## Resets to a fresh-game baseline.
func new_game() -> void:
	player_name = "Hero"
	current_map = START_MAP
	player_cell = START_CELL
	facing = Direction.Dir.DOWN
	playtime = 0.0
	flags = {}
	party = []
	inventory = Inventory.new()
	money = 1000

func to_dict() -> Dictionary:
	var party_data: Array = []
	for creature in party:
		party_data.append(creature.to_dict())
	return {
		"player_name": player_name,
		"current_map": current_map,
		"player_cell": [player_cell.x, player_cell.y],
		"facing": facing,
		"playtime": playtime,
		"flags": flags,
		"party": party_data,
		"inventory": inventory.to_dict(),
		"money": money,
	}

func apply_dict(data: Dictionary) -> void:
	player_name = data.get("player_name", player_name)
	current_map = data.get("current_map", current_map)
	var pc: Array = data.get("player_cell", [player_cell.x, player_cell.y])
	player_cell = Vector2i(int(pc[0]), int(pc[1]))
	facing = int(data.get("facing", facing))
	playtime = float(data.get("playtime", playtime))
	flags = data.get("flags", {})
	party = []
	for creature_data in data.get("party", []):
		party.append(Creature.from_dict(creature_data))
	inventory = Inventory.new()
	inventory.from_dict(data.get("inventory", {}))
	money = int(data.get("money", 0))
