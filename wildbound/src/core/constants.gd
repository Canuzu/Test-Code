class_name Constants
## Global, engine-wide constants for Wildbound.
## Pure data — never instantiated. Access statically, e.g. `Constants.TILE_SIZE`.

# --- Rendering / grid ---
const TILE_SIZE := 16
const BASE_WIDTH := 320
const BASE_HEIGHT := 180

# --- Node groups (avoid hard scene references) ---
const GROUP_GAME_MAP := "game_map"
const GROUP_PLAYER := "player"

# --- Save system ---
const SAVE_DIR := "user://saves"
const SAVE_VERSION := 1
const MAX_SAVE_SLOTS := 3
