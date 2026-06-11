class_name SpeciesData extends Resource
## A creature species definition: base stats, typing, learnset, and evolution.
## Typed Resource (engine-integrated, .tres-authorable later); built here from
## the species data table.

@export var id: String = ""
@export var display_name: String = ""
@export var dex: int = 0
@export var types: Array = []          # Array[int] (1 or 2 entries)
@export var base_stats: Array = []     # 6 ints, indexed by Stats.S
@export var catch_rate: int = 120
@export var base_exp: int = 60
@export var growth_rate: int = Growth.Rate.MEDIUM
@export var learnset: Array = []       # [{ "level": int, "move": String }]
@export var evolves_to: String = ""
@export var evolve_level: int = 0
@export var description: String = ""

static func from_dict(d: Dictionary) -> SpeciesData:
	var s := SpeciesData.new()
	s.id = d["id"]
	s.display_name = d["display_name"]
	s.dex = int(d.get("dex", 0))
	s.types = []
	for t in d.get("types", []):
		s.types.append(Types.from_id(t))
	s.base_stats = d["base_stats"]
	s.catch_rate = int(d.get("catch_rate", 120))
	s.base_exp = int(d.get("base_exp", 60))
	s.growth_rate = Growth.rate_from_id(d.get("growth", "medium"))
	s.learnset = d.get("learnset", [])
	s.evolves_to = d.get("evolves_to", "")
	s.evolve_level = int(d.get("evolve_level", 0))
	s.description = d.get("description", "")
	return s

## Move ids this species would know if levelled naturally to `level` (last 4).
func moves_up_to(level: int) -> Array:
	var out: Array = []
	for entry in learnset:
		if int(entry["level"]) <= level and not out.has(entry["move"]):
			out.append(entry["move"])
	if out.size() > 4:
		out = out.slice(out.size() - 4, out.size())
	return out
