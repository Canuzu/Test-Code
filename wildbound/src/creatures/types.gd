class_name Types
## The elemental type roster (Nature & Elements). Compact 10-type set, designed
## to be easy to balance and trivially extendable. String ids are used in data
## files (readable, verifiable); enum values are used at runtime.

enum T { PFLANZE, FEUER, WASSER, ERDE, LUFT, BLITZ, EIS, GIFT, MYSTIK, BESTIE }

const COUNT := 10

const NAMES := {
	T.PFLANZE: "Pflanze", T.FEUER: "Feuer", T.WASSER: "Wasser", T.ERDE: "Erde",
	T.LUFT: "Luft", T.BLITZ: "Blitz", T.EIS: "Eis", T.GIFT: "Gift",
	T.MYSTIK: "Mystik", T.BESTIE: "Bestie",
}

const IDS := {
	"pflanze": T.PFLANZE, "feuer": T.FEUER, "wasser": T.WASSER, "erde": T.ERDE,
	"luft": T.LUFT, "blitz": T.BLITZ, "eis": T.EIS, "gift": T.GIFT,
	"mystik": T.MYSTIK, "bestie": T.BESTIE,
}

const ID_OF := {
	T.PFLANZE: "pflanze", T.FEUER: "feuer", T.WASSER: "wasser", T.ERDE: "erde",
	T.LUFT: "luft", T.BLITZ: "blitz", T.EIS: "eis", T.GIFT: "gift",
	T.MYSTIK: "mystik", T.BESTIE: "bestie",
}

const COLORS := {
	T.PFLANZE: "#5a9a4a", T.FEUER: "#c65b3c", T.WASSER: "#3f7cc6", T.ERDE: "#a9824e",
	T.LUFT: "#8fb8d6", T.BLITZ: "#d6c14a", T.EIS: "#7fc4d6", T.GIFT: "#8a5aa6",
	T.MYSTIK: "#b563a0", T.BESTIE: "#b0a08a",
}

static func from_id(id: String) -> int:
	return IDS.get(id, T.BESTIE)

static func to_name(type: int) -> String:
	return NAMES.get(type, "?")

static func color_hex(type: int) -> String:
	return COLORS.get(type, "#ffffff")

## Inline BBCode chip for RichTextLabel (used by the team panel).
static func bbcode(type: int) -> String:
	return "[color=%s]%s[/color]" % [color_hex(type), to_name(type)]
