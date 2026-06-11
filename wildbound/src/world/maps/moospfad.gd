class_name MoospfadMap
## Moospfad — the route north of Farnried. Tall grass, old stones, and a road
## to Verdania that the last quake sealed shut.
## Pure data consumed by GameMap via MapRegistry.
## NOTE: DATA must remain a plain literal — tools/verify_project.py parses it.

const DATA := {
	"id": "moospfad",
	"display_name": "Moospfad",
	"ambient": [0.66, 0.72, 0.9],
	"rows": [
		"TTTTTTTTTTTTTT",
		"T....S.......T",
		"T..ggg...o...T",
		"T..ggg.......T",
		"T...p....ggg.T",
		"T...p....ggg.T",
		"T...pp.......T",
		"T....p...~~..T",
		"T....p...~~..T",
		"T..g.p.......T",
		"T..g.p..ooo..T",
		"T....p.......T",
		"T*...p....g..T",
		"T....p....g..T",
		"T....pp......T",
		"T.....p......T",
		"T.....pp.....T",
		"TTTTTTppTTTTTT",
	],
	"warps": [
		{"cells": [[6, 17], [7, 17]], "to_map": "farnried", "to_cell": [9, 1], "facing": "down"},
	],
	"npcs": [
		{"id": "jorin", "sheet": "npc_wanderer", "cell": [9, 12], "wander": [7, 11, 12, 13], "dialog": "moospfad.jorin"},
	],
	"encounters": {"rate": 0.18, "table": [
		{"species": "nebelmotte", "weight": 40, "levels": [3, 5]},
		{"species": "glimmkaefer", "weight": 35, "levels": [3, 5]},
		{"species": "steinpicker", "weight": 25, "levels": [4, 6]},
	]},
	"signs": [
		{"cell": [5, 1], "dialog": "moospfad.sign_nord"},
	],
}
