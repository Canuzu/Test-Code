class_name Shop extends Interactable
## A shop NPC that opens a purchase menu. Extends Interactable so it works
## through the normal map entity system.

var shop_id: String = ""
var stock: Array = []  # item ids

func _init(id: String, cell: Vector2i, sheet: String, stock_list: Array = []) -> void:
	super(id, cell, sheet)
	shop_id = id
	stock = stock_list

func interact(player: Player) -> void:
	if sheet != "":
		_turn_toward_player(player.grid_cell)
	EventBus.dialog_requested.emit(shop_id)
	await get_tree().process_frame
	EventBus.shop_opened.emit(shop_id, stock)

func _turn_toward_player(player_cell: Vector2i) -> void:
	var diff := player_cell - grid_cell
	if diff.x != 0:
		direction = Direction.Dir.RIGHT if diff.x > 0 else Direction.Dir.LEFT
	elif diff.y != 0:
		direction = Direction.Dir.DOWN if diff.y > 0 else Direction.Dir.UP
	if has_node("AnimatedSprite2D"):
		get_node("AnimatedSprite2D").play(Direction.anim_name(direction))
