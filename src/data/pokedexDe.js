// English → German Pokémon species names, bundled so the app can localise EVERY
// card deterministically and consistently (the build-time PokéAPI translation is
// rate-limited and was leaving many cards in English). Covers all of Gen 1 plus
// the popular / high-value species of later generations (the ones that appear on
// sought-after cards). Unknown species fall back to English — never a wrong name.
// Keyed by the exact English species word the API returns as a card's baseName.

export const POKEDEX_DE = {
  // --- Gen 1 (complete) ---
  Bulbasaur: 'Bisasam', Ivysaur: 'Bisaknosp', Venusaur: 'Bisaflor',
  Charmander: 'Glumanda', Charmeleon: 'Glutexo', Charizard: 'Glurak',
  Squirtle: 'Schiggy', Wartortle: 'Schillok', Blastoise: 'Turtok',
  Caterpie: 'Raupy', Metapod: 'Safcon', Butterfree: 'Smettbo',
  Weedle: 'Hornliu', Kakuna: 'Kokuna', Beedrill: 'Bibor',
  Pidgey: 'Taubsi', Pidgeotto: 'Tauboga', Pidgeot: 'Tauboss',
  Rattata: 'Rattfratz', Raticate: 'Rattikarl', Spearow: 'Habitak', Fearow: 'Ibitak',
  Ekans: 'Rettan', Arbok: 'Arbok', Pikachu: 'Pikachu', Raichu: 'Raichu',
  Sandshrew: 'Sandan', Sandslash: 'Sandamer',
  Nidorina: 'Nidorina', Nidoqueen: 'Nidoqueen', Nidorino: 'Nidorino', Nidoking: 'Nidoking',
  Clefairy: 'Piepi', Clefable: 'Pixi', Vulpix: 'Vulpix', Ninetales: 'Vulnona',
  Jigglypuff: 'Pummeluff', Wigglytuff: 'Knuddeluff', Zubat: 'Zubat', Golbat: 'Golbat',
  Oddish: 'Myrapla', Gloom: 'Duflor', Vileplume: 'Giflor',
  Paras: 'Paras', Parasect: 'Parasek', Venonat: 'Bluzuk', Venomoth: 'Omot',
  Diglett: 'Digda', Dugtrio: 'Digdri', Meowth: 'Mauzi', Persian: 'Snobilikat',
  Psyduck: 'Enton', Golduck: 'Entoron', Mankey: 'Menki', Primeape: 'Rasaff',
  Growlithe: 'Fukano', Arcanine: 'Arkani',
  Poliwag: 'Quapsel', Poliwhirl: 'Quaputzi', Poliwrath: 'Quappo',
  Abra: 'Abra', Kadabra: 'Kadabra', Alakazam: 'Simsala',
  Machop: 'Machollo', Machoke: 'Maschock', Machamp: 'Machomei',
  Bellsprout: 'Knofensa', Weepinbell: 'Ultrigaria', Victreebel: 'Sarzenia',
  Tentacool: 'Tentacha', Tentacruel: 'Tentoxa',
  Geodude: 'Kleinstein', Graveler: 'Georok', Golem: 'Geowaz',
  Ponyta: 'Ponita', Rapidash: 'Gallopa', Slowpoke: 'Flegmon', Slowbro: 'Lahmus',
  Magnemite: 'Magnetilo', Magneton: 'Magneton', "Farfetch'd": 'Porenta',
  Doduo: 'Dodu', Dodrio: 'Dodri', Seel: 'Jurob', Dewgong: 'Jugong',
  Grimer: 'Sleima', Muk: 'Sleimok', Shellder: 'Muschas', Cloyster: 'Austos',
  Gastly: 'Nebulak', Haunter: 'Alpollo', Gengar: 'Gengar', Onix: 'Onix',
  Drowzee: 'Traumato', Hypno: 'Hypno', Krabby: 'Krabby', Kingler: 'Kingler',
  Voltorb: 'Voltobal', Electrode: 'Lektrobal', Exeggcute: 'Owei', Exeggutor: 'Kokowei',
  Cubone: 'Tragosso', Marowak: 'Knogga', Hitmonlee: 'Kicklee', Hitmonchan: 'Nockchan',
  Lickitung: 'Schlurp', Koffing: 'Smogon', Weezing: 'Smogmog',
  Rhyhorn: 'Rihorn', Rhydon: 'Rizeros', Chansey: 'Chaneira', Tangela: 'Tangela',
  Kangaskhan: 'Kangama', Horsea: 'Seeper', Seadra: 'Seemon', Goldeen: 'Goldini', Seaking: 'Golking',
  Staryu: 'Sterndu', Starmie: 'Starmie', 'Mr. Mime': 'Pantimos', Scyther: 'Sichlor',
  Jynx: 'Rossana', Electabuzz: 'Elektek', Magmar: 'Magmar', Pinsir: 'Pinsir', Tauros: 'Tauros',
  Magikarp: 'Karpador', Gyarados: 'Garados', Lapras: 'Lapras', Ditto: 'Ditto',
  Eevee: 'Evoli', Vaporeon: 'Aquana', Jolteon: 'Blitza', Flareon: 'Flamara',
  Porygon: 'Porygon', Omanyte: 'Amonitas', Omastar: 'Amoroso', Kabuto: 'Kabuto', Kabutops: 'Kabutops',
  Aerodactyl: 'Aerodactyl', Snorlax: 'Relaxo', Articuno: 'Arktos', Zapdos: 'Zapdos', Moltres: 'Lavados',
  Dratini: 'Dratini', Dragonair: 'Dragonir', Dragonite: 'Dragoran', Mewtwo: 'Mewtu', Mew: 'Mew',

  // --- Gen 2 (popular) ---
  Chikorita: 'Endivie', Bayleef: 'Lorblatt', Meganium: 'Meganie',
  Cyndaquil: 'Feurigel', Quilava: 'Igelavar', Typhlosion: 'Tornupto',
  Totodile: 'Karnimani', Croconaw: 'Tyracroc', Feraligatr: 'Impergator',
  Pichu: 'Pichu', Togepi: 'Togepi', Togetic: 'Togetic',
  Espeon: 'Psiana', Umbreon: 'Nachtara', Ampharos: 'Ampharos', Mareep: 'Voltilamm',
  Steelix: 'Stahlos', Scizor: 'Scherox', Heracross: 'Skaraborn', Sneasel: 'Sniebel',
  Ursaring: 'Ursaring', Houndour: 'Hunduster', Houndoom: 'Hundemon',
  Donphan: 'Donphan', Porygon2: 'Porygon2', Tyranitar: 'Despotar', Blissey: 'Heiteira',
  Skarmory: 'Panzaeron', Kingdra: 'Seedraking', Smeargle: 'Farbeagle',
  Lugia: 'Lugia', 'Ho-Oh': 'Ho-Oh', Celebi: 'Celebi', Suicune: 'Suicune', Entei: 'Entei', Raikou: 'Raikou',

  // --- Gen 3 (popular) ---
  Treecko: 'Geckarbor', Grovyle: 'Reptain', Sceptile: 'Gewaldro',
  Torchic: 'Flemmli', Combusken: 'Jungglut', Blaziken: 'Lohgock',
  Mudkip: 'Hydropi', Marshtomp: 'Moorabbel', Swampert: 'Sumpex',
  Gardevoir: 'Guardevoir', Ralts: 'Trasla', Kirlia: 'Kirlia', Gallade: 'Galagladi',
  Sableye: 'Zobiris', Mawile: 'Flunkifer', Aggron: 'Stolloss', Aron: 'Stollunior',
  Manectric: 'Voltenso', Flygon: 'Libelldra', Trapinch: 'Knacklion',
  Milotic: 'Milotic', Feebas: 'Barschwa', Absol: 'Absol', Salamence: 'Brutalanda', Bagon: 'Kindwurm',
  Metagross: 'Metagross', Beldum: 'Tanhel', Latias: 'Latias', Latios: 'Latios',
  Kyogre: 'Kyogre', Groudon: 'Groudon', Rayquaza: 'Rayquaza',
  Jirachi: 'Jirachi', Deoxys: 'Deoxys', Wailord: 'Wailord', Snorunt: 'Schneppke', Glalie: 'Firnontor',

  // --- Gen 4 (popular) ---
  Turtwig: 'Chelast', Grotle: 'Chelcarain', Torterra: 'Chelterrar',
  Chimchar: 'Panflam', Monferno: 'Panpyro', Infernape: 'Panferno',
  Piplup: 'Plinfa', Prinplup: 'Pliprin', Empoleon: 'Impoleon',
  Luxray: 'Luxtra', Roserade: 'Roserade', Garchomp: 'Knakrack', Gible: 'Kaumalat', Gabite: 'Knarksel',
  Lucario: 'Lucario', Riolu: 'Riolu', Hippowdon: 'Hippoterus', Drapion: 'Piondragi',
  Weavile: 'Snibunna', Magnezone: 'Magnezone', Electivire: 'Elevoltek', Magmortar: 'Magbrant',
  Togekiss: 'Togekiss', Gliscor: 'Skorgla', Mamoswine: 'Mamutel', Gallade: 'Galagladi',
  Froslass: 'Frosdedje', Rotom: 'Rotom', Dialga: 'Dialga', Palkia: 'Palkia', Giratina: 'Giratina',
  Heatran: 'Heatran', Cresselia: 'Cresselia', Darkrai: 'Darkrai', Shaymin: 'Shaymin', Arceus: 'Arceus',

  // --- Gen 5 (popular) ---
  Snivy: 'Serpifeu', Servine: 'Efoserp', Serperior: 'Serpiroyal',
  Tepig: 'Floink', Pignite: 'Ferkokel', Emboar: 'Flambirex',
  Oshawott: 'Ottaro', Dewott: 'Zwottronin', Samurott: 'Admurai',
  Zorua: 'Zorua', Zoroark: 'Zoroark', Excadrill: 'Stalobor', Krookodile: 'Rabigator',
  Darmanitan: 'Flampivian', Scrafty: 'Irokex', Chandelure: 'Skelabra', Litwick: 'Lichtel',
  Haxorus: 'Maxax', Hydreigon: 'Trikephalo', Volcarona: 'Ramoth', Bisharp: 'Caesurio',
  Reshiram: 'Reshiram', Zekrom: 'Zekrom', Kyurem: 'Kyurem', Victini: 'Victini',
  Cobalion: 'Kobalium', Keldeo: 'Keldeo', Meloetta: 'Meloetta', Genesect: 'Genesect',

  // --- Gen 6 (popular) ---
  Chespin: 'Igamaro', Quilladin: 'Igastarnish', Chesnaught: 'Brigaron',
  Fennekin: 'Fynx', Braixen: 'Rutena', Delphox: 'Fennexis',
  Froakie: 'Froxy', Frogadier: 'Amphizel', Greninja: 'Quajutsu',
  Sylveon: 'Feelinara', Talonflame: 'Fiaro', Aegislash: 'Durengard', Honedge: 'Gramokles',
  Goodra: 'Viscogon', Goomy: 'Viscumi', Trevenant: 'Trombork', Pumpkaboo: 'Irrbis',
  Noivern: 'UHaFnir', Xerneas: 'Xerneas', Yveltal: 'Yveltal', Zygarde: 'Zygarde',
  Diancie: 'Diancie', Hoopa: 'Hoopa', Volcanion: 'Volcanion',

  // --- Gen 7 (popular) ---
  Rowlet: 'Bauz', Dartrix: 'Arboretoss', Decidueye: 'Silvarro',
  Litten: 'Flamiau', Torracat: 'Miezunder', Incineroar: 'Fuegro',
  Popplio: 'Robball', Brionne: 'Marikeck', Primarina: 'Primarene',
  Lycanroc: 'Wolwerock', Mimikyu: 'Mimigma', Toxapex: 'Aalabyss', Kommo: 'Grandiras',
  'Kommo-o': 'Grandiras', Salazzle: 'Amfira', Mudsdale: 'Pampross', Bewear: 'Kosturso',
  Solgaleo: 'Solgaleo', Lunala: 'Lunala', Necrozma: 'Necrozma', Magearna: 'Magearna',
  Marshadow: 'Marshadow', Zeraora: 'Zeraora', 'Tapu Koko': 'Kapu-Riki', Buzzwole: 'Masskito',

  // --- Gen 8 (popular) ---
  Grookey: 'Chimpep', Thwackey: 'Chimstix', Rillaboom: 'Gortrom',
  Scorbunny: 'Hopplo', Raboot: 'Kickerlo', Cinderace: 'Liberlo',
  Sobble: 'Memmeon', Drizzile: 'Phlegleon', Inteleon: 'Intelleon',
  Corviknight: 'Krarmor', Dragapult: 'Katapuldra', Dreepy: 'Sleibe', Drakloak: 'Kappalores',
  Grimmsnarl: 'Olangaar', Toxtricity: 'Riffex', Sirfetch: 'Lauchzelot', "Sirfetch'd": 'Lauchzelot',
  Zacian: 'Zacian', Zamazenta: 'Zamazenta', Eternatus: 'Endynalos', Urshifu: 'Wulaosu',
  Calyrex: 'Coronospa', Glastrier: 'Polaross', Spectrier: 'Phantoross', Regieleki: 'Regieleki', Regidrago: 'Regidrago',

  // --- Gen 9 (popular) ---
  Sprigatito: 'Felori', Floragato: 'Feliospa', Meowscarada: 'Maskagato',
  Fuecoco: 'Krokel', Crocalor: 'Lokroko', Skeledirge: 'Skelokrok',
  Quaxly: 'Kwaks', Miraidon: 'Miraidon', Koraidon: 'Koraidon',
  Gholdengo: 'Monetigo', Tinkaton: 'Tinkaton', Ceruledge: 'Infernopo', Armarouge: 'Crimanzo',
  Kingambit: 'Gladimperio', Annihilape: 'Affiti', Baxcalibur: 'Espinodon', Tinkatink: 'Tinkilling',
};
