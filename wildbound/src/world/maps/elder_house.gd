class_name ElderHouseMap
## Inside the elder's house in Farnried — warm light, old wood, older stories.
## Pure data consumed by GameMap via MapRegistry.
## NOTE: DATA must remain a plain literal — tools/verify_project.py parses it.
##
## Legend: f wood floor  W inner wall  r rug  t table

const DATA := {
	"id": "elder_house",
	"display_name": "Haus der Ältesten",
	"ambient": [1.0, 0.92, 0.78],
	"rows": [
		"WWWWWWWWWW",
		"WffffffffW",
		"WfftfftffW",
		"WffffffffW",
		"WfffrrfffW",
		"WffffffffW",
		"WffffffffW",
		"WWWWrrWWWW",
	],
	"warps": [
		{"cells": [[4, 7], [5, 7]], "to_map": "farnried", "to_cell": [5, 4], "facing": "down"},
	],
	"npcs": [
		{"id": "yra", "sheet": "npc_elder", "cell": [4, 2], "wander": [2, 1, 7, 4], "dialog": "elder_house.aelteste"},
	],
	"signs": [],
}
