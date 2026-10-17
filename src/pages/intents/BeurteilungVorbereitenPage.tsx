/**
 * Beurteilung vorbereiten — 5-Schritt-Wizard.
 * Steps: 1) Vorgang und Anforderung wählen → 2) Beurteilende Person und Fachgebiet → 3) Sachverhalt, Bewertung,
 * Erklärung, Unsicherheiten → 4) Fachliche Bestätigung → 5) Prüfen & anlegen.
 * Reads: vorgaenge, anforderungen, beteiligte. Writes: beurteilungen (create), vorgaenge (update prozessschritt).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useBeurteilungVorbereitenFlow } from '@/lib/journey/flows/BeurteilungVorbereiten';
import { tx } from '@/i18n';

export default function BeurteilungVorbereitenPage() {
  const [step, setStep] = useState(1);
  const flow = useBeurteilungVorbereitenFlow({
    steps: {
      vorgaenge: 1, vorgang: 1, anforderung: 1,
      beurteiler: 2, fachgebiet: 2,
      sachverhalt: 3, bewertung: 3, moegliche_erklaerung: 3, unsicherheiten: 3,
      fachlich_bestaetigt: 4,
    },
    items: {
      vorgaenge: v => ({ id: v.id, title: fieldText(v, 'vorgangsnummer'), subtitle: fieldText(v, 'titel') }),
      anforderung: (a, ctx) => ({
        id: a.id,
        title: fieldText(a, 'bezeichnung'),
        subtitle: [fieldText(a, 'wert'), ctx.ref('vorgang')].filter(Boolean).join(' · '),
        status: fieldLookup(a, 'erfassungsstatus') ?? undefined,
      }),
      beurteiler: b => ({
        id: b.id,
        title: `${fieldText(b, 'vorname')} ${fieldText(b, 'nachname')}`.trim(),
        subtitle: [fieldLookup(b, 'stelle')?.label, fieldLookup(b, 'entscheidungsbefugnis')?.label].filter(Boolean).join(' · '),
      }),
    },
  });

  const beurteilung = flow.forms.beurteilungen;
  const vorgangPick = flow.pick('vorgaenge');
  const anforderungPick = flow.pick('anforderung');
  const beurteilerPick = flow.pick('beurteiler');

  const pickVorgang = (id: string) => {
    vorgangPick.onSelect(id);
    beurteilung.set('vorgang', id, flow.picks.vorgaenge.labelOf(id));
  };

  const restart = () => { flow.reset(); setStep(1); };

  return (
    <IntentWizardShell
      title={tx('Beurteilung vorbereiten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine fachliche Beurteilung zu einer Anforderung anlegen und einer Person zuordnen.'),
        needs: [tx('Vorgang und Anforderung'), tx('Beurteilende Person'), tx('Sachverhalt und Bewertung')],
      }}
    >
      <WizardStep label={tx('Vorgang')} description={tx('Wähle den Vorgang und, falls vorhanden, die Anforderung, die beurteilt wird.')}>
        <div className="space-y-6">
          <EntitySelectStep
            {...flow.picks.vorgaenge.select}
            selectedId={vorgangPick.selectedId}
            onSelect={pickVorgang}
            searchPlaceholder={tx('Vorgangsnummer suchen …')}
          />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{tx('Betroffene Anforderung')}</h3>
            <EntitySelectStep
              {...flow.picks.anforderung.select}
              {...anforderungPick}
              searchPlaceholder={tx('Bezeichnung oder Wert suchen …')}
            />
          </div>
          <StepNav hideBack onNext={() => flow.validateStep(1)} nextStepLabel={tx('Beurteilende Person')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Beurteilende Person')} description={tx('Wer beurteilt das — und aus welchem Fachgebiet?')} needs={['vorgaenge']}>
        <div className="space-y-6">
          <EntitySelectStep
            {...flow.picks.beurteiler.select}
            {...beurteilerPick}
            onSelect={id => beurteilerPick.onSelect(id)}
            avatar="initials"
            searchPlaceholder={tx('Name suchen …')}
          />
          <Bound form={beurteilung} name="fachgebiet" />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Sachverhalt')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Beurteilung')} description={tx('Halte Sachverhalt, Bewertung, mögliche Erklärung und Unsicherheiten fest.')}>
        <div className="space-y-4">
          <Bound form={beurteilung} name="sachverhalt" rows={4} />
          <Bound form={beurteilung} name="bewertung" rows={4} />
          <Bound form={beurteilung} name="moegliche_erklaerung" rows={3} />
          <Bound form={beurteilung} name="unsicherheiten" rows={3} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Bestätigung')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Bestätigung')} description={tx('Ist die Beurteilung fachlich bestätigt?')}>
        <div className="space-y-4">
          <Bound form={beurteilung} name="fachlich_bestaetigt" />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Beurteilung wird angelegt und der Vorgang wechselt zum Schritt „Beurteilungen vorbereiten“.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          facts={[
            { label: tx('Sachverhalt'), value: String(beurteilung.get('sachverhalt') ?? '') },
            { label: tx('Fachlich bestätigt'), value: beurteilung.get('fachlich_bestaetigt') ? tx('Ja') : tx('Nein') },
          ]}
          whatHappensNext={tx('Offene Fragen kannst du als Rückfrage an die zuständige Person vorbereiten.')}
          next={[
            { label: tx('Rückfrage vorbereiten'), href: '#/intents/rueckfrage-stellen' },
            { label: tx('Weitere Beurteilung'), onClick: restart },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
