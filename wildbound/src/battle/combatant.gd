class_name Combatant extends RefCounted
## A creature as it exists *inside a battle*: the persistent Creature plus
## volatile battle state. Current HP and status conditions live on the Creature
## itself, so they carry back to the overworld party and into saves; stat stages
## reset on every switch-in and PP lasts only for this battle (M4 simplification
## — see DECISIONS.md).

var creature: Creature
var stages: Array = [0, 0, 0, 0, 0, 0]   # indexed by Stats.S; HP entry unused
var pp: Array = []                        # parallel to creature.moves

func _init(c: Creature) -> void:
	creature = c
	for move_id in c.moves:
		var move: MoveData = MoveDatabase.get_move(move_id)
		pp.append(move.pp if move != null else 0)

## Stat-stage multiplier (-6..+6), as in the classic games.
static func stage_mult(stage: int) -> float:
	if stage >= 0:
		return (2.0 + stage) / 2.0
	return 2.0 / (2.0 - stage)

## Volatile boosts/debuffs do not survive leaving the field.
func reset_stages() -> void:
	stages = [0, 0, 0, 0, 0, 0]

## Effective stat including stat-stage modifiers (HP is never staged).
func eff_stat(index: int) -> int:
	var base := creature.stat(index)
	if index == Stats.S.HP:
		return base
	return maxi(1, int(base * stage_mult(stages[index])))

## Applies a stage delta, clamped to [-6, 6]; returns the actual change.
func change_stage(index: int, delta: int) -> int:
	var old: int = stages[index]
	stages[index] = clampi(old + delta, -6, 6)
	return stages[index] - old

func pp_left(index: int) -> int:
	return pp[index] if index < pp.size() else 0

func spend_pp(index: int) -> void:
	if index >= 0 and index < pp.size() and pp[index] > 0:
		pp[index] -= 1

func out_of_pp() -> bool:
	for index in creature.moves.size():
		if pp_left(index) > 0:
			return false
	return true

func disp_name() -> String:
	return creature.display_name()
