# Bezahlung mit Stripe einrichten – Schritt für Schritt

Diese Anleitung schaltet die echte Bezahlung im CardCompass-Shop frei: Karte (Visa, Mastercard), PayPal, Klarna, SEPA-Lastschrift, Apple Pay und Google Pay – alles über **Stripe Checkout**, die gesicherte Bezahlseite von Stripe. Du brauchst dafür keine Programmierkenntnisse, nur etwas Sorgfalt. Plane etwa 1–2 Stunden ein.

> **Die wichtigste Regel:** Geheime Schlüssel (`sk_live_…`, `sk_test_…`, `whsec_…`, der Supabase-„service_role“-Schlüssel) gehören **nur** in die Supabase-Secrets (Schritt 7). Niemals in die Website, in `.env`-Dateien des Shops, in den Build, auf GitHub, in E-Mails oder in einen Chat – auch nicht „kurz zum Testen“.

---

## So funktioniert es (Überblick)

1. Kund:in füllt die Kasse aus und klickt **„Zahlungspflichtig bestellen“**.
2. Die Website ruft die Supabase-Funktion **`create-checkout`** auf. Sie prüft alle Angaben, lädt Preise, Bestand und Versandkosten **aus der Datenbank** (die Website schickt nie Preise mit), legt die Bestellung mit Status `pending_payment` an und erstellt bei Stripe eine Bezahlsitzung.
3. Kund:in wird zu Stripe weitergeleitet und bezahlt dort.
4. Stripe meldet das Ergebnis an die Funktion **`stripe-webhook`**. Sie setzt die Bestellung auf `paid` und zieht den Bestand ab – genau einmal, auch wenn Stripe die Meldung doppelt schickt.
5. Kund:in landet auf der Danke-Seite (`/kasse/danke`) bzw. bei Abbruch auf `/kasse/abgebrochen` – der Warenkorb bleibt dann erhalten.

| Status (`status`) | Zahlung (`payment_status`) | Bedeutung | Versenden? |
|---|---|---|---|
| `pending_payment` | `unpaid` | Bestellung angelegt, Kund:in ist gerade bei Stripe | **Nein** |
| `pending_payment` | `processing` | Bezahlt mit verzögerter Zahlart (z. B. SEPA), Geld noch nicht da | **Nein**, warten |
| `paid` | `paid` | Zahlung bestätigt, Bestand abgezogen | **Ja** |
| `payment_failed` | `failed` | Verzögerte Zahlung ist fehlgeschlagen | Nein |
| `cancelled` | `expired` | Bezahlseite nach 30 Minuten ohne Zahlung abgelaufen | Nein |

**Versende nur Bestellungen mit `payment_status = paid`.**

---

## Was du brauchst

- Zugang zum **Stripe-Konto** (oder du legst eins an, Schritt 1)
- Zugang zum **Supabase-Projekt** des Shops (Dashboard unter supabase.com)
- Einen Computer mit **Node.js** (für die Supabase-Kommandozeile). Statt `supabase …` kannst du überall auch `npx supabase …` schreiben – dann musst du nichts installieren.
- Die Dateien aus diesem Projekt:
  - `supabase/migrations/20261119000000_stripe_checkout.sql`
  - `supabase/functions/create-checkout/index.ts`
  - `supabase/functions/stripe-webhook/index.ts`

---

## Schritt 1 – Stripe-Konto anlegen

1. Auf **stripe.com** registrieren (Land: Deutschland, Währung: EUR).
2. Im Dashboard **„Konto aktivieren“**: Unternehmensdaten angeben (Einzelunternehmen, Kleinunternehmer), Identität bestätigen, Bankkonto für Auszahlungen hinterlegen.
3. **Einstellungen → Unternehmen → Öffentliche Details**: Name „CardCompass“, Kunden-Support-E-Mail, Website `https://cardcompass.de`. Die **Abrechnungsbezeichnung** (erscheint auf dem Kontoauszug) z. B. `CARDCOMPASS`.
4. **Einstellungen → Branding**: Logo hochladen, Markenfarbe `#8b00ff` – so sieht die Bezahlseite wie der Shop aus.

## Schritt 2 – Zahlarten aktivieren

**Einstellungen → Zahlungen → Zahlungsmethoden** (im Testmodus und später im Live-Modus jeweils prüfen):

- **Karten** – ist standardmäßig an.
- **Apple Pay** und **Google Pay** – unter „Wallets“ einschalten. Bei Stripe Checkout ist keine Domain-Verifizierung nötig. Sie erscheinen nur auf passenden Geräten (Apple Pay z. B. in Safari auf iPhone/Mac).
- **PayPal** – einschalten und dem Dialog folgen (PayPal-Geschäftskonto verbinden).
- **Klarna** – einschalten.
- **SEPA-Lastschrift** – einschalten. Hinweis: Das Geld ist erst nach einigen Werktagen sicher; die Bestellung steht bis dahin auf `processing`.

Der Shop legt die Zahlarten **nicht** fest – Stripe zeigt automatisch alle Methoden an, die hier aktiv sind und zu Betrag, Land und Gerät passen. Neue Zahlarten kannst du also später einfach hier dazuschalten.

Außerdem empfohlen: **Einstellungen → Kunden-E-Mails → „Erfolgreiche Zahlungen“** einschalten. Dann bekommt jede:r Kund:in automatisch einen Zahlungsbeleg von Stripe (siehe auch Rechtliches unten).

## Schritt 3 – Test-Schlüssel holen

1. Oben rechts im Stripe-Dashboard den **Testmodus** einschalten.
2. **Entwickler → API-Schlüssel**: den **geheimen Schlüssel** (`sk_test_…`) „Anzeigen“ und kopieren. Bewahre ihn nur kurz in der Zwischenablage auf – er kommt gleich in Schritt 7 in die Supabase-Secrets.

Den „veröffentlichbaren Schlüssel“ (`pk_…`) brauchst du **nicht** – die Website spricht nie direkt mit Stripe.

## Schritt 4 – Datenbank prüfen (wichtig!)

Die Spalten der bestehenden Tabellen `cc_orders` und `cc_order_items` konnten beim Bau nicht eingesehen werden – nur, was die alte Website abgefragt hat. Prüfe deshalb einmal, ob alles zusammenpasst. Öffne im Supabase-Dashboard den **SQL Editor** und führe aus:

```sql
-- Alle Spalten, Pflichtfelder und Standardwerte
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('cc_orders', 'cc_order_items', 'cc_inventory')
order by table_name, ordinal_position;

-- Einschränkungen (z. B. erlaubte Status-Werte, Fremdschlüssel)
select conrelid::regclass as tabelle, conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid in ('public.cc_orders'::regclass, 'public.cc_order_items'::regclass, 'public.cc_inventory'::regclass);

-- Trigger (z. B. eine automatische Bestellnummer)
select event_object_table, trigger_name, action_statement
from information_schema.triggers
where event_object_table in ('cc_orders', 'cc_order_items');
```

Die Funktion `create-checkout` schreibt **nur** diese Spalten (alles in der Funktion `insertOrder` in `supabase/functions/create-checkout/index.ts`, deutlich markiert):

| Tabelle | Bestehende Spalten | Neue Spalten (aus der Migration) |
|---|---|---|
| `cc_orders` | `status`, `total_cents`, `placed_at`, `customer_id`, `order_number`* | `payment_status`, `customer_email`, `shipping_address`, `billing_address`, `customer_note`, `shipping_cents`, `subtotal_cents`, `stripe_session_id` |
| `cc_order_items` | `order_id`, `product_name`, `variant_title`, `quantity` | `variant_id`, `unit_price_cents` |

\* `order_number` wird nur gesetzt, wenn die Datenbank sie nicht selbst vergibt.

Prüfe in der Ausgabe:

1. **Gibt es weitere Pflichtfelder** (`is_nullable = NO`) **ohne Standardwert** (`column_default` leer), die oben nicht stehen – z. B. `currency`, `email`, `subtotal_cents` unter anderem Namen? Dann muss `insertOrder` um diese Spalten ergänzt werden, sonst schlägt das Anlegen der Bestellung fehl.
2. **Status-Werte:** Gibt es bei `status` eine Einschränkung (Check-Constraint oder ein Enum-Typ, `data_type = USER-DEFINED`)? Die neuen Werte `pending_payment`, `paid`, `payment_failed`, `cancelled` müssen erlaubt sein. Falls nicht: entweder die Werte in der Datenbank ergänzen oder die Konstanten oben in **beiden** Funktionen (`ORDER_STATUS_…`) und in der SQL-Funktion `cc_apply_paid_order` anpassen. Enum-Werte siehst du mit `select enum_range(null::<typname>);`.
3. **`customer_id`:** Die Funktion setzt hier die ID des angemeldeten Kunden (gleich `cc_customer_profiles.id` = Supabase-Benutzer-ID), bei Gästen `NULL`. Muss `customer_id` gefüllt sein (NOT NULL), sind Gastbestellungen so nicht möglich – dann bitte melden.
4. **`cc_inventory`:** Die Verknüpfung zur Variante (normalerweise `variant_id`) wird automatisch über den Fremdschlüssel erkannt. Es sollte pro Variante genau **eine** Zeile geben.
5. **Sicherheit (RLS):** Kund:innen dürfen ihre Bestellungen höchstens **lesen**, aber nicht ändern. Unter **Authentication → Policies → cc_orders** darf es keine UPDATE-Regel für normale Nutzer geben, sonst könnte jemand seine Bestellung selbst auf „bezahlt“ setzen.
6. **Admin-Bereich / Kundenkonto:** Dort sollten die neuen Status sinnvoll angezeigt werden. Bestellungen mit `pending_payment` sind **noch nicht bezahlt**.

## Schritt 5 – Datenbank-Erweiterung (Migration) ausführen

1. Supabase-Dashboard → **SQL Editor → New query**.
2. Den kompletten Inhalt von `supabase/migrations/20261119000000_stripe_checkout.sql` hineinkopieren und **Run** klicken.
3. Es sollte „Success“ erscheinen. Die Datei ist so geschrieben, dass sie **nichts löscht** und **mehrfach** ausgeführt werden darf.

Kurzer Check danach:

```sql
select column_name from information_schema.columns
where table_name = 'cc_orders' and column_name in ('stripe_session_id', 'payment_status', 'paid_at');
-- erwartet: 3 Zeilen
select has_function_privilege('anon', 'public.cc_apply_paid_order(uuid,text)', 'execute');
-- erwartet: false (nur der Server darf Bestellungen als bezahlt markieren)
```

## Schritt 6 – Die zwei Funktionen hochladen

Im Terminal, im Projektordner `cardcompass`:

```bash
supabase login
supabase link --project-ref <ref>
supabase functions deploy create-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

- `<ref>` ist die Projekt-ID aus der Dashboard-Adresse: `https://supabase.com/dashboard/project/<ref>` (auch unter **Project Settings → General**).
- **Warum `--no-verify-jwt`?**
  - `stripe-webhook`: Stripe kann keinen Supabase-Login mitschicken. Jede Anfrage wird stattdessen über die Stripe-Signatur geprüft.
  - `create-checkout`: Die Website nutzt den neuen „publishable“-Schlüssel (`sb_publishable_…`). Der ist kein JWT, daher würde Supabase Gastbestellungen sonst mit „Invalid JWT“ (401) ablehnen. Die Funktion prüft alles selbst (erlaubte Herkunft, alle Eingaben, Bestand, Preise) – der Schalter schwächt die Sicherheit nicht. Nutzt die Website noch den alten `anon`-Schlüssel (beginnt mit `eyJ…`), geht auch `supabase functions deploy create-checkout` ohne den Schalter.

## Schritt 7 – Geheimnisse (Secrets) setzen

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_… SITE_URL=https://cardcompass.de
```

- `SITE_URL` ist die Adresse des Shops **ohne** Schrägstrich am Ende. Mehrere Adressen mit Komma trennen, z. B. `SITE_URL=https://cardcompass.de,https://www.cardcompass.de`. Nur von diesen Adressen aus darf die Kasse benutzt werden, und nur dorthin leitet Stripe zurück.
- `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` stellt Supabase automatisch bereit – nicht selbst setzen.
- Kontrolle: `supabase secrets list` zeigt die Namen (nicht die Werte).

Diese Schlüssel kommen **nie** in die Website, den Build oder einen Chat.

## Schritt 8 – Webhook in Stripe anlegen

1. Stripe-Dashboard (Testmodus) → **Entwickler → Webhooks** (im neuen Dashboard: **Workbench → Webhooks**) → **Endpunkt hinzufügen** / **Ziel hinzufügen**.
2. **Endpunkt-URL:** `https://<ref>.supabase.co/functions/v1/stripe-webhook`
3. **Ereignisse auswählen** – genau diese vier:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
4. Speichern, dann beim Endpunkt das **Signaturgeheimnis** (`whsec_…`) anzeigen und setzen:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_…
```

Test- und Live-Modus haben **getrennte** Webhooks mit **unterschiedlichen** Signaturgeheimnissen.

## Schritt 9 – Bezahlung im Shop einschalten

In der Build-Konfiguration der Website (dort, wo auch `VITE_SUPABASE_URL` steht – z. B. die Umgebungsvariablen beim Hoster oder `.env.production`) ergänzen:

```
VITE_STRIPE_ENABLED=1
```

Dann die Website neu bauen und veröffentlichen. Das ist der **einzige** Stripe-Eintrag in der Website – er enthält kein Geheimnis. Solange er fehlt, zeigt die Kasse „Die Bezahlung wird gerade eingerichtet …“ und löst keine Bestellung aus.

## Schritt 10 – Testen (Testmodus)

1. Im Shop etwas in den Warenkorb legen, zur Kasse, Daten ausfüllen, AGB bestätigen, **„Zahlungspflichtig bestellen“**.
2. Auf der Stripe-Seite mit der Testkarte bezahlen: **4242 4242 4242 4242**, beliebiges Datum in der Zukunft, beliebige Prüfziffer (CVC), beliebige PLZ.
3. Prüfen:
   - Danke-Seite mit Bestellnummer erscheint, Warenkorb ist leer.
   - In `cc_orders`: `status = paid`, `payment_status = paid`, `paid_at` gesetzt.
   - In `cc_inventory`: Bestand um die bestellte Menge kleiner.
   - Stripe → Webhooks → dein Endpunkt: alle Zustellungen mit **200**.
4. Weitere Tests:
   - Auf der Stripe-Seite **zurück** klicken → `/kasse/abgebrochen`, Warenkorb ist noch da.
   - Karte **4000 0025 0000 3155** → 3-D-Secure-Bestätigung.
   - Karte **4000 0000 0000 9995** → wird abgelehnt (Stripe zeigt den Fehler, keine Bestellung bezahlt).
   - SEPA mit Test-IBAN **DE89 3704 0044 0532 0130 00** → erst `processing`, nach kurzer Zeit `paid`.
   - Einen Artikel mit Bestand 1 zweimal in den Warenkorb → Kasse meldet „Nicht mehr genug auf Lager“.
   - Eine Bezahlseite offen lassen: nach ca. 30 Minuten wird die Bestellung `cancelled`.
5. Fehlersuche: Supabase → **Edge Functions → (Funktion) → Logs**.

## Schritt 11 – Live gehen

1. Stripe-Konto ist vollständig aktiviert (Schritt 1).
2. Im Stripe-Dashboard den **Testmodus ausschalten**, Zahlarten (Schritt 2) im Live-Modus kontrollieren.
3. **Live-Schlüssel** `sk_live_…` holen (Schritt 3, ohne Testmodus).
4. **Neuen Webhook im Live-Modus** anlegen – gleiche URL, gleiche vier Ereignisse (Schritt 8) – und dessen neues `whsec_…` verwenden.
5. Beide Secrets ersetzen:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_… STRIPE_WEBHOOK_SECRET=whsec_…
```

6. Eine echte Kleinstbestellung durchspielen und im Stripe-Dashboard **erstatten**.

---

## Gut zu wissen

- **Preise:** Kommen immer aus `cc_product_variants`, Versand aus `cc_shipping_rates` (Deutschland, „kostenlos ab“ wird berücksichtigt). Mindestbestellwert bei Stripe: 0,50 €.
- **Bestand:** Wird beim Start der Bezahlung geprüft und **nach** erfolgreicher Zahlung abgezogen. Kaufen zwei Personen gleichzeitig das letzte Stück, können beide bezahlen. Das steht dann als `STOCK SHORTFALL` im Log von `stripe-webhook` – eine der Zahlungen im Stripe-Dashboard erstatten.
- **Abgebrochene Bezahlungen:** Die Bestellung bleibt bis zu 30 Minuten `pending_payment` und wird dann automatisch `cancelled` (Ereignis `checkout.session.expired`).
- **Vorschau-Version (GitHub Pages):** läuft immer im Demo-Modus – dort wird nie etwas bestellt oder bezahlt.

## Häufige Probleme

| Meldung / Symptom | Ursache und Lösung |
|---|---|
| Kasse: „Die Bezahlung konnte gerade nicht gestartet werden …“ | Logs von `create-checkout` ansehen. Meist fehlt ein Secret (Schritt 7) oder eine Datenbank-Spalte passt nicht (Schritt 4). |
| Log: `origin_not_allowed` / Browser meldet CORS-Fehler | `SITE_URL` stimmt nicht exakt mit der Shop-Adresse überein (https, mit/ohne `www`). |
| Log: `Invalid JWT` (401) | `create-checkout` mit `--no-verify-jwt` neu hochladen (Schritt 6). |
| Log: `order insert: …` | Spalte fehlt, Pflichtfeld nicht befüllt oder Status-Wert nicht erlaubt → Schritt 4. |
| Bestellungen bleiben `pending_payment`, obwohl bezahlt | Webhook kommt nicht an oder Signatur falsch: Stripe → Webhooks → Zustellungen ansehen; `STRIPE_WEBHOOK_SECRET` passt zum Modus (Test/Live)? |
| Webhook-Zustellungen mit Fehler 400 | Falsches `whsec_…` (z. B. Test-Geheimnis im Live-Modus). |

---

## Rechtliches – kurze Checkliste

Keine Rechtsberatung – bitte die Texte von einem Rechtstexte-Anbieter oder Anwalt prüfen lassen.

- [ ] **AGB:** Zahlungsarten aufführen (Kreditkarte, PayPal, Klarna, SEPA-Lastschrift, Apple Pay, Google Pay; Abwicklung über Stripe), Zeitpunkt des Vertragsschlusses passend zum Ablauf (Klick auf „Zahlungspflichtig bestellen“), Liefergebiet Deutschland, Versandkosten.
- [ ] **Datenschutzerklärung:** Stripe (Stripe Payments Europe Ltd., Dublin) als Zahlungsdienstleister aufnehmen – welche Daten, Zweck Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), mögliche Übermittlung in die USA. Bei PayPal und Klarna auf deren eigene Datenschutzhinweise verweisen. Supabase als Hosting-/Datenbankdienst.
- [ ] **Auftragsverarbeitung:** Stripe-Datenverarbeitungsvertrag ist Teil der Stripe-Bedingungen; für Supabase den DPA im Dashboard abschließen.
- [ ] **Bestellbestätigung per E-Mail:** Gesetzlich nötig sind eine unverzügliche Eingangsbestätigung und eine Vertragsbestätigung mit AGB und Widerrufsbelehrung auf einem dauerhaften Datenträger (spätestens bei Lieferung). **Diese E-Mail ist noch nicht eingebaut.** Mindestens die Stripe-Belege einschalten (Schritt 2) – sie ersetzen die Vertragsbestätigung aber nicht. Eine eigene Bestell-E-Mail (z. B. über einen E-Mail-Dienst, ausgelöst vom Webhook) sollte vor dem Livegang ergänzt oder vorerst manuell verschickt werden.
- [ ] **Button-Lösung:** Der Bestellbutton heißt „Zahlungspflichtig bestellen“, direkt darüber stehen Artikel, Gesamtpreis inkl. Versand und Lieferadresse. Diese Texte bitte nicht ändern.
- [ ] **Kleinunternehmer:** Es wird keine Umsatzsteuer berechnet oder ausgewiesen; der Hinweis nach § 19 UStG steht in Warenkorb, Kasse und Fußzeile.
