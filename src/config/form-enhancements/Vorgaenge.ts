// Auto-generated. Per-entity form-enhancements config for "Vorgänge".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["vorgangsnummer", "titel"], "cols": "1fr 2fr"}, {"row": ["kunde", "eingangsdatum"], "cols": "2fr 1fr"}, "zustaendige_person", "prozessschritt", "status", "freigabestatus", "uebergabefaehig", "kundenanfrage", "auftragsentwurf", "geklaerte_punkte", "offene_punkte"],
  defaults: {
    'eingangsdatum': { kind: 'today' },
    'status': { kind: 'lookup', key: 'neu', label: 'Neu' },
    'prozessschritt': { kind: 'lookup', key: 'anfrage_verstehen', label: 'Anfrage verstehen' },
    'freigabestatus': { kind: 'lookup', key: 'nicht_freigegeben', label: 'Nicht freigegeben' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
