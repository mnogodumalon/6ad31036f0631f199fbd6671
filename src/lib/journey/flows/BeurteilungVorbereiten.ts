/**
 * useBeurteilungVorbereitenFlow — the plumbing of the flow « Beurteilung vorbereiten », generated from the plan.
 *
 * Writes `beurteilungen`: asks `vorgang`, `anforderung`, `beurteiler`, `fachgebiet`, `sachverhalt`, `bewertung`, `moegliche_erklaerung`, `unsicherheiten`, `fachlich_bestaetigt`; sets `beurteilt_am` itself.
Changes `vorgaenge`: the record to change is picked (`flow.pick('vorgaenge')`), the form is prefilled with its values; ; sets `prozessschritt` itself.
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
 *   const flow = useBeurteilungVorbereitenFlow({
 *     steps: { vorgaenge: 1, vorgang: 2, anforderung: 3, beurteiler: 4, fachgebiet: 5, sachverhalt: 5, bewertung: 5, moegliche_erklaerung: 5, unsicherheiten: 5, fachlich_bestaetigt: 5 },
 *     items: { vorgang: r => ({ id: r.id, title: fieldText(r, 'vorgangsnummer') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.vorgang.select} {...flow.pick('vorgang')} />
 *     <EntitySelectStep {...flow.picks.anforderung.select} {...flow.pick('anforderung')} />
 *     <EntitySelectStep {...flow.picks.beurteiler.select} {...flow.pick('beurteiler')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.vorgaenge.select} {...flow.pick('vorgaenge')} />
 *     <Bound form={flow.forms.beurteilungen} name="fachgebiet" />
 *     <Bound form={flow.forms.beurteilungen} name="sachverhalt" />
 *     <Bound form={flow.forms.beurteilungen} name="bewertung" />
 *     <Bound form={flow.forms.beurteilungen} name="moegliche_erklaerung" />
 *     <Bound form={flow.forms.beurteilungen} name="unsicherheiten" />
 *     <Bound form={flow.forms.beurteilungen} name="fachlich_bestaetigt" />
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
export type BeurteilungVorbereitenFieldKey = 'anforderung' | 'beurteiler' | 'bewertung' | 'fachgebiet' | 'fachlich_bestaetigt' | 'moegliche_erklaerung' | 'sachverhalt' | 'unsicherheiten' | 'vorgaenge' | 'vorgang';

export interface BeurteilungVorbereitenForms {
  beurteilungen: StepForm<'beurteilungen'>;
  vorgaenge: StepForm<'vorgaenge'>;
}

// Alias so the option generics stay readable.
type Key = BeurteilungVorbereitenFieldKey;

export interface BeurteilungVorbereitenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    vorgang?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    anforderung?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    beurteiler?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    vorgaenge?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"anforderung": 3, "beurteiler": 4, "bewertung": 5, "fachgebiet": 5, "fachlich_bestaetigt": 5, "moegliche_erklaerung": 5, "sachverhalt": 5, "unsicherheiten": 5, "vorgaenge": 1, "vorgang": 2};
export const BEURTEILUNGVORBEREITEN_REVIEW_STEP = 6;

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

export function useBeurteilungVorbereitenFlow(options: BeurteilungVorbereitenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [vorgaengeTargetId, setVorgaengeTargetId] = useState<string | null>(null);
  const beurteilungen = useStepForm('beurteilungen', {
    fields: ["vorgang", "anforderung", "beurteiler", "fachgebiet", "sachverhalt", "bewertung", "moegliche_erklaerung", "unsicherheiten", "fachlich_bestaetigt"],
    steps: only(steps, ["vorgang", "anforderung", "beurteiler", "fachgebiet", "sachverhalt", "bewertung", "moegliche_erklaerung", "unsicherheiten", "fachlich_bestaetigt"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["vorgang", "anforderung", "beurteiler", "fachgebiet", "sachverhalt", "bewertung", "moegliche_erklaerung", "unsicherheiten", "fachlich_bestaetigt"]),
    messages: only(options.messages as Record<string, string> | undefined, ["vorgang", "anforderung", "beurteiler", "fachgebiet", "sachverhalt", "bewertung", "moegliche_erklaerung", "unsicherheiten", "fachlich_bestaetigt"]),
  });
  const vorgaenge = useStepForm('vorgaenge', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: BeurteilungVorbereitenForms = { beurteilungen, vorgaenge };
  const formList: StepForm[] = [beurteilungen, vorgaenge];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    vorgang: useRecordSearch(servicePort, 'vorgaenge', withPickPolicy('vorgang', {
      searchFields: ["vorgangsnummer"] as never,
      toItem: options.items?.vorgang as never,
    })),
    anforderung: useRecordSearch(servicePort, 'anforderungen', withPickPolicy('anforderung', {
      searchFields: ["bezeichnung", "wert"] as never,
      filter: "r.v_erfassungsstatus != 'vollstaendig'",
      where: (r: JourneyRecord) => (fieldLookup(r, "erfassungsstatus")?.key ?? null) !== "vollstaendig",
      toItem: options.items?.anforderung as never,
    })),
    beurteiler: useRecordSearch(servicePort, 'beteiligte', withPickPolicy('beurteiler', {
      searchFields: ["vorname", "nachname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
      toItem: options.items?.beurteiler as never,
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
    `#/verwaltung/anwendung?line=intent:beurteilung-vorbereiten:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:beurteilung-vorbereiten:write:${entity}.${field}`,
  });
  const picks = {
    vorgang: { ...searches.vorgang, select: { ...searches.vorgang.select, create: false as boolean, hint: hintFor('vorgang', 'vorgaenge', null as PickWhere | null) } },
    anforderung: { ...searches.anforderung, select: { ...searches.anforderung.select, create: false as boolean, hint: hintFor('anforderung', 'anforderungen', {"conditions": [{"field": "erfassungsstatus", "op": "ne", "value": "vollstaendig"}], "mode": "all"} as PickWhere | null) } },
    beurteiler: { ...searches.beurteiler, select: { ...searches.beurteiler.select, create: false as boolean, hint: hintFor('beurteiler', 'beteiligte', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
    vorgaenge: { ...searches.vorgaenge, select: { ...searches.vorgaenge.select, create: false as boolean, hint: hintFor('vorgaenge', 'vorgaenge', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'beurteilungen', entity: 'beurteilungen', form: beurteilungen, primary: true,
      values: (): FormValues => ({
        beurteilt_am: policyFixedValue('beurteilungen', 'beurteilt_am') ?? todayIso(),
      }),
    },
    {
      key: 'vorgaenge', entity: 'vorgaenge', form: vorgaenge,
      updates: () => vorgaengeTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => vorgaengeTargetId
        ? { key: 'target:vorgaenge', label: entityLabel('vorgaenge'), value: picks.vorgaenge.labelOf(vorgaengeTargetId) ?? vorgaengeTargetId, step: steps.vorgaenge }
        : undefined,
      values: (): FormValues => ({
        prozessschritt: policyFixedValue('vorgaenge', 'prozessschritt') ?? "beurteilungen_vorbereiten",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('vorgaenge', 'prozessschritt', policyFixedValue('vorgaenge', 'prozessschritt') ?? "beurteilungen_vorbereiten")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'beurteilung-vorbereiten' });

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
  const pick = (field: BeurteilungVorbereitenFieldKey) => {
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
  const pickMany = (field: BeurteilungVorbereitenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setVorgaengeTargetId(null); };

  return {
    slug: 'beurteilung-vorbereiten' as const,
    draftKey: 'beurteilung-vorbereiten' as const,
    entity: 'beurteilungen' as const,
    form: beurteilungen,
    forms, formList, picks, submit, steps, targets,    reviewStep: BEURTEILUNGVORBEREITEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type BeurteilungVorbereitenFlow = ReturnType<typeof useBeurteilungVorbereitenFlow>;
