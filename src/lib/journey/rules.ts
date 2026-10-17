/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'beteiligte' | 'regelwerk' | 'vorgaenge' | 'quellen' | 'erfahrungen' | 'anforderungen' | 'beurteilungen' | 'rueckfragen' | 'entscheidungen';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "beteiligte": "email" | "telefon" | "zustaendigkeitsbereich" | "vorname" | "nachname" | "organisation";
  "regelwerk": "bezeichnung" | "beschreibung" | "geltungsbereich";
  "vorgaenge": "vorgangsnummer" | "titel" | "kunde" | "kundenanfrage" | "auftragsentwurf" | "geklaerte_punkte" | "offene_punkte";
  "quellen": "bezeichnung" | "fundort" | "version" | "bemerkung";
  "erfahrungen": "titel" | "beschreibung" | "verbesserungsvorschlag";
  "anforderungen": "bezeichnung" | "beschreibung" | "wert" | "hinweis_luecke";
  "beurteilungen": "sachverhalt" | "bewertung" | "moegliche_erklaerung" | "unsicherheiten";
  "rueckfragen": "fragetext" | "buendelungsgruppe" | "antwort" | "aenderung_angabe";
  "entscheidungen": "gegenstand" | "unsicherheiten" | "ki_vorschlag" | "entscheidung" | "begruendung" | "folgen";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "beteiligte": never;
  "regelwerk": never;
  "vorgaenge": "zustaendige_person";
  "quellen": "vorgang";
  "erfahrungen": "vorgang" | "bestaetigt_von";
  "anforderungen": "widerspruch_zu" | "vorgang" | "quelle";
  "beurteilungen": "vorgang" | "beurteiler" | "anforderung";
  "rueckfragen": "vorgang" | "adressat" | "anforderung";
  "entscheidungen": "vorgang" | "regel" | "entscheider" | "anforderung" | "beurteilung";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "beteiligte": {
    "key": "beteiligte",
    "appId": "6ad30ffea403206740fda712",
    "label": "Beteiligte",
    "pascal": "Beteiligte",
    "single": "BeteiligteEntry"
  },
  "regelwerk": {
    "key": "regelwerk",
    "appId": "6ad31006549fb17687e67ba1",
    "label": "Regelwerk",
    "pascal": "Regelwerk",
    "single": "RegelwerkEntry"
  },
  "vorgaenge": {
    "key": "vorgaenge",
    "appId": "6ad310075e4813c154ebf710",
    "label": "Vorgänge",
    "pascal": "Vorgaenge",
    "single": "VorgaengeEntry"
  },
  "quellen": {
    "key": "quellen",
    "appId": "6ad31009bd8c8a29f033b8b9",
    "label": "Quellen",
    "pascal": "Quellen",
    "single": "QuellenEntry"
  },
  "erfahrungen": {
    "key": "erfahrungen",
    "appId": "6ad31009aff270e635c488b4",
    "label": "Erfahrungen",
    "pascal": "Erfahrungen",
    "single": "ErfahrungenEntry"
  },
  "anforderungen": {
    "key": "anforderungen",
    "appId": "6ad3100a83f2147ed4c1684f",
    "label": "Anforderungen",
    "pascal": "Anforderungen",
    "single": "AnforderungenEntry"
  },
  "beurteilungen": {
    "key": "beurteilungen",
    "appId": "6ad3100b0890f09b6e8898a5",
    "label": "Beurteilungen",
    "pascal": "Beurteilungen",
    "single": "BeurteilungenEntry"
  },
  "rueckfragen": {
    "key": "rueckfragen",
    "appId": "6ad3100b7be34c09a33018d0",
    "label": "Rückfragen",
    "pascal": "Rueckfragen",
    "single": "RueckfragenEntry"
  },
  "entscheidungen": {
    "key": "entscheidungen",
    "appId": "6ad3100c699b53c072ddc808",
    "label": "Entscheidungen",
    "pascal": "Entscheidungen",
    "single": "EntscheidungenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "beteiligte": {
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "stelle": {
      "key": "stelle",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Rolle oder Stelle",
      "writable": true,
      "options": [
        "vertrieb",
        "konstruktion",
        "arbeitsvorbereitung",
        "qualitaetssicherung",
        "kunde",
        "sonstige"
      ]
    },
    "zustaendigkeitsbereich": {
      "key": "zustaendigkeitsbereich",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Zuständigkeitsbereich",
      "writable": true
    },
    "entscheidungsbefugnis": {
      "key": "entscheidungsbefugnis",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Entscheidungsbefugnis",
      "writable": true,
      "options": [
        "keine",
        "fachliche_beurteilung",
        "technische_freigabe",
        "kaufmaennische_freigabe",
        "gesamtfreigabe"
      ]
    },
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "organisation": {
      "key": "organisation",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Organisation",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "organization"
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "regelwerk": {
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Regelbezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beschreibung der Regel",
      "writable": true
    },
    "geltungsbereich": {
      "key": "geltungsbereich",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Geltungsbereich",
      "writable": true,
      "maxLength": 4000
    },
    "regeltyp": {
      "key": "regeltyp",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Regeltyp",
      "writable": true,
      "options": [
        "geschaeftsregel",
        "pruefregel",
        "freigaberegel"
      ]
    },
    "erforderliche_befugnis": {
      "key": "erforderliche_befugnis",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Erforderliche Entscheidungsbefugnis",
      "writable": true,
      "options": [
        "fachliche_beurteilung",
        "technische_freigabe",
        "kaufmaennische_freigabe",
        "gesamtfreigabe"
      ]
    },
    "verbindlich": {
      "key": "verbindlich",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Verbindlich",
      "writable": true
    },
    "gueltig_ab": {
      "key": "gueltig_ab",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gültig ab",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Status",
      "writable": true,
      "options": [
        "entwurf",
        "gueltig",
        "ausser_kraft"
      ]
    }
  },
  "vorgaenge": {
    "vorgangsnummer": {
      "key": "vorgangsnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorgangsnummer",
      "writable": true,
      "maxLength": 4000
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "kunde": {
      "key": "kunde",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Kunde",
      "writable": true,
      "maxLength": 4000
    },
    "eingangsdatum": {
      "key": "eingangsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Eingangsdatum",
      "writable": true
    },
    "kundenanfrage": {
      "key": "kundenanfrage",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Kundenanfrage im Wortlaut",
      "writable": true
    },
    "zustaendige_person": {
      "key": "zustaendige_person",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zuständige Person",
      "writable": true,
      "targetAppId": "6ad30ffea403206740fda712",
      "targetEntity": "beteiligte"
    },
    "prozessschritt": {
      "key": "prozessschritt",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Aktueller Prozessschritt",
      "writable": true,
      "options": [
        "auftragsentwurf_pruefen",
        "abgeschlossen",
        "anfrage_verstehen",
        "informationen_pruefen",
        "beurteilungen_vorbereiten",
        "beteiligte_einbeziehen",
        "kommunikation_organisieren",
        "entscheidungen_treffen"
      ]
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Status",
      "writable": true,
      "options": [
        "neu",
        "in_klaerung",
        "wartet_auf_antwort",
        "entscheidungsreif",
        "abgeschlossen"
      ]
    },
    "freigabestatus": {
      "key": "freigabestatus",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Freigabestatus",
      "writable": true,
      "options": [
        "nicht_freigegeben",
        "teilweise_freigegeben",
        "freigegeben",
        "abgelehnt"
      ]
    },
    "auftragsentwurf": {
      "key": "auftragsentwurf",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Auftragsentwurf",
      "writable": true
    },
    "geklaerte_punkte": {
      "key": "geklaerte_punkte",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Geklärte Punkte",
      "writable": true
    },
    "offene_punkte": {
      "key": "offene_punkte",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Offene Punkte",
      "writable": true
    },
    "uebergabefaehig": {
      "key": "uebergabefaehig",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Bereit zur Übergabe an den nächsten Arbeitsschritt",
      "writable": true
    }
  },
  "quellen": {
    "vorgang": {
      "key": "vorgang",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorgang",
      "writable": true,
      "targetAppId": "6ad310075e4813c154ebf710",
      "targetEntity": "vorgaenge"
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "quellenart": {
      "key": "quellenart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Quellenart",
      "writable": true,
      "options": [
        "kundendokument",
        "email",
        "zeichnung",
        "stueckliste",
        "erp_system",
        "cad_system",
        "informelles_hilfsmittel",
        "sonstiges"
      ]
    },
    "fundort": {
      "key": "fundort",
      "fulltype": "string/url",
      "kind": "url",
      "required": false,
      "label": "Fundort oder Link",
      "writable": true,
      "autoComplete": "url"
    },
    "version": {
      "key": "version",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Version",
      "writable": true,
      "maxLength": 4000
    },
    "verlaesslichkeit": {
      "key": "verlaesslichkeit",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Verlässlichkeit",
      "writable": true,
      "options": [
        "hoch",
        "mittel",
        "gering",
        "unbekannt"
      ]
    },
    "datei": {
      "key": "datei",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Datei",
      "writable": false
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  },
  "erfahrungen": {
    "vorgang": {
      "key": "vorgang",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Vorgang",
      "writable": true,
      "targetAppId": "6ad310075e4813c154ebf710",
      "targetEntity": "vorgaenge"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Beschreibung",
      "writable": true
    },
    "erfahrungsart": {
      "key": "erfahrungsart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Erfahrungsart",
      "writable": true,
      "options": [
        "informelles_hilfsmittel",
        "bewaehrte_routine",
        "informationsluecke",
        "widerspruch",
        "typische_rueckfrage",
        "fehler",
        "nacharbeit",
        "verzoegerung",
        "umgang_erfahrungen",
        "arbeitsablauf"
      ]
    },
    "erkenntnisklasse": {
      "key": "erkenntnisklasse",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Erkenntnisklasse",
      "writable": true,
      "options": [
        "beobachtete_tatsache",
        "ungepruefte_annahme",
        "fachlich_bestaetigt",
        "verbindliche_regel",
        "situationsabhaengige_entscheidung"
      ]
    },
    "bestaetigt_von": {
      "key": "bestaetigt_von",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Bestätigt durch",
      "writable": true,
      "targetAppId": "6ad30ffea403206740fda712",
      "targetEntity": "beteiligte"
    },
    "wiederverwendbar": {
      "key": "wiederverwendbar",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Für spätere Aufträge wiederverwendbar",
      "writable": true
    },
    "verbesserungsvorschlag": {
      "key": "verbesserungsvorschlag",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Verbesserungsvorschlag",
      "writable": true
    }
  },
  "anforderungen": {
    "widerspruch_zu": {
      "key": "widerspruch_zu",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Widerspruch zu Anforderung",
      "writable": true,
      "targetAppId": "6ad3100a83f2147ed4c1684f",
      "targetEntity": "anforderungen"
    },
    "vorgang": {
      "key": "vorgang",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorgang",
      "writable": true,
      "targetAppId": "6ad310075e4813c154ebf710",
      "targetEntity": "vorgaenge"
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "kategorie": {
      "key": "kategorie",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Kategorie",
      "writable": true,
      "options": [
        "werkstoff",
        "geometrie_masse",
        "toleranzen",
        "oberflaeche",
        "menge_termin",
        "qualitaet_pruefung",
        "kaufmaennisches",
        "sonstiges"
      ]
    },
    "wert": {
      "key": "wert",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Wert oder Angabe",
      "writable": true,
      "maxLength": 4000
    },
    "quelle": {
      "key": "quelle",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Quelle",
      "writable": true,
      "targetAppId": "6ad31009bd8c8a29f033b8b9",
      "targetEntity": "quellen"
    },
    "erfassungsstatus": {
      "key": "erfassungsstatus",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Erfassungsstatus",
      "writable": true,
      "options": [
        "vollstaendig",
        "fehlt",
        "widerspruechlich",
        "ungeprueft"
      ]
    },
    "art_der_angabe": {
      "key": "art_der_angabe",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Art der Angabe",
      "writable": true,
      "options": [
        "beobachtete_tatsache",
        "ungepruefte_annahme",
        "fachlich_bestaetigt"
      ]
    },
    "hinweis_luecke": {
      "key": "hinweis_luecke",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Hinweis zur Lücke oder zum Widerspruch",
      "writable": true
    }
  },
  "beurteilungen": {
    "vorgang": {
      "key": "vorgang",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorgang",
      "writable": true,
      "targetAppId": "6ad310075e4813c154ebf710",
      "targetEntity": "vorgaenge"
    },
    "beurteiler": {
      "key": "beurteiler",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Beurteilende Person",
      "writable": true,
      "targetAppId": "6ad30ffea403206740fda712",
      "targetEntity": "beteiligte"
    },
    "fachgebiet": {
      "key": "fachgebiet",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Fachgebiet",
      "writable": true,
      "options": [
        "qualitaetssicherung",
        "sonstiges",
        "vertrieb",
        "konstruktion",
        "arbeitsvorbereitung"
      ]
    },
    "sachverhalt": {
      "key": "sachverhalt",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Sachverhalt",
      "writable": true
    },
    "bewertung": {
      "key": "bewertung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bewertung",
      "writable": true
    },
    "moegliche_erklaerung": {
      "key": "moegliche_erklaerung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Mögliche Erklärung (Vorschlag)",
      "writable": true
    },
    "unsicherheiten": {
      "key": "unsicherheiten",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bestehende Unsicherheiten",
      "writable": true
    },
    "fachlich_bestaetigt": {
      "key": "fachlich_bestaetigt",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Fachlich bestätigt",
      "writable": true
    },
    "beurteilt_am": {
      "key": "beurteilt_am",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Datum der Beurteilung",
      "writable": true
    },
    "anforderung": {
      "key": "anforderung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Anforderung",
      "writable": true,
      "targetAppId": "6ad3100a83f2147ed4c1684f",
      "targetEntity": "anforderungen"
    }
  },
  "rueckfragen": {
    "vorgang": {
      "key": "vorgang",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorgang",
      "writable": true,
      "targetAppId": "6ad310075e4813c154ebf710",
      "targetEntity": "vorgaenge"
    },
    "adressat": {
      "key": "adressat",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Adressat",
      "writable": true,
      "targetAppId": "6ad30ffea403206740fda712",
      "targetEntity": "beteiligte"
    },
    "fragetext": {
      "key": "fragetext",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Fragetext",
      "writable": true
    },
    "buendelungsgruppe": {
      "key": "buendelungsgruppe",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Bündelungsgruppe",
      "writable": true,
      "maxLength": 4000
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Status",
      "writable": true,
      "options": [
        "vorbereitet",
        "gestellt",
        "beantwortet",
        "erledigt"
      ]
    },
    "gestellt_am": {
      "key": "gestellt_am",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gestellt am",
      "writable": true
    },
    "antwort": {
      "key": "antwort",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Antwort",
      "writable": true
    },
    "antwort_am": {
      "key": "antwort_am",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Antwort erhalten am",
      "writable": true
    },
    "aenderung_angabe": {
      "key": "aenderung_angabe",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Änderung an bereits erfassten Angaben",
      "writable": true
    },
    "anforderung": {
      "key": "anforderung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Betroffene Anforderung",
      "writable": true,
      "targetAppId": "6ad3100a83f2147ed4c1684f",
      "targetEntity": "anforderungen"
    }
  },
  "entscheidungen": {
    "vorgang": {
      "key": "vorgang",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Vorgang",
      "writable": true,
      "targetAppId": "6ad310075e4813c154ebf710",
      "targetEntity": "vorgaenge"
    },
    "gegenstand": {
      "key": "gegenstand",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Entscheidungsgegenstand",
      "writable": true,
      "maxLength": 4000
    },
    "regel": {
      "key": "regel",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Anwendbare Regel",
      "writable": true,
      "targetAppId": "6ad31006549fb17687e67ba1",
      "targetEntity": "regelwerk"
    },
    "entscheider": {
      "key": "entscheider",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Entscheidende Person",
      "writable": true,
      "targetAppId": "6ad30ffea403206740fda712",
      "targetEntity": "beteiligte"
    },
    "befugnis_geprueft": {
      "key": "befugnis_geprueft",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Entscheidungsbefugnis geprüft",
      "writable": true
    },
    "unsicherheiten": {
      "key": "unsicherheiten",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Verbleibende Unsicherheiten",
      "writable": true
    },
    "ki_vorschlag": {
      "key": "ki_vorschlag",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Vorschlag zur Entscheidung (unverbindlich)",
      "writable": true
    },
    "entscheidung": {
      "key": "entscheidung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Getroffene Entscheidung",
      "writable": true
    },
    "begruendung": {
      "key": "begruendung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Begründung",
      "writable": true
    },
    "folgen": {
      "key": "folgen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Folgen der Entscheidung",
      "writable": true
    },
    "entscheidungsdatum": {
      "key": "entscheidungsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Entscheidungsdatum",
      "writable": true
    },
    "freigabestatus": {
      "key": "freigabestatus",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Freigabestatus",
      "writable": true,
      "options": [
        "offen",
        "freigegeben",
        "abgelehnt",
        "unter_vorbehalt"
      ]
    },
    "anforderung": {
      "key": "anforderung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zugrunde liegende Anforderung",
      "writable": true,
      "targetAppId": "6ad3100a83f2147ed4c1684f",
      "targetEntity": "anforderungen"
    },
    "beurteilung": {
      "key": "beurteilung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Fachliche Beurteilung",
      "writable": true,
      "targetAppId": "6ad3100b0890f09b6e8898a5",
      "targetEntity": "beurteilungen"
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "beteiligte": [
    {
      "kind": "choice",
      "field": "stelle",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "entscheidungsbefugnis",
      "count": 5
    }
  ],
  "regelwerk": [
    {
      "kind": "choice",
      "field": "regeltyp",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "erforderliche_befugnis",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    }
  ],
  "vorgaenge": [
    {
      "kind": "choice",
      "field": "status",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "freigabestatus",
      "count": 4
    },
    {
      "kind": "record",
      "field": "zustaendige_person",
      "targetEntity": "beteiligte"
    }
  ],
  "quellen": [
    {
      "kind": "choice",
      "field": "verlaesslichkeit",
      "count": 4
    },
    {
      "kind": "record",
      "field": "vorgang",
      "targetEntity": "vorgaenge"
    }
  ],
  "erfahrungen": [
    {
      "kind": "choice",
      "field": "erkenntnisklasse",
      "count": 5
    },
    {
      "kind": "record",
      "field": "vorgang",
      "targetEntity": "vorgaenge"
    },
    {
      "kind": "record",
      "field": "bestaetigt_von",
      "targetEntity": "beteiligte"
    }
  ],
  "anforderungen": [
    {
      "kind": "choice",
      "field": "erfassungsstatus",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "art_der_angabe",
      "count": 3
    },
    {
      "kind": "record",
      "field": "widerspruch_zu",
      "targetEntity": "anforderungen"
    },
    {
      "kind": "record",
      "field": "vorgang",
      "targetEntity": "vorgaenge"
    },
    {
      "kind": "record",
      "field": "quelle",
      "targetEntity": "quellen"
    }
  ],
  "beurteilungen": [
    {
      "kind": "choice",
      "field": "fachgebiet",
      "count": 5
    },
    {
      "kind": "record",
      "field": "vorgang",
      "targetEntity": "vorgaenge"
    },
    {
      "kind": "record",
      "field": "beurteiler",
      "targetEntity": "beteiligte"
    },
    {
      "kind": "record",
      "field": "anforderung",
      "targetEntity": "anforderungen"
    }
  ],
  "rueckfragen": [
    {
      "kind": "choice",
      "field": "status",
      "count": 4
    },
    {
      "kind": "record",
      "field": "vorgang",
      "targetEntity": "vorgaenge"
    },
    {
      "kind": "record",
      "field": "adressat",
      "targetEntity": "beteiligte"
    },
    {
      "kind": "record",
      "field": "anforderung",
      "targetEntity": "anforderungen"
    }
  ],
  "entscheidungen": [
    {
      "kind": "choice",
      "field": "freigabestatus",
      "count": 4
    },
    {
      "kind": "record",
      "field": "vorgang",
      "targetEntity": "vorgaenge"
    },
    {
      "kind": "record",
      "field": "regel",
      "targetEntity": "regelwerk"
    },
    {
      "kind": "record",
      "field": "entscheider",
      "targetEntity": "beteiligte"
    },
    {
      "kind": "record",
      "field": "anforderung",
      "targetEntity": "anforderungen"
    },
    {
      "kind": "record",
      "field": "beurteilung",
      "targetEntity": "beurteilungen"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "beteiligte": [
    "vorname",
    "nachname"
  ],
  "regelwerk": [
    "bezeichnung"
  ],
  "vorgaenge": [
    "vorgangsnummer"
  ],
  "quellen": [
    "bezeichnung"
  ],
  "erfahrungen": [
    "titel"
  ],
  "anforderungen": [
    "bezeichnung"
  ],
  "beurteilungen": [
    "sachverhalt"
  ],
  "rueckfragen": [
    "buendelungsgruppe"
  ],
  "entscheidungen": [
    "gegenstand"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
