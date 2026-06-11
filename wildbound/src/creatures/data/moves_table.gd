class_name MovesTable
## Pure data: every move in the game. Kept as a plain literal (no engine refs) so
## tools/verify_project.py can validate it without Godot. Built into typed
## MoveData resources by MoveDatabase.
##
## Fields: id, display_name, type, category(physical|special|status),
##         power, accuracy, pp, [priority], [effect], description
## effect: {"kind": "stat", "stat": ..., "stages": ..., "target": "self|enemy"}
##         {"kind": "status", "status": "poison|burn", "chance": 1..100}

const DATA := [
	{"id": "rempler", "display_name": "Rempler", "type": "bestie", "category": "physical", "power": 40, "accuracy": 100, "pp": 35, "description": "Ein kräftiger Stoß mit dem ganzen Körper."},
	{"id": "kratzer", "display_name": "Kratzer", "type": "bestie", "category": "physical", "power": 40, "accuracy": 100, "pp": 35, "description": "Harte Krallen fügen leichten Schaden zu."},
	{"id": "fauchen", "display_name": "Fauchen", "type": "bestie", "category": "status", "power": 0, "accuracy": 100, "pp": 30,
		"effect": {"kind": "stat", "stat": "atk", "stages": -1, "target": "enemy"},
		"description": "Ein Drohlaut, der den Angriff des Ziels senkt."},
	{"id": "rankenschlag", "display_name": "Rankenschlag", "type": "pflanze", "category": "physical", "power": 45, "accuracy": 100, "pp": 25, "description": "Peitschende Ranken treffen das Ziel."},
	{"id": "blattwirbel", "display_name": "Blattwirbel", "type": "pflanze", "category": "special", "power": 55, "accuracy": 95, "pp": 20, "description": "Ein Wirbel scharfkantiger Blätter."},
	{"id": "wachstum", "display_name": "Wachstum", "type": "pflanze", "category": "status", "power": 0, "accuracy": 100, "pp": 20,
		"effect": {"kind": "stat", "stat": "spa", "stages": 1, "target": "self"},
		"description": "Konzentriert Lebenskraft und stärkt den Sp.-Angriff."},
	{"id": "dornsalve", "display_name": "Dornsalve", "type": "pflanze", "category": "physical", "power": 25, "accuracy": 100, "pp": 30, "description": "Eine Salve harter Dornen."},
	{"id": "glutfunke", "display_name": "Glutfunke", "type": "feuer", "category": "special", "power": 40, "accuracy": 100, "pp": 25,
		"effect": {"kind": "status", "status": "burn", "chance": 10},
		"description": "Ein kleiner Funke, der das Ziel verbrennen kann."},
	{"id": "flammenbiss", "display_name": "Flammenbiss", "type": "feuer", "category": "physical", "power": 60, "accuracy": 95, "pp": 15,
		"effect": {"kind": "status", "status": "burn", "chance": 10},
		"description": "Ein Biss mit glühenden Zähnen."},
	{"id": "lodern", "display_name": "Lodern", "type": "feuer", "category": "status", "power": 0, "accuracy": 100, "pp": 20,
		"effect": {"kind": "stat", "stat": "atk", "stages": 1, "target": "self"},
		"description": "Lodernde Wut steigert den Angriff."},
	{"id": "aquastoss", "display_name": "Aquastoß", "type": "wasser", "category": "special", "power": 40, "accuracy": 100, "pp": 25, "description": "Ein gezielter Strahl aus Wasser."},
	{"id": "flossenhieb", "display_name": "Flossenhieb", "type": "wasser", "category": "physical", "power": 55, "accuracy": 100, "pp": 20, "description": "Ein Schlag mit harter Flosse."},
	{"id": "nebelschild", "display_name": "Nebelschild", "type": "wasser", "category": "status", "power": 0, "accuracy": 100, "pp": 20,
		"effect": {"kind": "stat", "stat": "def", "stages": 1, "target": "self"},
		"description": "Feiner Nebel hebt die Verteidigung."},
	{"id": "steinwurf", "display_name": "Steinwurf", "type": "erde", "category": "physical", "power": 50, "accuracy": 95, "pp": 20, "description": "Wirft einen harten Stein auf das Ziel."},
	{"id": "windstoss", "display_name": "Windstoß", "type": "luft", "category": "special", "power": 40, "accuracy": 100, "pp": 25, "description": "Ein scharfer Stoß aus verdichteter Luft."},
	{"id": "funkenschlag", "display_name": "Funkenschlag", "type": "blitz", "category": "special", "power": 45, "accuracy": 100, "pp": 25, "description": "Eine knisternde Entladung."},
	{"id": "frosthauch", "display_name": "Frosthauch", "type": "eis", "category": "special", "power": 45, "accuracy": 100, "pp": 20, "description": "Ein Hauch klirrender Kälte legt sich über das Ziel."},
	{"id": "giftstachel", "display_name": "Giftstachel", "type": "gift", "category": "physical", "power": 30, "accuracy": 100, "pp": 30,
		"effect": {"kind": "status", "status": "poison", "chance": 30},
		"description": "Ein Stich, der das Ziel vergiften kann."},
	{"id": "gedankenstoss", "display_name": "Gedankenstoß", "type": "mystik", "category": "special", "power": 50, "accuracy": 100, "pp": 20, "description": "Eine Welle geistiger Kraft."},
]
