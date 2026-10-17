/**
 * useAnfrageAufnehmenFlow — the plumbing of the flow « Anfrage aufnehmen », generated from the plan.
 *
 * Writes `vorgaenge`: asks `kunde`, `titel`, `kundenanfrage`, `zustaendige_person`; sets `status`, `eingangsdatum`, `freigabestatus`, `prozessschritt` itself.
Writes `quellen` (only when the person fills it): asks `fundort`, `version`, `quellenart`, `bezeichnung`, `verlaesslichkeit`; links `vorgang` ← the created `vorgaenge`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 3)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useAnfrageAufnehmenFlow({
 *     steps: { zustaendige_person: 1, kunde: 2, titel: 2, kundenanfrage: 2, fundort: 2, version: 2, quellenart: 2, bezeichnung: 2, verlaesslichkeit: 2 },
 *     items: { zustaendige_person: r => ({ id: r.id, title: fieldText(r, 'vorname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.zustaendige_person.select} {...flow.pick('zustaendige_person')} />
 *     <Bound form={flow.forms.vorgaenge} name="kunde" />
 *     <Bound form={flow.forms.vorgaenge} name="titel" />
 *     <Bound form={flow.forms.vorgaenge} name="kundenanfrage" />
 *     <Bound form={flow.forms.quellen} name="fundort" />
 *     <Bound form={flow.forms.quellen} name="version" />
 *     <Bound form={flow.forms.quellen} name="quellenart" />
 *     <Bound form={flow.forms.quellen} name="bezeichnung" />
 *     <Bound form={flow.forms.quellen} name="verlaesslichkeit" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type AnfrageAufnehmenFieldKey = 'bezeichnung' | 'fundort' | 'kunde' | 'kundenanfrage' | 'quellenart' | 'titel' | 'verlaesslichkeit' | 'version' | 'zustaendige_person';

export interface AnfrageAufnehmenForms {
  vorgaenge: StepForm<'vorgaenge'>;
  quellen: StepForm<'quellen'>;
}

// Alias so the option generics stay readable.
type Key = AnfrageAufnehmenFieldKey;

export interface AnfrageAufnehmenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    zustaendige_person?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"bezeichnung": 2, "fundort": 2, "kunde": 2, "kundenanfrage": 2, "quellenart": 2, "titel": 2, "verlaesslichkeit": 2, "version": 2, "zustaendige_person": 1};
export const ANFRAGEAUFNEHMEN_REVIEW_STEP = 3;

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

export function useAnfrageAufnehmenFlow(options: AnfrageAufnehmenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const vorgaenge = useStepForm('vorgaenge', {
    fields: ["kunde", "titel", "kundenanfrage", "zustaendige_person"],
    steps: only(steps, ["kunde", "titel", "kundenanfrage", "zustaendige_person"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["kunde", "titel", "kundenanfrage", "zustaendige_person"]),
    messages: only(options.messages as Record<string, string> | undefined, ["kunde", "titel", "kundenanfrage", "zustaendige_person"]),
  });
  const quellen = useStepForm('quellen', {
    fields: ["fundort", "version", "quellenart", "bezeichnung", "verlaesslichkeit"],
    steps: only(steps, ["fundort", "version", "quellenart", "bezeichnung", "verlaesslichkeit"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["fundort", "version", "quellenart", "bezeichnung", "verlaesslichkeit"]),
    messages: only(options.messages as Record<string, string> | undefined, ["fundort", "version", "quellenart", "bezeichnung", "verlaesslichkeit"]),
  });
  const forms: AnfrageAufnehmenForms = { vorgaenge, quellen };
  const formList: StepForm[] = [vorgaenge, quellen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    zustaendige_person: useRecordSearch(servicePort, 'beteiligte', withPickPolicy('zustaendige_person', {
      searchFields: ["vorname", "nachname"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
      toItem: options.items?.zustaendige_person as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:anfrage-aufnehmen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:anfrage-aufnehmen:write:${entity}.${field}`,
  });
  const picks = {
    zustaendige_person: { ...searches.zustaendige_person, select: { ...searches.zustaendige_person.select, create: false as boolean, hint: hintFor('zustaendige_person', 'beteiligte', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
  };

  const quellenFilled = hasValues(quellen);
  const plan: PlanStep[] = [
    {
      key: 'vorgaenge', entity: 'vorgaenge', form: vorgaenge, primary: true,
      values: (): FormValues => ({
        status: policyFixedValue('vorgaenge', 'status') ?? "neu",
        eingangsdatum: policyFixedValue('vorgaenge', 'eingangsdatum') ?? todayIso(),
        freigabestatus: policyFixedValue('vorgaenge', 'freigabestatus') ?? "nicht_freigegeben",
        prozessschritt: policyFixedValue('vorgaenge', 'prozessschritt') ?? "anfrage_verstehen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('vorgaenge', 'status', policyFixedValue('vorgaenge', 'status') ?? "neu"), setting('vorgaenge', 'freigabestatus', policyFixedValue('vorgaenge', 'freigabestatus') ?? "nicht_freigegeben"), setting('vorgaenge', 'prozessschritt', policyFixedValue('vorgaenge', 'prozessschritt') ?? "anfrage_verstehen")],

      // the planner's assumptions that first act here — shown once with „Passt“ / „ändern“
      notices: () => [{"assumed": "Einfache laufende Nummer (1, 2, 3 \u2026)", "id": "vorgangsnummer-format", "question": "Wie soll die Vorgangsnummer aufgebaut sein?"}],
    },
    ...(quellenFilled ? [{
      key: 'quellen', entity: 'quellen', form: quellen,      needs: ['vorgaenge'],
      link: { vorgang: 'vorgaenge' },
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'anfrage-aufnehmen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: AnfrageAufnehmenFieldKey) => {
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
  const pickMany = (field: AnfrageAufnehmenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'anfrage-aufnehmen' as const,
    draftKey: 'anfrage-aufnehmen' as const,
    entity: 'vorgaenge' as const,
    form: vorgaenge,
    forms, formList, picks, submit, steps,    reviewStep: ANFRAGEAUFNEHMEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type AnfrageAufnehmenFlow = ReturnType<typeof useAnfrageAufnehmenFlow>;
