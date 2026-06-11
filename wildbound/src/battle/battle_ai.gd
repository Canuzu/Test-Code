class_name BattleAI
## Move selection for wild creatures. Not a planner — a weighted roll that
## prefers effective damage, avoids obviously wasted picks (stacking a maxed
## boost, poisoning the already-poisoned), and otherwise keeps wild battles a
## little unpredictable. Trainer AI (M6) will build on top of this.

const STAT_MOVE_WEIGHT := 30.0
const STATUS_MOVE_WEIGHT := 35.0
const WASTED_WEIGHT := 2.0

## Index into user.creature.moves, or -1 when no PP is left anywhere
## (the battle engine then falls back to Verzweifler).
static func pick_move(user: Combatant, target: Combatant, rng: RandomNumberGenerator) -> int:
	var indices: Array = []
	var weights: Array = []
	var total := 0.0
	for i in user.creature.moves.size():
		if user.pp_left(i) <= 0:
			continue
		var move: MoveData = MoveDatabase.get_move(user.creature.moves[i])
		if move == null:
			continue
		var w := _score(user, target, move)
		indices.append(i)
		weights.append(w)
		total += w
	if indices.is_empty():
		return -1
	var roll := rng.randf() * total
	for j in indices.size():
		roll -= weights[j]
		if roll <= 0.0:
			return indices[j]
	return indices.back()

static func _score(user: Combatant, target: Combatant, move: MoveData) -> float:
	if move.category == MoveData.Category.STATUS:
		return _status_score(user, target, move)
	var eff := TypeChart.multiplier(move.type, target.creature.data().types)
	var stab := Damage.STAB_MULT if move.type in user.creature.data().types else 1.0
	var expected := move.power * eff * stab * move.accuracy / 100.0
	return maxf(1.0, expected)

static func _status_score(user: Combatant, target: Combatant, move: MoveData) -> float:
	var effect: Dictionary = move.effect
	match String(effect.get("kind", "")):
		"stat":
			var who := user if effect.get("target", "self") == "self" else target
			var stage: int = who.stages[Stats.IDS[effect["stat"]]]
			var delta := int(effect["stages"])
			# Pushing past +/-2 is rarely worth a turn for a wild creature.
			if (delta > 0 and stage >= 2) or (delta < 0 and stage <= -2):
				return WASTED_WEIGHT
			return STAT_MOVE_WEIGHT
		"status":
			if target.creature.status != "" \
					or StatusFx.blocked_by_types(effect.get("status", ""), target.creature.data().types):
				return WASTED_WEIGHT
			return STATUS_MOVE_WEIGHT
	return WASTED_WEIGHT
