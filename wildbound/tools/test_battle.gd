extends Node
## Headless engine tests for the battle system. Run from the project root:
##
##   godot --headless res://tools/test_battle.tscn
##
## Runs as a scene (not `godot -s`) so the project boots normally and the
## autoloads (EventBus, …) exist. Exits non-zero on failure, so this can gate
## CI wherever a Godot binary is available; tools/verify_project.py covers the
## data layer without the engine.

var failures := 0

func _ready() -> void:
	print("battle tests:")
	_test_stage_math()
	_test_damage_formula()
	_test_status_fx()
	_test_ai()
	_test_win_and_exp()
	_test_flee()
	_test_loss_and_replace()
	if failures == 0:
		print("\nAll battle tests passed.")
	else:
		printerr("\n%d battle test(s) FAILED." % failures)
	get_tree().quit(1 if failures > 0 else 0)

func check(cond: bool, label: String) -> void:
	if cond:
		print("  ok: %s" % label)
	else:
		failures += 1
		printerr("  FAIL: %s" % label)

func _rng(seed_value: int) -> RandomNumberGenerator:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value
	return rng

# --- cases ------------------------------------------------------------------

func _test_stage_math() -> void:
	check(Combatant.stage_mult(0) == 1.0, "stage 0 -> x1.0")
	check(Combatant.stage_mult(2) == 2.0, "stage +2 -> x2.0")
	check(Combatant.stage_mult(6) == 4.0, "stage +6 -> x4.0")
	check(Combatant.stage_mult(-2) == 0.5, "stage -2 -> x0.5")
	var c := Combatant.new(Creature.create("mooskind", 10))
	c.change_stage(Stats.S.ATK, 9)
	check(c.stages[Stats.S.ATK] == 6, "stages clamp at +6")
	check(c.change_stage(Stats.S.ATK, 1) == 0, "no change past the clamp")

func _test_damage_formula() -> void:
	var attacker := Combatant.new(Creature.create("mooskind", 10))
	var water := Combatant.new(Creature.create("troepfling", 10))
	var ground := Combatant.new(Creature.create("steinpicker", 10))
	var ranken := MoveDatabase.get_move("rankenschlag")
	var funken := MoveDatabase.get_move("funkenschlag")

	var hit: Dictionary = Damage.calc(attacker, water, ranken, _rng(7))
	check(not hit["missed"] and hit["damage"] >= 1, "damaging hit deals at least 1")
	check(hit["effectiveness"] == 2.0, "pflanze vs wasser is super effective")

	var immune: Dictionary = Damage.calc(attacker, ground, funken, _rng(7))
	check(immune["effectiveness"] == 0.0 and immune["damage"] == 0, "blitz vs erde is immune")

	var clean: Dictionary = Damage.calc(attacker, water, ranken, _rng(11))
	attacker.creature.status = "burn"
	var burned: Dictionary = Damage.calc(attacker, water, ranken, _rng(11))
	attacker.creature.status = ""
	check(burned["damage"] < clean["damage"], "burn halves physical damage")

func _test_status_fx() -> void:
	check(StatusFx.chip_damage("poison", 24) == 3, "poison chips 1/8")
	check(StatusFx.chip_damage("burn", 32) == 2, "burn chips 1/16")
	check(StatusFx.chip_damage("poison", 4) == 1, "chip is never 0")
	check(StatusFx.blocked_by_types("poison", [Types.T.GIFT]), "gift-types are poison-immune")
	check(not StatusFx.blocked_by_types("burn", [Types.T.WASSER]), "wasser-types can burn")

func _test_ai() -> void:
	var user := Combatant.new(Creature.create("nebelmotte", 10))
	var target := Combatant.new(Creature.create("mooskind", 10))
	var pick := BattleAI.pick_move(user, target, _rng(3))
	check(pick >= 0 and pick < user.creature.moves.size(), "AI picks a known move")
	check(user.pp_left(pick) > 0, "AI pick has PP")
	for i in user.pp.size():
		user.pp[i] = 0
	check(BattleAI.pick_move(user, target, _rng(3)) == -1, "AI falls back to Verzweifler without PP")

func _test_win_and_exp() -> void:
	var party: Array = [Creature.create("mooskind", 12)]
	var battle := Battle.new(party, Creature.create("nebelmotte", 3), _rng(42))
	var events := battle.start()
	check(not events.is_empty(), "start produces intro events")
	var exp_before: int = party[0].exp
	var guard := 0
	while battle.phase != Battle.Phase.DONE and guard < 60:
		battle.choose_move(0)
		guard += 1
	check(battle.phase == Battle.Phase.DONE, "battle reaches DONE")
	check(battle.outcome == "win", "strong player wins (outcome '%s')" % battle.outcome)
	check(battle.enemy.creature.is_fainted(), "enemy fainted")
	check(party[0].exp > exp_before, "winner gained EXP")

func _test_flee() -> void:
	var party: Array = [Creature.create("glimmkaefer", 20)]
	var battle := Battle.new(party, Creature.create("steinpicker", 3), _rng(5))
	battle.start()
	battle.choose_flee()
	check(battle.phase == Battle.Phase.DONE and battle.outcome == "fled",
		"faster creature always escapes")

func _test_loss_and_replace() -> void:
	var party: Array = [Creature.create("mooskind", 2), Creature.create("troepfling", 2)]
	var battle := Battle.new(party, Creature.create("infernax", 40), _rng(13))
	battle.start()
	var saw_replace := false
	var guard := 0
	while battle.phase != Battle.Phase.DONE and guard < 100:
		if battle.phase == Battle.Phase.REPLACE:
			saw_replace = true
			check(battle.choose_replacement(1).size() > 0, "replacement produces events")
		else:
			battle.choose_move(0)
		guard += 1
	check(saw_replace, "fainting with a healthy backup forces REPLACE")
	check(battle.phase == Battle.Phase.DONE and battle.outcome == "loss",
		"outmatched party loses (outcome '%s')" % battle.outcome)
	check(party[0].is_fainted() and party[1].is_fainted(), "whole party fainted")
