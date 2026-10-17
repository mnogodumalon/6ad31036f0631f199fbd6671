/**
 * Occupancy semantics — DECIDED BY THE BUILD AGENT, never by a heuristic.
 *
 * The Phase-2 orchestrator writes its decision to `.intents-staging/occupancy.json`
 * (stay pair, booked resource, statuses that do not occupy); the integration
 * step validates it against the app metadata and renders it into the block
 * below. Scaffold updates keep the block. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - beteiligte: lookups stelle[vertrieb|konstruktion|arbeitsvorbereitung|qualitaetssicherung|kunde|sonstige], entscheidungsbefugnis[keine|fachliche_beurteilung|technische_freigabe|kaufmaennische_freigabe|gesamtfreigabe]
 *   - regelwerk: lookups regeltyp[geschaeftsregel|pruefregel|freigaberegel], erforderliche_befugnis[fachliche_beurteilung|technische_freigabe|kaufmaennische_freigabe|gesamtfreigabe], status[entwurf|gueltig|ausser_kraft]
 *   - vorgaenge: applookups zustaendige_person→beteiligte · lookups prozessschritt[auftragsentwurf_pruefen|abgeschlossen|anfrage_verstehen|informationen_pruefen|beurteilungen_vorbereiten|beteiligte_einbeziehen|kommunikation_organisieren|entscheidungen_treffen], status[neu|in_klaerung|wartet_auf_antwort|entscheidungsreif|abgeschlossen], freigabestatus[nicht_freigegeben|teilweise_freigegeben|freigegeben|abgelehnt]
 *   - quellen: applookups vorgang→vorgaenge · lookups quellenart[kundendokument|email|zeichnung|stueckliste|erp_system|cad_system|informelles_hilfsmittel|sonstiges], verlaesslichkeit[hoch|mittel|gering|unbekannt]
 *   - erfahrungen: applookups vorgang→vorgaenge, bestaetigt_von→beteiligte · lookups erfahrungsart[informelles_hilfsmittel|bewaehrte_routine|informationsluecke|widerspruch|typische_rueckfrage|fehler|nacharbeit|verzoegerung|umgang_erfahrungen|arbeitsablauf], erkenntnisklasse[beobachtete_tatsache|ungepruefte_annahme|fachlich_bestaetigt|verbindliche_regel|situationsabhaengige_entscheidung]
 *   - anforderungen: applookups widerspruch_zu→anforderungen, vorgang→vorgaenge, quelle→quellen · lookups kategorie[werkstoff|geometrie_masse|toleranzen|oberflaeche|menge_termin|qualitaet_pruefung|kaufmaennisches|sonstiges], erfassungsstatus[vollstaendig|fehlt|widerspruechlich|ungeprueft], art_der_angabe[beobachtete_tatsache|ungepruefte_annahme|fachlich_bestaetigt]
 *   - beurteilungen: applookups vorgang→vorgaenge, beurteiler→beteiligte, anforderung→anforderungen · lookups fachgebiet[qualitaetssicherung|sonstiges|vertrieb|konstruktion|arbeitsvorbereitung]
 *   - rueckfragen: applookups vorgang→vorgaenge, adressat→beteiligte, anforderung→anforderungen · lookups status[vorbereitet|gestellt|beantwortet|erledigt]
 *   - entscheidungen: applookups vorgang→vorgaenge, regel→regelwerk, entscheider→beteiligte, anforderung→anforderungen, beurteilung→beurteilungen · lookups freigabestatus[offen|freigegeben|abgelehnt|unter_vorbehalt]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};

/**
 * A record of the KEY entity is TAKEN while a record of `entity` points at it
 * through `field` — a slot with a booking, a seat with a ticket. Generated
 * from the plan's blocking `unique` check on that reference (05.10.2026:
 * the salon's public page offered booked slots again). Pickers on both
 * doors leave taken records out (useRecordSearch); a public page reads only
 * `field` of `entity` — never who booked. Generator-owned: no markers.
 */
export interface TakenRule {
  entity: EntityKey;
  field: string;
}

export const TAKEN_BY: Partial<Record<EntityKey, TakenRule>> = {
};
