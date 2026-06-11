class_name TileSetBuilder
## Builds a TileSet (with a `walkable` custom-data layer) from the terrain atlas
## entirely in code. This keeps map scenes free of fragile, hand-authored
## TileSet resources during early development. A later milestone can migrate to
## editor-authored .tres tilesets/maps without changing how the rest of the game
## queries walkability.

const WALKABLE_LAYER := "walkable"

static func build(atlas: Texture2D) -> TileSet:
	var tile_set := TileSet.new()
	tile_set.tile_size = Vector2i(Constants.TILE_SIZE, Constants.TILE_SIZE)

	tile_set.add_custom_data_layer()
	var layer := tile_set.get_custom_data_layers_count() - 1
	tile_set.set_custom_data_layer_name(layer, WALKABLE_LAYER)
	tile_set.set_custom_data_layer_type(layer, TYPE_BOOL)

	var source := TileSetAtlasSource.new()
	source.texture = atlas
	source.texture_region_size = Vector2i(Constants.TILE_SIZE, Constants.TILE_SIZE)

	for tile in TileDatabase.COORDS:
		var coords: Vector2i = TileDatabase.COORDS[tile]
		source.create_tile(coords)
		var data := source.get_tile_data(coords, 0)
		data.set_custom_data(WALKABLE_LAYER, TileDatabase.WALKABLE[tile])

	tile_set.add_source(source, TileDatabase.SOURCE_ID)
	return tile_set
