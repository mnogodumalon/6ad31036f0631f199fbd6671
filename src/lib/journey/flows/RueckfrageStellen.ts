/**
 * useRueckfrageStellenFlow — the plumbing of the flow « Rückfrage vorbereiten », generated from the plan.
 *
 * Writes `rueckfragen`: asks `vorgang`, `adressat`, `fragetext`, `anforderung`, `buendelungsgruppe`; sets `status` itself.
Changes `vorgaenge`: the record to change is picked (`flow.pick('vorgaenge')`), the form is prefilled with its values; ; sets `status`, `prozessschritt` itself.
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
 *   const flow = useRueckfrageStellenFlow({
 *     steps: { vorgaenge: 1, vorgang: 2, adressat: 3, anforderung: 4, fragetext: 5, buendelungsgruppe: 5 },
 *     items: { vorgang: r => ({ id: r.id, title: fieldText(r, 'vorgangsnummer') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.vorgang.select} {...flow.pick('vorgang')} />
 *     <EntitySelectStep {...flow.picks.adressat.select} {...flow.pick('adressat')} />
 *     <EntitySelectStep {...flow.picks.anforderung.select} {...flow.pick('anforderung')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.vorgaenge.select} {...flow.pick('vorgaenge')} />
 *     <Bound form={flow.forms.rueckfragen} name="fragetext" />
 *     <Bound form={flow.forms.rueckfragen} name="buendelungsgruppe" />
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
export type RueckfrageStellenFieldKey = 'adressat' | 'anforderung' | 'buendelungsgruppe' | 'fragetext' | 'vorgaenge' | 'vorgang';

export interface RueckfrageStellenForms {
  rueckfragen: StepForm<'rueckfragen'>;
  vorgaenge: StepForm<'vorgaenge'>;
}

// Alias so the option generics stay readable.
type Key = RueckfrageStellenFieldKey;

export interface RueckfrageStellenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    vorgang?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    adressat?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    anforderung?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vorgaenge?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"adressat": 3, "anforderung": 4, "buendelungsgruppe": 5, "fragetext": 5, "vorgaenge": 1, "vorgang": 2};
export const RUECKFRAGESTELLEN_REVIEW_STEP = 6;

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

export function useRueckfrageStellenFlow(options: RueckfrageStellenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [vorgaengeTargetId, setVorgaengeTargetId] = useState<string | null>(null);
  const rueckfragen = useStepForm('rueckfragen', {
    fields: ["vorgang", "adressat", "fragetext", "anforderung", "buendelungsgruppe"],
    steps: only(steps, ["vorgang", "adressat", "fragetext", "anforderung", "buendelungsgruppe"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorgang", "adressat", "fragetext", "anforderung", "buendelungsgruppe"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorgang", "adressat", "fragetext", "anforderung", "buendelungsgruppe"]),
  });
  const vorgaenge = useStepForm('vorgaenge', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: RueckfrageStellenForms = { rueckfragen, vorgaenge };
  const formList: StepForm[] = [rueckfragen, vorgaenge];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    vorgang: useRecordSearch(servicePort, 'vorgaenge', withPickPolicy('vorgang', {
      searchFields: ["vorgangsnummer"] as never,
      toItem: options.items?.vorgang as never,
    })),
    adressat: useRecordSearch(servicePort, 'beteiligte', withPickPolicy('adressat', {
      searchFields: ["vorname", "nachname", "zustaendigkeitsbereich"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
      toItem: options.items?.adressat as never,
    })),
    anforderung: useRecordSearch(servicePort, 'anforderungen', withPickPolicy('anforderung', {
      searchFields: ["bezeichnung", "hinweis_luecke"] as never,
      filter: "r.v_erfassungsstatus == 'fehlt' or r.v_erfassungsstatus == 'widerspruechlich' or r.v_erfassungsstatus == 'ungeprueft'",
      where: (r: JourneyRecord) => (fieldLookup(r, "erfassungsstatus")?.key ?? null) === "fehlt" || (fieldLookup(r, "erfassungsstatus")?.key ?? null) === "widerspruechlich" || (fieldLookup(r, "erfassungsstatus")?.key ?? null) === "ungeprueft",
      toItem: options.items?.anforderung as never,
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
    `#/verwaltung/anwendung?line=intent:rueckfrage-stellen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:rueckfrage-stellen:write:${entity}.${field}`,
  });
  const picks = {
    vorgang: { ...searches.vorgang, select: { ...searches.vorgang.select, create: false as boolean, hint: hintFor('vorgang', 'vorgaenge', null as PickWhere | null) } },
    adressat: { ...searches.adressat, select: { ...searches.adressat.select, create: false as boolean, hint: hintFor('adressat', 'beteiligte', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
    anforderung: { ...searches.anforderung, select: { ...searches.anforderung.select, create: false as boolean, hint: hintFor('anforderung', 'anforderungen', {"conditions": [{"field": "erfassungsstatus", "op": "eq", "value": "fehlt"}, {"field": "erfassungsstatus", "op": "eq", "value": "widerspruechlich"}, {"field": "erfassungsstatus", "op": "eq", "value": "ungeprueft"}], "mode": "any"} as PickWhere | null) } },
    vorgaenge: { ...searches.vorgaenge, select: { ...searches.vorgaenge.select, create: false as boolean, hint: hintFor('vorgaenge', 'vorgaenge', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'rueckfragen', entity: 'rueckfragen', form: rueckfragen, primary: true,
      values: (): FormValues => ({
        status: policyFixedValue('rueckfragen', 'status') ?? "vorbereitet",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('rueckfragen', 'status', policyFixedValue('rueckfragen', 'status') ?? "vorbereitet")],
    },
    {
      key: 'vorgaenge', entity: 'vorgaenge', form: vorgaenge,
      updates: () => vorgaengeTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => vorgaengeTargetId
        ? { key: 'target:vorgaenge', label: entityLabel('vorgaenge'), value: picks.vorgaenge.labelOf(vorgaengeTargetId) ?? vorgaengeTargetId, step: steps.vorgaenge }
        : undefined,
      values: (): FormValues => ({
        status: policyFixedValue('vorgaenge', 'status') ?? "wartet_auf_antwort",
        prozessschritt: policyFixedValue('vorgaenge', 'prozessschritt') ?? "kommunikation_organisieren",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('vorgaenge', 'status', policyFixedValue('vorgaenge', 'status') ?? "wartet_auf_antwort"), setting('vorgaenge', 'prozessschritt', policyFixedValue('vorgaenge', 'prozessschritt') ?? "kommunikation_organisieren")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'rueckfrage-stellen' });

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
  const pick = (field: RueckfrageStellenFieldKey) => {
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
  const pickMany = (field: RueckfrageStellenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setVorgaengeTargetId(null); };

  return {
    slug: 'rueckfrage-stellen' as const,
    draftKey: 'rueckfrage-stellen' as const,
    entity: 'rueckfragen' as const,
    form: rueckfragen,
    forms, formList, picks, submit, steps, targets,    reviewStep: RUECKFRAGESTELLEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type RueckfrageStellenFlow = ReturnType<typeof useRueckfrageStellenFlow>;
