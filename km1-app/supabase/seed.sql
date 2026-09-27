-- Startdaten: die 26 Videos aus dem Prototyp.
-- Erzeugt von supabase/werkzeug/startdaten.mjs, nicht von Hand ändern.
--
-- Solange eine Zeile keinen „pfad" hat, spielt die App ein Testvideo.
-- Sobald Kader die Datei hochlädt, trägt er hier den Pfad ein.

insert into public.videos
  (slug, titel, beschreibung, fehler, kategorie, ebene, woche, dauer_sek,
   zugang, gast, neu, bild, status, reihenfolge)
values
  ('flanke-innen', 'Die Flanke mit der Innenseite', 'Die beste Flanke ist die, die ankommt. Die Innenseite macht den Ball berechenbar: flach am Boden oder halbhoch auf den Elfmeterpunkt, immer mit derselben Bewegung.', 'Zu nah am Ball stehen. Dann kommt der Fuß nicht durch und die Flanke rutscht hinter das Tor.', 'flanken', 2, 1, 444, 'offen', null, true, 'pitch', 'live', 1),
  ('uebersteiger', 'Übersteiger mit Tempowechsel', 'Der Übersteiger allein schlägt keinen Gegner. Was ihn gefährlich macht, ist das, was danach passiert: der Antritt in die andere Richtung.', 'Zwei oder drei Übersteiger hintereinander. Der Gegner steht dann ruhig, weil nichts passiert.', 'dribbling', 2, 2, 348, 'offen', null, true, null, 'live', 2),
  ('kopfball', 'Kopfball: das Timing im Anlauf', 'Kopfball ist kein Mut, sondern Timing. Wer zu früh springt, verliert den Ball an den, der später kommt.', 'Mit dem Kopf auf den Ball warten statt dem Ball entgegenzugehen.', 'schuss', 2, 5, 305, 'offen', null, true, null, 'live', 3),
  ('erste-beruehrung', 'Die erste Berührung aus dem Körper heraus', 'Die erste Berührung entscheidet, ob du Zeit hast oder nicht. Wir nehmen den Ball nicht an, wir nehmen ihn mit.', 'Den Ball stoppen. Damit schenkst du dem Gegner die halbe Sekunde, die du gebraucht hättest.', 'annahme', 1, 1, 295, 'offen', null, false, null, 'live', 4),
  ('flacher-pass', 'Flacher Pass über 20 Meter', 'Der Pass, den du in jedem Spiel hundertmal brauchst. Flach, fest, auf den richtigen Fuß.', 'Den Pass zu weich spielen. Ein langsamer Ball ist für den Mitspieler schwerer als ein fester.', 'passen', 1, 2, 362, 'offen', null, false, null, 'live', 5),
  ('leiter', 'Koordinations­leiter: sechs Basis-Muster', 'Sechs Muster, die du überall üben kannst. Sie schulen den schnellen Fuß, den du für den ersten Schritt im Spiel brauchst.', 'Schnell und schlampig. Sauber und mittelschnell bringt mehr als hektisch und falsch.', 'athletik', 1, 4, 435, 'offen', null, false, 'ladder', 'live', 6),
  ('torwart-grund', 'Torwart: Grundstellung und erster Schritt', 'Der erste Schritt entscheidet über die meisten Bälle. Er beginnt in der Grundstellung, lange bevor geschossen wird.', 'Zu tief stehen. Aus der tiefen Hocke kommt kein Torwart schnell in die Ecke.', 'torwart', 1, 5, 390, 'offen', null, false, null, 'live', 7),
  ('abstoppen', 'Abstoppen und sofort andribbeln', 'Anhalten und wieder losfahren, das ist der einfachste Weg, einen Gegner loszuwerden. Ohne Trick, nur mit Tempo.', 'Zu früh antreten. Der Gegner muss erst stehen, sonst läuft er einfach mit.', 'dribbling', 1, 3, 270, 'offen', null, false, null, 'live', 8),
  ('vollspann', 'Torschuss: den Vollspann flach halten', 'Der harte Schuss nützt nichts über dem Tor. Drei Details halten ihn unten.', 'Sich beim Schuss zurücklehnen. Der Ball geht dann zwangsläufig hoch.', 'schuss', 2, 3, 400, 'offen', null, false, null, 'live', 9),
  ('ballmitnahme', 'Ballmitnahme im Sprint', 'Den Ball im vollen Lauf mitnehmen, ohne das Tempo zu verlieren. Für Außenspieler die wichtigste Bewegung überhaupt.', 'Den Ball zu weit vorlegen und dann hinterherlaufen müssen.', 'annahme', 2, 4, 320, 'konto', null, false, null, 'live', 10),
  ('doppelpass', 'Der Doppelpass im Halbraum', 'Zwei Pässe, ein Gegner weniger. Der Doppelpass lebt vom Timing des Mitspielers, nicht von der Härte des Passes.', 'Nach dem Pass stehen bleiben und auf den Ball warten.', 'passen', 3, 1, 490, 'konto', null, false, null, 'live', 11),
  ('innenrist-flanke', 'Innenrist-Flanke aus dem Halbfeld', 'Die Flanke mit Drall, die vom Tor wegdreht. Sie ist schwerer zu verteidigen als jede gerade Hereingabe.', 'Zu viel Kraft. Der Drall macht die Flanke gefährlich, nicht das Tempo.', 'flanken', 3, 2, 570, 'konto', null, false, 'goal', 'live', 12),
  ('eins-gegen-eins', '1 gegen 1: Tempowechsel statt Tricks', 'Profis schlagen ihren Gegner mit Rhythmus, nicht mit Tricks. Drei Muster, die fast immer funktionieren.', 'Den Trick vorbereiten wollen. Der Gegner liest die Absicht und stellt sich hin.', 'dribbling', 3, 3, 620, 'offen', null, false, null, 'live', 13),
  ('diagonalball', 'Der Diagonalball auf die zweite Spitze', 'Der lange Ball, der die Seite verlagert. Er gewinnt Raum, weil die gegnerische Kette die ganze Breite verschieben muss.', 'Den Ball in den Lauf statt in den Fuß spielen, wenn der Außenverteidiger schon schiebt.', 'passen', 3, 4, 470, 'konto', null, false, null, 'live', 14),
  ('rumpf', 'Rumpfstabilität für Zweikämpfe', 'Wer im Zweikampf umfällt, hat selten zu wenig Kraft in den Beinen. Meistens fehlt die Mitte.', 'Ins Hohlkreuz gehen. Lieber kürzer halten und die Spannung behalten.', 'athletik', 3, 5, 720, 'konto', null, false, null, 'live', 15),
  ('schnittstelle', 'Der Schnittstellen­pass', 'Der Pass zwischen zwei Verteidiger. Er entsteht nicht im Fuß, sondern im Kopf, zwei Sekunden vorher.', 'Zu lange warten. Die Lücke ist eine halbe Sekunde offen, nicht länger.', 'passen', 4, 2, 665, 'konto', null, false, null, 'live', 16),
  ('anlaufen', 'Anlaufen im 4-3-3: der erste Schritt', 'Pressing beginnt mit einem einzigen Laufweg. Wer falsch anläuft, öffnet die Seite für die ganze Mannschaft.', 'Allein anlaufen. Ohne die Mannschaft dahinter ist jeder Pressingversuch ein Loch.', 'taktik', 4, 1, 580, 'konto', null, false, null, 'live', 17),
  ('standard-ecke', 'Standard: die kurz ausgespielte Ecke', 'Kurz ausgespielt zieht die Verteidigung aus der Ordnung. Zwei Varianten, die im Spiel immer wieder funktionieren.', 'Zu früh in den Strafraum starten. Dann steht die Mannschaft, wenn die Flanke kommt.', 'schuss', 4, 3, 375, 'konto', null, false, null, 'live', 18),
  ('finishing-mued', 'Abschluss unter Müdigkeit', 'In der 85. Minute entscheidet sich der Abschluss. Wir trainieren ihn deshalb am Ende der Einheit, nicht am Anfang.', 'Ausruhen zwischen den Wiederholungen. Der Reiz entsteht genau in der Erschöpfung.', 'schuss', 4, 4, 525, 'konto', null, false, null, 'live', 19),
  ('regeneration', 'Regeneration zwischen zwei Spielen', 'Englische Woche heißt nicht weniger trainieren, sondern anders. Ein Ablauf für die 48 Stunden nach dem Spiel.', 'Zwei Tage gar nichts machen. Der Körper wird dadurch träger, nicht frischer.', 'athletik', 4, 5, 560, 'konto', null, false, null, 'live', 20),
  ('profi-freistoss', 'Der Freistoß über die Mauer', 'Der Freistoß aus 20 Metern, erklärt von jemandem, der ihn im Ligabetrieb schießt. Anlauf, Treffpunkt, Nachziehen, und was er sich vorher im Kopf zurechtlegt.', 'Zu viel Kraft. Ein Freistoß wird durch den Drall gefährlich, nicht durch das Tempo.', 'schuss', 3, null, 860, 'pro', 'Profi, 2. Bundesliga', true, null, 'live', 21),
  ('profi-flanke-druck', 'Flanken unter Gegnerdruck', 'Flanken im leeren Training kann jeder. Hier geht es um die Flanke, wenn ein Gegner am Trikot zieht und die Grundlinie zwei Meter entfernt ist.', 'Warten, bis die Situation perfekt ist. Im Spiel wird sie das nie.', 'flanken', 3, null, 760, 'pro', 'Profi, 3. Liga', false, null, 'live', 22),
  ('profi-strafraum', 'Der erste Kontakt im Strafraum', 'Im Strafraum entscheidet die erste Berührung über Tor oder Abstoß. Ein Stürmer aus dem Profibereich zeigt, wohin er den Ball legt und warum.', 'Den Ball breit annehmen und sich den Winkel selbst zumachen.', 'annahme', 3, null, 675, 'pro', 'Stürmer, 2. Bundesliga', false, null, 'live', 23),
  ('profi-zweikampf', 'Körper vor Ball: der saubere Zweikampf', 'Zweikämpfe gewinnt selten der Stärkere, meistens der, der früher steht. Ein Innenverteidiger erklärt, wie er den Körper einsetzt, ohne zu foulen.', 'Mit gestrecktem Bein reingrätschen. Sieht gut aus, kostet Gelb und den Zweikampf.', 'taktik', 2, null, 605, 'pro', 'Innenverteidiger, 3. Liga', false, null, 'live', 24),
  ('profi-torwart', 'Torwart: Strafraum­beherrschung', 'Wann kommt ein Torwart raus und wann bleibt er? Ein Profitorwart zeigt seine Entscheidungsregeln bei Flanken und langen Bällen.', 'Halb rauskommen. Entweder ganz oder gar nicht, alles dazwischen ist der Fehler.', 'torwart', 3, null, 810, 'pro', 'Torwart, 2. Bundesliga', false, null, 'live', 25),
  ('profi-alltag', 'Ein Tag im Profialltag', 'Kein Techniktraining, sondern ein ganzer Tag: Frühstück, Videoanalyse, Einheit, Regeneration, Abendessen. Damit klar wird, wie viel neben dem Platz passiert.', 'Denken, Profi sein heißt zweimal am Tag Fußball spielen. Der größere Teil ist alles drumherum.', 'athletik', 1, null, 1010, 'pro', 'Profi, 2. Bundesliga', false, null, 'live', 26)
on conflict (slug) do update set
  titel = excluded.titel, beschreibung = excluded.beschreibung, fehler = excluded.fehler,
  kategorie = excluded.kategorie, ebene = excluded.ebene, woche = excluded.woche,
  dauer_sek = excluded.dauer_sek, zugang = excluded.zugang, gast = excluded.gast,
  neu = excluded.neu, bild = excluded.bild, reihenfolge = excluded.reihenfolge;

delete from public.video_schritte
 where video_id in (select id from public.videos where slug in ('flanke-innen', 'uebersteiger', 'kopfball', 'erste-beruehrung', 'flacher-pass', 'leiter', 'torwart-grund', 'abstoppen', 'vollspann', 'ballmitnahme', 'doppelpass', 'innenrist-flanke', 'eins-gegen-eins', 'diagonalball', 'rumpf', 'schnittstelle', 'anlaufen', 'standard-ecke', 'finishing-mued', 'regeneration', 'profi-freistoss', 'profi-flanke-druck', 'profi-strafraum', 'profi-zweikampf', 'profi-torwart', 'profi-alltag'));

insert into public.video_schritte (video_id, nr, text, sekunde)
select v.id, s.nr, s.text, s.sekunde
from (values
  ('flanke-innen', 1, 'Standbein neben den Ball, die Fußspitze zeigt dorthin, wo der Ball hin soll.', 27),
  ('flanke-innen', 2, 'Vor dem Schuss einmal kurz den Kopf heben: Wo läuft der Mitspieler hin, nicht wo steht er.', 131),
  ('flanke-innen', 3, 'Knöchel fest, mit der Innenseite durch die Ballmitte streichen, nicht darunter.', 236),
  ('flanke-innen', 4, 'In die Laufrichtung nachziehen statt abzustoppen.', 340),
  ('uebersteiger', 1, 'Mit Tempo auf den Gegner zu, aber zwei Meter vorher langsamer werden.', 21),
  ('uebersteiger', 2, 'Den Fuß außen um den Ball führen, die Schulter geht mit.', 130),
  ('uebersteiger', 3, 'Sofort mit dem Außenrist des anderen Fußes wegdrücken und drei Meter sprinten.', 239),
  ('kopfball', 1, 'Zwei Schritte Anlauf, den letzten kurz und schnell.', 18),
  ('kopfball', 2, 'Mit dem Absprung warten, bis der Ball auf Höhe des Sechzehners ist.', 114),
  ('kopfball', 3, 'Die Stirn trifft, der Oberkörper klappt nach vorn, Augen bleiben offen.', 209),
  ('erste-beruehrung', 1, 'Vor der Annahme über die Schulter schauen: Wo ist Platz?', 18),
  ('erste-beruehrung', 2, 'Den Ball mit der Innenseite in den freien Raum legen, nicht vor die eigenen Füße.', 110),
  ('erste-beruehrung', 3, 'Nach der Berührung sofort zwei Schritte machen.', 203),
  ('flacher-pass', 1, 'Standbein zeigt zum Ziel, Arme raus für die Balance.', 22),
  ('flacher-pass', 2, 'Innenseite quer zum Ball, Knöchel bleibt steif.', 135),
  ('flacher-pass', 3, 'Durch die Ballmitte spielen und den Fuß bis zum Ziel nachführen.', 249),
  ('leiter', 1, 'Immer auf dem Ballen laufen, die Ferse berührt den Boden nicht.', 26),
  ('leiter', 2, 'Arme mitlaufen lassen, sie geben den Takt vor.', 162),
  ('leiter', 3, 'Kurze Sätze: 20 Sekunden schnell, 40 Sekunden Pause.', 299),
  ('torwart-grund', 1, 'Füße etwa schulterbreit, Gewicht auf den Ballen, Hände offen vor dem Körper.', 23),
  ('torwart-grund', 2, 'Kurz vor dem Schuss ein kleiner Hüpfer, damit die Beine geladen sind.', 145),
  ('torwart-grund', 3, 'Der erste Schritt geht seitlich zum Ball, nicht nach hinten.', 268),
  ('abstoppen', 1, 'Mit der Sohle abstoppen, der Körper geht leicht über den Ball.', 16),
  ('abstoppen', 2, 'Eine Sekunde Ruhe, den Gegner herankommen lassen.', 101),
  ('abstoppen', 3, 'Mit dem Außenrist antreten und nicht mehr hinschauen.', 185),
  ('vollspann', 1, 'Standbein neben den Ball, Knie über dem Ball.', 24),
  ('vollspann', 2, 'Fußspitze nach unten strecken, mit dem Schnürsenkel treffen.', 149),
  ('vollspann', 3, 'Oberkörper über den Ball beugen und nach vorn nachziehen.', 275),
  ('ballmitnahme', 1, 'Den Ball früh anschauen und das Tempo schon vor der Berührung anpassen.', 19),
  ('ballmitnahme', 2, 'Mit dem Außenrist nach vorn schieben, nicht anhalten.', 119),
  ('ballmitnahme', 3, 'Der nächste Schritt ist ein Sprintschritt, kein Bremsschritt.', 220),
  ('doppelpass', 1, 'Den Gegner anlaufen, damit er auf den Ball geht.', 29),
  ('doppelpass', 2, 'Fest in den Fuß des Mitspielers spielen und sofort in den Rücken des Gegners starten.', 183),
  ('doppelpass', 3, 'Der Mitspieler klatscht mit einem Kontakt in den Lauf, nie in die Füße.', 336),
  ('innenrist-flanke', 1, 'Den Ball seitlich vorlegen, damit du im Bogen anlaufen kannst.', 34),
  ('innenrist-flanke', 2, 'Mit dem Innenrist unter die Ballhälfte treffen, nicht durch die Mitte.', 213),
  ('innenrist-flanke', 3, 'Den Fuß über die Körperachse hinaus nachziehen, das erzeugt den Drall.', 391),
  ('eins-gegen-eins', 1, 'Aus dem Lauf verlangsamen und den Gegner zum Stehen bringen.', 37),
  ('eins-gegen-eins', 2, 'Den Ball zeigen, damit er den Fuß ausstreckt.', 231),
  ('eins-gegen-eins', 3, 'Im Moment der Gewichtsverlagerung antreten, auf die offene Seite.', 426),
  ('diagonalball', 1, 'Kopf hoch, bevor der Ball kommt: Wer steht auf der anderen Seite frei?', 28),
  ('diagonalball', 2, 'Den Ball aus dem Körper heraus vorlegen, damit du Anlauf hast.', 175),
  ('diagonalball', 3, 'Mit dem Innenrist unter den Ball, Ziel ist die Brust des Mitspielers.', 323),
  ('rumpf', 1, 'Unterarmstütz mit Beinheben, drei Sätze zu 30 Sekunden.', 43),
  ('rumpf', 2, 'Seitstütz mit gestrecktem Arm, beide Seiten gleich lange.', 269),
  ('rumpf', 3, 'Zum Schluss zwei Minuten Ausfallschritte im Wechsel, ruhig und kontrolliert.', 494),
  ('schnittstelle', 1, 'Die Kette beobachten, während der Ball noch unterwegs ist.', 40),
  ('schnittstelle', 2, 'Den Ball so annehmen, dass der Passweg frei wird.', 248),
  ('schnittstelle', 3, 'Flach und fest zwischen die beiden spielen, im Moment des Losgehens.', 457),
  ('anlaufen', 1, 'Bogenlauf, damit der Rückpass zum Torwart zugestellt ist.', 35),
  ('anlaufen', 2, 'Den Gegner auf die schwächere Seite lenken, nicht frontal anlaufen.', 217),
  ('anlaufen', 3, 'Das Signal geben, damit die Kette zeitgleich nachschiebt.', 398),
  ('standard-ecke', 1, 'Der zweite Mann geht an, der Gegner muss mit herausrücken.', 23),
  ('standard-ecke', 2, 'Zurücklegen und sofort mit dem ersten Kontakt flanken.', 140),
  ('standard-ecke', 3, 'Die Spitzen starten erst, wenn der Ball zurückgelegt ist.', 258),
  ('finishing-mued', 1, 'Zwei Sprints über 30 Meter, direkt danach der Abschluss.', 32),
  ('finishing-mued', 2, 'Die Technik nicht verkürzen, auch wenn die Beine schwer sind.', 196),
  ('finishing-mued', 3, 'Immer den Nachschuss mitgehen.', 361),
  ('regeneration', 1, 'Direkt nach dem Spiel zehn Minuten locker ausradeln.', 34),
  ('regeneration', 2, 'Am Folgetag Mobilisation und ein kurzer Aktivierungsblock.', 209),
  ('regeneration', 3, '48 Stunden vorher wieder Intensität, sonst fehlt am Spieltag die Spritzigkeit.', 385),
  ('profi-freistoss', 1, 'Den Ball so hinlegen, dass das Ventil zum Tor zeigt. Klingt nach Aberglaube, gibt dir aber jedes Mal denselben Anhaltspunkt.', 52),
  ('profi-freistoss', 2, 'Drei Schritte Anlauf, leicht seitlich, der letzte Schritt ist der längste.', 321),
  ('profi-freistoss', 3, 'Mit dem Innenrist unter die untere Ballhälfte, den Fuß über die Körperachse hinaus nachziehen.', 591),
  ('profi-flanke-druck', 1, 'Den Ball mit dem Körper abschirmen, bevor du überhaupt hochschaust.', 46),
  ('profi-flanke-druck', 2, 'Einen halben Schritt weg vom Gegner, damit der Fuß Platz zum Durchschwingen hat.', 284),
  ('profi-flanke-druck', 3, 'Den ersten Anlauf antäuschen, dann flanken. Der Verteidiger streckt das Bein, und du hast die Lücke.', 522),
  ('profi-strafraum', 1, 'Vor der Flanke einmal über die Schulter: Wo steht der Verteidiger, wo der Torwart?', 41),
  ('profi-strafraum', 2, 'Den Ball nie zum Tor hin annehmen, sondern quer, weg vom Verteidiger.', 252),
  ('profi-strafraum', 3, 'Nach der Annahme sofort schießen, auch aus unbequemer Lage. Der zweite Kontakt kommt meistens zu spät.', 464),
  ('profi-zweikampf', 1, 'Den Gegner früh spüren lassen: Schulter an Schulter, bevor der Ball da ist.', 36),
  ('profi-zweikampf', 2, 'Immer zwischen Ball und Gegner bleiben, auch wenn das heißt, rückwärts zu laufen.', 226),
  ('profi-zweikampf', 3, 'Den Fuß erst rausstellen, wenn der Ball vom Gegner weggeht, nie davor.', 415),
  ('profi-torwart', 1, 'Die Ausgangsposition ist keine Linie, sondern ein Bogen: je weiter der Ball außen steht, desto weiter vorn stehst du.', 49),
  ('profi-torwart', 2, 'Bei der Flanke früh loslaufen und den höchsten Punkt anpeilen, nicht den Ball.', 303),
  ('profi-torwart', 3, 'Rufen, bevor du losläufst. Eine stumme Herausnahme ist ein Eigentor mit Ansage.', 556),
  ('profi-alltag', 1, 'Der Tag beginnt mit Wiegen und einem kurzen Gespräch über den Schlaf.', 61),
  ('profi-alltag', 2, 'Zwischen den Einheiten sind Essen und Schlafen Teil des Trainings, nicht Pause davon.', 377),
  ('profi-alltag', 3, 'Nach dem Abschlusstraining kommt die Videoanalyse des nächsten Gegners.', 694)
) as s(slug, nr, text, sekunde)
join public.videos v on v.slug = s.slug;

insert into public.plaene (id, titel, ebene, fuer, satz, minuten, reihenfolge)
values
  ('grundlagen', 'Grundlagen in sechs Wochen', 1, 'U8 bis U13', 'Annehmen, passen, abstoppen und die Füße schnell machen. Die Basis für alles andere.', 20, 1),
  ('dribbling', 'Dribbling mit Tempo', 2, 'U10 bis U15', 'Vom ersten Übersteiger bis zum 1 gegen 1: Tempowechsel statt Tricks.', 25, 2),
  ('flanke', 'Flanke und Abschluss', 2, 'U10 bis U17', 'Die Flanke, die ankommt, und der Abschluss, der sitzt. Zu zweit am schönsten.', 30, 3)
on conflict (id) do update set
  titel = excluded.titel, ebene = excluded.ebene, fuer = excluded.fuer,
  satz = excluded.satz, minuten = excluded.minuten, reihenfolge = excluded.reihenfolge;

delete from public.plan_einheiten where plan_id in ('grundlagen', 'dribbling', 'flanke');

insert into public.plan_einheiten (plan_id, woche, nr, video_id, aufgabe)
select e.plan_id, e.woche, e.nr, v.id, e.aufgabe
from (values
  ('grundlagen', 1, 1, 'erste-beruehrung', 'Langsam, 3 × 5 Minuten, beide Füße'),
  ('grundlagen', 1, 2, 'flacher-pass', 'Gegen die Wand, 50 Pässe pro Fuß'),
  ('grundlagen', 1, 3, 'leiter', 'Die ersten drei Muster, je 5 Durchgänge'),
  ('grundlagen', 2, 1, 'abstoppen', 'Stoppen, andribbeln, 20 Wiederholungen'),
  ('grundlagen', 2, 2, 'erste-beruehrung', 'Mit Blick nach oben vor der Annahme'),
  ('grundlagen', 2, 3, 'leiter', 'Alle sechs Muster, je 3 Durchgänge'),
  ('grundlagen', 3, 1, 'flacher-pass', 'Über 20 Meter, 30 Pässe pro Fuß'),
  ('grundlagen', 3, 2, 'abstoppen', 'Mit Richtungswechsel nach dem Stoppen'),
  ('grundlagen', 3, 3, 'erste-beruehrung', 'Annahme in die Bewegung'),
  ('grundlagen', 4, 1, 'leiter', 'Tempo steigern, auf Zeit'),
  ('grundlagen', 4, 2, 'flacher-pass', 'Direkt spielen, ohne Annahme'),
  ('grundlagen', 4, 3, 'abstoppen', 'Aus dem Lauf stoppen'),
  ('grundlagen', 5, 1, 'erste-beruehrung', 'Unter Zeitdruck: zwei Kontakte'),
  ('grundlagen', 5, 2, 'flacher-pass', 'Mit dem schwachen Fuß, 50 Pässe'),
  ('grundlagen', 5, 3, 'leiter', 'Muster nach Ansage'),
  ('grundlagen', 6, 1, 'abstoppen', 'Im Spiel zu zweit'),
  ('grundlagen', 6, 2, 'erste-beruehrung', 'Annahme, Blick, Pass in einer Bewegung'),
  ('grundlagen', 6, 3, 'flacher-pass', 'Test: 20 Pässe durch ein Hütchentor'),
  ('dribbling', 1, 1, 'uebersteiger', 'Im Stand, 3 × 20 pro Seite'),
  ('dribbling', 1, 2, 'abstoppen', 'Stoppen und explodieren, 20 Mal'),
  ('dribbling', 1, 3, 'leiter', 'Schnelle Füße, 4 Muster'),
  ('dribbling', 2, 1, 'uebersteiger', 'Im Gehen, dann im Trab'),
  ('dribbling', 2, 2, 'ballmitnahme', 'Mitnahme in den freien Raum'),
  ('dribbling', 2, 3, 'leiter', 'Mit Ball danach: 5 Meter Antritt'),
  ('dribbling', 3, 1, 'uebersteiger', 'Mit Tempowechsel nach dem Trick'),
  ('dribbling', 3, 2, 'eins-gegen-eins', 'Gegen einen Hütchengegner'),
  ('dribbling', 3, 3, 'abstoppen', 'Richtungswechsel links und rechts'),
  ('dribbling', 4, 1, 'eins-gegen-eins', 'Gegen einen Partner, halbes Tempo'),
  ('dribbling', 4, 2, 'ballmitnahme', 'Im Sprint, 10 Wiederholungen'),
  ('dribbling', 4, 3, 'uebersteiger', 'Doppelter Übersteiger'),
  ('dribbling', 5, 1, 'eins-gegen-eins', 'Volles Tempo, 10 Duelle'),
  ('dribbling', 5, 2, 'uebersteiger', 'Mit dem schwachen Fuß'),
  ('dribbling', 5, 3, 'ballmitnahme', 'Mitnahme und Abschluss'),
  ('dribbling', 6, 1, 'eins-gegen-eins', 'Im Spiel 2 gegen 2'),
  ('dribbling', 6, 2, 'uebersteiger', 'Test: 44 in 60 Sekunden'),
  ('dribbling', 6, 3, 'abstoppen', 'Alles zusammen, 15 Minuten'),
  ('flanke', 1, 1, 'flanke-innen', 'Aus dem Stand, 20 pro Seite'),
  ('flanke', 1, 2, 'vollspann', 'Flach aufs Tor, 20 Schüsse'),
  ('flanke', 1, 3, 'kopfball', 'Aus der Hand, Timing üben'),
  ('flanke', 2, 1, 'flanke-innen', 'Aus dem Lauf, auf den Elfmeterpunkt'),
  ('flanke', 2, 2, 'vollspann', 'Nach Ballmitnahme'),
  ('flanke', 2, 3, 'kopfball', 'Mit Anlauf'),
  ('flanke', 3, 1, 'innenrist-flanke', 'Aus dem Halbfeld, 20 Flanken'),
  ('flanke', 3, 2, 'vollspann', 'Mit dem schwachen Fuß'),
  ('flanke', 3, 3, 'flanke-innen', 'Flach an den ersten Pfosten'),
  ('flanke', 4, 1, 'innenrist-flanke', 'Auf einen Partner im Lauf'),
  ('flanke', 4, 2, 'kopfball', 'Nach Flanke vom Partner'),
  ('flanke', 4, 3, 'vollspann', 'Direktabnahme'),
  ('flanke', 5, 1, 'flanke-innen', 'Unter Zeitdruck: drei Kontakte'),
  ('flanke', 5, 2, 'finishing-mued', 'Abschluss nach Sprint'),
  ('flanke', 5, 3, 'kopfball', 'Gegen einen Gegenspieler'),
  ('flanke', 6, 1, 'innenrist-flanke', 'Flanke und Abschluss zu zweit'),
  ('flanke', 6, 2, 'finishing-mued', '10 Abschlüsse nach Belastung'),
  ('flanke', 6, 3, 'flanke-innen', 'Test: 7 von 10 kommen an')
) as e(plan_id, woche, nr, slug, aufgabe)
join public.videos v on v.slug = e.slug;

insert into public.camps (id, titel, von, bis, preis_cent, geschwister_rabatt_cent, plaetze, jahrgang_von, jahrgang_bis)
values ('herbst-koeln', 'Herbstcamp Köln', '2026-10-19', '2026-10-23', 24900, 2000, 40, 2011, 2018)
on conflict (id) do update set
  titel = excluded.titel, von = excluded.von, bis = excluded.bis, preis_cent = excluded.preis_cent,
  geschwister_rabatt_cent = excluded.geschwister_rabatt_cent, plaetze = excluded.plaetze,
  jahrgang_von = excluded.jahrgang_von, jahrgang_bis = excluded.jahrgang_bis;
