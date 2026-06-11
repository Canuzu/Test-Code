class_name StatusFx
## Status conditions (Gift/Brand for now). Pure data + helpers: chip damage at
## end of turn, type immunities, battle texts, and the colored tag the HP panels
## show. The condition id itself lives on Creature.status, so it persists after
## the battle and through saves; Damage applies burn's attack penalty.

const DATA := {
	"poison": {
		"name": "Gift", "tag": "GIF", "color": "#8a5aa6", "chip_div": 8,
		"immune_type": Types.T.GIFT,
		"applied": "%s wurde vergiftet!",
		"chip": "%s leidet unter der Vergiftung!",
	},
	"burn": {
		"name": "Brand", "tag": "BRD", "color": "#c65b3c", "chip_div": 16,
		"immune_type": Types.T.FEUER,
		"applied": "%s erleidet Verbrennungen!",
		"chip": "%s leidet unter der Verbrennung!",
	},
}

static func is_valid(id: String) -> bool:
	return DATA.has(id)

static func tag(id: String) -> String:
	return DATA[id]["tag"] if DATA.has(id) else ""

static func color(id: String) -> Color:
	return Color(DATA[id]["color"]) if DATA.has(id) else Color.WHITE

## End-of-turn damage; always at least 1 so a condition is never free.
static func chip_damage(id: String, max_hp: int) -> int:
	return maxi(1, int(max_hp / float(DATA[id]["chip_div"])))

static func applied_text(id: String, name: String) -> String:
	return String(DATA[id]["applied"]) % name

static func chip_text(id: String, name: String) -> String:
	return String(DATA[id]["chip"]) % name

## Creatures cannot suffer a condition of their own element (Gift-types can't be
## poisoned, Feuer-types can't burn).
static func blocked_by_types(id: String, types: Array) -> bool:
	return DATA.has(id) and DATA[id]["immune_type"] in types
