/**
 * useAnforderungErfassenFlow — the plumbing of the flow « Anforderung erfassen », generated from the plan.
 *
 * Writes `anforderungen`: asks `vorgang`, `bezeichnung`, `beschreibung`, `kategorie`, `wert`, `quelle`, `art_der_angabe`, `erfassungsstatus`, `hinweis_luecke`, `widerspruch_zu`.
Changes `vorgaenge`: the record to change is picked (`flow.pick('vorgaenge')`), the form is prefilled with its values; ; sets `prozessschritt`, `status` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 6)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useAnforderungErfassenFlow({
 *     steps: { vorgaenge: 1, vorgang: 2, quelle: 3, widerspruch_zu: 4, bezeichnung: 5, beschreibung: 5, kategorie: 5, wert: 5, art_der_angabe: 5, erfassungsstatus: 5, hinweis_luecke: 5 },
 *     items: { vorgang: r => ({ id: r.id, title: fieldText(r, 'vorgangsnummer') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.vorgang.select} {...flow.pick('vorgang')} />
 *     <EntitySelectStep {...flow.picks.quelle.select} {...flow.pick('quelle')} />
 *     <EntitySelectStep {...flow.picks.widerspruch_zu.select} {...flow.pick('widerspruch_zu')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.vorgaenge.select} {...flow.pick('vorgaenge')} />
 *     <Bound form={flow.forms.anforderungen} name="bezeichnung" />
 *     <Bound form={flow.forms.anforderungen} name="beschreibung" />
 *     <Bound form={flow.forms.anforderungen} name="kategorie" />
 *     <Bound form={flow.forms.anforderungen} name="wert" />
 *     <Bound form={flow.forms.anforderungen} name="art_der_angabe" />
 *     <Bound form={flow.forms.anforderungen} name="erfassungsstatus" />
 *     <Bound form={flow.forms.anforderungen} name="hinweis_luecke" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import { useState } from 'react';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';
export type AnforderungErfassenFieldKey = 'art_der_angabe' | 'beschreibung' | 'bezeichnung' | 'erfassungsstatus' | 'hinweis_luecke' | 'kategorie' | 'quelle' | 'vorgaenge' | 'vorgang' | 'wert' | 'widerspruch_zu';

export interface AnforderungErfassenForms {
  anforderungen: StepForm<'anforderungen'>;
  vorgaenge: StepForm<'vorgaenge'>;
}

// Alias so the option generics stay readable.
type Key = AnforderungErfassenFieldKey;

export interface AnforderungErfassenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    vorgang?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    quelle?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    widerspruch_zu?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vorgaenge?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"art_der_angabe": 5, "beschreibung": 5, "bezeichnung": 5, "erfassungsstatus": 5, "hinweis_luecke": 5, "kategorie": 5, "quelle": 3, "vorgaenge": 1, "vorgang": 2, "wert": 5, "widerspruch_zu": 4};
export const ANFORDERUNGERFASSEN_REVIEW_STEP = 6;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useAnforderungErfassenFlow(options: AnforderungErfassenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [vorgaengeTargetId, setVorgaengeTargetId] = useState<string | null>(null);
  const anforderungen = useStepForm('anforderungen', {
    fields: ["vorgang", "bezeichnung", "beschreibung", "kategorie", "wert", "quelle", "art_der_angabe", "erfassungsstatus", "hinweis_luecke", "widerspruch_zu"],
    steps: only(steps, ["vorgang", "bezeichnung", "beschreibung", "kategorie", "wert", "quelle", "art_der_angabe", "erfassungsstatus", "hinweis_luecke", "widerspruch_zu"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorgang", "bezeichnung", "beschreibung", "kategorie", "wert", "quelle", "art_der_angabe", "erfassungsstatus", "hinweis_luecke", "widerspruch_zu"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorgang", "bezeichnung", "beschreibung", "kategorie", "wert", "quelle", "art_der_angabe", "erfassungsstatus", "hinweis_luecke", "widerspruch_zu"]),
  });
  const vorgaenge = useStepForm('vorgaenge', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: AnforderungErfassenForms = { anforderungen, vorgaenge };
  const formList: StepForm[] = [anforderungen, vorgaenge];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    vorgang: useRecordSearch(servicePort, 'vorgaenge', withPickPolicy('vorgang', {
      searchFields: ["vorgangsnummer", "titel", "kunde"] as never,
      filter: "r.v_status != 'abgeschlossen'",
      where: (r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) !== "abgeschlossen",
      toItem: options.items?.vorgang as never,
    })),
    quelle: useRecordSearch(servicePort, 'quellen', withPickPolicy('quelle', {
      searchFields: ["bezeichnung"] as never,
      toItem: options.items?.quelle as never,
    })),
    widerspruch_zu: useRecordSearch(servicePort, 'anforderungen', withPickPolicy('widerspruch_zu', {
      searchFields: ["bezeichnung", "wert"] as never,
      toItem: options.items?.widerspruch_zu as never,
    })),
    vorgaenge: useRecordSearch(servicePort, 'vorgaenge', withPickPolicy('vorgaenge', {
      searchFields: ["vorgangsnummer", "titel", "kunde"] as never,
      filter: "r.v_status != 'abgeschlossen'",
      where: (r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) !== "abgeschlossen",
      toItem: options.items?.vorgaenge as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:anforderung-erfassen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:anforderung-erfassen:write:${entity}.${field}`,
  });
  const picks = {
    vorgang: { ...searches.vorgang, select: { ...searches.vorgang.select, create: false as boolean, hint: hintFor('vorgang', 'vorgaenge', {"conditions": [{"field": "status", "op": "ne", "value": "abgeschlossen"}], "mode": "all"} as PickWhere | null) } },
    quelle: { ...searches.quelle, select: { ...searches.quelle.select, create: false as boolean, hint: hintFor('quelle', 'quellen', null as PickWhere | null) } },
    widerspruch_zu: { ...searches.widerspruch_zu, select: { ...searches.widerspruch_zu.select, create: false as boolean, hint: hintFor('widerspruch_zu', 'anforderungen', null as PickWhere | null) } },
    vorgaenge: { ...searches.vorgaenge, select: { ...searches.vorgaenge.select, create: false as boolean, hint: hintFor('vorgaenge', 'vorgaenge', {"conditions": [{"field": "status", "op": "ne", "value": "abgeschlossen"}], "mode": "all"} as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'anforderungen', entity: 'anforderungen', form: anforderungen, primary: true,    },
    {
      key: 'vorgaenge', entity: 'vorgaenge', form: vorgaenge,
      updates: () => vorgaengeTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => vorgaengeTargetId
        ? { key: 'target:vorgaenge', label: entityLabel('vorgaenge'), value: picks.vorgaenge.labelOf(vorgaengeTargetId) ?? vorgaengeTargetId, step: steps.vorgaenge }
        : undefined,
      values: (): FormValues => ({
        prozessschritt: policyFixedValue('vorgaenge', 'prozessschritt') ?? "informationen_pruefen",
        status: policyFixedValue('vorgaenge', 'status') ?? "in_klaerung",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('vorgaenge', 'prozessschritt', policyFixedValue('vorgaenge', 'prozessschritt') ?? "informationen_pruefen"), setting('vorgaenge', 'status', policyFixedValue('vorgaenge', 'status') ?? "in_klaerung")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'anforderung-erfassen' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    vorgaenge: {
      selectedId: vorgaengeTargetId,
      onSelect: (id: string) => {
        setVorgaengeTargetId(id);
        const rec = picks.vorgaenge.recordOf(id);
        if (rec) vorgaenge.reset({ });
      },
      get record(): JourneyRecord | undefined { return vorgaengeTargetId ? picks.vorgaenge.recordOf(vorgaengeTargetId) : undefined; },
    },
  };
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: AnforderungErfassenFieldKey) => {
    if (field in targets) {
      const t = targets[field as keyof typeof targets];
      return { selectedId: t.selectedId, onSelect: t.onSelect };
    }
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: AnforderungErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setVorgaengeTargetId(null); };

  return {
    slug: 'anforderung-erfassen' as const,
    draftKey: 'anforderung-erfassen' as const,
    entity: 'anforderungen' as const,
    form: anforderungen,
    forms, formList, picks, submit, steps, targets,    reviewStep: ANFORDERUNGERFASSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type AnforderungErfassenFlow = ReturnType<typeof useAnforderungErfassenFlow>;
