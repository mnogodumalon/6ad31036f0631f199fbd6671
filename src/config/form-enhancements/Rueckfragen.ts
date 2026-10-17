// Auto-generated. Per-entity form-enhancements config for "Rückfragen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["vorgang", "adressat"], "cols": "1fr 1fr"}, "fragetext", "status", {"row": ["gestellt_am", "antwort_am"], "cols": "1fr 1fr"}, "buendelungsgruppe", "anforderung", "antwort", "aenderung_angabe"],
  defaults: {
    'status': { kind: 'lookup', key: 'vorbereitet', label: 'Vorbereitet' },
    'gestellt_am': { kind: 'today' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
