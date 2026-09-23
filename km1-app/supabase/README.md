# Der Server der KM1-App (Supabase)

Hier liegt alles, was die Datenbank braucht: Tabellen, Regeln, Startdaten und
ein Test, der die Regeln prüft. Die App läuft auch ohne Server, im
Vorschau-Modus; mit Server gehören Konten, Fortschritt und Merkliste der
Datenbank.

| Datei | Inhalt |
| --- | --- |
| `migrations/20260923120000_grundlage.sql` | Tabellen, Regeln (RLS), Funktionen, Speicher |
| `seed.sql` | Die 26 Videos mit ihren 79 Schritten aus dem Prototyp |
| `werkzeug/startdaten.mjs` | Erzeugt `seed.sql` und den Katalog der App aus `app/index.html` |
| `tests/regeln.test.mjs` | Prüft die Regeln in einer echten Postgres-Datenbank (PGlite) |

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
- **Konto löschen** über `konto_loeschen()` nimmt Profil, Fortschritt,
  Merkliste und Abo mit. Apple verlangt, dass das in der App geht.
- **Videos im Speicher.** `videos-offen` ist öffentlich, `videos-geschuetzt`
  gibt Dateien nur über einen signierten Link heraus, der eine Stunde gilt —
  und nur an die, die das Video sehen dürfen.

## Einrichten, einmal

1. **Projekt anlegen** auf supabase.com. Als Region **Frankfurt
   (eu-central-1)** wählen. Die Datenschutzseite der App sagt „auf Servern in
   Frankfurt"; bei einer anderen Region muss der Satz in
   `mobile/src/app/datenschutz.tsx` angepasst werden.
2. **Datenbank einspielen.** Im Dashboard unter *SQL Editor* den ganzen Inhalt
   von `migrations/20260923120000_grundlage.sql` einfügen und ausführen.
   Danach genauso `seed.sql`.
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
5. **Kader zum Trainer machen**, nachdem er sich einmal angemeldet hat, im SQL
   Editor:
   ```sql
   update public.profiles set rolle = 'trainer'
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
