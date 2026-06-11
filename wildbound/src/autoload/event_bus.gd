extends Node
## Global signal hub for decoupled communication. Autoloaded as `EventBus`.
## Emitters and listeners never need direct references to each other, which keeps
## systems (player, world, UI, creatures, save) independent and testable.

# --- world / player ---
@warning_ignore("unused_signal")
signal player_moved(cell: Vector2i)
@warning_ignore("unused_signal")
signal player_turned(dir: int)
@warning_ignore("unused_signal")
signal map_changed(map_id: String)

# --- dialog / menus ---
@warning_ignore("unused_signal")
signal dialog_requested(dialog_id: String)
@warning_ignore("unused_signal")
signal dialog_opened
@warning_ignore("unused_signal")
signal dialog_closed
@warning_ignore("unused_signal")
signal menu_opened
@warning_ignore("unused_signal")
signal menu_closed

# --- creatures / party ---
@warning_ignore("unused_signal")
signal party_changed
@warning_ignore("unused_signal")
signal creature_leveled(creature: Creature, level: int)
@warning_ignore("unused_signal")
signal creature_learned_move(creature: Creature, move_id: String)
@warning_ignore("unused_signal")
signal creature_evolved(old_name: String, new_name: String)

# --- battle ---
@warning_ignore("unused_signal")
signal encounter_started(wild: Creature)
@warning_ignore("unused_signal")
signal battle_started
@warning_ignore("unused_signal")
signal battle_ended(outcome: String)

# --- items / inventory ---
@warning_ignore("unused_signal")
signal inventory_changed(item_id: String, count: int)
@warning_ignore("unused_signal")
signal item_used(item_id: String, context: String)
@warning_ignore("unused_signal")
signal catch_attempt(ball_id: String, result: bool)
@warning_ignore("unused_signal")
signal shop_opened(shop_id: String, stock: Array)

# --- save ---
@warning_ignore("unused_signal")
signal game_saved(slot: int)
@warning_ignore("unused_signal")
signal game_loaded(slot: int)
@warning_ignore("unused_signal")
signal save_failed(slot: int, reason: String)
