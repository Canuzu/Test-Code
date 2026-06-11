extends Node
## Root scene: hosts the current map, the persistent UI layer, the battle layer,
## and the screen fade. Wires SceneManager, boots into the starting map, and
## owns the battle lifecycle: on encounter_started it pauses the overworld and
## instances the battle scene; on battle_ended it cleans up (and runs the
## blackout flow after a loss). The debug hotkeys live here because they must
## outlive any single map.

var _battle_ui: BattleScene = null
var _bag_panel: BagPanel = null

func _ready() -> void:
	SceneManager.register_main($MapHost, $FadeLayer/Fade)
	_bag_panel = BagPanel.new()
	$UILayer.add_child(_bag_panel)
	_bag_panel.hide()
	SceneManager.change_map(GameState.current_map, GameState.player_cell, GameState.facing)
	EventBus.encounter_started.connect(_on_encounter_started)
	EventBus.battle_ended.connect(_on_battle_ended)

func _unhandled_input(event: InputEvent) -> void:
	if SceneManager.is_transitioning or _battle_ui != null:
		return
	if event.is_action_pressed("bag"):
		_bag_panel.visible = not _bag_panel.visible
	elif event.is_action_pressed("quick_save"):
		SaveManager.save_to_slot(0)
	elif event.is_action_pressed("quick_load"):
		SaveManager.load_from_slot(0)
	elif event is InputEventKey and event.pressed and not event.echo:
		# --- Debug helpers (removed once a starter-pick/catching flow exists) ---
		match event.keycode:
			KEY_1:
				_debug_add_starter("mooskind")
			KEY_2:
				_debug_add_starter("funkwelp")
			KEY_3:
				_debug_add_starter("troepfling")
			KEY_L:
				_debug_give_exp()

## --- Battle lifecycle ---------------------------------------------------------

func _on_encounter_started(wild: Creature) -> void:
	if _battle_ui != null or SceneManager.is_transitioning:
		return
	_battle_ui = BattleScene.new()
	_battle_ui.wild = wild
	$BattleLayer.add_child(_battle_ui)
	# Freeze the overworld (player input, NPC wander) behind the battle.
	$MapHost.process_mode = Node.PROCESS_MODE_DISABLED
	EventBus.battle_started.emit()

func _on_battle_ended(outcome: String) -> void:
	# The battle scene faded itself to black; hold that cover while it is freed
	# so the overworld never pops in for a frame.
	var fade: ColorRect = $FadeLayer/Fade
	fade.modulate.a = 1.0
	_battle_ui.queue_free()
	_battle_ui = null
	$MapHost.process_mode = Node.PROCESS_MODE_INHERIT
	EventBus.party_changed.emit()
	if outcome == "loss":
		_blackout()
	else:
		create_tween().tween_property(fade, "modulate:a", 0.0, 0.25)

## Classic defeat rule: the party is fully healed and the player wakes up back
## at the start of the village (heal points arrive in a later milestone).
func _blackout() -> void:
	for creature in GameState.party:
		creature.heal_full()
	EventBus.party_changed.emit()
	SceneManager.change_map(GameState.START_MAP, GameState.START_CELL, Direction.Dir.DOWN)

## --- Debug helpers --------------------------------------------------------

func _debug_add_starter(species_id: String) -> void:
	if GameState.party.size() >= 6:
		return
	GameState.party.append(Creature.create(species_id, 5))
	EventBus.party_changed.emit()

func _debug_give_exp() -> void:
	if GameState.party.is_empty():
		return
	var c: Creature = GameState.party[0]
	var target := mini(100, c.level + 3)
	var need := Growth.exp_to_reach(target, c.data().growth_rate) - c.exp
	c.gain_exp(maxi(need, 1))
	EventBus.party_changed.emit()
