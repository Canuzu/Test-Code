class_name Interactable extends Node2D
## Base class for anything the player can interact with on the grid (NPCs,
## signs, later: chests, doors, quest objects). Subclasses override both methods.
## The player parameter stays loosely typed (Node2D) to avoid circular
## dependencies between player and world scripts.

func interact(_player: Node2D) -> void:
	pass

## The grid cell this interactable currently occupies (queried by GameMap).
func get_cell() -> Vector2i:
	return Vector2i.ZERO
