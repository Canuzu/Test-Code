extends Resource
class_name ItemData

@export var id: String = ""
@export var display_name: String = ""
@export var type: String = ""  # "ball" | "consumable" | "key" | "tm"
@export var description: String = ""
@export var effect: Dictionary = {}
@export var price: int = 0

static func from_dict(data: Dictionary) -> ItemData:
	var item = ItemData.new()
	item.id = data.get("id", "")
	item.display_name = data.get("display_name", "")
	item.type = data.get("type", "")
	item.description = data.get("description", "")
	item.effect = data.get("effect", {})
	item.price = int(data.get("price", 0))
	return item
