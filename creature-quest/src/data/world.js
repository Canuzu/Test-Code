// Die Naturwelt: 12 Gebiete als Kachelkarten.
//
// Kachel-Legende:
//   T = Baum (blockiert)      R = Fels (blockiert)     ~ = Wasser (blockiert)
//   . = Weg/Wiese (begehbar)  " = hohes Gras (Begegnungen)
//   F = Blumen (begehbar)     S = Sand (begehbar)       P = Pfad (begehbar)
//   C = Pokécenter  M = Shop  G = Arena  H = Haus  (alle blockieren, Gebäude)
//   < > ^ v = Warp-Felder (begehbar, wechseln das Gebiet)

export const TILE = {
  BLOCK: new Set(['T', 'R', '~', 'C', 'M', 'G', 'H']),
  ENCOUNTER: '"',
  WARPS: new Set(['<', '>', '^', 'v']),
  BUILDINGS: new Set(['C', 'M', 'G', 'H']),
};

export function isBlocked(ch) {
  return TILE.BLOCK.has(ch);
}

const ZONES = {
  // ══════════════════════════════════════════════════════════════════════════
  // Zone 1: Ahornfeld – Startstadt (Orden 1: Volt/Elektro)
  // ══════════════════════════════════════════════════════════════════════════
  ahornfeld: {
    name: 'Ahornfeld',
    town: true,
    battleBg: 'meadow',
    music: 'town',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T...C.....M....T',
      'T..............T',
      'T..............T',
      'T......G.......T',
      'T..............T',
      'T....F....F....T',
      'T..............T',
      'T.......v......T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [],
    npcs: [
      {
        id: 'town_nurse', x: 4, y: 3, facing: 'down',
        name: 'Schwester Linnea', kind: 'heal', sprite: 'nurse',
        lines: ['Willkommen im Pokécenter von Ahornfeld!', 'Sollen sich deine Kreaturen ausruhen?'],
        healLines: ['Deine Kreaturen sind wieder kerngesund! ✦', 'Bis bald – pass gut auf sie auf!'],
      },
      {
        id: 'town_merchant', x: 10, y: 3, facing: 'down',
        name: 'Händler Cassian', kind: 'shop', sprite: 'npc-merchant',
        lines: ['Tritt näher! Tränke, Kugeln, alles was das Trainerherz begehrt.'],
      },
      {
        id: 'town_prof', x: 13, y: 4, facing: 'left',
        name: 'Prof. Ascher', kind: 'talk', sprite: 'prof-ascher',
        lines: [
          'Ah, da bist du ja! Deine große Reise beginnt jetzt.',
          'Es gibt acht Arenen auf dem Kontinent – bezwinge alle Leiter für Orden!',
          'Aber Vorsicht: Eine mysteriöse Gruppe namens Team Nox treibt ihr Unwesen.',
          'Sie fangen wilde Kreaturen für dunkle Experimente. Halt die Augen offen!',
        ],
      },
      {
        id: 'gym_volt', x: 7, y: 6, facing: 'down',
        name: 'Arenaleiter Volt', kind: 'trainer', sprite: 'leader-volt',
        badge: 'blitz', badgeName: 'Blitz-Orden', prize: 1500,
        lines: ['Hochspannung! Ich bin Volt, der Arenaleiter von Ahornfeld.', 'Zeig mir, ob deine Kreaturen den Funken haben!'],
        team: [
          { speciesId: 13, level: 14 },
          { speciesId: 26, level: 15 },
          { speciesId: 14, level: 17 },
        ],
        victoryLines: ['Wahnsinn! Der Blitz-Orden gehört dir. Weiter geht die Reise!'],
        defeatLines: ['Zu viel Spannung! Komm wieder, wenn du stärker bist.'],
        postLines: ['Der Blitz-Orden steht dir gut. Auf zur nächsten Arena!'],
      },
      {
        id: 'rival_1', x: 3, y: 8, facing: 'right',
        name: 'Joran', kind: 'trainer', sprite: 'joran', rival: true,
        prize: 600,
        lines: ['Na, auch unterwegs? Mal sehen, wer von uns das bessere Team hat!'],
        team: [
          { speciesId: 15, level: 7 },
          { speciesId: 20, level: 8 },
        ],
        victoryLines: ['Pff, diesmal hattest du Glück! Beim nächsten Mal gewinne ich.'],
        defeatLines: ['Haha! Siehst du? Üben, üben, üben!'],
        postLines: ['Ich trainiere weiter – wir sehen uns im Wald wieder!'],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 2: Heimatwiese – Route 1
  // ══════════════════════════════════════════════════════════════════════════
  wiese: {
    name: 'Heimatwiese',
    battleBg: 'meadow',
    music: 'wiese',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T.....^........T',
      'T..""..TT....~~T',
      'T..""..TT....~~T',
      'T............~~T',
      'T..............>',
      'T..............T',
      'T...""".."""...T',
      'T...""".."""...T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 13, weight: 5, min: 2, max: 5 },
      { id: 15, weight: 5, min: 2, max: 5 },
      { id: 22, weight: 4, min: 2, max: 5 },
      { id: 28, weight: 4, min: 2, max: 5 },
      { id: 24, weight: 3, min: 3, max: 5 },
      { id: 32, weight: 3, min: 3, max: 5 },
      { id: 20, weight: 3, min: 2, max: 4 },
      { id: 29, weight: 2, min: 3, max: 5 },
      { id: 70, weight: 3, min: 2, max: 5 },
      { id: 73, weight: 2, min: 3, max: 5 },
    ],
    npcs: [
      {
        id: 'wiese_wanderer', x: 12, y: 1, facing: 'down',
        name: 'Wanderer Elias', kind: 'talk', sprite: 'npc-elder',
        lines: [
          'Im hohen Gras triffst du wilde Kreaturen – rüste dich gut!',
          'Nördlich liegt Ahornfeld mit Pokécenter und Shop.',
          'Und pass auf – es kursierten Gerüchte über einen mysteriösen Kult im Wald.',
        ],
      },
      {
        id: 'wiese_jungtrainer', x: 5, y: 9, facing: 'up',
        name: 'Jungtrainer Bo', kind: 'trainer', sprite: 'trainer-generic',
        prize: 300,
        lines: ['He, du da! Lust auf ein kleines Kräftemessen?'],
        team: [
          { speciesId: 13, level: 6 },
          { speciesId: 28, level: 7 },
        ],
        victoryLines: ['Wow, du bist richtig stark! Das war knapp…'],
        defeatLines: ['Hehe, geübt verliert man auch mal!'],
        postLines: ['Bis zum nächsten Mal!'],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 3: Flüsterwald – Route 2 (Orden 2: Flora/Pflanze)
  // ══════════════════════════════════════════════════════════════════════════
  wald: {
    name: 'Flüsterwald',
    battleBg: 'forest',
    music: 'wald',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..TT....TT....T',
      'T."""....."""..T',
      'T....TT....TT..T',
      'T...""".....TT.T',
      '<..............>',
      'T.TT....""""...T',
      'T....TT....TT..T',
      'T..""....""....T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 22, weight: 5, min: 4, max: 9 },
      { id: 24, weight: 4, min: 4, max: 9 },
      { id: 18, weight: 4, min: 5, max: 9 },
      { id: 31, weight: 3, min: 5, max: 9 },
      { id: 15, weight: 4, min: 4, max: 8 },
      { id: 33, weight: 3, min: 4, max: 8 },
      { id: 10, weight: 3, min: 5, max: 9 },
      { id: 25, weight: 1, min: 8, max: 10 },
      { id: 34, weight: 2, min: 5, max: 8 },
    ],
    npcs: [
      {
        id: 'gym_flora', x: 8, y: 9, facing: 'down',
        name: 'Arenaleiterin Flora', kind: 'trainer', sprite: 'leader-flora',
        badge: 'blatt', badgeName: 'Blatt-Orden', prize: 1200,
        lines: ['Willkommen im grünen Herzen des Waldes.', 'Ich bin Flora. Meine Pflanzen-Kreaturen wurzeln tief!'],
        team: [
          { speciesId: 24, level: 11 },
          { speciesId: 22, level: 12 },
          { speciesId: 23, level: 14 },
        ],
        victoryLines: ['Beeindruckend! Der Blatt-Orden gehört dir.'],
        defeatLines: ['Die Natur lehrt Geduld. Komm gestärkt zurück.'],
        postLines: ['Mögen deine Wurzeln stark bleiben, Reisende(r).'],
      },
      {
        id: 'rival_2', x: 12, y: 9, facing: 'left',
        name: 'Joran', kind: 'trainer', sprite: 'joran', rival: true,
        prize: 1000,
        lines: ['Da bist du ja wieder! Ich hab fleißig trainiert.', 'Diesmal mache ich dich fertig!'],
        team: [
          { speciesId: 16, level: 13 },
          { speciesId: 21, level: 14 },
          { speciesId: 31, level: 15 },
        ],
        victoryLines: ['Was?! Schon wieder verloren…'],
        defeatLines: ['Haha! Endlich hab ich dich!'],
        postLines: ['Beim nächsten Mal in der Höhle entscheidet sichs!'],
      },
      {
        id: 'wald_nox_grunt1', x: 3, y: 3, facing: 'right',
        name: 'Nox-Grunz Brix', kind: 'trainer', sprite: 'trainer-generic',
        prize: 500,
        lines: ['Team Nox lässt sich nicht aufhalten! Hier ist unser Revier!'],
        team: [
          { speciesId: 34, level: 10 },
          { speciesId: 80, level: 11 },
        ],
        victoryLines: ['Du bist stärker als ich dachte…'],
        defeatLines: ['Team Nox siegt immer!'],
        postLines: ['Unser Anführer wird von dir hören!'],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 4: Kristallhöhle – Route 3 (Orden 3: Magister/Erde)
  // ══════════════════════════════════════════════════════════════════════════
  hoehle: {
    name: 'Kristallhöhle',
    battleBg: 'cave',
    music: 'hoehle',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'TRR..RR....RR..>',
      'TR..""....RR..RT',
      'T..RR....""..RRT',
      'T..............T',
      '<..""....RR..""T',
      'TRR....""""..RRT',
      'T....RR....RR..T',
      'T.RR..""..RR..RT',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 10, weight: 5, min: 8, max: 14 },
      { id: 27, weight: 4, min: 8, max: 13 },
      { id: 26, weight: 4, min: 8, max: 13 },
      { id: 13, weight: 3, min: 8, max: 12 },
      { id: 18, weight: 3, min: 9, max: 13 },
      { id: 33, weight: 3, min: 8, max: 12 },
      { id: 11, weight: 2, min: 12, max: 15 },
      { id: 19, weight: 1, min: 13, max: 16 },
      { id: 47, weight: 2, min: 10, max: 14 },
    ],
    npcs: [
      {
        id: 'gym_magister', x: 8, y: 9, facing: 'down',
        name: 'Arenaleiter Magister', kind: 'trainer', sprite: 'magister',
        badge: 'stein', badgeName: 'Stein-Orden', prize: 2000,
        lines: ['Du wagst dich tief in meine Höhle, Trainer.', 'Mein Fels zerbricht nicht – aber vielleicht zerbrichst du an ihm!'],
        team: [
          { speciesId: 27, level: 16 },
          { speciesId: 10, level: 17 },
          { speciesId: 11, level: 19 },
        ],
        victoryLines: ['Unmöglich… mein Fels bröckelt. Der Stein-Orden ist verdient!'],
        defeatLines: ['Hart wie Stein, dein Scheitern. Kehre stärker zurück.'],
        postLines: ['Du trägst den Stein-Orden mit Ehre. Respekt.'],
      },
      {
        id: 'rival_3', x: 3, y: 9, facing: 'right',
        name: 'Joran', kind: 'trainer', sprite: 'joran', rival: true,
        prize: 1800,
        lines: ['Das hier ist das große Finale, mein Freund!', 'Mein bestes Team gegen deins – jetzt!'],
        team: [
          { speciesId: 17, level: 19 },
          { speciesId: 30, level: 19 },
          { speciesId: 19, level: 21 },
        ],
        victoryLines: ['…Du bist einfach besser. Ich bin stolz.', 'Bis wir uns wiedersehen, Champion!'],
        defeatLines: ['Endlich! Der wahre Sieger steht fest!'],
        postLines: ['Wir sind Rivalen fürs Leben. Danke für die Kämpfe!'],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 5: Sandtal – Wüstenroute (Team Nox aktiv)
  // ══════════════════════════════════════════════════════════════════════════
  sandtal: {
    name: 'Sandtal',
    battleBg: 'meadow',
    music: 'wiese',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T.SSSS.S..SSR..T',
      'T.S.S."""SS.SS.T',
      'T.SSSSR.SSS.SS.T',
      'T.SS..S.SSS.R..T',
      '<.SSSSSSSSSSSS.>',
      'T.SS.R.SSS.SSS.T',
      'T.S.S."""SS.S..T',
      'T.SSSSS.SSR.SS.T',
      'T.SS.S.RR.SSS..T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 54, weight: 5, min: 18, max: 24 },
      { id: 56, weight: 4, min: 18, max: 24 },
      { id: 52, weight: 4, min: 18, max: 23 },
      { id: 33, weight: 3, min: 18, max: 22 },
      { id: 27, weight: 3, min: 18, max: 23 },
      { id: 78, weight: 3, min: 19, max: 24 },
      { id: 55, weight: 2, min: 20, max: 25 },
      { id: 75, weight: 3, min: 18, max: 23 },
    ],
    npcs: [
      {
        id: 'sandtal_wanderer', x: 7, y: 3, facing: 'down',
        name: 'Wanderin Petra', kind: 'talk', sprite: 'npc-elder',
        lines: [
          'Diese Wüste gehörte mal uns allen – jetzt patrouilliert Team Nox hier.',
          'Die Stadt dahinter heißt Wüstenstadt. Dort gibt es eine mächtige Feuerkämpferin.',
          'Ihre Kreaturen sind von den Flammen der Wüste gestählt.',
        ],
      },
      {
        id: 'sandtal_nox1', x: 4, y: 7, facing: 'up',
        name: 'Nox-Grunz Viper', kind: 'trainer', sprite: 'trainer-generic',
        prize: 700,
        lines: ['Halt! Team Nox duldet keine Eindringlinge im Sandtal!'],
        team: [
          { speciesId: 78, level: 20 },
          { speciesId: 54, level: 21 },
          { speciesId: 80, level: 22 },
        ],
        victoryLines: ['Verdammt… Rückzug!'],
        defeatLines: ['Team Nox ist unbesiegbar!'],
        postLines: ['Unser Anführer wird davon erfahren!'],
      },
      {
        id: 'sandtal_nox2', x: 11, y: 3, facing: 'down',
        name: 'Nox-Grunzin Sera', kind: 'trainer', sprite: 'trainer-generic',
        prize: 750,
        lines: ['Du weißt nicht, wem du dich entgegenstellst! Team Nox besitzt diese Wüste!'],
        team: [
          { speciesId: 80, level: 21 },
          { speciesId: 56, level: 22 },
          { speciesId: 34, level: 23 },
        ],
        victoryLines: ['Unmöglich! Diese Niederlage darf Team Nox nie erfahren!'],
        defeatLines: ['Du bist Geschichte!'],
        postLines: ['Ich werde dich nicht so leicht vergessen.'],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 6: Wüstenstadt – Stadt 2 (Orden 4: Scorcha/Feuer)
  // ══════════════════════════════════════════════════════════════════════════
  wuestenstadt: {
    name: 'Wüstenstadt',
    town: true,
    battleBg: 'meadow',
    music: 'town',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T...C.....M....T',
      'T..............T',
      'T..............T',
      '<.......G......>',
      'T..............T',
      'T....F....F....T',
      'T.H...........HT',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [],
    npcs: [
      {
        id: 'wuest_nurse', x: 4, y: 3, facing: 'down',
        name: 'Schwester Mira', kind: 'heal', sprite: 'nurse',
        lines: ['Willkommen im Pokécenter der Wüstenstadt!', 'Die Hitze hier macht allen zu schaffen.'],
        healLines: ['Deine Kreaturen sind erfrischt und gestärkt!'],
      },
      {
        id: 'wuest_merchant', x: 10, y: 3, facing: 'down',
        name: 'Händler Omar', kind: 'shop', sprite: 'npc-merchant',
        lines: ['In der Wüste braucht man das Beste! Schau in mein Sortiment.'],
      },
      {
        id: 'gym_scorcha', x: 8, y: 6, facing: 'down',
        name: 'Arenaleiterin Scorcha', kind: 'trainer', sprite: 'leader-volt',
        badge: 'glut', badgeName: 'Glut-Orden', prize: 3000,
        lines: [
          'Die Hitze der Wüste hat mich und meine Kreaturen geformt.',
          'Ich bin Scorcha. Überleb meine Flammen – dann verdienst du den Glut-Orden!',
        ],
        team: [
          { speciesId: 52, level: 26 },
          { speciesId: 31, level: 27 },
          { speciesId: 53, level: 28 },
          { speciesId: 18, level: 30 },
        ],
        victoryLines: ['Meine Flammen… gelöscht. Der Glut-Orden gehört dir!'],
        defeatLines: ['Die Wüste verbrennt Schwäche. Komm zurück, wenn du härter bist.'],
        postLines: ['Mit dem Glut-Orden strahlst du heller. Weiter zur Küste!'],
      },
      {
        id: 'rival_4', x: 3, y: 4, facing: 'right',
        name: 'Joran', kind: 'trainer', sprite: 'joran', rival: true,
        prize: 2400,
        lines: ['Die Wüste macht uns hart, was? Ich hab trainiert wie ein Wahnsinniger!', 'Mein Team ist jetzt auf einem ganz anderen Level – das wirst du spüren!'],
        team: [
          { speciesId: 17, level: 27 },
          { speciesId: 30, level: 27 },
          { speciesId: 19, level: 28 },
          { speciesId: 55, level: 29 },
        ],
        victoryLines: ['Schon wieder… Okay, ich muss zugeben: Du bist außergewöhnlich.'],
        defeatLines: ['Ha! Endlich mal ein Sieg! Aber genießʼ es nicht zu lange.'],
        postLines: ['Wir sehen uns an der Küste. Ich werde noch stärker sein!'],
      },
      {
        id: 'wuest_hint', x: 12, y: 4, facing: 'left',
        name: 'Forscher Dario', kind: 'talk', sprite: 'npc-elder',
        lines: [
          'Team Nox sucht nach einer alten Kraft, die tief in den Bergen schlummert.',
          'Gerüchten zufolge wollen sie ein legendäres Wesen erwecken.',
          'Lass das nicht zu – was auch immer es ist, es ist immens gefährlich.',
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 7: Küstenweg – Route 4
  // ══════════════════════════════════════════════════════════════════════════
  kueste: {
    name: 'Küstenweg',
    battleBg: 'meadow',
    music: 'wiese',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..""....."""..T',
      'T..""..TT....~~T',
      'T............~~T',
      'T...TT.......~~T',
      '<..............>',
      'T............~~T',
      'T..."""..."""..T',
      'T..."""...TT...T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 59, weight: 5, min: 25, max: 30 },
      { id: 62, weight: 5, min: 25, max: 30 },
      { id: 28, weight: 4, min: 24, max: 29 },
      { id: 15, weight: 3, min: 25, max: 29 },
      { id: 65, weight: 4, min: 25, max: 30 },
      { id: 20, weight: 3, min: 24, max: 28 },
      { id: 60, weight: 2, min: 28, max: 33 },
      { id: 73, weight: 2, min: 24, max: 28 },
    ],
    npcs: [
      {
        id: 'kueste_surferin', x: 9, y: 3, facing: 'down',
        name: 'Surferin Mia', kind: 'trainer', sprite: 'trainer-generic',
        prize: 900,
        lines: ['Dein Team gegen meins! Ich hab auf dich gewartet!'],
        team: [
          { speciesId: 59, level: 26 },
          { speciesId: 20, level: 27 },
          { speciesId: 62, level: 28 },
        ],
        victoryLines: ['Wow, starkes Team! Gut gemacht.'],
        defeatLines: ['Die Wellen tragen mich zum Sieg!'],
        postLines: ['Havenfeld liegt im Westen. Schöne Stadt!'],
      },
      {
        id: 'kueste_nox', x: 5, y: 7, facing: 'right',
        name: 'Nox-Grunz Reef', kind: 'trainer', sprite: 'trainer-generic',
        prize: 850,
        lines: ['Team Nox kontrolliert die Küste! Kein Durchkommen!'],
        team: [
          { speciesId: 78, level: 27 },
          { speciesId: 80, level: 27 },
          { speciesId: 34, level: 28 },
        ],
        victoryLines: ['Wie ist das möglich…?'],
        defeatLines: ['Für Team Nox!'],
        postLines: ['Das ist noch nicht vorbei.'],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 8: Havenfeld – Hafenstadt (Orden 5: Marina/Wasser)
  // ══════════════════════════════════════════════════════════════════════════
  havenfeld: {
    name: 'Havenfeld',
    town: true,
    battleBg: 'meadow',
    music: 'town',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T...C.....M....T',
      'T..............T',
      'T~~~~~~~~~~~~~~T',
      '<......G.......>',
      'T..............T',
      'T....F.....F...T',
      'T.H...........HT',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [],
    npcs: [
      {
        id: 'haven_nurse', x: 4, y: 3, facing: 'down',
        name: 'Schwester Lena', kind: 'heal', sprite: 'nurse',
        lines: ['Herzlich willkommen im Pokécenter von Havenfeld!', 'Der Geruch des Meeres ist heilsam für alle.'],
        healLines: ['Deine Kreaturen schöpfen neue Kraft aus der Meeresluft!'],
      },
      {
        id: 'haven_merchant', x: 10, y: 3, facing: 'down',
        name: 'Händlerin Naya', kind: 'shop', sprite: 'npc-merchant',
        lines: ['Willkommen! Ich führe die besten Waren der Küste.'],
      },
      {
        id: 'gym_marina', x: 7, y: 6, facing: 'down',
        name: 'Arenaleiter Marina', kind: 'trainer', sprite: 'leader-flora',
        badge: 'welle', badgeName: 'Wellen-Orden', prize: 4000,
        lines: [
          'Das Meer ist endlos – und meine Wasserkreaturen sind genauso unerschöpflich.',
          'Ich bin Marina. Tauche ein in den Kampf!',
        ],
        team: [
          { speciesId: 59, level: 33 },
          { speciesId: 29, level: 34 },
          { speciesId: 60, level: 35 },
          { speciesId: 62, level: 36 },
          { speciesId: 30, level: 37 },
        ],
        victoryLines: ['Die Wellen gehorchen dir nun auch. Der Wellen-Orden ist deiner!'],
        defeatLines: ['Das Meer kennt keine Gnade. Komm nach dem Üben zurück.'],
        postLines: ['Mit dem Wellen-Orden in der Hand öffnet sich der Weg ins Hochland.'],
      },
      {
        id: 'haven_hint', x: 12, y: 9, facing: 'left',
        name: 'Seemannin Greta', kind: 'talk', sprite: 'npc-elder',
        lines: [
          'Team Nox hat unlängst ein Schiff beschlagnahmt.',
          'Man sagt, sie bringen merkwürdige Fracht in die Nebelberge.',
          'Ich weiß nicht was – aber der Bergweg dahinter ist gefährlicher geworden.',
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 9: Nebelberge – Route 5
  // ══════════════════════════════════════════════════════════════════════════
  nebelberge: {
    name: 'Nebelberge',
    battleBg: 'cave',
    music: 'hoehle',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'TRR..RR....RR..T',
      'TR..""".....R..T',
      'T.RR....""..RR.T',
      'T..............T',
      '<..""....RR..""T',
      'TRR....""""..RRT',
      'T....RR....RR..T',
      'T.RR..""".RR...T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 47, weight: 5, min: 30, max: 36 },
      { id: 48, weight: 3, min: 32, max: 38 },
      { id: 44, weight: 4, min: 30, max: 35 },
      { id: 65, weight: 4, min: 30, max: 35 },
      { id: 36, weight: 3, min: 31, max: 36 },
      { id: 82, weight: 2, min: 32, max: 37 },
      { id: 68, weight: 2, min: 32, max: 37 },
      { id: 45, weight: 2, min: 34, max: 39 },
    ],
    npcs: [
      {
        id: 'nebel_bergsteiger', x: 9, y: 1, facing: 'down',
        name: 'Bergsteiger Kurt', kind: 'trainer', sprite: 'trainer-generic',
        prize: 1100,
        lines: ['Respekt, wer sich in diesen Nebel wagt. Ich bin Kurt – und ich teste dich!'],
        team: [
          { speciesId: 65, level: 32 },
          { speciesId: 47, level: 33 },
          { speciesId: 66, level: 34 },
        ],
        victoryLines: ['Ausgezeichnet! Du bist bereit für den Gipfel.'],
        defeatLines: ['Der Berg gehört den Starken!'],
        postLines: ['Der Bergpass liegt östlich. Dort wartet Gipfler.'],
      },
      {
        id: 'nebel_nox', x: 5, y: 8, facing: 'up',
        name: 'Nox-Grunz Shadow', kind: 'trainer', sprite: 'trainer-generic',
        prize: 1050,
        lines: ['Hier in den Nebeln experimentiert Team Nox mit Geist-Kreaturen!', 'Und du störst uns – das ist ein Fehler!'],
        team: [
          { speciesId: 36, level: 33 },
          { speciesId: 80, level: 34 },
          { speciesId: 79, level: 35 },
        ],
        victoryLines: ['Doch stärker als erwartet… Rückzug!'],
        defeatLines: ['Für den Ruhm von Team Nox!'],
        postLines: ['Unser Anführer Vesper wird das nicht dulden.'],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 10: Bergpass – Route 6 (Orden 6: Gipfler/Luft)
  // ══════════════════════════════════════════════════════════════════════════
  bergpass: {
    name: 'Bergpass',
    battleBg: 'cave',
    music: 'town',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'TRR..........RRT',
      'T..R........R..T',
      'T..............T',
      '<......G.......>',
      'T..............T',
      'T..R........R..T',
      'TRR..........RRT',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 65, weight: 4, min: 34, max: 40 },
      { id: 66, weight: 3, min: 36, max: 42 },
      { id: 82, weight: 3, min: 34, max: 40 },
      { id: 83, weight: 2, min: 37, max: 43 },
      { id: 49, weight: 2, min: 35, max: 40 },
      { id: 68, weight: 2, min: 34, max: 39 },
    ],
    npcs: [
      {
        id: 'berg_nurse', x: 4, y: 1, facing: 'down',
        name: 'Schwester Eva', kind: 'heal', sprite: 'nurse',
        lines: ['Hier oben auf dem Pass gibt es Hilfe für erschöpfte Trainer!'],
        healLines: ['Die Bergluft gibt deinen Kreaturen neue Kraft!'],
      },
      {
        id: 'gym_gipfler', x: 7, y: 6, facing: 'down',
        name: 'Arenaleiter Gipfler', kind: 'trainer', sprite: 'leader-volt',
        badge: 'wind', badgeName: 'Wind-Orden', prize: 5000,
        lines: [
          'Der Wind des Gipfels trägt mich und meine Kreaturen.',
          'Ich bin Gipfler. Nur wer den Wind besiegt, verdient den Orden!',
        ],
        team: [
          { speciesId: 65, level: 40 },
          { speciesId: 28, level: 41 },
          { speciesId: 82, level: 42 },
          { speciesId: 66, level: 43 },
          { speciesId: 67, level: 45 },
        ],
        victoryLines: ['Der Wind flüstert deinen Namen! Der Wind-Orden ist deiner!'],
        defeatLines: ['Der Gipfel gehört den Stärksten. Komm wieder!'],
        postLines: ['Mit sechs Orden bist du bereit fürs Hochland. Dort wartet Team Nox.'],
      },
      {
        id: 'rival_5', x: 12, y: 9, facing: 'left',
        name: 'Joran', kind: 'trainer', sprite: 'joran', rival: true,
        prize: 3800,
        lines: [
          'Du bist weit gekommen. Ich auch.',
          'Sechs Orden – und ich stehe hier, weil ich weiß, was als nächstes kommt.',
          'Team Nox muss aufgehalten werden. Aber zuerst… kämpfen wir!',
        ],
        team: [
          { speciesId: 17, level: 42 },
          { speciesId: 30, level: 42 },
          { speciesId: 58, level: 43 },
          { speciesId: 66, level: 44 },
          { speciesId: 43, level: 45 },
        ],
        victoryLines: ['Stark. Wirklich stark. Gut, dass du auf unserer Seite bist.', 'Vesper und Team Nox warten im Hochland. Ich bin an deiner Seite!'],
        defeatLines: ['Ha! Diesmal! Aber gegen Team Nox ziehen wir trotzdem zusammen!'],
        postLines: ['Das Hochland liegt östlich. Lass uns gehen – zusammen.'],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 11: Hochland – Team Nox Hauptquartier
  // ══════════════════════════════════════════════════════════════════════════
  hochland: {
    name: 'Hochland',
    battleBg: 'cave',
    music: 'hoehle',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..R....RR..R..T',
      'T..""".....""".T',
      'T..............T',
      'T.R.....R......T',
      '<..""....."""...>',
      'T..............T',
      'T..RR...R.R....T',
      'T..""".....""".T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [
      { id: 36, weight: 4, min: 38, max: 45 },
      { id: 37, weight: 3, min: 40, max: 46 },
      { id: 86, weight: 3, min: 38, max: 45 },
      { id: 80, weight: 4, min: 38, max: 44 },
      { id: 81, weight: 2, min: 42, max: 47 },
      { id: 84, weight: 2, min: 40, max: 45 },
      { id: 49, weight: 2, min: 40, max: 46 },
    ],
    npcs: [
      {
        id: 'hoch_nox1', x: 4, y: 2, facing: 'right',
        name: 'Nox-Grunz Kalt', kind: 'trainer', sprite: 'trainer-generic',
        prize: 1400,
        lines: ['Das Hochland ist gesperrt! Nur Team Nox hat hier Zutritt!'],
        team: [
          { speciesId: 79, level: 42 },
          { speciesId: 81, level: 43 },
          { speciesId: 37, level: 44 },
        ],
        victoryLines: ['Nicht möglich…'],
        defeatLines: ['Für Team Nox!'],
        postLines: ['Vesper wird dich vernichten.'],
      },
      {
        id: 'hoch_nox2', x: 11, y: 8, facing: 'left',
        name: 'Nox-Grunz Schatten', kind: 'trainer', sprite: 'trainer-generic',
        prize: 1450,
        lines: ['Du wagst es, bis hier vorzudringen? Team Nox duldet keine Helden!'],
        team: [
          { speciesId: 80, level: 43 },
          { speciesId: 84, level: 44 },
          { speciesId: 36, level: 45 },
        ],
        victoryLines: ['Du… du bist stärker als erwartet.'],
        defeatLines: ['Kein Entkommen!'],
        postLines: ['Vesper wird dich aufhalten!'],
      },
      {
        id: 'hoch_vesper', x: 8, y: 5, facing: 'down',
        name: 'Anführerin Vesper', kind: 'trainer', sprite: 'trainer-generic',
        prize: 5000,
        lines: [
          'Du hast unsere Grunzen besiegt. Beeindruckend.',
          'Ich bin Vesper, Anführerin von Team Nox.',
          'Wir suchen nach den legendären Kreaturen dieser Welt – um unbegrenzte Macht zu erlangen!',
          'Du wirst uns nicht aufhalten. Das verspreche ich dir!',
        ],
        team: [
          { speciesId: 79, level: 46 },
          { speciesId: 81, level: 46 },
          { speciesId: 37, level: 47 },
          { speciesId: 85, level: 48 },
          { speciesId: 87, level: 49 },
        ],
        victoryLines: [
          'Nein… nein, das ist nicht möglich!',
          'Wie kann jemand so stark sein…?',
          'Team Nox… zieht sich zurück. Für jetzt.',
          'Aber die Siegeshalle liegt vor dir. Dort wirst du sehen, was wahre Macht bedeutet!',
        ],
        defeatLines: ['Team Nox siegt immer. Die Welt wird uns gehören!'],
        postLines: ['Du hast Team Nox besiegt. Ziehe weiter zur Siegeshalle!'],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Zone 12: Siegeshalle – Elite 4 + Meisterschaft (Orden 7+8)
  // ══════════════════════════════════════════════════════════════════════════
  siegeshalle: {
    name: 'Siegeshalle',
    town: true,
    battleBg: 'cave',
    music: 'town',
    rows: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T...C..........T',
      'T..............T',
      'T..............T',
      '<.......G......T',
      'T..............T',
      'T.....G........T',
      'T..............T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    encounters: [],
    npcs: [
      {
        id: 'sieg_nurse', x: 4, y: 3, facing: 'down',
        name: 'Schwester Kristall', kind: 'heal', sprite: 'nurse',
        lines: ['Willkommen in der Siegeshalle, Trainer.', 'Hier endet deine Reise – oder beginnt sie erst richtig.'],
        healLines: ['Deine Kreaturen sind bereit für den größten Kampf ihres Lebens!'],
      },
      {
        id: 'elite4_1', x: 3, y: 6, facing: 'right',
        name: 'Elite-4-Mitglied Phantar', kind: 'trainer', sprite: 'trainer-generic',
        prize: 6000,
        lines: ['Du hast es bis hierher geschafft. Die Elite 4 begrüßt dich.', 'Ich, Phantar, werde den ersten Stein aus deinem Weg räumen – wenn du kannst!'],
        team: [
          { speciesId: 36, level: 50 },
          { speciesId: 38, level: 51 },
          { speciesId: 81, level: 52 },
          { speciesId: 37, level: 53 },
        ],
        victoryLines: ['Außergewöhnlich. Der Weg liegt frei vor dir.'],
        defeatLines: ['Die Geister flüstern mir den Sieg zu.'],
        postLines: ['Du hast mich besiegt. Weiter.'],
      },
      {
        id: 'elite4_2', x: 5, y: 8, facing: 'up',
        name: 'Elite-4-Mitglied Isadora', kind: 'trainer', sprite: 'trainer-generic',
        prize: 6200,
        lines: ['Dein Geist ist stark – aber meiner ist stärker.', 'Ich bin Isadora. Deine Gedanken werden dir verraten!'],
        team: [
          { speciesId: 39, level: 52 },
          { speciesId: 87, level: 53 },
          { speciesId: 43, level: 54 },
          { speciesId: 41, level: 55 },
        ],
        victoryLines: ['Ich sehe in deinen Gedanken… Respekt.'],
        defeatLines: ['Dein Geist kann mir nicht widerstehen!'],
        postLines: ['Eine Seele, die wahrhaft kämpft. Beeindruckend.'],
      },
      {
        id: 'elite4_3', x: 10, y: 6, facing: 'left',
        name: 'Elite-4-Mitglied Bronko', kind: 'trainer', sprite: 'trainer-generic',
        prize: 6400,
        lines: ['Feuer und Erde – das sind die Grundfesten der Welt.', 'Ich bin Bronko. Meine Kreaturen werden dich zermalmen!'],
        team: [
          { speciesId: 85, level: 53 },
          { speciesId: 58, level: 54 },
          { speciesId: 84, level: 55 },
          { speciesId: 77, level: 56 },
        ],
        victoryLines: ['Der Fels bricht. Sehr gut.'],
        defeatLines: ['Die Erde gehört mir!'],
        postLines: ['Du bist wie ein Vulkan – unaufhaltsam.'],
      },
      {
        id: 'elite4_4', x: 12, y: 8, facing: 'left',
        name: 'Elite-4-Mitglied Ariana', kind: 'trainer', sprite: 'trainer-generic',
        prize: 6600,
        lines: ['Wasser und Eis – unaufhaltsame Kräfte der Natur.', 'Ich bin Ariana. Du machst einen Fehler, wenn du weitermachst!'],
        team: [
          { speciesId: 61, level: 54 },
          { speciesId: 64, level: 55 },
          { speciesId: 46, level: 56 },
          { speciesId: 83, level: 57 },
        ],
        victoryLines: ['Das Eis schmilzt. Du hast gewonnen.'],
        defeatLines: ['Meine Wellen spülen dich hinfort!'],
        postLines: ['Du hast alle vier besiegt. Die Meisterschaft ruft.'],
      },
      {
        id: 'gym_nimbus', x: 8, y: 6, facing: 'down',
        name: 'Arenaleiter Nimbus', kind: 'trainer', sprite: 'leader-volt',
        badge: 'psyche', badgeName: 'Psyche-Orden', prize: 6000,
        lines: [
          'Der Geist ist das mächtigste Werkzeug.',
          'Ich bin Nimbus. Meine Psycho-Kreaturen kennen deine nächste Bewegung bereits!',
        ],
        team: [
          { speciesId: 39, level: 48 },
          { speciesId: 86, level: 49 },
          { speciesId: 40, level: 50 },
          { speciesId: 87, level: 51 },
        ],
        victoryLines: ['Dein Geist überragt meinen. Der Psyche-Orden gehört dir!'],
        defeatLines: ['Der Geist sieht alles. Und er sieht, dass du schwächer bist.'],
        postLines: ['Mit sieben Orden bist du fast bereit. Nur noch Drakor fehlt.'],
      },
      {
        id: 'gym_drakor', x: 6, y: 8, facing: 'down',
        name: 'Arenaleiter Drakor', kind: 'trainer', sprite: 'magister',
        badge: 'drachen', badgeName: 'Drachen-Orden', prize: 7000,
        lines: [
          'Drachen sind das Älteste in dieser Welt – und das Stärkste.',
          'Ich bin Drakor. Wer meine Drachen bezwingt, hat das Recht, Meister zu werden!',
        ],
        team: [
          { speciesId: 49, level: 52 },
          { speciesId: 50, level: 53 },
          { speciesId: 83, level: 54 },
          { speciesId: 51, level: 56 },
          { speciesId: 89, level: 58 },
        ],
        victoryLines: ['Du hast die Drachen gezähmt! Der Drachen-Orden ist deiner!', 'Nur noch die Championin Lysara steht zwischen dir und dem Titel!'],
        defeatLines: ['Der Drachen-Feuer brennt für immer!'],
        postLines: ['Acht Orden. Du bist bereit. Lysara wartet auf dich.'],
      },
      {
        id: 'champion_lysara', x: 8, y: 9, facing: 'up',
        name: 'Championin Lysara', kind: 'trainer', sprite: 'joran',
        prize: 10000,
        lines: [
          'Du hast alle acht Arenaleiter besiegt und die Elite 4 überwunden.',
          'Ich bin Lysara – die amtierende Meisterin dieser Welt.',
          'Du hast Team Nox gestoppt und die Kreaturen beschützt.',
          'Aber kannst du auch mich besiegen? Zeig mir, was in dir steckt!',
        ],
        team: [
          { speciesId: 51, level: 60 },
          { speciesId: 41, level: 60 },
          { speciesId: 67, level: 61 },
          { speciesId: 46, level: 61 },
          { speciesId: 87, level: 62 },
          { speciesId: 89, level: 65 },
        ],
        victoryLines: [
          'Du hast mich besiegt. Wirklich besiegt.',
          'Du bist der neue Champion dieser Welt!',
          'Deine Reise hat die Welt verändert – du hast Team Nox gestoppt und alle Orden errungen.',
          'Ich bin stolz, gegen dich gekämpft zu haben. Herzlichen Glückwunsch, Champion!',
        ],
        defeatLines: ['Ich bin die stärkste Trainerin der Welt – das werde ich dir beweisen!'],
        postLines: ['Du bist Champion. Die Welt liegt zu deinen Füßen.'],
      },
    ],
  },
};

// Warp-Verbindungen: zoneKey -> { '<': {to, x, y}, ... }
export const WARPS = {
  ahornfeld: { 'v': { to: 'wiese',        x: 8, y: 2 } },
  wiese:     { '^': { to: 'ahornfeld',    x: 8, y: 8 }, '>': { to: 'wald',        x: 2, y: 5 } },
  wald:      { '<': { to: 'wiese',        x: 13, y: 5 }, '>': { to: 'hoehle',     x: 2, y: 5 } },
  hoehle:    { '<': { to: 'wald',         x: 13, y: 5 }, '>': { to: 'sandtal',    x: 2, y: 5 } },
  sandtal:   { '<': { to: 'hoehle',       x: 13, y: 1 }, '>': { to: 'wuestenstadt', x: 2, y: 5 } },
  wuestenstadt: { '<': { to: 'sandtal',   x: 13, y: 5 }, '>': { to: 'kueste',     x: 2, y: 5 } },
  kueste:    { '<': { to: 'wuestenstadt', x: 13, y: 5 }, '>': { to: 'havenfeld',  x: 2, y: 5 } },
  havenfeld: { '<': { to: 'kueste',       x: 13, y: 5 }, '>': { to: 'nebelberge', x: 2, y: 5 } },
  nebelberge:{ '<': { to: 'havenfeld',    x: 13, y: 5 }, '>': { to: 'bergpass',   x: 2, y: 5 } },
  bergpass:  { '<': { to: 'nebelberge',   x: 13, y: 5 }, '>': { to: 'hochland',   x: 2, y: 5 } },
  hochland:  { '<': { to: 'bergpass',     x: 13, y: 5 }, '>': { to: 'siegeshalle',x: 2, y: 5 } },
  siegeshalle: { '<': { to: 'hochland',   x: 13, y: 5 } },
};

export const START = { zone: 'ahornfeld', x: 8, y: 8 };

// Validierung: alle Zeilen einer Zone gleich breit.
for (const [key, z] of Object.entries(ZONES)) {
  const w = z.rows[0]?.length ?? 0;
  z.rows.forEach((r, i) => {
    if (r.length !== w) {
      throw new Error(`Karte "${key}" Zeile ${i} hat Breite ${r.length}, erwartet ${w}: "${r}"`);
    }
  });
}

export const ZONE_WIDTH  = 16;
export const ZONE_HEIGHT = 11;
export { ZONES };

export function tileAt(zoneKey, x, y) {
  const z = ZONES[zoneKey];
  if (!z) return 'T';
  if (y < 0 || y >= z.rows.length) return 'T';
  const row = z.rows[y];
  if (x < 0 || x >= row.length) return 'T';
  return row[x];
}

export function npcAt(zoneKey, x, y) {
  const z = ZONES[zoneKey];
  if (!z || !z.npcs) return null;
  return z.npcs.find((n) => n.x === x && n.y === y) || null;
}

const FACING_OFFSET = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function facingTile(player) {
  const [dx, dy] = FACING_OFFSET[player.facing] || [0, 1];
  return { x: player.x + dx, y: player.y + dy };
}
