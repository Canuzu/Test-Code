class_name Growth
## Experience curves. Total EXP required to *be* at a level is coeff * level^3,
## giving three pacing options. Used for level-ups and EXP yield later.

enum Rate { FAST, MEDIUM, SLOW }

const IDS := {"fast": Rate.FAST, "medium": Rate.MEDIUM, "slow": Rate.SLOW}

static func rate_from_id(id: String) -> int:
	return IDS.get(id, Rate.MEDIUM)

static func exp_to_reach(level: int, rate: int) -> int:
	var n := level * level * level
	match rate:
		Rate.FAST:
			return int(0.8 * n)
		Rate.SLOW:
			return int(1.25 * n)
	return n
