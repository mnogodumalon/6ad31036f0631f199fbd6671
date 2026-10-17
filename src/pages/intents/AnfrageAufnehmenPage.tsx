/**
 * Anfrage aufnehmen — 3-Schritt-Wizard mit Prüfen.
 * Steps: 1) Titel, Kunde, Anfrage im Wortlaut → 2) Zuständige Person wählen → 3) Erste Quelle erfassen → 4) Prüfen & anlegen.
 * Reads: beteiligte. Writes: vorgaenge, quellen (via useAnfrageAufnehmenFlow).
 * Composes: IntentWizardShell, Bound, EntitySelectStep, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useAnfrageAufnehmenFlow } from '@/lib/journey/flows/AnfrageAufnehmen';
import { tx } from '@/i18n';

export default function AnfrageAufnehmenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnfrageAufnehmenFlow({
    steps: {
      titel: 1, kunde: 1, kundenanfrage: 1,
      zustaendige_person: 2,
      bezeichnung: 3, quellenart: 3, fundort: 3, version: 3, verlaesslichkeit: 3,
    },
    items: {
      zustaendige_person: r => ({
        id: r.id,
        title: `${fieldText(r, 'vorname')} ${fieldText(r, 'nachname')}`.trim(),
        subtitle: fieldLookup(r, 'stelle')?.label,
      }),
    },
  });

  const vorgang = flow.forms.vorgaenge;
  const quelle = flow.forms.quellen;

  return (
    <IntentWizardShell
      title={tx('Anfrage aufnehmen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine neue Kundenanfrage als Vorgang anlegen.'),
        needs: [tx('Titel und Kunde'), tx('Wortlaut der Anfrage'), tx('Zuständige Person')],
      }}
    >
      <WizardStep label={tx('Anfrage')} description={tx('Titel, Kunde und die Anfrage im Wortlaut eingeben.')}>
        <div className="space-y-4">
          <Bound form={vorgang} name="titel" />
          <Bound form={vorgang} name="kunde" />
          <Bound form={vorgang} name="kundenanfrage" rows={5} />
          <StepNav
            onNext={() => flow.validateStep(1)}
            nextStepLabel={tx('Zuständige Person')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Zuständig')} description={tx('Wer kümmert sich um diesen Vorgang?')}>
        <EntitySelectStep
          {...flow.picks.zustaendige_person.select}
          {...flow.pick('zustaendige_person')}
          searchPlaceholder={tx('Name suchen …')}
          avatar="initials"
        />
      </WizardStep>

      <WizardStep label={tx('Erste Quelle')} description={tx('Woher stammt die Anfrage? Bezeichnung, Art und Fundort der ersten Quelle.')}>
        <div className="space-y-4">
          <Bound form={quelle} name="bezeichnung" />
          <Bound form={quelle} name="quellenart" />
          <Bound form={quelle} name="fundort" />
          <Bound form={quelle} name="version" />
          <Bound form={quelle} name="verlaesslichkeit" />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
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
              { key: 'eingangsdatum', label: tx('Eingangsdatum'), value: tx('Heute') },
              { key: 'status', label: tx('Status'), value: tx('Neu') },
            ]}
            whatHappensNext={tx('Die Vorgangsnummer vergibt das System. Danach kannst du die Anforderungen erfassen.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Anforderung erfassen'), href: '#/intents/anforderung-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Der Vorgang steht jetzt im Prozessschritt „Anfrage verstehen“.')}
        />
      )}
    </IntentWizardShell>
  );
}
