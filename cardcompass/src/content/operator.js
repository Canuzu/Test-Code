// Betreiberangaben (Anbieterkennzeichnung) für Impressum, Kontakt,
// Widerrufsbelehrung, Datenschutz („Verantwortlicher“), AGB und die Seite
// „Vertrag widerrufen“.
//
// !!! VOR DEM LIVEGANG AUSFÜLLEN !!!
// Das Repository ist öffentlich. Persönliche Daten (Name, Wohnanschrift,
// E-Mail, Telefon) deshalb NICHT hier eintragen, sondern beim Build als
// Umgebungsvariablen setzen (z. B. in einer nicht eingecheckten .env.production
// oder in den Secrets der Build-Pipeline):
//
//   VITE_OPERATOR_NAME     – vollständiger Name des Betreibers
//   VITE_OPERATOR_STREET   – Straße & Hausnummer (ladungsfähige Anschrift)
//   VITE_OPERATOR_CITY     – PLZ und Ort
//   VITE_OPERATOR_EMAIL    – E-Mail-Adresse für Kunden
//   VITE_OPERATOR_PHONE    – Telefonnummer, z. B. „+49 …“
//   VITE_OPERATOR_VAT_ID   – USt-IdNr. (nur falls vorhanden)
//
// Alternativ können die Werte direkt unten eingetragen werden. Solange ein
// Wert noch die Form [[…]] hat, zeigt die Website ihn absichtlich als gelb
// gestrichelten Platzhalter an, damit er nicht vergessen wird.
import { createElement } from 'react';

const env = import.meta.env || {};

export const OPERATOR = {
  name: env.VITE_OPERATOR_NAME || '[[Name des Betreibers]]',
  street: env.VITE_OPERATOR_STREET || '[[Straße & Hausnummer]]',
  city: env.VITE_OPERATOR_CITY || '[[PLZ Ort]]',
  email: env.VITE_OPERATOR_EMAIL || '[[E-Mail-Adresse]]',
  phone: env.VITE_OPERATOR_PHONE || '[[Telefonnummer]]',
  country: 'Deutschland',
  business: 'CardCompass',
  // Kleinunternehmer nach § 19 UStG (keine Umsatzsteuer, keine USt-IdNr.).
  smallBusiness: true,
  vatId: env.VITE_OPERATOR_VAT_ID || null,
};

// true, solange ein Wert noch ein [[Platzhalter]] ist.
export const isPlaceholder = (v) => typeof v === 'string' && /^\[\[[^\]]*\]\]$/.test(v.trim());

// Alle noch offenen Pflichtangaben (z. B. für einen Hinweis in der Vorschau).
export const missingOperatorFields = () => ['name', 'street', 'city', 'email', 'phone'].filter((k) => isPlaceholder(OPERATOR[k]));

export const mailHref = (email = OPERATOR.email) => (isPlaceholder(email) ? null : `mailto:${email}`);
export const telHref = (phone = OPERATOR.phone) => (isPlaceholder(phone) ? null : `tel:${phone.replace(/[^\d+]/g, '')}`);

const PH_TITLE = 'Platzhalter – vor dem Livegang in src/content/operator.js ausfüllen';

// Sichtbar markierter Platzhalter (gelb gestrichelt, Styles in pages.css).
export function Placeholder({ children }) {
  const label = String(children).replace(/^\[\[|\]\]$/g, '');
  return createElement('mark', { className: 'op-ph', title: PH_TITLE }, label);
}

// Einen Betreiber-Wert ausgeben: als Platzhalter, Link (mail/tel) oder Text.
export function OpValue({ value, link, className }) {
  if (isPlaceholder(value)) return createElement(Placeholder, null, value);
  const href = link === 'mail' ? mailHref(value) : link === 'tel' ? telHref(value) : null;
  return href ? createElement('a', { href, className }, value) : createElement('span', { className }, value);
}
