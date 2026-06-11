class_name SignBoard extends Interactable
## A readable sign. The sign's artwork is the (non-walkable) SIGN tile itself;
## this node only carries the dialog hook at that cell. Named SignBoard to avoid
## clashing with the built-in sign() function.

var cell := Vector2i.ZERO
var dialog_id := ""

func interact(_player: Node2D) -> void:
	EventBus.dialog_requested.emit(dialog_id)

func get_cell() -> Vector2i:
	return cell
