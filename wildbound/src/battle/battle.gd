class_name Battle extends RefCounted
## Turn-based battle engine for wild encounters, fully decoupled from any UI.
## Each player decision (choose_move / choose_switch / choose_flee /
## choose_replacement) resolves synchronously and returns an Array of *events* —
## plain dictionaries the battle scene plays back as text, HP tweens, and
## sprite changes:
##
##   {"t": "text",   "msg": String}
##   {"t": "hp",     "side": "player"|"enemy", "from": int, "to": int}
##   {"t": "faint",  "side": "player"|"enemy"}
##   {"t": "switch", "side": "player"}     # (re)load the active sprite + panel
##   {"t": "refresh"}                      # re-read panels (status, exp, level)
##
## After consuming the events the UI checks `phase` (and `outcome` once DONE)
## to decide what to show next. Damage math lives in Damage, conditions in
## StatusFx, enemy move choice in BattleAI. HP and status conditions persist on
## the Creature beyond the battle; stat stages and PP are volatile (Combatant).

enum Phase { CHOOSE, REPLACE, CATCH, DONE }

const EXP_DIVISOR := 7.0
const FLEE_BONUS := 30
## Fallback when every move is out of PP; hurts the user with 1/4 recoil.
const STRUGGLE := {
	"id": "verzweifler", "display_name": "Verzweifler", "type": "bestie",
	"category": "physical", "power": 35, "accuracy": 100, "pp": 1,
	"description": "Letzte Reserve, wenn keine AP mehr übrig sind.",
}

var phase: int = Phase.CHOOSE
var outcome: String = ""          # "win" | "loss" | "fled" once phase == DONE
var player: Combatant
var enemy: Combatant

var _party: Array                 # of Creature; aliases GameState.party
var _combatants: Dictionary = {}  # Creature -> Combatant, so PP survives switches
var _struggle: MoveData = MoveData.from_dict(STRUGGLE)
var _rng: RandomNumberGenerator
var _flee_attempts: int = 0
var _events: Array = []
var _catch_wild: Creature = null  # the wild creature to catch (set when entering CATCH phase)

func _init(party: Array, wild: Creature, rng: RandomNumberGenerator = null) -> void:
	_party = party
	_rng = rng
	if _rng == null:
		_rng = RandomNumberGenerator.new()
		_rng.randomize()
	enemy = Combatant.new(wild)

## Opening events: the wild creature appears, the first able party member enters.
func start() -> Array:
	_text("%s erscheint!" % _label(enemy, "enemy"))
	_send_out(_first_able_index())
	return _flush()

func party() -> Array:
	return _party

func active_index() -> int:
	return _party.find(player.creature)

## Whether _party[index] could be sent out (healthy and not already active).
func can_send(index: int) -> bool:
	if index < 0 or index >= _party.size():
		return false
	var c: Creature = _party[index]
	return not c.is_fainted() and (player == null or c != player.creature)

# --- player decisions ---------------------------------------------------------

## move_index into player.creature.moves, or -1 for Verzweifler (no PP left).
func choose_move(move_index: int) -> Array:
	if phase != Phase.CHOOSE:
		return []
	if move_index >= 0 and player.pp_left(move_index) <= 0:
		return []
	var player_move := _move_for(player, move_index)
	var enemy_index := BattleAI.pick_move(enemy, player, _rng)
	var enemy_move := _move_for(enemy, enemy_index)
	var steps := [
		[player, enemy, player_move, move_index, "player"],
		[enemy, player, enemy_move, enemy_index, "enemy"],
	]
	if not _player_first(player_move, enemy_move):
		steps.reverse()
	for step in steps:
		if phase != Phase.CHOOSE:
			break
		var user: Combatant = step[0]
		if user.creature.is_fainted():
			continue
		_execute(step[0], step[1], step[2], step[3], step[4])
		_check_faints()
	_end_of_turn()
	return _flush()

## Voluntary switch; spends the turn, so the wild creature gets a free move.
func choose_switch(party_index: int) -> Array:
	if phase != Phase.CHOOSE or not can_send(party_index):
		return []
	_text("Zurück, %s!" % player.disp_name())
	_send_out(party_index)
	if not enemy.creature.is_fainted():
		var enemy_index := BattleAI.pick_move(enemy, player, _rng)
		_execute(enemy, player, _move_for(enemy, enemy_index), enemy_index, "enemy")
		_check_faints()
	_end_of_turn()
	return _flush()

func choose_flee() -> Array:
	if phase != Phase.CHOOSE:
		return []
	_flee_attempts += 1
	if _flee_roll():
		_text("Du entkommst!")
		_finish("fled")
	else:
		_text("Flucht gescheitert!")
		var enemy_index := BattleAI.pick_move(enemy, player, _rng)
		_execute(enemy, player, _move_for(enemy, enemy_index), enemy_index, "enemy")
		_check_faints()
		_end_of_turn()
	return _flush()

## After a faint. Unlike choose_switch, the replacement enters for free.
func choose_replacement(party_index: int) -> Array:
	if phase != Phase.REPLACE or not can_send(party_index):
		return []
	phase = Phase.CHOOSE
	_send_out(party_index)
	return _flush()

## After enemy faints. Attempt catch with the given ball.
func choose_catch(ball_id: String) -> Array:
	if phase != Phase.CATCH or _catch_wild == null:
		return []
	_text("Der Ball wirft sich...")
	var enemy_hp_pct := float(enemy.creature.current_hp) / enemy.creature.max_hp()
	var success := Catch.resolve_catch(ball_id, _catch_wild, enemy_hp_pct, _rng)
	for _i in range(4):
		_events.append({"t": "catch_shake"})
	if success:
		_text("Getroffen! %s gefangen!" % _catch_wild.display_name())
		_party.append(_catch_wild)
		_award_exp()
		_finish("win")
	else:
		_text("Verdammt! %s ist entkommen!" % _catch_wild.display_name())
		phase = Phase.CHOOSE
	return _flush()

# --- turn internals -----------------------------------------------------------

func _move_for(user: Combatant, index: int) -> MoveData:
	if index < 0:
		return _struggle
	return MoveDatabase.get_move(user.creature.moves[index])

func _player_first(player_move: MoveData, enemy_move: MoveData) -> bool:
	if player_move.priority != enemy_move.priority:
		return player_move.priority > enemy_move.priority
	var player_speed := player.eff_stat(Stats.S.SPE)
	var enemy_speed := enemy.eff_stat(Stats.S.SPE)
	if player_speed != enemy_speed:
		return player_speed > enemy_speed
	return _rng.randf() < 0.5

func _execute(user: Combatant, target: Combatant, move: MoveData, move_index: int, user_side: String) -> void:
	var label := _label(user, user_side)
	_text("%s setzt %s ein!" % [label, move.display_name])
	user.spend_pp(move_index)

	if move.category == MoveData.Category.STATUS:
		if move.effect.is_empty():
			_text("Doch nichts passiert...")
		else:
			_apply_effect(user, target, move.effect, user_side, true)
		return

	var result := Damage.calc(user, target, move, _rng)
	if result.get("missed", false):
		_text("Die Attacke geht daneben!")
		return
	var eff: float = result["effectiveness"]
	if eff == 0.0:
		_text(TypeChart.describe(0.0))
		return
	_hurt(target, _other(user_side), result["damage"])
	if result["crit"]:
		_text("Ein Volltreffer!")
	var eff_text := TypeChart.describe(eff)
	if eff_text != "":
		_text(eff_text)

	if move == _struggle:
		_text("%s verletzt sich durch den Rückstoß!" % label)
		_hurt(user, user_side, maxi(1, int(result["damage"] / 4.0)))
	elif not target.creature.is_fainted() and move.effect.get("kind", "") == "status":
		if _rng.randi_range(1, 100) <= int(move.effect.get("chance", 100)):
			_apply_effect(user, target, move.effect, user_side, false)

## announce_failure: status-category moves explain why nothing happened; silent
## for secondary effects of damaging moves.
func _apply_effect(user: Combatant, target: Combatant, effect: Dictionary, user_side: String, announce_failure: bool) -> void:
	match String(effect.get("kind", "")):
		"stat":
			var who := user if effect.get("target", "self") == "self" else target
			var who_side := user_side if who == user else _other(user_side)
			var stat_index: int = Stats.IDS[effect["stat"]]
			var delta := int(effect["stages"])
			var changed := who.change_stage(stat_index, delta)
			var subject := "%s von %s" % [Stats.NAMES[stat_index], _label(who, who_side)]
			if changed == 0:
				_text("%s kann sich nicht weiter %s!" % [subject, "erhöhen" if delta > 0 else "verringern"])
			else:
				_text("%s %s!" % [subject, "steigt" if delta > 0 else "sinkt"])
				_refresh()
		"status":
			var status_id: String = effect.get("status", "")
			var target_label := _label(target, _other(user_side))
			if target.creature.status != "":
				if announce_failure:
					_text("%s ist bereits angeschlagen!" % target_label)
			elif StatusFx.blocked_by_types(status_id, target.creature.data().types):
				if announce_failure:
					_text("Auf %s wirkt das nicht..." % target_label)
			else:
				target.creature.status = status_id
				_text(StatusFx.applied_text(status_id, target_label))
				_refresh()

func _end_of_turn() -> void:
	for entry in [[player, "player"], [enemy, "enemy"]]:
		if phase != Phase.CHOOSE:
			return
		var combatant: Combatant = entry[0]
		var status_id: String = combatant.creature.status
		if status_id == "" or combatant.creature.is_fainted():
			continue
		_text(StatusFx.chip_text(status_id, _label(combatant, entry[1])))
		_hurt(combatant, entry[1], StatusFx.chip_damage(status_id, combatant.creature.max_hp()))
		_check_faints()

func _check_faints() -> void:
	if phase != Phase.CHOOSE:
		return
	if enemy.creature.is_fainted():
		_events.append({"t": "faint", "side": "enemy"})
		_text("%s ist besiegt!" % _label(enemy, "enemy"))
		_catch_wild = enemy.creature
		phase = Phase.CATCH
		return
	if player.creature.is_fainted():
		_events.append({"t": "faint", "side": "player"})
		_text("%s ist besiegt!" % player.disp_name())
		if _first_able_index() == -1:
			_text("Du hast keine kampffähigen Kreaturen mehr!")
			_text("Dir wird schwarz vor Augen...")
			_finish("loss")
		else:
			phase = Phase.REPLACE

## Classic yield: base_exp * level / 7, all to the active creature. The battle
## listens to the level/learn/evolve signals so the log narrates them in order.
func _award_exp() -> void:
	var winner := player.creature
	if winner.is_fainted():
		return
	var amount := maxi(1, int(enemy.creature.data().base_exp * enemy.creature.level / EXP_DIVISOR))
	_text("%s erhält %d EXP!" % [winner.display_name(), amount])
	var on_level := func(c: Creature, lvl: int) -> void:
		if c == winner:
			_text("%s erreicht Level %d!" % [c.display_name(), lvl])
			_refresh()
	var on_learn := func(c: Creature, move_id: String) -> void:
		if c == winner:
			var move := MoveDatabase.get_move(move_id)
			_text("%s erlernt %s!" % [c.display_name(), move.display_name if move != null else move_id])
	var on_evolve := func(old_name: String, new_name: String) -> void:
		_text("Was geschieht da...? %s entwickelt sich zu %s!" % [old_name, new_name])
		_events.append({"t": "switch", "side": "player"})
	EventBus.creature_leveled.connect(on_level)
	EventBus.creature_learned_move.connect(on_learn)
	EventBus.creature_evolved.connect(on_evolve)
	winner.gain_exp(amount)
	EventBus.creature_leveled.disconnect(on_level)
	EventBus.creature_learned_move.disconnect(on_learn)
	EventBus.creature_evolved.disconnect(on_evolve)
	_refresh()

# --- helpers --------------------------------------------------------------

func _send_out(party_index: int) -> void:
	var creature: Creature = _party[party_index]
	if not _combatants.has(creature):
		_combatants[creature] = Combatant.new(creature)
	player = _combatants[creature]
	player.reset_stages()
	_events.append({"t": "switch", "side": "player"})
	_text("Los, %s!" % player.disp_name())

func _first_able_index() -> int:
	for i in _party.size():
		if not _party[i].is_fainted():
			return i
	return -1

func _flee_roll() -> bool:
	var player_speed := player.eff_stat(Stats.S.SPE)
	var enemy_speed := maxi(1, enemy.eff_stat(Stats.S.SPE))
	if player_speed >= enemy_speed:
		return true
	var threshold := (int(player_speed * 128.0 / enemy_speed) + FLEE_BONUS * _flee_attempts) % 256
	return _rng.randi_range(0, 255) < threshold

func _hurt(victim: Combatant, side: String, amount: int) -> void:
	var from := victim.creature.current_hp
	victim.creature.current_hp = maxi(0, from - amount)
	_events.append({"t": "hp", "side": side, "from": from, "to": victim.creature.current_hp})

func _finish(result: String) -> void:
	outcome = result
	phase = Phase.DONE

func _label(combatant: Combatant, side: String) -> String:
	return combatant.disp_name() + (" (wild)" if side == "enemy" else "")

func _other(side: String) -> String:
	return "enemy" if side == "player" else "player"

func _text(msg: String) -> void:
	_events.append({"t": "text", "msg": msg})

func _refresh() -> void:
	_events.append({"t": "refresh"})

func _flush() -> Array:
	var out := _events
	_events = []
	return out
