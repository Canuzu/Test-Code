class_name Catch

static func resolve_catch(ball_id: String, target: Creature, enemy_hp_pct: float, rng: RandomNumberGenerator) -> bool:
	var item_db = ItemDatabase.new()
	if not item_db.has(ball_id):
		return false

	var ball_item = item_db.get_item(ball_id)
	if ball_item.type != "ball":
		return false

	var catch_power = ball_item.effect.get("catch_power", 1.0)
	var catch_rate = target.data().catch_rate

	var status_mod := 1.0
	if target.status != "":
		status_mod = 1.5

	var shake_value = (catch_rate * catch_power * enemy_hp_pct) / 255.0 * status_mod
	shake_value = clamp(shake_value, 0.0, 3.0)

	for _shake in range(4):
		if rng.randf() > shake_value:
			return false

	return true
