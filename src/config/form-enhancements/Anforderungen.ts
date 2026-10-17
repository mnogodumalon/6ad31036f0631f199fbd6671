// Auto-generated. Per-entity form-enhancements config for "Anforderungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["bezeichnung", "vorgang", {"row": ["kategorie", "erfassungsstatus"], "cols": "1fr 1fr"}, "wert", "quelle", "art_der_angabe", "widerspruch_zu", "beschreibung", "hinweis_luecke"],
  defaults: {
    'erfassungsstatus': { kind: 'lookup', key: 'ungeprueft', label: 'Ungeprüft' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
