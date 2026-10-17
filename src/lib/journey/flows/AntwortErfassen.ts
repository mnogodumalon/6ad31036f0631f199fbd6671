/**
 * useAntwortErfassenFlow — the plumbing of the flow « Antwort erfassen », generated from the plan.
 *
 * Changes `rueckfragen`: the record to change is picked (`flow.pick('rueckfragen')`), the form is prefilled with its values; asks `antwort`, `aenderung_angabe`; sets `status`, `antwort_am` itself.
Changes `anforderungen` (only when the person fills it): the record to change is picked (`flow.pick('anforderungen')`), the form is prefilled with its values; asks `wert`, `erfassungsstatus`.
Changes `vorgaenge`: the record to change is picked (`flow.pick('vorgaenge')`), the form is prefilled with its values; ; sets `status` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 5)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useAntwortErfassenFlow({
 *     steps: { rueckfragen: 1, anforderungen: 2, vorgaenge: 3, antwort: 4, aenderung_angabe: 4, wert: 4, erfassungsstatus: 4 },
 *     items: { rueckfragen: r => ({ id: r.id, title: fieldText(r, 'fragetext') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.rueckfragen.select} {...flow.pick('rueckfragen')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.anforderungen.select} {...flow.pick('anforderungen')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.vorgaenge.select} {...flow.pick('vorgaenge')} />
 *     <Bound form={flow.forms.rueckfragen} name="antwort" />
 *     <Bound form={flow.forms.rueckfragen} name="aenderung_angabe" />
 *     <Bound form={flow.forms.anforderungen} name="wert" />
 *     <Bound form={flow.forms.anforderungen} name="erfassungsstatus" />
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
export type AntwortErfassenFieldKey = 'aenderung_angabe' | 'anforderungen' | 'antwort' | 'erfassungsstatus' | 'rueckfragen' | 'vorgaenge' | 'wert';

export interface AntwortErfassenForms {
  rueckfragen: StepForm<'rueckfragen'>;
  anforderungen: StepForm<'anforderungen'>;
  vorgaenge: StepForm<'vorgaenge'>;
}

// Alias so the option generics stay readable.
type Key = AntwortErfassenFieldKey;

export interface AntwortErfassenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    rueckfragen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    anforderungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vorgaenge?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"aenderung_angabe": 4, "anforderungen": 2, "antwort": 4, "erfassungsstatus": 4, "rueckfragen": 1, "vorgaenge": 3, "wert": 4};
export const ANTWORTERFASSEN_REVIEW_STEP = 5;

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

export function useAntwortErfassenFlow(options: AntwortErfassenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [rueckfragenTargetId, setRueckfragenTargetId] = useState<string | null>(null);
  const [anforderungenTargetId, setAnforderungenTargetId] = useState<string | null>(null);
  const [vorgaengeTargetId, setVorgaengeTargetId] = useState<string | null>(null);
  const rueckfragen = useStepForm('rueckfragen', {
    fields: ["antwort", "aenderung_angabe"],
    steps: only(steps, ["antwort", "aenderung_angabe"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["antwort", "aenderung_angabe"]),
    messages: only(options.messages as Record<string, string> | undefined, ["antwort", "aenderung_angabe"]),
  });
  const anforderungen = useStepForm('anforderungen', {
    fields: ["wert", "erfassungsstatus"],
    steps: only(steps, ["wert", "erfassungsstatus"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["wert", "erfassungsstatus"]),
    messages: only(options.messages as Record<string, string> | undefined, ["wert", "erfassungsstatus"]),
  });
  const vorgaenge = useStepForm('vorgaenge', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: AntwortErfassenForms = { rueckfragen, anforderungen, vorgaenge };
  const formList: StepForm[] = [rueckfragen, anforderungen, vorgaenge];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    rueckfragen: useRecordSearch(servicePort, 'rueckfragen', withPickPolicy('rueckfragen', {
      searchFields: ["fragetext"] as never,
      filter: "r.v_status in ['vorbereitet', 'gestellt']",
      where: (r: JourneyRecord) => ["vorbereitet", "gestellt"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.rueckfragen as never,
    })),
    anforderungen: useRecordSearch(servicePort, 'anforderungen', withPickPolicy('anforderungen', {
      searchFields: ["bezeichnung"] as never,
      toItem: options.items?.anforderungen as never,
    })),
    vorgaenge: useRecordSearch(servicePort, 'vorgaenge', withPickPolicy('vorgaenge', {
      searchFields: ["vorgangsnummer"] as never,
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
    `#/verwaltung/anwendung?line=intent:antwort-erfassen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:antwort-erfassen:write:${entity}.${field}`,
  });
  const picks = {
    rueckfragen: { ...searches.rueckfragen, select: { ...searches.rueckfragen.select, create: false as boolean, hint: hintFor('rueckfragen', 'rueckfragen', {"conditions": [{"field": "status", "op": "in", "value": ["vorbereitet", "gestellt"]}], "mode": "all"} as PickWhere | null) } },
    anforderungen: { ...searches.anforderungen, select: { ...searches.anforderungen.select, create: false as boolean, hint: hintFor('anforderungen', 'anforderungen', null as PickWhere | null) } },
    vorgaenge: { ...searches.vorgaenge, select: { ...searches.vorgaenge.select, create: false as boolean, hint: hintFor('vorgaenge', 'vorgaenge', null as PickWhere | null) } },
  };

  const anforderungenFilled = hasValues(anforderungen);
  const plan: PlanStep[] = [
    {
      key: 'rueckfragen', entity: 'rueckfragen', form: rueckfragen,
      updates: () => rueckfragenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => rueckfragenTargetId
        ? { key: 'target:rueckfragen', label: entityLabel('rueckfragen'), value: picks.rueckfragen.labelOf(rueckfragenTargetId) ?? rueckfragenTargetId, step: steps.rueckfragen }
        : undefined,
      values: (): FormValues => ({
        status: policyFixedValue('rueckfragen', 'status') ?? "beantwortet",
        antwort_am: policyFixedValue('rueckfragen', 'antwort_am') ?? todayIso(),
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('rueckfragen', 'status', policyFixedValue('rueckfragen', 'status') ?? "beantwortet")],
    },
    ...(anforderungenFilled ? [{
      key: 'anforderungen', entity: 'anforderungen', form: anforderungen,
      updates: () => anforderungenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => anforderungenTargetId
        ? { key: 'target:anforderungen', label: entityLabel('anforderungen'), value: picks.anforderungen.labelOf(anforderungenTargetId) ?? anforderungenTargetId, step: steps.anforderungen }
        : undefined,    } as PlanStep] : []),
    {
      key: 'vorgaenge', entity: 'vorgaenge', form: vorgaenge, primary: true,
      updates: () => vorgaengeTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => vorgaengeTargetId
        ? { key: 'target:vorgaenge', label: entityLabel('vorgaenge'), value: picks.vorgaenge.labelOf(vorgaengeTargetId) ?? vorgaengeTargetId, step: steps.vorgaenge }
        : undefined,
      values: (): FormValues => ({
        status: policyFixedValue('vorgaenge', 'status') ?? "in_klaerung",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('vorgaenge', 'status', policyFixedValue('vorgaenge', 'status') ?? "in_klaerung")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'antwort-erfassen' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    rueckfragen: {
      selectedId: rueckfragenTargetId,
      onSelect: (id: string) => {
        setRueckfragenTargetId(id);
        const rec = picks.rueckfragen.recordOf(id);
        if (rec) rueckfragen.reset({ antwort: fieldText(rec, "antwort"), aenderung_angabe: fieldText(rec, "aenderung_angabe"), });
      },
      get record(): JourneyRecord | undefined { return rueckfragenTargetId ? picks.rueckfragen.recordOf(rueckfragenTargetId) : undefined; },
    },
    anforderungen: {
      selectedId: anforderungenTargetId,
      onSelect: (id: string) => {
        setAnforderungenTargetId(id);
        const rec = picks.anforderungen.recordOf(id);
        if (rec) anforderungen.reset({ wert: fieldText(rec, "wert"), erfassungsstatus: fieldLookup(rec, "erfassungsstatus")?.key, });
      },
      get record(): JourneyRecord | undefined { return anforderungenTargetId ? picks.anforderungen.recordOf(anforderungenTargetId) : undefined; },
    },
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
  const pick = (field: AntwortErfassenFieldKey) => {
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
  const pickMany = (field: AntwortErfassenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setRueckfragenTargetId(null); setAnforderungenTargetId(null); setVorgaengeTargetId(null); };

  return {
    slug: 'antwort-erfassen' as const,
    draftKey: 'antwort-erfassen' as const,
    entity: 'vorgaenge' as const,
    form: vorgaenge,
    forms, formList, picks, submit, steps, targets,    reviewStep: ANTWORTERFASSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type AntwortErfassenFlow = ReturnType<typeof useAntwortErfassenFlow>;
