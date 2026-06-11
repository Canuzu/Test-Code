class_name FarnriedMap
## Farnried — the starting village. Mist-bound, hemmed in by old trees.
## Pure data consumed by GameMap via MapRegistry.
## NOTE: DATA must remain a plain literal — tools/verify_project.py parses it.
##
## Legend: . grass  g tall-grass  p path  ~ water  T tree  o rock  * flowers
##         h house-wall  H roof  D door  S sign

const DATA := {
	"id": "farnried",
	"display_name": "Farnried",
	"ambient": [0.72, 0.76, 0.92],
	"rows": [
		"TTTTTTTTTppTTTTTTTTT",
		"T........pp........T",
		"T..HHHHH.pp.....o..T",
		"T..hhDhh.pp....ooo.T",
		"T....p...pp........T",
		"T....pppppp........T",
		"T........pp...*....T",
		"T..S.....pp........T",
		"T.ggg....pp....ggg.T",
		"T.ggg....pp....ggg.T",
		"T........pp........T",
		"T...*....pp....o...T",
		"T~~......pp......~~T",
		"T~~~.....pp.....~~~T",
		"TTTTTTTTTTTTTTTTTTTT",
	],
	"warps": [
		{"cells": [[9, 0], [10, 0]], "to_map": "moospfad", "to_cell": [6, 16], "facing": "up"},
		{"cells": [[5, 3]], "to_map": "elder_house", "to_cell": [4, 6], "facing": "up"},
	],
	"npcs": [
		{"id": "mira", "sheet": "npc_villager", "cell": [16, 8], "wander": [14, 7, 18, 11], "dialog": "farnried.mira"},
		{"id": "bram", "sheet": "npc_wanderer", "cell": [5, 11], "wander": [2, 10, 8, 13], "dialog": "farnried.bram"},
	],
	"encounters": {"rate": 0.15, "table": [
		{"species": "nebelmotte", "weight": 60, "levels": [2, 4]},
		{"species": "glimmkaefer", "weight": 40, "levels": [2, 4]},
	]},
	"signs": [
		{"cell": [3, 7], "dialog": "farnried.sign_dorf"},
	],
}
