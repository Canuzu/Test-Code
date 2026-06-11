class_name Stats
## Six-stat model with a physical/special split. Stats live as 6-int arrays
## indexed by S; this class centralizes the indices, display names, and the
## level-based stat formula so nothing else hardcodes them.

enum S { HP, ATK, DEF, SPA, SPD, SPE }

const COUNT := 6
const NAMES := ["KP", "Angriff", "Verteidigung", "Sp.-Angriff", "Sp.-Verteidigung", "Initiative"]
const SHORT := ["KP", "ANG", "VER", "SAN", "SVE", "INI"]

## String keys used by move-effect data (battle stat changes). HP is deliberately
## absent — it can never be staged.
const IDS := {"atk": S.ATK, "def": S.DEF, "spa": S.SPA, "spd": S.SPD, "spe": S.SPE}

## Classic level scaling (no EVs/natures yet — those arrive with the battle
## system if we want them). HP uses a slightly different formula than the rest.
static func calc(base: int, iv: int, level: int, is_hp: bool) -> int:
	var core := int(floor((2 * base + iv) * level / 100.0))
	if is_hp:
		return core + level + 10
	return core + 5
