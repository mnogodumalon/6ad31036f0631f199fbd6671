/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - beteiligte: stelle (Rolle oder Stelle), vorname (Vorname), nachname (Nachname)
 *   - regelwerk: bezeichnung (Regelbezeichnung), beschreibung (Beschreibung der Regel), regeltyp (Regeltyp)
 *   - vorgaenge: vorgangsnummer (Vorgangsnummer), titel (Titel)
 *   - quellen: vorgang (Vorgang), bezeichnung (Bezeichnung)
 *   - erfahrungen: titel (Titel), beschreibung (Beschreibung), erfahrungsart (Erfahrungsart), erkenntnisklasse (Erkenntnisklasse)
 *   - anforderungen: vorgang (Vorgang), bezeichnung (Bezeichnung), erfassungsstatus (Erfassungsstatus)
 *   - beurteilungen: vorgang (Vorgang), sachverhalt (Sachverhalt)
 *   - rueckfragen: vorgang (Vorgang), adressat (Adressat), fragetext (Fragetext)
 *   - entscheidungen: vorgang (Vorgang), gegenstand (Entscheidungsgegenstand)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "beteiligte": "email" | "telefon" | "stelle" | "zustaendigkeitsbereich" | "entscheidungsbefugnis" | "vorname" | "nachname" | "organisation" | "aktiv";
  "regelwerk": "bezeichnung" | "beschreibung" | "geltungsbereich" | "regeltyp" | "erforderliche_befugnis" | "verbindlich" | "gueltig_ab" | "status";
  "vorgaenge": "vorgangsnummer" | "titel" | "kunde" | "eingangsdatum" | "kundenanfrage" | "zustaendige_person" | "prozessschritt" | "status" | "freigabestatus" | "auftragsentwurf" | "geklaerte_punkte" | "offene_punkte" | "uebergabefaehig";
  "quellen": "vorgang" | "bezeichnung" | "quellenart" | "fundort" | "version" | "verlaesslichkeit" | "bemerkung";
  "erfahrungen": "vorgang" | "titel" | "beschreibung" | "erfahrungsart" | "erkenntnisklasse" | "bestaetigt_von" | "wiederverwendbar" | "verbesserungsvorschlag";
  "anforderungen": "widerspruch_zu" | "vorgang" | "bezeichnung" | "beschreibung" | "kategorie" | "wert" | "quelle" | "erfassungsstatus" | "art_der_angabe" | "hinweis_luecke";
  "beurteilungen": "vorgang" | "beurteiler" | "fachgebiet" | "sachverhalt" | "bewertung" | "moegliche_erklaerung" | "unsicherheiten" | "fachlich_bestaetigt" | "beurteilt_am" | "anforderung";
  "rueckfragen": "vorgang" | "adressat" | "fragetext" | "buendelungsgruppe" | "status" | "gestellt_am" | "antwort" | "antwort_am" | "aenderung_angabe" | "anforderung";
  "entscheidungen": "vorgang" | "gegenstand" | "regel" | "entscheider" | "befugnis_geprueft" | "unsicherheiten" | "ki_vorschlag" | "entscheidung" | "begruendung" | "folgen" | "entscheidungsdatum" | "freigabestatus" | "anforderung" | "beurteilung";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  beteiligte: { stelle: "Bitte die Rolle oder Stelle wählen.", vorname: "Bitte den Vornamen eingeben.", nachname: "Bitte den Nachnamen eingeben." },
  regelwerk: { bezeichnung: "Bitte eine Regelbezeichnung eingeben.", beschreibung: "Bitte die Regel beschreiben.", regeltyp: "Bitte den Regeltyp wählen." },
  vorgaenge: { vorgangsnummer: "Bitte eine Vorgangsnummer eingeben.", titel: "Bitte einen Titel eingeben." },
  quellen: { vorgang: "Bitte einen Vorgang auswählen.", bezeichnung: "Bitte die Quelle bezeichnen." },
  erfahrungen: { titel: "Bitte einen Titel eingeben.", beschreibung: "Bitte die Erfahrung beschreiben.", erfahrungsart: "Bitte die Art der Erfahrung wählen.", erkenntnisklasse: "Bitte die Erkenntnisklasse wählen." },
  anforderungen: { vorgang: "Bitte einen Vorgang auswählen.", bezeichnung: "Bitte die Anforderung bezeichnen.", erfassungsstatus: "Bitte den Erfassungsstatus wählen." },
  beurteilungen: { vorgang: "Bitte einen Vorgang auswählen.", sachverhalt: "Bitte den Sachverhalt beschreiben." },
  rueckfragen: { vorgang: "Bitte einen Vorgang auswählen.", adressat: "Bitte einen Adressaten auswählen.", fragetext: "Bitte die Frage formulieren." },
  entscheidungen: { vorgang: "Bitte einen Vorgang auswählen.", gegenstand: "Bitte den Entscheidungsgegenstand eingeben." },
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
