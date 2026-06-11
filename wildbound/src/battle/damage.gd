class_name Damage
## Pure damage math for the battle system. No nodes, no state — easy to reason
## about and to unit-test. Uses the classic simplified formula with STAB, type
## effectiveness, a critical hit, a small random spread, and burn's physical
## attack penalty. Status-category moves never come through here.

const CRIT_CHANCE := 0.0625
const CRIT_MULT := 1.5
const STAB_MULT := 1.5
const BURN_ATK_MULT := 0.5

## Returns { "missed": true } or
## { "damage": int, "effectiveness": float, "crit": bool, "missed": false }.
static func calc(attacker: Combatant, defender: Combatant, move: MoveData, rng: RandomNumberGenerator) -> Dictionary:
	if move.accuracy < 100 and rng.randi_range(1, 100) > move.accuracy:
		return {"missed": true}

	var is_phys := move.category == MoveData.Category.PHYSICAL
	var atk_index := Stats.S.ATK if is_phys else Stats.S.SPA
	var def_index := Stats.S.DEF if is_phys else Stats.S.SPD
	var a := float(attacker.eff_stat(atk_index))
	if is_phys and attacker.creature.status == "burn":
		a *= BURN_ATK_MULT
	var d := float(defender.eff_stat(def_index))
	var level := attacker.creature.level

	var base := floor(floor(floor(2.0 * level / 5.0 + 2.0) * move.power * a / d) / 50.0) + 2.0
	var eff := TypeChart.multiplier(move.type, defender.creature.data().types)
	var stab := STAB_MULT if move.type in attacker.creature.data().types else 1.0
	var crit := rng.randf() < CRIT_CHANCE
	var crit_mult := CRIT_MULT if crit else 1.0
	var spread := rng.randf_range(0.85, 1.0)

	var dmg := int(base * eff * stab * crit_mult * spread)
	if eff > 0.0:
		dmg = maxi(1, dmg)
	else:
		dmg = 0
	return {"damage": dmg, "effectiveness": eff, "crit": crit, "missed": false}
