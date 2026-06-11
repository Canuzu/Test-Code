class_name SpeciesTable
## Pure data: every creature species. Plain literal (no engine refs) so
## tools/verify_project.py can validate the whole roster — typing, stat arrays,
## learnset move ids, and evolution chains — without Godot. Built into typed
## SpeciesData resources by SpeciesDatabase.
##
## base_stats order = Stats.S: [KP, ANG, VER, SAN, SVE, INI]
## Three starter lines (Pflanze/Feuer/Wasser), each 3 stages, plus wild species.

const DATA := [
	# --- Pflanze line ---------------------------------------------------------
	{"id": "mooskind", "display_name": "Mooskind", "dex": 1, "types": ["pflanze"],
		"base_stats": [45, 49, 49, 55, 55, 45], "catch_rate": 45, "base_exp": 64, "growth": "medium",
		"evolves_to": "farnax", "evolve_level": 16,
		"learnset": [{"level": 1, "move": "rempler"}, {"level": 1, "move": "rankenschlag"}, {"level": 7, "move": "fauchen"}, {"level": 12, "move": "blattwirbel"}, {"level": 18, "move": "wachstum"}],
		"description": "Ein scheues Wesen aus Moos und Farn. Es schläft, wo der Nebel am dichtesten ist."},
	{"id": "farnax", "display_name": "Farnax", "dex": 2, "types": ["pflanze"],
		"base_stats": [60, 62, 63, 70, 70, 60], "catch_rate": 45, "base_exp": 142, "growth": "medium",
		"evolves_to": "wurzeltitan", "evolve_level": 32,
		"learnset": [{"level": 1, "move": "rankenschlag"}, {"level": 14, "move": "blattwirbel"}, {"level": 20, "move": "dornsalve"}, {"level": 26, "move": "wachstum"}],
		"description": "Aus seinen Schultern wachsen Wedel, die bei Gefahr aufrichten."},
	{"id": "wurzeltitan", "display_name": "Wurzeltitan", "dex": 3, "types": ["pflanze", "erde"],
		"base_stats": [85, 90, 92, 95, 95, 70], "catch_rate": 45, "base_exp": 236, "growth": "medium",
		"learnset": [{"level": 1, "move": "blattwirbel"}, {"level": 32, "move": "steinwurf"}, {"level": 38, "move": "dornsalve"}],
		"description": "Uralt und geduldig. Seine Wurzeln halten ganze Hänge zusammen."},

	# --- Feuer line -----------------------------------------------------------
	{"id": "funkwelp", "display_name": "Funkwelp", "dex": 4, "types": ["feuer"],
		"base_stats": [45, 55, 45, 58, 50, 55], "catch_rate": 45, "base_exp": 65, "growth": "medium",
		"evolves_to": "glutpirsch", "evolve_level": 16,
		"learnset": [{"level": 1, "move": "kratzer"}, {"level": 1, "move": "glutfunke"}, {"level": 9, "move": "fauchen"}, {"level": 14, "move": "flammenbiss"}, {"level": 20, "move": "lodern"}],
		"description": "Ein junger Streuner mit glühender Schnauze. Wärmt sich nachts an Aschehaufen."},
	{"id": "glutpirsch", "display_name": "Glutpirsch", "dex": 5, "types": ["feuer"],
		"base_stats": [60, 70, 55, 72, 60, 70], "catch_rate": 45, "base_exp": 144, "growth": "medium",
		"evolves_to": "infernax", "evolve_level": 32,
		"learnset": [{"level": 1, "move": "glutfunke"}, {"level": 16, "move": "flammenbiss"}, {"level": 24, "move": "lodern"}],
		"description": "Schnell und wachsam. Seine Pranken hinterlassen versengte Spuren."},
	{"id": "infernax", "display_name": "Infernax", "dex": 6, "types": ["feuer", "bestie"],
		"base_stats": [80, 100, 70, 90, 75, 95], "catch_rate": 45, "base_exp": 240, "growth": "medium",
		"learnset": [{"level": 1, "move": "flammenbiss"}, {"level": 32, "move": "lodern"}, {"level": 40, "move": "kratzer"}],
		"description": "Ein Raubtier aus lebender Glut. Wo es brüllt, weicht der Nebel zurück."},

	# --- Wasser line ----------------------------------------------------------
	{"id": "troepfling", "display_name": "Tröpfling", "dex": 7, "types": ["wasser"],
		"base_stats": [50, 48, 52, 55, 55, 48], "catch_rate": 45, "base_exp": 64, "growth": "medium",
		"evolves_to": "bachhuter", "evolve_level": 16,
		"learnset": [{"level": 1, "move": "rempler"}, {"level": 1, "move": "aquastoss"}, {"level": 8, "move": "nebelschild"}, {"level": 13, "move": "flossenhieb"}, {"level": 19, "move": "fauchen"}],
		"description": "Eine wandelnde Quelltropfen-Gestalt. Folgt jedem Rinnsal neugierig nach."},
	{"id": "bachhuter", "display_name": "Bachhüter", "dex": 8, "types": ["wasser"],
		"base_stats": [65, 60, 68, 68, 68, 58], "catch_rate": 45, "base_exp": 143, "growth": "medium",
		"evolves_to": "flutkoloss", "evolve_level": 32,
		"learnset": [{"level": 1, "move": "aquastoss"}, {"level": 15, "move": "flossenhieb"}, {"level": 22, "move": "nebelschild"}, {"level": 28, "move": "frosthauch"}],
		"description": "Wacht über stille Tümpel. Mancher Wanderer verdankt ihm sein Leben."},
	{"id": "flutkoloss", "display_name": "Flutkoloss", "dex": 9, "types": ["wasser", "eis"],
		"base_stats": [95, 80, 95, 85, 90, 60], "catch_rate": 45, "base_exp": 239, "growth": "medium",
		"learnset": [{"level": 1, "move": "flossenhieb"}, {"level": 32, "move": "frosthauch"}, {"level": 40, "move": "aquastoss"}],
		"description": "Ein Gigant aus Flutwasser und Eis. Sein Atem überzieht Stein mit Reif."},

	# --- Wild species ---------------------------------------------------------
	{"id": "nebelmotte", "display_name": "Nebelmotte", "dex": 10, "types": ["luft", "gift"],
		"base_stats": [40, 35, 40, 55, 45, 70], "catch_rate": 190, "base_exp": 58, "growth": "fast",
		"learnset": [{"level": 1, "move": "windstoss"}, {"level": 1, "move": "giftstachel"}, {"level": 10, "move": "fauchen"}],
		"description": "Treibt in Schwärmen durch den Farnried-Nebel. Ihr Staub macht benommen."},
	{"id": "steinpicker", "display_name": "Steinpicker", "dex": 11, "types": ["erde", "bestie"],
		"base_stats": [55, 65, 75, 35, 45, 40], "catch_rate": 160, "base_exp": 61, "growth": "medium",
		"learnset": [{"level": 1, "move": "kratzer"}, {"level": 1, "move": "steinwurf"}, {"level": 12, "move": "rempler"}],
		"description": "Ein zäher Geselle, der Käfer aus Felsspalten pickt. Stur wie ein Findling."},
	{"id": "glimmkaefer", "display_name": "Glimmkäfer", "dex": 12, "types": ["blitz"],
		"base_stats": [40, 45, 40, 60, 45, 65], "catch_rate": 190, "base_exp": 60, "growth": "fast",
		"learnset": [{"level": 1, "move": "kratzer"}, {"level": 1, "move": "funkenschlag"}, {"level": 11, "move": "fauchen"}],
		"description": "Im hohen Gras blinkt sein Panzer wie ferne Blitze. Sammelt sich bei Gewitter."},
]
