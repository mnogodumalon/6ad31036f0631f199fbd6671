/**
 * Antwort erfassen — 5-Schritt-Wizard.
 * Steps: 1) Offene Rückfrage wählen → 2) Antwort und Änderung eingeben → 3) Anforderung (optional) als geklärt markieren
 *        → 4) Vorgang wählen (wieder in Klärung setzen) → 5) Prüfen & speichern.
 * Reads: rueckfragen, anforderungen, vorgaenge. Writes: rueckfragen, anforderungen, vorgaenge (updates via useAntwortErfassenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldDate } from '@/lib/journey';
import { useAntwortErfassenFlow } from '@/lib/journey/flows/AntwortErfassen';
import { tx } from '@/i18n';

export default function AntwortErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useAntwortErfassenFlow({
    steps: { rueckfragen: 1, antwort: 2, aenderung_angabe: 2, wert: 3, erfassungsstatus: 3, vorgaenge: 4 },
    items: {
      rueckfragen: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'fragetext'),
        subtitle: [ctx.ref('adressat'), ctx.ref('vorgang'), fieldDate(r, 'gestellt_am')].filter(Boolean).join(' · '),
      }),
      anforderungen: r => ({ id: r.id, title: fieldText(r, 'bezeichnung'), subtitle: fieldText(r, 'wert') }),
      vorgaenge: r => ({ id: r.id, title: fieldText(r, 'vorgangsnummer'), subtitle: fieldText(r, 'titel') }),
    },
  });

  return (
    <IntentWizardShell
      title={tx('Antwort erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine eingegangene Antwort der Rückfrage zuordnen und den Vorgang aktualisieren.'),
        needs: [tx('Die beantwortete Rückfrage'), tx('Text der Antwort'), tx('Den zugehörigen Vorgang')],
      }}
    >
      <WizardStep label={tx('Rückfrage')} description={tx('Zu welcher Rückfrage ist die Antwort eingegangen?')}>
        <EntitySelectStep
          {...flow.picks.rueckfragen.select}
          {...flow.pick('rueckfragen')}
          searchPlaceholder={tx('Fragetext suchen …')}
        />
      </WizardStep>

      <WizardStep label={tx('Antwort')} description={tx('Was wurde geantwortet und was ändert sich an den erfassten Angaben?')} needs={['rueckfragen']}>
        <div className="space-y-4">
          <Bound form={flow.forms.rueckfragen} name="antwort" rows={4} />
          <Bound form={flow.forms.rueckfragen} name="aenderung_angabe" rows={3} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Anforderung')} />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Anforderung')}
        description={tx('Optional: Anforderung wählen, aktualisieren und als vollständig markieren, wenn geklärt.')}
        needs={['rueckfragen']}
      >
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.anforderungen.select}
            {...flow.pick('anforderungen')}
            searchPlaceholder={tx('Anforderung suchen …')}
          />
          {flow.targets.anforderungen.selectedId && (
            <div className="space-y-4">
              <Bound form={flow.forms.anforderungen} name="wert" />
              <Bound form={flow.forms.anforderungen} name="erfassungsstatus" />
            </div>
          )}
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => (flow.targets.anforderungen.selectedId ? flow.validateStep(3) : true)}
            nextStepLabel={tx('Vorgang')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Vorgang')} description={tx('Welcher Vorgang geht damit wieder in Klärung?')} needs={['rueckfragen']}>
        <div className="space-y-4">
          <EntitySelectStep
            {...flow.picks.vorgaenge.select}
            {...flow.pick('vorgaenge')}
            searchPlaceholder={tx('Vorgangsnummer oder Titel …')}
          />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'rueckfrage-status', label: tx('Status der Rückfrage'), value: tx('Beantwortet') },
              { key: 'vorgang-status', label: tx('Status des Vorgangs'), value: tx('In Klärung') },
            ]}
            whatHappensNext={tx('Die Rückfrage gilt als beantwortet, das Antwortdatum ist heute und der Vorgang steht wieder in Klärung.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Entscheidung treffen'), href: '#/intents/entscheidung-treffen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Wenn alles geklärt ist, kann die Entscheidung getroffen werden.')}
        />
      )}
    </IntentWizardShell>
  );
}
