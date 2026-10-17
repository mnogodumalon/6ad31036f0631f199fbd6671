// The orchestrator's plan, as far as the running app needs it
// (docs/orchestrator/SPEC.md). Generated — do not edit; regenerated on every
// build and update from the stored plan. Without a plan every map is empty.
//
//   SYSTEM_ASSIGNED entity → fields a tool fills when a record is CREATED — the
//                   value does not exist before; dialogs hide these on create and
//                   the form-polish sets no default on them. A scheduled or
//                   update-triggered tool owns its field but is NOT in here.
//   PLAN_SENTENCES  slug → the plan in the owner's words (flows' field page)
//
// The runtime write guard (FLOW_WRITES/OWNERSHIP, planGuard.ts) left on
// 23.09.2026: a flow page composes against its generated hook, whose submit
// plan IS the Schreibliste — there is no way to spell a write outside it.

export const SYSTEM_ASSIGNED: Record<string, string[]> = {
  "vorgaenge": [
    "vorgangsnummer"
  ]
};

export const PLAN_SENTENCES: Record<string, string[]> = {
  "anfrage-aufnehmen": [
    "Legt an: quellen, vorgaenge",
    "Automatisch: eingangsdatum (heutiges Datum, automatisch), status (fester Wert „neu“), prozessschritt (fester Wert „anfrage_verstehen“), freigabestatus (fester Wert „nicht_freigegeben“)"
  ],
  "anforderung-erfassen": [
    "Legt an: anforderungen",
    "Ändert: vorgaenge",
    "Automatisch: prozessschritt (fester Wert „informationen_pruefen“), status (fester Wert „in_klaerung“)"
  ],
  "beurteilung-vorbereiten": [
    "Legt an: beurteilungen",
    "Ändert: vorgaenge",
    "Automatisch: beurteilt_am (heutiges Datum, automatisch), prozessschritt (fester Wert „beurteilungen_vorbereiten“)"
  ],
  "rueckfrage-stellen": [
    "Legt an: rueckfragen",
    "Ändert: vorgaenge",
    "Automatisch: status (fester Wert „vorbereitet“), prozessschritt (fester Wert „kommunikation_organisieren“), status (fester Wert „wartet_auf_antwort“)"
  ],
  "antwort-erfassen": [
    "Ändert: anforderungen, rueckfragen, vorgaenge",
    "Automatisch: antwort_am (heutiges Datum, automatisch), status (fester Wert „beantwortet“), status (fester Wert „in_klaerung“)"
  ],
  "entscheidung-treffen": [
    "Legt an: entscheidungen",
    "Ändert: vorgaenge",
    "Automatisch: entscheidungsdatum (heutiges Datum, automatisch), prozessschritt (fester Wert „entscheidungen_treffen“), status (fester Wert „entscheidungsreif“)"
  ]
};

export const PLAN_SUMMARY = "Die Anwendung organisiert das technische Anfrage- und Angebotsmanagement. Jede Kundenanfrage wird als Vorgang geführt: von der Aufnahme über die Erfassung von Anforderungen mit Quellen, fachliche Beurteilungen, Rückfragen an die richtigen Beteiligten und Entscheidungen mit Regeln und Befugnissen bis zum Auftragsentwurf. Erfahrungen aus dem Auftrag werden festgehalten, damit sie später geprüft und wiederverwendet werden können.";

/** slug → the lists a flow writes (the plan's Schreibliste). The nav leaves a
 *  flow out for a user who may not write one of them (lib/permissions.ts). */
export const FLOW_ENTITIES: Record<string, string[]> = {
  "anfrage-aufnehmen": [
    "quellen",
    "vorgaenge"
  ],
  "anforderung-erfassen": [
    "anforderungen",
    "vorgaenge"
  ],
  "beurteilung-vorbereiten": [
    "beurteilungen",
    "vorgaenge"
  ],
  "rueckfrage-stellen": [
    "rueckfragen",
    "vorgaenge"
  ],
  "antwort-erfassen": [
    "anforderungen",
    "rueckfragen",
    "vorgaenge"
  ],
  "entscheidung-treffen": [
    "entscheidungen",
    "vorgaenge"
  ]
};
