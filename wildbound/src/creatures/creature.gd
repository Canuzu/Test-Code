class_name Creature extends RefCounted
## A live creature instance: a species + level + per-individual values (IVs),
## current HP, status, and up to four known moves. Computes stats on demand from
## the species base stats, handles EXP/level-ups, learning, and evolution, and
## serializes to/from a plain dictionary for saves.

var species_id: String = ""
var nickname: String = ""
var level: int = 1
var exp: int = 0
var ivs: Array = []          # 6 ints (0..31)
var current_hp: int = 1
var status: String = ""
var moves: Array = []        # move ids (max 4)

static func create(species: String, lvl: int) -> Creature:
	var c := Creature.new()
	c.species_id = species
	c.level = clampi(lvl, 1, 100)
	c.ivs = []
	for _i in Stats.COUNT:
		c.ivs.append(randi() % 32)
	c.exp = Growth.exp_to_reach(c.level, c.data().growth_rate)
	c.moves = c.data().moves_up_to(c.level)
	c.current_hp = c.max_hp()
	return c

func data() -> SpeciesData:
	return SpeciesDatabase.get_species(species_id)

func display_name() -> String:
	return nickname if nickname != "" else data().display_name

func stat(index: int) -> int:
	return Stats.calc(data().base_stats[index], ivs[index], level, index == Stats.S.HP)

func max_hp() -> int:
	return stat(Stats.S.HP)

func is_fainted() -> bool:
	return current_hp <= 0

## Adds EXP and resolves any resulting level-ups (with HP growth, move learning,
## and evolution). Emits EventBus signals so UI can react; signal order matches
## how the battle log should read: level → learned moves → evolution.
func gain_exp(amount: int) -> void:
	if level >= 100:
		return
	exp += amount
	while level < 100 and exp >= Growth.exp_to_reach(level + 1, data().growth_rate):
		var old_max := max_hp()
		level += 1
		current_hp += max_hp() - old_max
		EventBus.creature_leveled.emit(self, level)
		_learn_at(level)
		_try_evolve()

## Restores full HP and clears any status condition (used by the blackout flow
## and, later, healing stations).
func heal_full() -> void:
	current_hp = max_hp()
	status = ""

func _learn_at(lvl: int) -> void:
	for entry in data().learnset:
		if int(entry["level"]) == lvl and not moves.has(entry["move"]):
			if moves.size() < 4:
				moves.append(entry["move"])
				EventBus.creature_learned_move.emit(self, entry["move"])

func _try_evolve() -> void:
	var sp := data()
	if sp.evolves_to != "" and sp.evolve_level > 0 and level >= sp.evolve_level:
		var old_name := sp.display_name
		species_id = sp.evolves_to
		current_hp = min(current_hp, max_hp())
		EventBus.creature_evolved.emit(old_name, data().display_name)

func to_dict() -> Dictionary:
	return {
		"species": species_id,
		"nickname": nickname,
		"level": level,
		"exp": exp,
		"ivs": ivs,
		"current_hp": current_hp,
		"status": status,
		"moves": moves,
	}

static func from_dict(d: Dictionary) -> Creature:
	var c := Creature.new()
	c.species_id = d.get("species", "")
	c.nickname = d.get("nickname", "")
	c.level = int(d.get("level", 1))
	c.exp = int(d.get("exp", 0))
	c.ivs = d.get("ivs", [0, 0, 0, 0, 0, 0])
	c.current_hp = int(d.get("current_hp", 1))
	c.status = d.get("status", "")
	c.moves = d.get("moves", [])
	return c
