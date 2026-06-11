class_name TypeChart
## Type effectiveness multipliers. Authored as attacker-id -> { defender-id:
## multiplier }; anything unlisted is 1.0. A dual-type defender multiplies both
## of its types, so 0.5 * 2.0 = 1.0, 2.0 * 2.0 = 4.0, etc.
##
## This is a starter chart — coherent (clean Pflanze/Feuer/Wasser triangle,
## Erde immune to Blitz, Luft strong on Pflanze/Bestie) and meant to be tuned
## once battles exist.

const RAW := {
	"pflanze": {"wasser": 2.0, "erde": 2.0, "feuer": 0.5, "pflanze": 0.5, "luft": 0.5, "gift": 0.5, "eis": 0.5},
	"feuer": {"pflanze": 2.0, "eis": 2.0, "feuer": 0.5, "wasser": 0.5, "erde": 0.5},
	"wasser": {"feuer": 2.0, "erde": 2.0, "wasser": 0.5, "pflanze": 0.5},
	"erde": {"feuer": 2.0, "blitz": 2.0, "gift": 2.0, "pflanze": 0.5},
	"luft": {"pflanze": 2.0, "bestie": 2.0, "blitz": 0.5},
	"blitz": {"wasser": 2.0, "luft": 2.0, "pflanze": 0.5, "blitz": 0.5, "erde": 0.0},
	"eis": {"pflanze": 2.0, "erde": 2.0, "luft": 2.0, "feuer": 0.5, "wasser": 0.5, "eis": 0.5},
	"gift": {"pflanze": 2.0, "gift": 0.5, "erde": 0.5, "mystik": 0.5, "bestie": 0.5},
	"mystik": {"gift": 2.0, "bestie": 2.0, "mystik": 0.5},
	"bestie": {"eis": 2.0, "mystik": 0.5, "luft": 0.5, "gift": 0.5},
}

## Multiplier of an attacking type against a defender's (1 or 2) types.
static func multiplier(attacker: int, defender_types: Array) -> float:
	var row: Dictionary = RAW.get(Types.ID_OF[attacker], {})
	var mult := 1.0
	for def_type in defender_types:
		mult *= float(row.get(Types.ID_OF[def_type], 1.0))
	return mult

## "sehr effektiv" / "nicht sehr effektiv" / "kein Effekt" / "" for battle text.
static func describe(mult: float) -> String:
	if mult == 0.0:
		return "Es hat keine Wirkung..."
	if mult > 1.0:
		return "Sehr effektiv!"
	if mult < 1.0:
		return "Nicht sehr effektiv..."
	return ""
