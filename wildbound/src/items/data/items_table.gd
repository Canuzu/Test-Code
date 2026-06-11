const DATA := [
	# --- Pokéballs (catch items) ---
	{
		"id": "poké_ball",
		"display_name": "Pokéball",
		"type": "ball",
		"description": "Fängt Wilde Pokémon. Standardversion.",
		"effect": {"catch_power": 1.0},
		"price": 200,
	},
	{
		"id": "great_ball",
		"display_name": "Superball",
		"type": "ball",
		"description": "Höhere Fangquote als Pokéball.",
		"effect": {"catch_power": 1.5},
		"price": 600,
	},
	{
		"id": "ultra_ball",
		"display_name": "Hyperball",
		"type": "ball",
		"description": "Sehr hohe Fangquote.",
		"effect": {"catch_power": 2.0},
		"price": 1200,
	},

	# --- Healing items ---
	{
		"id": "potion",
		"display_name": "Trank",
		"type": "consumable",
		"description": "Heilt 20 KP.",
		"effect": {"action": "heal_hp", "value": 20},
		"price": 300,
	},
	{
		"id": "super_potion",
		"display_name": "Supertrank",
		"type": "consumable",
		"description": "Heilt 60 KP.",
		"effect": {"action": "heal_hp", "value": 60},
		"price": 700,
	},
	{
		"id": "full_heal",
		"display_name": "Vollheilung",
		"type": "consumable",
		"description": "Heilt alle KP und Statusprobleme.",
		"effect": {"action": "heal_full"},
		"price": 1000,
	},
	{
		"id": "antidote",
		"display_name": "Gegengift",
		"type": "consumable",
		"description": "Heilt Vergiftung.",
		"effect": {"action": "cure_status", "status": "poison"},
		"price": 100,
	},
]
