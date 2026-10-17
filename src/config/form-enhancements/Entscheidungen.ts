// Auto-generated. Per-entity form-enhancements config for "Entscheidungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["vorgang", "gegenstand", {"row": ["regel", "entscheider"], "cols": "1fr 1fr"}, {"row": ["anforderung", "beurteilung"], "cols": "1fr 1fr"}, {"row": ["entscheidungsdatum", "freigabestatus"], "cols": "1fr 1fr"}, "befugnis_geprueft", "entscheidung", "begruendung", "ki_vorschlag", "unsicherheiten", "folgen"],
  defaults: {
    'entscheidungsdatum': { kind: 'today' },
    'freigabestatus': { kind: 'lookup', key: 'offen', label: 'Offen' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
