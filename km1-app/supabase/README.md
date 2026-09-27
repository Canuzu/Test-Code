# Der Server der KM1-App (Supabase)

Hier liegt alles, was die Datenbank braucht: Tabellen, Regeln, Startdaten und
ein Test, der die Regeln prüft. Die App läuft auch ohne Server, im
Vorschau-Modus; mit Server gehören Konten, Fortschritt und Merkliste der
Datenbank.

| Datei | Inhalt |
| --- | --- |
| `migrations/20260923120000_grundlage.sql` | Videos, Fortschritt, Merkliste, Abo: Tabellen, Regeln (RLS), Funktionen, Speicher |
| `migrations/20260927120000_gemeinschaft.sql` | Rollen mit Haken, Einladungen, Familie, Teams, Videos der Spieler, Nachrichten, Laufbahn, Scouting, Meldungen, Seiten, Pläne, Camps |
| `seed.sql` | Die 26 Videos mit ihren 79 Schritten, die drei Trainingspläne und das Herbstcamp aus dem Prototyp |
| `werkzeug/startdaten.mjs` | Erzeugt `seed.sql` und die Daten der App aus `app/index.html` |
| `tests/regeln.test.mjs` | Prüft die Regeln der Grundlage in einer echten Postgres-Datenbank (PGlite) |
| `tests/gemeinschaft.test.mjs` | Prüft die Regeln der Gemeinschaft, entlang der Geschichte aus der App |

## Was die Datenbank durchsetzt

- **Drei Zugangsstufen.** `offen` für alle, `konto` mit kostenlosem Konto,
  `pro` nur mit laufendem Abo. Die Beschreibung jedes Videos ist für alle
  lesbar (die App zeigt sie als Vorgeschmack), die Schritte und die Datei nur
  für die, die dürfen.
- **Unter 16 nur mit Einwilligung der Eltern.** Ein Konto mit einem Jahrgang
  unter 16 wird ohne `eltern_einwilligung` gar nicht erst angelegt. Das Konto
  läuft auf die E-Mail der Eltern; die Bestätigungsmail geht an sie.
- **Rolle, Ebene und Abo setzt niemand selbst.** Ändern darf ein Nutzer nur
  seinen Vornamen. Die Ebene steigt über `aufsteigen()`, wenn der Pfad
  abgehakt ist; das Abo schreibt später nur der Webhook von RevenueCat.
- **Konto löschen** über `konto_loeschen()` nimmt alles mit, was am Konto
  hängt, auch Videos, Nachrichten, Buchungen und Meldungen. Apple verlangt,
  dass das in der App geht.
- **Videos im Speicher.** `videos-offen` ist öffentlich, `videos-geschuetzt`
  gibt Dateien nur über einen signierten Link heraus, der eine Stunde gilt —
  und nur an die, die das Video sehen dürfen.

## Was die Gemeinschaft durchsetzt

Dieselben drei Regeln wie in der App, hier auf dem Server:

- **Geprüft wird, wer mit Kindern arbeitet oder sie sichtet.** Die Rolle
  kommt aus der Anmeldung, KM1 wählt niemand selbst. Den Haken vergibt KM1
  an Vereine und Akademien (`pruefung_entscheiden()`). Die laden ihre
  Trainer, Scouts und Profis mit einem Code ein (`einladung_erstellen()`,
  `einladung_einloesen()`) und bürgen für sie. KM1 kann jeden Haken wieder
  entziehen (`haken_entziehen()`). Von Belegen wie dem Führungszeugnis wird
  nur gespeichert, dass sie vorlagen.
- **Kein Video eines Kindes im offenen Netz.** Lädt ein Kind unter 16 hoch,
  wartet das Video auf die Eltern (`upload_freigeben()`). Wer es danach
  sieht, entscheidet `darf_upload_sehen()`, wie `darfSehen(u)` in der App:
  nur der Trainer, das Team mit Eltern, KM1, auf dem Profil auch geprüfte
  Konten und ab 16 alle Angemeldeten. Gäste nie.
- **Kein Fremder schreibt einem Kind.** `schreib_recht()` ist
  `schreibRecht(von, an)` aus der App. Chats entstehen nur über
  `chat_starten()`, Profis und Vereine bekommen Anfragen statt Nachrichten,
  und die Eltern lesen die Chats ihres Kindes unter 16 mit.

Dazu:

- **Familie** über den Code aus der App des Kindes (`kind_verbinden()`).
  Den Code liest nur das Kind selbst.
- **Teams:** anlegen nur mit Haken, beitreten per Code, aufnehmen muss der
  Trainer selbst. Mit KM1 Team (`abos.art = 'team'`) sind Profi-Einheiten und
  Pläne für die ganze Mannschaft frei.
- **Laufbahn:** unter 16 tragen die Eltern ein, der Trainer bestätigt.
  Scouts sehen sie ab 16 oder mit Freigabe des Talentprofils durch die
  Eltern. Kontakt geht nur an die Eltern.
- **Meldungen** schreibt jeder, lesen und entscheiden nur KM1. Wer gemeldet
  hat, bleibt unbekannt.
- **Pläne:** die erste Woche mit Konto, der Rest mit Pro.
- **Camps** bucht nur ein Erwachsener, die Plätze zählt `camp_buchen()`
  unter einer Sperre. „Bezahlt" setzt später nur der Webhook des
  Zahlungsanbieters.

## Einrichten, einmal

1. **Projekt anlegen** auf supabase.com. Als Region **Frankfurt
   (eu-central-1)** wählen. Die Datenschutzseite der App sagt „auf Servern in
   Frankfurt"; bei einer anderen Region muss der Satz in
   `mobile/src/app/datenschutz.tsx` angepasst werden.
2. **Datenbank einspielen.** Im Dashboard unter *SQL Editor* den ganzen Inhalt
   von `migrations/20260923120000_grundlage.sql` einfügen und ausführen,
   danach `migrations/20260927120000_gemeinschaft.sql`, zuletzt `seed.sql`.
3. **Anmeldung einstellen** unter *Authentication*:
   - *Sign In / Providers → Email*: „Confirm email" an, Mindestlänge des
     Passworts 8.
   - *URL Configuration*: als Redirect URLs `km1://**` und für Expo Go
     `exp://**` eintragen.
   - *Emails*: Die eingebaute Versandfunktion schafft nur wenige Mails pro
     Stunde. Vor dem Start einen eigenen Versand (SMTP) eintragen, zum Beispiel
     über den Mailanbieter von km1-training.de.
4. **Mit Google anmelden** (optional, geht auch später):
   - In der Google Cloud Console unter *APIs & Dienste → Anmeldedaten* eine
     OAuth-Client-ID vom Typ „Webanwendung" anlegen.
   - Als autorisierte Weiterleitungs-URI eintragen:
     `https://<projekt>.supabase.co/auth/v1/callback`
   - Client-ID und Client-Secret in Supabase unter *Authentication → Sign In /
     Providers → Google* eintragen.
5. **Kader zu KM1 machen**, nachdem er sich einmal angemeldet hat, im SQL
   Editor. Die Rolle `km1` kann sich niemand selbst geben:
   ```sql
   update public.profiles set rolle = 'km1'
   where id = (select id from auth.users where email = 'kaders@adresse.de');
   ```
6. **Die App verbinden.** Die Projekt-Adresse und der öffentliche Schlüssel
   (*Project Settings → API*) gehören in zwei Umgebungsvariablen, siehe
   `mobile/README.md`.

## Ein Video einstellen

Bis es den Upload für Trainer gibt:

1. Datei unter *Storage* hochladen: frei zugängliche Videos in
   `videos-offen`, alle anderen in `videos-geschuetzt`.
2. Im *Table Editor* bei dem Video in `videos` den Dateinamen in `pfad`
   eintragen, zum Beispiel `erste-beruehrung.mp4`.
3. Die Sekunden der Kapitel stehen in `video_schritte.sekunde`. Bis jetzt sind
   sie gleichmäßig verteilt; mit dem echten Schnitt die echte Sekunde
   eintragen.

Solange `pfad` leer ist, spielt die App ein Testvideo.

## Das Konto für die Prüfer von Apple und Google

Beide Stores verlangen ein Konto, mit dem sich die ganze App ansehen lässt.
Dafür ein Konto mit erwachsenem Jahrgang anlegen und ihm Pro geben:

```sql
insert into public.abos (user_id, aktiv, bis, quelle)
select id, true, now() + interval '1 year', 'gutschein'
from auth.users where email = 'pruefung@km1-training.de'
on conflict (user_id) do update set aktiv = true, bis = excluded.bis;
```

## Prüfen

```sh
cd km1-app/supabase/tests
npm ci
npm test
```

Der Test legt eine Postgres-Datenbank im Arbeitsspeicher an, spielt die
Migration und die Startdaten ein und prüft, wer was sehen, schreiben und
löschen darf. Ein Supabase-Konto braucht er nicht. Die CI (`km1-app.yml`)
führt ihn bei jedem Pull Request aus.
