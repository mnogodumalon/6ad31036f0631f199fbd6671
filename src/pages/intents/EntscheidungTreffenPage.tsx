/**
 * Entscheidung treffen — 4-Schritt-Wizard mit Befugnisprüfung.
 * Steps: 1) Vorgang, Anforderung und Beurteilung wählen → 2) Anwendbare Regel wählen →
 *        3) Entscheidende Person wählen, Befugnis prüfen → 4) Entscheidung erfassen → Prüfen & anlegen.
 * Reads: vorgaenge, anforderungen, beurteilungen, regelwerk, beteiligte. Writes: entscheidungen (create),
 *        vorgaenge (update: prozessschritt, status) — all through useEntscheidungTreffenFlow.
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IconAlertTriangle, IconShieldCheck } from '@tabler/icons-react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, optionsOf, todayIso, formatFieldValue } from '@/lib/journey';
import type { JourneyRecord } from '@/lib/journey';
import { useEntscheidungTreffenFlow } from '@/lib/journey/flows/EntscheidungTreffen';
import { tx } from '@/i18n';

/** Gesamtfreigabe deckt jede Regel ab, sonst muss die Befugnis genau passen. */
function befugnisReicht(erforderlich: string | undefined, vorhanden: string | undefined): boolean {
  if (!erforderlich) return true;
  if (!vorhanden) return false;
  return vorhanden === 'gesamtfreigabe' || vorhanden === erforderlich;
}

export default function EntscheidungTreffenPage() {
  const [step, setStep] = useState(1);
  const flow = useEntscheidungTreffenFlow({
    steps: {
      vorgaenge: 1, vorgang: 1, anforderung: 1, beurteilung: 1,
      regel: 2,
      entscheider: 3, befugnis_geprueft: 3,
      gegenstand: 4, unsicherheiten: 4, ki_vorschlag: 4, entscheidung: 4, begruendung: 4, folgen: 4, freigabestatus: 4,
    },
    items: {
      vorgang: r => ({ id: r.id, title: fieldText(r, 'vorgangsnummer') || fieldText(r, 'titel'), subtitle: fieldText(r, 'titel') }),
      anforderung: r => ({ id: r.id, title: fieldText(r, 'bezeichnung'), subtitle: fieldText(r, 'wert') }),
      beurteilung: r => ({
        id: r.id,
        title: fieldText(r, 'sachverhalt'),
        subtitle: r.fields.fachlich_bestaetigt ? tx('Fachlich bestätigt') : tx('Noch nicht fachlich bestätigt'),
      }),
      regel: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        subtitle: tx`${fieldLookup(r, 'regeltyp')?.label ?? ''} · verlangt: ${fieldLookup(r, 'erforderliche_befugnis')?.label ?? tx('keine besondere Befugnis')}`,
      }),
      entscheider: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldLookup(r, 'entscheidungsbefugnis')?.label ?? tx('Keine Entscheidungsbefugnis hinterlegt'),
      }),
    },
  });

  const f = flow.forms.entscheidungen;
  const pickVorgang = flow.pick('vorgang');
  const pickVorgaenge = flow.pick('vorgaenge');
  const regelId = f.get('regel') as string | null | undefined;
  const entscheiderId = f.get('entscheider') as string | null | undefined;

  const regelRec: JourneyRecord | undefined = regelId ? flow.picks.regel.recordOf(regelId) : undefined;
  const entscheiderRec: JourneyRecord | undefined = entscheiderId ? flow.picks.entscheider.recordOf(entscheiderId) : undefined;
  const erforderlich = regelRec ? fieldLookup(regelRec, 'erforderliche_befugnis') : null;
  const vorhanden = entscheiderRec ? fieldLookup(entscheiderRec, 'entscheidungsbefugnis') : null;
  const befugnisOk = !erforderlich || !entscheiderRec || befugnisReicht(erforderlich.key, vorhanden?.key);

  const pruefeBefugnis = async (): Promise<string | undefined> => {
    if (!regelId || !entscheiderId) return undefined;
    const [regel, person] = await Promise.all([
      regelRec ?? flow.port.get('regelwerk', regelId),
      entscheiderRec ?? flow.port.get('beteiligte', entscheiderId),
    ]);
    if (!regel || !person) return undefined;
    const req = fieldLookup(regel, 'erforderliche_befugnis')?.key;
    const has = fieldLookup(person, 'entscheidungsbefugnis')?.key;
    return befugnisReicht(req, has) ? undefined : tx('Die entscheidende Person hat nicht die Befugnis, die die Regel verlangt.');
  };

  const freigabeKey = f.get('freigabestatus') as string | null | undefined;
  const freigabeLabel = optionsOf('entscheidungen', 'freigabestatus').find(o => o.key === freigabeKey)?.label;

  return (
    <IntentWizardShell
      title={tx('Entscheidung treffen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Entscheidung mit Regel, Beurteilung und Entscheider festhalten.'),
        needs: [tx('Vorgang und Beurteilung'), tx('Anwendbare Regel'), tx('Entscheidende Person')],
      }}
    >
      <WizardStep label={tx('Grundlage')} description={tx('Für welchen Vorgang, welche Anforderung und welche Beurteilung wird entschieden?')}>
        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{tx('Vorgang')}</h3>
            <EntitySelectStep
              {...flow.picks.vorgang.select}
              selectedId={pickVorgang.selectedId}
              onSelect={id => { pickVorgang.onSelect(id); pickVorgaenge.onSelect(id); }}
              searchPlaceholder={tx('Vorgangsnummer oder Titel …')}
            />
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{tx('Zugrunde liegende Anforderung')}</h3>
            <EntitySelectStep {...flow.picks.anforderung.select} {...flow.pick('anforderung')} searchPlaceholder={tx('Anforderung suchen …')} />
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{tx('Fachliche Beurteilung')}</h3>
            <EntitySelectStep {...flow.picks.beurteilung.select} {...flow.pick('beurteilung')} searchPlaceholder={tx('Sachverhalt suchen …')} />
          </section>
          <StepNav hideBack onNext={() => flow.validateStep(1)} nextStepLabel={tx('Regel')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Regel')} description={tx('Welche Regel gilt für diese Entscheidung?')}>
        <div className="space-y-4">
          <EntitySelectStep {...flow.picks.regel.select} {...flow.pick('regel')} searchPlaceholder={tx('Regel suchen …')} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Entscheider')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Entscheider')} description={tx('Wer entscheidet — und darf diese Person es?')}>
        <div className="space-y-4">
          <EntitySelectStep {...flow.picks.entscheider.select} {...flow.pick('entscheider')} searchPlaceholder={tx('Name suchen …')} />
          {regelRec && entscheiderRec && (
            <div
              className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${befugnisOk ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}
              role="status"
            >
              {befugnisOk ? <IconShieldCheck size={18} className="mt-0.5 shrink-0" /> : <IconAlertTriangle size={18} className="mt-0.5 shrink-0" />}
              <div className="min-w-0">
                <p className="font-medium">
                  {befugnisOk ? tx('Befugnis passt zur Regel.') : tx('Die entscheidende Person hat nicht die Befugnis, die die Regel verlangt.')}
                </p>
                <p className="text-xs opacity-80">
                  {tx`Regel verlangt: ${erforderlich?.label ?? tx('keine besondere Befugnis')} · Person hat: ${vorhanden?.label ?? tx('keine')}`}
                </p>
              </div>
            </div>
          )}
          <Bound form={f} name="befugnis_geprueft" />
          <StepNav
            onBack={() => setStep(2)}
            onNext={async () => {
              const ok = flow.validateStep(3);
              return ok ? pruefeBefugnis() : ok;
            }}
            nextStepLabel={tx('Entscheidung')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Entscheidung')} description={tx('Entscheidung, Begründung, Folgen und Freigabestatus festhalten.')}>
        <div className="space-y-4">
          <Bound form={f} name="gegenstand" />
          <Bound form={f} name="unsicherheiten" rows={3} />
          <Bound form={f} name="ki_vorschlag" rows={3} />
          <Bound form={f} name="entscheidung" rows={3} />
          <Bound form={f} name="begruendung" rows={3} />
          <Bound form={f} name="folgen" rows={3} />
          <Bound form={f} name="freigabestatus" />
          <StepNav
            onBack={() => setStep(3)}
            onNext={async () => {
              const ok = flow.validateStep(4);
              return ok ? pruefeBefugnis() : ok;
            }}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'entscheidungsdatum', label: tx('Entscheidungsdatum'), value: formatFieldValue('entscheidungen', 'entscheidungsdatum', todayIso()) },
              { key: 'vorgang-status', label: tx('Status des Vorgangs'), value: tx('Entscheidungsreif') },
              { key: 'vorgang-schritt', label: tx('Prozessschritt des Vorgangs'), value: tx('Entscheidungen treffen') },
            ]}
            whatHappensNext={tx('Die Entscheidung wird angelegt und der Vorgang auf „entscheidungsreif“ gesetzt.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          submit={flow.submit}
          forms={flow.formList}
          facts={[
            { label: tx('Entscheidungsgegenstand'), value: String(f.get('gegenstand') ?? '—') },
            { label: tx('Freigabestatus'), value: freigabeLabel ?? '—' },
          ]}
          whatHappensNext={tx('Der Vorgang ist jetzt entscheidungsreif. Als Nächstes kannst du offene Rückfragen klären oder eine weitere Anfrage aufnehmen.')}
          next={[
            { label: tx('Rückfrage vorbereiten'), href: '#/intents/rueckfrage-stellen' },
            { label: tx('Anfrage aufnehmen'), href: '#/intents/anfrage-aufnehmen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
